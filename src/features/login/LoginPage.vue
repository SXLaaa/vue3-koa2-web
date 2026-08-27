<template>
  <main
    class="admin-login"
    data-foundation-asset="login-background.png"
    data-testid="login-page"
    :data-captcha-mode="captchaSimulated ? 'simulated' : captchaEnabled ? 'remote' : 'disabled'"
    :style="{ backgroundImage: `url(${loginBackgroundUrl})` }"
  >
    <h1 class="admin-login__title" data-testid="login-title">{{ title }}</h1>

    <section
      class="admin-login__panel"
      aria-labelledby="admin-login-title"
      data-testid="login-panel"
    >
      <header class="admin-login__panel-heading">
        <h2 id="admin-login-title">欢迎登录</h2>
        <p>welcome to login</p>
      </header>

      <form class="admin-login__form" novalidate @submit.prevent="handleSubmit">
        <label class="admin-form-field" for="admin-username">
          <span class="admin-input" :class="{ 'has-error': errors.username }">
            <span class="admin-input__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" />
                <path d="M4.5 20c.7-4.2 3.2-6.2 7.5-6.2s6.8 2 7.5 6.2" />
              </svg>
            </span>
            <input
              id="admin-username"
              v-model="form.username"
              name="username"
              :aria-describedby="errors.username ? 'admin-username-error' : undefined"
              :aria-invalid="Boolean(errors.username)"
              autocomplete="username"
              maxlength="32"
              placeholder="请输入用户名"
              type="text"
              @input="clearFieldError('username')"
            />
          </span>
          <small id="admin-username-error" class="admin-form-field__error">
            {{ errors.username }}
          </small>
        </label>

        <label class="admin-form-field" for="admin-password">
          <span class="admin-input" :class="{ 'has-error': errors.password }">
            <span class="admin-input__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="5" y="10" width="14" height="10" rx="1" />
                <path d="M8 10V7.5a4 4 0 0 1 8 0V10M12 14v2.5" />
              </svg>
            </span>
            <input
              id="admin-password"
              v-model="form.password"
              name="password"
              :aria-describedby="errors.password ? 'admin-password-error' : undefined"
              :aria-invalid="Boolean(errors.password)"
              autocomplete="current-password"
              maxlength="64"
              placeholder="请输入密码"
              :type="showPassword ? 'text' : 'password'"
              @input="clearFieldError('password')"
            />
            <button
              class="admin-input__toggle"
              :aria-label="showPassword ? '隐藏密码' : '显示密码'"
              type="button"
              @click="showPassword = !showPassword"
            >
              <svg v-if="showPassword" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M3 12s3.2-5 9-5 9 5 9 5-3.2 5-9 5-9-5-9-5Z" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
              <svg v-else aria-hidden="true" viewBox="0 0 24 24">
                <path d="M4 4l16 16M9.8 7.3A9.7 9.7 0 0 1 12 7c5.8 0 9 5 9 5a14 14 0 0 1-2.2 2.7M6.2 8.5A14.7 14.7 0 0 0 3 12s3.2 5 9 5c.9 0 1.8-.1 2.5-.4" />
              </svg>
            </button>
          </span>
          <small id="admin-password-error" class="admin-form-field__error">
            {{ errors.password }}
          </small>
        </label>

        <label class="admin-form-field" for="admin-captcha">
          <span class="admin-login__captcha-row" data-testid="login-captcha-row">
            <span class="admin-input" :class="{ 'has-error': errors.code }">
              <span class="admin-input__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M5 4h14v16H5zM8 8h8M8 12h5M8 16h3" />
                </svg>
              </span>
              <input
                id="admin-captcha"
                v-model="form.code"
                name="code"
                :aria-describedby="errors.code ? 'admin-captcha-error' : undefined"
                :aria-invalid="Boolean(errors.code)"
                autocomplete="off"
                maxlength="8"
                placeholder="请输入验证码"
                type="text"
                @input="clearFieldError('code')"
              />
            </span>

            <button
              class="admin-login__captcha"
              data-testid="login-captcha-refresh"
              :disabled="captchaLoading"
              title="刷新验证码"
              type="button"
              @click="refreshCaptcha"
            >
              <img v-if="captchaImageUrl" :src="captchaImageUrl" alt="验证码，点击刷新" />
              <span v-else class="admin-login__captcha-placeholder">
                <span v-if="captchaLoading" class="admin-spinner" aria-hidden="true" />
                <template v-else-if="captchaSimulated">本地验证码</template>
                <template v-else-if="captchaError">点击刷新</template>
                <template v-else>验证码</template>
              </span>
            </button>
          </span>
          <small
            id="admin-captcha-error"
            class="admin-form-field__error"
            :class="{ 'is-muted': captchaSimulated && !errors.code && !captchaError }"
          >
            {{ errors.code || captchaError || (captchaSimulated ? '本地模拟无需验证码' : '') }}
          </small>
        </label>

        <p class="admin-login__notice" aria-live="polite" data-testid="login-notice">
          <span v-if="notice" :class="`is-${notice.type}`">{{ notice.message }}</span>
        </p>

        <button
          class="admin-login__submit"
          data-testid="login-submit"
          :disabled="submitting"
          type="submit"
        >
          <span v-if="submitting" class="admin-spinner" aria-hidden="true" />
          <span>{{ submitting ? '正在登录…' : '登 录' }}</span>
        </button>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import loginBackgroundUrl from '@/assets/login/loginBg.8736acfa.jpg'
