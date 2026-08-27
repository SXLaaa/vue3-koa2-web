<template>
  <div
    ref="mapEl"
    class="dashboard-map"
    :data-basemap-provider="activeBasemap"
    :data-geoserver-layer="activeGeoServerLayerName || undefined"
  />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import Feature from 'ol/Feature'
import Map from 'ol/Map'
import View from 'ol/View'
import { defaults as defaultControls } from 'ol/control/defaults'
import type { EventsKey } from 'ol/events'
import Point from 'ol/geom/Point'
import MultiPolygon from 'ol/geom/MultiPolygon'
import Polygon from 'ol/geom/Polygon'
import ImageLayer from 'ol/layer/Image'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import { unByKey } from 'ol/Observable'
import { fromLonLat } from 'ol/proj'
import ImageStatic from 'ol/source/ImageStatic'
import VectorSource from 'ol/source/Vector'
import WMTS from 'ol/source/WMTS'
import TileWMS from 'ol/source/TileWMS'
import XYZ from 'ol/source/XYZ'
import CircleStyle from 'ol/style/Circle'
import Fill from 'ol/style/Fill'
import Stroke from 'ol/style/Stroke'
import Style from 'ol/style/Style'
import Text from 'ol/style/Text'
import WMTSTileGrid from 'ol/tilegrid/WMTS'
import { getRuntimeConfig } from '@/config/services'
import { qingdaoDistricts } from '@/mock/qingdaoDistricts'
import {
  resolveGeoServerLayer,
  type GeoServerLayerDecision,
} from '@/services/geoserverLayerResolver'
import type { DistrictPosition, QingdaoDistrict } from '@/mock/qingdaoDistricts'
import type { DistrictStat, MapTheme, ScreenPayload } from '@/types/dashboard'
import 'ol/ol.css'

const props = withDefaults(
  defineProps<{
    dataset: ScreenPayload
    selectedDistrict?: DistrictStat | null
    activeCrop?: string
    timelineText?: string
  }>(),
  {
    activeCrop: '',
    timelineText: '',
  },
)

const emit = defineEmits<{
  selectDistrict: [district: DistrictStat | null]
}>()

const mapEl = ref<HTMLElement | null>(null)
const activeBasemap = ref<'none' | 'custom'>('none')
const activeGeoServerLayerName = ref('')
const FOCUSED_CENTER: DistrictPosition = [120.82683764205977, 36.43041274353348]
const TASK_HIDDEN_DISTRICTS = new Set(['市南区', '市北区'])
const GEOSERVER_WMTS_RESOLUTIONS = Array.from(
  { length: 22 },
  (_, zoom) => 0.703125 / 2 ** zoom,
)
const GEOSERVER_WMTS_MATRIX_IDS = GEOSERVER_WMTS_RESOLUTIONS.map(
  (_, zoom) => `EPSG:4326:${zoom}`,
)
let map: Map | null = null
let baseLayers: TileLayer<XYZ>[] = []
let geoServerLayer: TileLayer<WMTS> | TileLayer<XYZ> | TileLayer<TileWMS> | ImageLayer<ImageStatic> | null = null
let geoServerLayerKey = ''
let districtSource = new VectorSource()
let pixelSource = new VectorSource()
let eventKeys: EventsKey[] = []
let resizeObserver: ResizeObserver | null = null
let croplandPattern: CanvasPattern | null = null
let standardFarmlandPattern: CanvasPattern | null = null
const pixelStyleCache = new globalThis.Map<string, Style>()

function createTileLayer(
  template: string,
  className: string,
): TileLayer<XYZ> {
  return new TileLayer({
    className,
    opacity: 0.6,
    source: new XYZ({
      url: template,
      crossOrigin: 'anonymous',
      maxZoom: 18,
    }),
  })
}

function createGeoServerWmtsLayer(decision: GeoServerLayerDecision): TileLayer<WMTS> {
  const source = new WMTS({
    url: decision.wmtsUrl,
    layer: decision.layerName,
    matrixSet: 'EPSG:4326',
    format: 'image/png',
    projection: 'EPSG:4326',
    requestEncoding: 'KVP',
    style: '',
    tileGrid: new WMTSTileGrid({
      extent: [-180, -90, 180, 90],
      origin: [-180, 90],
      resolutions: GEOSERVER_WMTS_RESOLUTIONS,
      matrixIds: GEOSERVER_WMTS_MATRIX_IDS,
      tileSize: [256, 256],
    }),
    transition: 0,
    wrapX: false,
    crossOrigin: 'anonymous',
  })

  return new TileLayer({
    className: 'business-layer geoserver-wmts-layer',
    opacity: 1,
    source,
    zIndex: 5,
  })
}

