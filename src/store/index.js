/*
 * @Description:
 * @Version: 2.0
 * @Autor: shiXl
 * @Date: 2021-08-08 17:09:50
 * @LastEditors: shiXl
 * @LastEditTime: 2021-09-05 20:56:18
 */
import { createStore } from "vuex";
import mutations from "./mutations";
import storage from "../utils/storage";

const state = {
  userInfo: storage.getItem("userInfo") || {}, // 获取用户信息
};
export default createStore({
  state,
  mutations,
});
