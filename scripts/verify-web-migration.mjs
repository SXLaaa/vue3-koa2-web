import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const { dashboardModules, dashboardPages } = await import('../src/config/dashboardNavigation.ts')
const { resolveDashboardGate, DASHBOARD_HOME_HASH, LOGIN_HASH } = await import(
  '../src/router/dashboardGate.ts'
)
const { dashboardApiEndpoints } = await import('../src/services/dashboardApi.ts')
const { createLoginApi } = await import('../src/services/loginApi.ts')
const { createAuthService, AUTH_SESSION_KEY } = await import('../src/services/authService.ts')
const { toCaptchaImageUrl } = await import('../src/features/login/captchaImage.ts')
const { parseRuntimeConfig, assertProductionRuntimeConfig } = await import(
  '../src/config/runtimeConfig.ts'
)

function verifyNavigationContract() {
  assert.equal(dashboardModules.length, 3, '应保留 3 个一级业务模块')
  assert.equal(dashboardPages.length, 12, '应保留 12 个大屏页面')
  assert.deepEqual(
    dashboardPages.map((item) => `${item.moduleKey}/${item.subId}`),
    [
      'farmland/cultivatedLand',
      'farmland/highStandard',
      'farmland/basicProtection',
      'farmland/greenGrain',
      'security/plantingTask',
      'security/cropDistribution',
      'security/yieldEstimate',
      'warning/growthStage',
      'warning/seedling',
      'warning/growth',
      'warning/maturity',
      'warning/weatherDisaster',
    ],
  )
}

function verifyRouteGate() {
  assert.deepEqual(resolveDashboardGate('', false), { view: 'login', hash: LOGIN_HASH })
  assert.deepEqual(resolveDashboardGate('#/security/cropDistribution', false), {
    view: 'login',
    hash: LOGIN_HASH,
  })
  assert.deepEqual(resolveDashboardGate('#/login', true), {
    view: 'dashboard',
    hash: DASHBOARD_HOME_HASH,
  })
  assert.deepEqual(resolveDashboardGate('#/security', true), {
    view: 'dashboard',
    hash: '#/security/plantingTask',
  })
  assert.deepEqual(resolveDashboardGate('#/warning/maturity', true), {
    view: 'dashboard',
    hash: '#/warning/maturity',
  })
  assert.deepEqual(resolveDashboardGate('#/admin/system/user', true), {
    view: 'dashboard',
    hash: DASHBOARD_HOME_HASH,
  })
}

function verifyApiContract() {
  const definitions = Object.values(dashboardApiEndpoints)
  assert.equal(definitions.length, 33, '应保留冻结契约中的 33 个端点')
  for (const definition of definitions) {
    assert.match(definition.path, /^\/agro-admin\//u)
    assert.doesNotMatch(definition.path, /^https?:\/\//u)
  }
}

async function verifyAuthContract() {
  const requests = []
  const fetchImpl = async (url, init) => {
    requests.push({ url, init })
    const body = url.endsWith('/captchaImage')
      ? { code: 200, msg: 'ok', img: 'ZmFrZQ==', captchaEnabled: true, uuid: 'local-uuid' }
      : { code: 200, msg: 'ok', token: 'test' }
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const api = createLoginApi({ baseUrl: '/agro-admin', fetchImpl })
  const captcha = await api.getCaptcha()
  assert.equal(captcha.uuid, 'local-uuid')

  const values = new Map()
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
  const auth = createAuthService({ mode: 'api', storage, executor: api })
  await auth.login({ username: ' local-user ', password: 'local-pass', code: '1234', uuid: 'local-uuid' })
  assert.equal(auth.isAuthenticated(), true)
  assert.equal(auth.getUsername(), 'local-user')
  assert.ok(values.has(AUTH_SESSION_KEY))
  assert.deepEqual(
    requests.map((item) => item.url),
    ['/agro-admin/captchaImage', '/agro-admin/login'],
  )
}

function verifyCaptchaImageCompatibility() {
  assert.equal(
    toCaptchaImageUrl('PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg=='),
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==',
  )
  assert.equal(toCaptchaImageUrl('R0lGODlhAQABAIAAAAUEBA=='), 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBA==')
  assert.equal(toCaptchaImageUrl('data:image/png;base64,local'), 'data:image/png;base64,local')
}

function verifyProductionConfig() {
  const config = parseRuntimeConfig({}, {
    VITE_API_BASE_URL: '/agro-admin',
    VITE_USE_MOCK: 'false',
    VITE_SHOW_MOCK_MAP_FEATURES: 'false',
    VITE_SHOW_ADMIN_ENTRY: 'false',
    VITE_BASEMAP_PROVIDER: 'none',
    VITE_AUTH_MODE: 'api',
    VITE_AUTH_DEV_FALLBACK: 'false',
    VITE_HISTORICAL_GEOSERVER_ENABLED: 'false',
    VITE_NEW_GEOSERVER_ENABLED: 'false',
  })
  assert.doesNotThrow(() => assertProductionRuntimeConfig(config))
  assert.throws(
    () => assertProductionRuntimeConfig({ ...config, useMock: true }),
    /生产环境禁止使用 mock/u,
  )
  assert.throws(
    () => assertProductionRuntimeConfig({ ...config, apiBaseUrl: 'http://example.invalid/agro-admin' }),
    /生产 API 基地址必须为 \/agro-admin/u,
  )
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (['node_modules', 'dist', '.git', 'artifacts'].includes(entry.name)) continue
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await collectFiles(absolutePath))
    else files.push(absolutePath)
  }
  return files
}

async function verifyNoForbiddenRuntimeTargets() {
  const candidates = [
    ...await collectFiles(path.join(projectRoot, 'src')),
    path.join(projectRoot, 'public', 'config.js'),
    path.join(projectRoot, '.env.production'),
    path.join(projectRoot, '.env.localhost.local'),
    path.join(projectRoot, 'vite.config.ts'),
  ]
  const forbidden = [
    /27\.223\.102\.27/iu,
    /192\.168\.71\.209/iu,
    /home\.aceimage\.cn/iu,
    /(?:^|\.)tianditu\.gov\.cn/imu,
  ]
  for (const file of candidates) {
    const content = await readFile(file, 'utf8')
    for (const pattern of forbidden) {
      assert.doesNotMatch(content, pattern, `运行时代码包含禁用目标：${path.relative(projectRoot, file)}`)
    }
  }
}

verifyNavigationContract()
verifyRouteGate()
verifyApiContract()
await verifyAuthContract()
verifyCaptchaImageCompatibility()
verifyProductionConfig()
await verifyNoForbiddenRuntimeTargets()

console.log('WEB_MIGRATION_CHECK=PASS pages=12 endpoints=33 apiBase=/agro-admin mockFallback=0 forbiddenTargets=0')
