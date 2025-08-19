import { post, get, put } from './base'
import { LoginData, RegisterData, User } from '@/types/auth'

// 登录
export const login = async (data: LoginData) => {
  const response = await post<{
    user: User
    token: string
    refreshToken: string
  }>('/auth/login', data)
  return response
}

// 注册
export const register = async (data: RegisterData) => {
  const response = await post<{
    user: User
    token: string
    refreshToken: string
  }>('/auth/register', data)
  return response
}

// 获取当前用户信息
export const getCurrentUser = async () => {
  const response = await get<User>('/auth/me')
  return response
}

// 修改密码
export const changePassword = async (data: {
  currentPassword: string
  newPassword: string
}) => {
  const response = await post('/auth/password', data)
  return response
}

// 刷新token
export const refreshToken = async (refreshToken: string) => {
  const response = await post<{
    token: string
    refreshToken: string
  }>('/auth/refresh', { refreshToken })
  return response
}

// 登出
export const logout = async () => {
  const response = await post('/auth/logout')
  return response
}

export default {
  login,
  register,
  getCurrentUser,
  changePassword,
  refreshToken,
  logout
}