function createServiceQueryLayer(url: string): TileLayer<XYZ> {
  return new TileLayer({
    className: 'business-layer api-query-layer',
    opacity: 1,
    source: new XYZ({
      url: url.replace('{format}', 'png'),
      crossOrigin: 'anonymous',
    }),
    zIndex: 5,
  })
}

function createServiceWmsLayer(url: string): TileLayer<TileWMS> | null {
  let parsed: URL
  try {
    parsed = new URL(url, window.location.origin)
  } catch {
    return null
  }
  const layerName = parsed.searchParams.get('layers')?.trim()
  if (!layerName) return null
  const endpoint = url.startsWith('/') ? parsed.pathname : `${parsed.origin}${parsed.pathname}`

  return new TileLayer({
    className: 'business-layer api-wms-layer',
    opacity: 1,
    source: new TileWMS({
      url: endpoint,
      params: {
        LAYERS: layerName,
        STYLES: parsed.searchParams.get('styles') ?? '',
        FORMAT: parsed.searchParams.get('format') ?? 'image/png',
        TRANSPARENT: parsed.searchParams.get('transparent') ?? 'true',
        VERSION: parsed.searchParams.get('version') ?? '1.1.0',
      },
      crossOrigin: 'anonymous',
      serverType: 'geoserver',
      transition: 0,
    }),
    zIndex: 5,
  })
}

function createServiceImageLayer(url: string, extent: [number, number, number, number]): ImageLayer<ImageStatic> {
  return new ImageLayer({
    className: 'business-layer api-image-layer',
    opacity: 1,
    source: new ImageStatic({
      url,
      imageExtent: extent,
      projection: 'EPSG:4326',
      crossOrigin: 'anonymous',
    }),
    zIndex: 5,
  })
}

function clearGeoServerLayer(): void {
  if (geoServerLayer) {
    map?.removeLayer(geoServerLayer)
  }
  geoServerLayer = null
  geoServerLayerKey = ''
  activeGeoServerLayerName.value = ''
}

function syncGeoServerLayer(dataset: ScreenPayload): boolean {
  if (dataset.map.serviceMode === 'layer' && dataset.map.serviceUrl) {
    const nextKey = `wms|${dataset.map.serviceUrl}`
    if (nextKey === geoServerLayerKey) return true
    const serviceLayer = createServiceWmsLayer(dataset.map.serviceUrl)
    if (serviceLayer && map) {
      clearGeoServerLayer()
      geoServerLayer = serviceLayer
      geoServerLayerKey = nextKey
      activeGeoServerLayerName.value = dataset.map.serviceLayerName ?? dataset.subId
      map.getLayers().insertAt(baseLayers.length, geoServerLayer)
      return true
    }
  }

  if (dataset.map.serviceMode === 'query' && dataset.map.serviceUrl) {
    const nextKey = `query|${dataset.map.serviceUrl}`
    if (nextKey === geoServerLayerKey) return true
    clearGeoServerLayer()
    if (!map) return false
    geoServerLayer = createServiceQueryLayer(dataset.map.serviceUrl)
    geoServerLayerKey = nextKey
    activeGeoServerLayerName.value = dataset.subId
    map.getLayers().insertAt(baseLayers.length, geoServerLayer)
    return true
  }

  if (dataset.map.serviceMode === 'image' && dataset.map.serviceUrl && dataset.map.serviceExtent) {
    const nextKey = `image|${dataset.map.serviceUrl}|${dataset.map.serviceExtent.join(',')}`
    if (nextKey === geoServerLayerKey) return true
    clearGeoServerLayer()
    if (!map) return false
    geoServerLayer = createServiceImageLayer(dataset.map.serviceUrl, dataset.map.serviceExtent)
    geoServerLayerKey = nextKey
    activeGeoServerLayerName.value = dataset.subId
    map.getLayers().insertAt(baseLayers.length, geoServerLayer)
    return true
  }

  const runtime = getRuntimeConfig()
  const decision = resolveGeoServerLayer(
    {
      moduleKey: dataset.moduleKey,
      subId: dataset.subId,
      pageYear: dataset.year,
      crop: props.activeCrop || dataset.crop,
      timelineText: props.timelineText,
      apiLayerName: dataset.map.serviceMode === 'layer' ? dataset.map.serviceLayerName : undefined,
    },
    runtime,
  )
  const nextKey = decision ? `${decision.wmtsUrl}|${decision.layerName}` : ''
  if (nextKey === geoServerLayerKey) return Boolean(decision)

  clearGeoServerLayer()
  if (!decision || !map) return false

  geoServerLayer = createGeoServerWmtsLayer(decision)
  geoServerLayerKey = nextKey
  activeGeoServerLayerName.value = decision.layerName
  map.getLayers().insertAt(baseLayers.length, geoServerLayer)
  return true
}

