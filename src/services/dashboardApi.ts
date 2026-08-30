import { adaptDashboardScreen, inferDashboardContext } from './dashboardAdapters.ts'
import { parseRuntimeConfig } from '../config/runtimeConfig.ts'
import {
  createPlantingTaskFallbackBag,
  plantingTaskFallbackEndpoints,
} from '../mock/plantingTaskApi.ts'
import { resolveGreenGrainRequestResponse } from '../mock/greenGrainApi.ts'
import { resolveGrowthStageRequestResponse } from '../mock/growthStageApi.ts'
import { resolveSeedlingRequestResponse } from '../mock/seedlingApi.ts'
import {
  MAP_VECTOR_METADATA_ENDPOINT,
  getMapLayerModule,
  mapLayerModules,
  resolveCatalogMapServiceFallback,
  resolveDirectMapService,
  resolveMapColumnKey,
  resolveMapTimeline,
  shouldRequestMapMetadata,
} from '../config/mapLayerServices.ts'
import type { AjaxResult, ModuleKey, ScreenPayload } from '../types/dashboard.ts'
import type {
  DashboardEndpointDefinition,
  DashboardEndpointKey,
  DashboardEnvelope,
  DashboardRequestContext,
  DashboardRequestOptions,
  DashboardRequestSpec,
  DashboardResponseBag,
  DashboardResponseValue,
} from '../types/dashboardApi.ts'

export const dashboardApiEndpoints: Record<DashboardEndpointKey, DashboardEndpointDefinition> = {
  queryQingDaoTotalArea: { method: 'POST', path: '/agro-admin/screen/queryQingDaoTotalArea', envelope: 'data' },
  queryQingDaoGroupByYear: { method: 'POST', path: '/agro-admin/screen/queryQingDaoGroupByYear', envelope: 'data' },
  queryDemonstrationSubjectDetail: { method: 'GET', path: '/agro-admin/demonstrationSubject/queryDemonstrationSubjectDetail', envelope: 'data' },
  queryQingDaoGroupByArea: { method: 'POST', path: '/agro-admin/screen/queryQingDaoGroupByArea', envelope: 'data' },
  queryProtectionMonitoringTotal: { method: 'POST', path: '/agro-admin/screen/queryProtectionMonitoringTotal', envelope: 'data' },
  queryProtectionMonitoringByArea: { method: 'POST', path: '/agro-admin/screen/queryProtectionMonitoringByArea', envelope: 'data' },
  getVectorTableWms: { method: 'POST', path: MAP_VECTOR_METADATA_ENDPOINT, envelope: 'message' },
  getTimeLine: { method: 'POST', path: '/agro-admin/screen/getTimeLine', envelope: 'data' },
  queryGreenGrainIncreaseStatistics: { method: 'POST', path: '/agro-admin/screen/queryGreenGrainIncreaseStatistics', envelope: 'data' },
  queryGreenGrainIncreaseList: { method: 'POST', path: '/agro-admin/screen/queryGreenGrainIncreaseList', envelope: 'data' },
  queryGreenGrainIncreaseStatisticsByArea: { method: 'POST', path: '/agro-admin/screen/queryGreenGrainIncreaseStatisticsByArea', envelope: 'data' },
  queryReportList: { method: 'POST', path: '/agro-admin/screen/queryReportList', envelope: 'page' },
  queryPlantingTaskStatistics: { method: 'POST', path: '/agro-admin/screen/queryPlantingTaskStatistics', envelope: 'data' },
  queryPlantingTaskByArea: { method: 'POST', path: '/agro-admin/screen/queryPlantingTaskByArea', envelope: 'data' },
  statisticsPlantingTaskByArea: { method: 'POST', path: '/agro-admin/screen/statisticsPlantingTaskByArea', envelope: 'data' },
  queryProtectionMonitoringByYear: { method: 'POST', path: '/agro-admin/screen/queryProtectionMonitoringByYear', envelope: 'data' },
  statisticsYield: { method: 'POST', path: '/agro-admin/screen/statisticsYield', envelope: 'data' },
  queryYieldTotalByYear: { method: 'POST', path: '/agro-admin/screen/queryYieldTotalByYear', envelope: 'data' },
  queryYieldTotalByArea: { method: 'POST', path: '/agro-admin/screen/queryYieldTotalByArea', envelope: 'data' },
  getReproductiveTimeLine: { method: 'POST', path: '/agro-admin/screen/getReproductiveTimeLine', envelope: 'data' },
  queryReproductiveAnalysis: { method: 'POST', path: '/agro-admin/screen/queryReproductiveAnalysis', envelope: 'data' },
  queryGrowthBarChart: { method: 'POST', path: '/agro-admin/screen/queryGrowthBarChart', envelope: 'data' },
  queryGrowthAnalysisByYear: { method: 'POST', path: '/agro-admin/screen/queryGrowthAnalysisByYear', envelope: 'data' },
  getMaturityStageByDate: { method: 'POST', path: '/agro-admin/screen/getMaturityStageByDate', envelope: 'data' },
  queryMaturityStageByYear: { method: 'POST', path: '/agro-admin/screen/queryMaturityStageByYear', envelope: 'data' },
  queryReproductivePeriodByDate: { method: 'POST', path: '/agro-admin/screen/queryReproductivePeriodByDate', envelope: 'data' },
  queryBestHarvestTime: { method: 'POST', path: '/agro-admin/screen/queryBestHarvestTime', envelope: 'data' },
  queryDisasterStatistics: { method: 'POST', path: '/agro-admin/screen/queryDisasterStatistics', envelope: 'data' },
  queryCropType: { method: 'POST', path: '/agro-admin/screen/queryCropType', envelope: 'data' },
  queryWeather: { method: 'POST', path: '/agro-admin/screen/queryWeather', envelope: 'data' },
  querySeedlingConditionAnalysis: { method: 'POST', path: '/agro-admin/screen/querySeedlingConditionAnalysis', envelope: 'data' },
  queryByKeyword: { method: 'POST', path: '/agro-admin/screen/queryByKeyword', envelope: 'data' },
  queryPestWarningByDate: { method: 'POST', path: '/agro-admin/screen/queryPestWarningByDate', envelope: 'data' },
}

