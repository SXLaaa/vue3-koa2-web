import {
  findGeoServerCatalogEntry,
  resolveCatalogServer,
  type GeoServerCatalogEntry,
} from '../config/mapLayerServices.ts'
import type { ModuleKey } from '../types/dashboard.ts'

export interface GeoServerResolverConfig {
  historicalGeoServerEnabled: boolean
  historicalGeoServerBaseUrl: string
  newGeoServerEnabled: boolean
  newGeoServerBaseUrl: string
  newGeoServerStartYear: number
  historicalLayerOverrides: Record<string, string>
  newLayerOverrides: Record<string, string>
}

export interface GeoServerLayerContext {
  moduleKey?: ModuleKey
  subId: string
  pageYear: number
  crop?: string
  timelineText?: string
  apiLayerName?: string
}

export interface GeoServerLayerDecision {
  source: 'historical' | 'new'
  origin: 'api' | 'override' | 'catalog'
  layerName: string
  wmsUrl: string
  wmtsUrl: string
  effectiveYear: number
  entry?: GeoServerCatalogEntry
}

interface NormalizedCrop {
  overrideValue: 'wheat' | 'corn'
  layerValue: 'xm' | 'ym'
}

function getEffectiveYear(context: GeoServerLayerContext): number | null {
  const timelineYear = context.timelineText?.match(/(?:^|\D)((?:19|20)\d{2})(?:\D|$)/)?.[1]
  const year = Number(timelineYear ?? context.pageYear)
  return Number.isInteger(year) ? year : null
}

function normalizeCrop(crop?: string): NormalizedCrop | undefined {
  const value = crop?.trim().toLowerCase()
  if (value === 'wheat' || value === 'xm' || value === '小麦') return { overrideValue: 'wheat', layerValue: 'xm' }
  if (value === 'corn' || value === 'ym' || value === '玉米') return { overrideValue: 'corn', layerValue: 'ym' }
  return undefined
}

function getPeriod(timelineText?: string): string | undefined {
  const match = timelineText?.match(/(?:\d{4}[-/.])?(\d{1,2})[-/.](\d{1,2})/)
  return match ? `${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}` : undefined
}

function getOverride(overrides: Record<string, string>, context: GeoServerLayerContext, year: number, crop?: NormalizedCrop): string | undefined {
  const period = getPeriod(context.timelineText)
  const keys = [
    period && crop ? `${context.subId}@${year}@${crop.overrideValue}@${period}` : undefined,
    crop ? `${context.subId}@${year}@${crop.overrideValue}` : undefined,
    `${context.subId}@${year}`,
  ]

  for (const key of keys) {
    if (key && Object.hasOwn(overrides, key)) return overrides[key]
  }

  return undefined
}

export function buildWorkspaceWmsUrl(baseUrl: string, layerName: string): string {
  const qualifiedName = layerName.match(/^([A-Za-z0-9_.-]+):([A-Za-z0-9_.-]+)$/)
  if (!baseUrl.trim() || !qualifiedName) return ''
  const workspace = qualifiedName[1]
  return `${baseUrl.replace(/\/+$/, '')}/${workspace}/wms`
}

export function buildGeoWebCacheWmtsUrl(baseUrl: string): string {
  return baseUrl.trim() ? `${baseUrl.replace(/\/+$/, '')}/gwc/service/wmts` : ''
}

export function resolveGeoServerLayer(
  context: GeoServerLayerContext,
  config: GeoServerResolverConfig,
): GeoServerLayerDecision | null {
  const effectiveYear = getEffectiveYear(context)
  if (effectiveYear === null || !Number.isInteger(config.newGeoServerStartYear)) return null

  const entry = findGeoServerCatalogEntry({
    moduleKey: context.moduleKey,
    subId: context.subId,
    year: effectiveYear,
    crop: context.crop,
    timelineText: context.timelineText,
  })
  const catalogSource = resolveCatalogServer(entry, effectiveYear, config.newGeoServerStartYear)
  const useApiLayer = Boolean(context.apiLayerName)
    && (effectiveYear < config.newGeoServerStartYear || entry?.server !== 'new')
  const source = useApiLayer ? 'historical' : catalogSource
  const enabled = source === 'historical' ? config.historicalGeoServerEnabled : config.newGeoServerEnabled
  const baseUrl = source === 'historical' ? config.historicalGeoServerBaseUrl : config.newGeoServerBaseUrl
  const overrides = source === 'historical' ? config.historicalLayerOverrides : config.newLayerOverrides
  if (!enabled || !baseUrl.trim()) return null

  // 2026及以后必须使用新服务自己的覆盖或目录，不能让历史接口返回的图层名抢占。
  if (useApiLayer && context.apiLayerName) {
    const wmsUrl = buildWorkspaceWmsUrl(baseUrl, context.apiLayerName)
    const wmtsUrl = buildGeoWebCacheWmtsUrl(baseUrl)
    if (wmsUrl && wmtsUrl) {
      return { source, origin: 'api', layerName: context.apiLayerName, wmsUrl, wmtsUrl, effectiveYear }
    }
  }

  const crop = normalizeCrop(context.crop)
  const override = getOverride(overrides, context, effectiveYear, crop)
  if (override !== undefined) {
    if (!override) return null
    const wmsUrl = buildWorkspaceWmsUrl(baseUrl, override)
    const wmtsUrl = buildGeoWebCacheWmtsUrl(baseUrl)
    return wmsUrl && wmtsUrl
      ? { source, origin: 'override', layerName: override, wmsUrl, wmtsUrl, effectiveYear }
      : null
  }

  if (!entry) return null

  const wmsUrl = buildWorkspaceWmsUrl(baseUrl, entry.layerName)
  const wmtsUrl = buildGeoWebCacheWmtsUrl(baseUrl)
  return wmsUrl && wmtsUrl
    ? { source, origin: 'catalog', layerName: entry.layerName, wmsUrl, wmtsUrl, effectiveYear, entry }
    : null
}
