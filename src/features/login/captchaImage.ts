const CAPTCHA_MIME_PREFIXES = [
  ['PHN2Zy', 'image/svg+xml'],
  ['PD94bWwg', 'image/svg+xml'],
  ['iVBORw0KGgo', 'image/png'],
  ['R0lGOD', 'image/gif'],
  ['/9j/', 'image/jpeg'],
  ['UklGR', 'image/webp'],
] as const

// 兼容线上接口的 GIF/PNG 原始 Base64，也兼容本地 Koa 返回的 SVG 验证码。
export function toCaptchaImageUrl(image: string): string {
  const normalized = image.trim()
  if (!normalized || normalized.startsWith('data:')) return normalized

  const match = CAPTCHA_MIME_PREFIXES.find(([prefix]) => normalized.startsWith(prefix))
  const mimeType = match?.[1] ?? 'image/gif'
  return `data:${mimeType};base64,${normalized}`
}
