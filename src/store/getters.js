const getters = {
  // 获取用户信息
  getUserInfo: (state) => state.userInfo,
  // 获取菜单列表
  getMenuList: (state) => state.menuList,
  // 获取按钮权限列表
  getActionList: (state) => state.actionList,
  // 获取 Cesium 的 Viewer 实例
  getCesiumViewer: (state) => state.cesiumViewer,
  // 获取天地图的 API Key
  getTiandituApiKey: (state) => state.baseMaps.tiandituApiKey,
  // 获取天地图矢量地图的 URL 模板
  getVectorUrlTemplate: (state) => state.baseMaps.VECTOR.urlTemplate,
  // 获取天地图影像地图的 URL 模板
  getImageUrlTemplate: (state) => state.baseMaps.IMAGE.urlTemplate,
};

export default getters;
