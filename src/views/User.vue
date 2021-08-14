<template>
  <div class="user-manag">
    <div class="query-form">
      <el-form ref="form" :inline="true" :model="user">
        <el-form-item label="用户ID" prop="userId">
            <el-input v-model="user.userId" placeholder="请输入用户ID"/>
        </el-form-item>
        <el-form-item label="用户名称" prop="userName">
            <el-input  v-model="user.userName" placeholder="请输入用户名称"/>
        </el-form-item>
        <el-form-item label="状态" prop="state">
            <el-select v-model="user.state">
                <el-option :value="0" label="所有"></el-option>
                <el-option :value="1" label="在职"></el-option>
                <el-option :value="2" label="离职"></el-option>
                <el-option :value="3" label="试用期"></el-option>
            </el-select>
        </el-form-item>
        <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="base-table">
      <div class="action">
        <el-button type="primary">新增</el-button>
        <el-button type="danger">批量删除</el-button>
      </div>
      <el-table :data="userList">
        <el-table-column type="selection" width="55"/>
        <el-table-column
          v-for="item in columns"
          :key="item.prop"
          :prop="item.prop"
          :label="item.label"
          :width="item.width">
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button @click="handleClick(scope.row)" size="mini">编辑</el-button>
            <el-button type="danger" size="mini">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pagination"
        background
        layout="prev, pager, next"
        :total="pager.total"
        :page-size="pager.pageSize"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>
<script>
import {getCurrentInstance, onMounted, reactive, ref } from 'vue'
export default {
  name:'user',
  setup(){
    /**
     * ref 定义基本数据类型（.value访问） reactive定义复杂类型（直接访问）
     * */ 
    const { proxy } = getCurrentInstance();// ctx 是上下文对象，可以拿到很多字段。 getCurrentInstance 方法获取当前组件实例
    // 初始化数据
    const user = reactive({
      state:0
    });
    const userList = ref([]);
    const pager = reactive({
      pageNum: 1,
      pageSize: 10
    })
    // 表格格式
    const columns = reactive([
      {
        label:'用户ID',
        prop:'userId'
      },
      {
        label:'用户名',
        prop:'userName'
      },
      {
        label:'用户邮箱',
        prop:'userEmail'
      },
      {
        label:'用户角色',
        prop:'role'
      },
      {
        label:'用户状态',
        prop:'state'
      },
      {
        label:'注册时间',
        prop:'createTime'
      },
      {
        label:'最后登录时间',
        prop:'lastLoginTime'
      }
    ])
    // 初始化接口调用
    onMounted(()=> {
      getUserList()
    })
    const getUserList = async ()=> {
      let params = {...user, ...pager};
      try{
        const { list,page } = await proxy.$api.getUserList(params)
        userList.value = list;
        pager.total = page.total;
      }catch(error){

      }
    }
    // 查询
    const handleQuery = ()=> {
      getUserList();
    }
    // 重置
    const handleReset = ()=> {
      proxy.$refs.form.resetFields(); // proxy相当于this
    }
    // 分页
    const handleCurrentChange = (current)=>{
      pager.pageNum = current;
      getUserList();
    }
    return {
      user, userList, columns, pager,
      getUserList, handleQuery, handleReset, handleCurrentChange
    }
  }
}
</script>
<style lang="scss">

</style>