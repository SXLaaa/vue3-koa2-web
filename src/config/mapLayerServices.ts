import type { ModuleKey, TimelineItem } from '../types/dashboard.ts'

export const MAP_VECTOR_METADATA_ENDPOINT = '/agro-admin/screen/getVectorTableWms'

export type MapLayerResponseMode = 'layer' | 'query' | 'image' | 'none'
export type MapLayerSource = 'api' | 'override' | 'catalog'
export type GeoServerSource = 'historical' | 'new'
export type DirectMapServiceKey = 'growthAnalysisXyzUrl'

export interface MapLayerVariant {
  crops: readonly string[]
  columnKey: string
  responseMode: MapLayerResponseMode
}

export interface MapLayerModuleConfig {
  moduleKey: ModuleKey
  subId: string
  columnKey?: string
  apiEnabled: boolean
  responseMode: MapLayerResponseMode
  sourcePriority: readonly MapLayerSource[]
  directServiceKey?: DirectMapServiceKey
  variants?: readonly MapLayerVariant[]
}

export interface MapServiceRuntimeConfig {
  historicalGeoServerEnabled: boolean
  historicalGeoServerBaseUrl: string
  newGeoServerEnabled: boolean
  newGeoServerBaseUrl: string
  newGeoServerStartYear: number
  growthAnalysisXyzUrl: string
}

const apiFirst = ['api', 'override', 'catalog'] as const
const catalogOnly = ['override', 'catalog'] as const

export const mapLayerModules: readonly MapLayerModuleConfig[] = [
  // 农田监测 > 耕地监测：调用 getVectorTableWms 获取 farmland_monitoring 图层，按 GeoServer 图层加载。
  { moduleKey: 'farmland', subId: 'cultivatedLand', columnKey: 'farmland_monitoring', apiEnabled: true, responseMode: 'layer', sourcePriority: apiFirst },
  // 农田监测 > 高标准农田监测：调用 getVectorTableWms 获取 high_standard_farmland 图层，按 GeoServer 图层加载。
  { moduleKey: 'farmland', subId: 'highStandard', columnKey: 'high_standard_farmland', apiEnabled: true, responseMode: 'layer', sourcePriority: apiFirst },
  // 农田监测 > 基本农田保护监测：调用 getVectorTableWms 获取 protection_monitoring 图层，按 GeoServer 图层加载。
  { moduleKey: 'farmland', subId: 'basicProtection', columnKey: 'protection_monitoring', apiEnabled: true, responseMode: 'layer', sourcePriority: apiFirst },
  // 农田监测 > 绿色增粮“十百千”：当前不请求地图服务接口，仅允许使用运行时覆盖或本地图层目录。
  { moduleKey: 'farmland', subId: 'greenGrain', apiEnabled: false, responseMode: 'none', sourcePriority: catalogOnly },

  // 粮食安全研判 > 种植任务：保留 getVectorTableWms 请求；线上返回空地址时按区县统计接口在前端着色。
  { moduleKey: 'security', subId: 'plantingTask', columnKey: 'planting_task', apiEnabled: true, responseMode: 'layer', sourcePriority: apiFirst },
  // 粮食安全研判 > 作物分布：调用 getVectorTableWms 获取 crop_distribution 图层，按 GeoServer 图层加载。
  { moduleKey: 'security', subId: 'cropDistribution', columnKey: 'crop_distribution', apiEnabled: true, responseMode: 'layer', sourcePriority: apiFirst },
  // 粮食安全研判 > 产量预估：调用 getVectorTableWms 获取 crop_yield 图层，按 GeoServer 图层加载。
  { moduleKey: 'security', subId: 'yieldEstimate', columnKey: 'crop_yield', apiEnabled: true, responseMode: 'layer', sourcePriority: apiFirst },

  // 粮食生产预警 > 生育期分析：调用 getVectorTableWms 获取 reproductive_period 图层，按 GeoServer 图层加载。
  { moduleKey: 'warning', subId: 'growthStage', columnKey: 'reproductive_period', apiEnabled: true, responseMode: 'layer', sourcePriority: apiFirst },
  // 粮食生产预警 > 苗情分析：调用 getVectorTableWms 获取 seedling_condition 图层，按 GeoServer 图层加载。
  { moduleKey: 'warning', subId: 'seedling', columnKey: 'seedling_condition', apiEnabled: true, responseMode: 'layer', sourcePriority: apiFirst },
  // 粮食生产预警 > 长势分析：优先使用 growthAnalysisXyzUrl 直连 XYZ；未配置时兼容接口返回地址。
  { moduleKey: 'warning', subId: 'growth', columnKey: 'growth_analysis', apiEnabled: true, responseMode: 'query', sourcePriority: apiFirst, directServiceKey: 'growthAnalysisXyzUrl' },
  // 粮食生产预警 > 成熟期预测：接口返回影像 URL 与范围 extent，按静态影像加载。
  { moduleKey: 'warning', subId: 'maturity', columnKey: 'maturation_prediction', apiEnabled: true, responseMode: 'image', sourcePriority: apiFirst },
  // 粮食生产预警 > 气象灾害分析：气象灾害按静态影像加载；切换到病虫害时改用 pest_warning GeoServer 图层。
  {
    moduleKey: 'warning',
    subId: 'weatherDisaster',
    columnKey: 'meteorological_warning',
    apiEnabled: true,
    responseMode: 'image',
    sourcePriority: apiFirst,
    variants: [{ crops: ['病虫害', 'pest_warning'], columnKey: 'pest_warning', responseMode: 'layer' }],
  },
]

