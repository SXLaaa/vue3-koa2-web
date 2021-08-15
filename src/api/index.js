/**
 * api管理
 */
import request from "../utils/request";
export default {
  login(params) {
    return request({
      url: "/users/login",
      method: "post",
      data: params,
    });
  },
  noticeCount(params) {
    // 待审批通知数量
    return request({
      url: "/leave/count",
      method: "get",
      data: {},
      mock: true,
    });
  },
  getMenuList(params) {
    // 获取菜单列表
    return request({
      url: "/menu/list",
      method: "get",
      data: {},
      mock: true,
    });
  },
  getUserList(params) {
    // 获用户列表
    return request({
      url: "/users/list",
      method: "get",
      data: params,
      mock: true,
    });
  },
  userDel(params) {
    // 删除单个用户/多个用户
    return request({
      url: "/users/delete",
      method: "post",
      data: params,
      mock: true,
    });
  },
  getRoleList() {
    // 角色列表
    return request({
      url: "/roles/list",
      method: "get",
      data: {},
      mock: true,
    });
  },
  getDeptList() {
    //部门列表
    return request({
      url: "/dept/list",
      method: "get",
      data: {},
      mock: true,
    });
  },
  userSubmit(params) {
    return request({
      url: "/users/operate",
      method: "post",
      data: params,
      mock: true,
    });
  },
};
