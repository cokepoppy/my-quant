import { get, post, put, del } from './base'
import { Strategy, StrategyTemplate, StrategyValidation } from '@/types/strategy'

// 获取策略列表
export const getStrategies = async (params?: {
  page?: number
  limit?: number
  search?: string
  status?: string
  type?: string
}) => {
  const response = await get<{
    strategies: Strategy[]
    total: number
    page: number
    limit: number
  }>('/strategies', { params })
  return response
}

// 获取策略详情
export const getStrategyById = async (id: string) => {
  const response = await get<Strategy>(`/strategies/${id}`)
  return response
}

// 创建策略
export const createStrategy = async (data: Partial<Strategy>) => {
  const response = await post<Strategy>('/strategies', data)
  return response
}

// 更新策略
export const updateStrategy = async (id: string, data: Partial<Strategy>) => {
  const response = await put<Strategy>(`/strategies/${id}`, data)
  return response
}

// 删除策略
export const deleteStrategy = async (id: string) => {
  const response = await del(`/strategies/${id}`)
  return response
}

// 获取策略模板
export const getStrategyTemplates = async () => {
  const response = await get<StrategyTemplate[]>('/strategies/templates/list')
  return response
}

// 验证策略代码
export const validateStrategy = async (data: {
  code: string
  language: string
  type: string
}) => {
  const response = await post<StrategyValidation>('/strategies/validate', data)
  return response
}

// 启动策略
export const startStrategy = async (id: string) => {
  const response = await post(`/strategies/${id}/start`)
  return response
}

// 停止策略
export const stopStrategy = async (id: string) => {
  const response = await post(`/strategies/${id}/stop`)
  return response
}

// 获取策略性能
export const getStrategyPerformance = async (id: string) => {
  const response = await get(`/strategies/${id}/performance`)
  return response
}

// 获取策略日志
export const getStrategyLogs = async (id: string, params?: {
  page?: number
  limit?: number
  level?: string
}) => {
  const response = await get(`/strategies/${id}/logs`, { params })
  return response
}

export default { getStrategies ,getStrategyById ,createStrategy ,updateStrategy ,deleteStrategy ,getStrategyTemplates ,validateStrategy ,startStrategy ,stopStrategy ,getStrategyPerformance ,getStrategyLogs  }
