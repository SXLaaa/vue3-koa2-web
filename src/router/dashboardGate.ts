import {
  dashboardModules,
  getDefaultDashboardSubId,
  isDashboardPage,
} from '../config/dashboardNavigation.ts'

export const LOGIN_HASH = '#/login' as const
export const DASHBOARD_HOME_HASH = '#/farmland/cultivatedLand' as const

export interface DashboardGateDecision {
  view: 'login' | 'dashboard'
  hash: string
}

function normalizeHash(hash: string): string {
  const trimmed = hash.trim()
  if (!trimmed) return ''
  return trimmed.startsWith('#/') ? trimmed : `#/${trimmed.replace(/^#?\/?/u, '')}`
}

// 路由门控保持纯函数，便于在不启动浏览器和后端的情况下验证登录边界。
export function resolveDashboardGate(hash: string, authenticated: boolean): DashboardGateDecision {
  if (!authenticated) return { view: 'login', hash: LOGIN_HASH }

  const normalized = normalizeHash(hash)
  const [moduleKey = '', subId = ''] = normalized.replace(/^#\//u, '').split('/')
  const module = dashboardModules.find((item) => item.key === moduleKey)
  if (module && !subId) {
    return {
      view: 'dashboard',
      hash: `#/${module.key}/${getDefaultDashboardSubId(module.key)}`,
    }
  }
  return isDashboardPage(moduleKey, subId)
    ? { view: 'dashboard', hash: normalized }
    : { view: 'dashboard', hash: DASHBOARD_HOME_HASH }
}