const supportedPages = new Set(mapLayerModules.map((item) => `${item.moduleKey}/${item.subId}`))

const DASHBOARD_REQUEST_TIMEOUT_MS = 10_000

function pageKey(context: DashboardRequestContext): string {
  return `${context.moduleKey}/${context.subId}`
}

function mapColumnKey(context: DashboardRequestContext): string {
  const config = getMapLayerModule(context.moduleKey, context.subId)
  const columnKey = resolveMapColumnKey(context)
  if (!config?.apiEnabled || !columnKey) throw new Error(`getVectorTableWms: unsupported dashboard page ${pageKey(context)}`)
  return columnKey
}

function request(endpoint: DashboardEndpointKey, body: Record<string, unknown> = {}): DashboardRequestSpec {
  return { endpoint, body }
}

function yearMonth(context: DashboardRequestContext): string {
  return context.date?.slice(0, 7) ?? context.yearMonth ?? ''
}

function yearFromContext(context: DashboardRequestContext): number | undefined {
  const fromDate = context.date?.match(/^\d{4}/u)?.[0]
  return context.year ?? (fromDate ? Number(fromDate) : undefined)
}

function normalizeCropName(crop: string | undefined): string | undefined {
  const normalized = crop?.trim()
  if (!normalized) return undefined
  const alias = normalized.toLowerCase()
  if (alias === 'wheat' || alias === 'xm' || normalized === '小麦') return '小麦'
  if (alias === 'corn' || alias === 'ym' || normalized === '玉米') return '玉米'
  return normalized
}

function normalizeDashboardContext(context: DashboardRequestContext): DashboardRequestContext {
  return { ...context, crop: normalizeCropName(context.crop) }
}

function cropTypeCode(crop: string | undefined): number {
  return normalizeCropName(crop) === '玉米' ? 1 : 0
}

function appendMapRequest(requests: DashboardRequestSpec[], context: DashboardRequestContext, columnKey: string): void {
  const typeName = normalizeCropName(context.crop)
  if (context.moduleKey === 'warning') {
    if (!context.date) throw new Error(`getVectorTableWms: date is required for ${pageKey(context)}`)
    if (!typeName) throw new Error(`getVectorTableWms: crop is required for ${pageKey(context)}`)
    requests.push(request('getVectorTableWms', { columnKey, year: context.year, yearDay: context.date, typeName }))
    return
  }
  if (context.year === undefined) throw new Error(`getVectorTableWms: year is required for ${pageKey(context)}`)
  requests.push(request('getVectorTableWms', {
    columnKey,
    year: context.year,
    halfYear: context.halfYear ?? null,
    ...(typeName ? { typeName } : {}),
  }))
}

