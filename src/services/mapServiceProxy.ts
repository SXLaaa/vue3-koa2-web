const GEOSERVER_PATH = /^\/geoserver(?:\/|$)/u
const NEW_GEOSERVER_PROXY_PREFIX = '/map-service/new'

export function toSameOriginMapServiceUrl(
  value: string,
  effectiveYear: number | undefined,
  newGeoServerStartYear = 2026,
): string {
  if (value.startsWith('/')) return value

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return value
  }

  if (!GEOSERVER_PATH.test(parsed.pathname)) return value

  const useNewGeoServer = Number.isInteger(effectiveYear)
    && Number(effectiveYear) >= newGeoServerStartYear
  const proxyPrefix = useNewGeoServer ? NEW_GEOSERVER_PROXY_PREFIX : ''
  return `${proxyPrefix}${parsed.pathname}${parsed.search}`
}
