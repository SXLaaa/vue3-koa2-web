<template>
  <div class="cesiumHome">
    <div id="cesiumContainer"></div>
    <div class="buttonList">
      <el-button
        v-for="(item, index) in buttonList"
        :key="index"
        @click="getLayerList(item)"
        >{{ item.name }}</el-button
      >
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      viewer: null,
      entity: null,
      buttonList: [
        { id: 1, name: "切换1" },
        { id: 2, name: "切换2" },
        { id: 3, name: "切换3" },
        { id: 4, name: "加载3Dtiles" },
        { id: 5, name: "画图形" },
        { id: 6, name: "camera飞行" },
      ],
    };
  },
  mounted() {
    this.initCesium();
  },
  methods: {
    initCesium() {
      this.viewer = new Cesium.Viewer("cesiumContainer", {
        fullscreenButton: false, //是否显示全屏
        homeButton: false, //是否显示home按钮
        animation: false, //是否显示动画控件(左下方那个)
        baseLayerPicker: false, //是否显示图层选择控件，关掉才能显示其她图层
        geocoder: false, //是否显示地名查找控件
        timeline: false, //是否显示时间线控件
        sceneModePicker: false, //是否显示投影方式控件
        navigationHelpButton: false, //是否显示帮助信息控件
        infoBox: false, //是否显示点击要素之后显示的信息
        imageryProvider: new Cesium.WebMapTileServiceImageryProvider({
          //影像底图
          url:
            "http://t{s}.tianditu.com/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=" +
            "b7d87c30876f4af87ccd40c1abac5634",
          subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
          layer: "tdtImgLayer",
          style: "default",
          format: "image/jpeg",
          tileMatrixSetID: "GoogleMapsCompatible", //使用谷歌的瓦片切片方式
          show: true,
        }),
      });
      this.viewer.scene.debugShowFramesPerSecond = false; // 右上角显示帧速
      this.viewer._cesiumWidget._creditContainer.style.display = "none"; // 隐藏左下角图标
      this.viewer.imageryLayers.addImageryProvider(
        new Cesium.WebMapTileServiceImageryProvider({
          //影像注记
          url:
            "http://t{s}.tianditu.com/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default.jpg&tk=" +
            "b7d87c30876f4af87ccd40c1abac5634",
          subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
          layer: "tdtCiaLayer",
          style: "default",
          format: "image/jpeg",
          tileMatrixSetID: "GoogleMapsCompatible",
          show: true,
        })
      );
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(103.84, 31.15, 17850000),
        orientation: {
          heading: Cesium.Math.toRadians(348.4202942851978),
          pitch: Cesium.Math.toRadians(-89.74026687972041),
          roll: Cesium.Math.toRadians(0),
        },
        complete: function callback() {
          // 定位完成之后的回调函数
        },
      });
      console.log(this.viewer, "------viewer");
    },
    /**
     * 画图
     */
    drawGraphics() {
      // 第一种画图形方法
      var redBox = this.viewer.entities.add({
        name: "Red box with black outline",
        position: Cesium.Cartesian3.fromDegrees(-107.0, 40.0, 300000.0),
        box: {
          dimensions: new Cesium.Cartesian3(400000.0, 300000.0, 500000.0),
          material: Cesium.Color.RED.withAlpha(0.5),
          outline: true,
          outlineColor: Cesium.Color.BLACK,
        },
      });
      // this.viewer.zoomTo(redBox);
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
      this.viewer.dataSources.add(dataSourcePromise);
      this.viewer.zoomTo(dataSourcePromise);
    },
    /**
     * 添加图层/切换
     * 2021/08/24 史小雷
     * ArcGIS 对应 ArcGisMapServerImageryProvider
     * 天地图（wmts服务）对应 WebMapTileServiceImageryProvider
     * 高德地图（xyz瓦片图层）对应 UrlTemplateImageryProvider
     */
    getLayerList(val) {
      switch (val.id) {
        case 1:
          this.viewer.imageryLayers.addImageryProvider(
            new Cesium.ArcGisMapServerImageryProvider({
              url: "https://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer",
            })
          );
          break;
        case 2:
          this.viewer.imageryLayers.addImageryProvider(
            new Cesium.WebMapTileServiceImageryProvider({
              url: "http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer",
              layer: "tdtBasicLayer",
              style: "default",
              format: "image/jpeg",
            })
          );
          break;
        case 3:
          this.viewer.imageryLayers.addImageryProvider(
            new Cesium.UrlTemplateImageryProvider({
              url: "https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
              subdomains: ["1", "2", "3", "4"],
            })
          );
          break;
        case 4:
          this.load3DTiles();
          break;
        case 5:
          this.drawGraphics();
          break;
        case 6:
          this.viewerflyToLonLat(110.0, 35.8, 8000, "camera");
          break;
      }
    },
    /**
     * 定位 viewer.flyTo / Camera.flyTo
     */
    viewerflyToLonLat(lon, lat, alt, type) {
      if (type == "camera") {
        // 设置相机位置
        this.viewer.camera.setView({
          // fromDegrees()方法，将经纬度和高程转换为世界坐标
          destination: Cesium.Cartesian3.fromDegrees(117.48, 30.67, 15000.0),
          orientation: {
            heading: Cesium.Math.toRadians(90, 0),
            pitch: Cesium.Math.toRadians(-90),
            roll: 0.0,
          },
        });
        // 将相机从当前位置移动到新位置
        // this.viewer.camera.flyTo({
        //   destination: Cesium.Cartesian3.fromDegrees(lon, lat, alt), // Cartesian3 | Rectangle , Cartesian3(x,y,z)
        //   duration: 5, // 持续时间
        //   orientation: {
        //     heading: 6.283185307179586, //指向
        //     pitch: -1.5686521559334161, // 视角
        //     roll: 0,
        //   },
        //   // orientation: {
        //   //   direction: new Cesium.Cartesian3(
        //   //     -0.04231243104240401,
        //   //     -0.20123236049443421,
        //   //     -0.97862924300734
        //   //   ),
        //   //   up: new Cesium.Cartesian3(
        //   //     -0.47934589305293746,
        //   //     -0.8553216253114552,
        //   //     0.1966022179118339
        //   //   ),
        //   // },
        // });
      } else {
        // viewer.flyTo
      }
    },
    /**
     * 加载3Dtiles
     */
    load3DTiles() {
      var tileset = new Cesium.Cesium3DTileset({
        url: Cesium.IonResource.fromAssetId(125737),
      });
      this.viewer.scene.primitives.add(tileset);
      var initialPosition = new Cesium.Cartesian3(
        -1111583.3721328347,
        -5855888.151574568,
        2262561.444696748
      );
      var initialOrientation = new Cesium.HeadingPitchRoll.fromDegrees(
        100.0,
        -15.0,
        0.0
      );
      this.viewer.scene.camera.setView({
        destination: initialPosition,
        orientation: initialOrientation,
        endTransform: Cesium.Matrix4.IDENTITY,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.cesiumHome {
  width: 100%;
  height: 100%;
  position: relative;
  #cesiumContainer {
    width: 100%;
    height: 100%;
  }
  .buttonList {
    position: absolute;
    top: 0;
    left: 0;
  }
}
</style>
