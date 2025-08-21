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
  background: var(--gradient-primary);
  padding: 20px;
  position: relative;
}

.forgot-password::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 10% 20%, rgba(0, 122, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 90% 80%, rgba(0, 212, 170, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.forgot-password-card {
  width: 100%;
  max-width: 440px;
  background: var(--glass-bg) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--radius-xl) !important;
  box-shadow: var(--shadow-premium-lg) !important;
  position: relative;
  z-index: 1;
  transition: all var(--transition-smooth) var(--transition-spring);
}

.forgot-password-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.forgot-password-card:hover::before {
  left: 100%;
}

.forgot-password-card:hover {
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-premium-xl) !important;
  border-color: var(--border-glow-primary) !important;
}

.forgot-password-card :deep(.el-card__header) {
  text-align: center;
  background: transparent !important;
  border-bottom: none !important;
  padding-bottom: 0 !important;
}

.forgot-password-card h2 {
  margin: 0;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 28px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.form-links {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
}

.link {
  color: var(--btn-primary);
  text-decoration: none;
  font-size: var(--font-sm);
  font-weight: var(--font-medium);
  transition: all var(--transition-smooth) var(--transition-spring);
}

.link:hover {
  color: var(--btn-primary-hover);
  text-shadow: 0 0 8px rgba(0, 212, 170, 0.4);
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

/* 按钮样式 */
.el-button {
  background: var(--btn-primary) !important;
  border-color: var(--btn-primary) !important;
  border-radius: var(--radius-lg) !important;
  font-weight: var(--font-semibold) !important;
  font-size: var(--font-base) !important;
  height: 48px !important;
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
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%) !important;
  transition: all 0.5s ease !important;
  transform: translate(-50%, -50%) !important;
}

.el-button:hover::before {
  width: 300px !important;
  height: 300px !important;
}

.el-button:hover {
  background: var(--btn-primary-hover) !important;
  border-color: var(--btn-primary-hover) !important;
  box-shadow: var(--glow-primary) !important;
  transform: translateY(-2px) !important;
}

/* 卡片样式 */
.el-card {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.el-card__body {
  padding: 32px !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .forgot-password {
    padding: 12px;
  }

  .forgot-password-card {
    max-width: 100%;
    margin: 0 12px;
  }

  .forgot-password-card h2 {
    font-size: var(--font-xl);
  }

  .form-links {
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }

  .el-button {
    height: 44px !important;
    font-size: var(--font-base) !important;
  }

  .el-card__body {
    padding: 24px !important;
  }
}
</style>
