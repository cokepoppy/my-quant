import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  login as loginApi,
  register as registerApi,
  getCurrentUser,
  refreshToken as refreshTokenApi,
  logout as logoutApi,
} from "@/api";
import type { User, LoginData, RegisterData, AuthState } from "@/types/auth";

export const useAuthStore = defineStore("auth", () => {
  const router = useRouter();

  // 状态
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem("token"));
  const refreshToken = ref<string | null>(localStorage.getItem("refreshToken"));
  const isAuthenticated = computed(() => !!token.value);
  const isLoading = ref(false);

  // 计算属性
  const userName = computed(() => user.value?.username || "");
  const userEmail = computed(() => user.value?.email || "");
  const userRole = computed(() => user.value?.role || "user");
  const userPermissions = computed(() => {
    if (userRole.value === "admin") {
      return ["read", "write", "delete", "manage_users", "manage_system"];
    }
    return ["read", "write"];
  });

  // 方法
  const setUser = (userData: User) => {
    user.value = userData;
  };

  const setTokens = (accessToken: string, refresh: string) => {
    token.value = accessToken;
    refreshToken.value = refresh;
    localStorage.setItem("token", accessToken);
    localStorage.setItem("refreshToken", refresh);
  };

  const clearAuth = () => {
    user.value = null;
    token.value = null;
    refreshToken.value = null;
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  };

  // 登录
  const login = async (loginData: LoginData) => {
    try {
      isLoading.value = true;

      const response = await loginApi(loginData);
      console.log("=== 登录API响应 ===");
      console.log("response类型:", typeof response);
      console.log("response内容:", response);
      console.log("response键:", Object.keys(response));

      const {
        user: userData,
        token: accessToken,
        refreshToken: refresh,
      } = response;

      console.log("解构后的值:");
      console.log("userData:", userData);
      console.log("accessToken:", accessToken);
      console.log("refresh:", refresh);

      setUser(userData);
      setTokens(accessToken, refresh);

      // 保存用户信息到localStorage
      localStorage.setItem("user", JSON.stringify(userData));

      console.log("localStorage保存后的值:");
      console.log("token:", localStorage.getItem("token"));
      console.log("refreshToken:", localStorage.getItem("refreshToken"));
      console.log("user:", localStorage.getItem("user"));

      ElMessage.success("登录成功");

      return true;
    } catch (error) {
      console.error("Login failed:", error);
      clearAuth();
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  // 注册
  const register = async (registerData: RegisterData) => {
    try {
      isLoading.value = true;

      const response = await registerApi(registerData);
      const {
        user: userData,
        token: accessToken,
        refreshToken: refresh,
      } = response;

      setUser(userData);
      setTokens(accessToken, refresh);

      // 保存用户信息到localStorage
      localStorage.setItem("user", JSON.stringify(userData));

      ElMessage.success("注册成功");

      return true;
    } catch (error) {
      console.error("Registration failed:", error);
      clearAuth();
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  // 获取当前用户信息
  const fetchCurrentUser = async () => {
    try {
      if (!token.value) return false;

      const userData = await getCurrentUser();
      setUser(userData);

      // 更新localStorage中的用户信息
      localStorage.setItem("user", JSON.stringify(userData));

      return true;
    } catch (error) {
      console.error("Failed to fetch current user:", error);
      clearAuth();
      return false;
    }
  };

  // 刷新token
  const refreshTokenFn = async () => {
    try {
      if (!refreshToken.value) {
        throw new Error("No refresh token available");
      }

      const response = await refreshTokenApi(refreshToken.value);
      const { token: accessToken, refreshToken: refresh } = response;

      setTokens(accessToken, refresh);

      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      clearAuth();
      return false;
    }
  };

  // 登出
  const logout = async () => {
    try {
      if (token.value) {
        await logoutApi();
      }
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      clearAuth();
      ElMessage.success("已退出登录");
      await router.push("/login");
    }
  };

  // 检查权限
  const hasPermission = (permission: string) => {
    return userPermissions.value.includes(permission);
  };

  // 检查角色
  const hasRole = (role: string) => {
    return userRole.value === role;
  };

  // 初始化认证状态
  const initializeAuth = async () => {
    try {
      console.log("=== 初始化认证状态开始 ===");
      console.log("当前时间:", new Date().toISOString());

      // 检查localStorage是否可用
      console.log("localStorage可用性测试:");
      try {
        localStorage.setItem("test", "test");
        const testValue = localStorage.getItem("test");
        console.log("localStorage测试写入:", testValue);
        localStorage.removeItem("test");
      } catch (storageError) {
        console.error("localStorage不可用:", storageError);
        return false;
      }

      // 先清除所有可能无效的localStorage数据
      const clearInvalidData = () => {
        console.log("=== 检查无效数据 ===");
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");
        const refreshToken = localStorage.getItem("refreshToken");

        console.log("原始localStorage数据:");
        console.log("- token:", token);
        console.log("- user:", user);
        console.log("- refreshToken:", refreshToken);

        // 如果任何一项是字符串 "undefined" 或 "null"，清除所有数据
        if (
          token === "undefined" ||
          token === "null" ||
          user === "undefined" ||
          user === "null" ||
          refreshToken === "undefined" ||
          refreshToken === "null"
        ) {
          console.log("发现无效的localStorage数据，正在清除...");
          clearAuth();
          return true;
        }
        return false;
      };

      // 检查并清除无效数据
      if (clearInvalidData()) {
        console.log("无效数据已清除，初始化结束");
        return false;
      }

      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      const savedRefreshToken = localStorage.getItem("refreshToken");

      console.log("=== localStorage数据检查 ===");
      console.log("savedToken类型:", typeof savedToken, "值:", savedToken);
      console.log("savedUser类型:", typeof savedUser, "值:", savedUser);
      console.log(
        "savedRefreshToken类型:",
        typeof savedRefreshToken,
        "值:",
        savedRefreshToken,
      );

      if (savedToken && savedUser) {
        console.log("=== 开始设置认证状态 ===");
        console.log("设置token值:", savedToken.substring(0, 20) + "...");
        token.value = savedToken;
        refreshToken.value = savedRefreshToken;
        console.log("token和refreshToken已设置到store");

        console.log("=== 开始解析用户数据 ===");
        console.log("savedUser长度:", savedUser.length);
        console.log("savedUser前50字符:", savedUser.substring(0, 50));

        try {
          // 再次检查 savedUser 是否有效
          if (
            !savedUser ||
            savedUser.trim() === "" ||
            savedUser === "undefined" ||
            savedUser === "null"
          ) {
            console.log("savedUser 为空或无效，清除认证状态");
            console.log("savedUser空检查:", !savedUser);
            console.log("savedUser空字符串检查:", savedUser.trim() === "");
            console.log(
              "savedUser字符串undefined检查:",
              savedUser === "undefined",
            );
            console.log("savedUser字符串null检查:", savedUser === "null");
            clearAuth();
            return false;
          }

          console.log("尝试JSON.parse...");
          user.value = JSON.parse(savedUser);
          console.log("用户数据解析成功:", user.value);
          console.log("用户ID:", user.value.id);
          console.log("用户名:", user.value.username);
          console.log("用户邮箱:", user.value.email);
          console.log("用户角色:", user.value.role);
        } catch (parseError) {
          console.error("=== 用户数据解析失败 ===");
          console.error("错误类型:", parseError.constructor.name);
          console.error("错误消息:", parseError.message);
          console.error("错误堆栈:", parseError.stack);
          console.error("savedUser原始内容:", JSON.stringify(savedUser));
          console.error("savedUser内容详情:");
          console.error("- 长度:", savedUser.length);
          console.error("- 前100字符:", savedUser.substring(0, 100));
          console.error("- 是否包含特殊字符:", /[^\x20-\x7E]/.test(savedUser));

          // 清除无效的认证数据
          console.log("清除无效的认证数据...");
          clearAuth();
          return false;
        }

        // 验证token是否有效
        console.log("=== 开始验证token有效性 ===");
        console.log("当前token状态:", !!token.value);
        console.log("开始调用fetchCurrentUser...");
        const isValid = await fetchCurrentUser();
        console.log("fetchCurrentUser返回值:", isValid);

        if (!isValid) {
          console.log("token验证失败，清除认证状态");
          clearAuth();
          return false;
        }

        console.log("=== 认证初始化成功 ===");
        console.log("最终认证状态:");
        console.log("- isAuthenticated:", isAuthenticated.value);
        console.log("- user:", user.value);
        console.log("- token长度:", token.value ? token.value.length : 0);
        return true;
      }

      console.log("=== 未找到保存的token或用户数据 ===");
      console.log("savedToken存在:", !!savedToken);
      console.log("savedUser存在:", !!savedUser);
      return false;
    } catch (error) {
      console.error("=== Auth initialization failed ===");
      console.error("错误类型:", error.constructor.name);
      console.error("错误消息:", error.message);
      console.error("错误堆栈:", error.stack);
      console.error("发生错误时的localStorage状态:");
      try {
        console.error("- token:", localStorage.getItem("token"));
        console.error("- user:", localStorage.getItem("user"));
        console.error("- refreshToken:", localStorage.getItem("refreshToken"));
      } catch (e) {
        console.error("无法读取localStorage:", e);
      }

      clearAuth();
      return false;
    }
  };

  // 更新用户信息
  const updateUser = (userData: Partial<User>) => {
    if (user.value) {
      user.value = { ...user.value, ...userData };
      localStorage.setItem("user", JSON.stringify(user.value));
    }
  };

  return {
    // 状态
    user,
    token,
    refreshToken,
    isAuthenticated,
    isLoading,

    // 计算属性
    userName,
    userEmail,
    userRole,
    userPermissions,

    // 方法
    login,
    register,
    logout,
    fetchCurrentUser,
    refreshTokenFn,
    hasPermission,
    hasRole,
    initializeAuth,
    updateUser,
    setUser,
    setTokens,
    clearAuth,
  };
});