export function buildDashboardPageRequests(context: DashboardRequestContext, options: DashboardRequestOptions = {}): DashboardRequestSpec[] {
  const key = pageKey(context)
  if (!supportedPages.has(key)) throw new Error(`unsupported dashboard page: ${key}`)

  const areaName = context.district ?? '青岛市'
  const parentAreaName = context.parentDistrict ?? ''
  const typeName = normalizeCropName(context.crop) ?? ''
  const requests: DashboardRequestSpec[] = []

  if (key === 'farmland/cultivatedLand') {
    const columnKey = mapColumnKey(context)
    requests.push(
      request('getTimeLine', { columnKey }),
      request('queryQingDaoTotalArea', { year: context.year, areaName, columnKey, parentAreaName }),
      request('queryQingDaoGroupByArea', { year: context.year, columnKey, parentAreaName }),
      request('queryQingDaoGroupByYear', { areaName, columnKey }),
      request('queryReportList', { pageNum: 1, pageSize: 100, reportType: 1, year: context.year, halfYear: context.halfYear }),
    )
    if (options.includeMapMetadata) appendMapRequest(requests, context, columnKey)
  }

  if (key === 'farmland/highStandard') {
    const columnKey = mapColumnKey(context)
    requests.push(
      request('getTimeLine', { columnKey }),
      request('queryQingDaoTotalArea', { year: context.year, areaName, columnKey }),
      request('queryQingDaoGroupByArea', { year: context.year, columnKey }),
    )
    if (options.includeMapMetadata) appendMapRequest(requests, context, columnKey)
  }

  if (key === 'farmland/basicProtection') {
    const columnKey = mapColumnKey(context)
    requests.push(
      request('getTimeLine', { columnKey }),
      request('queryProtectionMonitoringTotal', { columnKey, halfYear: context.halfYear, year: context.year, lastHalfYear: context.lastHalfYear, areaName }),
      request('queryProtectionMonitoringByArea', { columnKey, halfYear: context.halfYear, year: context.year }),
    )
    if (options.includeMapMetadata) appendMapRequest(requests, context, columnKey)
  }

  if (key === 'farmland/greenGrain') {
    requests.push(
      request('queryGreenGrainIncreaseStatistics'),
      request('queryGreenGrainIncreaseList', { subjectTypeList: context.subjectTypeList ?? [1, 2, 3], subjectName: context.subjectName ?? '' }),
      request('queryGreenGrainIncreaseList', { subjectType: 1, subjectName: context.subjectName ?? '' }),
      request('queryGreenGrainIncreaseStatisticsByArea', { subjectType: 2 }),
      request('queryGreenGrainIncreaseStatisticsByArea', { subjectType: 3 }),
    )
  }

  if (key === 'security/plantingTask') {
    const columnKey = mapColumnKey(context)
    const plantingAreaName = areaName === '青岛市' ? '' : areaName
    requests.push(
      request('getTimeLine', { columnKey }),
      request('queryPlantingTaskStatistics', { year: context.year, areaName: plantingAreaName }),
      request('queryPlantingTaskByArea', { year: context.year }),
      request('statisticsPlantingTaskByArea', { year: context.year }),
    )
    if (options.includeMapMetadata) appendMapRequest(requests, context, columnKey)
  }

  if (key === 'security/cropDistribution') {
    const columnKey = mapColumnKey(context)
    requests.push(
      request('getTimeLine', { cropType: cropTypeCode(typeName), columnKey }),
      request('queryProtectionMonitoringTotal', { areaName, year: context.year, lastYear: context.halfYear, typeName, columnKey, parentAreaName, unit: 2 }),
      request('queryProtectionMonitoringByArea', { columnKey, year: context.year, typeName, unit: 2, parentAreaName }),
      request('queryProtectionMonitoringByYear', { columnKey, typeName, areaName, unit: 2 }),
      request('queryReportList', { columnKey, pageNum: 1, pageSize: 10, reportType: 3, year: context.year, halfYear: context.halfYear, typeName }),
    )
    if (options.includeMapMetadata) appendMapRequest(requests, context, columnKey)
  }

  if (key === 'security/yieldEstimate') {
    const columnKey = mapColumnKey(context)
    requests.push(
      request('getTimeLine', { cropType: cropTypeCode(typeName), columnKey }),
      request('statisticsYield', { columnKey, year: context.year, lastYear: context.halfYear, typeName, areaName, parentAreaName }),
      request('queryYieldTotalByArea', { columnKey, year: context.year, typeName, parentAreaName }),
      request('queryYieldTotalByYear', { columnKey, typeName, areaName }),
      request('queryReportList', { columnKey, pageNum: 1, pageSize: 10, reportType: 2, year: context.year, halfYear: context.halfYear, typeName }),
    )
    if (options.includeMapMetadata) appendMapRequest(requests, context, columnKey)
  }

  if (key === 'warning/growthStage') {
    const columnKey = mapColumnKey(context)
    requests.push(
      request('queryCropType', { columnKey }),
      request('getReproductiveTimeLine', { columnKey, year: context.year, typeName }),
      request('queryReproductiveAnalysis', { columnKey, year: context.year, yearDay: context.date, typeName, areaName }),
    )
    if (options.includeMapMetadata) appendMapRequest(requests, context, columnKey)
  }

  if (key === 'warning/seedling') {
    const columnKey = mapColumnKey(context)
    const seedlingAreaName = areaName === '青岛市' ? '' : areaName
    requests.push(
      request('queryCropType', { columnKey }),
      request('getReproductiveTimeLine', { columnKey, year: context.year, typeName }),
      request('queryReproductivePeriodByDate', { typeName, year: context.year, yearDay: context.date }),
      request('querySeedlingConditionAnalysis', { year: context.year, yearDay: context.date, columnKey, typeName, areaName: seedlingAreaName }),
      request('queryReportList', { pageNum: 1, pageSize: 100, reportType: 4, year: context.year, halfYear: context.halfYear, typeName }),
    )
    if (options.includeMapMetadata) appendMapRequest(requests, context, columnKey)
  }

  if (key === 'warning/growth') {
    const columnKey = mapColumnKey(context)
    requests.push(
      request('queryCropType', { columnKey }),
      request('getReproductiveTimeLine', { columnKey, yearMonth: yearMonth(context), typeName }),
      request('queryReproductivePeriodByDate', { typeName, year: context.year, yearDay: context.date }),
      request('queryGrowthBarChart', { columnKey, typeName, year: context.year, yearDay: context.date, areaName }),
      request('queryGrowthAnalysisByYear', { columnKey, typeName, year: context.year, areaName }),
    )
    if (options.includeMapMetadata) appendMapRequest(requests, context, columnKey)
  }

  if (key === 'warning/maturity') {
    const columnKey = mapColumnKey(context)
    requests.push(
      request('queryCropType', { columnKey }),
      request('getReproductiveTimeLine', { columnKey, yearMonth: yearMonth(context), typeName }),
      request('getMaturityStageByDate', { year: context.year, yearDay: context.date, areaName, typeName }),
      request('queryBestHarvestTime', { typeName, year: yearFromContext(context) }),
      request('queryMaturityStageByYear', { year: yearFromContext(context), areaName, typeName }),
    )
    if (options.includeMapMetadata) appendMapRequest(requests, context, columnKey)
  }

  if (key === 'warning/weatherDisaster') {
    const pestMode = typeName === '病虫害'
    const columnKey = mapColumnKey(context)
    const defaultColumnKey = mapColumnKey({ ...context, crop: undefined })
    requests.push(
      request('queryWeather', { areaName }),
      request('queryCropType', { columnKey: defaultColumnKey }),
      request('getReproductiveTimeLine', pestMode
        ? { columnKey, year: context.year, typeName }
        : { columnKey, yearMonth: yearMonth(context), typeName }),
    )
    if (pestMode) {
      requests.push(
        request('queryPestWarningByDate', { year: context.year, yearDay: context.date, typeName, areaName }),
        request('queryReportList', { pageNum: 1, pageSize: 100, reportType: 5, year: context.year, halfYear: context.halfYear, typeName }),
      )
    } else {
      requests.push(request('queryDisasterStatistics', { areaName, typeName, year: context.year, yearDay: context.date }))
    }
    if (options.includeMapMetadata) appendMapRequest(requests, context, columnKey)
  }

  return requests
}

