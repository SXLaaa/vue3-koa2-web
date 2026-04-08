<template>
  <div class="Layout">
    <div :class="['Layout-side', isCollapse ? 'fold' : 'unfold']">
      <div class="sidebar-glow"></div>
      <div class="log brand-panel">
        <logPicture />
      </div>
      <el-menu
        background-color="transparent"
        text-color="#d7e3f4"
        active-text-color="#ffffff"
        router
        :collapse="isCollapse"
        :default-active="activeMenu"
        class="nav-menu"
        unique-opened
      >
        <TreeMenu :MenuList="menuList" />
      </el-menu>
    </div>
    <div :class="['Layout-right', isCollapse ? 'fold' : 'unfold']">
      <div class="Layout-right-top">
        <div class="Layout-right-top-bread">
          <div class="menu-fold" @click="toggle">
            <el-icon>
              <component :is="isCollapse ? 'Expand' : 'Fold'" />
            </el-icon>
          </div>
          <div class="bread">
            <BreadCrumb />
          </div>
        </div>
        <div class="user-info">
          <el-badge :is-dot="noticeCount > 0 ? true : false" class="notice">
            <div class="top-action">
              <el-icon><Bell /></el-icon>
            </div>
          </el-badge>
          <el-dropdown @command="handleLogout" class="user-info-select">
            <span class="user-link">
              <span class="user-avatar">{{ (userInfo.userName || "管").slice(0, 1) }}</span>
              <span class="user-name">{{ userInfo.userName }}</span>
              <i class="el-icon--right"></i>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="email">
                  <span class="messageSpan">邮箱:{{ userInfo.userEmail }}</span>
                </el-dropdown-item>
                <el-dropdown-item command="changePassword">
                  <span class="messageSpan">更改密码</span>
                </el-dropdown-item>
                <el-dropdown-item command="logout">
                  <span class="messageSpan">退出</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      <div class="Layout-right-wrapper">
        <div class="content-shell">
          <router-view></router-view>
        </div>
      </div>
    </div>
    <el-dialog title="更改密码" v-model="showModal">
      <el-form
        ref="dialogForm"
        :model="userForm"
        label-width="100px"
        :rules="rules"
      >
        <el-form-item label="用户名" prop="userName">
          <el-input
            v-model="userForm.userName"
            :disabled="true"
            placeholder="请输入用户名称"
          />
        </el-form-item>
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input
            type="password"
            v-model="userForm.currentPassword"
            placeholder="请输入当前密码"
            autocomplete="off"
          >
          </el-input>
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <div class="input-with-eye">
            <el-input
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入新密码"
              v-model="userForm.newPassword"
              autocomplete="off"
            ></el-input>
            <el-button
              @click="showPassword = !showPassword"
              size="small"
              icon="el-icon-view"
            ></el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleClose">取 消</el-button>
          <el-button type="primary" @click="handleSubmit">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import TreeMenu from "./TreeMenu.vue";
import BreadCrumb from "./BreadCrumb.vue";
import logPicture from "./logPicture.vue";

export default {
  name: "Home",
  components: { TreeMenu, BreadCrumb, logPicture },
  data() {
    return {
      isCollapse: false,
      userInfo: this.$store.state.userInfo,
      noticeCount: 0,
      menuList: [],
      activeMenu: location.hash.slice(1),
      showModal: false,
      userForm: {
        userName: this.$store.state.userInfo.userName,
        currentPassword: "",
        newPassword: "",
      },
      rules: {
        currentPassword: [
          {
            required: true,
            message: "请输入密码",
          },
        ],
        newPassword: [
          {
            required: true,
            message: "请输入密码",
          },
        ],
      },
      showPassword: true,
    };
  },
  mounted() {
    this.getNoticeCount();
    this.getMenuList();
  },
  methods: {
    handleSubmit() {
      this.$refs.dialogForm.validate(async (valid) => {
        if (valid) {
          let res = await this.$api.updatePwd(this.userForm);
          if (res) {
            this.$message.success("更新成功");
            this.handleLogout("logout");
          }
        }
      });
    },
    handleClose() {
      this.$refs["dialogForm"].resetFields();
      this.showModal = false;
    },
    toggle() {
      this.isCollapse = !this.isCollapse;
    },
    handleLogout(key) {
      if (key == "email") return;
      if (key == "changePassword") {
        this.showModal = true;
        return;
      }
      this.$store.commit("saveUserInfo", "");
      this.userInfo = {};
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
        const { menuList, actionList } = await this.$api.getPermissionList();
        this.menuList = menuList;
        this.$store.commit("saveUserMenu", menuList);
        this.$store.commit("saveUserAction", actionList);
      } catch (error) {
        console.error(error);
      }
    },
  },
};
</script>

