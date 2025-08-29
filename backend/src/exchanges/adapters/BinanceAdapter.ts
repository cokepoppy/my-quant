import { BaseExchange } from '../base/BaseExchange';
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
  SubscriptionOptions
} from '../types';

export class BinanceAdapter extends BaseExchange {
  private wsUrl: string;
  private restUrl: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private pingInterval: NodeJS.Timeout | null = null;
  private lastPingTime: number = 0;

  constructor(config: ExchangeConfig) {
    super(config);
    this.wsUrl = config.testnet 
      ? 'wss://testnet.binance.vision' 
      : 'wss://stream.binance.com:9443';
    this.restUrl = config.testnet 
      ? 'https://testnet.binance.vision' 
      : 'https://api.binance.com';
    
    // 初始化CCXT
    this.initializeCCXT();
  }

  private initializeCCXT(): void {
    const ccxt = require('ccxt');
    this.ccxt = new ccxt.binance({
      apiKey: this.config.apiKey,
      secret: this.config.apiSecret,
      sandbox: this.config.testnet,
      enableRateLimit: this.config.enableRateLimit,
      options: {
        defaultType: 'spot', // 可以是 'spot', 'margin', 'future'
        adjustForTimeDifference: true,
        recvWindow: 60000,
      },
    });
  }

  // 基础信息
  async getExchangeInfo(): Promise<ExchangeInfo> {
    const info = await this.ccxt.fetchMarkets();
    return {
      id: 'binance',
      name: 'Binance',
      version: '1.0',
      supportedTypes: ['spot', 'margin', 'future', 'swap'],
      features: {
        spot: true,
        margin: true,
        swap: true,
        future: true,
        createMarketOrder: true,
        createLimitOrder: true,
        createStopOrder: true,
        createStopLimitOrder: true,
        cancelOrder: true,
        cancelAllOrders: true,
        editOrder: false,
        fetchOrder: true,
        fetchOrders: true,
        fetchOpenOrders: true,
        fetchClosedOrders: true,
        fetchMyTrades: true,
        fetchBalance: true,
        fetchPositions: true,
        fetchMarkets: true,
        fetchTicker: true,
        fetchTickers: true,
        fetchOrderBook: true,
        fetchOHLCV: true,
      },
      urls: {
        api: this.restUrl,
        www: 'https://www.binance.com',
        doc: 'https://binance-docs.github.io/apidocs/spot/en/',
        test: 'https://testnet.binance.vision',
      },
      requiredCredentials: {
        apiKey: true,
        secret: true,
      },
      rateLimits: this.ccxt.rateLimits,
      apiStandards: {
        version: 'v1',
        rest: true,
        websocket: true,
        fix: false,
      },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.ccxt.fetchBalance();
      return true;
    } catch (error) {
      console.error('Binance connection test failed:', error);
      return false;
    }
  }

  // 市场数据
  async getMarkets(): Promise<Market[]> {
    const markets = await this.ccxt.fetchMarkets();
    return markets.map((market: any) => ({
      symbol: market.symbol,
      base: market.base,
      quote: market.quote,
      type: market.type,
      spot: market.spot,
      margin: market.margin,
      swap: market.swap,
      future: market.future,
      active: market.active,
      precision: market.precision,
      limits: market.limits,
      info: market.info,
    }));
  }

  async getBalance(): Promise<Balance[]> {
    const balance = await this.ccxt.fetchBalance();
    const balances: Balance[] = [];

    for (const [asset, data] of Object.entries(balance)) {
      if (asset === 'info' || asset === 'free' || asset === 'used' || asset === 'total') continue;
      
      const balanceData = data as any;
      balances.push({
        asset,
        free: balanceData.free || 0,
        used: balanceData.used || 0,
        total: balanceData.total || 0,
        valueInUSD: balanceData.total ? await this.getAssetValueInUSD(asset, balanceData.total) : undefined,
      });
    }

    return balances;
  }