export function buildDashboardAuxiliaryRequest(
  endpoint: 'queryByKeyword' | 'queryDemonstrationSubjectDetail',
  values: { keyWord?: string; subjectTypeList?: number[]; subjectId?: number | string },
): DashboardRequestSpec {
  if (endpoint === 'queryDemonstrationSubjectDetail') {
    if (values.subjectId === undefined || values.subjectId === null || values.subjectId === '') {
      throw new Error('queryDemonstrationSubjectDetail: subjectId is required')
    }
    return { endpoint, params: { subjectId: values.subjectId } }
  }
  return request(endpoint, { keyWord: values.keyWord ?? '', subjectTypeList: values.subjectTypeList ?? [1, 2, 3] })
}

export function assertDashboardEnvelope(endpoint: DashboardEndpointKey, value: unknown): asserts value is DashboardEnvelope {
  if (!value || typeof value !== 'object') throw new Error(`${endpoint}: invalid response envelope`)
  const envelope = value as Partial<DashboardEnvelope>
  if (typeof envelope.code !== 'number') throw new Error(`${endpoint}: invalid response code`)
  if (envelope.code !== 200) throw new Error(`${endpoint}: ${String(envelope.msg || `business code ${envelope.code}`)}`)
  const expected = dashboardApiEndpoints[endpoint].envelope
  if (expected === 'data' && !('data' in envelope)) throw new Error(`${endpoint}: missing data`)
  if (expected === 'page' && (!('rows' in envelope) || !Array.isArray(envelope.rows))) throw new Error(`${endpoint}: missing rows`)
  if (expected === 'page' && (!('total' in envelope) || typeof envelope.total !== 'number')) throw new Error(`${endpoint}: missing total`)
  if (expected === 'message' && typeof envelope.msg !== 'string') throw new Error(`${endpoint}: missing msg`)
  if (expected === 'data' && 'data' in envelope && envelope.data !== null) {
    const arrayEndpoints = new Set<DashboardEndpointKey>([
      'getTimeLine',
      'queryGreenGrainIncreaseStatistics',
      'queryGreenGrainIncreaseList',
      'queryGreenGrainIncreaseStatisticsByArea',
      'queryPlantingTaskByArea',
      'queryYieldTotalByYear',
      'queryYieldTotalByArea',
      'queryMaturityStageByYear',
      'queryCropType',
      'querySeedlingConditionAnalysis',
      'queryByKeyword',
    ])
    const isArray = Array.isArray(envelope.data)
    if (arrayEndpoints.has(endpoint) && !isArray) throw new Error(`${endpoint}: data must be an array`)
    if (!arrayEndpoints.has(endpoint) && (isArray || typeof envelope.data !== 'object')) {
      throw new Error(`${endpoint}: data must be an object`)
    }
  }
}