function createBaseLayers(): TileLayer<XYZ>[] {
  const runtime = getRuntimeConfig()
  if (runtime.basemapProvider !== 'custom' || !runtime.basemapImageryUrl) {
    activeBasemap.value = 'none'
    return []
  }

  // 底图只能由部署环境显式注入；仓库内不再内置任何在线瓦片地址。
  activeBasemap.value = 'custom'
  const layers = [createTileLayer(runtime.basemapImageryUrl, 'basemap-layer custom-imagery-layer')]
  if (runtime.basemapShowLabels && runtime.basemapAnnotationUrl) {
    layers.push(createTileLayer(runtime.basemapAnnotationUrl, 'basemap-layer custom-annotation-layer'))
  }
  return layers
}

function themeColor(theme: MapTheme, stat?: DistrictStat): string {
  const level = stat?.level ?? 'normal'
  const palettes: Record<MapTheme, Record<string, string>> = {
    cropland: { low: 'rgba(246, 235, 37, 0.52)', normal: 'rgba(246, 235, 37, 0.6)', good: 'rgba(246, 235, 37, 0.72)', high: 'rgba(246, 235, 37, 0.82)', risk: 'rgba(246, 120, 37, 0.75)' },
    standard: { low: 'rgba(28, 210, 206, 0.35)', normal: 'rgba(28, 210, 206, 0.5)', good: 'rgba(32, 230, 190, 0.64)', high: 'rgba(45, 245, 198, 0.75)', risk: 'rgba(246, 120, 37, 0.72)' },
    protection: { low: 'rgba(66, 160, 255, 0.35)', normal: 'rgba(244, 194, 74, 0.55)', good: 'rgba(244, 194, 74, 0.6)', high: 'rgba(244, 194, 74, 0.66)', risk: 'rgba(236, 87, 68, 0.7)' },
    greenGrain: { low: 'rgba(46, 193, 255, 0.28)', normal: 'rgba(50, 226, 120, 0.45)', good: 'rgba(50, 226, 120, 0.6)', high: 'rgba(50, 226, 120, 0.78)', risk: 'rgba(236, 87, 68, 0.7)' },
    task: { low: 'rgba(217, 83, 5, 0.62)', normal: 'rgba(216, 145, 49, 0.62)', good: 'rgba(216, 145, 49, 0.72)', high: 'rgba(28, 232, 137, 0.72)', risk: 'rgba(217, 83, 5, 0.72)' },
    crop: { low: 'rgba(246, 206, 74, 0.35)', normal: 'rgba(246, 206, 74, 0.52)', good: 'rgba(246, 206, 74, 0.66)', high: 'rgba(246, 206, 74, 0.78)', risk: 'rgba(239, 104, 64, 0.72)' },
    yield: { low: 'rgba(239, 104, 64, 0.52)', normal: 'rgba(239, 211, 74, 0.56)', good: 'rgba(239, 211, 74, 0.68)', high: 'rgba(43, 231, 123, 0.72)', risk: 'rgba(239, 104, 64, 0.72)' },
    growth: { low: 'rgba(242, 200, 56, 0.42)', normal: 'rgba(239, 128, 48, 0.55)', good: 'rgba(239, 104, 40, 0.65)', high: 'rgba(255, 88, 37, 0.74)', risk: 'rgba(255, 88, 37, 0.82)' },
    seedling: { low: 'rgba(240, 77, 77, 0.5)', normal: 'rgba(240, 211, 77, 0.55)', good: 'rgba(52, 223, 127, 0.64)', high: 'rgba(52, 223, 127, 0.75)', risk: 'rgba(240, 77, 77, 0.68)' },
    maturity: { low: 'rgba(57, 204, 114, 0.45)', normal: 'rgba(239, 211, 68, 0.55)', good: 'rgba(239, 139, 50, 0.64)', high: 'rgba(233, 82, 53, 0.72)', risk: 'rgba(233, 82, 53, 0.82)' },
    weather: { low: 'rgba(46, 193, 255, 0.45)', normal: 'rgba(244, 196, 68, 0.55)', good: 'rgba(49, 214, 120, 0.6)', high: 'rgba(242, 94, 53, 0.72)', risk: 'rgba(202, 36, 57, 0.78)' },
  }
  return palettes[theme][level] ?? palettes[theme].normal
}

