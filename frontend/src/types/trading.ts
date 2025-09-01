// 交易相关类型
export interface TradingAccount {
  id: string;
  name: string;
  type: "spot" | "margin" | "futures" | "options";
  exchange: string;
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
  isTestnet: boolean;
  isActive: boolean;
  balance: Balance;
  positions: Position[];
  createdAt: string;
  updatedAt: string;
  lastSyncAt?: string;
  settings: AccountSettings;
  metadata: AccountMetadata;
}

export interface Balance {
  total: number;
  available: number;
  used: number;
  assets: AssetBalance[];
  timestamp: string;
}

export interface AssetBalance {
  asset: string;
  free: number;
  locked: number;
  total: number;
  valueInUSD: number;
  priceInUSD: number;
  percentage: number;
}

export interface Position {
  id: string;
  symbol: string;
  type: "long" | "short";
  quantity: number;
  entryPrice: number;
  markPrice: number;
  liquidationPrice?: number;
  unrealizedPnL: number;
  realizedPnL: number;
  percentage: number;
  leverage: number;
  margin: number;
  maintenanceMargin: number;
  initialMargin: number;
  timestamp: string;
  status: "open" | "closed" | "liquidated";
  trades: string[];
  orders: string[];
}

export interface Order {
  id: string;
  symbol: string;
  type:
    | "market"
    | "limit"
    | "stop"
    | "stop_limit"
    | "take_profit"
    | "stop_loss";
  side: "buy" | "sell";
  quantity: number;
  price?: number;
  stopPrice?: number;
  icebergQuantity?: number;
  timeInForce: "GTC" | "IOC" | "FOK" | "DAY";
  status: "pending" | "open" | "filled" | "cancelled" | "rejected" | "expired";
  filledQuantity: number;
  remainingQuantity: number;
  averageFillPrice?: number;
  commission: number;
  quoteQuantity?: number;
  strategy?: string;
  clientId?: string;
  createTime: string;
  updateTime: string;
  expireTime?: string;
  trades: OrderTrade[];
  accountId: string;
  exchange: string;
  error?: string;
}

export interface OrderTrade {
  id: string;
  orderId: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  commission: number;
  commissionAsset: string;
  timestamp: string;
  isMaker: boolean;
  isBestMatch: boolean;
}

export interface AccountSettings {
  leverage: number;
  marginType: "isolated" | "cross";
  riskLimit: number;
  maxPositionSize: number;
  autoDeposit: boolean;
  notifications: boolean;
  tradingEnabled: boolean;
  apiPermissions: string[];
  ipWhitelist: string[];
}

export interface AccountMetadata {
  accountType: string;
  tier: number;
  features: string[];
  limits: AccountLimits;
  fees: FeeStructure;
  status: AccountStatus;
}

export interface AccountLimits {
  maxOpenPositions: number;
  maxOrdersPerSecond: number;
  maxOrdersPerDay: number;
  maxNotionalValue: number;
  minOrderSize: number;
  maxLeverage: number;
}

export interface FeeStructure {
  maker: number;
  taker: number;
  settlement: number;
  network: number;
  discountTier: number;
  volume30d: number;
}

export interface AccountStatus {
  accountStatus: string;
  tradingStatus: string;
  withdrawalStatus: string;
  depositStatus: string;
  restrictions: string[];
  warnings: string[];
}

export interface MarketData {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  volume: number;
  high24h: number;
  low24h: number;
  change24h: number;
  changePercent24h: number;
  lastUpdate: string;
  marketCap: number;
  supply: number;
}

export interface HistoricalData {
  symbol: string;
  interval: string;
  startTime: string;
  endTime: string;
  data: Array<{
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    quoteVolume: number;
    trades: number;
  }>;
}

export interface TradeHistory {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  commission: number;
  commissionAsset: string;
  timestamp: string;
  orderId: string;
  accountId: string;
  exchange: string;
  isMaker: boolean;
}

// 风险管理相关类型
export interface RiskRule {
  id: string;
  name: string;
  type: 'position_size' | 'daily_loss' | 'drawdown' | 'leverage' | 'cooldown' | 'correlation';
  enabled: boolean;
  parameters: Record<string, any>;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface RiskAssessment {
  passed: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  violations: RiskViolation[];
  recommendations: string[];
  adjustedParameters?: Record<string, any>;
}

export interface RiskViolation {
  ruleId: string;
  ruleName: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  currentValue: number;
  limitValue: number;
  recommendation: string;
}

export interface RiskMetrics {
  totalExposure: number;
  dailyPnL: number;
  maxDrawdown: number;
  currentDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  profitFactor: number;
  correlationRisk: number;
  leverageUsage: number;
  riskScore: number;
}

export interface OrderValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  adjustedOrder?: Partial<Order>;
}

