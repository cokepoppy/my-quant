// 交易所基础类型定义

export interface ExchangeConfig {
  id: string;           // 交易所ID，如 'binance', 'okx'
  name: string;         // 交易所显示名称
  apiKey: string;       // API Key
  apiSecret: string;    // API Secret
  passphrase?: string;  // API Passphrase (某些交易所需要)
  testnet: boolean;     // 是否使用测试网络
  enableRateLimit: boolean; // 是否启用频率限制
}

export interface Market {
  symbol: string;        // 交易对符号，如 'BTC/USDT'
  base: string;         // 基础货币，如 'BTC'
  quote: string;        // 报价货币，如 'USDT'
  type: string;         // 市场类型，如 'spot', 'future', 'swap'
  spot: boolean;        // 是否现货市场
  margin: boolean;      // 是否支持保证金
  swap: boolean;        // 是否支持永续合约
  future: boolean;      // 是否支持期货
  active: boolean;      // 是否活跃
  precision: {
    base: number;       // 基础货币精度
    quote: number;      // 报价货币精度
    amount: number;     // 数量精度
    price: number;      // 价格精度
  };
  limits: {
    amount: {
      min: number;      // 最小数量
      max: number;      // 最大数量
    };
    price: {
      min: number;      // 最小价格
      max: number;      // 最大价格
    };
    cost: {
      min: number;      // 最小成本
      max: number;      // 最大成本
    };
  };
  info: any;            // 原始交易所信息
}

export interface MarketData {
  symbol: string;        // 交易对符号
  price: number;         // 当前价格
  bid: number;           // 买一价
  ask: number;           // 卖一价
  high: number;          // 24小时最高价
  low: number;           // 24小时最低价
  volume: number;        // 24小时成交量
  quoteVolume: number;   // 24小时成交额
  change: number;        // 24小时价格变化
  changePercent: number; // 24小时价格变化百分比
  lastUpdate: number;    // 最后更新时间戳
  timestamp: number;     // 数据时间戳
}

export interface Balance {
  asset: string;         // 资产名称，如 'BTC', 'USDT'
  free: number;          // 可用余额
  used: number;          // 已用余额
  total: number;         // 总余额
  valueInUSD?: number;   // 美元价值
  percentage?: number;   // 占总资产百分比
}

export interface Position {
  symbol: string;        // 交易对符号
  side: 'long' | 'short'; // 持仓方向
  size: number;          // 持仓数量
  entryPrice: number;    // 入场价格
  markPrice: number;     // 标记价格
  pnl: number;           // 浮动盈亏
  roe: number;           // 收益率
  leverage: number;      // 杠杆倍数
  margin: number;        // 保证金
  liquidationPrice: number; // 强制平仓价格
  status: 'open' | 'closed'; // 持仓状态
  exchangeId?: string;   // 交易所持仓ID
  createdAt: number;     // 创建时间
  updatedAt: number;     // 更新时间
}

export interface OrderRequest {
  symbol: string;                    // 交易对符号
  type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'take_profit'; // 订单类型
  side: 'buy' | 'sell';              // 买卖方向
  amount: number;                    // 数量
  price?: number;                     // 价格 (限价单需要)
  stopPrice?: number;                // 触发价格 (止损单需要)
  takeProfit?: number;               // 止盈价格
  stopLoss?: number;                 // 止损价格
  clientOrderId?: string;            // 客户端订单ID
  timeInForce?: 'GTC' | 'IOC' | 'FOK'; // 时间有效性
  postOnly?: boolean;                // 是否只做挂单
  reduceOnly?: boolean;               // 是否只减仓
  leverage?: number;                 // 杠杆倍数
  params?: Record<string, any>;      // 额外参数
}

export interface Order {
  id: string;                         // 订单ID
  clientOrderId?: string;             // 客户端订单ID
  symbol: string;                     // 交易对符号
  type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'take_profit'; // 订单类型
  side: 'buy' | 'sell';               // 买卖方向
  amount: number;                     // 订单数量
  price?: number;                     // 订单价格
  stopPrice?: number;                 // 触发价格
  takeProfit?: number;                // 止盈价格
  stopLoss?: number;                  // 止损价格
  status: 'pending' | 'open' | 'filled' | 'cancelled' | 'rejected'; // 订单状态
  filled: number;                     // 已成交数量
  remaining: number;                  // 剩余数量
  average?: number;                   // 成交均价
  cost?: number;                      // 成交金额
  fee?: number;                       // 手续费
  feeCurrency?: string;               // 手续费货币
  createTime: number;                 // 创建时间
  updateTime?: number;                // 更新时间
  executedTime?: number;              // 执行时间
  leverage?: number;                  // 杠杆倍数
  exchangeId?: string;                // 交易所订单ID
  metadata?: Record<string, any>;     // 额外信息
}