function getCroplandPattern(): CanvasPattern | string {
  if (croplandPattern) return croplandPattern

  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const context = canvas.getContext('2d')
  if (!context) return 'rgba(246, 240, 31, 0.86)'

  context.fillStyle = 'rgba(253, 250, 24, 0.94)'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.globalCompositeOperation = 'destination-out'

  for (let index = 0; index < 880; index += 1) {
    const centerX = seeded(index * 41 + 7) * canvas.width
    const centerY = seeded(index * 67 + 19) * canvas.height
    const radius =
      index < 720
        ? 0.45 + seeded(index * 31 + 29) * 2.4
        : 2.3 + seeded(index * 31 + 29) * 4.5
    const vertexCount = 5 + Math.floor(seeded(index * 23 + 43) * 4)
    context.globalAlpha = 0.42 + seeded(index * 53 + 61) * 0.54
    context.beginPath()

    for (let vertex = 0; vertex < vertexCount; vertex += 1) {
      const angle = (Math.PI * 2 * vertex) / vertexCount
      const vertexRadius = radius * (0.62 + seeded(index * 97 + vertex * 17) * 0.58)
      const x = centerX + Math.cos(angle) * vertexRadius
      const y = centerY + Math.sin(angle) * vertexRadius
      if (vertex === 0) context.moveTo(x, y)
      else context.lineTo(x, y)
    }

    context.closePath()
    context.fill()
  }

  context.globalAlpha = 1
  context.globalCompositeOperation = 'source-over'
  croplandPattern = context.createPattern(canvas, 'repeat')
  return croplandPattern ?? 'rgba(246, 240, 31, 0.86)'
}

function getStandardFarmlandPattern(): CanvasPattern | string {
  if (standardFarmlandPattern) return standardFarmlandPattern

  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const context = canvas.getContext('2d')
  if (!context) return 'rgba(0, 226, 166, 0.82)'

  context.fillStyle = 'rgba(0, 226, 166, 0.82)'
  for (let cluster = 0; cluster < 12; cluster += 1) {
    const centerX = seeded(cluster * 83 + 11) * canvas.width
    const centerY = seeded(cluster * 61 + 37) * canvas.height

    for (let parcel = 0; parcel < 5; parcel += 1) {
      const seed = cluster * 173 + parcel * 29
      const x = centerX + (seeded(seed + 3) - 0.5) * 92
      const y = centerY + (seeded(seed + 7) - 0.5) * 92
      const width = 6 + seeded(seed + 13) * 23
      const height = 5 + seeded(seed + 17) * 19
      const angle = (seeded(seed + 23) - 0.5) * 0.42
      context.save()
      context.translate(x, y)
      context.rotate(angle)
      context.fillRect(-width / 2, -height / 2, width, height)
      context.restore()
    }
  }

  standardFarmlandPattern = context.createPattern(canvas, 'repeat')
  return standardFarmlandPattern ?? 'rgba(0, 226, 166, 0.82)'
}

function labelText(stat: DistrictStat | undefined, theme: MapTheme): string {
  if (!stat) return ''
  if (['protection', 'growth', 'seedling', 'maturity', 'weather'].includes(theme)) return stat.name
  return `${stat.name}\n${stat.value}${stat.unit}${stat.rate ? `\n完成率:${stat.rate}%` : ''}`
}