export function getMapLayerModule(moduleKey: ModuleKey, subId: string): MapLayerModuleConfig | undefined {
  return mapLayerModules.find((item) => item.moduleKey === moduleKey && item.subId === subId)
}

function getMapLayerVariant(config: MapLayerModuleConfig, crop?: string): MapLayerVariant | undefined {
  const value = crop?.trim().toLowerCase()
  return value ? config.variants?.find((variant) => variant.crops.some((item) => item.toLowerCase() === value)) : undefined
}

export function resolveMapColumnKey(context: { moduleKey: ModuleKey; subId: string; crop?: string }): string | undefined {
  const config = getMapLayerModule(context.moduleKey, context.subId)
  return config ? getMapLayerVariant(config, context.crop)?.columnKey ?? config.columnKey : undefined
}

export function resolveMapResponseMode(context: { moduleKey: ModuleKey; subId: string; crop?: string }): MapLayerResponseMode {
  const config = getMapLayerModule(context.moduleKey, context.subId)
  return config ? getMapLayerVariant(config, context.crop)?.responseMode ?? config.responseMode : 'none'
}

export function resolveDirectMapService(
  context: { moduleKey: ModuleKey; subId: string; crop?: string },
  runtime: Pick<MapServiceRuntimeConfig, 'growthAnalysisXyzUrl'>,
): { mode: MapLayerResponseMode; url: string } | undefined {
  const config = getMapLayerModule(context.moduleKey, context.subId)
  if (!config?.directServiceKey) return undefined
  const url = runtime[config.directServiceKey].trim()
  return url ? { mode: resolveMapResponseMode(context), url } : undefined
}

export function shouldRequestMapMetadata(
  context: { moduleKey: ModuleKey; subId: string; year?: number; crop?: string; date?: string },
  _runtime: MapServiceRuntimeConfig,
): boolean {
  const config = getMapLayerModule(context.moduleKey, context.subId)
  const mode = resolveMapResponseMode(context)
  return Boolean(config?.apiEnabled && mode !== 'none')
}

export type GeoServerLayerCategory =
  | 'crop_distribution'
  | 'crop_yield'
  | 'farmland_monitoring'
  | 'high_standard_farmland'
  | 'pest_warning'
  | 'protection_monitoring'
  | 'reproductive_period'
  | 'seedling_condition'

