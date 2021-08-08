<template>
<<<<<<< HEAD
  <div class="layout">
    <div class="layout-navSide"></div>
    <div class="layout-right">
        <div class="layout-right-title">
          <div>面包屑</div>
          <div>用户</div>
        </div>
        <div class="layout-right-wrapper">
          <div class="main-page">
            <router-view/>
          </div>
        </div>
=======
  <div class="Layout">
    <div class="Layout-side"></div>
    <div class="Layout-right">
      <div class="Layout-right-top">
        <div class="bread">面包屑</div>
        <div class="user-">用户</div>
      </div>
      <div class="Layout-right-wrapper">
        <div class="main-page">
          <router-view></router-view>
        </div>
      </div>
>>>>>>> origin/8-8登陆布局开发
    </div>
  </div>
</template>

<script>
export default{
<<<<<<< HEAD
  name: 'Home',
  mounted(){

  } 
=======
  name:'Home',
>>>>>>> origin/8-8登陆布局开发
}
</script>

<style lang="scss">
<<<<<<< HEAD
.layout{
  position: relative;
  &-navSide{
    position: fixed;
    width: 200px;
    height: 100vh;
    background-color: #001529;
    color: #fff;
    overflow-y: auto; // 防止高度过高出现抖动
    transition: width .5s; // 导航栏展开过渡效果
  }
  &-right{
    margin-left: 200px;
    &-title{
=======
.Layout{
  position:relative;
  &-side{
    position: fixed;
    width:200px;
    height:100vh;
    background-color: #001529;
    color:#fff;
    overflow-y: auto;
    transition: width .5s;
  }
  &-right{
    margin-left:200px;
    &-top{
>>>>>>> origin/8-8登陆布局开发
      height: 50px;
      line-height: 50px;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #ddd;
      padding: 0 20px;
    }
    &-wrapper{
<<<<<<< HEAD
      background-color: #eef0f3;
      padding: 20px;
      height: calc(100vh - 50px); // 表示整个页面的高度减去 标题+上下padding
      .main-page{
        background-color: #fff;
        height: 100%;
=======
      background: #eef0f3;
      padding:20px;
      height: calc(100vh - 50px);
      .main-page{
        background:#fff;
        height:100%;
>>>>>>> origin/8-8登陆布局开发
      }
    }
  }
}
</style>