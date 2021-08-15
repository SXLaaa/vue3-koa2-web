<template>
  <div class="user-manag">
    <div class="query-form">
      <el-form ref="form" :inline="true" :model="user">
        <el-form-item label="用户ID" prop="userId">
          <el-input v-model="user.userId" placeholder="请输入用户ID" />
        </el-form-item>
        <el-form-item label="用户名称" prop="userName">
          <el-input v-model="user.userName" placeholder="请输入用户名称" />
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
          <el-button @click="handleReset(form)">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="base-table">
      <div class="action">
        <el-button type="primary" @click="handleCreate">新增</el-button>
        <el-button type="danger" @click="handlePatchDel">批量删除</el-button>
      </div>
      <el-table :data="userList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column
          v-for="item in columns"
          :key="item.prop"
          :prop="item.prop"
          :label="item.label"
          :width="item.width"
          :formatter="item.formatter"
        >
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button @click="handleEdit(scope.row)" size="mini"
              >编辑</el-button
            >
            <el-button type="danger" size="mini" @click="handleDel(scope.row)"
              >删除</el-button
            >
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
    <el-dialog title="用户新增" v-model="showModal">
      <el-form
        ref="dialogForm"
        :model="userForm"
        label-width="100px"
        :rules="rules"
      >
        <el-form-item label="用户名" prop="userName">
          <el-input
            :disable="action == 'edit'"
            v-model="userForm.userName"
            :disabled="action == 'edit'"
            placeholder="请输入用户名称"
          />
        </el-form-item>
        <el-form-item label="邮箱" prop="userEmail">
          <el-input
            :disable="action == 'edit'"
            v-model="userForm.userEmail"
            :disabled="action == 'edit'"
            placeholder="请输入用户邮箱"
          >
            <template #append>@imooc.com</template>
          </el-input>
        </el-form-item>
        <el-form-item label="手机号" prop="mobile">
          <el-input v-model="userForm.mobile" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="岗位" prop="job">
          <el-input v-model="userForm.job" placeholder="请输入岗位" />
        </el-form-item>
        <el-form-item label="状态" prop="state">
          <el-select v-model="userForm.state">
            <el-option :value="1" label="在职"></el-option>
            <el-option :value="2" label="离职"></el-option>
            <el-option :value="3" label="试用期"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="系统角色" prop="roleList">
          <el-select
            v-model="userForm.roleList"
            placeholder="请选择用户系统角色"
            multiple
            style="width: 100%"
          >
            <el-option
              v-for="role in roleList"
              :key="role._id"
              :label="role.roleName"
              :value="role._id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="部门" prop="deptId">
          <el-cascader
            v-model="userForm.deptId"
            placeholder="请选择所属部门"
            :options="deptList"
            :props="{ checkStrictly: true, value: '_id', label: 'deptName' }"
            clearable
            style="width: 100%"
          ></el-cascader>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleClose">取 消</el-button>
          <el-button type="primary" @click="handleSubmit">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