export interface GeoServerCatalogEntry {
  layerName: string
  server: GeoServerSource
  category: GeoServerLayerCategory
  moduleKey: ModuleKey
  subId: string
  year: number
  date?: string
  crop?: 'xm' | 'ym'
  stageLabel?: string
  fallbackServer?: GeoServerSource
  fallbackSrs?: string
}
// 图层目录只负责 getVectorTableWms 失败时的旧服务兜底，不作为正式时间线数据源。
export const geoServerLayers: readonly GeoServerCatalogEntry[] = [
  // 农田监测 > 耕地监测
  { layerName: 'qingdao-agro:farmland_monitoring_2023_956417', server: 'historical', category: 'farmland_monitoring', moduleKey: 'farmland', subId: 'cultivatedLand', year: 2023 },
  { layerName: 'qingdao-agro:farmland_monitoring_2025_209664', server: 'historical', category: 'farmland_monitoring', moduleKey: 'farmland', subId: 'cultivatedLand', year: 2025 },
  // 农田监测 > 高标准农田监测
  { layerName: 'qingdao-agro:high_standard_farmland_2025_311269', server: 'historical', category: 'high_standard_farmland', moduleKey: 'farmland', subId: 'highStandard', year: 2025 },
  // 农田监测 > 基本农田保护监测
  { layerName: 'qingdao-agro:protection_monitoring_2025_r_902236', server: 'historical', category: 'protection_monitoring', moduleKey: 'farmland', subId: 'basicProtection', year: 2025 },






  // 粮食安全研判
  // 作物分布 > 玉米：线上已确认 2023、2024、2025 分别使用以下图层。
  { layerName: 'qingdao-agro:crop_distribution_2023_ym_419434', server: 'historical', category: 'crop_distribution', moduleKey: 'security', subId: 'cropDistribution', year: 2023, crop: 'ym', fallbackSrs: 'EPSG:4326' },
  { layerName: 'qingdao-agro:crop_distribution_2024_ym_765456', server: 'historical', category: 'crop_distribution', moduleKey: 'security', subId: 'cropDistribution', year: 2024, crop: 'ym', fallbackSrs: 'EPSG:4326' },
  { layerName: 'qingdao-agro:crop_distribution_2025_268271', server: 'historical', category: 'crop_distribution', moduleKey: 'security', subId: 'cropDistribution', year: 2025, crop: 'ym', fallbackSrs: 'EPSG:4326' },
  // 作物分布 > 小麦 > 2025：线上接口当前返回空地址；后续发布服务时替换 layerName 即可。
  { layerName: 'qingdao-agro:crop_distribution_2025_xm_default', server: 'new', category: 'crop_distribution', moduleKey: 'security', subId: 'cropDistribution', year: 2025, crop: 'xm' },
  // 产量预估 > 玉米 > 2025
  { layerName: 'qingdao-agro:crop_yield_2025_318587', server: 'historical', category: 'crop_yield', moduleKey: 'security', subId: 'yieldEstimate', year: 2025, crop: 'ym' },
  // 产量预估 > 小麦 > 2025
  { layerName: 'qingdao-agro:crop_yield_2025_xm_945836', server: 'historical', category: 'crop_yield', moduleKey: 'security', subId: 'yieldEstimate', year: 2025, crop: 'xm' },




  // 粮食生产预警 > 气象灾害分析 > 病虫害
  { layerName: 'qingdao-agro:pest_warning_20250810_298143', server: 'historical', category: 'pest_warning', moduleKey: 'warning', subId: 'weatherDisaster', year: 2025, date: '08-10' },
  { layerName: 'qingdao-agro:pest_warning_20250919_ym_950509', server: 'historical', category: 'pest_warning', moduleKey: 'warning', subId: 'weatherDisaster', year: 2025, date: '09-19', crop: 'ym' },
  // 粮食生产预警 > 生育期分析
  // date 是时间线接口的请求日期，可能与实际图层文件名中的日期不同。
  { layerName: 'qingdao-agro:reproductive_period_20250710_993938', server: 'historical', category: 'reproductive_period', moduleKey: 'warning', subId: 'growthStage', year: 2025, date: '06-26', crop: 'ym', stageLabel: '播种期', fallbackSrs: 'EPSG:4326' },
  { layerName: 'qingdao-agro:reproductive_period_20250810_ym_499672', server: 'historical', category: 'reproductive_period', moduleKey: 'warning', subId: 'growthStage', year: 2025, date: '08-11', crop: 'ym', stageLabel: '抽穗期', fallbackSrs: 'EPSG:4326' },
  { layerName: 'qingdao-agro:reproductive_period_20250910_814792', server: 'historical', category: 'reproductive_period', moduleKey: 'warning', subId: 'growthStage', year: 2025, date: '09-10', crop: 'ym', stageLabel: '乳熟期', fallbackSrs: 'EPSG:4326' },
  { layerName: 'qingdao-agro:reproductive_period_20251101_xm_596820', server: 'historical', category: 'reproductive_period', moduleKey: 'warning', subId: 'growthStage', year: 2025, date: '11-30', crop: 'xm', stageLabel: '出苗期', fallbackSrs: 'EPSG:32650' },
  { layerName: 'qingdao-agro:reproductive_period_20251221_xm_983883', server: 'historical', category: 'reproductive_period', moduleKey: 'warning', subId: 'growthStage', year: 2025, date: '12-21', crop: 'xm', stageLabel: '越冬期', fallbackSrs: 'EPSG:4326' },
  // 粮食生产预警 > 苗情分析
  { layerName: 'qingdao-agro:seedling_condition_20250710_170465', server: 'historical', category: 'seedling_condition', moduleKey: 'warning', subId: 'seedling', year: 2025, date: '07-10' },
  { layerName: 'qingdao-agro:seedling_condition_20250710_ym_967576', server: 'historical', category: 'seedling_condition', moduleKey: 'warning', subId: 'seedling', year: 2025, date: '07-10', crop: 'ym' },
  { layerName: 'qingdao-agro:seedling_condition_20250810_133246', server: 'historical', category: 'seedling_condition', moduleKey: 'warning', subId: 'seedling', year: 2025, date: '08-10' },
  { layerName: 'qingdao-agro:seedling_condition_20250910_143522', server: 'historical', category: 'seedling_condition', moduleKey: 'warning', subId: 'seedling', year: 2025, date: '09-10' },
  { layerName: 'qingdao-agro:seedling_condition_20250911_952708', server: 'historical', category: 'seedling_condition', moduleKey: 'warning', subId: 'seedling', year: 2025, date: '09-11' },
  // 2026及以后图层
  // 粮食安全研判 > 作物分布
  { layerName: 'qingdao-agro:crop_distribution_2026_xm_954713', server: 'new', fallbackServer: 'historical', fallbackSrs: 'EPSG:4326', category: 'crop_distribution', moduleKey: 'security', subId: 'cropDistribution', year: 2026, crop: 'xm' },
  // 粮食安全研判 > 产量预估
  { layerName: 'qingdao-agro:crop_yield_2026_xm_348459', server: 'new', category: 'crop_yield', moduleKey: 'security', subId: 'yieldEstimate', year: 2026, crop: 'xm' },
  // 粮食生产预警 > 气象灾害分析 > 病虫害
  { layerName: 'qingdao-agro:pest_warning_20260420_xm_353753', server: 'new', category: 'pest_warning', moduleKey: 'warning', subId: 'weatherDisaster', year: 2026, date: '04-20', crop: 'xm' },
  { layerName: 'qingdao-agro:pest_warning_20260429_xm_313537', server: 'new', category: 'pest_warning', moduleKey: 'warning', subId: 'weatherDisaster', year: 2026, date: '04-29', crop: 'xm' },
  // 农田监测 > 基本农田保护监测
  { layerName: 'qingdao-agro:protection_monitoring_2026_l_188863', server: 'new', category: 'protection_monitoring', moduleKey: 'farmland', subId: 'basicProtection', year: 2026 },
  // 粮食生产预警 > 生育期分析
  { layerName: 'qingdao-agro:reproductive_period_20260310_xm_999535', server: 'new', fallbackServer: 'historical', category: 'reproductive_period', moduleKey: 'warning', subId: 'growthStage', year: 2026, date: '03-10', crop: 'xm', stageLabel: '返青-起身期', fallbackSrs: 'EPSG:4326' },
  { layerName: 'qingdao-agro:reproductive_period_20260502_xm_366576', server: 'new', fallbackServer: 'historical', category: 'reproductive_period', moduleKey: 'warning', subId: 'growthStage', year: 2026, date: '05-02', crop: 'xm', stageLabel: '抽穗-开花期', fallbackSrs: 'EPSG:4326' },
  { layerName: 'qingdao-agro:reproductive_period_20260525_xm_608968', server: 'new', fallbackServer: 'historical', category: 'reproductive_period', moduleKey: 'warning', subId: 'growthStage', year: 2026, date: '05-25', crop: 'xm', stageLabel: '灌浆期', fallbackSrs: 'EPSG:32651' },
  // 粮食生产预警 > 苗情分析
  { layerName: 'qingdao-agro:seedling_condition_20260228_xm_732601', server: 'new', category: 'seedling_condition', moduleKey: 'warning', subId: 'seedling', year: 2026, date: '02-28', crop: 'xm' },
  { layerName: 'qingdao-agro:seedling_condition_20260320_xm_861932', server: 'new', category: 'seedling_condition', moduleKey: 'warning', subId: 'seedling', year: 2026, date: '03-20', crop: 'xm' },
  { layerName: 'qingdao-agro:seedling_condition_20260410_xm_146049', server: 'new', category: 'seedling_condition', moduleKey: 'warning', subId: 'seedling', year: 2026, date: '04-10', crop: 'xm' },
  { layerName: 'qingdao-agro:seedling_condition_20260511_xm_496024', server: 'new', category: 'seedling_condition', moduleKey: 'warning', subId: 'seedling', year: 2026, date: '05-11', crop: 'xm' },
  { layerName: 'qingdao-agro:seedling_condition_20260515_xm_244391', server: 'new', fallbackServer: 'historical', fallbackSrs: 'EPSG:4326', category: 'seedling_condition', moduleKey: 'warning', subId: 'seedling', year: 2026, date: '05-15', crop: 'xm' },
  { layerName: 'qingdao-agro:seedling_condition_20260516_xm_422005', server: 'new', category: 'seedling_condition', moduleKey: 'warning', subId: 'seedling', year: 2026, date: '05-16', crop: 'xm' },
]

