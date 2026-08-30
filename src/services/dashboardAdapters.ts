import type {
  ChartDatum,
  DistrictStat,
  LegendItem,
  MapTheme,
  MetricCard,
  ReportItem,
  ScreenPayload,
  TimelineItem,
} from '../types/dashboard.ts'
import type {
  AreaGroupDto,
  AreaTotalDto,
  CropTypeDto,
  DashboardDataEnvelope,
  DashboardEndpointKey,
  DashboardPageEnvelope,
  DashboardRequestContext,
  DashboardResponseBag,
  GreenGrainAreaStatisticDto,
  GreenGrainStatisticDto,
  GreenGrainSubjectDto,
  PlantingTaskStatisticsDto,
  ReportDto,
  ReproductivePeriodDto,
  ReproductiveTimelineDto,
  TimelineDto,
  YieldStatisticsDto,
} from '../types/dashboardApi.ts'
import { resolveMapResponseMode } from '../config/mapLayerServices.ts'
import { toSameOriginMapServiceUrl } from './mapServiceProxy.ts'

interface PagePresentation {
  title: string
  theme: MapTheme
  legendTitle: string
  legend: LegendItem[]
  showPixelOverlay?: boolean
  clientDistrictFill?: boolean
}

const pagePresentation: Record<string, PagePresentation> = {
  'farmland/cultivatedLand': {
    title: '耕地面积',
    theme: 'cropland',
    legendTitle: '耕地监测',
    legend: [{ label: '耕地', color: '#f4ee2a' }],
    showPixelOverlay: true,
  },
  'farmland/highStandard': {
    title: '高标准农田面积',
    theme: 'standard',
    legendTitle: '高标准农田',
    legend: [{ label: '高标准农田', color: '#20f0c8' }],
  },
  'farmland/basicProtection': {
    title: '疑似非粮化统计',
    theme: 'protection',
    legendTitle: '土地覆盖',
    legend: [
      { label: '林地', color: '#1fe888' },
      { label: '建筑', color: '#d89231' },
      { label: '水体', color: '#3dd7fd' },
      { label: '道路', color: '#d95508' },
    ],
    showPixelOverlay: true,
  },
  'farmland/greenGrain': {
    title: '绿色增粮“十百千”面积',
    theme: 'greenGrain',
    legendTitle: '绿色增粮“十百千”先行区',
    legend: [
      { label: '万亩先行区', color: '#1ed8ff' },
      { label: '千亩示范方', color: '#39e58c' },
      { label: '百亩示范点', color: '#f2ca5a' },
    ],
  },
  'security/plantingTask': {
    title: '种植任务',
    theme: 'task',
    legendTitle: '完成率图例',
    legend: [
      { label: '95-99% 基本完成', color: '#D89131' },
      { label: '< 95% 未完成', color: '#D95305' },
      { label: '≥ 100% 超额完成', color: '#1CE889' },
    ],
    clientDistrictFill: true,
  },
  'security/cropDistribution': {
    title: '作物分布',
    theme: 'crop',
    legendTitle: '作物',
    legend: [{ label: '作物', color: '#f6d74a' }],
    showPixelOverlay: true,
  },
  'security/yieldEstimate': {
    title: '产量预估',
    theme: 'yield',
    legendTitle: '产量等级',
    legend: [
      { label: '高产量', color: '#2be77b' },
      { label: '中产量', color: '#f3ca4a' },
      { label: '低产量', color: '#ef6b42' },
    ],
    showPixelOverlay: true,
  },
  'warning/growthStage': {
    title: '生育期分析',
    theme: 'growth',
    legendTitle: '生育期',
    legend: [],
    showPixelOverlay: true,
  },
  'warning/seedling': {
    title: '苗情分析',
    theme: 'seedling',
    legendTitle: '苗情分级标准',
    legend: [],
    showPixelOverlay: true,
  },
  'warning/growth': {
    title: '长势等级分析',
    theme: 'growth',
    legendTitle: '长势等级',
    legend: [
      { label: '过旺', color: '#17984e' },
      { label: '较旺', color: '#c4ef8b' },
      { label: '正常', color: '#faf6a3' },
      { label: '较弱', color: '#ffca70' },
      { label: '过弱', color: '#d53028' },
    ],
    showPixelOverlay: true,
  },
  'warning/maturity': {
    title: '成熟度预测',
    theme: 'maturity',
    legendTitle: '成熟度等级',
    legend: [
      { label: '95% ~ 100%', color: '#f65d2a' },
      { label: '90% ~ 95%', color: '#ffbd5b' },
      { label: '80% ~ 90%', color: '#fedf86' },
      { label: '70% ~ 80%', color: '#feff8b' },
      { label: '60% ~ 70%', color: '#bbff97' },
      { label: '< 60%', color: '#1d6663' },
    ],
    showPixelOverlay: true,
  },
  'warning/weatherDisaster': {
    title: '实时气象',
    theme: 'weather',
    legendTitle: '气象灾害',
    legend: [],
    showPixelOverlay: true,
  },
}

function pageKey(context: DashboardRequestContext): string {
  return `${context.moduleKey}/${context.subId}`
}

function envelopeAt(bag: DashboardResponseBag, endpoint: DashboardEndpointKey, index = 0) {
  const value = bag[endpoint]
  return Array.isArray(value) ? value[index] : value
}

