import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

export interface Notification {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
  duration?: number
}

export const useAppStore = defineStore('app', () => {
  // 状态
  const isLoading = ref(false)
  const notifications = ref<Notification[]>([])
  const theme = ref<'light' | 'dark' | 'auto'>('light')
  const language = ref('zh-CN')
  const sidebarCollapsed = ref(false)
  const pageHeader = ref({
    title: '',
    breadcrumbs: [] as Array<{ name: string; path: string }>
  })
  
  // 计算属性
  const isDarkMode = computed(() => {
    if (theme.value === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return theme.value === 'dark'
  })
  
  // 方法
  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }
  
  const showNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString()
    const newNotification: Notification = {
      id,
      duration: 3000,
      ...notification
    }
    
    notifications.value.push(newNotification)
    
    // 自动移除通知
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
    
    return id
  }
  
  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }
  
  const clearNotifications = () => {
    notifications.value = []
  }
  
  const setTheme = (newTheme: 'light' | 'dark' | 'auto') => {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    applyTheme()
  }
  
  const applyTheme = () => {
    const root = document.documentElement
    if (isDarkMode.value) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }
  
  const setLanguage = (newLanguage: string) => {
    language.value = newLanguage
    localStorage.setItem('language', newLanguage)
  }
  
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value.toString())
  }
  
  const setPageHeader = (title: string, breadcrumbs?: Array<{ name: string; path: string }>) => {
    pageHeader.value = {
      title,
      breadcrumbs: breadcrumbs || []
    }
  }
  
  const clearPageHeader = () => {
    pageHeader.value = {
      title: '',
      breadcrumbs: []
    }
  }
  
  const showSuccess = (message: string, duration?: number) => {
    return showNotification({ type: 'success', message, duration })
  }
  
  const showWarning = (message: string, duration?: number) => {
    return showNotification({ type: 'warning', message, duration })
  }
  
  const showError = (message: string, duration?: number) => {
    return showNotification({ type: 'error', message, duration })
  }
  
  const showInfo = (message: string, duration?: number) => {
    return showNotification({ type: 'info', message, duration })
  }
  
  const handleError = (error: any, defaultMessage = '操作失败') => {
    const message = error?.response?.data?.message || error?.message || defaultMessage
    showError(message)
    console.error('Error:', error)
  }
  
  const initializeApp = async () => {
    try {
      // 从localStorage恢复设置
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto'
      const savedLanguage = localStorage.getItem('language')
      const savedSidebarCollapsed = localStorage.getItem('sidebarCollapsed')
      
      if (savedTheme) {
        theme.value = savedTheme
      }
      
      if (savedLanguage) {
        language.value = savedLanguage
      }
      
      if (savedSidebarCollapsed) {
        sidebarCollapsed.value = savedSidebarCollapsed === 'true'
      }
      
      // 应用主题
      applyTheme()
      
      // 监听系统主题变化
      if (theme.value === 'auto') {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme)
      }
      
      // 初始化完成
      console.log('App initialized successfully')
      
    } catch (error) {
      console.error('App initialization failed:', error)
      handleError(error, '应用初始化失败')
    }
  }
  
  return {
    // 状态
    isLoading,
    notifications,
    theme,
    language,
    sidebarCollapsed,
    pageHeader,
    
    // 计算属性
    isDarkMode,
    
    // 方法
    setLoading,
    showNotification,
    removeNotification,
    clearNotifications,
    setTheme,
    applyTheme,
    setLanguage,
    toggleSidebar,
    setPageHeader,
    clearPageHeader,
    showSuccess,
    showWarning,
    showError,
    showInfo,
    handleError,
    initializeApp
  }
})