  async getPositions(): Promise<Position[]> {
    try {
      // 对于现货交易，返回空数组
      if (this.ccxt.options.defaultType === 'spot') {
        return [];
      }

      const positions = await this.ccxt.fetchPositions();
      return positions
        .filter((p: any) => p.contracts > 0)
        .map((p: any) => ({
          symbol: p.symbol,
          side: p.side.toLowerCase() as 'long' | 'short',
          size: Math.abs(p.contracts),
          entryPrice: p.entryPrice,
          markPrice: p.markPrice,
          pnl: p.unrealized,
          roe: p.percentage,
          leverage: p.leverage,
          margin: p.initialMargin,
          liquidationPrice: p.liquidationPrice,
          status: 'open',
          exchangeId: p.id,
          createdAt: p.timestamp,
          updatedAt: Date.now(),
        }));
    } catch (error) {
      console.error('Error fetching positions:', error);
      return [];
    }
  }

  async getOrders(symbol?: string): Promise<Order[]> {
    const params = symbol ? { symbol: this.formatSymbol(symbol) } : {};
    const orders = await this.ccxt.fetchOrders(params);
    return orders.map(this.formatOrder.bind(this));
  }

  async getOpenOrders(symbol?: string): Promise<Order[]> {
    const params = symbol ? { symbol: this.formatSymbol(symbol) } : {};
    const orders = await this.ccxt.fetchOpenOrders(params);
    return orders.map(this.formatOrder.bind(this));
  }

  async getClosedOrders(symbol?: string, limit: number = 100): Promise<Order[]> {
    const params = symbol ? { symbol: this.formatSymbol(symbol), limit } : { limit };
    const orders = await this.ccxt.fetchClosedOrders(params);
    return orders.map(this.formatOrder.bind(this));
  }

  async getOrder(orderId: string): Promise<Order> {
    const order = await this.ccxt.fetchOrder(orderId);
    return this.formatOrder(order);
  }

  async placeOrder(orderRequest: OrderRequest): Promise<Order> {
    const params: any = {
      symbol: this.formatSymbol(orderRequest.symbol),
      type: orderRequest.type,
      side: orderRequest.side,
      amount: orderRequest.amount,
    };

    if (orderRequest.price) {
      params.price = orderRequest.price;
    }

    if (orderRequest.stopPrice) {
      params.stopPrice = orderRequest.stopPrice;
    }

    if (orderRequest.clientOrderId) {
      params.clientOrderId = orderRequest.clientOrderId;
    }

    if (orderRequest.timeInForce) {
      params.timeInForce = orderRequest.timeInForce;
    }

    if (orderRequest.params) {
      Object.assign(params, orderRequest.params);
    }

    const order = await this.ccxt.createOrder(params);
    return this.formatOrder(order);
  }

  async cancelOrder(orderId: string, symbol?: string): Promise<boolean> {
    const params: any = { id: orderId };
    if (symbol) {
      params.symbol = this.formatSymbol(symbol);
    }
    
    await this.ccxt.cancelOrder(params);
    return true;
  }

  async cancelAllOrders(symbol?: string): Promise<boolean> {
    const params = symbol ? { symbol: this.formatSymbol(symbol) } : {};
    await this.ccxt.cancelAllOrders(params);
    return true;
  }

  async getTrades(symbol?: string, limit: number = 100): Promise<Trade[]> {
    const params: any = { limit };
    if (symbol) {
      params.symbol = this.formatSymbol(symbol);
    }
    
    const trades = await this.ccxt.fetchTrades(params);
    return trades.map(this.formatTrade.bind(this));
  }

  async getMyTrades(symbol?: string, limit: number = 100): Promise<Trade[]> {
    const params: any = { limit };
    if (symbol) {
      params.symbol = this.formatSymbol(symbol);
    }
    
    const trades = await this.ccxt.fetchMyTrades(params);
    return trades.map(this.formatTrade.bind(this));
  }

  async getTicker(symbol: string): Promise<Ticker> {
    const ticker = await this.ccxt.fetchTicker(this.formatSymbol(symbol));
    return {
      symbol: ticker.symbol,
      bid: ticker.bid,
      ask: ticker.ask,
      last: ticker.last,
      high: ticker.high,
      low: ticker.low,
      volume: ticker.volume,
      quoteVolume: ticker.quoteVolume,
      timestamp: ticker.timestamp,
      info: ticker.info,
    };
  }

