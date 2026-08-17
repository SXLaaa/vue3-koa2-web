import axios from 'axios'
import config from '../config'

const NETWORK_ERROR = '本地智能体服务不可用，请确认 Agent 服务已经启动'

const service = axios.create({
    baseURL: config.agentApi,
    timeout: 180000
})

service.interceptors.response.use((response) => {
    const { code, data, msg } = response.data || {}
    if(code === 200){
        return data
    }
    return Promise.reject(new Error(msg || NETWORK_ERROR))
}, (error) => {
    const message = error.response?.data?.msg || error.message || NETWORK_ERROR
    return Promise.reject(new Error(message === 'Network Error' ? NETWORK_ERROR : message))
})

function agentRequest(options){
    const requestOptions = {
        method: 'get',
        ...options
    }
    if(requestOptions.method.toLowerCase() === 'get'){
        requestOptions.params = requestOptions.data
        delete requestOptions.data
    }
    return service(requestOptions)
}

export default agentRequest
