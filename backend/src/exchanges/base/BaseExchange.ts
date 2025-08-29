import { EventEmitter } from 'events';
import {
  ExchangeConfig,
  Market,
  MarketData,
  Balance,
  Position,
  OrderRequest,
  Order,
  Trade,
  Ticker,
  OrderBook,
  Candle,
  ExchangeInfo,
  ConnectionStatus,
  SyncResult,
  ExchangeError,
  ExchangeEvent,
  ExchangeEventType,
  ExchangeCallback,
  SubscriptionOptions
} from './types';

export abstract class BaseExchange extends EventEmitter {
  protected config: ExchangeConfig;
  protected connectionStatus: ConnectionStatus;
  protected isConnected: boolean = false;
  protected ccxt: any;
  protected ws: any = null;
  protected subscriptions: Map<string, SubscriptionOptions> = new Map();
  protected callbacks: Map<ExchangeEventType, ExchangeCallback[]> = new Map();
  protected rateLimits: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(config: ExchangeConfig) {
    super();
    this.config = config;
    this.connectionStatus = {
      status: 'disconnected',
      lastUpdate: Date.now()
    };
  }

  // 抽象方法 - 必须由子类实现
  abstract getExchangeInfo(): Promise<ExchangeInfo>;
  abstract testConnection(): Promise<boolean>;
  abstract getMarkets(): Promise<Market[]>;
  abstract getBalance(): Promise<Balance[]>;
  abstract getPositions(): Promise<Position[]>;
  abstract getOrders(symbol?: string): Promise<Order[]>;
  abstract getOpenOrders(symbol?: string): Promise<Order[]>;
  abstract getClosedOrders(symbol?: string, limit?: number): Promise<Order[]>;
  abstract getOrder(orderId: string): Promise<Order>;
  abstract placeOrder(orderRequest: OrderRequest): Promise<Order>;
  abstract cancelOrder(orderId: string, symbol?: string): Promise<boolean>;
  abstract cancelAllOrders(symbol?: string): Promise<boolean>;
  abstract getTrades(symbol?: string, limit?: number): Promise<Trade[]>;
  abstract getMyTrades(symbol?: string, limit?: number): Promise<Trade[]>;
  abstract getTicker(symbol: string): Promise<Ticker>;
  abstract getTickers(symbols?: string[]): Promise<Ticker[]>;
  abstract getOrderBook(symbol: string, limit?: number): Promise<OrderBook>;
  abstract getOHLCV(symbol: string, timeframe?: string, limit?: number): Promise<Candle[]>;

  // 可选方法 - 子类可选择实现
  async editOrder(orderId: string, changes: Partial<OrderRequest>): Promise<Order> {
    throw new Error('Edit order not supported by this exchange');
  }

  async getDepositAddress(currency: string): Promise<string> {
    throw new Error('Deposit address not supported by this exchange');
  }

  async withdraw(currency: string, amount: number, address: string): Promise<any> {
    throw new Error('Withdraw not supported by this exchange');
  }

