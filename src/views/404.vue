<!--
 * @Description: 
 * @Version: 2.0
 * @Autor: shiXl
 * @Date: 2021-11-20 21:47:02
 * @LastEditors: shiXl
 * @LastEditTime: 2021-11-20 22:24:33
-->
<template>
  <div class="exception">
    <img src="@/assets/404.jpeg" alt="" />
    <el-button class="goHome" type="primary" @click="goHome">回首页</el-button>
  </div>
</template>

<script>
export default {
  name: "Exception",
  methods: {
    goHome() {
      this.$router.push("/");
    },
  },
};
</script>

<style lang="scss" scoped>
.exception {
  width: 100%;
  height: 100%;
  position: relative;
  img {
    width: 100vw;
    height: 100vh;
    margin: 0;
    padding: 0;
  }
  .goHome {
    position: absolute;
    bottom: 100px;
    left: 50%;
  }
}
</style>
