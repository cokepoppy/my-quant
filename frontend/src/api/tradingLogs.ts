import { api } from './index'

export const tradingLogsApi = {
  // 获取交易日志
  getLogs: (params?: {
    accountId?: string
    level?: string
    category?: string
    action?: string
    symbol?: string
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }) => api.get('/trading-logs/logs', { params }),
  
  // 创建交易日志
  createLog: (data: {
    level: string
    category: string
    action: string
    message: string
    accountId?: string
    symbol?: string
    metadata?: any
  }) => api.post('/trading-logs/logs', data),
  
  // 获取日志统计
  getLogStats: (params?: {
    accountId?: string
    startDate?: string
    endDate?: string
  }) => api.get('/trading-logs/logs/stats', { params }),
  
  // 获取交易监控概览
  getMonitoringOverview: (accountId?: string) => 
    api.get('/trading-logs/monitoring/overview', { params: { accountId } }),
  
  // 获取风险警报
  getRiskAlerts: (params?: {
    accountId?: string
    level?: string
    limit?: number
  }) => api.get('/trading-logs/risk/alerts', { params }),
  
  // 导出交易日志
  exportLogs: (params?: {
    accountId?: string
    format?: 'csv' | 'json'
    startDate?: string
    endDate?: string
  }) => api.get('/trading-logs/logs/export', { 
    params,
    responseType: 'blob'
  })
}

export default tradingLogsApi