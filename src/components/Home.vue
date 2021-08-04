<template>
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
    </div>
  </div>
</template>
<script>
export default{
  name: 'Home',
  mounted(){

  } 
}
</script>

<style lang="scss">
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
      height: 50px;
      line-height: 50px;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #ddd;
      padding: 0 20px;
    }
    &-wrapper{
      background-color: #eef0f3;
      padding: 20px;
      height: calc(100vh - 50px); // 表示整个页面的高度减去 标题+上下padding
      .main-page{
        background-color: #fff;
        height: 100%;
      }
    }
  }
}
</style>