function createDistrictStyle(feature: Feature, dataset: ScreenPayload): Style[] {
  const boundaryOnly = feature.get('boundaryOnly') === true
  if (boundaryOnly) {
    return [
      new Style({
        fill: new Fill({ color: 'rgba(0, 0, 0, 0)' }),
        stroke: new Stroke({
          color: 'rgba(7, 248, 237, 0.9)',
          width: 1.5,
        }),
      }),
    ]
  }

  const stat = feature.get('stat') as DistrictStat | undefined
  const districtName = feature.get('district') as string
  const isSelected = props.selectedDistrict?.name === districtName
  const isCropland = dataset.map.theme === 'cropland'
  const isStandardFarmland = dataset.map.theme === 'standard'
  const showStandardDistrictName =
    isStandardFarmland && ['城阳区', '李沧区', '崂山区'].includes(districtName)
  const croplandFill =
    stat && stat.level !== 'low' ? getCroplandPattern() : 'rgba(12, 45, 54, 0.06)'
  const standardFill =
    stat && stat.level !== 'low'
      ? getStandardFarmlandPattern()
      : 'rgba(12, 45, 54, 0.04)'
  const styles = [
    new Style({
      fill: new Fill({
        color: isCropland
          ? croplandFill
          : isStandardFarmland
            ? standardFill
          : dataset.map.showPixelOverlay
            ? 'rgba(12, 45, 54, 0.08)'
            : themeColor(dataset.map.theme, stat),
      }),
      stroke: new Stroke({
        color: isSelected ? '#fff' : 'rgba(7, 248, 237, 0.8)',
        width: isSelected ? 4 : 1.5,
      }),
    }),
  ]

  if (isCropland) {
    if (!stat && districtName !== '李沧区') return styles

    styles.push(
      new Style({
        geometry: new Point(feature.get('labelCoordinate')),
        text: new Text({
          text: districtName,
          offsetY: 0,
          fill: new Fill({ color: '#fff' }),
          stroke: new Stroke({ color: 'rgba(0, 0, 0, 0.5)', width: 3 }),
          font: '16px Microsoft YaHei, sans-serif',
          overflow: true,
          textAlign: 'center',
        }),
      }),
    )

    if (stat) {
      styles.push(
        new Style({
          geometry: new Point(feature.get('labelCoordinate')),
          text: new Text({
            text: `${stat.value}${stat.unit}`,
            offsetY: 30,
            padding: [5, 0, 2, 5],
            fill: new Fill({ color: '#f5ffff' }),
            backgroundFill: new Fill({ color: 'rgba(21, 152, 220, 0.6)' }),
            font: '700 14px Microsoft YaHei, sans-serif',
            overflow: true,
            textAlign: 'center',
          }),
        }),
      )
    }

    return styles
  }

  if (dataset.map.theme === 'task') {
    if (stat || !TASK_HIDDEN_DISTRICTS.has(districtName)) {
      styles.push(
        new Style({
          geometry: new Point(feature.get('labelCoordinate')),
          text: new Text({
            text: districtName,
            offsetY: -2,
            fill: new Fill({ color: '#fff' }),
            stroke: new Stroke({ color: 'rgba(0, 21, 42, 0.85)', width: 4 }),
            font: '14px Microsoft YaHei, sans-serif',
            overflow: true,
            textAlign: 'center',
          }),
        }),
      )
    }

    if (stat) {
      styles.push(
        new Style({
          geometry: new Point(feature.get('labelCoordinate')),
          text: new Text({
            text: `${stat.value}${stat.unit}\n完成率:${stat.rate ?? 0}%`,
            offsetY: 30,
            padding: [3, 5, 3, 5],
            fill: new Fill({ color: '#fff' }),
            backgroundFill: new Fill({ color: 'rgba(21, 152, 220, 0.82)' }),
            font: '700 13px Microsoft YaHei, sans-serif',
            overflow: true,
            textAlign: 'center',
          }),
        }),
      )
    }
  } else if (stat || showStandardDistrictName) {
    styles.push(
      new Style({
        geometry: new Point(feature.get('labelCoordinate')),
        text: new Text({
          text: stat ? labelText(stat, dataset.map.theme) : districtName,
          fill: new Fill({ color: '#f5ffff' }),
          stroke: new Stroke({ color: 'rgba(0, 21, 42, 0.85)', width: 4 }),
          font: '700 14px Microsoft YaHei, sans-serif',
          overflow: true,
          textAlign: 'center',
        }),
      }),
    )
  }

  return styles
}

