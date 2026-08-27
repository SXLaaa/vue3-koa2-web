import type {
  DashboardEndpointKey,
  DashboardResponseBag,
} from '../types/dashboardApi.ts'

export const plantingTaskFallbackEndpoints = [
  'getTimeLine',
  'queryPlantingTaskStatistics',
  'queryPlantingTaskByArea',
  'statisticsPlantingTaskByArea',
  'getVectorTableWms',
] as const satisfies readonly DashboardEndpointKey[]

export function createPlantingTaskFallbackBag(): DashboardResponseBag {
  return {
    getTimeLine: {
      msg: '操作成功',
      code: 200,
      data: [{ timeYear: 2025, halfYear: null, lastTimeYear: null, lastHalfYear: null }],
    },
    queryPlantingTaskStatistics: {
      msg: '操作成功',
      code: 200,
      data: {
        finishRate: 98,
        real: 706.75,
        realList: [
          { taskType: 2, landArea: 363.33, cropType: '秋粮' },
          { taskType: 2, landArea: 343.42, cropType: '夏粮' },
        ],
        plan: 720.5,
      },
    },
    queryPlantingTaskByArea: {
      msg: '操作成功',
      code: 200,
      data: [
        { landRegion: '平度市', planLandArea: 303.1, realLandArea: 303.41, areaRate: 100 },
        { landRegion: '莱西市', planLandArea: 131.7, realLandArea: 130.64, areaRate: 99 },
        { landRegion: '即墨区', planLandArea: 117.37, realLandArea: 114.23, areaRate: 97 },
        { landRegion: '胶州市', planLandArea: 94.41, realLandArea: 92.11, areaRate: 98 },
        { landRegion: '黄岛区', planLandArea: 72.56, realLandArea: 65.15, areaRate: 90 },
        { landRegion: '城阳区', planLandArea: 1.36, realLandArea: 1.21, areaRate: 89 },
      ],
    },
    statisticsPlantingTaskByArea: {
      msg: '操作成功',
      code: 200,
      data: { averageRate: 98, excessCount: 1, finishRate: 10, maxRate: 100 },
    },
    getVectorTableWms: { msg: '', extent: '', code: 200 },
  }
}
