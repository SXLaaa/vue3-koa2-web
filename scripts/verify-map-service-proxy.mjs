import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const { toSameOriginMapServiceUrl } = await import('../src/services/mapServiceProxy.ts')

const historicalUrl = 'http://27.223.102.27:8081/geoserver/qingdao-agro/wms?service=WMS&layers=qingdao-agro%3Ahigh_standard_farmland_2025_311269'
const internalHistoricalUrl = 'http://192.168.71.209:8060/geoserver/qingdao-agro/wms?service=WMS&layers=qingdao-agro%3Afarmland_monitoring_2025_209664'
const newUrl = 'http://home.aceimage.cn:8081/geoserver/qingdao-agro/wms?service=WMS&layers=qingdao-agro%3Acrop_distribution_2026_xm_954713'

assert.equal(
  toSameOriginMapServiceUrl(historicalUrl, 2025, 2026),
  '/geoserver/qingdao-agro/wms?service=WMS&layers=qingdao-agro%3Ahigh_standard_farmland_2025_311269',
  '历史公网 GeoServer 必须改写为客户站点现有的同源 /geoserver 路径',
)
assert.equal(
  toSameOriginMapServiceUrl(internalHistoricalUrl, 2025, 2026),
  '/geoserver/qingdao-agro/wms?service=WMS&layers=qingdao-agro%3Afarmland_monitoring_2025_209664',
  '接口返回内网 GeoServer 地址时也不得直接暴露给浏览器',
)
assert.equal(
  toSameOriginMapServiceUrl(newUrl, 2026, 2026),
  '/map-service/new/geoserver/qingdao-agro/wms?service=WMS&layers=qingdao-agro%3Acrop_distribution_2026_xm_954713',
  '2026 及以后图层必须走独立的新 GeoServer 同源代理',
)
assert.equal(
  toSameOriginMapServiceUrl('/geoserver/qingdao-agro/wms?service=WMS', 2025, 2026),
  '/geoserver/qingdao-agro/wms?service=WMS',
  '后端已返回同源地址时必须保持不变',
)
assert.equal(
  toSameOriginMapServiceUrl('https://tiles.example.invalid/{z}/{x}/{y}.png', 2025, 2026),
  'https://tiles.example.invalid/{z}/{x}/{y}.png',
  '非 GeoServer 自定义瓦片地址不应被误改写',
)

const [adapterSource, viteSource, localhostEnv] = await Promise.all([
  readFile(new URL('../src/services/dashboardAdapters.ts', import.meta.url), 'utf8'),
  readFile(new URL('../vite.config.ts', import.meta.url), 'utf8'),
  readFile(new URL('../.env.localhost.local', import.meta.url), 'utf8'),
])
assert.match(adapterSource, /toSameOriginMapServiceUrl\(url, effectiveYear/u)
assert.match(viteSource, /'\/geoserver'/u, '本地开发必须代理历史 GeoServer 同源路径')
assert.match(viteSource, /'\/map-service\/new'/u, '本地开发必须代理新 GeoServer 同源路径')
assert.match(localhostEnv, /^LOCAL_HISTORICAL_GEOSERVER_TARGET=http:\/\/27\.223\.102\.27:8081$/mu)
assert.match(localhostEnv, /^LOCAL_NEW_GEOSERVER_TARGET=http:\/\/home\.aceimage\.cn:8081$/mu)

console.log('MAP_SERVICE_PROXY_CHECK=PASS historical=/geoserver new=/map-service/new/geoserver')
