export type ModuleKey = 'farmland' | 'security' | 'warning'

export interface DashboardSubIdMap {
  farmland: 'cultivatedLand' | 'highStandard' | 'basicProtection' | 'greenGrain'
  security: 'plantingTask' | 'cropDistribution' | 'yieldEstimate'
  warning: 'growthStage' | 'seedling' | 'growth' | 'maturity' | 'weatherDisaster'
}

export type DashboardPageId = DashboardSubIdMap[ModuleKey]

export type MapTheme =
  | 'cropland'
  | 'standard'
  | 'protection'
  | 'greenGrain'
  | 'task'
  | 'crop'
  | 'yield'
  | 'growth'
  | 'seedling'
  | 'maturity'
  | 'weather'

export interface ModuleTab {
  key: ModuleKey
  name: string
  route: string
  children: SubModule[]
}

export interface SubModule {
  id: string
  name: string
}

export interface AjaxResult<T> {
  code: number
  msg: string
  data: T
}

export interface MetricCard {
  label: string
  value: string | number
  unit?: string
  subValue?: string
  accent?: 'cyan' | 'green' | 'orange' | 'red' | 'violet'
}

export interface DistrictStat {
  name: string
  value: number
  unit: string
  rate?: number
  task?: number
  level?: 'low' | 'normal' | 'good' | 'high' | 'risk'
}

export interface LegendItem {
  label: string
  color: string
}

export interface ChartDatum {
  name: string
  value: number
  compare?: number
  rate?: number
  count?: number
}

export interface ChartSeries {
  name: string
  color: string
  data: number[]
  countData?: number[]
}

export interface ChartBlock {
  title: string
  type: 'bar' | 'donut' | 'line' | 'stack'
  variant?:
    | 'farmlandArea'
    | 'farmlandTrend'
    | 'plantingTask'
    | 'protectionMonitoring'
    | 'seedlingLevel'
    | 'growthLevel'
    | 'growthTrend'
    | 'maturityTrend'
    | 'weatherForecast'
  unit?: string
  data: ChartDatum[]
  series?: ChartSeries[]
}

export interface ReportItem {
  title: string
  date: string
  scope?: string
  url?: string
  color?: string
}

export interface TimelineItem {
  label: string
  date: string
  active?: boolean
}

export interface CropOption {
  label: string
  value: string
}

export interface ScreenPanel {
  title: string
  kind: 'metrics' | 'chart' | 'reports' | 'advice' | 'weather'
  metrics?: MetricCard[]
  chart?: ChartBlock
  reports?: ReportItem[]
  content?: string
}

export interface ScreenPayload {
  moduleKey: ModuleKey
  subId: string
  title: string
  place: string
  year: number
  crop?: string
  map: {
    theme: MapTheme
    legendTitle: string
    districtStats: DistrictStat[]
    legend: LegendItem[]
    showPixelOverlay?: boolean
    clientDistrictFill?: boolean
    serviceMode?: 'layer' | 'query' | 'image'
    serviceLayerName?: string
    serviceUrl?: string
    serviceExtent?: [number, number, number, number]
  }
  headline: MetricCard[]
  panels: ScreenPanel[]
  sideLabels?: string[]
  timeline?: TimelineItem[]
  timelineYears?: number[]
  cropOptions?: CropOption[]
}
