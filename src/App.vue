<!--
 * @Description: 
 * @Version: 2.0
 * @Autor: shiXl
 * @Date: 2021-08-08 17:09:50
 * @LastEditors: shiXl
 * @LastEditTime: 2021-10-21 17:44:35
-->
<template>
  <router-view></router-view>
</template>

<script>
export default {
  name: "app",
  mounted() {
    setTimeout(() => {
      window.L2Dwidget.init({
        pluginRootPath: "live2dw/",
        pluginJsPath: "lib/",
        pluginModelPath: "live2d-widget-model-z16/assets/",
        tagMode: false,
        debug: false,
        model: {
          jsonPath: "../live2dw/live2d-widget-model-z16/assets/z16.model.json",
        },
        display: { position: "right", width: 100, height: 200 },
        mobile: { show: true },
        log: false,
      });
    }, 1000);
  },
};
</script>

<style lang="scss">
@import "./assets/style/reset.css";
@import "./assets/style/index.scss";
</style>
