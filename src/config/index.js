/**
<<<<<<< HEAD
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
=======
 * 环境配置封装
 */
const env = import.meta.env.MODE || 'prod';
const EnvConfig = {
    dev:{
        baseApi:'/',
        mockApi:'https://www.fastmock.site/mock/4f8a76c109fe7d95e131ee5a72d23dff/api'
    },
    test:{
        baseApi:'//test.futurefe.com/api',
        mockApi:'https://www.fastmock.site/mock/4f8a76c109fe7d95e131ee5a72d23dff/api'
    },
    prod:{
        baseApi:'//futurefe.com/api',
        mockApi:'https://www.fastmock.site/mock/4f8a76c109fe7d95e131ee5a72d23dff/api'
    }
}
export default {
    env,
    mock:true,
    namespace:'manager',
    ...EnvConfig[env]
>>>>>>> origin/8-8登陆布局开发
}