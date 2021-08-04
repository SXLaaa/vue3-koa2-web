/**
 * 环境变量配置
*/
const env = import.meta.env.MODE || 'prod'; // 获取环境变量，如果取不到，默认是生产
const EnvConfig = {
  dev:{
    baseApi:'/',
    mockApi:''
  },
  test:{
    baseApi:'/',
    mockApi:''
  },
  prod:{
    baseApi:'/',
    mockApi:''
  }
}
export default {
  env,
  mock: true,
  namespace: 'manager',
  ...EnvConfig[env]
}