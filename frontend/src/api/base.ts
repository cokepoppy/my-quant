import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    const { data } = response
    
    console.log('=== API响应拦截器 ===')
    console.log('请求URL:', response.config.url)
    console.log('响应数据:', data)
    
    // 如果返回的是二进制数据（如文件下载），直接返回
    if (response.config.responseType === 'blob') {
      return response
    }
    
    if (data.success) {
      console.log('响应成功，返回的数据:', data.data !== undefined ? data.data : data)
      // 如果有 data 属性，返回 data.data，否则返回整个 data
      return data.data !== undefined ? data.data : data
    } else {
      console.error('响应失败:', data.message)
      ElMessage.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }
  },
  (error) => {
    const { response } = error
    
    if (response) {
      switch (response.status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          const authStore = useAuthStore()
          authStore.logout()
          window.location.href = '/login'
          break
        case 403:
          ElMessage.error('权限不足')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(response.data?.message || '网络错误')
      }
    } else {
      ElMessage.error('网络连接失败')
    }
    
    return Promise.reject(error)
  }
)

// HTTP请求方法
export const get = (url: string, config?: any) => api.get(url, config)
export const post = (url: string, data?: any, config?: any) => api.post(url, data, config)
export const put = (url: string, data?: any, config?: any) => api.put(url, data, config)
export const del = (url: string, config?: any) => api.delete(url, config)
export const patch = (url: string, data?: any, config?: any) => api.patch(url, data, config)

// 文件上传
export const upload = (url: string, file: File, onProgress?: (progress: number) => void) => {
  const formData = new FormData()
  formData.append('file', file)
  
  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(progress)
      }
    }
  })
}

export default api