<template>
  <div class="register-container">
    <div class="register-box">
      <div class="register-header">
        <h1>量化交易系统</h1>
        <p>创建您的账户，开始量化交易之旅</p>
      </div>

      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="register-form"
        @keyup.enter="handleRegister"
      >
        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item prop="email">
          <el-input
            v-model="registerForm.email"
            type="email"
            placeholder="请输入邮箱地址"
            prefix-icon="Message"
            size="large"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请确认密码"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item prop="role">
          <el-radio-group v-model="registerForm.role">
            <el-radio label="user">普通用户</el-radio>
            <el-radio label="admin">管理员</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item prop="agreeTerms">
          <el-checkbox v-model="registerForm.agreeTerms">
            我已阅读并同意
            <a href="#" @click.prevent="showTerms">服务条款</a>
            和
            <a href="#" @click.prevent="showPrivacy">隐私政策</a>
          </el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="register-button"
            :loading="authStore.isLoading"
            @click="handleRegister"
          >
            {{ authStore.isLoading ? "注册中..." : "注册" }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="register-footer">
        <p>
          已有账户？
          <router-link to="/login" class="login-link"> 立即登录 </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { useAuthStore } from "@/stores/auth";
import type { RegisterData } from "@/types/auth";

const router = useRouter();
const authStore = useAuthStore();

// 表单引用
const registerFormRef = ref<FormInstance>();

// 注册表单数据
const registerForm = reactive<RegisterData & { agreeTerms: boolean }>({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "user",
  agreeTerms: false,
});

// 监听 agreeTerms 变化
watch(
  () => registerForm.agreeTerms,
  (newValue) => {
    console.log("agreeTerms 变化:", newValue);
    console.log("agreeTerms 类型:", typeof newValue);
  },
  { immediate: true },
);

// 表单验证规则
const registerRules: FormRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, max: 20, message: "用户名长度在3-20个字符之间", trigger: "blur" },
    {
      pattern: /^[a-zA-Z0-9_]+$/,
      message: "用户名只能包含字母、数字和下划线",
      trigger: "blur",
    },
  ],
  email: [
    { required: true, message: "请输入邮箱地址", trigger: "blur" },
    { type: "email", message: "请输入有效的邮箱地址", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码长度至少6位", trigger: "blur" },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]/,
      message: "密码必须包含大小写字母和数字",
      trigger: "blur",
    },
  ],
  confirmPassword: [
    { required: true, message: "请确认密码", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error("两次输入的密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
  role: [{ required: true, message: "请选择用户角色", trigger: "change" }],
  agreeTerms: [
    {
      required: true,
      message: "请先同意服务条款和隐私政策",
      trigger: "change",
    },
  ],
};

// 处理注册
const handleRegister = async () => {
  if (!registerFormRef.value) return;

  console.log("=== 注册调试信息 ===");
  console.log("表单数据:", JSON.stringify(registerForm, null, 2));
  console.log("agreeTerms 值:", registerForm.agreeTerms);
  console.log("agreeTerms 类型:", typeof registerForm.agreeTerms);

  try {
    // 验证表单
    console.log("开始验证表单...");
    const validation = await registerFormRef.value.validate();
    console.log("表单验证结果:", validation);
    console.log("表单验证通过");

    // 准备注册数据，移除 agreeTerms 字段
    const { agreeTerms, ...registerData } = registerForm;
    console.log("准备发送的注册数据:", JSON.stringify(registerData, null, 2));

    // 调用注册接口
    console.log("调用注册接口...");
    await authStore.register(registerData);
    console.log("注册接口调用成功");

    // 注册成功，跳转到首页
    await router.push("/");
  } catch (error) {
    // 错误处理已在store中完成
    console.error("Registration failed:", error);
    console.error("错误详情:", JSON.stringify(error, null, 2));
  }
};

// 显示服务条款
const showTerms = () => {
  ElMessage.info("服务条款页面开发中...");
};

// 显示隐私政策
const showPrivacy = () => {
  ElMessage.info("隐私政策页面开发中...");
};
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-primary);
  padding: 20px;
  position: relative;
}

.register-container::before {
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

.register-box {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--radius-xl) !important;
  box-shadow: var(--shadow-premium-lg) !important;
  padding: 48px;
  width: 100%;
  max-width: 480px;
  position: relative;
  z-index: 1;
  transition: all var(--transition-smooth) var(--transition-spring);
}

.register-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.register-box:hover::before {
  left: 100%;
}

.register-box:hover {
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-premium-xl) !important;
  border-color: var(--border-glow-primary) !important;
}

.register-header {
  text-align: center;
  margin-bottom: 36px;
}

.register-header h1 {
  font-size: 32px;
  color: var(--text-primary);
  margin-bottom: 12px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.register-header p {
  color: var(--text-secondary);
  font-size: var(--font-base);
  margin: 0;
  font-weight: var(--font-normal);
}

.register-form {
  margin-bottom: 24px;
}

.register-button {
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

.register-button::before {
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

.register-button:hover::before {
  width: 300px;
  height: 300px;
}

.register-button:hover {
  background: var(--btn-primary-hover) !important;
  border-color: var(--btn-primary-hover) !important;
  box-shadow: var(--glow-primary) !important;
  transform: translateY(-2px);
}

.register-footer {
  text-align: center;
  color: var(--text-secondary);
  font-size: var(--font-base);
  margin-top: 24px;
}

.login-link {
  color: var(--btn-primary);
  text-decoration: none;
  font-weight: var(--font-semibold);
  transition: all var(--transition-smooth) var(--transition-spring);
}

.login-link:hover {
  color: var(--btn-primary-hover);
  text-shadow: 0 0 8px rgba(0, 212, 170, 0.4);
}

a {
  color: var(--btn-primary);
  text-decoration: none;
  font-weight: var(--font-medium);
  transition: all var(--transition-smooth) var(--transition-spring);
}

a:hover {
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

/* 单选框样式 */
.el-radio__label {
  color: var(--text-secondary) !important;
  font-size: var(--font-base) !important;
}

.el-radio__input.is-checked .el-radio__inner {
  background-color: var(--btn-primary) !important;
  border-color: var(--btn-primary) !important;
}

.el-radio__inner:hover {
  border-color: var(--btn-primary) !important;
}

.el-radio__inner {
  background: var(--input-bg) !important;
  border-color: var(--input-border) !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .register-container {
    padding: 12px;
  }

  .register-box {
    padding: 32px 24px;
    max-width: 100%;
  }

  .register-header h1 {
    font-size: var(--font-xl);
  }

  .register-header p {
    font-size: var(--font-sm);
  }

  .register-button {
    height: 44px;
    font-size: var(--font-base);
  }

  .register-footer {
    font-size: var(--font-sm);
  }

  .el-radio-group {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .el-radio {
    margin-right: 0;
  }
}
</style>
