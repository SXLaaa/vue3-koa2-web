<template>
  <div class="Layout">
    <div :class="['Layout-side', isCollapse?'fold':'unfold']">
      <!-- 系统logo -->
      <div class="log">
        <img src="../assets/logo.png" alt="">
        <span>Manager</span>
      </div>
      <!-- 导航菜单 el-submenu 父级 el-menu-item 子级-->
      <el-menu
        default-active="2"
        background-color="#001529"
        text-color="#fff"
        router
        :collapse="isCollapse"
        class="nav-menu">
          <el-submenu index="1">
            <template #title>
              <i class="el-icon-setting"></i>
              <span>系统管理</span>
            </template>
            <el-menu-item index="1-1">用户管理</el-menu-item>
            <el-menu-item index="1-2">菜单管理</el-menu-item>
          </el-submenu>
          <el-submenu index="2">
            <template #title>
              <i class="el-icon-setting"></i>
              <span>审批管理</span>
            </template>
            <el-menu-item index="2-1">休假申请</el-menu-item>
            <el-menu-item index="2-2">待我审批</el-menu-item>
          </el-submenu>
      </el-menu>
    </div>
    <div :class="['Layout-right', isCollapse?'fold':'unfold']">
      <div class="Layout-right-top">
        <!-- 展开隐藏+面包屑 -->
        <div class="Layout-right-top-bread">
          <div class="menu-fold" @click="toggle"><i class="el-icon-s-fold"></i></div>
          <div class="bread">面包屑</div>
        </div>
        <!-- 提示消息+角色选择 -->
        <div class="user-info">
          <el-badge :is-dot="true" class="notice">
            <i class="el-icon-bell"></i>
          </el-badge>
          <el-dropdown @command="handleLogout">
            <span class="user-link">
              {{userInfo.userName}}
              <i class="el-icon--right"></i>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="email">邮箱:{{userInfo.userEmail}}</el-dropdown-item>
                <el-dropdown-item command="logout">退出:</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
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
  data(){
    return{
      isCollapse: false,
      userInfo:{
        userName:'shiXiaoLei',
        userEmail:'shixiaolei@qq.com',
      }
    }
  },
  methods:{
    toggle(){
      this.isCollapse = !this.isCollapse;
    },
    handleLogout(key){
      if(key == 'email') return;
      this.$store.commit('saveUserInfo', '');
      this.userInfo = null;
      this.$router.push('/login')
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
    .log{
      display: flex;
      align-items: center;
      font-size: 18px;
      height: 50px;
      img{
        margin: 0 16px;
        width: 32px;
        height: 32px;
      }
    }
    .nav-menu{
      height: calc(100vh - 50px);
      border-right: none;
    }
    // 合并、展开
    &.fold{
      width: 64px;
    }
    &.unfold{
      width: 200px;
    }
  }
  &-right{
    margin-left:200px;
    &.fold{
      margin-left: 64px;
    }
    &.unfold{
      margin-left: 200px;
    }
    &-top{
      height: 50px;
      line-height: 50px;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #ddd;
      padding: 0 20px;
      &-bread{
        display: flex;
        align-items: center;
        .menu-fold{
          margin-right: 15px;
          font-size: 18px;
        }
      }
      .user-info{
        .notice{
          line-height: 30px;
          margin-right: 15px;
        }
        .user-link{
          cursor: pointer;
          color: #409eff;
        }
      }
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