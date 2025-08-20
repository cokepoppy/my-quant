<template>
  <div class="users">
    <div class="page-header animate-fade-in">
      <h2 class="text-gradient-primary">用户管理</h2>
      <el-button type="primary" @click="handleAdd" class="premium-button primary">
        <el-icon><plus /></el-icon>
        添加用户
      </el-button>
    </div>

    <el-card class="premium-card fade-in">
      <el-form :model="searchForm" inline>
        <el-form-item label="用户名">
          <el-input
            v-model="searchForm.username"
            placeholder="请输入用户名"
            clearable
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input
            v-model="searchForm.email"
            placeholder="请输入邮箱"
            clearable
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select
            v-model="searchForm.role"
            placeholder="请选择角色"
            clearable
          >
            <el-option label="管理员" value="admin" />
            <el-option label="用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" class="premium-button">搜索</el-button>
          <el-button @click="handleReset" class="premium-button">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        border
        class="premium-table"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="role" label="角色">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'success'">
              {{ row.role === "admin" ? "管理员" : "用户" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === "active" ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)" class="premium-button">编辑</el-button>
            <el-button
              size="small"
              :type="row.status === 'active' ? 'danger' : 'success'"
              @click="handleToggleStatus(row)"
              class="premium-button"
            >
              {{ row.status === "active" ? "禁用" : "启用" }}
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)"
              class="premium-button danger">删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加用户' : '编辑用户'"
      width="500px"
      class="premium-modal"
    >
      <el-form
        ref="formRef"
        :model="userForm"
        :rules="userRules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="请选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="dialogType === 'add'" label="密码" prop="password">
          <el-input
            v-model="userForm.password"
            type="password"
            placeholder="请输入密码"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false" class="premium-button">取消</el-button>
        <el-button type="primary" @click="handleSave" class="premium-button primary">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
} from "element-plus";

const loading = ref(false);
const dialogVisible = ref(false);
const dialogType = ref<"add" | "edit">("add");
const formRef = ref<FormInstance>();

const searchForm = reactive({
  username: "",
  email: "",
  role: "",
});

const userForm = reactive({
  id: "",
  username: "",
  email: "",
  phone: "",
  role: "user",
  password: "",
});

const userRules: FormRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    {
      min: 3,
      max: 20,
      message: "用户名长度在 3 到 20 个字符",
      trigger: "blur",
    },
  ],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
  ],
  phone: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入正确的手机号格式",
      trigger: "blur",
    },
  ],
  role: [{ required: true, message: "请选择角色", trigger: "change" }],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码长度不能少于6位", trigger: "blur" },
  ],
};

const tableData = ref([]);
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});

const fetchUsers = async () => {
  loading.value = true;
  try {
    // TODO: 从API获取用户列表
    // 模拟数据
    await new Promise((resolve) => setTimeout(resolve, 1000));
    tableData.value = [
      {
        id: 1,
        username: "admin",
        email: "admin@example.com",
        phone: "13800138000",
        role: "admin",
        status: "active",
        createdAt: "2024-01-01 00:00:00",
      },
      {
        id: 2,
        username: "user1",
        email: "user1@example.com",
        phone: "13800138001",
        role: "user",
        status: "active",
        createdAt: "2024-01-02 00:00:00",
      },
    ];
    pagination.total = 2;
  } catch (error) {
    ElMessage.error("获取用户列表失败");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  fetchUsers();
};

const handleReset = () => {
  Object.assign(searchForm, {
    username: "",
    email: "",
    role: "",
  });
  handleSearch();
};

const handleSizeChange = (size: number) => {
  pagination.size = size;
  fetchUsers();
};

const handleCurrentChange = (page: number) => {
  pagination.page = page;
  fetchUsers();
};

const handleAdd = () => {
  dialogType.value = "add";
  Object.assign(userForm, {
    id: "",
    username: "",
    email: "",
    phone: "",
    role: "user",
    password: "",
  });
  dialogVisible.value = true;
};

const handleEdit = (row: any) => {
  dialogType.value = "edit";
  Object.assign(userForm, {
    ...row,
    password: "",
  });
  dialogVisible.value = true;
};

const handleSave = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    // TODO: 调用API保存用户
    await new Promise((resolve) => setTimeout(resolve, 1000));

    ElMessage.success(dialogType.value === "add" ? "添加成功" : "编辑成功");
    dialogVisible.value = false;
    fetchUsers();
  } catch (error) {
    console.error("Form validation failed:", error);
  }
};

const handleToggleStatus = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要${row.status === "active" ? "禁用" : "启用"}该用户吗？`,
      "确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    // TODO: 调用API切换用户状态
    await new Promise((resolve) => setTimeout(resolve, 1000));

    ElMessage.success("操作成功");
    fetchUsers();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("操作失败");
    }
  }
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm("确定要删除该用户吗？删除后无法恢复！", "确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    // TODO: 调用API删除用户
    await new Promise((resolve) => setTimeout(resolve, 1000));

    ElMessage.success("删除成功");
    fetchUsers();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.users {
  padding: 20px;
  background: var(--gradient-primary);
  min-height: 100vh;
  position: relative;
}

.users::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 10% 20%, rgba(0, 122, 255, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 90% 80%, rgba(0, 212, 170, 0.05) 0%, transparent 50%);
  pointer-events: none;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  box-shadow: var(--shadow-glass);
  transition: all var(--transition-smooth) var(--transition-spring);
}

.page-header:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-premium-lg);
}

.page-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 28px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.pagination {
  margin-top: 20px;
  text-align: right;
  position: relative;
  z-index: 1;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  box-shadow: var(--shadow-glass);
  transition: all var(--transition-smooth) var(--transition-spring);
}

.pagination:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-premium-lg);
}
</style>
