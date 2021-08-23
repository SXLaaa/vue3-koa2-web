<template>
  <div class="cesiumHome">
    <div id="cesiumContainer"></div>
  </div>
</template>

<script>
export default {
  data() {
    return {};
  },
  mounted() {
    this.initCesium();
  },
  methods: {
    initCesium() {
      var viewer = new Cesium.Viewer("cesiumContainer", {
        fullscreenButton: false, //是否显示全屏
        homeButton: false, //是否显示home按钮
        animation: false, //是否显示动画控件(左下方那个)
        baseLayerPicker: false, //是否显示图层选择控件
        geocoder: false, //是否显示地名查找控件
        timeline: false, //是否显示时间线控件
        sceneModePicker: false, //是否显示投影方式控件
        navigationHelpButton: false, //是否显示帮助信息控件
        infoBox: false, //是否显示点击要素之后显示的信息
        imageryProvider: new Cesium.ArcGisMapServerImageryProvider({
          url: "https://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer",
        }),
      });
      viewer.scene.debugShowFramesPerSecond = false; // 右上角显示帧速
      // 第一种画图形方法
      var redBox = viewer.entities.add({
        name: "Red box with black outline",
        position: Cesium.Cartesian3.fromDegrees(-107.0, 40.0, 300000.0),
        box: {
          dimensions: new Cesium.Cartesian3(400000.0, 300000.0, 500000.0),
          material: Cesium.Color.RED.withAlpha(0.5),
          outline: true,
          outlineColor: Cesium.Color.BLACK,
        },
      });
      viewer.zoomTo(viewer.entities);
      // 第二种画图形方法
      var czml = [
        {
          id: "document",
          name: "box",
          version: "1.0",
        },
        {
          id: "shape2",
          name: "Red box with black outline",
          position: {
            cartographicDegrees: [-107.0, 45.0, 300000.0],
          },
          box: {
            dimensions: {
              cartesian: [400000.0, 300000.0, 500000.0],
            },
            material: {
              solidColor: {
                color: {
                  rgba: [155, 0, 0, 128],
                },
              },
            },
            outline: true,
            outlineColor: {
              rgba: [0, 0, 0, 255],
            },
          },
        },
      ];
      var dataSourcePromise = Cesium.CzmlDataSource.load(czml);
      viewer.dataSources.add(dataSourcePromise);
      viewer.zoomTo(dataSourcePromise);
    },
  },
};
</script>

<style lang="scss" scoped>
.cesiumHome {
  width: 100%;
  height: 100%;
}
</style>
