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
