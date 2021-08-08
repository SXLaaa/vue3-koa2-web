import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/lib/theme-chalk/index.css';
import request from './utils/request'
<<<<<<< HEAD
import storage from './utils/storage'
=======
import api from './api/index'
import storage from './utils/storage'
import store from './store/index'
>>>>>>> origin/8-8登陆布局开发

// console.log("环境变量=>",import.meta.env)

const app = createApp(App);
<<<<<<< HEAD
app.config.globalProperties.$request = request // 挂载请求
app.config.globalProperties.$storage = storage // 挂载请求
app.use(router).use(ElementPlus).mount('#app')
=======
app.config.globalProperties.$request = request;
app.config.globalProperties.$api = api;
app.config.globalProperties.$storage = storage;
app.use(router).use(store).use(ElementPlus).mount('#app')
>>>>>>> origin/8-8登陆布局开发
