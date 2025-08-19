<template>
  <div class="profile">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <h2>个人资料</h2>
          <el-button type="primary" @click="handleEdit">编辑</el-button>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        :disabled="!isEditing"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="form.username" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色" prop="role">
              <el-input v-model="form.role" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="个人简介" prop="bio">
          <el-input
            v-model="form.bio"
            type="textarea"
            :rows="4"
            placeholder="请输入个人简介"
          />
        </el-form-item>

        <el-form-item label="创建时间" prop="createdAt">
          <el-input v-model="form.createdAt" disabled />
        </el-form-item>

        <el-form-item v-if="isEditing">
          <el-button type="primary" @click="handleSave">保存</el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";

const formRef = ref<FormInstance>();
const isEditing = ref(false);

const form = reactive({
  username: "",
  email: "",
  phone: "",
  role: "",
  bio: "",
  createdAt: "",
});

const originalForm = reactive({ ...form });

const rules: FormRules = {
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
};

const fetchProfile = async () => {
  try {
    // TODO: 从API获取用户资料
    // 模拟数据
    form.username = "demo_user";
    form.email = "demo@example.com";
    form.phone = "13800138000";
    form.role = "用户";
    form.bio = "这是一个示例用户";
    form.createdAt = "2024-01-01 00:00:00";

    Object.assign(originalForm, form);
  } catch (error) {
    ElMessage.error("获取用户资料失败");
  }
};

const handleEdit = () => {
  isEditing.value = true;
};

const handleSave = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    // TODO: 调用API保存用户资料
    await new Promise((resolve) => setTimeout(resolve, 1000));

    Object.assign(originalForm, form);
    isEditing.value = false;
    ElMessage.success("保存成功");
  } catch (error) {
    console.error("Form validation failed:", error);
  }
};

const handleCancel = () => {
  Object.assign(form, originalForm);
  isEditing.value = false;
};

onMounted(() => {
  fetchProfile();
});
</script>

<style scoped>
.profile {
  padding: 20px;
}

.profile-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  color: #333;
}
</style>
