<template>
  <LoginPage
    v-if="gate.view === 'login'"
    :auth-service="authService"
    @authenticated="handleAuthenticated"
  />
  <MainGrainDashboard v-else :show-admin-entry="false" />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import MainGrainDashboard from '@/components/MainGrainDashboard.vue'
import LoginPage from '@/features/login/LoginPage.vue'
import { getRuntimeConfig } from '@/config/services'
import { createAuthService } from '@/services/authService'
import { createLoginApi } from '@/services/loginApi'
import {
  DASHBOARD_HOME_HASH,
  resolveDashboardGate,
} from '@/router/dashboardGate'

const runtimeConfig = getRuntimeConfig()
const loginApi = createLoginApi({
  baseUrl: runtimeConfig.apiBaseUrl,
  timeoutMs: runtimeConfig.authRequestTimeoutMs,
})
const authService = createAuthService({
  mode: runtimeConfig.authMode,
  storage: window.sessionStorage,
  executor: loginApi,
  allowLocalFallback: runtimeConfig.authDevFallbackEnabled,
})
const currentHash = ref(window.location.hash)
const authRevision = ref(0)

const gate = computed(() => {
  void authRevision.value
  return resolveDashboardGate(currentHash.value, authService.isAuthenticated())
})

// 统一修正浏览器哈希：未登录只能停留登录页，已登录只允许进入 12 个大屏页面。
function synchronizeLocation(): void {
  const decision = resolveDashboardGate(window.location.hash, authService.isAuthenticated())
  if (window.location.hash !== decision.hash) window.location.hash = decision.hash
  currentHash.value = decision.hash
}

// 登录接口成功并写入会话后，明确进入大屏首页，避免回到模板原有后台页面。
function handleAuthenticated(): void {
  authRevision.value += 1
  window.location.hash = DASHBOARD_HOME_HASH
  currentHash.value = DASHBOARD_HOME_HASH
}

synchronizeLocation()
onMounted(() => window.addEventListener('hashchange', synchronizeLocation))
onBeforeUnmount(() => window.removeEventListener('hashchange', synchronizeLocation))
</script>
