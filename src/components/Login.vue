<template>
  <h1>欢迎来到登录界面</h1>
  <el-button @click="goHome">回首页</el-button>
</template>

<script>
import Welcome from './Welcome.vue'
export default {
  name:'login',
  components:{Welcome},
  mounted(){
    // 第一种请求方式
    /*
    this.$request({
      method: 'get',
      url: '/login',
      data: {
        name:'jack'
      }
    }).then((res)=>{
      console.log(res)
    })
    */
   // 第二种请求方式
   this.$request.get('/login',{name:'jack'},{mock:true,loading:true}).then((res)=>{
     console.log(res)
   })
  },
  methods:{
    goHome(){
      this.$router.push('/welcome')
    }
  }
}
</script>

<style scoped>
a {
  color: #42b983;
}
</style>