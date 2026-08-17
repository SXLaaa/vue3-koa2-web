import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../components/Home.vue'
import storage from '../utils/storage'

const whiteList = ['/login', '/agent']

const routes = [
    {
        name:'home',
        path:'/',
        meta:{
            title:'首页'
        },
        component:Home,
        redirect:'/welcome',
        children:[
            {
                name:'welcome',
                path:'/welcome',
                meta:{
                    title:'欢迎页'
                },
                component:()=>import('../views/Welcome.vue'),
            },
            {
                name:'agent',
                path:'/agent',
                meta:{
                    title:'本地智能体'
                },
                component:()=>import('../views/Agent.vue'),
            }
        ]
    },
    {
        name:'login',
        path:'/login',
        meta:{
            title:'登陆'
        },
        component:()=>import('../views/Login.vue'),
    },
]
const router = createRouter({
    history:createWebHashHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    document.title = to.meta.title || '本地智能体工作台'
    if(whiteList.includes(to.path) || storage.getItem('userInfo')){
        next()
        return
    }
    next({
        path:'/login',
        query:{
            redirect:to.fullPath
        }
    })
})

export default router
