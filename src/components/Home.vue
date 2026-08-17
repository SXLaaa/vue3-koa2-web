<template>
  <div class="Layout">
    <aside class="Layout-side">
      <div class="Layout-brand">本地工作台</div>
      <nav class="Layout-nav" aria-label="主导航">
        <router-link to="/welcome">
          <i class="el-icon-house"></i>
          <span>首页</span>
        </router-link>
        <router-link to="/agent">
          <i class="el-icon-chat-dot-round"></i>
          <span>本地智能体</span>
        </router-link>
      </nav>
    </aside>
    <div class="Layout-right">
      <div class="Layout-right-top">
        <div class="bread">{{ currentTitle }}</div>
        <div class="user-name">{{ userName }}</div>
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
  computed:{
    currentTitle(){
      return this.$route.meta.title || '首页'
    },
    userName(){
      return this.$store.state.userInfo?.userName || '本机用户'
    }
  }
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
  &-brand{
    height: 58px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    font-size: 17px;
    font-weight: 600;
    border-bottom: 1px solid rgba(255,255,255,.12);
  }
  &-nav{
    padding: 10px 0;
    a{
      height: 44px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 20px;
      color: rgba(255,255,255,.75);
      border-left: 3px solid transparent;
    }
    a:hover,
    a.router-link-active{
      color: #fff;
      background: rgba(255,255,255,.1);
      border-left-color: #409eff;
    }
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
        overflow: hidden;
      }
    }
  }
}

@media (max-width: 760px){
  .Layout{
    &-side{
      position: static;
      width: 100%;
      height: auto;
      overflow: visible;
    }
    &-brand{
      display: none;
    }
    &-nav{
      display: flex;
      padding: 0;
      a{
        flex: 1;
        justify-content: center;
        border-left: 0;
        border-bottom: 3px solid transparent;
      }
      a.router-link-active{
        border-left-color: transparent;
        border-bottom-color: #409eff;
      }
    }
    &-right{
      margin-left: 0;
      &-wrapper{
        padding: 0;
        height: calc(100vh - 94px);
      }
    }
  }
}
</style>
