import axios from "axios";
import { ElMessage } from "element-plus";
import { useAuthStore } from "@/stores/auth";

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    const { data } = response;

    console.log("=== API响应拦截器 ===");
    console.log("请求URL:", response.config.url);
    console.log("请求方法:", response.config.method);
    console.log("请求头:", response.config.headers);
    console.log("请求数据:", response.config.data);
    console.log("响应状态:", response.status);
    console.log("响应数据:", data);
    console.log("响应数据类型:", typeof data);
    console.log("响应数据结构:", {
      hasSuccess: 'success' in data,
      success: data.success,
      hasMessage: 'message' in data,
      message: data.message,
      hasData: 'data' in data,
      data: data.data
    });

    // 如果返回的是二进制数据（如文件下载），直接返回
    if (response.config.responseType === "blob") {
      return response;
    }

    if (data.success) {
      console.log(
        "响应成功，返回的数据:",
        data.data !== undefined ? data.data : data,
      );
      // 保持原始响应结构，只提取data.data但不破坏success属性
      const result = data.data !== undefined ? data.data : data;
      console.log("拦截器返回的数据:", result);
      console.log("拦截器返回的数据类型:", typeof result);
      console.log("拦截器返回的数据结构:", {
        hasSuccess: 'success' in result,
        hasData: 'data' in result,
        hasStrategy: 'strategy' in result,
        keys: Object.keys(result)
      });
      
      // 对于登录和注册请求，直接返回解包的数据
      if (response.config.url?.includes('/auth/')) {
        return result;
      }
      
      // 确保返回的数据包含success属性
      if ('success' in result) {
        return result;
      } else {
        // 如果result没有success属性，但原始data有，则保持原始结构
        return {
          success: data.success,
          message: data.message,
          data: result
        };
      }
    } else {
      console.error("响应失败:", data.message);
      console.error("完整的错误响应:", data);
      ElMessage.error(data.message || "请求失败");
      return Promise.reject(new Error(data.message || "请求失败"));
    }
  },
  (error) => {
    console.log("=== API请求错误 ===");
    console.log("错误对象:", error);
    console.log("错误消息:", error.message);
    console.log("错误配置:", error.config);
    
    if (error.response) {
      console.log("HTTP错误响应:", {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      });
    }
    
    if (error.request) {
      console.log("请求错误:", error.request);
    }

    const { response } = error;

    if (response) {
      switch (response.status) {
        case 401:
          ElMessage.error("登录已过期，请重新登录");
          const authStore = useAuthStore();
          authStore.logout();
          window.location.href = "/login";
          break;
        case 403:
          ElMessage.error("权限不足");
          break;
        case 404:
          ElMessage.error("请求的资源不存在");
          break;
        case 500:
          ElMessage.error("服务器内部错误");
          break;
        default:
          ElMessage.error(response.data?.message || "网络错误");
      }
    } else {
      ElMessage.error("网络连接失败");
    }

    return Promise.reject(error);
  },
);

// HTTP请求方法
export const get = (url: string, config?: any) => api.get(url, config);
export const post = (url: string, data?: any, config?: any) =>
  api.post(url, data, config);
export const put = (url: string, data?: any, config?: any) =>
  api.put(url, data, config);
export const del = (url: string, config?: any) => api.delete(url, config);
export const patch = (url: string, data?: any, config?: any) =>
  api.patch(url, data, config);

// 文件上传
export const upload = (
  url: string,
  file: File,
  onProgress?: (progress: number) => void,
) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        onProgress(progress);
      }
    },
  });
};

export default api;