function buildUrl(apiBaseUrl: string, path: string, params?: Record<string, unknown>): string {
  const base = apiBaseUrl.replace(/\/$/u, '')
  const normalizedPath = base.endsWith('/agro-admin') && path.startsWith('/agro-admin/')
    ? path.slice('/agro-admin'.length)
    : path
  const url = `${base}${normalizedPath}`
  const entries = Object.entries(params ?? {}).filter(([, value]) => value !== undefined && value !== null)
  if (!entries.length) return url
  const search = new URLSearchParams(entries.map(([key, value]) => [key, String(value)]))
  return `${url}?${search.toString()}`
}

async function executeDashboardRequest(apiBaseUrl: string, spec: DashboardRequestSpec): Promise<DashboardEnvelope> {
  const definition = dashboardApiEndpoints[spec.endpoint]
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), DASHBOARD_REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(buildUrl(apiBaseUrl, definition.path, spec.params), {
      method: definition.method,
      headers: definition.method === 'POST'
        ? { Accept: 'application/json', 'Content-Type': 'application/json' }
        : { Accept: 'application/json' },
      credentials: 'include',
      signal: controller.signal,
      ...(definition.method === 'POST' ? { body: JSON.stringify(spec.body ?? {}) } : {}),
    })
    if (!response.ok) throw new Error(`${spec.endpoint}: HTTP ${response.status}`)
    const value: unknown = await response.json()
    assertDashboardEnvelope(spec.endpoint, value)
    return value
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`${spec.endpoint}: 请求超时（10秒）`)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

