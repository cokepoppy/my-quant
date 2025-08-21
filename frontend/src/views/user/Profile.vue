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
  background: var(--gradient-primary);
  min-height: 100vh;
  position: relative;
}

.profile::before {
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

.profile-card {
  max-width: 900px;
  margin: 0 auto;
  background: var(--glass-bg) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--radius-xl) !important;
  box-shadow: var(--shadow-glass) !important;
  transition: all var(--transition-smooth) var(--transition-spring) !important;
  position: relative;
  overflow: hidden !important;
}

.profile-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.profile-card:hover::before {
  left: 100%;
}

.profile-card:hover {
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-premium-lg) !important;
  border-color: var(--border-glow-primary) !important;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--glass-border);
}

.card-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 28px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* 表单样式 */
.el-form-item__label {
  color: var(--text-secondary) !important;
  font-weight: var(--font-medium) !important;
  font-size: var(--font-sm) !important;
}

.el-input__wrapper {
  background: var(--input-bg) !important;
  border-color: var(--input-border) !important;
  border-radius: var(--radius-md) !important;
  transition: all var(--transition-smooth) var(--transition-spring) !important;
}

.el-input__wrapper:hover {
  border-color: var(--input-hover) !important;
}

.el-input__wrapper.is-focus {
  border-color: var(--input-focus) !important;
  box-shadow: 0 0 0 2px var(--glow-primary) !important;
}

.el-input__inner {
  color: var(--input-text) !important;
  font-size: var(--font-base) !important;
}

.el-input.is-disabled .el-input__wrapper {
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}

.el-input.is-disabled .el-input__inner {
  color: var(--text-secondary) !important;
  cursor: not-allowed;
}

.el-textarea__inner {
  background: var(--input-bg) !important;
  border-color: var(--input-border) !important;
  border-radius: var(--radius-md) !important;
  color: var(--input-text) !important;
  transition: all var(--transition-smooth) var(--transition-spring) !important;
}

.el-textarea__inner:hover {
  border-color: var(--input-hover) !important;
}

.el-textarea__inner:focus {
  border-color: var(--input-focus) !important;
  box-shadow: 0 0 0 2px var(--glow-primary) !important;
}

/* 按钮样式 */
.el-button {
  background: var(--gradient-glass) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--radius-lg) !important;
  font-weight: var(--font-semibold) !important;
  color: var(--text-primary) !important;
  transition: all var(--transition-smooth) var(--transition-spring) !important;
  position: relative !important;
  overflow: hidden !important;
}

.el-button::before {
  content: '' !important;
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  width: 0 !important;
  height: 0 !important;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%) !important;
  transition: all 0.5s ease !important;
  transform: translate(-50%, -50%) !important;
}

.el-button:hover::before {
  width: 300px !important;
  height: 300px !important;
}

.el-button:hover {
  transform: translateY(-2px) !important;
  box-shadow: var(--glow-primary) !important;
  border-color: var(--border-glow-primary) !important;
}

.el-button--primary {
  background: var(--btn-primary) !important;
  border-color: var(--btn-primary) !important;
  color: white !important;
}

.el-button--primary:hover {
  background: var(--btn-primary-hover) !important;
  box-shadow: var(--glow-primary) !important;
}

/* 卡片头部样式 */
.el-card__header {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(10px) !important;
  border-bottom: 1px solid var(--glass-border) !important;
  padding: var(--space-lg) !important;
}

.el-card__body {
  background: transparent !important;
  padding: var(--space-lg) !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile {
    padding: 12px;
  }

  .profile-card {
    margin: 0;
    border-radius: var(--radius-lg) !important;
  }

  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
    padding-bottom: var(--space-sm);
  }

  .card-header h2 {
    font-size: var(--font-xl);
  }

  .el-form-item__label {
    float: none;
    display: block;
    text-align: left;
    margin-bottom: 8px;
  }

  .el-form-item__content {
    margin-left: 0 !important;
  }

  .el-col {
    margin-bottom: 16px;
  }

  .el-col:last-child {
    margin-bottom: 0;
  }
}
</style>
