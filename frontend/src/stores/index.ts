// 导出所有store

// 认证store
export { useAuthStore } from './auth'

// 用户管理store
export { useUserStore } from './user'

// 应用store
export { useAppStore } from './app'

// 策略管理store
export { useStrategyStore } from './strategy'

// 导出类型
export type { AuthState } from '@/types/auth'
export type { User, UserStats } from '@/types/user'
export type { Notification } from './app'
export type { 
  Strategy, 
  StrategyTemplate, 
  StrategyValidation, 
  StrategyPerformance 
} from '@/types/strategy'

// Store初始化函数
export const initializeStores = async () => {
  const authStore = useAuthStore()
  const appStore = useAppStore()
  
  try {
    // 显示加载状态
    appStore.setLoading(true)
    
    // 初始化认证状态
    const isAuthenticated = await authStore.initializeAuth()
    
    if (isAuthenticated) {
      // 如果用户已认证，可以初始化其他store数据
      const userStore = useUserStore()
      await userStore.fetchUserStats()
      
      appStore.showSuccess('欢迎回来！')
    }
    
    return {
      isAuthenticated,
      user: authStore.user
    }
  } catch (error) {
    appStore.handleError(error, '系统初始化失败')
    return {
      isAuthenticated: false,
      user: null
    }
  } finally {
    appStore.setLoading(false)
  }
}