import '@/assets/login/loginBtn.3a0cafe8.png'
import type { AuthService, LoginCredentials } from '@/services/authService'
import '@/styles/login.css'

const props = withDefaults(
  defineProps<{
    authService?: AuthService
    title?: string
  }>(),
  {
    title: '青岛市主粮作物遥感监测平台',
  },
)

const emit = defineEmits<{
  authenticated: []
}>()

type LoginField = 'username' | 'password' | 'code'

const submitting = ref(false)
const showPassword = ref(false)
const captchaLoading = ref(false)
const captchaEnabled = ref(true)
const captchaSimulated = ref(false)
const captchaImageUrl = ref('')
const captchaError = ref('')
const form = reactive<LoginCredentials>({ username: '', password: '', code: '', uuid: '' })
const errors = reactive<Record<LoginField, string>>({ username: '', password: '', code: '' })
const notice = ref<{ readonly type: 'success' | 'error'; readonly message: string } | null>(null)

function getAuthService(): AuthService {
  if (!props.authService) throw new Error('登录服务尚未配置')
  return props.authService
}

function clearFieldError(field: LoginField): void {
  errors[field] = ''
  notice.value = null
}

function toCaptchaImageUrl(image: string): string {
  if (!image) return ''
  return image.startsWith('data:') ? image : `data:image/gif;base64,${image}`
}

async function refreshCaptcha(): Promise<void> {
  if (captchaLoading.value) return
  captchaLoading.value = true
  captchaError.value = ''
  errors.code = ''
  form.code = ''
  form.uuid = ''

  try {
    const captcha = await getAuthService().getCaptcha()
    captchaEnabled.value = captcha.captchaEnabled
    captchaSimulated.value = Boolean(captcha.simulated)
    captchaImageUrl.value = captcha.captchaEnabled ? toCaptchaImageUrl(captcha.img) : ''
    form.uuid = captcha.uuid
  } catch (error) {
    captchaEnabled.value = true
    captchaSimulated.value = false
    captchaImageUrl.value = ''
    captchaError.value = error instanceof Error ? error.message : '验证码加载失败，请点击刷新'
  } finally {
    captchaLoading.value = false
  }
}

function validateForm(): boolean {
  form.username = form.username.trim()
  errors.username = form.username ? '' : '请输入用户名'
  errors.password = form.password ? '' : '请输入密码'
  errors.code = captchaEnabled.value && !(form.code ?? '').trim() ? '请输入验证码' : ''
  return !errors.username && !errors.password && !errors.code
}

async function handleSubmit(): Promise<void> {
  if (submitting.value || !validateForm()) return

  submitting.value = true
  notice.value = null
  try {
    await getAuthService().login({
      username: form.username,
      password: form.password,
      code: form.code,
      uuid: form.uuid,
    })
    notice.value = { type: 'success', message: '登录成功，正在进入大屏' }
    emit('authenticated')
  } catch (error) {
    notice.value = {
      type: 'error',
      message: error instanceof Error ? error.message : '登录失败，请稍后重试',
    }
  } finally {
    submitting.value = false
  }
}

onMounted(refreshCaptcha)
</script>