export interface Trade {
  id: string;                         // 交易ID
  orderId: string;                    // 关联订单ID
  symbol: string;                     // 交易对符号
  side: 'buy' | 'sell';               // 买卖方向
  amount: number;                     // 交易数量
  price: number;                      // 交易价格
  cost: number;                       // 交易金额
  fee?: number;                       // 手续费
  feeCurrency?: string;               // 手续费货币
  timestamp: number;                  // 交易时间
  isMaker?: boolean;                  // 是否是挂单
  isTaker?: boolean;                  // 是否是吃单
  exchangeId?: string;                // 交易所交易ID
}

export interface Ticker {
  symbol: string;                     // 交易对符号
  bid: number;                        // 买一价
  ask: number;                        // 卖一价
  last: number;                       // 最新价格
  high: number;                       // 24小时最高价
  low: number;                        // 24小时最低价
  volume: number;                     // 24小时成交量
  quoteVolume: number;                // 24小时成交额
  timestamp: number;                  // 时间戳
  info: any;                          // 原始信息
}

export interface OrderBook {
  symbol: string;                     // 交易对符号
  bids: [number, number][];           // 买单 [价格, 数量]
  asks: [number, number][];           // 卖单 [价格, 数量]
  timestamp: number;                  // 时间戳
  datetime: string;                   // 日期时间
  nonce?: number;                     // 序列号
}

export interface Candle {
  timestamp: number;                  // 时间戳
  datetime: string;                   // 日期时间
  symbol: string;                     // 交易对符号
  open: number;                       // 开盘价
  high: number;                       // 最高价
  low: number;                        // 最低价
  close: number;                      // 收盘价
  volume: number;                     // 成交量
  info?: any;                         // 额外信息
}

export interface ExchangeInfo {
  id: string;                         // 交易所ID
  name: string;                       // 交易所名称
  version: string;                    // 版本
  supportedTypes: string[];           // 支持的市场类型
  features: {
    spot: boolean;                    // 是否支持现货
    margin: boolean;                  // 是否支持保证金
    swap: boolean;                    // 是否支持永续合约
    future: boolean;                  // 是否支持期货
    createMarketOrder: boolean;       // 是否支持市价单
    createLimitOrder: boolean;        // 是否支持限价单
    createStopOrder: boolean;         // 是否支持止损单
    createStopLimitOrder: boolean;    // 是否支持止损限价单
    cancelOrder: boolean;             // 是否支持取消订单
    cancelAllOrders: boolean;         // 是否支持取消所有订单
    editOrder: boolean;               // 是否支持修改订单
    fetchOrder: boolean;              // 是否支持查询订单
    fetchOrders: boolean;             // 是否支持查询订单列表
    fetchOpenOrders: boolean;         // 是否支持查询未完成订单
    fetchClosedOrders: boolean;       // 是否支持查询已完成订单
    fetchMyTrades: boolean;           // 是否支持查询我的交易
    fetchBalance: boolean;            // 是否支持查询余额
    fetchPositions: boolean;          // 是否支持查询持仓
    fetchMarkets: boolean;            // 是否支持查询市场
    fetchTicker: boolean;             // 是否支持查询行情
    fetchTickers: boolean;            // 是否支持查询行情列表
    fetchOrderBook: boolean;          // 是否支持查询订单簿
    fetchOHLCV: boolean;              // 是否支持查询K线
  };
  urls: {
    api: string;                      // API地址
    www: string;                      // 网站地址
    doc: string;                      // 文档地址
    test?: string;                    // 测试网地址
  };
  requiredCredentials: {
    apiKey: boolean;                  // 是否需要API Key
    secret: boolean;                   // 是否需要Secret
    uid?: boolean;                     // 是否需要UID
    login?: boolean;                   // 是否需要登录
    password?: boolean;                // 是否需要密码
    twofa?: boolean;                   // 是否需要2FA
  };
  rateLimits: Array<{
    rateLimitType: string;
    interval: string;
    intervalNum: number;
    limit: number;
  }>;
  apiStandards: {
    version: string;
    rest: boolean;
    websocket: boolean;
    fix: boolean;
  };
}

export interface ConnectionStatus {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastUpdate: number;
  error?: string;
  latency?: number;
}

export interface SyncResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  timestamp: number;
}

export interface ExchangeError {
  code: string | number;
  message: string;
  details?: any;
  timestamp: number;
}

// 事件类型
export type ExchangeEventType = 
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'order_update'
  | 'position_update'
  | 'balance_update'
  | 'ticker_update'
  | 'trade_update'
  | 'orderbook_update';

export interface ExchangeEvent {
  type: ExchangeEventType;
  exchange: string;
  data: any;
  timestamp: number;
}

// 回调函数类型
export type ExchangeCallback = (event: ExchangeEvent) => void;

// 订阅选项
export interface SubscriptionOptions {
  symbols?: string[];
  interval?: string;
  limit?: number;
  params?: Record<string, any>;
}