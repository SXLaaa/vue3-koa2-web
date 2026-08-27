export const CAPTCHA_PATH = '/captchaImage' as const
export const LOGIN_PATH = '/login' as const

export type LoginApiErrorKind =
  | 'timeout'
  | 'network'
  | 'service-unavailable'
  | 'http'
  | 'business'
  | 'invalid-response'

export interface CaptchaResponse {
  readonly msg: string
  readonly img: string
  readonly code: number
  readonly captchaEnabled: boolean
  readonly uuid: string
  readonly simulated?: boolean
}

export interface LoginRequest {
  readonly username: string
  readonly password: string
  readonly code: string
  readonly uuid: string
}

export interface LoginResponse {
  readonly code: number
  readonly msg: string
  readonly token: string
}

export interface LoginApi {
  getCaptcha(): Promise<CaptchaResponse>
  login(request: LoginRequest): Promise<LoginResponse>
}

export interface CreateLoginApiOptions {
  readonly baseUrl: string
  readonly timeoutMs?: number
  readonly fetchImpl?: typeof fetch
}

interface ResponseEnvelope {
  readonly code: number
  readonly msg: string
}

const SERVICE_UNAVAILABLE_STATUSES = new Set([502, 503, 504])

export class LoginApiError extends Error {
  readonly kind: LoginApiErrorKind
  readonly status?: number
  readonly businessCode?: number

  constructor(
    kind: LoginApiErrorKind,
    message: string,
    options: { readonly status?: number; readonly businessCode?: number; readonly cause?: unknown } = {},
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause })
    this.name = 'LoginApiError'
    this.kind = kind
    this.status = options.status
    this.businessCode = options.businessCode
  }
}

export function isTransportUnavailableError(error: unknown): error is LoginApiError {
  return (
    error instanceof LoginApiError &&
    (error.kind === 'timeout' ||
      error.kind === 'network' ||
      error.kind === 'service-unavailable')
  )
}

function normalizeRelativeBaseUrl(value: string): string {
  const normalized = value.trim().replace(/\/+$/u, '')
  if (
    !normalized.startsWith('/') ||
    normalized.startsWith('//') ||
    normalized.includes('\\') ||
    /[?#\s\u0000-\u001f\u007f]/u.test(normalized)
  ) {
    throw new Error('login API requires a safe relative base URL')
  }
  return normalized
}

function normalizeTimeout(value: number | undefined): number {
  const timeoutMs = value ?? 10_000
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error('login API timeoutMs must be a positive integer')
  }
  return timeoutMs
}

function readEnvelope(value: unknown): ResponseEnvelope {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new LoginApiError('invalid-response', '登录服务返回了无效响应')
  }

  const candidate = value as Partial<ResponseEnvelope>
  if (typeof candidate.code !== 'number' || typeof candidate.msg !== 'string') {
    throw new LoginApiError('invalid-response', '登录服务返回了无效响应')
  }
  return candidate as ResponseEnvelope
}

function requireBusinessSuccess(envelope: ResponseEnvelope): void {
  if (envelope.code !== 200) {
    throw new LoginApiError('business', envelope.msg || '登录请求被拒绝', {
      businessCode: envelope.code,
    })
  }
}

function readCaptcha(value: unknown): CaptchaResponse {
  const envelope = readEnvelope(value)
  requireBusinessSuccess(envelope)
  const candidate = value as Partial<CaptchaResponse>
  if (
    typeof candidate.img !== 'string' ||
    typeof candidate.captchaEnabled !== 'boolean' ||
    typeof candidate.uuid !== 'string' ||
    (candidate.captchaEnabled && (!candidate.img || !candidate.uuid))
  ) {
    throw new LoginApiError('invalid-response', '验证码服务返回了无效响应')
  }
  return {
    msg: envelope.msg,
    img: candidate.img,
    code: envelope.code,
    captchaEnabled: candidate.captchaEnabled,
    uuid: candidate.uuid,
  }
}

function readLogin(value: unknown): LoginResponse {
  const envelope = readEnvelope(value)
  requireBusinessSuccess(envelope)
  const candidate = value as Partial<LoginResponse>
  if (typeof candidate.token !== 'string' || !candidate.token.trim()) {
    throw new LoginApiError('invalid-response', '登录服务成功响应缺少会话令牌')
  }
  return { code: envelope.code, msg: envelope.msg, token: candidate.token }
}

export function createLoginApi({
  baseUrl,
  timeoutMs: requestedTimeout,
  fetchImpl = globalThis.fetch,
}: CreateLoginApiOptions): LoginApi {
  const normalizedBaseUrl = normalizeRelativeBaseUrl(baseUrl)
  const timeoutMs = normalizeTimeout(requestedTimeout)

  async function requestJson(path: string, init: RequestInit): Promise<unknown> {
    const controller = new AbortController()
    let timedOut = false
    const timeoutId = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, timeoutMs)

    try {
      let response: Response
      try {
        response = await fetchImpl(`${normalizedBaseUrl}${path}`, {
          ...init,
          signal: controller.signal,
        })
      } catch (error) {
        if (timedOut) {
          throw new LoginApiError('timeout', '登录服务请求超时', { cause: error })
        }
        if (error instanceof LoginApiError) throw error
        throw new LoginApiError('network', '无法连接登录服务', { cause: error })
      }

      if (!response.ok) {
        const kind = SERVICE_UNAVAILABLE_STATUSES.has(response.status)
          ? 'service-unavailable'
          : 'http'
        throw new LoginApiError(kind, `登录服务请求失败（HTTP ${response.status}）`, {
          status: response.status,
        })
      }

      try {
        return await response.json()
      } catch (error) {
        throw new LoginApiError('invalid-response', '登录服务返回了无法解析的响应', {
          cause: error,
        })
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  return {
    async getCaptcha() {
      return readCaptcha(
        await requestJson(CAPTCHA_PATH, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        }),
      )
    },
    async login(request) {
      return readLogin(
        await requestJson(LOGIN_PATH, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: request.username,
            password: request.password,
            code: request.code,
            uuid: request.uuid,
          }),
        }),
      )
    },
  }
}
