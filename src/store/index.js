/*
 * @Description:
 * @Version: 2.0
 * @Autor: shiXl
 * @Date: 2021-08-08 17:09:50
 * @LastEditors: shiXl
 * @LastEditTime: 2021-11-18 22:19:13
 */
import { createStore } from "vuex";
import mutations from "./mutations";
import storage from "../utils/storage";

const state = {
  userInfo: storage.getItem("userInfo") || {}, // 获取用户信息
  menuList: storage.getItem("menuList") || [], // 获取菜单权限
  actionList: storage.getItem("actionList") || [], // 获取菜单按钮权限
};
export default createStore({
  state,
  mutations,
});
