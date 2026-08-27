export interface RuntimeConfig {
  apiBaseUrl: string
  useMock: boolean
  showMockMapFeatures: boolean
  showAdminEntry: boolean
  basemapProvider: 'none' | 'custom'
  basemapImageryUrl: string
  basemapAnnotationUrl: string
  basemapShowLabels: boolean
  authMode: 'mock' | 'api'
  authDevFallbackEnabled: boolean
  authRequestTimeoutMs: number
  historicalGeoServerEnabled: boolean
  historicalGeoServerBaseUrl: string
  newGeoServerEnabled: boolean
  newGeoServerBaseUrl: string
  newGeoServerStartYear: number
  growthAnalysisXyzUrl: string
  historicalLayerOverrides: Record<string, string>
  newLayerOverrides: Record<string, string>
}

type RuntimeOverrides = Partial<RuntimeConfig>
type Environment = Record<string, string | undefined>

const booleanValues = new Map([
  ['true', true],
  ['1', true],
  ['yes', true],
  ['on', true],
  ['false', false],
  ['0', false],
  ['no', false],
  ['off', false],
])

function parseBoolean(value: unknown, fallback: boolean, field: string): boolean {
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') throw new Error(`${field} must be a boolean`)

  const parsed = booleanValues.get(value.trim().toLowerCase())
  if (parsed === undefined) throw new Error(`${field} must be a boolean`)
  return parsed
}

function parseStartYear(value: unknown): number {
  const raw = value === undefined || value === null || value === '' ? '2026' : String(value).trim()
  if (!/^\d+$/.test(raw)) {
    throw new Error('VITE_NEW_GEOSERVER_START_YEAR must be an integer between 2000 and 2100')
  }

  const year = Number(raw)
  if (year < 2000 || year > 2100) {
    throw new Error('VITE_NEW_GEOSERVER_START_YEAR must be an integer between 2000 and 2100')
  }
  return year
}

function parseAuthRequestTimeout(value: unknown): number {
  const raw = value === undefined || value === null || value === '' ? '10000' : String(value).trim()
  if (!/^\d+$/u.test(raw)) {
    throw new Error('VITE_AUTH_REQUEST_TIMEOUT_MS must be an integer between 100 and 60000')
  }

  const timeoutMs = Number(raw)
  if (timeoutMs < 100 || timeoutMs > 60_000) {
    throw new Error('VITE_AUTH_REQUEST_TIMEOUT_MS must be an integer between 100 and 60000')
  }
  return timeoutMs
}

