import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import {
  assertProductionRuntimeConfig,
  parseRuntimeConfig,
} from './src/config/runtimeConfig'

const supportedModes = new Set(['localhost', 'production'])
const productionKeys = [
  'VITE_API_BASE_URL',
  'VITE_USE_MOCK',
  'VITE_SHOW_MOCK_MAP_FEATURES',
  'VITE_SHOW_ADMIN_ENTRY',
  'VITE_BASEMAP_PROVIDER',
  'VITE_BASEMAP_IMAGERY_URL',
  'VITE_BASEMAP_ANNOTATION_URL',
  'VITE_BASEMAP_SHOW_LABELS',
  'VITE_AUTH_MODE',
  'VITE_AUTH_DEV_FALLBACK',
  'VITE_AUTH_REQUEST_TIMEOUT_MS',
  'VITE_HISTORICAL_GEOSERVER_ENABLED',
  'VITE_HISTORICAL_GEOSERVER_BASE_URL',
  'VITE_NEW_GEOSERVER_ENABLED',
  'VITE_NEW_GEOSERVER_BASE_URL',
  'VITE_NEW_GEOSERVER_START_YEAR',
  'VITE_GROWTH_ANALYSIS_XYZ_URL',
]

function parseEnvFile(path: string): Record<string, string> {
  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split(/\r?\n/u)
      .flatMap((line) => {
        const match = line.match(/^\s*([^#\s=]+)=(.*)$/u)
        return match ? [[match[1], match[2]]] : []
      }),
  )
}

function readLoopbackTarget(value: string | undefined): string {
  if (!value) throw new Error('LOCAL_API_TARGET is required for localhost mode')
  const target = new URL(value)
  const loopbackHosts = new Set(['127.0.0.1', 'localhost', '[::1]'])
  if (
    !['http:', 'https:'].includes(target.protocol)
    || !loopbackHosts.has(target.hostname)
    || target.username
    || target.password
    || target.pathname !== '/'
    || target.search
    || target.hash
  ) {
    throw new Error('LOCAL_API_TARGET must be a loopback HTTP(S) origin without credentials or a path')
  }
  return target.origin
}

function readMapProxyTarget(value: string | undefined, field: string): string | undefined {
  if (!value) return undefined
  const target = new URL(value)
  if (
    !['http:', 'https:'].includes(target.protocol)
    || target.username
    || target.password
    || target.pathname !== '/'
    || target.search
    || target.hash
  ) {
    throw new Error(`${field} must be an HTTP(S) origin without credentials or a path`)
  }
  return target.origin
}

export default defineConfig(({ mode }) => {
  if (!supportedModes.has(mode)) {
    throw new Error(`Unsupported Vite mode "${mode}". Use localhost or production.`)
  }

  const root = fileURLToPath(new URL('.', import.meta.url))
  const env = loadEnv(mode, root, '')
  if (mode === 'production') {
    const productionEnv = parseEnvFile(fileURLToPath(new URL('./.env.production', import.meta.url)))
    const missing = productionKeys.filter((key) => !(key in productionEnv))
    if (missing.length) throw new Error(`.env.production is missing required keys: ${missing.join(', ')}`)
    assertProductionRuntimeConfig(parseRuntimeConfig({}, productionEnv))
  } else {
    parseRuntimeConfig({}, env)
  }

  const proxy = mode === 'localhost'
    ? (() => {
        const historicalGeoServerTarget = readMapProxyTarget(
          env.LOCAL_HISTORICAL_GEOSERVER_TARGET,
          'LOCAL_HISTORICAL_GEOSERVER_TARGET',
        )
        const newGeoServerTarget = readMapProxyTarget(
          env.LOCAL_NEW_GEOSERVER_TARGET,
          'LOCAL_NEW_GEOSERVER_TARGET',
        )
        return {
        '/agro-admin': {
          target: readLoopbackTarget(env.LOCAL_API_TARGET),
          changeOrigin: true,
        },
          ...(historicalGeoServerTarget
            ? {
                '/geoserver': {
                  target: historicalGeoServerTarget,
                  changeOrigin: true,
                },
              }
            : {}),
          ...(newGeoServerTarget
            ? {
                '/map-service/new': {
                  target: newGeoServerTarget,
                  changeOrigin: true,
                  rewrite: (path: string) => path.replace(/^\/map-service\/new/u, ''),
                },
              }
            : {}),
        }
      })()
    : undefined

  return {
    base: './',
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: '127.0.0.1',
      port: 5175,
      strictPort: true,
      proxy,
    },
  }
})
