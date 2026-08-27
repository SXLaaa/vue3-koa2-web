import type { ModuleKey, ModuleTab } from '../types/dashboard.ts'

export interface DashboardPageDefinition {
  moduleKey: ModuleKey
  subId: string
  name: string
}

export const dashboardModules: readonly ModuleTab[] = [
  {
    key: 'farmland',
    name: '农田监测',
    route: '/index',
    children: [
      { id: 'cultivatedLand', name: '耕地监测' },
      { id: 'highStandard', name: '高标准农田监测' },
      { id: 'basicProtection', name: '基本农田保护监测' },
      { id: 'greenGrain', name: '绿色增粮“十百千”' },
    ],
  },
  {
    key: 'security',
    name: '粮食安全研判',
    route: '/security',
    children: [
      { id: 'plantingTask', name: '种植任务' },
      { id: 'cropDistribution', name: '作物分布' },
      { id: 'yieldEstimate', name: '产量预估' },
    ],
  },
  {
    key: 'warning',
    name: '粮食生产预警',
    route: '/prodWarning',
    children: [
      { id: 'growthStage', name: '生育期分析' },
      { id: 'seedling', name: '苗情分析' },
      { id: 'growth', name: '长势分析' },
      { id: 'maturity', name: '成熟期预测' },
      { id: 'weatherDisaster', name: '气象灾害分析' },
    ],
  },
]

export const dashboardPages: readonly DashboardPageDefinition[] = dashboardModules.flatMap(
  (module) => module.children.map((child) => ({
    moduleKey: module.key,
    subId: child.id,
    name: child.name,
  })),
)

export function getDefaultDashboardSubId(moduleKey: ModuleKey): string {
  return dashboardModules.find((item) => item.key === moduleKey)?.children[0]?.id ?? ''
}

export function isDashboardPage(moduleKey: string, subId: string): boolean {
  return dashboardPages.some((item) => item.moduleKey === moduleKey && item.subId === subId)
}
