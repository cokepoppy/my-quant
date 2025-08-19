// 导出所有类型定义

// 认证相关
export * from './auth'

// 用户管理相关
export * from './user'

// 策略管理相关
export * from './strategy'

// 回测相关
export * from './backtest'

// 交易相关
export * from './trading'

// 监控相关
export * from './monitoring'

// 通用类型
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: string[]
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface SearchParams {
  search?: string
  filters?: Record<string, any>
}

export interface TimeRangeParams {
  startTime?: string
  endTime?: string
  timeRange?: '1h' | '24h' | '7d' | '30d' | '90d' | '1y'
}

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}

// 错误类型
export interface ApiError {
  code: string
  message: string
  details?: any
  timestamp: string
  path: string
  method: string
}

// WebSocket 消息类型
export interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
  id?: string
}

// 表单验证错误
export interface ValidationError {
  field: string
  message: string
  value?: any
}

// 通用选项类型
export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
  group?: string
}

// 文件上传类型
export interface FileUpload {
  id: string
  name: string
  size: number
  type: string
  url?: string
  status: 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}