function createPixelStyle(feature: Feature, theme: MapTheme): Style {
  const level = feature.get('level') as DistrictStat['level']
  const overlayColor = feature.get('overlayColor') as string | undefined
  const color = overlayColor ??
    (theme === 'growth'
      ? level === 'risk'
        ? 'rgba(255, 71, 18, 0.88)'
        : 'rgba(255, 98, 28, 0.74)'
      : themeColor(theme, { name: '', value: 0, unit: '', level }))
  const compactPixel = ['growth', 'seedling', 'maturity', 'weather'].includes(theme)
  const cacheKey = `${color}|${compactPixel ? 'compact' : 'default'}`
  const cachedStyle = pixelStyleCache.get(cacheKey)
  if (cachedStyle) return cachedStyle

  const style = new Style({
    image: new CircleStyle({
      radius: compactPixel ? 1.2 : 1.45,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: 'rgba(0, 0, 0, 0.1)', width: 0.35 }),
    }),
  })
  pixelStyleCache.set(cacheKey, style)
  return style
}

function seeded(seed: number): number {
  const value = Math.sin(seed) * 10000
  return value - Math.floor(value)
}

function outerRings(district: QingdaoDistrict): DistrictPosition[][] {
  if (district.geometry.type === 'Polygon') return [district.geometry.coordinates[0]]
  return district.geometry.coordinates.map((polygon) => polygon[0])
}

function isFocusedCityScreen(dataset: ScreenPayload): boolean {
  return ['farmland', 'security', 'warning'].includes(dataset.moduleKey)
}

function createProjectedGeometry(district: QingdaoDistrict): Polygon | MultiPolygon {
  if (district.geometry.type === 'Polygon') {
    return new Polygon(
      district.geometry.coordinates.map((ring) => ring.map((coordinate) => fromLonLat(coordinate))),
    )
  }

  return new MultiPolygon(
    district.geometry.coordinates.map((polygon) =>
      polygon.map((ring) => ring.map((coordinate) => fromLonLat(coordinate))),
    ),
  )
}

function rebuildDistrictLayer(dataset: ScreenPayload, boundaryOnly = false): void {
  const features = qingdaoDistricts.map((district, index) => {
    const stat = boundaryOnly
      ? undefined
      : dataset.map.districtStats.find((item) => item.name === district.name)
    const geometry = createProjectedGeometry(district)
    const feature = new Feature({
      geometry,
      district: district.name,
      stat,
      boundaryOnly,
      labelCoordinate: fromLonLat(district.center),
    })
    feature.setId(`${district.name}-${index}`)
    return feature
  })

  districtSource.clear(true)
  districtSource.addFeatures(features)
}

function rebuildPixelLayer(dataset: ScreenPayload): void {
  pixelSource.clear(true)
  if (!dataset.map.showPixelOverlay) return
  if (dataset.map.theme === 'cropland' || dataset.map.theme === 'standard') return

  const features: Feature<Point>[] = []
  dataset.map.districtStats.forEach((stat, districtIndex) => {
    const district = qingdaoDistricts.find((item) => item.name === stat.name)
    if (!district) return
    const projectedGeometry = createProjectedGeometry(district)
    const positions = outerRings(district).flat()
    const longitudes = positions.map(([longitude]) => longitude)
    const latitudes = positions.map(([, latitude]) => latitude)
    const minLongitude = Math.min(...longitudes)
    const maxLongitude = Math.max(...longitudes)
    const minLatitude = Math.min(...latitudes)
    const maxLatitude = Math.max(...latitudes)
    const compactPixel = ['growth', 'seedling', 'maturity', 'weather'].includes(dataset.map.theme)
    const count =
      dataset.map.theme === 'protection'
        ? 110
        : compactPixel
          ? stat.level === 'risk'
            ? 240
            : 170
          : 180

    let accepted = 0
    for (let attempt = 0; accepted < count && attempt < count * 12; attempt += 1) {
      const longitude = minLongitude + seeded(attempt * 17 + districtIndex * 113) * (maxLongitude - minLongitude)
      const latitude = minLatitude + seeded(attempt * 31 + districtIndex * 47) * (maxLatitude - minLatitude)
      const coordinate = fromLonLat([longitude, latitude])
      if (!projectedGeometry.intersectsCoordinate(coordinate)) continue

      features.push(
        new Feature({
          geometry: new Point(coordinate),
          level: stat.level,
          overlayColor:
            dataset.map.theme === 'protection'
              ? ['rgba(31,232,136,0.85)', 'rgba(216,146,49,0.85)', 'rgba(61,215,253,0.85)', 'rgba(217,85,8,0.85)'][
                  (attempt + districtIndex) % 4
                ]
              : undefined,
        }),
      )
      accepted += 1
    }
  })
  pixelSource.addFeatures(features)
}

