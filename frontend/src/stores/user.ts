import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  getUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  getUserStats, 
  toggleUserStatus, 
  resetUserPassword 
} from '@/api'
import type { User, UserStats, UserCreateRequest, UserUpdateRequest } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  // 状态
  const users = ref<User[]>([])
  const totalUsers = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const userStats = ref<UserStats | null>(null)
  const selectedUser = ref<User | null>(null)
  const isLoading = ref(false)
  const isUpdating = ref(false)
  const searchQuery = ref('')
  const filters = ref({
    role: '',
    status: ''
  })

  // 计算属性
  const filteredUsers = computed(() => {
    let result = users.value
    
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(user => 
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      )
    }
    
    if (filters.value.role) {
      result = result.filter(user => user.role === filters.value.role)
    }
    
    if (filters.value.status !== '') {
      const isActive = filters.value.status === 'active'
      result = result.filter(user => user.isActive === isActive)
    }
    
    return result
  })

  const totalPages = computed(() => Math.ceil(totalUsers.value / pageSize.value))
  const hasPreviousPage = computed(() => currentPage.value > 1)
  const hasNextPage = computed(() => currentPage.value < totalPages.value)

  // 方法
  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setUpdating = (updating: boolean) => {
    isUpdating.value = updating
  }

  // 获取用户列表
  const fetchUsers = async (params?: {
    page?: number
    limit?: number
    search?: string
    role?: string
    isActive?: boolean
  }) => {
    try {
      setLoading(true)
      
      const response = await getUsers({
        page: params?.page || currentPage.value,
        limit: params?.limit || pageSize.value,
        search: params?.search || searchQuery.value,
        role: params?.role || filters.value.role || undefined,
        ...params
      })
      
      users.value = response.users
      totalUsers.value = response.total
      currentPage.value = response.page
      pageSize.value = response.limit
      
      return response
    } catch (error) {
      console.error('Failed to fetch users:', error)
      ElMessage.error('获取用户列表失败')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // 获取用户详情
  const fetchUserById = async (id: string) => {
    try {
      setLoading(true)
      
      const user = await getUserById(id)
      selectedUser.value = user
      
      return user
    } catch (error) {
      console.error('Failed to fetch user by ID:', error)
      ElMessage.error('获取用户详情失败')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // 更新用户信息
  const updateUserById = async (id: string, data: UserUpdateRequest) => {
    try {
      setUpdating(true)
      
      const updatedUser = await updateUser(id, data)
      
      // 更新本地用户列表
      const index = users.value.findIndex(user => user.id === id)
      if (index !== -1) {
        users.value[index] = updatedUser
      }
      
      // 更新选中的用户
      if (selectedUser.value?.id === id) {
        selectedUser.value = updatedUser
      }
      
      ElMessage.success('用户信息更新成功')
      
      return updatedUser
    } catch (error) {
      console.error('Failed to update user:', error)
      ElMessage.error('更新用户信息失败')
      throw error
    } finally {
      setUpdating(false)
    }
  }

  // 删除用户
  const deleteUserById = async (id: string) => {
    try {
      setUpdating(true)
      
      await deleteUser(id)
      
      // 从本地用户列表中移除
      users.value = users.value.filter(user => user.id !== id)
      totalUsers.value = users.value.length
      
      // 清除选中的用户
      if (selectedUser.value?.id === id) {
        selectedUser.value = null
      }
      
      ElMessage.success('用户删除成功')
      
      return true
    } catch (error) {
      console.error('Failed to delete user:', error)
      ElMessage.error('删除用户失败')
      throw error
    } finally {
      setUpdating(false)
    }
  }

  // 获取用户统计
  const fetchUserStats = async () => {
    try {
      setLoading(true)
      
      const stats = await getUserStats()
      userStats.value = stats
      
      return stats
    } catch (error) {
      console.error('Failed to fetch user stats:', error)
      ElMessage.error('获取用户统计失败')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // 切换用户状态
  const toggleUserStatusById = async (id: string, isActive: boolean) => {
    try {
      setUpdating(true)
      
      await toggleUserStatus(id, isActive)
      
      // 更新本地用户状态
      const index = users.value.findIndex(user => user.id === id)
      if (index !== -1) {
        users.value[index].isActive = isActive
      }
      
      // 更新选中的用户状态
      if (selectedUser.value?.id === id) {
        selectedUser.value.isActive = isActive
      }
      
      ElMessage.success(`用户已${isActive ? '启用' : '禁用'}`)
      
      return true
    } catch (error) {
      console.error('Failed to toggle user status:', error)
      ElMessage.error('切换用户状态失败')
      throw error
    } finally {
      setUpdating(false)
    }
  }

  // 重置用户密码
  const resetPasswordById = async (id: string, newPassword: string) => {
    try {
      setUpdating(true)
      
      await resetUserPassword(id, newPassword)
      
      ElMessage.success('密码重置成功')
      
      return true
    } catch (error) {
      console.error('Failed to reset user password:', error)
      ElMessage.error('重置密码失败')
      throw error
    } finally {
      setUpdating(false)
    }
  }

  // 设置搜索查询
  const setSearchQuery = (query: string) => {
    searchQuery.value = query
    currentPage.value = 1
  }

  // 设置过滤器
  const setFilters = (newFilters: Partial<typeof filters.value>) => {
    filters.value = { ...filters.value, ...newFilters }
    currentPage.value = 1
  }

  // 清除过滤器
  const clearFilters = () => {
    filters.value = {
      role: '',
      status: ''
    }
    searchQuery.value = ''
    currentPage.value = 1
  }

  // 分页方法
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
      fetchUsers()
    }
  }

  const nextPage = () => {
    if (hasNextPage.value) {
      goToPage(currentPage.value + 1)
    }
  }

  const previousPage = () => {
    if (hasPreviousPage.value) {
      goToPage(currentPage.value - 1)
    }
  }

  // 选择用户
  const selectUser = (user: User | null) => {
    selectedUser.value = user
  }

  // 刷新数据
  const refreshData = async () => {
    await Promise.all([
      fetchUsers(),
      fetchUserStats()
    ])
  }

  return {
    // 状态
    users,
    totalUsers,
    currentPage,
    pageSize,
    userStats,
    selectedUser,
    isLoading,
    isUpdating,
    searchQuery,
    filters,
    
    // 计算属性
    filteredUsers,
    totalPages,
    hasPreviousPage,
    hasNextPage,
    
    // 方法
    fetchUsers,
    fetchUserById,
    updateUserById,
    deleteUserById,
    fetchUserStats,
    toggleUserStatusById,
    resetPasswordById,
    setSearchQuery,
    setFilters,
    clearFilters,
    goToPage,
    nextPage,
    previousPage,
    selectUser,
    refreshData,
    setLoading,
    setUpdating
  }
})