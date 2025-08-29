import { BaseExchange } from './base/BaseExchange';
import { BinanceAdapter } from './adapters/BinanceAdapter';
import { OKXAdapter } from './adapters/OKXAdapter';
import {
  ExchangeConfig,
  Market,
  Balance,
  Position,
  OrderRequest,
  Order,
  Trade,
  Ticker,
  OrderBook,
  Candle,
  ConnectionStatus,
  SyncResult,
  ExchangeEvent,
  ExchangeEventType
} from './types';

export class ExchangeService {
  private exchanges: Map<string, BaseExchange> = new Map();
  private eventCallbacks: Map<ExchangeEventType, Function[]> = new Map();
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeEventHandlers();
  }

  // 交易所管理
  async addExchange(config: ExchangeConfig): Promise<boolean> {
    try {
      // 检查是否已存在
      if (this.exchanges.has(config.id)) {
        throw new Error(`Exchange ${config.id} already exists`);
      }

      // 创建适配器实例
      const adapter = this.createAdapter(config);
      
      // 测试连接
      const connected = await adapter.testConnection();
      if (!connected) {
        throw new Error(`Failed to connect to ${config.name}`);
      }

      // 添加到管理器
      this.exchanges.set(config.id, adapter);
      
      // 设置事件监听
      this.setupExchangeEventHandlers(adapter);
      
      console.log(`Exchange ${config.name} added successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to add exchange ${config.id}:`, error);
      return false;
    }
  }

  async removeExchange(exchangeId: string): Promise<boolean> {
    try {
      const exchange = this.exchanges.get(exchangeId);
      if (!exchange) {
        throw new Error(`Exchange ${exchangeId} not found`);
      }

      // 停止同步
      this.stopSync(exchangeId);

      // 断开连接
      await exchange.disconnect();

      // 清理资源
      await exchange.cleanup();

      // 从管理器中移除
      this.exchanges.delete(exchangeId);

      console.log(`Exchange ${exchangeId} removed successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to remove exchange ${exchangeId}:`, error);
      return false;
    }
  }

  async connectExchange(exchangeId: string): Promise<boolean> {
    try {
      const exchange = this.exchanges.get(exchangeId);
      if (!exchange) {
        throw new Error(`Exchange ${exchangeId} not found`);
      }

      const connected = await exchange.connect();
      if (connected) {
        // 启动数据同步
        this.startSync(exchangeId);
      }

      return connected;
    } catch (error) {
      console.error(`Failed to connect to exchange ${exchangeId}:`, error);
      return false;
    }
  }

  async disconnectExchange(exchangeId: string): Promise<boolean> {
    try {
      const exchange = this.exchanges.get(exchangeId);
      if (!exchange) {
        throw new Error(`Exchange ${exchangeId} not found`);
      }

      // 停止同步
      this.stopSync(exchangeId);

      await exchange.disconnect();
      return true;
    } catch (error) {
      console.error(`Failed to disconnect from exchange ${exchangeId}:`, error);
      return false;
    }
  }

  // 数据获取方法
  async getMarkets(exchangeId: string): Promise<Market[]> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.getMarkets();
  }

  async getBalance(exchangeId: string): Promise<Balance[]> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.getBalance();
  }

  async getPositions(exchangeId: string): Promise<Position[]> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.getPositions();
  }

  async getOrders(exchangeId: string, symbol?: string): Promise<Order[]> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.getOrders(symbol);
  }

  async getOpenOrders(exchangeId: string, symbol?: string): Promise<Order[]> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.getOpenOrders(symbol);
  }

  async getClosedOrders(exchangeId: string, symbol?: string, limit?: number): Promise<Order[]> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.getClosedOrders(symbol, limit);
  }

  async getOrder(exchangeId: string, orderId: string): Promise<Order> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.getOrder(orderId);
  }

  async placeOrder(exchangeId: string, orderRequest: OrderRequest): Promise<Order> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.placeOrder(orderRequest);
  }

  async cancelOrder(exchangeId: string, orderId: string, symbol?: string): Promise<boolean> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.cancelOrder(orderId, symbol);
  }

  async cancelAllOrders(exchangeId: string, symbol?: string): Promise<boolean> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.cancelAllOrders(symbol);
  }

  async getTrades(exchangeId: string, symbol?: string, limit?: number): Promise<Trade[]> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.getTrades(symbol, limit);
  }

  async getMyTrades(exchangeId: string, symbol?: string, limit?: number): Promise<Trade[]> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.getMyTrades(symbol, limit);
  }

  async getTicker(exchangeId: string, symbol: string): Promise<Ticker> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.getTicker(symbol);
  }

  async getTickers(exchangeId: string, symbols?: string[]): Promise<Ticker[]> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.getTickers(symbols);
  }

  async getOrderBook(exchangeId: string, symbol: string, limit?: number): Promise<OrderBook> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.getOrderBook(symbol, limit);
  }

  async getOHLCV(exchangeId: string, symbol: string, timeframe?: string, limit?: number): Promise<Candle[]> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.getOHLCV(symbol, timeframe, limit);
  }

  // 批量操作
  async getBalances(): Promise<{ [exchangeId: string]: Balance[] }> {
    const result: { [exchangeId: string]: Balance[] } = {};
    
    for (const [exchangeId, exchange] of this.exchanges) {
      try {
        result[exchangeId] = await exchange.getBalance();
      } catch (error) {
        console.error(`Failed to get balance for ${exchangeId}:`, error);
        result[exchangeId] = [];
      }
    }
    
    return result;
  }

  async getAllPositions(): Promise<{ [exchangeId: string]: Position[] }> {
    const result: { [exchangeId: string]: Position[] } = {};
    
    for (const [exchangeId, exchange] of this.exchanges) {
      try {
        result[exchangeId] = await exchange.getPositions();
      } catch (error) {
        console.error(`Failed to get positions for ${exchangeId}:`, error);
        result[exchangeId] = [];
      }
    }
    
    return result;
  }

  async getAllOpenOrders(): Promise<{ [exchangeId: string]: Order[] }> {
    const result: { [exchangeId: string]: Order[] } = {};
    
    for (const [exchangeId, exchange] of this.exchanges) {
      try {
        result[exchangeId] = await exchange.getOpenOrders();
      } catch (error) {
        console.error(`Failed to get open orders for ${exchangeId}:`, error);
        result[exchangeId] = [];
      }
    }
    
    return result;
  }

  // 数据同步
  async syncExchangeData(exchangeId: string): Promise<SyncResult> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.syncAccountData();
  }

  async syncAllExchanges(): Promise<{ [exchangeId: string]: SyncResult }> {
    const result: { [exchangeId: string]: SyncResult } = {};
    
    for (const [exchangeId, exchange] of this.exchanges) {
      try {
        result[exchangeId] = await exchange.syncAccountData();
      } catch (error) {
        result[exchangeId] = {
          success: false,
          message: 'Sync failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now()
        };
      }
    }
    
    return result;
  }

  private startSync(exchangeId: string): void {
    // 停止现有同步
    this.stopSync(exchangeId);
    
    // 每30秒同步一次
    const interval = setInterval(async () => {
      try {
        await this.syncExchangeData(exchangeId);
      } catch (error) {
        console.error(`Failed to sync ${exchangeId}:`, error);
      }
    }, 30000);
    
    this.syncIntervals.set(exchangeId, interval);
  }

  private stopSync(exchangeId: string): void {
    const interval = this.syncIntervals.get(exchangeId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(exchangeId);
    }
  }

  // 事件处理
  onEvent(type: ExchangeEventType, callback: Function): void {
    if (!this.eventCallbacks.has(type)) {
      this.eventCallbacks.set(type, []);
    }
    this.eventCallbacks.get(type)!.push(callback);
  }

  offEvent(type: ExchangeEventType, callback: Function): void {
    const callbacks = this.eventCallbacks.get(type);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // 状态查询
  getExchangeStatus(exchangeId: string): ConnectionStatus {
    const exchange = this.getExchange(exchangeId);
    return exchange.getConnectionStatus();
  }

  getAllExchangeStatuses(): { [exchangeId: string]: ConnectionStatus } {
    const result: { [exchangeId: string]: ConnectionStatus } = {};
    
    for (const [exchangeId, exchange] of this.exchanges) {
      result[exchangeId] = exchange.getConnectionStatus();
    }
    
    return result;
  }

  getConnectedExchanges(): string[] {
    const connected: string[] = [];
    
    for (const [exchangeId, exchange] of this.exchanges) {
      const status = exchange.getConnectionStatus();
      if (status.status === 'connected') {
        connected.push(exchangeId);
      }
    }
    
    return connected;
  }

  getExchangeInfo(exchangeId: string) {
    const exchange = this.getExchange(exchangeId);
    return exchange.getConfig();
  }

  // 私有方法
  private createAdapter(config: ExchangeConfig): BaseExchange {
    switch (config.id) {
      case 'binance':
        return new BinanceAdapter(config);
      case 'okx':
        return new OKXAdapter(config);
      default:
        throw new Error(`Unsupported exchange: ${config.id}`);
    }
  }

  private getExchange(exchangeId: string): BaseExchange {
    const exchange = this.exchanges.get(exchangeId);
    if (!exchange) {
      throw new Error(`Exchange ${exchangeId} not found`);
    }
    return exchange;
  }

  private setupExchangeEventHandlers(exchange: BaseExchange): void {
    // 订阅所有事件类型
    const eventTypes: ExchangeEventType[] = [
      'connected', 'disconnected', 'error', 'order_update', 
      'position_update', 'balance_update', 'ticker_update', 
      'trade_update', 'orderbook_update'
    ];

    eventTypes.forEach(type => {
      exchange.onEvent(type, (event: ExchangeEvent) => {
        this.handleExchangeEvent(event);
      });
    });
  }

  private handleExchangeEvent(event: ExchangeEvent): void {
    // 转发事件到全局监听器
    const callbacks = this.eventCallbacks.get(event.type);
    if (callbacks) {
      callbacks.forEach(callback => callback(event));
    }

    // 记录重要事件
    if (event.type === 'error' || event.type === 'order_update') {
      console.log(`Exchange event: ${event.type}`, event);
    }
  }

  private initializeEventHandlers(): void {
    // 初始化事件回调映射
    const eventTypes: ExchangeEventType[] = [
      'connected', 'disconnected', 'error', 'order_update', 
      'position_update', 'balance_update', 'ticker_update', 
      'trade_update', 'orderbook_update'
    ];

    eventTypes.forEach(type => {
      this.eventCallbacks.set(type, []);
    });
  }

  // 清理资源
  async cleanup(): Promise<void> {
    // 停止所有同步
    for (const exchangeId of this.syncIntervals.keys()) {
      this.stopSync(exchangeId);
    }

    // 断开所有交易所连接
    for (const [exchangeId, exchange] of this.exchanges) {
      try {
        await exchange.cleanup();
      } catch (error) {
        console.error(`Failed to cleanup ${exchangeId}:`, error);
      }
    }

    // 清空映射
    this.exchanges.clear();
    this.eventCallbacks.clear();
    this.syncIntervals.clear();
  }
}

// 导出单例实例
export const exchangeService = new ExchangeService();