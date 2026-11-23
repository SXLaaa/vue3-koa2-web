<!-- @Description: 企业后台登录页面，提供验证码登录和全局主题切换。 -->
<template>
  <div class="login-wrapper">
    <div class="login-theme-control">
      <ThemeSwitch />
    </div>
    <div class="title">基于Vue3的企业后台管理系统的设计与实现</div>
    <div class="modal">
      <el-form
        ref="userFormRef"
        :model="user"
        status-icon
        :rules="rules"
        :disabled="loggingIn"
        @submit.prevent="login(userFormRef)"
      >
        <el-form-item prop="userName">
          <el-input
            type="text"
            prefix-icon="el-icon-user"
            v-model="user.userName"
          />
        </el-form-item>
        <el-form-item prop="userPwd">
          <el-input
            type="password"
            prefix-icon="el-icon-view"
            v-model="user.userPwd"
          />
        </el-form-item>
        <el-form-item prop="captcha">
          <div style="display: flex; align-items: center">
            <el-input
              type="text"
              prefix-icon="el-icon-camera"
              v-model="user.captcha"
            />
            <div
              v-if="captchaImage"
              class="captcha-image"
              v-html="captchaImage"
              @click="refreshCaptcha"
            ></div>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            native-type="submit"
            class="btn-login"
            :loading="loggingIn"
            :disabled="loggingIn"
            >登录</el-button
          >
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "@vue/reactivity";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { onMounted, getCurrentInstance } from "vue";
import api from "@/api";
import ThemeSwitch from "@/components/ThemeSwitch.vue";
const { proxy } = getCurrentInstance();
let user = reactive({
  userName: "",
  userPwd: "",
  captcha: "",
});
let rules = {
  userName: [
    {
      required: true,
      message: "请输入用户名",
      trigger: "blur",
    },
  ],
  userPwd: [
    {
      required: true,
      message: "请输入密码",
      trigger: "blur",
    },
  ],
  captcha: [
    {
      required: true,
      message: "请输入验证码",
      trigger: "blur",
    },
  ],
};
const userFormRef = ref();
const loggingIn = ref(false);
const store = useStore();
const router = useRouter();
const captchaImage = ref(""); // 验证码地址
onMounted(() => {
  refreshCaptcha();
});
async function login(formRef) {
  if (!formRef || loggingIn.value) return;
  const params = { ...user };
  loggingIn.value = true;
  try {
    const valid = await formRef.validate().catch(() => false);
    if (!valid) return;

    const verified = await proxy.$api.verifyCaptcha(params); // 验证码校验
    if (!verified) {
      user.captcha = "";
      await refreshCaptcha().catch(() => {});
      return;
    }

    const res = await api.login(params);
    store.commit("saveUserInfo", res);
    await router.push("/welcome");
  } catch (error) {
    user.captcha = "";
    // 刷新失败也要恢复提交状态，允许重新获取验证码后重试。
    await refreshCaptcha().catch(() => {});
  } finally {
    loggingIn.value = false;
  }
}
function goHome() {
  router.push("/welcome");
}
async function refreshCaptcha() {
  // 增加时间戳参数，避免浏览器缓存导致验证码图片不更新
  let res = await proxy.$api.getCaptcha({ t: Date.now() });
  captchaImage.value = res.trim();
}
</script>

<style lang="scss">
.login-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: var(--app-login-canvas);
  color: var(--app-text);
  width: 100%;
  min-height: 100vh;
  padding: 24px 16px;

  .login-theme-control {
    position: absolute;
    top: clamp(12px, 2vw, 24px);
    right: clamp(12px, 2vw, 24px);
  }
  .title {
    color: var(--app-heading);
    font-size: clamp(24px, 5vw, 50px);
    line-height: 1.5;
    text-align: center;
    margin-bottom: 30px;
  }
  .modal {
    width: min(500px, 100%);
    padding: clamp(20px, 5vw, 50px);
    background: var(--app-surface);
    border-radius: 4px;
    box-shadow: var(--app-login-shadow);

    .captcha-image {
      display: flex;
      flex: 0 0 auto;
      border-radius: 4px;
      background: #fff;
      cursor: pointer;
    }

    .btn-login {
      width: 100%;
    }
  }
}

@media (max-width: 600px), (max-height: 500px) {
  .login-wrapper {
    padding-top: 68px;
  }
}
</style>