function runtimeConfig() {
  const runtime = window.__MAIN_GRAIN_CONFIG__ ?? {}
  return parseRuntimeConfig(runtime, import.meta.env)
}

export async function fetchDashboardAuxiliary(
  endpoint: 'queryByKeyword' | 'queryDemonstrationSubjectDetail',
  values: { keyWord?: string; subjectTypeList?: number[]; subjectId?: number | string },
): Promise<DashboardEnvelope> {
  return executeDashboardRequest(runtimeConfig().apiBaseUrl, buildDashboardAuxiliaryRequest(endpoint, values))
}

export async function fetchDashboardMapMetadata(context: DashboardRequestContext): Promise<DashboardEnvelope> {
  const spec = buildDashboardPageRequests(context, { includeMapMetadata: true })
    .find((item) => item.endpoint === 'getVectorTableWms')
  if (!spec) throw new Error(`getVectorTableWms: unsupported dashboard page ${pageKey(context)}`)
  const runtime = runtimeConfig()
  try {
    const response = await executeDashboardRequest(runtime.apiBaseUrl, spec)
    return resolveMapMetadataResponse(context, runtime, response) ?? response
  } catch (error) {
    const fallback = resolveMapMetadataResponse(context, runtime)
    if (fallback) return fallback
    throw error
  }
}

function addResponse(bag: DashboardResponseBag, endpoint: DashboardEndpointKey, value: DashboardEnvelope): void {
  const existing = bag[endpoint]
  if (!existing) bag[endpoint] = value
  else if (Array.isArray(existing)) existing.push(value)
  else bag[endpoint] = [existing, value]
}

function hasUsablePlantingTaskResponse(endpoint: DashboardEndpointKey, value: DashboardResponseValue | undefined): boolean {
  const envelopes = Array.isArray(value) ? value : value ? [value] : []
  return envelopes.some((envelope) => {
    if (envelope.code !== 200) return false
    if (endpoint === 'getVectorTableWms') return typeof envelope.msg === 'string'
    if (!('data' in envelope)) return false
    if (endpoint === 'getTimeLine' || endpoint === 'queryPlantingTaskByArea') {
      return Array.isArray(envelope.data) && envelope.data.length > 0
    }
    return Boolean(
      envelope.data
      && typeof envelope.data === 'object'
      && !Array.isArray(envelope.data)
      && Object.keys(envelope.data).length,
    )
  })
}

export function applyPlantingTaskFallback(
  context: DashboardRequestContext,
  bag: DashboardResponseBag,
  endpoints: readonly DashboardEndpointKey[] = plantingTaskFallbackEndpoints,
): DashboardResponseBag {
  if (pageKey(context) !== 'security/plantingTask') return bag
  const fallbackBag = createPlantingTaskFallbackBag()
  for (const endpoint of endpoints) {
    if (hasUsablePlantingTaskResponse(endpoint, bag[endpoint])) continue
    const fallback = fallbackBag[endpoint]
    if (fallback) bag[endpoint] = fallback
  }
  return bag
}

function hasUsableTimelineResponse(endpoint: DashboardEndpointKey, response: DashboardEnvelope | undefined): boolean {
  if (!response || response.code !== 200 || !('data' in response)) return false
  if (endpoint === 'getTimeLine') return Array.isArray(response.data) && response.data.length > 0
  if (endpoint === 'getReproductiveTimeLine') {
    const data = response.data as { reproductiveTimeList?: unknown[] }
    return Array.isArray(data?.reproductiveTimeList) && data.reproductiveTimeList.length > 0
  }
  return true
}