<script>
import { getCurrentInstance, onMounted, reactive, ref, toRaw } from "vue";
import utils from "../utils/utils";
export default {
  name: "user",
  setup() {
    /**
     * ref 定义基本数据类型（.value访问） reactive定义复杂类型（直接访问）
     * toRaw 返回响应式对象的普通对象，可以通过这个对象达到修改数据，而不更新页面的效果
     * proxy 是上下文对象，可以拿到很多字段（替代this）。 getCurrentInstance 方法获取当前组件实例
     * */
    const { proxy } = getCurrentInstance();
    // 初始化数据
    const user = reactive({
      state: 1,
    });
    const userList = ref([]);
    const pager = reactive({
      pageNum: 1,
      pageSize: 10,
    });
    // 选中用户列表对象
    const checkeUserIds = ref([]);
    // 表格格式
    const columns = reactive([
      {
        label: "用户ID",
        prop: "userId",
      },
      {
        label: "用户名",
        prop: "userName",
      },
      {
        label: "用户邮箱",
        prop: "userEmail",
      },
      {
        label: "用户角色",
        prop: "role",
        formatter(row, column, value) {
          return {
            0: "管理员",
            1: "普通用户",
          }[value];
        },
      },
      {
        label: "用户状态",
        prop: "state",
        formatter(row, column, value) {
          return {
            1: "在职",
            2: "离职",
            3: "试用期",
          }[value];
        },
      },
      {
        label: "注册时间",
        prop: "createTime",
        width: 180,
        formatter: (row, column, value) => {
          return utils.formateDate(new Date(value));
        },
      },
      {
        label: "最后登录时间",
        prop: "lastLoginTime",
        width: 180,
        formatter: (row, column, value) => {
          return utils.formateDate(new Date(value));
        },
      },
    ]);
    // 弹框显示
    const showModal = ref(false);
    const userForm = reactive({
      state: 3, // 默认状态
    });
    // 角色列表
    const roleList = ref([]);
    // 部门列表
    const deptList = ref([]);
    // 定义是新增/编辑
    const action = ref("add");
    const rules = reactive({
      userName: [
        {
          required: true,
          message: "请输入用户名称",
          trigger: "blur",
        },
      ],
      userEmail: [
        { required: true, message: "请输入用户邮箱", trigger: "blur" },
      ],
      mobile: [
        {
          pattern: /1[3-9]\d{9}/,
          message: "请输入正确的手机号格式",
          trigger: "blur",
        },
      ],
      deptId: [
        {
          required: true,
          message: "请输入用户邮箱",
          trigger: "blur",
        },
      ],
    });
    // 初始化接口调用
    onMounted(() => {
      getUserList();
      getRoleList();
      getDepList();
    });
    const getUserList = async () => {
      let params = { ...user, ...pager };
      try {
        const { list, page } = await proxy.$api.getUserList(params);
        userList.value = list;
        pager.total = page.total;
      } catch (error) {}
    };
    // 查询
    const handleQuery = () => {
      getUserList();
    };
    // 重置
    const handleReset = (form) => {
      proxy.$refs[form].resetFields(); // proxy相当于this
    };
    // 分页
    const handleCurrentChange = (current) => {
      pager.pageNum = current;
      getUserList();
    };
    // 单个删除
    const handleDel = async (row) => {
      await proxy.$api.userDel({
        userIds: [row.userId],
      });
      proxy.$message.success("删除成功");
      getUserList();
    };
    // 批量删除
    const handlePatchDel = async () => {
      if (checkeUserIds.value.length == 0) {
        proxy.$message.error("请选择要删除的用户");
        return;
      }
      const res = await proxy.$api.userDel({
        userIds: checkeUserIds.value,
      });
      if (res.nModified > 0) {
        proxy.$message.success("删除成功");
        getUserList();
      } else {
        proxy.$message.success("修改失败");
      }
    };
    // 表格多选
    const handleSelectionChange = (list) => {
      let arr = [];
      list.map((item) => {
        arr.push(item.userId);
      });
      checkeUserIds.value = arr;
    };
    // 用户新增
    const handleCreate = () => {
      showModal.value = true;
      action.value = "add";
    };
    // 用户编辑
    const handleEdit = (row) => {
      action.value = "edit";
      showModal.value = true;
      proxy.$nextTick(() => {
        // 点击编辑，给form赋值
        Object.assign(userForm, row);
      });
    };
    // 用户新增=取消/确定
    const handleClose = () => {
      showModal.value = false;
      handleReset("dialogForm");
    };
    const handleSubmit = () => {
      proxy.$refs.dialogForm.validate(async (valid) => {
        if (valid) {
          let params = toRaw(userForm);
          params.userEmail += "@imooc.com";
          params.action = action.value;
          let res = await proxy.$api.userSubmit(params);
          showModal.value = false;
          proxy.$message.success("用户创建成功");
          handleReset("dialogForm");
          getUserList();
        }
      });
    };
    /**
     * 接口=获取角色、获取部门
     */
    const getDepList = async () => {
      let list = await proxy.$api.getDeptList();
      deptList.value = list;
    };
    const getRoleList = async () => {
      let list = await proxy.$api.getRoleList();
      roleList.value = list.list;
    };
    return {
      user,
      userList,
      columns,
      pager,
      action,
      checkeUserIds,
      showModal,
      userForm,
      rules,
      roleList,
      deptList,
      getUserList,
      handleQuery,
      handleReset,
      handleCurrentChange,
      handleDel,
      handlePatchDel,
      handleSelectionChange,
      handleCreate,
      handleEdit,
      handleClose,
      handleSubmit,
      getRoleList,
      getDepList,
    };
  },
};
</script>
<style lang="scss"></style>
