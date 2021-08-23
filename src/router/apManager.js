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
