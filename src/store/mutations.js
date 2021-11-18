/*
 * @Description:
 * @Version: 2.0
 * @Autor: shiXl
 * @Date: 2021-08-08 17:09:50
 * @LastEditors: shiXl
 * @LastEditTime: 2021-11-18 22:20:21
 */
/**
 * Mutations 业务层数据提交
 * */
import storage from "../utils/storage";

export default {
  saveUserInfo(state, userInfo) {
    state.userInfo = userInfo;
    storage.setItem("userInfo", userInfo);
  },
  saveUserMenu(state, menuList) {
    state.menuList = menuList;
    storage.setItem("menuList", menuList);
  },
  saveUserAction(state, actionList) {
    state.actionList = actionList;
    storage.setItem("actionList", actionList);
  },
};
