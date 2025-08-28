import { get, post } from './base'

// 回测配置接口
export interface BacktestConfig {
  strategyId: string
  name: string
  description?: string
  symbols: string[]
  timeframe: string
  startDate: Date
  endDate: Date
  initialCapital: number
  commission?: number
  slippage?: number
  leverage?: number
  riskLimits?: string[]
  outputOptions?: string[]
  params?: Record<string, any>
}

// 回测结果接口
export interface BacktestResult {
  id: string
  name: string
  strategyId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  config: BacktestConfig
  metrics?: {
    totalReturn: number
    annualizedReturn: number
    sharpeRatio: number
    maxDrawdown: number
    winRate: number
    profitFactor: number
    totalTrades: number
  }
  trades?: any[]
  error?: string
  createdAt: Date
  updatedAt: Date
}

// 启动回测
export const startBacktest = async (config: BacktestConfig) => {
  const response = await post('/backtest-v2/', config)
  return response
}

// 获取回测状态
export const getBacktestStatus = async (id: string) => {
  const response = await get(`/backtest-v2/${id}`)
  return response
}

// 获取回测结果
export const getBacktestResults = async (id: string) => {
  const response = await get(`/backtest-v2/${id}`)
  return response
}

// 取消回测
export const cancelBacktest = async (id: string) => {
  const response = await post(`/backtest-v2/${id}/cancel`)
  return response
}

// 获取回测历史
export const getBacktestHistory = async (params?: {
  strategyId?: string
  page?: number
  limit?: number
  status?: string
}) => {
  const response = await get('/backtest-v2/', { params })
  return response
}

// 删除回测记录
export const deleteBacktest = async (id: string) => {
  const response = await post(`/backtest-v2/${id}/cancel`)
  return response
}

// 导出回测报告
export const exportBacktestReport = async (id: string, format: 'pdf' | 'excel' = 'pdf') => {
  const response = await get(`/backtest/${id}/export/${format}`, {
    responseType: 'blob'
  })
  return response
}

// 获取可用数据源
export const getAvailableDataSources = async () => {
  const response = await get('/data/sources')
  return response
}

// 获取支持的时间周期
export const getSupportedTimeframes = async () => {
  const response = await get('/data/timeframes')
  return response
}

// 验证数据可用性
export const validateDataAvailability = async (params: {
  symbol: string
  timeframe: string
  startDate: Date
  endDate: Date
}) => {
  const response = await post('/data/validate', params)
  return response
}

// 获取回测统计信息
export const getBacktestStats = async () => {
  const response = await get('/backtest-v2/stats/')
  return response
}

// 获取回测交易记录
export const getBacktestTrades = async (backtestId: string, params?: {
  page?: number
  limit?: number
}) => {
  const response = await get(`/backtest-v2/${backtestId}/trades`, { params })
  return response
}

// 获取回测模板
export const getBacktestTemplates = async () => {
  const response = await get('/backtest-v2/templates/')
  return response
}

// 批量启动回测（参数优化）
export const startBatchBacktest = async (configs: BacktestConfig[]) => {
  const response = await post('/backtest/batch', { configs })
  return response
}

// 获取参数优化结果
export const getOptimizationResults = async (batchId: string) => {
  const response = await get(`/backtest/optimization/${batchId}`)
  return response
}

// WebSocket 连接用于实时更新
export const createBacktestWebSocket = (backtestId: string) => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${protocol}//${window.location.host}/ws/backtest/${backtestId}`
  return new WebSocket(wsUrl)
}

// 默认导出所有回测API
export default {
  startBacktest,
  getBacktestResults,
  getBacktestStatus,
  cancelBacktest,
  getBacktestHistory,
  deleteBacktest,
  exportBacktestReport,
  getAvailableDataSources,
  getSupportedTimeframes,
  validateDataAvailability,
  getBacktestStats,
  getBacktestTrades,
  getBacktestTemplates,
  startBatchBacktest,
  getOptimizationResults,
  createBacktestWebSocket,
}