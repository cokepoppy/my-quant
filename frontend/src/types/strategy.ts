// 策略管理相关类型
export interface Strategy {
  id: string
  name: string
  description: string
  type: 'trend' | 'momentum' | 'mean_reversion' | 'arbitrage' | 'custom'
  language: 'python' | 'javascript' | 'typescript'
  code: string
  config: StrategyConfig
  status: 'draft' | 'active' | 'paused' | 'stopped' | 'error'
  createdAt: string
  updatedAt: string
  lastRunAt?: string
  createdBy: string
  performance?: StrategyPerformance
  parameters: StrategyParameter[]
  tags: string[]
  version: number
  isTemplate: boolean
  templateId?: string
}

export interface StrategyConfig {
  symbols: string[]
  timeframe: string
  riskManagement: RiskManagement
  execution: ExecutionConfig
  notifications: NotificationConfig
}

export interface RiskManagement {
  maxPositionSize: number
  maxDrawdown: number
  stopLoss: number
  takeProfit: number
  riskPerTrade: number
  maxCorrelation: number
}

export interface ExecutionConfig {
  exchange: string
  accountType: string
  slippage: number
  commission: number
  leverage: number
  executionDelay: number
}

export interface NotificationConfig {
  email: boolean
  push: boolean
  webhook?: string
  events: string[]
}

export interface StrategyPerformance {
  totalReturn: number
  annualizedReturn: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  profitFactor: number
  totalTrades: number
  averageTrade: number
  startBalance: number
  currentBalance: number
  monthlyReturns: Array<{
    month: string
    return: number
  }>
  dailyReturns: Array<{
    date: string
    return: number
  }>
}

export interface StrategyParameter {
  name: string
  type: 'number' | 'string' | 'boolean' | 'array' | 'object'
  value: any
  description: string
  required: boolean
  min?: number
  max?: number
  options?: any[]
}

export interface StrategyTemplate {
  id: string
  name: string
  description: string
  category: string
  language: 'python' | 'javascript' | 'typescript'
  code: string
  parameters: StrategyParameter[]
  config: StrategyConfig
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  createdAt: string
  usageCount: number
  rating: number
}

export interface StrategyValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
  syntaxErrors: Array<{
    line: number
    column: number
    message: string
  }>
  dependencies: string[]
  estimatedRuntime: number
}

export interface StrategyListResponse {
  strategies: Strategy[]
  total: number
  page: number
  limit: number
}

export interface StrategyCreateRequest {
  name: string
  description: string
  type: 'trend' | 'momentum' | 'mean_reversion' | 'arbitrage' | 'custom'
  language: 'python' | 'javascript' | 'typescript'
  code: string
  config: StrategyConfig
  parameters: StrategyParameter[]
  tags: string[]
  templateId?: string
}

export interface StrategyUpdateRequest {
  name?: string
  description?: string
  code?: string
  config?: StrategyConfig
  parameters?: StrategyParameter[]
  tags?: string[]
  status?: 'draft' | 'active' | 'paused' | 'stopped' | 'error'
}