export interface RiskAlert {
  id: string;
  accountId: string;
  type: 'HIGH_RISK_SCORE' | 'HIGH_DRAWDOWN' | 'DAILY_LOSS_LIMIT' | 'MARGIN_CALL' | 'POSITION_LIMIT';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data?: any;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

// 订单验证相关类型
export interface OrderValidationRequest {
  accountId: string;
  symbol: string;
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  side: 'buy' | 'sell';
  amount: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK' | 'DAY';
}

export interface OrderValidationResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
  riskAssessment?: RiskAssessment;
  adjustedOrder?: OrderValidationRequest;
}

// 市场数据增强类型
export interface OrderBook {
  symbol: string;
  bids: [number, number][]; // [price, quantity]
  asks: [number, number][]; // [price, quantity]
  timestamp: string;
}

export interface Ticker {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  volume24h: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  open24h: number;
  lastUpdate: string;
}

export interface Candlestick {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume: number;
  trades: number;
}

// 策略相关类型
export interface Strategy {
  id: string;
  name: string;
  description?: string;
  type: 'grid' | 'momentum' | 'mean_reversion' | 'arbitrage' | 'custom';
  status: 'active' | 'inactive' | 'paused';
  parameters: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StrategyParameter {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'select';
  value: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  description: string;
  required: boolean;
}

// 回测相关类型
export interface Backtest {
  id: string;
  name: string;
  strategyId: string;
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialBalance: number;
  finalBalance: number;
  totalPnL: number;
  totalReturn: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
  tradesCount: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  parameters: Record<string, any>;
  results?: BacktestResults;
  createdAt: string;
  updatedAt: string;
}

export interface BacktestResults {
  trades: Array<{
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    price: number;
    timestamp: string;
    pnl: number;
    commission: number;
  }>;
  equity_curve: Array<{
    timestamp: string;
    balance: number;
    drawdown: number;
  }>;
  metrics: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    profitFactor: number;
    sharpeRatio: number;
    maxDrawdown: number;
    totalReturn: number;
    annualizedReturn: number;
    volatility: number;
  };
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta?: {
    startTime?: string;
    endTime?: string;
    filters?: Record<string, any>;
  };
}

// WebSocket事件类型
export interface WebSocketEvent {
  type: 'order_update' | 'position_update' | 'balance_update' | 'ticker_update' | 'trade_update';
  data: any;
  timestamp: string;
  exchange?: string;
  accountId?: string;
}

export interface OrderUpdateEvent {
  orderId: string;
  status: string;
  filledQuantity: number;
  remainingQuantity: number;
  averageFillPrice?: number;
  timestamp: string;
}

export interface PositionUpdateEvent {
  positionId: string;
  symbol: string;
  markPrice: number;
  unrealizedPnL: number;
  percentage: number;
  timestamp: string;
}

export interface BalanceUpdateEvent {
  accountId: string;
  asset: string;
  free: number;
  locked: number;
  total: number;
  timestamp: string;
}

export interface TickerUpdateEvent {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  volume24h: number;
  change24h: number;
  timestamp: string;
}

// 工具类型
export type ExchangeType = 'binance' | 'okx' | 'bybit' | 'huobi' | 'kucoin' | 'gate';

export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit' | 'take_profit' | 'stop_loss';

export type OrderSide = 'buy' | 'sell';

export type OrderStatus = 'pending' | 'open' | 'filled' | 'cancelled' | 'rejected' | 'expired';

export type PositionType = 'long' | 'short';

export type PositionStatus = 'open' | 'closed' | 'liquidated';

export type TimeInForce = 'GTC' | 'IOC' | 'FOK' | 'DAY';

export type AccountType = 'spot' | 'margin' | 'futures' | 'options';

export type MarginType = 'isolated' | 'cross';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type StrategyType = 'grid' | 'momentum' | 'mean_reversion' | 'arbitrage' | 'custom';

export type BacktestStatus = 'pending' | 'running' | 'completed' | 'failed';

// 配置类型
export interface TradingConfig {
  exchanges: ExchangeConfig[];
  risk: RiskConfig;
  notifications: NotificationConfig;
  api: ApiConfig;
}

export interface ExchangeConfig {
  name: string;
  type: ExchangeType;
  enabled: boolean;
  testnet: boolean;
  apiKey?: string;
  apiSecret?: string;
  passphrase?: string;
  features: string[];
  limits: AccountLimits;
}

export interface RiskConfig {
  enabled: boolean;
  maxPositionSize: number;
  maxDailyLoss: number;
  maxDrawdown: number;
  maxLeverage: number;
  autoReducePositions: boolean;
  stopLossEnabled: boolean;
  takeProfitEnabled: boolean;
  rules: RiskRule[];
}

export interface NotificationConfig {
  enabled: boolean;
  email: boolean;
  push: boolean;
  webhook?: string;
  events: string[];
}

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  rateLimit: {
    requests: number;
    window: number;
  };
}
