<template>
  <div class="forgot-password">
    <el-card class="forgot-password-card">
      <template #header>
        <h2>忘记密码</h2>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="0"
        size="large"
      >
        <el-form-item prop="email">
          <el-input
            v-model="form.email"
            placeholder="请输入邮箱地址"
            prefix-icon="Message"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            style="width: 100%"
            :loading="loading"
            @click="handleSubmit"
          >
            发送重置邮件
          </el-button>
        </el-form-item>

        <div class="form-links">
          <router-link to="/login" class="link">返回登录</router-link>
          <router-link to="/register" class="link">注册账号</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";

const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({
  email: "",
});

const rules: FormRules = {
  email: [
    { required: true, message: "请输入邮箱地址", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
  ],
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    // TODO: 实现发送重置密码邮件的逻辑
    await new Promise((resolve) => setTimeout(resolve, 1000));

    ElMessage.success("重置密码邮件已发送，请查收");
  } catch (error) {
    console.error("Form validation failed:", error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.forgot-password {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.forgot-password-card {
  width: 100%;
  max-width: 400px;
}

.forgot-password-card :deep(.el-card__header) {
  text-align: center;
  background: transparent;
  border-bottom: none;
  padding-bottom: 0;
}

.forgot-password-card h2 {
  margin: 0;
  color: #333;
  font-weight: 600;
}

.form-links {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.link {
  color: #409eff;
  text-decoration: none;
  font-size: 14px;
}

.link:hover {
  text-decoration: underline;
}
</style>
