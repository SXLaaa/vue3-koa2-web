import type {
  DashboardEnvelope,
  DashboardRequestSpec,
  ReportDto,
  ReproductiveTimelineDto,
} from '../types/dashboardApi.ts'

type SeedlingCrop = '小麦' | '玉米'

interface SeedlingStage {
  productionDate: string
  periodType: string
  day: string
}

const stagesByCrop: Record<SeedlingCrop, Record<number, readonly SeedlingStage[]>> = {
  小麦: {
    2025: [
      { productionDate: '2025-12-20', periodType: '越冬期', day: '12-20' },
    ],
    2026: [
      { productionDate: '2026-03-20', periodType: '返青-起身期', day: '03-20' },
      { productionDate: '2026-04-10', periodType: '拔节期', day: '04-10' },
      { productionDate: '2026-05-11', periodType: '抽穗-开花期', day: '05-11' },
      { productionDate: '2026-05-15', periodType: '抽穗-开花期', day: '05-15' },
    ],
  },
  玉米: {
    2025: [
      { productionDate: '2025-07-10', periodType: '拔节期', day: '07-10' },
      { productionDate: '2025-08-10', periodType: '大喇叭口期', day: '08-10' },
      { productionDate: '2025-09-10', periodType: '吐丝期', day: '09-10' },
    ],
  },
}

const wheatLevels = [
  { monitoringType: '叶面积指数', typeName: '较好', typeRate: 45.02 },
  { monitoringType: '叶面积指数', typeName: '正常', typeRate: 35.27 },
  { monitoringType: '叶面积指数', typeName: '略差', typeRate: 5.32 },
  { monitoringType: '叶面积指数', typeName: '较差', typeRate: 14.39 },
]

const cornLevels = [
  { monitoringType: '叶面积指数', typeName: '较好', typeRate: 42.36 },
  { monitoringType: '叶面积指数', typeName: '正常', typeRate: 38.72 },
  { monitoringType: '叶面积指数', typeName: '略差', typeRate: 8.14 },
  { monitoringType: '叶面积指数', typeName: '较差', typeRate: 10.78 },
]

const reports: ReportDto[] = [
  { reportTitle: '2026年青岛市冬小麦挑旗-开花期苗情监测分析报告', reportDate: '2026-06-01', reportTime: '2026-06-01 00:00:00', monitoringScope: '全市' },
  { reportTitle: '2026年青岛市冬小麦拔节期苗情监测分析报告', reportDate: '2026-04-10', reportTime: '2026-05-02 00:00:00', monitoringScope: '全市', reportColor: '#0AD0DE' },
  { reportTitle: '2026年青岛市冬小麦返青期苗情监测分析报告', reportDate: '2026-03-20', reportTime: '2026-04-09 00:00:00', monitoringScope: '全市', reportColor: '#0ADE62' },
  { reportTitle: '2026年青岛市冬小麦越冬期苗情监测分析报告', reportDate: '2026-01-20', reportTime: '2026-01-11 00:00:00', monitoringScope: '全市', reportColor: '#00FF84' },
  { reportTitle: '2025年青岛市玉米吐丝期苗情监测分析报告', reportDate: '2025-09-10', reportTime: '2025-09-10 00:00:00', monitoringScope: '全市', reportColor: '#FFD900' },
  { reportTitle: '2025年青岛市玉米大口期苗情监测分析报告', reportDate: '2025-09-10', reportTime: '2025-08-21 00:00:00', monitoringScope: '全市', reportColor: '#00FFD4' },
  { reportTitle: '2025年青岛市玉米拔节期苗情监测分析报告', reportDate: '2025-07-13', reportTime: '2025-08-02 00:00:00', monitoringScope: '全市', reportColor: '#009DFF' },
]

function normalizeCrop(value: unknown): SeedlingCrop {
  const crop = String(value ?? '').trim().toLowerCase()
  return crop === '玉米' || crop === 'corn' || crop === 'ym' ? '玉米' : '小麦'
}

function timelineFallback(crop: SeedlingCrop, requestedYear: unknown): ReproductiveTimelineDto {
  const cropStages = stagesByCrop[crop]
  const allYear = Object.keys(cropStages).map(Number).sort((left, right) => left - right)
  const parsedYear = Number(requestedYear)
  const year = allYear.includes(parsedYear) ? parsedYear : allYear.at(-1)!
  const stages = cropStages[year] ?? []
  const allStages = allYear.flatMap((itemYear) => cropStages[itemYear] ?? [])
  const allMonth = [...new Map(allStages.map((item) => [
    item.productionDate.slice(0, 7),
    { timeMonth: item.productionDate.slice(0, 7), timeYear: Number(item.productionDate.slice(0, 4)), check: false },
  ])).values()]

  return {
    allMonth,
    reproductiveTimeList: stages.map((item, index) => ({
      ...item,
      dataFlag: true,
      wmsFlag: true,
      checked: index === stages.length - 1,
    })),
    allYear,
    year,
  }
}

function findStage(crop: SeedlingCrop, date: string): SeedlingStage | undefined {
  return Object.values(stagesByCrop[crop]).flat().find((item) => item.productionDate === date)
}

function responseData(response: DashboardEnvelope | undefined): unknown {
  return response && 'data' in response ? response.data : undefined
}

function hasUsableResponse(spec: DashboardRequestSpec, response: DashboardEnvelope | undefined): boolean {
  if (!response || response.code !== 200) return false
  if (spec.endpoint === 'queryReportList') return 'rows' in response && response.rows.length > 0
  const data = responseData(response)
  if (spec.endpoint === 'queryCropType' || spec.endpoint === 'querySeedlingConditionAnalysis') {
    return Array.isArray(data) && data.length > 0
  }
  if (spec.endpoint === 'getReproductiveTimeLine') {
    const timeline = data as ReproductiveTimelineDto | undefined
    return Boolean(timeline?.reproductiveTimeList?.length)
  }
  if (spec.endpoint === 'queryReproductivePeriodByDate') {
    return Boolean(data && typeof data === 'object' && !Array.isArray(data) && 'periodType' in data)
  }
  return true
}

export function resolveSeedlingRequestResponse(
  spec: DashboardRequestSpec,
  response?: DashboardEnvelope,
): DashboardEnvelope | undefined {
  if (hasUsableResponse(spec, response)) return response

  if (spec.endpoint === 'queryCropType') {
    return { code: 200, msg: '操作成功', data: [
      { index: null, cropType: '小麦', select: true },
      { index: null, cropType: '玉米', select: false },
    ] }
  }

  if (spec.endpoint === 'getReproductiveTimeLine') {
    const crop = normalizeCrop(spec.body?.typeName)
    return { code: 200, msg: '操作成功', data: timelineFallback(crop, spec.body?.year) }
  }

  if (spec.endpoint === 'queryReproductivePeriodByDate') {
    const crop = normalizeCrop(spec.body?.typeName)
    const date = String(spec.body?.yearDay ?? '')
    const stage = findStage(crop, date)
    return stage ? {
      code: 200,
      msg: '操作成功',
      data: {
        cropType: crop,
        periodType: stage.periodType,
        durationDays: date === '2026-05-15' ? 13 : 10,
        remainingDays: 0,
      },
    } : response
  }

  if (spec.endpoint === 'querySeedlingConditionAnalysis') {
    const crop = normalizeCrop(spec.body?.typeName)
    return { code: 200, msg: '操作成功', data: crop === '玉米' ? cornLevels : wheatLevels }
  }

  if (spec.endpoint === 'queryReportList') {
    return { code: 200, msg: '查询成功', total: reports.length, rows: reports }
  }

  return response
}