function resolveTimelineResponse(
  context: DashboardRequestContext,
  spec: DashboardRequestSpec,
  response?: DashboardEnvelope,
): DashboardEnvelope | undefined {
  if (!['getTimeLine', 'getReproductiveTimeLine'].includes(spec.endpoint)) return response
  if (hasUsableTimelineResponse(spec.endpoint, response)) return response

  const timeline = resolveMapTimeline(context)
  if (!timeline.length) return response
  if (spec.endpoint === 'getTimeLine') {
    return {
      code: 200,
      msg: '临时时间线',
      data: timeline.map((item) => ({ timeYear: Number(item.date.slice(0, 4)), halfYear: null })),
    }
  }

  const allYear = [...new Set(timeline.map((item) => Number(item.date.slice(0, 4))))]
    .filter(Number.isFinite)
    .sort((left, right) => left - right)
  const requestedYear = Number(spec.body?.year ?? context.year)
  const year = allYear.includes(requestedYear) ? requestedYear : allYear.at(-1)
  const reproductiveTimeList = timeline
    .filter((item) => Number(item.date.slice(0, 4)) === year)
    .map((item, index, items) => ({
      productionDate: item.date,
      periodType: item.label,
      day: item.date.slice(5),
      dataFlag: true,
      wmsFlag: true,
      checked: index === items.length - 1,
    }))
  return year === undefined || !reproductiveTimeList.length
    ? response
    : { code: 200, msg: '临时时间线', data: { allMonth: [], reproductiveTimeList, allYear, year } }
}

function resolveMapMetadataResponse(
  context: DashboardRequestContext,
  runtime: ReturnType<typeof parseRuntimeConfig>,
  response?: DashboardEnvelope,
): DashboardEnvelope | undefined {
  if (response?.code === 200 && typeof response.msg === 'string' && response.msg.trim()) return response
  if (context.year === undefined) return response
  const url = resolveCatalogMapServiceFallback({
    moduleKey: context.moduleKey,
    subId: context.subId,
    year: context.year,
    crop: context.crop,
    date: context.date,
  }, runtime)
  return url ? { code: 200, msg: url, extent: null } : response
}

function resolveDashboardRequestResponse(
  context: DashboardRequestContext,
  runtime: ReturnType<typeof parseRuntimeConfig>,
  spec: DashboardRequestSpec,
  response?: DashboardEnvelope,
): DashboardEnvelope | undefined {
  let resolved = response
  if (runtime.useMock) {
    if (pageKey(context) === 'farmland/greenGrain') {
      resolved = resolveGreenGrainRequestResponse(spec, resolved)
    }
    if (pageKey(context) === 'warning/growthStage') {
      resolved = resolveGrowthStageRequestResponse(spec, resolved)
    }
    if (pageKey(context) === 'warning/seedling') {
      resolved = resolveSeedlingRequestResponse(spec, resolved)
    }
    resolved = resolveTimelineResponse(context, spec, resolved)
  }
  if (spec.endpoint === 'getVectorTableWms') {
    resolved = resolveMapMetadataResponse(context, runtime, resolved)
  }
  return resolved
}

function requestIdentity(spec: DashboardRequestSpec): string {
  return `${spec.endpoint}:${JSON.stringify(spec.body ?? spec.params ?? {})}`
}

async function executeBatch(
  apiBaseUrl: string,
  specs: DashboardRequestSpec[],
  bag: DashboardResponseBag,
  completed: Set<string>,
  resolveResponse?: (spec: DashboardRequestSpec, response?: DashboardEnvelope) => DashboardEnvelope | undefined,
): Promise<Error[]> {
  const pending = specs.filter((spec) => !completed.has(requestIdentity(spec)))
  const values = await Promise.allSettled(
    pending.map((spec) => executeDashboardRequest(apiBaseUrl, spec)),
  )
  const failures: Error[] = []
  pending.forEach((spec, index) => {
    completed.add(requestIdentity(spec))
    const result = values[index]
    if (result?.status === 'fulfilled') {
      addResponse(bag, spec.endpoint, resolveResponse?.(spec, result.value) ?? result.value)
      return
    }
    const fallback = resolveResponse?.(spec)
    if (fallback) addResponse(bag, spec.endpoint, fallback)
    const reason = result?.reason
    failures.push(reason instanceof Error ? reason : new Error(`${spec.endpoint}: 请求失败`))
  })
  return failures
}