// 地图优先使用后端返回的同源服务元数据；未配置服务时仅绘制本地区县边界，不触发外部请求。
function syncMap(dataset: ScreenPayload): void {
  const hasGeoServerLayer = syncGeoServerLayer(dataset)
  if (hasGeoServerLayer) {
    rebuildDistrictLayer(dataset, true)
    pixelSource.clear(true)
  } else if (dataset.map.clientDistrictFill) {
    rebuildDistrictLayer(dataset)
    pixelSource.clear(true)
  } else if (!getRuntimeConfig().showMockMapFeatures) {
    rebuildDistrictLayer(dataset, true)
    pixelSource.clear(true)
  } else {
    rebuildDistrictLayer(dataset)
    rebuildPixelLayer(dataset)
  }

  const focusedCityScreen = isFocusedCityScreen(dataset)
  baseLayers.forEach((layer) => layer.setOpacity(0.6))
  map
    ?.getView()
    .setCenter(
      fromLonLat(
        focusedCityScreen
          ? FOCUSED_CENTER
          : [122.85, 36.5],
      ),
    )
  map?.getView().setZoom(focusedCityScreen ? 9.2 : 7.3)
}

onMounted(() => {
  if (!mapEl.value) return

  const districtLayer = new VectorLayer({
    source: districtSource,
    style: (feature) => createDistrictStyle(feature as Feature, props.dataset)[0],
    zIndex: 10,
  })

  const pixelLayer = new VectorLayer({
    source: pixelSource,
    style: (feature) => createPixelStyle(feature as Feature, props.dataset.map.theme),
    renderBuffer: 8,
    zIndex: 11,
  })

  const labelLayer = new VectorLayer({
    source: districtSource,
    style: (feature) => createDistrictStyle(feature as Feature, props.dataset).slice(1),
    zIndex: 12,
  })

  baseLayers = createBaseLayers()

  map = new Map({
    target: mapEl.value,
    controls: defaultControls({ attribution: false, zoom: false, rotate: false }),
    layers: [...baseLayers, districtLayer, pixelLayer, labelLayer],
    view: new View({
      center: fromLonLat([122.85, 36.5]),
      zoom: 7.3,
      minZoom: 6.7,
      maxZoom: 13,
    }),
  })

  syncMap(props.dataset)

  eventKeys.push(
    map.on('singleclick', (event) => {
      const feature = map?.forEachFeatureAtPixel(
        event.pixel,
        (candidate) => candidate,
        { layerFilter: (layer) => layer === districtLayer },
      ) as Feature | undefined
      const stat = feature?.get('stat') as DistrictStat | undefined
      emit('selectDistrict', stat ?? null)
    }),
  )

  resizeObserver = new ResizeObserver(() => map?.updateSize())
  resizeObserver.observe(mapEl.value)
})

watch(
  [() => props.dataset, () => props.activeCrop, () => props.timelineText],
  ([dataset]) => syncMap(dataset),
)

watch(
  () => props.selectedDistrict,
  () => districtSource.changed(),
)

onUnmounted(() => {
  eventKeys.forEach((key) => unByKey(key))
  eventKeys = []
  resizeObserver?.disconnect()
  clearGeoServerLayer()
  districtSource.clear(true)
  pixelSource.clear(true)
  baseLayers = []
  map?.setTarget(undefined)
  map = null
})
</script>
