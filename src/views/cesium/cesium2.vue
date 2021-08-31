<!--
 * @Description: 
 * @Version: 2.0
 * @Autor: 史小雷
 * @Date: 2021-08-28 15:55:26
 * @LastEditors: Seven
 * @LastEditTime: 2021-08-31 17:01:01
-->
<template>
  <div class="cesiumHome2">
    <div id="cesiumContainer"></div>
    <toolBar @putList="putList" @zoomTo="zoomTo" />
  </div>
</template>

<script>
import toolBar from "./components/toolBar.vue";
export default {
  components: { toolBar },
  data() {
    return {
      viewer: null,
      entity: null,
      buttonList: [],
      gdLayer: null,
      buttonList: [
        {
          name: "透明度",
          num: 1,
          type: "alpha",
        },
        {
          name: "亮度",
          num: 1,
          type: "brightness",
        },
        {
          name: "灰度",
          num: 1,
          type: "gamma",
        },
      ],
      tileset: null,
    };
  },
  mounted() {
    this.initCesium();
  },
  methods: {
    initCesium() {
      var viewer = new Cesium.Viewer("cesiumContainer", {
        animation: false,
        timeline: false,
        imageryProvider: false,
      });
      viewer._cesiumWidget._creditContainer.style.display = "none"; // 隐藏版权信息
      viewer.imageryLayers.removeAll();
      viewer.scene.fxaa = false; // 改善实体的文字和图片清晰度
      viewer.scene.globe.maximumScreenSpaceError = 4 / 3; // 降低性能提供图片质量
      // 添加一个图层
      this.gdLayer = viewer.imageryLayers.addImageryProvider(
        new Cesium.ArcGisMapServerImageryProvider({
          url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
        })
      );
      // Viewer亮度设置
      var stages = viewer.scene.postProcessStages;
      viewer.scene.brightness =
        viewer.scene.brightness ||
        stages.add(Cesium.PostProcessStageLibrary.createBrightnessStage()); // 物体描边
      viewer.scene.brightness.enabled = true;
      viewer.scene.brightness.uniforms.brightness = Number(1);
      // 3Dtiles

      // this.viewer = viewer;
      Window.viewer = viewer;
    },
    /**
     * @ 透明度、亮度、灰度、viewer亮度
     */
    putList(val) {
      this.buttonList = val;
      this.gdLayer.alpha = this.buttonList[0].num || 1;
      this.gdLayer.brightness = this.buttonList[1].num || 1;
      this.gdLayer.gamma = this.buttonList[2].num || 1;
      Window.viewer.scene.brightness.uniforms.brightness = Number(
        this.buttonList[3].num
      );
    },
    /**
     * 缩放至模型
     */
    zoomTo() {
      let viewer = Window.viewer;
      var tileset = viewer.scene.primitives.add(
        new Cesium.Cesium3DTileset({
          url: Cesium.IonResource.fromAssetId(40866),
        })
      );
      tileset.readyPromise
        .then(function (tileset) {
          console.log(tileset);
          viewer.zoomTo(tileset, new Cesium.HeadingPitchRange(0, -0.5, 0));

          // viewer.zoomTo(tileset);

          // viewer.flyTo(tileset, {});

          // var boundingSphere = tileset.boundingSphere;
          // viewer.camera.viewBoundingSphere(
          //   boundingSphere,
          //   new Cesium.HeadingPitchRange(0.0, -0.5, boundingSphere.radius)
          // );
          // viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
        })
        .otherwise(function (error) {
          throw error;
        });
    },
  },
};
</script>

<style lang="scss" scoped>
.cesiumHome2 {
  width: 100%;
  height: 100%;
  position: relative;
  #cesiumContainer {
    width: 100%;
    height: 100%;
  }
}
</style>
