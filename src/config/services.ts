import { parseRuntimeConfig, type RuntimeConfig } from './runtimeConfig'

export type { RuntimeConfig } from './runtimeConfig'

export function getRuntimeConfig(): RuntimeConfig {
  const runtime = window.__MAIN_GRAIN_CONFIG__ ?? {}
  return parseRuntimeConfig(runtime, import.meta.env)
}

export const geoserverConfirmation = {
  documentedContainerName: 'geoserver',
  documentedTomcatHome: '/usr/local/tomcat',
  serviceUrl: '',
}
