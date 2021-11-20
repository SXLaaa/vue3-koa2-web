/*
 * @Description:
 * @Version: 2.0
 * @Autor: 史小雷
 * @Date: 2021-08-11 17:33:12
 * @LastEditors: shiXl
 * @LastEditTime: 2021-11-20 22:41:57
 */
import { createRouter, createWebHashHistory } from "vue-router";
import Home from "@/components/Home.vue";
import apManagerRoute from "./apManager";
const routes = [
  {
    name: "home",
    path: "/",
    meta: {
      title: "首页",
    },
    component: Home,
    redirect: "/welcome",
    children: [
      {
        name: "welcome",
        path: "/welcome",
        meta: {
          title: "欢迎页",
        },
        component: () => import("@/views/Welcome.vue"),
      },
      {
        name: "user",
        path: "/system/user",
        meta: {
          title: "用户管理",
        },
        component: () => import("@/views/User.vue"),
      },
      {
        name: "menu",
        path: "/system/menu",
        meta: {
          title: "菜单管理",
        },
        component: () => import("@/views/Menu.vue"),
      },
      {
        name: "role",
        path: "/system/role",
        meta: {
          title: "角色管理",
        },
        component: () => import("@/views/Role.vue"),
      },
      {
        name: "dept",
        path: "/system/dept",
        meta: {
          title: "部门管理",
        },
        component: () => import("@/views/Dept.vue"),
      },
    ],
  },
  {
    name: "login",
    path: "/login",
    meta: {
      title: "登陆",
    },
    component: () => import("@/views/Login.vue"),
  },
  {
    name: "404",
    path: "/404",
    meta: {
      title: "页面不存在",
    },
    component: () => import("@/views/404.vue"),
  },
  {
    ...apManagerRoute,
  },
];
const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
/**
 * 判断当前地址是否可以访问
 * router.getRoutes() 获取全量路由地址
 */
function checkoutPermission(path) {
  let hasPermission = router
    .getRoutes()
    .filter((route) => route.path == path).length;
  if (hasPermission) {
    return true;
  } else {
    return false;
  }
}
router.beforeEach((to, from, next) => {
  if (checkoutPermission(to.path)) {
    document.title = to.meta.title;
    next();
  } else {
    next("/404");
  }
});
export default router;
