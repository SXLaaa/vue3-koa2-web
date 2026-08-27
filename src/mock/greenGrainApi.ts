import type {
  DashboardDataEnvelope,
  DashboardEnvelope,
  DashboardRequestSpec,
} from '../types/dashboardApi.ts'

const statistics = [
  { landRegion: null, subjectType: 1, subjectArea: 14.26, subjectAreaW: null, subjectCount: 10 },
  { landRegion: null, subjectType: 2, subjectArea: 16.3, subjectAreaW: null, subjectCount: 141 },
  { landRegion: null, subjectType: 3, subjectArea: 23.74, subjectAreaW: null, subjectCount: 1007 },
]

const pioneerSubjects = [
  { subjectId: 'fallback-01', landRegion: '平度市', subjectName: '青岛华强农机专业合作社', subjectArea: 20000, subjectAreaW: 2, subjectLongitude: 120, subjectLatitude: 36.6, subjectType: 1 },
  { subjectId: 'fallback-02', landRegion: '即墨区', subjectName: '中即瑞丰农业有限公司', subjectArea: 18000, subjectAreaW: 1.8, subjectLongitude: 120.37, subjectLatitude: 36.57, subjectType: 1 },
  { subjectId: 'fallback-03', landRegion: '莱西市', subjectName: '青岛丰诺农化有限公司', subjectArea: 16000, subjectAreaW: 1.6, subjectLongitude: 120.4, subjectLatitude: 36.83, subjectType: 1 },
  { subjectId: 'fallback-04', landRegion: '平度市', subjectName: '青岛青农种子产销专业合作社', subjectArea: 15000, subjectAreaW: 1.5, subjectLongitude: 119.88672, subjectLatitude: 36.65974, subjectType: 1 },
  { subjectId: 'fallback-05', landRegion: '胶州市', subjectName: '胶州市茔子村农业种植专业合作社', subjectArea: 15000, subjectAreaW: 1.5, subjectLongitude: 119.89, subjectLatitude: 36.28, subjectType: 1 },
  { subjectId: 'fallback-06', landRegion: '平度市', subjectName: '青岛西寨农技专业合作社', subjectArea: 15000, subjectAreaW: 1.5, subjectLongitude: 119.74, subjectLatitude: 36.8, subjectType: 1 },
  { subjectId: 'fallback-07', landRegion: '即墨区', subjectName: '青岛春秋永旺种植专业合作社', subjectArea: 12000, subjectAreaW: 1.2, subjectLongitude: 120.18, subjectLatitude: 36.43, subjectType: 1 },
  { subjectId: 'fallback-08', landRegion: '莱西市', subjectName: '青岛万好千村现代农业发展有限公司', subjectArea: 11000, subjectAreaW: 1.1, subjectLongitude: 120.4, subjectLatitude: 36.66, subjectType: 1 },
  { subjectId: 'fallback-09', landRegion: '胶州市', subjectName: '青岛茹泽沃农业服务有限公司', subjectArea: 11000, subjectAreaW: 1.1, subjectLongitude: 119.77509, subjectLatitude: 36.072, subjectType: 1 },
  { subjectId: 'fallback-10', landRegion: '黄岛区', subjectName: '青岛同富勤耕农业机械专业合作社', subjectArea: 9600, subjectAreaW: 0.96, subjectLongitude: 119.66, subjectLatitude: 35.67, subjectType: 1 },
]

const allSubjects = [
  ...pioneerSubjects,
  { subjectId: 'fallback-11', landRegion: '莱西市', subjectName: '莱西市金鸽岭仙桃家庭农场', subjectArea: 4200, subjectAreaW: 0.42, subjectLongitude: 120.403092, subjectLatitude: 36.844308, subjectType: 2 },
  { subjectId: 'fallback-12', landRegion: '即墨区', subjectName: '山东土地乡村振兴集团农业分公司', subjectArea: 15000, subjectAreaW: 1.5, subjectLongitude: 120.453655, subjectLatitude: 36.533721, subjectType: 3 },
]

const thousandAreaStatistics = [
  { landRegion: '莱西市', subjectType: null, subjectArea: 46024.65, subjectAreaW: 4.6, subjectCount: 38 },
  { landRegion: '胶州市', subjectType: null, subjectArea: 37071, subjectAreaW: 3.71, subjectCount: 32 },
  { landRegion: '平度市', subjectType: null, subjectArea: 31675.02, subjectAreaW: 3.17, subjectCount: 30 },
  { landRegion: '黄岛区', subjectType: null, subjectArea: 24957.03, subjectAreaW: 2.5, subjectCount: 23 },
  { landRegion: '即墨区', subjectType: null, subjectArea: 23278.8, subjectAreaW: 2.33, subjectCount: 18 },
]

const hundredAreaStatistics = [
  { landRegion: '即墨区', subjectType: null, subjectArea: 74238.96, subjectAreaW: 7.42, subjectCount: 137 },
  { landRegion: '平度市', subjectType: null, subjectArea: 59192.32, subjectAreaW: 5.92, subjectCount: 300 },
  { landRegion: '胶州市', subjectType: null, subjectArea: 40891, subjectAreaW: 4.09, subjectCount: 240 },
  { landRegion: '莱西市', subjectType: null, subjectArea: 39159.37, subjectAreaW: 3.92, subjectCount: 220 },
  { landRegion: '黄岛区', subjectType: null, subjectArea: 23951.18, subjectAreaW: 2.4, subjectCount: 110 },
]

function success<T>(data: T): DashboardDataEnvelope<T> {
  return { msg: '操作成功', code: 200, data }
}

function hasUsableData(response: DashboardEnvelope | undefined): boolean {
  return Boolean(
    response
    && response.code === 200
    && 'data' in response
    && Array.isArray(response.data)
    && response.data.length,
  )
}

function createFallback(spec: DashboardRequestSpec): DashboardEnvelope | undefined {
  if (spec.endpoint === 'queryGreenGrainIncreaseStatistics') return success(statistics.map((item) => ({ ...item })))

  if (spec.endpoint === 'queryGreenGrainIncreaseList') {
    if (spec.body?.subjectType === 1) return success(pioneerSubjects.map((item) => ({ ...item })))
    if (Array.isArray(spec.body?.subjectTypeList)) return success(allSubjects.map((item) => ({ ...item })))
    return undefined
  }

  if (spec.endpoint === 'queryGreenGrainIncreaseStatisticsByArea') {
    if (spec.body?.subjectType === 2) return success(thousandAreaStatistics.map((item) => ({ ...item })))
    if (spec.body?.subjectType === 3) return success(hundredAreaStatistics.map((item) => ({ ...item })))
  }

  return undefined
}

export function resolveGreenGrainRequestResponse(
  spec: DashboardRequestSpec,
  response?: DashboardEnvelope,
): DashboardEnvelope | undefined {
  if (hasUsableData(response)) return response
  return createFallback(spec) ?? response
}