<style lang="scss">
.messageSpan {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.Layout {
  position: relative;
  height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(15, 118, 110, 0.16), transparent 22%),
    radial-gradient(circle at right top, rgba(245, 158, 11, 0.12), transparent 20%),
    linear-gradient(135deg, #edf4f3 0%, #f8fbfa 50%, #f3efe6 100%);

  &-side {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 20;
    width: 256px;
    height: 100vh;
    padding: 18px 16px;
    background: linear-gradient(180deg, #0c1626 0%, #14253d 52%, #10243b 100%);
    color: #fff;
    overflow-y: auto;
    overflow-x: hidden;
    transition: transform 0.35s ease, box-shadow 0.35s ease;
    box-shadow: 18px 0 40px rgba(15, 23, 42, 0.12);

    .sidebar-glow {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(56, 189, 248, 0.28), transparent 70%);
      filter: blur(4px);
      pointer-events: none;
    }

    .log {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      min-height: 72px;
      margin-bottom: 18px;
      padding: 14px 16px;
      border-radius: 24px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.05));
      border: 1px solid rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(10px);
      font-size: 18px;
    }

    .nav-menu {
      position: relative;
      z-index: 1;
      height: calc(100vh - 126px);
      border-right: none;
      background: transparent !important;
    }

    &.fold {
      transform: translateX(-100%);
      box-shadow: none;
    }

    &.unfold {
      transform: translateX(0);
    }
  }

  &-right {
    height: 100vh;
    overflow: hidden;
    margin-left: 256px;
    transition: margin-left 0.35s ease;

    &.fold {
      margin-left: 0;
    }

    &.unfold {
      margin-left: 256px;
    }

    &-top {
      position: sticky;
      top: 0;
      z-index: 10;
      height: 84px;
      min-height: 84px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      margin: 18px 18px 0;
      padding: 16px 22px;
      border: 1px solid rgba(15, 23, 42, 0.08);
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.78);
      box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
      backdrop-filter: blur(14px);

      &-bread {
        display: flex;
        align-items: center;
        min-width: 0;

        .menu-fold {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          margin-right: 14px;
          border-radius: 16px;
          background: linear-gradient(135deg, #f8fafc, #ecfeff);
          border: 1px solid rgba(15, 23, 42, 0.08);
          color: #14324a;
          font-size: 18px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
        }

        .menu-fold:hover {
          transform: translateY(-1px);
        }

        .bread {
          min-width: 0;
        }
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 14px;

        .notice {
          line-height: 1;
        }

        .top-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 16px;
          background: linear-gradient(135deg, #f8fafc, #fff7ed);
          border: 1px solid rgba(15, 23, 42, 0.08);
          color: #17324c;
          font-size: 18px;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
        }

        .user-link {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 8px 10px 8px 8px;
          border-radius: 18px;
          cursor: pointer;
          color: #17324c;
          background: linear-gradient(135deg, rgba(15, 118, 110, 0.08), rgba(245, 158, 11, 0.08));
          border: 1px solid rgba(15, 23, 42, 0.06);
        }

        .user-avatar {
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: linear-gradient(135deg, #115e59, #0f766e 55%, #f59e0b);
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          box-shadow: 0 10px 24px rgba(15, 118, 110, 0.22);
        }

        .user-name {
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }

    &-wrapper {
      padding: 18px;
      height: calc(100vh - 100px);
      overflow: hidden;

      .content-shell {
        height: calc(100vh - 136px);
        border-radius: 28px;
        overflow: auto;
        overscroll-behavior: contain;
      }
    }
  }

  .brand-panel :deep(.logMain) {
    gap: 10px;
    color: #f8fbff;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .nav-menu :deep(.el-menu-item),
  .nav-menu :deep(.el-submenu__title) {
    height: 48px;
    margin-bottom: 8px;
    border-radius: 16px;
    color: #d7e3f4 !important;
    transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
  }

  .nav-menu :deep(.el-menu-item:hover),
  .nav-menu :deep(.el-submenu__title:hover) {
    background: rgba(255, 255, 255, 0.09) !important;
    color: #ffffff !important;
    transform: translateX(2px);
  }

  .nav-menu :deep(.el-menu-item.is-active) {
    background: linear-gradient(135deg, rgba(15, 118, 110, 0.88), rgba(245, 158, 11, 0.88)) !important;
    color: #ffffff !important;
    box-shadow: 0 14px 26px rgba(15, 118, 110, 0.22);
  }

  .nav-menu :deep(.el-submenu .el-menu-item) {
    min-width: auto;
    padding-left: 48px !important;
    background: rgba(255, 255, 255, 0.03);
  }

  .nav-menu :deep(.el-submenu .el-menu) {
    background: transparent !important;
  }

  .nav-menu :deep(.el-menu-item [class^="el-icon"]),
  .nav-menu :deep(.el-submenu__title [class^="el-icon"]),
  .nav-menu :deep(.el-menu-item .el-icon),
  .nav-menu :deep(.el-submenu__title .el-icon) {
    margin-right: 10px;
    font-size: 17px;
  }

  .Layout-right-top :deep(.el-breadcrumb) {
    line-height: 1.4;
  }

  .Layout-right-top :deep(.el-breadcrumb__inner),
  .Layout-right-top :deep(.el-breadcrumb__inner a) {
    color: #607180;
    font-weight: 500;
  }

  .Layout-right-top :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
    color: #14263d;
    font-weight: 700;
  }

  .Layout-right-top :deep(.el-badge__content.is-fixed.is-dot) {
    top: 10px;
    right: 10px;
    background: #ef4444;
  }
}

.input-with-eye {
  display: flex;
  align-items: center;
}

@media (max-width: 960px) {
  .Layout {
    &-side {
      width: 256px;
    }

    &-right {
      margin-left: 0;

      &.unfold,
      &.fold {
        margin-left: 0;
      }

      &-top {
        margin: 12px 12px 0;
        padding: 14px 16px;

        &-bread {
          .bread {
            display: none;
          }
        }
      }

      &-wrapper {
        padding: 12px;
        height: calc(100vh - 88px);
      }
    }
  }
}

@media (max-width: 640px) {
  .Layout {
    &-side {
      display: none;
    }

    &-right {
      margin-left: 0;

      &.unfold,
      &.fold {
        margin-left: 0;
      }

      &-top {
        border-radius: 18px;
      }

      &-wrapper {
        .content-shell {
          border-radius: 20px;
        }
      }
    }
  }
}
</style>