export const historicalGeoServerLayers = geoServerLayers.filter((entry) => entry.server === 'historical')
export const newGeoServerLayers = geoServerLayers.filter((entry) => entry.server === 'new')

export function resolveCatalogServer(
  entry: Pick<GeoServerCatalogEntry, 'server'> | undefined,
  effectiveYear: number,
  newGeoServerStartYear: number,
): GeoServerSource {
  return entry?.server ?? (effectiveYear < newGeoServerStartYear ? 'historical' : 'new')
}

function normalizeCatalogCrop(crop?: string): 'xm' | 'ym' | undefined {
  const value = crop?.trim().toLowerCase()
  if (value === 'wheat' || value === 'xm' || value === '小麦') return 'xm'
  if (value === 'corn' || value === 'ym' || value === '玉米') return 'ym'
  return undefined
}

function selectCropEntries(
  entries: readonly GeoServerCatalogEntry[],
  crop?: string,
  exactCrop = false,
): GeoServerCatalogEntry[] {
  const normalizedCrop = normalizeCatalogCrop(crop)
  if (!normalizedCrop) return [...entries]
  const cropMatches = entries.filter((entry) => entry.crop === normalizedCrop)
  if (exactCrop) return cropMatches
  return cropMatches.length ? cropMatches : entries.filter((entry) => !entry.crop)
}