  // 连接管理
  async connect(): Promise<boolean> {
    try {
      this.updateConnectionStatus('connecting');
      
      // 测试连接
      const connected = await this.testConnection();
      if (!connected) {
        throw new Error('Connection test failed');
      }

      // 初始化WebSocket连接
      await this.connectWebSocket();
      
      this.isConnected = true;
      this.updateConnectionStatus('connected');
      this.emitEvent('connected', { exchange: this.config.id });
      
      return true;
    } catch (error) {
      this.isConnected = false;
      this.updateConnectionStatus('error', error instanceof Error ? error.message : 'Unknown error');
      this.emitEvent('error', { 
        exchange: this.config.id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      // 关闭WebSocket连接
      if (this.ws) {
        await this.closeWebSocket();
        this.ws = null;
      }

      this.isConnected = false;
      this.updateConnectionStatus('disconnected');
      this.emitEvent('disconnected', { exchange: this.config.id });
      
      // 清除所有订阅
      this.subscriptions.clear();
    } catch (error) {
      console.error(`Error disconnecting from ${this.config.id}:`, error);
      throw error;
    }
  }

  // WebSocket管理
  protected abstract connectWebSocket(): Promise<void>;
  protected abstract closeWebSocket(): Promise<void>;
  protected abstract handleWebSocketMessage(data: any): void;

  // 订阅管理
  async subscribeMarketData(symbols: string[], options?: SubscriptionOptions): Promise<void> {
    for (const symbol of symbols) {
      this.subscriptions.set(symbol, options || {});
      await this.subscribeToSymbol(symbol, options);
    }
  }

  async unsubscribeMarketData(symbols: string[]): Promise<void> {
    for (const symbol of symbols) {
      this.subscriptions.delete(symbol);
      await this.unsubscribeFromSymbol(symbol);
    }
  }

  protected abstract subscribeToSymbol(symbol: string, options?: SubscriptionOptions): Promise<void>;
  protected abstract unsubscribeFromSymbol(symbol: string): Promise<void>;

  // 事件处理
  onEvent(type: ExchangeEventType, callback: ExchangeCallback): void {
    if (!this.callbacks.has(type)) {
      this.callbacks.set(type, []);
    }
    this.callbacks.get(type)!.push(callback);
  }

  offEvent(type: ExchangeEventType, callback: ExchangeCallback): void {
    const callbacks = this.callbacks.get(type);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  protected emitEvent(type: ExchangeEventType, data: any): void {
    const event: ExchangeEvent = {
      type,
      exchange: this.config.id,
      data,
      timestamp: Date.now()
    };

    this.emit(type, event);

    const callbacks = this.callbacks.get(type);
    if (callbacks) {
      callbacks.forEach(callback => callback(event));
    }
  }

  // 数据同步
  async syncAccountData(): Promise<SyncResult> {
    try {
      const [balances, positions, orders] = await Promise.all([
        this.getBalance(),
        this.getPositions(),
        this.getOpenOrders()
      ]);

      return {
        success: true,
        message: 'Account data synced successfully',
        data: { balances, positions, orders },
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to sync account data',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  // 频率限制管理
  protected async checkRateLimit(operation: string): Promise<void> {
    const now = Date.now();
    const limit = this.rateLimits.get(operation);
    
    if (limit && limit.count > 0 && now < limit.resetTime) {
      const waitTime = limit.resetTime - now;
      throw new Error(`Rate limit exceeded for ${operation}. Wait ${waitTime}ms`);
    }
  }

  protected updateRateLimit(operation: string, windowMs: number, limit: number): void {
    const now = Date.now();
    const current = this.rateLimits.get(operation);
    
    if (!current || now >= current.resetTime) {
      this.rateLimits.set(operation, {
        count: 1,
        resetTime: now + windowMs
      });
    } else {
      current.count++;
    }
  }

  // 错误处理
  protected handleError(error: any): ExchangeError {
    const exchangeError: ExchangeError = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      details: error.details || error,
      timestamp: Date.now()
    };

    this.emitEvent('error', { 
      exchange: this.config.id, 
      error: exchangeError 
    });

    return exchangeError;
  }

  // 辅助方法
  protected updateConnectionStatus(status: ConnectionStatus['status'], error?: string): void {
    this.connectionStatus = {
      status,
      lastUpdate: Date.now(),
      error
    };
  }

  protected formatSymbol(symbol: string): string {
    // 默认实现，子类可以重写
    return symbol.toUpperCase();
  }

  protected parseSymbol(symbol: string): { base: string; quote: string } {
    // 默认实现，子类可以重写
    const parts = symbol.split('/');
    if (parts.length !== 2) {
      throw new Error(`Invalid symbol format: ${symbol}`);
    }
    return { base: parts[0], quote: parts[1] };
  }

  protected formatNumber(num: number, precision: number): number {
    return Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision);
  }

  protected calculatePnl(entryPrice: number, markPrice: number, size: number, side: 'long' | 'short'): number {
    if (side === 'long') {
      return (markPrice - entryPrice) * size;
    } else {
      return (entryPrice - markPrice) * size;
    }
  }

  protected calculateRoe(pnl: number, margin: number): number {
    return margin > 0 ? (pnl / margin) * 100 : 0;
  }

  // 获取连接状态
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  // 获取配置
  getConfig(): ExchangeConfig {
    return { ...this.config };
  }

  // 获取支持的交易对
  async getSupportedSymbols(): Promise<string[]> {
    const markets = await this.getMarkets();
    return markets.filter(m => m.active).map(m => m.symbol);
  }

  // 验证交易对
  async validateSymbol(symbol: string): Promise<boolean> {
    try {
      const markets = await this.getMarkets();
      return markets.some(m => m.symbol === symbol && m.active);
    } catch {
      return false;
    }
  }

  // 获取市场信息
  async getMarketInfo(symbol: string): Promise<Market | null> {
    try {
      const markets = await this.getMarkets();
      return markets.find(m => m.symbol === symbol) || null;
    } catch {
      return null;
    }
  }

  // 清理资源
  async cleanup(): Promise<void> {
    try {
      await this.disconnect();
      this.removeAllListeners();
      this.callbacks.clear();
      this.rateLimits.clear();
    } catch (error) {
      console.error(`Error cleaning up ${this.config.id}:`, error);
    }
  }
}