function parseAuthMode(value: unknown): 'mock' | 'api' {
  if (value === undefined || value === null || value === '') return 'api'
  if (value === 'mock' || value === 'api') return value
  throw new Error('VITE_AUTH_MODE must be mock or api')
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function readServiceUrl(
  value: unknown,
  fallback: string,
  field: string,
  allowEmpty = true,
): string {
  const serviceUrl = readString(value, fallback)
  if (!serviceUrl) {
    if (allowEmpty) return ''
    throw new Error(`${field} must not be empty`)
  }
  if (/\s|[\u0000-\u001f\u007f]/u.test(serviceUrl) || serviceUrl.includes('\\')) {
    throw new Error(`${field} must be a safe relative or HTTP(S) URL`)
  }
  if (serviceUrl.startsWith('/')) {
    if (serviceUrl.startsWith('//')) throw new Error(`${field} must not be protocol-relative`)
    return serviceUrl
  }

  let parsed: URL
  try {
    parsed = new URL(serviceUrl)
  } catch {
    throw new Error(`${field} must be a safe relative or HTTP(S) URL`)
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error(`${field} must be an HTTP(S) URL without embedded credentials`)
  }
  return serviceUrl
}

function parseOverrides(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  return Object.fromEntries(
    Object.entries(value).filter(
      ([key, layer]) => typeof key === 'string' && typeof layer === 'string',
    ),
  )
}

export function parseRuntimeConfig(runtime: RuntimeOverrides = {}, env: Environment = {}): RuntimeConfig {
  return {
    apiBaseUrl: readServiceUrl(
      runtime.apiBaseUrl,
      readString(env.VITE_API_BASE_URL, '/agro-admin'),
      'VITE_API_BASE_URL',
      false,
    ),
    useMock: parseBoolean(runtime.useMock ?? env.VITE_USE_MOCK, false, 'VITE_USE_MOCK'),
    showMockMapFeatures: parseBoolean(
      runtime.showMockMapFeatures ?? env.VITE_SHOW_MOCK_MAP_FEATURES,
      false,
      'VITE_SHOW_MOCK_MAP_FEATURES',
    ),
    showAdminEntry: parseBoolean(
      runtime.showAdminEntry ?? env.VITE_SHOW_ADMIN_ENTRY,
      false,
      'VITE_SHOW_ADMIN_ENTRY',
    ),
    basemapProvider:
      readString(runtime.basemapProvider, env.VITE_BASEMAP_PROVIDER) === 'custom'
        ? 'custom'
        : 'none',
    basemapImageryUrl: readServiceUrl(
      runtime.basemapImageryUrl,
      readString(env.VITE_BASEMAP_IMAGERY_URL),
      'VITE_BASEMAP_IMAGERY_URL',
    ),
    basemapAnnotationUrl: readServiceUrl(
      runtime.basemapAnnotationUrl,
      readString(env.VITE_BASEMAP_ANNOTATION_URL),
      'VITE_BASEMAP_ANNOTATION_URL',
    ),
    basemapShowLabels: parseBoolean(
      runtime.basemapShowLabels ?? env.VITE_BASEMAP_SHOW_LABELS,
      false,
      'VITE_BASEMAP_SHOW_LABELS',
    ),
    authMode: parseAuthMode(runtime.authMode ?? env.VITE_AUTH_MODE),
    authDevFallbackEnabled: parseBoolean(
      env.VITE_AUTH_DEV_FALLBACK ?? runtime.authDevFallbackEnabled,
      false,
      'VITE_AUTH_DEV_FALLBACK',
    ),
    authRequestTimeoutMs: parseAuthRequestTimeout(
      runtime.authRequestTimeoutMs ?? env.VITE_AUTH_REQUEST_TIMEOUT_MS,
    ),
    historicalGeoServerEnabled: parseBoolean(
      runtime.historicalGeoServerEnabled ?? env.VITE_HISTORICAL_GEOSERVER_ENABLED,
      false,
      'VITE_HISTORICAL_GEOSERVER_ENABLED',
    ),
    historicalGeoServerBaseUrl: readServiceUrl(
      runtime.historicalGeoServerBaseUrl,
      readString(env.VITE_HISTORICAL_GEOSERVER_BASE_URL),
      'VITE_HISTORICAL_GEOSERVER_BASE_URL',
    ),
    newGeoServerEnabled: parseBoolean(
      runtime.newGeoServerEnabled ?? env.VITE_NEW_GEOSERVER_ENABLED,
      false,
      'VITE_NEW_GEOSERVER_ENABLED',
    ),
    newGeoServerBaseUrl: readServiceUrl(
      runtime.newGeoServerBaseUrl,
      readString(env.VITE_NEW_GEOSERVER_BASE_URL),
      'VITE_NEW_GEOSERVER_BASE_URL',
    ),
    newGeoServerStartYear: parseStartYear(
      runtime.newGeoServerStartYear ?? env.VITE_NEW_GEOSERVER_START_YEAR,
    ),
    growthAnalysisXyzUrl: readServiceUrl(
      runtime.growthAnalysisXyzUrl,
      readString(env.VITE_GROWTH_ANALYSIS_XYZ_URL),
      'VITE_GROWTH_ANALYSIS_XYZ_URL',
    ),
    historicalLayerOverrides: parseOverrides(runtime.historicalLayerOverrides),
    newLayerOverrides: parseOverrides(runtime.newLayerOverrides),
  }
}

// 生产构建必须保持 API-first，并禁止任何会在浏览器中自动启用的 mock 或外部地图兜底。
export function assertProductionRuntimeConfig(config: RuntimeConfig): void {
  if (config.apiBaseUrl !== '/agro-admin') {
    throw new Error('生产 API 基地址必须为 /agro-admin')
  }
  if (config.useMock) throw new Error('生产环境禁止使用 mock')
  if (config.showMockMapFeatures) throw new Error('生产环境禁止显示模拟地图要素')
  if (config.showAdminEntry) throw new Error('生产环境必须隐藏后台入口')
  if (config.authMode !== 'api') throw new Error('生产环境必须使用 API 认证')
  if (config.authDevFallbackEnabled) throw new Error('生产环境禁止认证模拟兜底')
  if (config.basemapProvider !== 'none') throw new Error('生产环境默认不得请求外部底图')
  if (config.historicalGeoServerEnabled || config.newGeoServerEnabled) {
    throw new Error('生产环境默认不得启用 GeoServer 目录兜底')
  }
}
