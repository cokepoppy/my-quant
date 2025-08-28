<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h1>量化交易系统</h1>
        <p>欢迎回来，请登录您的账户</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="email">
          <el-input
            v-model="loginForm.email"
            type="email"
            placeholder="请输入邮箱地址"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <div class="form-options">
            <el-checkbox v-model="loginForm.rememberMe"> 记住我 </el-checkbox>
            <router-link to="/forgot-password" class="forgot-password">
              忘记密码？
            </router-link>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-button"
            :loading="authStore.isLoading"
            @click="handleLogin"
          >
            {{ authStore.isLoading ? "登录中..." : "登录" }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <p>
          还没有账户？
          <router-link to="/register" class="register-link">
            立即注册
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { useAuthStore } from "@/stores/auth";
import type { LoginData } from "@/types/auth";

const router = useRouter();
const authStore = useAuthStore();

console.log("=== 登录页面加载 ===");
console.log("authStore:", authStore);
console.log("router:", router);

// 表单引用
const loginFormRef = ref<FormInstance>();

// 登录表单数据
const loginForm = reactive<LoginData>({
  email: "",
  password: "",
  rememberMe: false,
});

// 表单验证规则
const loginRules: FormRules = {
  email: [
    { required: true, message: "请输入邮箱地址", trigger: "blur" },
    { type: "email", message: "请输入有效的邮箱地址", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码长度至少6位", trigger: "blur" },
  ],
};

// 处理登录
const handleLogin = async () => {
  console.log("=== 登录按钮被点击 ===");
  if (!loginFormRef.value) return;

  console.log("=== 登录调试信息 ===");
  console.log("表单数据:", JSON.stringify(loginForm, null, 2));

  try {
    // 验证表单
    console.log("开始验证表单...");
    await loginFormRef.value.validate();
    console.log("表单验证通过");

    // 调用登录接口
    console.log("调用登录接口...");
    await authStore.login(loginForm);
    console.log("登录接口调用成功");

    // 确保认证状态已更新
    console.log("检查认证状态:", authStore.isAuthenticated);
    
    // 等待一下确保状态更新完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log("最终认证状态:", authStore.isAuthenticated);
    
    // 登录成功，跳转到首页
    await router.push("/");
  } catch (error) {
    // 错误处理已在store中完成
    console.error("Login failed:", error);
    console.error("错误详情:", JSON.stringify(error, null, 2));
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-primary);
  padding: 20px;
  position: relative;
}

.login-container::before {
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

.login-box {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--radius-xl) !important;
  box-shadow: var(--shadow-premium-lg) !important;
  padding: 48px;
  width: 100%;
  max-width: 440px;
  position: relative;
  z-index: 1;
  transition: all var(--transition-smooth) var(--transition-spring);
}

.login-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.login-box:hover::before {
  left: 100%;
}

.login-box:hover {
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-premium-xl) !important;
  border-color: var(--border-glow-primary) !important;
}

.login-header {
  text-align: center;
  margin-bottom: 36px;
}

.login-header h1 {
  font-size: 32px;
  color: var(--text-primary);
  margin-bottom: 12px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.login-header p {
  color: var(--text-secondary);
  font-size: var(--font-base);
  margin: 0;
  font-weight: var(--font-normal);
}

.login-form {
  margin-bottom: 24px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.forgot-password {
  color: var(--btn-primary);
  text-decoration: none;
  font-size: var(--font-sm);
  font-weight: var(--font-medium);
  transition: all var(--transition-smooth) var(--transition-spring);
}

.forgot-password:hover {
  color: var(--btn-primary-hover);
  text-shadow: 0 0 8px rgba(0, 212, 170, 0.4);
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
  background: var(--btn-primary) !important;
  border-color: var(--btn-primary) !important;
  border-radius: var(--radius-lg) !important;
  transition: all var(--transition-smooth) var(--transition-spring);
  position: relative;
  overflow: hidden;
}

.login-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  transition: all 0.5s ease;
  transform: translate(-50%, -50%);
}

.login-button:hover::before {
  width: 300px;
  height: 300px;
}

.login-button:hover {
  background: var(--btn-primary-hover) !important;
  border-color: var(--btn-primary-hover) !important;
  box-shadow: var(--glow-primary) !important;
  transform: translateY(-2px);
}

.login-footer {
  text-align: center;
  color: var(--text-secondary);
  font-size: var(--font-base);
  margin-top: 24px;
}

.register-link {
  color: var(--btn-primary);
  text-decoration: none;
  font-weight: var(--font-semibold);
  transition: all var(--transition-smooth) var(--transition-spring);
}

.register-link:hover {
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

/* 复选框样式 */
.el-checkbox__label {
  color: var(--text-secondary) !important;
  font-size: var(--font-base) !important;
}

.el-checkbox__input.is-checked .el-checkbox__inner {
  background-color: var(--btn-primary) !important;
  border-color: var(--btn-primary) !important;
}

.el-checkbox__inner:hover {
  border-color: var(--btn-primary) !important;
}

.el-checkbox__inner {
  background: var(--input-bg) !important;
  border-color: var(--input-border) !important;
  border-radius: var(--radius-sm) !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-container {
    padding: 12px;
  }

  .login-box {
    padding: 32px 24px;
    max-width: 100%;
  }

  .login-header h1 {
    font-size: var(--font-xl);
  }

  .login-header p {
    font-size: var(--font-sm);
  }

  .form-options {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .login-button {
    height: 44px;
    font-size: var(--font-base);
  }

  .login-footer {
    font-size: var(--font-sm);
  }
}
</style>
