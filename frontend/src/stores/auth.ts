import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  login as loginApi, 
  register as registerApi, 
  getCurrentUser, 
  refreshToken as refreshTokenApi, 
  logout as logoutApi 
} from '@/api'
import type { User, LoginData, RegisterData, AuthState } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const isAuthenticated = computed(() => !!token.value)
  const isLoading = ref(false)

  // 计算属性
  const userName = computed(() => user.value?.username || '')
  const userEmail = computed(() => user.value?.email || '')
  const userRole = computed(() => user.value?.role || 'user')
  const userPermissions = computed(() => {
    if (userRole.value === 'admin') {
      return ['read', 'write', 'delete', 'manage_users', 'manage_system']
    }
    return ['read', 'write']
  })

  // 方法
  const setUser = (userData: User) => {
    user.value = userData
  }

  const setTokens = (accessToken: string, refresh: string) => {
    token.value = accessToken
    refreshToken.value = refresh
    localStorage.setItem('token', accessToken)
    localStorage.setItem('refreshToken', refresh)
  }

  const clearAuth = () => {
    user.value = null
    token.value = null
    refreshToken.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  // 登录
  const login = async (loginData: LoginData) => {
    try {
      isLoading.value = true
      
      const response = await loginApi(loginData)
      const { user: userData, token: accessToken, refreshToken: refresh } = response
      
      setUser(userData)
      setTokens(accessToken, refresh)
      
      // 保存用户信息到localStorage
      localStorage.setItem('user', JSON.stringify(userData))
      
      ElMessage.success('登录成功')
      
      return true
    } catch (error) {
      console.error('Login failed:', error)
      clearAuth()
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 注册
  const register = async (registerData: RegisterData) => {
    try {
      isLoading.value = true
      
      const response = await registerApi(registerData)
      const { user: userData, token: accessToken, refreshToken: refresh } = response
      
      setUser(userData)
      setTokens(accessToken, refresh)
      
      // 保存用户信息到localStorage
      localStorage.setItem('user', JSON.stringify(userData))
      
      ElMessage.success('注册成功')
      
      return true
    } catch (error) {
      console.error('Registration failed:', error)
      clearAuth()
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 获取当前用户信息
  const fetchCurrentUser = async () => {
    try {
      if (!token.value) return false
      
      const userData = await getCurrentUser()
      setUser(userData)
      
      // 更新localStorage中的用户信息
      localStorage.setItem('user', JSON.stringify(userData))
      
      return true
    } catch (error) {
      console.error('Failed to fetch current user:', error)
      clearAuth()
      return false
    }
  }

  // 刷新token
  const refreshTokenFn = async () => {
    try {
      if (!refreshToken.value) {
        throw new Error('No refresh token available')
      }
      
      const response = await refreshTokenApi(refreshToken.value)
      const { token: accessToken, refreshToken: refresh } = response
      
      setTokens(accessToken, refresh)
      
      return true
    } catch (error) {
      console.error('Token refresh failed:', error)
      clearAuth()
      return false
    }
  }

  // 登出
  const logout = async () => {
    try {
      if (token.value) {
        await logoutApi()
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      clearAuth()
      ElMessage.success('已退出登录')
      await router.push('/login')
    }
  }

  // 检查权限
  const hasPermission = (permission: string) => {
    return userPermissions.value.includes(permission)
  }

  // 检查角色
  const hasRole = (role: string) => {
    return userRole.value === role
  }

  // 初始化认证状态
  const initializeAuth = async () => {
    try {
      const savedToken = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')
      
      if (savedToken && savedUser) {
        token.value = savedToken
        refreshToken.value = localStorage.getItem('refreshToken')
        user.value = JSON.parse(savedUser)
        
        // 验证token是否有效
        const isValid = await fetchCurrentUser()
        if (!isValid) {
          clearAuth()
          return false
        }
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Auth initialization failed:', error)
      clearAuth()
      return false
    }
  }

  // 更新用户信息
  const updateUser = (userData: Partial<User>) => {
    if (user.value) {
      user.value = { ...user.value, ...userData }
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

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
    clearAuth
  }
})