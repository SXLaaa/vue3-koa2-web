/**
 * api管理
 */
import request from '../utils/request'
export default {
    login(params){
        return request({
            url:'/users/login',
            method:'post',
            data:params,
        })
    },
    noticeCount(params){ // 待审批通知数量
        return request({
            url:'/leave/count',
            method:'get',
            data:{},
            mock: true
        })
    },
    getMenuList(params){ // 获取菜单列表
        return request({
            url:'/menu/list',
            method:'get',
            data:{},
            mock: true
        })
    },
}