function requiresExactCrop(columnKey?: string): boolean {
  return columnKey === 'crop_distribution' || columnKey === 'crop_yield' || columnKey === 'reproductive_period'
}

function catalogPeriod(context: { date?: string; timelineText?: string }): string | undefined {
  const dateMatch = context.date?.match(/^\d{4}-(\d{2}-\d{2})/u)?.[1]
  if (dateMatch) return dateMatch
  const timelineMatch = context.timelineText?.match(/(?:\d{4}[-/. ])?(\d{1,2})[-/.](\d{1,2})/u)
  return timelineMatch ? `${timelineMatch[1].padStart(2, '0')}-${timelineMatch[2].padStart(2, '0')}` : undefined
}

export function findGeoServerCatalogEntry(context: {
  moduleKey?: ModuleKey
  subId: string
  year: number
  crop?: string
  date?: string
  timelineText?: string
}): GeoServerCatalogEntry | undefined {
  const columnKey = context.moduleKey
    ? resolveMapColumnKey({ moduleKey: context.moduleKey, subId: context.subId, crop: context.crop })
    : undefined
  let candidates = geoServerLayers.filter((entry) =>
    entry.subId === context.subId
    && entry.year === context.year
    && (!context.moduleKey || entry.moduleKey === context.moduleKey)
    && (!columnKey || entry.category === columnKey),
  )
  candidates = selectCropEntries(candidates, context.crop, requiresExactCrop(columnKey))
  const period = catalogPeriod(context)
  if (period) {
    const periodMatches = candidates.filter((entry) => entry.date === period)
    if (periodMatches.length) candidates = periodMatches
  }
  return candidates.length === 1 ? candidates[0] : undefined
}

