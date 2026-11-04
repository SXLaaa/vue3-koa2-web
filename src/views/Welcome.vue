<template>
  <div class="welcome">
    <div class="welcome-content">
      <div class="welcome-content-title">欢迎体验</div>
      <!-- <div class="welcome-content-title2">慕课通用后台管理系统</div> -->
      <!-- <div class="welcome-content-desc">- Vue3.0+ElementPlus+Node+Mongo</div> -->
    </div>
    <div class="welcome-img">

    </div>
  </div>
</template>

<script>
export default {
  name:'welcome'
}
</script>

<style lang="scss" scoped>
.welcome {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: clamp(24px, 5vw, 80px);
  min-height: 100%;
  padding: 40px;
  box-sizing: border-box;
  background: #fff;
  border: 1px solid #e7edf3;
  border-radius: 16px;
  .welcome-content-title {
    font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
    font-size: clamp(24px, 2.5vw, 34px);
    font-weight: 600;
    line-height: 1.5;
    letter-spacing: 1px;
    color: #23364d;
    white-space: nowrap;
  }
  .welcome-img {
    width: min(45%, 340px);
    aspect-ratio: 371 / 438;
    background: url('../assets/images/welcome.png') center / contain no-repeat;
  }
}
@media (max-width: 700px) {
  .welcome {
    flex-direction: column;
    padding: 32px 20px;
    gap: 28px;
    .welcome-img { width: min(75%, 280px); }
  }
}
</style>
