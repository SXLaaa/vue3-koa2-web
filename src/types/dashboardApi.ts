import type { DashboardPageId, ModuleKey } from './dashboard.ts'

export type DashboardEndpointKey =
  | 'queryQingDaoTotalArea'
  | 'queryQingDaoGroupByYear'
  | 'queryDemonstrationSubjectDetail'
  | 'queryQingDaoGroupByArea'
  | 'queryProtectionMonitoringTotal'
  | 'queryProtectionMonitoringByArea'
  | 'getVectorTableWms'
  | 'getTimeLine'
  | 'queryGreenGrainIncreaseStatistics'
  | 'queryGreenGrainIncreaseList'
  | 'queryGreenGrainIncreaseStatisticsByArea'
  | 'queryReportList'
  | 'queryPlantingTaskStatistics'
  | 'queryPlantingTaskByArea'
  | 'statisticsPlantingTaskByArea'
  | 'queryProtectionMonitoringByYear'
  | 'statisticsYield'
  | 'queryYieldTotalByYear'
  | 'queryYieldTotalByArea'
  | 'getReproductiveTimeLine'
  | 'queryReproductiveAnalysis'
  | 'queryGrowthBarChart'
  | 'queryGrowthAnalysisByYear'
  | 'getMaturityStageByDate'
  | 'queryMaturityStageByYear'
  | 'queryReproductivePeriodByDate'
  | 'queryBestHarvestTime'
  | 'queryDisasterStatistics'
  | 'queryCropType'
  | 'queryWeather'
  | 'querySeedlingConditionAnalysis'
  | 'queryByKeyword'
  | 'queryPestWarningByDate'

export interface DashboardEndpointDefinition {
  method: 'GET' | 'POST'
  path: string
  envelope: 'data' | 'page' | 'message'
}

export interface DashboardRequestContext {
  moduleKey: ModuleKey
  subId: DashboardPageId | string
  year?: number
  yearMonth?: string
  halfYear?: number | string | null
  lastHalfYear?: number | string | null
  crop?: string
  date?: string
  district?: string
  parentDistrict?: string
  subjectName?: string
  subjectTypeList?: number[]
  timelineEdge?: 'first' | 'last'
}

export interface DashboardRequestSpec {
  endpoint: DashboardEndpointKey
  body?: Record<string, unknown>
  params?: Record<string, unknown>
}

export interface DashboardRequestOptions {
  includeMapMetadata?: boolean
}

export interface DashboardDataEnvelope<T = unknown> {
  code: number
  msg: string
  data: T
}

export interface DashboardPageEnvelope<T = unknown> {
  code: number
  msg: string
  total: number
  rows: T[]
}

export interface DashboardMessageEnvelope {
  code: number
  msg: string
  extent?: unknown
}

export type DashboardEnvelope<T = unknown> = DashboardDataEnvelope<T> | DashboardPageEnvelope<T> | DashboardMessageEnvelope
export type DashboardResponseValue = DashboardEnvelope | DashboardEnvelope[]
export type DashboardResponseBag = Partial<Record<DashboardEndpointKey, DashboardResponseValue>>

export interface TimelineDto {
  timeYear?: number | string
  halfYear?: number | string | null
}

export interface ReproductiveTimelineDto {
  reproductiveTimeList?: Array<{
    productionDate?: string
    periodType?: string
    day?: string
    dataFlag?: boolean
    wmsFlag?: boolean
    checked?: boolean
  }>
  allMonth?: Array<{ timeYear?: number | string; timeMonth?: number | string; check?: boolean }>
  allYear?: Array<number | string | { timeYear?: number | string }>
  year?: number | string
}

export interface CropTypeDto {
  cropType?: string
  select?: boolean
}

export interface AreaTotalDto {
  areaTotal?: number | string
  partition?: number | string
  growth?: number | string
  growthData?: number | string
  growthRate?: number | string
  landNum?: number | string
  numGrowth?: number | string
  numGrowthData?: number | string
  numGrowthRate?: number | string
}

export interface AreaGroupDto {
  areaName?: string
  landRegion?: string
  totalArea?: number | string
  yieldTotal?: number | string
  areaRate?: number | string
  planLandArea?: number | string
  realLandArea?: number | string
  qingDaoGroupByRelatedList?: Array<{
    changeRelated?: string
    totalArea?: number | string
    totalCount?: number | string
  }>
}

export interface ReportDto {
  reportTitle?: string
  reportDate?: string
  reportTime?: string
  reportUrl?: string
  monitoringScope?: string
  reportColor?: string
}

export interface GreenGrainStatisticDto {
  landRegion?: string | null
  subjectType?: number | string
  subjectArea?: number | string
  subjectAreaW?: number | string | null
  subjectCount?: number | string
}

export interface GreenGrainAreaStatisticDto extends GreenGrainStatisticDto {
  landRegion?: string | null
}

export interface GreenGrainSubjectDto {
  subjectId?: number | string
  subjectType?: number | string
  subjectName?: string
  subjectArea?: number | string
  subjectAreaW?: number | string
  landRegion?: string
  subjectAddress?: string
  managerName?: string
  managerMobile?: string
  managerMobileHide?: string
  subjectLongitude?: number | string
  subjectLatitude?: number | string
}

export interface PlantingTaskStatisticsDto {
  plan?: number | string
  finishRate?: number | string
  realList?: Array<{ cropType?: string; landArea?: number | string }>
}

export interface YieldStatisticsDto {
  maxYieldTotalArea?: string
  maxYieldTotal?: number | string
  maxYieldPerArea?: string
  maxYieldPer?: number | string
  yieldTotal?: number | string
  yieldPer?: number | string
  totalGrowth?: number | string
  totalGrowthData?: number | string
  yieldGrowth?: number | string
  yieldGrowthData?: number | string
}

export interface ReproductivePeriodDto {
  cropType?: string
  periodType?: string
  durationDays?: number | string
  remainingDays?: number | string
}
