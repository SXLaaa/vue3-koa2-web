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

<style lang="scss">
.welcome{
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background: #fff;
  &-content{
    &-title{
      font-size: 30px;
      line-height: 42px;
      color: #333;
    }
    &-title2{
      font-size: 30px;
      line-height: 42px;
      color: #409eff;
    }
    &-desc{
      text-align: right;
      font-size: 14px;
      color: #999;
    }
  }
  &-img{
    margin-left: 100px;
    width: 371px;
    height: 438px;
    background-image: url('../assets/images/welcome.png');
  }
}
</style>