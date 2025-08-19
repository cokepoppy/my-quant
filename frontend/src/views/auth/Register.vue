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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-box {
  background: white;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 450px;
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.register-header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 600;
}

.register-header p {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.register-form {
  margin-bottom: 20px;
}

.register-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}

.register-footer {
  text-align: center;
  color: #666;
  font-size: 14px;
}

.login-link {
  color: #409eff;
  text-decoration: none;
  font-weight: 500;
}

.login-link:hover {
  text-decoration: underline;
}

a {
  color: #409eff;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .register-container {
    padding: 10px;
  }

  .register-box {
    padding: 30px 20px;
  }

  .register-header h1 {
    font-size: 24px;
  }

  .el-radio-group {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
