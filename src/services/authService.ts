import {
  LOGIN_PATH,
  isTransportUnavailableError,
  type CaptchaResponse,
  type LoginApi,
  type LoginRequest,
  type LoginResponse,
} from './loginApi.ts'

export const AUTH_SESSION_KEY = 'main-grain.auth-session'
export const AUTH_LOGIN_PATH = LOGIN_PATH

const SESSION_VERSION = 1

export type AuthMode = 'mock' | 'api'

export interface AuthStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface LoginCredentials {
  username: string
  password: string
  code?: string
  uuid?: string
}

export interface AuthService {
  getCaptcha(): Promise<CaptchaResponse>
  login(credentials: LoginCredentials): Promise<void>
  isAuthenticated(): boolean
  getUsername(): string | null
  logout(): void
}

export type AuthLoginRequestDescriptor = LoginRequest
export type AuthLoginResponse = LoginResponse
export type AuthRequestExecutor = LoginApi

interface AuthSession {
  version: number
  username: string
  issuedAt: number
}

export interface CreateAuthServiceOptions {
  mode: AuthMode
  storage: AuthStorage
  executor?: AuthRequestExecutor
  allowLocalFallback?: boolean
}

const LOCAL_CAPTCHA_RESPONSE: CaptchaResponse = Object.freeze({
  msg: '本地开发模拟认证',
  img: '',
  code: 200,
  captchaEnabled: false,
  uuid: '',
  simulated: true,
})

function readSession(storage: AuthStorage): AuthSession | null {
  const rawSession = storage.getItem(AUTH_SESSION_KEY)
  if (!rawSession) return null

  try {
    const session: unknown = JSON.parse(rawSession)
    if (
      typeof session === 'object' &&
      session !== null &&
      (session as AuthSession).version === SESSION_VERSION &&
      typeof (session as AuthSession).username === 'string' &&
      (session as AuthSession).username.trim() !== '' &&
      typeof (session as AuthSession).issuedAt === 'number'
    ) {
      return session as AuthSession
    }
  } catch {
    // Invalid browser storage is treated as an expired session.
  }

  storage.removeItem(AUTH_SESSION_KEY)
  return null
}

export function createAuthService({
  mode,
  storage,
  executor,
  allowLocalFallback = false,
}: CreateAuthServiceOptions): AuthService {
  function requireExecutor(): AuthRequestExecutor {
    if (!executor) throw new Error('真实登录接口尚未配置')
    return executor
  }

  return {
    async getCaptcha() {
      if (mode === 'mock') return LOCAL_CAPTCHA_RESPONSE

      try {
        return await requireExecutor().getCaptcha()
      } catch (error) {
        if (allowLocalFallback && isTransportUnavailableError(error)) {
          return LOCAL_CAPTCHA_RESPONSE
        }
        throw error
      }
    },
    async login({ username, password, code = '', uuid = '' }) {
      const normalizedUsername = username.trim()
      if (!normalizedUsername || !password.trim()) {
        throw new Error('用户名和密码不能为空')
      }

      if (mode === 'api') {
        try {
          await requireExecutor().login({
            username: normalizedUsername,
            password,
            code: code.trim(),
            uuid: uuid.trim(),
          })
        } catch (error) {
          if (!(allowLocalFallback && isTransportUnavailableError(error))) throw error
        }
      }

      const session: AuthSession = {
        version: SESSION_VERSION,
        username: normalizedUsername,
        issuedAt: Date.now(),
      }
      storage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
    },
    isAuthenticated() {
      return readSession(storage) !== null
    },
    getUsername() {
      return readSession(storage)?.username ?? null
    },
    logout() {
      storage.removeItem(AUTH_SESSION_KEY)
    },
  }
}
