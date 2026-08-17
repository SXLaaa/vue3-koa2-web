/**
 * api管理
 */
import request from '../utils/request'
import agentApi from './agent'
export default {
    login(params){
        return request({
            url:'/users/login',
            method:'post',
            data:params,
        })
    },
    ...agentApi
}
