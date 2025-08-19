// 回测相关类型
export interface BacktestConfig {
  id?: string;
  name: string;
  description: string;
  strategyId: string;
  strategyVersion: number;
  symbols: string[];
  startTime: string;
  endTime: string;
  timeframe: string;
  initialCapital: number;
  commission: number;
  slippage: number;
  leverage: number;
  riskManagement: {
    maxPositionSize: number;
    maxDrawdown: number;
    stopLoss: number;
    takeProfit: number;
  };
  parameters: Record<string, any>;
  saveResults: boolean;
  notifications: boolean;
}

export interface BacktestResult {
  id: string;
  jobId: string;
  config: BacktestConfig;
  summary: BacktestSummary;
  performance: BacktestPerformance;
  trades: BacktestTrade[];
  equity: Array<{
    timestamp: string;
    equity: number;
    drawdown: number;
  }>;
  metrics: BacktestMetrics;
  riskMetrics: RiskMetrics;
  tradeStats: TradeStats;
  monthlyReturns: Array<{
    month: string;
    return: number;
    trades: number;
  }>;
  dailyReturns: Array<{
    date: string;
    return: number;
    equity: number;
  }>;
  positions: BacktestPosition[];
  orders: BacktestOrder[];
  logs: BacktestLog[];
  createdAt: string;
  completedAt: string;
  duration: number;
  status: "completed" | "failed" | "running" | "cancelled";
  error?: string;
}

export interface BacktestSummary {
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  totalReturnPercent: number;
  annualizedReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  calmarRatio: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  averageTrade: number;
  averageHoldingPeriod: number;
  startTimestamp: string;
  endTimestamp: string;
  tradingDays: number;
}

export interface BacktestPerformance {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  calmarRatio: number;
  beta: number;
  alpha: number;
  informationRatio: number;
  treynorRatio: number;
}

export interface BacktestTrade {
  id: string;
  symbol: string;
  type: "long" | "short";
  entryTime: string;
  exitTime: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  entryValue: number;
  exitValue: number;
  profit: number;
  profitPercent: number;
  commission: number;
  slippage: number;
  netProfit: number;
  holdingPeriod: number;
  exitReason: string;
  strategy: string;
  signal: string;
}

export interface BacktestMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  recoveryFactor: number;
  averageTrade: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  averageHoldingPeriod: number;
  maxHoldingPeriod: number;
  minHoldingPeriod: number;
}

export interface RiskMetrics {
  var_95: number;
  var_99: number;
  expectedShortfall: number;
  beta: number;
  alpha: number;
  correlation: number;
  downsideDeviation: number;
  upsideDeviation: number;
  informationRatio: number;
  treynorRatio: number;
}

export interface TradeStats {
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  averageHoldingPeriod: number;
  profitFactor: number;
  recoveryFactor: number;
  averageTrade: number;
  medianTrade: number;
  standardDeviation: number;
  skewness: number;
  kurtosis: number;
}

export interface BacktestPosition {
  id: string;
  symbol: string;
  type: "long" | "short";
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  entryValue: number;
  currentValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  entryTime: string;
  exitTime?: string;
  status: "open" | "closed";
  trades: string[];
}

export interface BacktestOrder {
  id: string;
  symbol: string;
  type: "market" | "limit" | "stop" | "stop_limit";
  side: "buy" | "sell";
  quantity: number;
  price?: number;
  stopPrice?: number;
  status: "pending" | "filled" | "cancelled" | "rejected";
  filledQuantity: number;
  filledPrice: number;
  commission: number;
  slippage: number;
  createTime: string;
  fillTime?: string;
  cancelTime?: string;
  strategy: string;
  signal: string;
}

export interface BacktestLog {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  details?: any;
  source: string;
}

export interface BacktestJob {
  id: string;
  name: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
  config: BacktestConfig;
  result?: BacktestResult;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  error?: string;
  createdBy: string;
  priority: "low" | "normal" | "high";
}

export interface BacktestJobListResponse {
  jobs: BacktestJob[];
  total: number;
  page: number;
  limit: number;
}
