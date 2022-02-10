/*
 * @Description:
 * @Version: 2.0
 * @Autor: 史小雷
 * @Date: 2021-08-11 17:33:12
 * @LastEditors: shiXl
 * @LastEditTime: 2022-02-10 10:23:28
 */
import { createRouter, createWebHashHistory } from "vue-router";
import Home from "@/components/Home.vue";
import storage from "./../utils/storage";
import API from "./../api";
import utils from "./../utils/utils";
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
];
const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
async function loadAsyncRoutes() {
  let userInfo = storage.getItem("userInfo") || {};
  if (userInfo.token) {
    try {
      const { menuList } = await API.getPermissionList();
      let routes = utils.generateRoute(menuList);
      console.log(routes, "--routes1");
      routes.map((route) => {
        let url = `./../views/${route.component}.vue`;
        route.component = () => import(url);
        router.addRoute("home", route);
      });
      console.log(router.getRoutes(), "--routes2");
    } catch (error) {}
  }
}
loadAsyncRoutes();

/**
 * 判断当前地址是否可以访问
 * router.getRoutes() 获取全量路由地址
 */
function checkoutPermission(path) {
  console.log(router.getRoutes(), "--routes3");
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