  async getTickers(symbols?: string[]): Promise<Ticker[]> {
    const params = symbols ? { symbols: symbols.map(s => this.formatSymbol(s)) } : {};
    const tickers = await this.ccxt.fetchTickers(params);
    return tickers.map((t: any) => ({
      symbol: t.symbol,
      bid: t.bid,
      ask: t.ask,
      last: t.last,
      high: t.high,
      low: t.low,
      volume: t.volume,
      quoteVolume: t.quoteVolume,
      timestamp: t.timestamp,
      info: t.info,
    }));
  }

  async getOrderBook(symbol: string, limit: number = 100): Promise<OrderBook> {
    const orderbook = await this.ccxt.fetchOrderBook(this.formatSymbol(symbol), limit);
    return {
      symbol: orderbook.symbol,
      bids: orderbook.bids,
      asks: orderbook.asks,
      timestamp: orderbook.timestamp,
      datetime: orderbook.datetime,
      nonce: orderbook.nonce,
    };
  }

  async getOHLCV(symbol: string, timeframe: string = '1h', limit: number = 100): Promise<Candle[]> {
    const ohlcv = await this.ccxt.fetchOHLCV(this.formatSymbol(symbol), timeframe, undefined, limit);
    return ohlcv.map((candle: any) => ({
      timestamp: candle[0],
      datetime: new Date(candle[0]).toISOString(),
      symbol,
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5],
    }));
  }

  // WebSocket相关
  protected async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const WebSocket = require('ws');
        this.ws = new WebSocket(`${this.wsUrl}/ws`);
        
        this.ws.on('open', () => {
          console.log(`Binance WebSocket connected for ${this.config.id}`);
          this.startPingInterval();
          resolve();
        });

        this.ws.on('message', (data: any) => {
          this.handleWebSocketMessage(data);
        });

        this.ws.on('error', (error: any) => {
          console.error(`Binance WebSocket error for ${this.config.id}:`, error);
          this.handleWebSocketError(error);
        });

        this.ws.on('close', () => {
          console.log(`Binance WebSocket closed for ${this.config.id}`);
          this.handleWebSocketClose();
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  protected async closeWebSocket(): Promise<void> {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.ws) {
      this.ws.close();
    }
  }

  protected handleWebSocketMessage(data: any): void {
    try {
      const message = JSON.parse(data);
      
      if (message.stream) {
        const streamData = JSON.parse(message.data);
        
        if (message.stream.endsWith('@ticker')) {
          this.handleTickerUpdate(streamData);
        } else if (message.stream.endsWith('@trade')) {
          this.handleTradeUpdate(streamData);
        } else if (message.stream.endsWith('@depth')) {
          this.handleOrderBookUpdate(streamData);
        } else if (message.stream.endsWith('@kline')) {
          this.handleCandleUpdate(streamData);
        }
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  private handleTickerUpdate(data: any): void {
    const ticker = {
      symbol: data.s,
      price: parseFloat(data.c),
      bid: parseFloat(data.b),
      ask: parseFloat(data.a),
      high: parseFloat(data.h),
      low: parseFloat(data.l),
      volume: parseFloat(data.v),
      quoteVolume: parseFloat(data.q),
      change: parseFloat(data.p),
      changePercent: parseFloat(data.P),
      timestamp: Date.now(),
    };

    this.emitEvent('ticker_update', { symbol: data.s, ticker });
  }

  private handleTradeUpdate(data: any): void {
    const trade = {
      id: data.t,
      symbol: data.s,
      price: parseFloat(data.p),
      amount: parseFloat(data.q),
      timestamp: data.T,
      isMaker: data.m,
    };

    this.emitEvent('trade_update', { symbol: data.s, trade });
  }

  private handleOrderBookUpdate(data: any): void {
    const orderbook = {
      symbol: data.s,
      bids: data.b.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])]),
      asks: data.a.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])]),
      timestamp: Date.now(),
    };

    this.emitEvent('orderbook_update', { symbol: data.s, orderbook });
  }

  private handleCandleUpdate(data: any): void {
    const kline = data.k;
    const candle = {
      timestamp: kline.t,
      datetime: new Date(kline.t).toISOString(),
      symbol: kline.s,
      open: parseFloat(kline.o),
      high: parseFloat(kline.h),
      low: parseFloat(kline.l),
      close: parseFloat(kline.c),
      volume: parseFloat(kline.v),
    };

    this.emitEvent('kline_update', { symbol: kline.s, candle });
  }

  protected async subscribeToSymbol(symbol: string, options?: SubscriptionOptions): Promise<void> {
    const formattedSymbol = this.formatSymbol(symbol).toLowerCase();
    
    // 订阅ticker数据
    await this.wsSubscribe(`${formattedSymbol}@ticker`);
    
    // 订阅trade数据
    await this.wsSubscribe(`${formattedSymbol}@trade`);
    
    // 订阅orderbook数据
    await this.wsSubscribe(`${formattedSymbol}@depth5`);
    
    // 订阅K线数据
    const interval = options?.interval || '1m';
    await this.wsSubscribe(`${formattedSymbol}@kline_${interval}`);
  }

  protected async unsubscribeFromSymbol(symbol: string): Promise<void> {
    const formattedSymbol = this.formatSymbol(symbol).toLowerCase();
    
    await this.wsUnsubscribe(`${formattedSymbol}@ticker`);
    await this.wsUnsubscribe(`${formattedSymbol}@trade`);
    await this.wsUnsubscribe(`${formattedSymbol}@depth5`);
    await this.wsUnsubscribe(`${formattedSymbol}@kline_1m`);
  }

  private async wsSubscribe(stream: string): Promise<void> {
    const message = JSON.stringify({
      method: 'SUBSCRIBE',
      params: [stream],
      id: Date.now(),
    });
    
    this.ws.send(message);
  }

  private async wsUnsubscribe(stream: string): Promise<void> {
    const message = JSON.stringify({
      method: 'UNSUBSCRIBE',
      params: [stream],
      id: Date.now(),
    });
    
    this.ws.send(message);
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === 1) {
        this.lastPingTime = Date.now();
        this.ws.ping();
      }
    }, 30000); // 每30秒ping一次
  }

  private handleWebSocketError(error: any): void {
    this.emitEvent('error', { 
      exchange: this.config.id, 
      error: error.message || 'WebSocket error' 
    });
  }

  private handleWebSocketClose(): void {
    this.isConnected = false;
    this.updateConnectionStatus('disconnected');
    
    // 尝试重连
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect to Binance (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect().catch(console.error);
      }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1));
    } else {
      console.error('Max reconnection attempts reached for Binance');
    }
  }

  // 辅助方法
  private formatOrder(order: any): Order {
    return {
      id: order.id,
      clientOrderId: order.clientOrderId,
      symbol: order.symbol,
      type: order.type,
      side: order.side,
      amount: order.amount,
      price: order.price,
      stopPrice: order.stopPrice,
      status: order.status,
      filled: order.filled,
      remaining: order.remaining,
      average: order.average,
      cost: order.cost,
      fee: order.fee?.cost,
      feeCurrency: order.fee?.currency,
      createTime: order.datetime ? new Date(order.datetime).getTime() : Date.now(),
      updateTime: order.lastTradeTimestamp,
      exchangeId: order.id,
      metadata: order.info,
    };
  }

  private formatTrade(trade: any): Trade {
    return {
      id: trade.id,
      orderId: trade.order,
      symbol: trade.symbol,
      side: trade.side,
      amount: trade.amount,
      price: trade.price,
      cost: trade.cost,
      fee: trade.fee?.cost,
      feeCurrency: trade.fee?.currency,
      timestamp: trade.datetime ? new Date(trade.datetime).getTime() : Date.now(),
      isMaker: trade.taker ? false : true,
      isTaker: trade.taker ? true : false,
      exchangeId: trade.id,
    };
  }

  private formatSymbol(symbol: string): string {
    // Binance使用不同的符号格式
    return symbol.replace('/', '').toUpperCase();
  }

  private async getAssetValueInUSD(asset: string, amount: number): Promise<number> {
    try {
      // 简单实现，实际应该从价格数据中获取
      if (asset === 'USDT' || asset === 'USD') return amount;
      
      const ticker = await this.getTicker(`${asset}/USDT`);
      return amount * ticker.last;
    } catch {
      return 0;
    }
  }
}