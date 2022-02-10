/*
 * @Description:
 * @Version: 2.0
 * @Autor: shiXl
 * @Date: 2021-11-28 13:20:46
 * @LastEditors: shiXl
 * @LastEditTime: 2021-11-28 13:20:47
 */
/*
 * @Description:
 * @Version: 2.0
 * @Autor: shiXl
 * @Date: 2021-08-22 20:50:32
 * @LastEditors: shiXl
 * @LastEditTime: 2021-09-06 02:21:42
 */
import Home from "@/components/Home.vue";
const apManagerRoute = {
  name: "apManager",
  path: "/apManager",
  meta: {
    title: "应用管理",
  },
  component: Home,
  redirect: {
    name: "cesium",
  },
  children: [
    {
      name: "cesium",
      path: "cesium",
      meta: {
        title: "cesium管理",
      },
      component: () => import("@/views/cesium.vue"),
      redirect: {
        name: "cesium1",
      },
      children: [
        {
          name: "cesium1",
          path: "cesium1",
          meta: {
            title: "cesium练习1",
          },
          component: () => import("@/views/cesium/cesium1.vue"),
        },
        {
          name: "cesium2",
          path: "cesium2",
          meta: {
            title: "图层调整",
          },
          component: () => import("@/views/cesium/cesium2.vue"),
        },
        {
          name: "cesium3",
          path: "cesium3",
          meta: {
            title: "图层调整",
          },
          component: () => import("@/views/cesium/cesium3.vue"),
        },
      ],
    },
    {
      name: "ArcGIS管理",
      path: "/gis",
      meta: {
        title: "ArcGIS管理",
      },
    },
  ],
};
export default apManagerRoute;
