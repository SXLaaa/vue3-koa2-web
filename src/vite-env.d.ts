/// <reference types="vite/client" />

interface MainGrainRuntimeConfig {
  apiBaseUrl?: string
  useMock?: boolean
  showMockMapFeatures?: boolean
  showAdminEntry?: boolean
  basemapProvider?: 'none' | 'custom'
  basemapImageryUrl?: string
  basemapAnnotationUrl?: string
  basemapShowLabels?: boolean
  authMode?: 'mock' | 'api'
  authDevFallbackEnabled?: boolean
  authRequestTimeoutMs?: number
  historicalGeoServerEnabled?: boolean
  historicalGeoServerBaseUrl?: string
  newGeoServerEnabled?: boolean
  newGeoServerBaseUrl?: string
  newGeoServerStartYear?: number
  growthAnalysisXyzUrl?: string
  historicalLayerOverrides?: Record<string, string>
  newLayerOverrides?: Record<string, string>
}

interface Window {
  __MAIN_GRAIN_CONFIG__?: MainGrainRuntimeConfig
}