function dataOf<T>(bag: DashboardResponseBag, endpoint: DashboardEndpointKey, index = 0): T | undefined {
  const envelope = envelopeAt(bag, endpoint, index) as DashboardDataEnvelope<T> | undefined
  return envelope && 'data' in envelope ? envelope.data : undefined
}

function rowsOf<T>(bag: DashboardResponseBag, endpoint: DashboardEndpointKey): T[] {
  const envelope = envelopeAt(bag, endpoint) as DashboardPageEnvelope<T> | undefined
  return envelope && 'rows' in envelope && Array.isArray(envelope.rows) ? envelope.rows : []
}

function mapServiceUrl(value: unknown, effectiveYear: number | undefined): string | undefined {
  if (typeof value !== 'string') return undefined
  const url = value.trim()
  if (!url || /\s|[\u0000-\u001f\u007f]|\\/u.test(url)) return undefined
  if (url.startsWith('/')) return url.startsWith('//') ? undefined : url
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) return undefined
    const runtimeYear = typeof window === 'undefined'
      ? undefined
      : window.__MAIN_GRAIN_CONFIG__?.newGeoServerStartYear
    const newGeoServerStartYear = Number.isInteger(runtimeYear) ? Number(runtimeYear) : 2026
    return toSameOriginMapServiceUrl(url, effectiveYear, newGeoServerStartYear)
  } catch {
    return undefined
  }
}

function mapServiceExtent(value: unknown): [number, number, number, number] | undefined {
  const values = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : []
  if (values.length !== 4) return undefined
  const extent = values.map(Number)
  return extent.every(Number.isFinite) ? extent as [number, number, number, number] : undefined
}

function attachMapService(context: DashboardRequestContext, bag: DashboardResponseBag, payload: ScreenPayload): void {
  const envelope = envelopeAt(bag, 'getVectorTableWms') as { msg?: unknown; extent?: unknown } | undefined
  const mode = resolveMapResponseMode(context)
  if (!envelope || mode === 'none') return

  if (mode === 'layer' && typeof envelope.msg === 'string') {
    const serviceUrl = mapServiceUrl(envelope.msg, context.year)
    if (!serviceUrl) return
    const query = serviceUrl.includes('?') ? serviceUrl.slice(serviceUrl.indexOf('?') + 1) : serviceUrl
    const layerName = new URLSearchParams(query).get('layers')?.trim()
    if (layerName && /^[A-Za-z0-9_.-]+:[A-Za-z0-9_.-]+$/u.test(layerName)) {
      payload.map.serviceMode = mode
      payload.map.serviceLayerName = layerName
      payload.map.serviceUrl = serviceUrl
    }
    return
  }

  const serviceUrl = mapServiceUrl(envelope.msg, context.year)
  if (mode === 'query' && serviceUrl) {
    payload.map.serviceMode = mode
    payload.map.serviceUrl = serviceUrl
    return
  }

  const extent = mapServiceExtent(envelope.extent)
  if (mode === 'image' && serviceUrl && extent) {
    payload.map.serviceMode = mode
    payload.map.serviceUrl = serviceUrl
    payload.map.serviceExtent = extent
  }
}