function initialContext(moduleKey: ModuleKey, subId: string, overrides: Partial<DashboardRequestContext>): DashboardRequestContext {
  const now = new Date()
  const defaultYear = now.getFullYear()
  const defaultHalfYear = now.getMonth() < 6 ? 1 : 2
  const resolvePlantingTaskTimeline = moduleKey === 'security'
    && subId === 'plantingTask'
    && overrides.year === undefined
  return normalizeDashboardContext({
    moduleKey,
    subId,
    year: resolvePlantingTaskTimeline ? undefined : defaultYear,
    yearMonth: moduleKey === 'warning' && defaultYear
      ? `${defaultYear}-${String(now.getMonth() + 1).padStart(2, '0')}`
      : undefined,
    halfYear: resolvePlantingTaskTimeline ? undefined : defaultHalfYear,
    district: '青岛市',
    crop: ['cropDistribution', 'yieldEstimate'].includes(subId) ? '小麦' : undefined,
    ...overrides,
  })
}

function applyRequestFallbacks(
  context: DashboardRequestContext,
  includeWarningDate: boolean,
): DashboardRequestContext {
  if (context.moduleKey !== 'warning') return context
  const now = new Date()
  const fallbackDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return normalizeDashboardContext({
    ...context,
    crop: context.crop ?? (context.subId === 'weatherDisaster' ? '高温' : '小麦'),
    date: context.date ?? (includeWarningDate ? fallbackDate : undefined),
  })
}

function assertResolvedContext(context: DashboardRequestContext, requireWarningDate: boolean): void {
  const key = pageKey(context)
  if (context.year === undefined) throw new Error(`${key}: year is required after timeline resolution`)
  if (key === 'security/plantingTask') return
  if (context.moduleKey === 'warning') {
    if (!context.crop) throw new Error(`${key}: crop is required after crop type resolution`)
    if (requireWarningDate && !context.date) throw new Error(`${key}: date is required after reproductive timeline resolution`)
    return
  }
  if (context.halfYear !== 1 && context.halfYear !== 2) {
    throw new Error(`${key}: halfYear is required after timeline resolution`)
  }
}

export async function fetchScreenData(
  moduleKey: ModuleKey,
  subId: string,
  overrides: Partial<DashboardRequestContext> = {},
): Promise<AjaxResult<ScreenPayload>> {
  // 大屏请求按“基础筛选 -> 生育期时间线 -> 页面数据”三阶段执行，避免缺失上下文时误发后续请求。
  const runtime = runtimeConfig()
  const apiBaseUrl = runtime.apiBaseUrl
  let context = initialContext(moduleKey, subId, overrides)
  const bag: DashboardResponseBag = {}
  const completed = new Set<string>()
  const failures: Error[] = []
  const firstStage = buildDashboardPageRequests(context).filter((spec) => ['getTimeLine', 'queryCropType'].includes(spec.endpoint))
  failures.push(...await executeBatch(
    apiBaseUrl,
    firstStage,
    bag,
    completed,
    (spec, response) => resolveDashboardRequestResponse(context, runtime, spec, response),
  ))
  if (runtime.useMock) applyPlantingTaskFallback(context, bag, ['getTimeLine'])
  context = applyRequestFallbacks(
    normalizeDashboardContext(inferDashboardContext(context, bag)),
    false,
  )
  assertResolvedContext(context, false)
  const secondStage = buildDashboardPageRequests(context).filter((spec) => spec.endpoint === 'getReproductiveTimeLine')
  failures.push(...await executeBatch(
    apiBaseUrl,
    secondStage,
    bag,
    completed,
    (spec, response) => resolveDashboardRequestResponse(context, runtime, spec, response),
  ))
  context = applyRequestFallbacks(
    normalizeDashboardContext(inferDashboardContext(context, bag)),
    true,
  )
  assertResolvedContext(context, true)
  failures.push(...await executeBatch(
    apiBaseUrl,
    buildDashboardPageRequests(context, { includeMapMetadata: shouldRequestMapMetadata(context, runtime) }),
    bag,
    completed,
    (spec, response) => resolveDashboardRequestResponse(context, runtime, spec, response),
  ))
  if (runtime.useMock) applyPlantingTaskFallback(context, bag)
  const data = adaptDashboardScreen(context, bag)
  const directMapService = resolveDirectMapService(context, runtime)
  if (directMapService && !data.map.serviceUrl && !data.map.serviceLayerName) {
    data.map.serviceMode = directMapService.mode === 'none' ? undefined : directMapService.mode
    data.map.serviceUrl = directMapService.url
  }
  return {
    code: 200,
    msg: failures.length ? 'partial success' : 'success',
    data,
  }
}

export { resolveGreenGrainRequestResponse }
