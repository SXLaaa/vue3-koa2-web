/*
 * @Description:
 * @Version: 2.0
 * @Autor: 史小雷
 * @Date: 2021-08-11 17:33:12
 * @LastEditors: Seven
 * @LastEditTime: 2021-08-31 23:00:23
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
    ...apManagerRoute,
  },
];
const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
