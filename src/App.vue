<!--
 * @Description: 
 * @Version: 2.0
 * @Autor: shiXl
 * @Date: 2021-08-08 17:09:50
 * @LastEditors: shiXl
 * @LastEditTime: 2022-02-10 14:20:18
-->
<template>
  <router-view></router-view>
</template>

<script>
export default {
  name: "app",
  mounted() {
    let userInfo = this.$storage.getItem('userInfo');
    if(!userInfo)this.$router.push('/login');
    setTimeout(() => {
      window.L2Dwidget.init({
        pluginRootPath: "live2dw/",
        pluginJsPath: "lib/",
        pluginModelPath: "live2d-widget-model-shizuku/assets/",
        tagMode: false,
        debug: false,
        model: {
          jsonPath: "../live2dw/live2d-widget-model-shizuku/assets/shizuku.model.json",
        },
        dialog: {
            enable: true,
            script: {
            //每20s，显示一言（调用一言Api返回的句子）
            'every idle 20s': '$hitokoto$',
            //触摸到class='star'对象
            'hover .star': '星星在天上而你在我心里 (*/ω＼*)',
            //触摸到身体
            'tap body': '害羞⁄(⁄ ⁄•⁄ω⁄•⁄ ⁄)⁄',
            //触摸到头部
            'tap face': '~~'
          }
        },
        display: {
          position: "right",
          width: 100,
          height: 200,
        },
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