export function resolveMapTimeline(context: {
  moduleKey: ModuleKey
  subId: string
  year?: number
  crop?: string
  date?: string
}): TimelineItem[] {
  const columnKey = resolveMapColumnKey(context)
  const candidates = geoServerLayers.filter((entry) =>
    entry.moduleKey === context.moduleKey
    && entry.subId === context.subId
    && (!columnKey || entry.category === columnKey),
  )
  const years = [...new Set(candidates.map((entry) => entry.year))]
  const matchingEntries = years.flatMap((year) =>
    selectCropEntries(
      candidates.filter((entry) => entry.year === year),
      context.crop,
      requiresExactCrop(columnKey),
    ),
  )
  const values = [...new Set(matchingEntries.map((entry) =>
    entry.date ? `${entry.year}-${entry.date}` : String(entry.year),
  ))].sort()
  if (!values.length) return []

  const requestedDate = context.date?.slice(0, 10)
  const requestedYearValue = context.year === undefined
    ? undefined
    : [...values].reverse().find((value) => value === String(context.year) || value.startsWith(`${context.year}-`))
  const activeValue = requestedDate && values.includes(requestedDate)
    ? requestedDate
    : requestedYearValue ?? values.at(-1)
  return values.map((date) => ({ label: '', date, active: date === activeValue }))
}

export function resolveCatalogMapServiceFallback(
  context: {
    moduleKey: ModuleKey
    subId: string
    year: number
    crop?: string
    date?: string
    timelineText?: string
  },
  runtime: MapServiceRuntimeConfig,
): string | undefined {
  const entry = findGeoServerCatalogEntry(context)
  // 仅对已从线上响应确认过完整 WMS 参数的图层启用兜底；空服务页面继续前端着色。
  if (!entry?.fallbackSrs) return undefined

  const source = entry.fallbackServer ?? entry.server
  const enabled = source === 'historical'
    ? runtime.historicalGeoServerEnabled
    : runtime.newGeoServerEnabled
  const baseUrl = source === 'historical'
    ? runtime.historicalGeoServerBaseUrl
    : runtime.newGeoServerBaseUrl
  const qualifiedName = entry.layerName.match(/^([A-Za-z0-9_.-]+):([A-Za-z0-9_.-]+)$/u)
  if (!enabled || !baseUrl.trim() || !qualifiedName) return undefined

  const query = new URLSearchParams({
    service: 'WMS',
    version: '1.1.0',
    request: 'GetMap',
    layers: entry.layerName,
    styles: '',
    format: 'image/png',
    transparent: 'true',
    width: '256',
    height: '256',
    srs: entry.fallbackSrs,
  })
  return `${baseUrl.replace(/\/+$/u, '')}/${qualifiedName[1]}/wms?${query.toString()}`
}
