<template>
  <div class="Layout">
    <div :class="['Layout-side', isCollapse ? 'fold' : 'unfold']">
      <!-- 系统logo -->
      <div class="log">
        <img src="../assets/log2.jpeg" alt="" />
        <span>-----</span>
      </div>
      <!-- 导航菜单 el-submenu 父级 el-menu-item 子级-->
      <el-menu
        background-color="#001529"
        text-color="#fff"
        router
        :collapse="isCollapse"
        :default-active="activeMenu"
        class="nav-menu"
      >
        <TreeMenu :MenuList="menuList" />
      </el-menu>
    </div>
    <div :class="['Layout-right', isCollapse ? 'fold' : 'unfold']">
      <div class="Layout-right-top">
        <!-- 展开隐藏+面包屑 -->
        <div class="Layout-right-top-bread">
          <div class="menu-fold" @click="toggle">
            <i class="el-icon-s-fold"></i>
          </div>
          <div class="bread">
            <BreadCrumb />
          </div>
        </div>
        <!-- 提示消息+角色选择 -->
        <div class="user-info">
          <el-badge :is-dot="noticeCount > 0 ? true : false" class="notice">
            <i class="el-icon-bell"></i>
          </el-badge>
          <el-dropdown @command="handleLogout" class="user-info-select">
            <span class="user-link">
              {{ userInfo.userName }}
              <i class="el-icon--right"></i>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="email"
                  ><span class="messageSpan"
                    >邮箱:{{ userInfo.userEmail }}</span
                  ></el-dropdown-item
                >
                <el-dropdown-item command="logout"
                  ><span class="messageSpan">退出</span></el-dropdown-item
                >
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      <div class="Layout-right-wrapper">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script>
import TreeMenu from "./TreeMenu.vue";
import BreadCrumb from "./BreadCrumb.vue";
export default {
  name: "Home",
  components: { TreeMenu, BreadCrumb },
  data() {
    return {
      isCollapse: false,
      userInfo: this.$store.state.userInfo,
      noticeCount: 0,
      menuList: [],
      activeMenu: location.hash.slice(1), // 获取浏览器地址#后面的
    };
  },
  mounted() {
    this.getNoticeCount();
    this.getMenuList();
  },
  methods: {
    toggle() {
      this.isCollapse = !this.isCollapse;
    },
    handleLogout(key) {
      if (key == "email") return;
      this.$store.commit("saveUserInfo", "");
      this.userInfo = null;
      this.$router.push("/login");
    },
    async getNoticeCount() {
      try {
        const count = await this.$api.noticeCount();
        this.noticeCount = count;
      } catch (error) {
        console.error(error);
      }
    },
    async getMenuList() {
      try {
        const menuList = await this.$api.getMenuList();
        this.menuList = menuList;
      } catch (error) {
        console.error(error);
      }
    },
  },
};
</script>

<style lang="scss">
.messageSpan {
  white-space: nowrap; /*强制span不换行*/
  overflow: hidden; /*超出宽度部分隐藏*/
  text-overflow: ellipsis; /*超出部分以点号代替*/
}
.Layout {
  position: relative;
  &-side {
    position: fixed;
    width: 200px;
    height: 100vh;
    background-color: #001529;
    color: #fff;
    overflow-y: auto;
    transition: width 0.5s;
    .log {
      display: flex;
      align-items: center;
      font-size: 18px;
      height: 50px;
      img {
        margin: 0 16px;
        width: 32px;
        height: 32px;
      }
    }
    .nav-menu {
      height: calc(100vh - 50px);
      border-right: none;
    }
    // 合并、展开
    &.fold {
      width: 64px;
    }
    &.unfold {
      width: 200px;
    }
  }
  &-right {
    margin-left: 200px;
    &.fold {
      margin-left: 64px;
    }
    &.unfold {
      margin-left: 200px;
    }
    &-top {
      height: 50px;
      line-height: 50px;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #ddd;
      padding: 0 20px;
      &-bread {
        display: flex;
        align-items: center;
        .menu-fold {
          margin-right: 15px;
          font-size: 18px;
        }
      }
      .user-info {
        .notice {
          line-height: 30px;
          margin-right: 15px;
        }
        .user-link {
          cursor: pointer;
          color: #409eff;
        }
        // &-select{
        //   /deep/.messageSpan{
        //     background: saddlebrown;
        //     white-space: nowrap;  /*强制span不换行*/
        //     display: inline-block;  /*将span当做块级元素对待*/
        //     width: 32px;  /*限制宽度*/
        //     overflow: hidden;  /*超出宽度部分隐藏*/
        //     text-overflow: ellipsis;  /*超出部分以点号代替*/
        //     line-height: 0.9;  /*数字与之前的文字对齐*/
        //   }
        // }
      }
    }
    &-wrapper {
      background: #eef0f3;
      padding: 20px;
      height: calc(100vh - 50px);
      .main-page {
        background: #fff;
        height: 100%;
      }
    }
  }
}
</style>