function numberValue(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function displayValue(value: unknown): string | number {
  return numberValue(value) ?? (typeof value === 'string' ? value : '')
}

function dateYear(value: unknown): number | undefined {
  if (typeof value !== 'string') return numberValue(value)
  const match = value.match(/^\d{4}/u)
  return match ? Number(match[0]) : undefined
}

function reportsFrom(rows: ReportDto[]): ReportItem[] {
  return rows.map((row) => ({
    title: row.reportTitle ?? '',
    date: row.reportDate ?? row.reportTime ?? '',
    scope: row.monitoringScope,
    url: row.reportUrl,
    color: row.reportColor,
  }))
}

function timelineFrom(
  items: TimelineDto[] | undefined,
  activeYear?: number,
  activeHalfYear?: number | string | null,
): TimelineItem[] {
  if (!items?.length) return []
  const sameYearIndex = items.findIndex((item) => numberValue(item.timeYear) === activeYear)
  const exactIndex = items.findIndex((item) => {
    if (numberValue(item.timeYear) !== activeYear) return false
    return activeHalfYear === undefined || activeHalfYear === null
      || numberValue(item.halfYear) === numberValue(activeHalfYear)
  })
  const activeIndex = exactIndex >= 0
    ? exactIndex
    : sameYearIndex >= 0
      ? sameYearIndex
      : items.length - 1
  return items.map((item, index) => ({
    label: String(item.timeYear ?? ''),
    date: `${item.timeYear ?? ''}${item.halfYear ? Number(item.halfYear) === 1 ? '上' : '下' : ''}`,
    active: index === activeIndex,
  }))
}

function reproductiveTimelineFrom(value: ReproductiveTimelineDto | undefined, activeDate?: string): TimelineItem[] {
  const items = [...(value?.reproductiveTimeList ?? [])]
    .filter((item) => item.productionDate)
    .sort((left, right) => String(left.productionDate).localeCompare(String(right.productionDate)))
  return items.map((item, index) => ({
    label: item.periodType ?? '',
    date: item.productionDate ?? '',
    active: activeDate
      ? item.productionDate === activeDate
      : item.checked ?? index === items.length - 1,
  }))
}

function reproductiveTimelineYears(value: ReproductiveTimelineDto | undefined): number[] {
  return [...new Set((value?.allYear ?? []).flatMap((item) => {
    const year = typeof item === 'object' ? numberValue(item.timeYear) : numberValue(item)
    return year === undefined ? [] : [year]
  }))].sort((left, right) => left - right)
}

function districtsFrom(items: AreaGroupDto[] | undefined, unit: string, valueKey: 'totalArea' | 'yieldTotal' | 'realLandArea' = 'totalArea'): DistrictStat[] {
  return (items ?? []).flatMap((item) => {
    const value = numberValue(item[valueKey])
    const name = item.areaName ?? item.landRegion
    if (!name || value === undefined) return []
    return [{
      name,
      value,
      unit,
      rate: numberValue(item.areaRate),
      task: numberValue(item.planLandArea),
    }]
  })
}

function chartData(districts: DistrictStat[]): ChartDatum[] {
  return districts.map((item) => ({ name: item.name, value: item.value, compare: item.task, rate: item.rate }))
}

export function createEmptyScreenPayload(context: DashboardRequestContext): ScreenPayload {
  if (context.year === undefined) throw new Error('dashboard context year is required')
  const presentation = pagePresentation[pageKey(context)] ?? {
    title: '',
    theme: 'cropland' as const,
    legendTitle: '',
    legend: [],
  }
  return {
    moduleKey: context.moduleKey,
    subId: context.subId,
    title: presentation.title,
    place: context.district ?? '',
    year: context.year,
    crop: context.crop,
    map: {
      theme: presentation.theme,
      legendTitle: presentation.legendTitle,
      districtStats: [],
      legend: presentation.legend,
      showPixelOverlay: presentation.showPixelOverlay,
      clientDistrictFill: presentation.clientDistrictFill,
    },
    headline: [],
    panels: [],
  }
}

function adaptFarmlandArea(context: DashboardRequestContext, bag: DashboardResponseBag): ScreenPayload {
  const payload = createEmptyScreenPayload(context)
  const total = dataOf<AreaTotalDto>(bag, 'queryQingDaoTotalArea')
  const grouped = dataOf<{ qingDaoGroupByAreaList?: AreaGroupDto[] }>(bag, 'queryQingDaoGroupByArea')
  const yearly = dataOf<{ qingDaoGroupByYearList?: Array<{ timeYear?: number | string; totalArea?: number | string }> }>(bag, 'queryQingDaoGroupByYear')
  const timeline = dataOf<TimelineDto[]>(bag, 'getTimeLine')
  const districts = districtsFrom(grouped?.qingDaoGroupByAreaList, '万亩')
  const prefix = context.subId === 'highStandard' ? '青岛市高标准农田' : '青岛耕地'
  if (total?.areaTotal !== undefined) payload.headline.push({ label: `${prefix}总面积`, value: displayValue(total.areaTotal), unit: '万亩', accent: 'cyan' })
  if (total?.partition !== undefined) payload.headline.push({ label: '占青岛市土地总面积的', value: displayValue(total.partition), unit: '%', accent: 'green' })
  payload.map.districtStats = districts
  payload.panels = [{
    title: context.subId === 'highStandard' ? '高标准农田分析' : '耕地分析',
    kind: 'chart',
    chart: { title: '占地面积', type: 'bar', variant: 'farmlandArea', unit: '万亩', data: chartData(districts) },
  }]
  const trendData = (yearly?.qingDaoGroupByYearList ?? []).flatMap((item) => {
    const value = numberValue(item.totalArea)
    return value === undefined ? [] : [{ name: String(item.timeYear ?? ''), value }]
  })
  if (trendData.length) payload.panels.push({
    title: '耕地面积变化趋势',
    kind: 'chart',
    chart: { title: '耕地面积变化趋势', type: 'line', variant: 'farmlandTrend', unit: '万亩', data: trendData },
  })
  const reportRows = rowsOf<ReportDto>(bag, 'queryReportList')
  if (reportRows.length) payload.panels.push({ title: '耕地监测报告', kind: 'reports', reports: reportsFrom(reportRows) })
  payload.timeline = timelineFrom(timeline, context.year, context.halfYear)
  return payload
}

function adaptBasicProtection(context: DashboardRequestContext, bag: DashboardResponseBag): ScreenPayload {
  const payload = createEmptyScreenPayload(context)
  const total = dataOf<AreaTotalDto>(bag, 'queryProtectionMonitoringTotal')
  const grouped = dataOf<{ dataGroupByAreaList?: AreaGroupDto[] }>(bag, 'queryProtectionMonitoringByArea')
  const groups = grouped?.dataGroupByAreaList ?? []
  const districts = districtsFrom(groups, '亩')
  if (total?.areaTotal !== undefined) payload.headline.push({ label: '疑似非粮化面积', value: displayValue(total.areaTotal), unit: '亩', accent: 'orange' })
  const rate = total?.growthRate ?? total?.growth
  if (rate !== undefined) payload.headline.push({ label: '较上期', value: displayValue(rate), unit: '%', subValue: total?.growthData === undefined ? undefined : `${displayValue(total.growthData)}亩`, accent: 'red' })
  const seriesNames = ['林地', '建筑', '水体', '道路']
  payload.map.districtStats = districts
  payload.panels = [{
    title: '疑似非粮化分析',
    kind: 'chart',
    chart: {
      title: '面积',
      type: 'stack',
      variant: 'protectionMonitoring',
      unit: '亩',
      data: chartData(districts),
      series: seriesNames.map((name, index) => ({
        name,
        color: pagePresentation['farmland/basicProtection'].legend[index]?.color ?? '',
        data: groups.map((group) => numberValue(group.qingDaoGroupByRelatedList?.find((item) => item.changeRelated === name)?.totalArea) ?? 0),
        countData: groups.map((group) => numberValue(group.qingDaoGroupByRelatedList?.find((item) => item.changeRelated === name)?.totalCount) ?? 0),
      })),
    },
  }]
  payload.timeline = timelineFrom(dataOf<TimelineDto[]>(bag, 'getTimeLine'), context.year, context.halfYear)
  return payload
}

function adaptGreenGrain(context: DashboardRequestContext, bag: DashboardResponseBag): ScreenPayload {
  const payload = createEmptyScreenPayload(context)
  const statistics = dataOf<GreenGrainStatisticDto[]>(bag, 'queryGreenGrainIncreaseStatistics') ?? []
  const subjects = dataOf<GreenGrainSubjectDto[]>(bag, 'queryGreenGrainIncreaseList', 1) ?? []
  const areaDistribution = dataOf<GreenGrainAreaStatisticDto[]>(bag, 'queryGreenGrainIncreaseStatisticsByArea', 0) ?? []
  const smallAreaDistribution = dataOf<GreenGrainAreaStatisticDto[]>(bag, 'queryGreenGrainIncreaseStatisticsByArea', 1) ?? []
  const statisticsByType = new Map(statistics.flatMap((item) => {
    const type = numberValue(item.subjectType)
    return type === undefined ? [] : [[type, item] as const]
  }))
  const pioneer = statisticsByType.get(1)
  const thousand = statisticsByType.get(2)
  const hundred = statisticsByType.get(3)
  if (pioneer?.subjectArea !== undefined) {
    payload.headline.push({ label: '总面积', value: displayValue(pioneer.subjectArea), unit: '万亩', accent: 'green' })
  }
  const metricRows = [
    { item: pioneer, label: '万亩先行区', subArea: thousand?.subjectArea, accent: 'cyan' as const },
    { item: thousand, label: '千亩示范方', subArea: hundred?.subjectArea, accent: 'orange' as const },
    { item: hundred, label: '百亩示范点', subArea: undefined, accent: 'violet' as const },
  ]
  for (const metric of metricRows) {
    if (metric.item?.subjectCount === undefined) continue
    payload.headline.push({
      label: metric.label,
      value: displayValue(metric.item.subjectCount),
      unit: '个',
      subValue: metric.subArea === undefined ? undefined : `${displayValue(metric.subArea)} 万亩`,
      accent: metric.accent,
    })
  }
  payload.map.districtStats = areaDistribution.flatMap((item) => {
    const value = numberValue(item.subjectCount)
    return item.landRegion && value !== undefined ? [{ name: item.landRegion, value, unit: '个' }] : []
  })
  payload.panels = [
    { title: '十大万亩先行区', kind: 'reports', reports: subjects.map((item) => ({ title: item.subjectName ?? '', date: `面积：${displayValue(item.subjectAreaW)}万亩 地区：${item.landRegion ?? ''}` })) },
    { title: '示范区市分布', kind: 'chart', chart: { title: '千亩示范方', type: 'bar', unit: '个', data: chartData(payload.map.districtStats) } },
  ]
  const smallAreaData = smallAreaDistribution.flatMap((item) => {
    const value = numberValue(item.subjectCount)
    return item.landRegion && value !== undefined ? [{ name: item.landRegion, value }] : []
  })
  if (smallAreaData.length) payload.panels.push({ title: '百亩示范点分布', kind: 'chart', chart: { title: '百亩示范点', type: 'bar', unit: '个', data: smallAreaData } })
  return payload
}

function adaptPlantingTask(context: DashboardRequestContext, bag: DashboardResponseBag): ScreenPayload {
  const payload = createEmptyScreenPayload(context)
  const statistics = dataOf<PlantingTaskStatisticsDto>(bag, 'queryPlantingTaskStatistics')
  const areaRows = dataOf<AreaGroupDto[]>(bag, 'queryPlantingTaskByArea')
  const indicators = dataOf<Record<string, unknown>>(bag, 'statisticsPlantingTaskByArea')
  const districts = districtsFrom(areaRows, '万亩', 'realLandArea').map((item) => ({
    ...item,
    level: item.rate !== undefined && item.rate >= 100
      ? 'high' as const
      : item.rate !== undefined && item.rate < 95
        ? 'risk' as const
        : 'normal' as const,
  }))
  if (statistics?.finishRate !== undefined) payload.headline.push({ label: '完成率', value: displayValue(statistics.finishRate), unit: '%', accent: 'green' })
  if (statistics?.plan !== undefined) payload.headline.push({ label: '种植任务', value: displayValue(statistics.plan), unit: '万亩', accent: 'cyan' })
  for (const item of statistics?.realList ?? []) payload.headline.push({ label: `${item.cropType ?? ''}完成`, value: displayValue(item.landArea), unit: '万亩' })
  const metrics: MetricCard[] = [
    { label: '超额完成县区', value: displayValue(indicators?.excessCount), unit: '个' },
    { label: '全市平均完成率', value: displayValue(indicators?.averageRate), unit: '%' },
    { label: '最高完成率', value: displayValue(indicators?.maxRate), unit: '%' },
    { label: '任务达标', value: displayValue(indicators?.finishRate), unit: '%' },
  ]
  payload.map.districtStats = districts
  payload.panels = [
    { title: '区县种植任务对比分析', kind: 'chart', chart: { title: '任务量/完成量', type: 'bar', variant: 'plantingTask', unit: '万亩', data: chartData(districts) } },
    { title: '任务指标', kind: 'metrics', metrics },
  ]
  payload.timeline = timelineFrom(dataOf<TimelineDto[]>(bag, 'getTimeLine'), context.year, context.halfYear)
  return payload
}

function cropOptions(bag: DashboardResponseBag, fallback: string[] = []): Array<{ label: string; value: string }> {
  const toOption = (label: string) => ({
    label,
    value: label === '小麦' ? 'wheat' : label === '玉米' ? 'corn' : label,
  })
  const types = dataOf<CropTypeDto[]>(bag, 'queryCropType')?.flatMap((item) => item.cropType ? [toOption(item.cropType)] : []) ?? []
  return types.length ? types : fallback.map(toOption)
}

function adaptCropDistribution(context: DashboardRequestContext, bag: DashboardResponseBag): ScreenPayload {
  const payload = createEmptyScreenPayload(context)
  const total = dataOf<AreaTotalDto>(bag, 'queryProtectionMonitoringTotal')
  const grouped = dataOf<{ dataGroupByAreaList?: AreaGroupDto[] }>(bag, 'queryProtectionMonitoringByArea')
  const yearly = dataOf<{ dataGroupByAreaList?: Array<{ timeYear?: number | string; totalArea?: number | string }> }>(bag, 'queryProtectionMonitoringByYear')
  const districts = districtsFrom(grouped?.dataGroupByAreaList, '万亩')
  const crop = context.crop ?? ''
  payload.crop = crop
  payload.cropOptions = cropOptions(bag, ['小麦', '玉米'])
  payload.map.legend = crop ? [{ label: crop, color: '#f6d74a' }] : []
  if (total?.areaTotal !== undefined) payload.headline = [{ label: `${crop}种植面积`, value: displayValue(total.areaTotal), unit: '万亩', accent: 'green' }]
  payload.map.districtStats = districts
  payload.panels = [
    { title: `${crop}种植面积分析`, kind: 'chart', chart: { title: '种植面积', type: 'bar', unit: '万亩', data: chartData(districts) } },
  ]
  const trendData = (yearly?.dataGroupByAreaList ?? []).flatMap((item) => {
    const value = numberValue(item.totalArea)
    return value === undefined ? [] : [{ name: String(item.timeYear ?? ''), value }]
  })
  if (trendData.length) payload.panels.push({ title: '作物分布年度趋势', kind: 'chart', chart: { title: '种植面积趋势', type: 'line', unit: '万亩', data: trendData } })
  payload.panels.push({ title: '作物分布报告', kind: 'reports', reports: reportsFrom(rowsOf<ReportDto>(bag, 'queryReportList')) })
  payload.timeline = timelineFrom(dataOf<TimelineDto[]>(bag, 'getTimeLine'), context.year, context.halfYear)
  return payload
}

function adaptYieldEstimate(context: DashboardRequestContext, bag: DashboardResponseBag): ScreenPayload {
  const payload = createEmptyScreenPayload(context)
  const statistics = dataOf<YieldStatisticsDto>(bag, 'statisticsYield')
  const areaRows = dataOf<AreaGroupDto[]>(bag, 'queryYieldTotalByArea')
  const yearly = dataOf<Array<{ timeYear?: number | string; yieldTotal?: number | string }>>(bag, 'queryYieldTotalByYear') ?? []
  const districts = districtsFrom(areaRows, '万吨', 'yieldTotal')
  payload.crop = context.crop
  payload.cropOptions = cropOptions(bag, ['小麦', '玉米'])
  if (statistics?.maxYieldTotalArea !== undefined) payload.headline.push({ label: '最高总产区', value: statistics.maxYieldTotalArea, subValue: statistics.maxYieldTotal === undefined ? undefined : `${displayValue(statistics.maxYieldTotal)}万吨`, accent: 'green' })
  if (statistics?.maxYieldPerArea !== undefined) payload.headline.push({ label: '最高单产区', value: statistics.maxYieldPerArea, subValue: statistics.maxYieldPer === undefined ? undefined : `${displayValue(statistics.maxYieldPer)}kg/亩`, accent: 'cyan' })
  if (statistics?.yieldTotal !== undefined) payload.headline.push({ label: `${context.crop ?? ''}总产量`, value: displayValue(statistics.yieldTotal), unit: '万吨', accent: 'green' })
  if (statistics?.yieldPer !== undefined) payload.headline.push({ label: '平均亩产', value: displayValue(statistics.yieldPer), unit: '千克', accent: 'orange' })
  payload.map.districtStats = districts
  payload.panels = [
    { title: '区县产量预估对比分析', kind: 'chart', chart: { title: '产量预估', type: 'bar', unit: '万吨', data: chartData(districts) } },
  ]
  const trendData = yearly.flatMap((item) => {
    const value = numberValue(item.yieldTotal)
    return value === undefined ? [] : [{ name: String(item.timeYear ?? ''), value }]
  })
  if (trendData.length) payload.panels.push({ title: '产量年度趋势', kind: 'chart', chart: { title: '产量年度趋势', type: 'line', unit: '万吨', data: trendData } })
  payload.panels.push({ title: '产量预估分析报告', kind: 'reports', reports: reportsFrom(rowsOf<ReportDto>(bag, 'queryReportList')) })
  payload.timeline = timelineFrom(dataOf<TimelineDto[]>(bag, 'getTimeLine'), context.year, context.halfYear)
  return payload
}

function adaptGrowthStage(context: DashboardRequestContext, bag: DashboardResponseBag): ScreenPayload {
  const payload = createEmptyScreenPayload(context)
  const analysis = dataOf<Record<string, unknown>>(bag, 'queryReproductiveAnalysis')
  const phases = [1, 2, 3].flatMap((index) => {
    const prefix = index === 1 ? 'phaseOne' : index === 2 ? 'phaseTwo' : 'phaseThree'
    const rawName = analysis?.[`${prefix}Name`]
    const rawTime = analysis?.[`${prefix}Time`]
    const value = numberValue(analysis?.[`${prefix}Rate`])
    if (value === undefined) return []
    const name = typeof rawName === 'string' && rawName.trim()
      ? rawName.trim()
      : ['偏早', '集中', '偏晚'][index - 1] ?? `阶段${index}`
    const time = typeof rawTime === 'string' && rawTime.trim() ? rawTime.trim() : name
    return [{ name, time, value }]
  })
  const phaseData: ChartDatum[] = phases.map((item) => ({ name: item.time, value: item.value }))
  const timeline = dataOf<ReproductiveTimelineDto>(bag, 'getReproductiveTimeLine')
  payload.crop = context.crop
  payload.cropOptions = cropOptions(bag)
  payload.map.legend = phases.map((item, index) => ({ label: item.name, color: ['#226c1e', '#f2ff01', '#ff3c0c'][index] ?? '#20d8ff' }))
  payload.headline = phases.map((item) => ({ label: item.name, value: item.value, unit: '%' }))
  payload.panels = [
    { title: '生育期分析', kind: 'chart', chart: { title: String(analysis?.periodType ?? ''), type: 'donut', data: phaseData } },
    { title: '管理措施建议', kind: 'advice', content: typeof analysis?.measures === 'string' ? analysis.measures : '' },
  ]
  payload.timeline = reproductiveTimelineFrom(timeline, context.date)
  payload.timelineYears = reproductiveTimelineYears(timeline)
  return payload
}

function periodHeadline(period: ReproductivePeriodDto | undefined): MetricCard[] {
  if (!period) return []
  return [
    { label: '当前作物', value: period.cropType ?? '', accent: 'green' },
    { label: '当前生育期', value: period.periodType ?? '', accent: 'cyan' },
    { label: '持续天数', value: period.durationDays === undefined ? '' : `${displayValue(period.durationDays)}天`, subValue: period.remainingDays === undefined ? undefined : `剩余${displayValue(period.remainingDays)}天`, accent: 'orange' },
  ]
}

function adaptSeedling(context: DashboardRequestContext, bag: DashboardResponseBag): ScreenPayload {
  const payload = createEmptyScreenPayload(context)
  const period = dataOf<ReproductivePeriodDto>(bag, 'queryReproductivePeriodByDate')
  const levels = dataOf<Array<{ typeName?: string; typeRate?: number | string }>>(bag, 'querySeedlingConditionAnalysis') ?? []
  const data = levels.flatMap((item) => {
    const value = numberValue(item.typeRate)
    return item.typeName && value !== undefined ? [{ name: item.typeName, value }] : []
  })
  const colors = ['#34df7f', '#f0d34d', '#f69042', '#f04d4d']
  payload.crop = context.crop
  payload.cropOptions = cropOptions(bag)
  payload.headline = periodHeadline(period)
  payload.map.legend = data.map((item, index) => ({ label: item.name, color: colors[index] ?? '#20d8ff' }))
  payload.panels = [
    { title: '叶面积指数苗情分级', kind: 'chart', chart: { title: '苗情等级', type: 'donut', variant: 'seedlingLevel', unit: '%', data } },
    { title: '苗情监测报告', kind: 'reports', reports: reportsFrom(rowsOf<ReportDto>(bag, 'queryReportList')) },
  ]
  const timeline = dataOf<ReproductiveTimelineDto>(bag, 'getReproductiveTimeLine')
  payload.timeline = reproductiveTimelineFrom(timeline, context.date)
  payload.timelineYears = reproductiveTimelineYears(timeline)
  return payload
}

function adaptGrowth(context: DashboardRequestContext, bag: DashboardResponseBag): ScreenPayload {
  const payload = createEmptyScreenPayload(context)
  const period = dataOf<ReproductivePeriodDto>(bag, 'queryReproductivePeriodByDate')
  const bar = dataOf<Record<string, unknown>>(bag, 'queryGrowthBarChart')
  const trend = dataOf<{ year?: number | string; averagedList?: Array<{ growthDate?: string; mean?: number | string }>; yearData?: Array<{ mean?: number | string }> }>(bag, 'queryGrowthAnalysisByYear')
  const keys = [['过旺', 'veryGoodRate'], ['较旺', 'goodRate'], ['正常', 'normalRate'], ['较弱', 'badRate'], ['过弱', 'veryDadRate']] as const
  const levelData = keys.flatMap(([name, key]) => {
    const value = numberValue(bar?.[key])
    return value === undefined ? [] : [{ name, value }]
  })
  const averageSeries = (trend?.averagedList ?? []).map((item) => numberValue(item.mean) ?? 0)
  const currentSeries = (trend?.yearData ?? []).map((item) => numberValue(item.mean) ?? 0)
  const trendData = (trend?.yearData ?? []).flatMap((item, index) => {
    const value = numberValue(item.mean)
    return value === undefined ? [] : [{ name: trend?.averagedList?.[index]?.growthDate ?? String(index + 1), value }]
  })
  payload.crop = context.crop
  payload.cropOptions = cropOptions(bag)
  payload.headline = periodHeadline(period)
  payload.panels = [
    { title: '长势等级分析', kind: 'chart', chart: { title: '长势等级', type: 'bar', variant: 'growthLevel', unit: '%', data: levelData } },
    {
      title: '长势对比分析',
      kind: 'chart',
      chart: {
        title: '长势指数',
        type: 'line',
        unit: '%',
        data: trendData,
        series: [
          { name: '历史平均', color: '#8fa8c9', data: averageSeries },
          { name: String(trend?.year ?? context.year), color: '#20d8ff', data: currentSeries },
        ],
      },
    },
  ]
  const timeline = dataOf<ReproductiveTimelineDto>(bag, 'getReproductiveTimeLine')
  payload.timeline = reproductiveTimelineFrom(timeline, context.date)
  payload.timelineYears = reproductiveTimelineYears(timeline)
  return payload
}

function adaptMaturity(context: DashboardRequestContext, bag: DashboardResponseBag): ScreenPayload {
  const payload = createEmptyScreenPayload(context)
  const current = dataOf<Record<string, unknown>>(bag, 'getMaturityStageByDate')
  const best = dataOf<Record<string, unknown>>(bag, 'queryBestHarvestTime')
  const trend = dataOf<Array<{ maturityDate?: string; maturityRatio?: number | string }>>(bag, 'queryMaturityStageByYear') ?? []
  if (current?.maturityRatio !== undefined) payload.headline.push({ label: '当前成熟度', value: displayValue(current.maturityRatio), unit: '%', subValue: typeof current.maturityRatioName === 'string' ? current.maturityRatioName : undefined, accent: 'red' })
  const start = best?.startMonthDate ?? best?.startDate
  const end = best?.endMonthDate ?? best?.endDate
  if (start || end) payload.headline.push({ label: '最佳采收期', value: `${String(start ?? '')} - ${String(end ?? '')}`, accent: 'green' })
  const trendData = trend.flatMap((item) => {
    const value = numberValue(item.maturityRatio)
    return value === undefined ? [] : [{ name: item.maturityDate ?? '', value }]
  })
  payload.crop = context.crop
  payload.cropOptions = cropOptions(bag)
  payload.panels = [{ title: '成熟度趋势', kind: 'chart', chart: { title: '成熟度', type: 'line', variant: 'maturityTrend', unit: '%', data: trendData } }]
  const timeline = dataOf<ReproductiveTimelineDto>(bag, 'getReproductiveTimeLine')
  payload.timeline = reproductiveTimelineFrom(timeline, context.date)
  payload.timelineYears = reproductiveTimelineYears(timeline)
  return payload
}

function adaptWeather(context: DashboardRequestContext, bag: DashboardResponseBag): ScreenPayload {
  const payload = createEmptyScreenPayload(context)
  const weather = dataOf<{ condition?: Record<string, unknown>; forecast?: Array<Record<string, unknown>> }>(bag, 'queryWeather')
  const condition = weather?.condition
  const pest = dataOf<{ pestType?: string; riskLevel?: string; productionDate?: string }>(bag, 'queryPestWarningByDate')
  const disaster = dataOf<{ disasterStatisticsList?: Array<{ name?: string; color?: string; value?: number | string }>; totalValue?: number | string }>(bag, 'queryDisasterStatistics')
  if (pest) {
    payload.headline = [
      { label: '病虫害类型', value: pest.pestType ?? '', accent: 'orange' },
      { label: '风险等级', value: pest.riskLevel ?? '', accent: 'red' },
      { label: '预警日期', value: pest.productionDate ?? '', accent: 'cyan' },
    ]
  }
  if (condition) {
    payload.headline.push(
      { label: '温度', value: displayValue(condition.temp), unit: '℃', subValue: condition.realFeel === undefined ? undefined : `体感 ${displayValue(condition.realFeel)}℃`, accent: 'orange' },
      { label: '湿度', value: displayValue(condition.humidity), unit: '%', accent: 'cyan' },
      { label: '风速', value: displayValue(condition.windSpeed), unit: 'm/s', subValue: `${String(condition.windDir ?? '')} ${String(condition.windLevel ?? '')}`.trim(), accent: 'green' },
      { label: '降水', value: displayValue(condition.precipitation), unit: 'mm', accent: 'violet' },
    )
  }
  const metrics = (disaster?.disasterStatisticsList ?? []).map((item) => ({ label: item.name ?? '', value: displayValue(item.value), unit: '天' }))
  if (disaster?.totalValue !== undefined) metrics.push({ label: '年度累计天数', value: displayValue(disaster.totalValue), unit: '天' })
  payload.crop = context.crop
  payload.cropOptions = cropOptions(bag)
  payload.map.legend = (disaster?.disasterStatisticsList ?? []).map((item) => ({ label: item.name ?? '', color: item.color ?? '#20d8ff' }))
  payload.panels = [
    { title: '灾害累计', kind: 'metrics', metrics },
    { title: '气象预报', kind: 'chart', chart: { title: '未来天气', type: 'line', variant: 'weatherForecast', unit: '℃', data: (weather?.forecast ?? []).flatMap((item) => { const value = numberValue(item.tempDay); return value === undefined ? [] : [{ name: String(item.predictDate ?? ''), value, compare: numberValue(item.tempNight) }] }) } },
  ]
  const reportRows = rowsOf<ReportDto>(bag, 'queryReportList')
  if (reportRows.length) payload.panels.push({ title: '病虫害监测报告', kind: 'reports', reports: reportsFrom(reportRows) })
  const timeline = dataOf<ReproductiveTimelineDto>(bag, 'getReproductiveTimeLine')
  payload.timeline = reproductiveTimelineFrom(timeline, context.date)
  payload.timelineYears = reproductiveTimelineYears(timeline)
  return payload
}

export function adaptDashboardScreen(context: DashboardRequestContext, bag: DashboardResponseBag): ScreenPayload {
  const key = pageKey(context)
  let payload: ScreenPayload
  if (key === 'farmland/cultivatedLand' || key === 'farmland/highStandard') payload = adaptFarmlandArea(context, bag)
  else if (key === 'farmland/basicProtection') payload = adaptBasicProtection(context, bag)
  else if (key === 'farmland/greenGrain') payload = adaptGreenGrain(context, bag)
  else if (key === 'security/plantingTask') payload = adaptPlantingTask(context, bag)
  else if (key === 'security/cropDistribution') payload = adaptCropDistribution(context, bag)
  else if (key === 'security/yieldEstimate') payload = adaptYieldEstimate(context, bag)
  else if (key === 'warning/growthStage') payload = adaptGrowthStage(context, bag)
  else if (key === 'warning/seedling') payload = adaptSeedling(context, bag)
  else if (key === 'warning/growth') payload = adaptGrowth(context, bag)
  else if (key === 'warning/maturity') payload = adaptMaturity(context, bag)
  else if (key === 'warning/weatherDisaster') payload = adaptWeather(context, bag)
  else payload = createEmptyScreenPayload(context)

  attachMapService(context, bag, payload)
  return payload
}

export function inferDashboardContext(context: DashboardRequestContext, bag: DashboardResponseBag): DashboardRequestContext {
  const timeline = dataOf<TimelineDto[]>(bag, 'getTimeLine')
  const timelineDefault = timeline?.at(-1)
  const previousTimeline = timeline && timeline.length > 1 ? timeline.at(-2) : undefined
  const cropTypes = dataOf<CropTypeDto[]>(bag, 'queryCropType') ?? []
  const cropDefault = cropTypes.find((item) => item.select)?.cropType ?? cropTypes[0]?.cropType
  const reproductive = dataOf<ReproductiveTimelineDto>(bag, 'getReproductiveTimeLine')
  const reproductiveItems = reproductive?.reproductiveTimeList ?? []
  const edgeDate = context.timelineEdge === 'first'
    ? reproductiveItems[0]?.productionDate
    : context.timelineEdge === 'last'
      ? reproductiveItems.at(-1)?.productionDate
      : undefined
  const dateDefault = edgeDate
    ?? reproductiveItems.find((item) => item.checked)?.productionDate
    ?? reproductiveItems.at(-1)?.productionDate
  const effectiveDate = context.date ?? dateDefault
  const inferredMonth = effectiveDate ? Number(effectiveDate.slice(5, 7)) : undefined
  const requestedTimeline = timeline?.find((item) => numberValue(item.timeYear) === context.year)
  const resolvedTimeline = requestedTimeline ?? timelineDefault
  const reproductiveYear = numberValue(reproductive?.year)
  return {
    ...context,
    // year 表示作物生产季；跨年小麦的观测日期只决定 date，不得覆盖生产季年份。
    year: reproductiveYear ?? numberValue(resolvedTimeline?.timeYear) ?? context.year ?? dateYear(effectiveDate),
    yearMonth: effectiveDate?.slice(0, 7) ?? context.yearMonth,
    halfYear: context.halfYear ?? resolvedTimeline?.halfYear
      ?? (inferredMonth && inferredMonth >= 1 && inferredMonth <= 12 ? inferredMonth <= 6 ? 1 : 2 : undefined),
    lastHalfYear: context.lastHalfYear ?? previousTimeline?.halfYear,
    crop: context.crop ?? cropDefault,
    date: effectiveDate,
  }
}
