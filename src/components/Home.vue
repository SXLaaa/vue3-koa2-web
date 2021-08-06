<template>
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
    </div>
  </div>
</template>

<script>
export default{
  name:'Home',
}
</script>

<style lang="scss">
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
      height: 50px;
      line-height: 50px;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #ddd;
      padding: 0 20px;
    }
    &-wrapper{
      background: #eef0f3;
      padding:20px;
      height: calc(100vh - 50px);
      .main-page{
        background:#fff;
        height:100%;
      }
    }
  }
}
</style>