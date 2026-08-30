import assert from 'node:assert/strict'
import {
  buildDashboardPageRequests,
} from '../src/services/dashboardApi.ts'
import { inferDashboardContext } from '../src/services/dashboardAdapters.ts'

function findBody(moduleKey, subId, crop, endpoint) {
  const specs = buildDashboardPageRequests({
    moduleKey,
    subId,
    year: 2026,
    halfYear: 2,
    crop,
    date: '2025-11-20',
  })
  return specs.find((item) => item.endpoint === endpoint)?.body
}

for (const [moduleKey, subId, crop] of [
  ['security', 'cropDistribution', '小麦'],
  ['security', 'yieldEstimate', '玉米'],
  ['warning', 'seedling', '小麦'],
  ['warning', 'weatherDisaster', '病虫害'],
]) {
  const body = findBody(moduleKey, subId, crop, 'queryReportList')
  assert.equal(body?.typeName, crop, `${moduleKey}/${subId} 报告请求必须携带作物维度`)
}

assert.equal(
  findBody('warning', 'growth', '小麦', 'queryGrowthAnalysisByYear')?.year,
  2026,
  '长势年度趋势必须携带生产季年份',
)
assert.deepEqual(
  findBody('warning', 'weatherDisaster', '低温', 'queryDisasterStatistics'),
  { areaName: '青岛市', typeName: '低温', year: 2026, yearDay: '2025-11-20' },
  '气象灾害类型切换后的请求必须包含同一类型、生产季和观测日期',
)

const resolved = inferDashboardContext(
  { moduleKey: 'warning', subId: 'growthStage', year: 2026, crop: '小麦' },
  {
    getReproductiveTimeLine: {
      code: 200,
      msg: 'ok',
      data: {
        year: 2026,
        allYear: [{ timeYear: 2025 }, { timeYear: 2026 }],
        reproductiveTimeList: [{
          productionDate: '2025-11-20',
          periodType: '越冬期',
          checked: true,
        }],
      },
    },
  },
)
assert.equal(resolved.year, 2026, '跨年小麦观测日期不得覆盖生产季年份')
assert.equal(resolved.date, '2025-11-20')

let weatherState
try {
  weatherState = await import('../src/services/weatherAlertState.ts')
} catch {
  weatherState = null
}
assert.equal(typeof weatherState?.selectWeatherAlertType, 'function', '缺少气象类型统一状态转换')
assert.deepEqual(weatherState.selectWeatherAlertType('高温', '低温'), {
  changed: true,
  crop: '低温',
  timelineIndex: 0,
})
assert.deepEqual(weatherState.selectWeatherAlertType('低温', '低温'), {
  changed: false,
  crop: '低温',
  timelineIndex: 0,
})

console.log('DASHBOARD_DATA_FIX_CHECK=PASS reports=4 seasonYear=stable weatherState=shared')
