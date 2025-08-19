import { get, post } from './base'
import { SystemMetrics, Alert, LogEntry, DashboardData } from '@/types/monitoring'

// 获取系统指标
export const getSystemMetrics = async (timeRange: '1h' | '24h' | '7d' | '30d' = '1h') => {
  const response = await get<SystemMetrics>('/monitoring/metrics', {
    params: { timeRange }
  })
  return response
}

// 获取告警列表
export const getAlerts = async (params?: {
  level?: 'info' | 'warning' | 'error' | 'critical'
  status?: 'active' | 'resolved' | 'acknowledged'
  page?: number
  limit?: number
}) => {
  const response = await get<{
    alerts: Alert[]
    total: number
    page: number
    limit: number
  }>('/monitoring/alerts', { params })
  return response
}

// 获取告警详情
export const getAlertById = async (id: string) => {
  const response = await get<Alert>(`/monitoring/alerts/${id}`)
  return response
}

// 确认告警
export const acknowledgeAlert = async (id: string) => {
  const response = await post(`/monitoring/alerts/${id}/acknowledge`)
  return response
}

// 解决告警
export const resolveAlert = async (id: string) => {
  const response = await post(`/monitoring/alerts/${id}/resolve`)
  return response
}

// 获取系统日志
export const getSystemLogs = async (params?: {
  level?: 'info' | 'warn' | 'error' | 'debug'
  service?: string
  startTime?: string
  endTime?: string
  page?: number
  limit?: number
}) => {
  const response = await get<{
    logs: LogEntry[]
    total: number
    page: number
    limit: number
  }>('/monitoring/logs', { params })
  return response
}

// 获取仪表板数据
export const getDashboardData = async () => {
  const response = await get<DashboardData>('/monitoring/dashboard')
  return response
}

// 获取实时数据
export const getRealtimeData = async () => {
  const response = await get('/monitoring/realtime')
  return response
}

// 获取性能报告
export const getPerformanceReport = async (timeRange: '1h' | '24h' | '7d' | '30d' = '24h') => {
  const response = await get('/monitoring/reports/performance', {
    params: { timeRange }
  })
  return response
}

// 导出监控数据
export const exportMonitoringData = async (params: {
  type: 'metrics' | 'logs' | 'alerts'
  format: 'csv' | 'json'
  timeRange: string
  startTime?: string
  endTime?: string
}) => {
  const response = await get('/monitoring/export', {
    params,
    responseType: 'blob'
  })
  return response
}

// 获取健康检查状态
export const getHealthStatus = async () => {
  const response = await get('/health')
  return response
}

// 获取服务状态
export const getServiceStatus = async () => {
  const response = await get('/monitoring/services')
  return response
}

// 重启服务
export const restartService = async (serviceName: string) => {
  const response = await post(`/monitoring/services/${serviceName}/restart`)
  return response
}

// 获取资源使用情况
export const getResourceUsage = async () => {
  const response = await get('/monitoring/resources')
  return response
}

export default { getSystemMetrics ,getAlerts ,getAlertById ,acknowledgeAlert ,resolveAlert ,getSystemLogs ,getDashboardData ,getRealtimeData ,getPerformanceReport ,exportMonitoringData ,getHealthStatus ,getServiceStatus ,restartService ,getResourceUsage  }
