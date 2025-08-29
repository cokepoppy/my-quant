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

export class OKXAdapter extends BaseExchange {
  private wsUrl: string;
  private restUrl: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private pingInterval: NodeJS.Timeout | null = null;
  private lastPingTime: number = 0;
  private loginRequestSent: boolean = false;

  constructor(config: ExchangeConfig) {
    super(config);
    this.wsUrl = config.testnet 
      ? 'wss://wspap.okx.com:8443/ws/v5/public' 
      : 'wss://ws.okx.com:8443/ws/v5/public';
    this.restUrl = config.testnet 
      ? 'https://www.okx.com' 
      : 'https://www.okx.com';
    
    // 初始化CCXT
    this.initializeCCXT();
  }

  private initializeCCXT(): void {
    const ccxt = require('ccxt');
    this.ccxt = new ccxt.okx({
      apiKey: this.config.apiKey,
      secret: this.config.apiSecret,
      passphrase: this.config.passphrase,
      sandbox: this.config.testnet,
      enableRateLimit: this.config.enableRateLimit,
      options: {
        defaultType: 'spot',
        adjustForTimeDifference: true,
      },
    });
  }

  // 基础信息
  async getExchangeInfo(): Promise<ExchangeInfo> {
    const info = await this.ccxt.fetchMarkets();
    return {
      id: 'okx',
      name: 'OKX',
      version: 'v5',
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
        www: 'https://www.okx.com',
        doc: 'https://www.okx.com/docs-v5/en/',
      },
      requiredCredentials: {
        apiKey: true,
        secret: true,
        passphrase: true,
      },
      rateLimits: this.ccxt.rateLimits,
      apiStandards: {
        version: 'v5',
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
      console.error('OKX connection test failed:', error);
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
        .filter((p: any) => Math.abs(p.contracts) > 0)
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
    const params: any = {};
    if (symbol) {
      params.symbol = this.formatSymbol(symbol);
    }
    
    const orders = await this.ccxt.fetchOrders(params);
    return orders.map(this.formatOrder.bind(this));
  }

  async getOpenOrders(symbol?: string): Promise<Order[]> {
    const params: any = {};
    if (symbol) {
      params.symbol = this.formatSymbol(symbol);
    }
    
    const orders = await this.ccxt.fetchOpenOrders(params);
    return orders.map(this.formatOrder.bind(this));
  }

  async getClosedOrders(symbol?: string, limit: number = 100): Promise<Order[]> {
    const params: any = { limit };
    if (symbol) {
      params.symbol = this.formatSymbol(symbol);
    }
    
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
      params.triggerPrice = orderRequest.stopPrice;
    }

    if (orderRequest.clientOrderId) {
      params.clientOrderId = orderRequest.clientOrderId;
    }

    if (orderRequest.takeProfit) {
      params.takeProfitPrice = orderRequest.takeProfit;
    }

    if (orderRequest.stopLoss) {
      params.stopLossPrice = orderRequest.stopLoss;
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
        this.ws = new WebSocket(this.wsUrl);
        
        this.ws.on('open', () => {
          console.log(`OKX WebSocket connected for ${this.config.id}`);
          this.startPingInterval();
          
          // 如果有API密钥，进行登录
          if (this.config.apiKey && this.config.apiSecret && this.config.passphrase) {
            this.loginWebSocket();
          }
          
          resolve();
        });

        this.ws.on('message', (data: any) => {
          this.handleWebSocketMessage(data);
        });

        this.ws.on('error', (error: any) => {
          console.error(`OKX WebSocket error for ${this.config.id}:`, error);
          this.handleWebSocketError(error);
        });

        this.ws.on('close', () => {
          console.log(`OKX WebSocket closed for ${this.config.id}`);
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
      
      if (message.event === 'login') {
        this.loginRequestSent = message.success;
        if (message.success) {
          console.log(`OKX WebSocket login successful for ${this.config.id}`);
        } else {
          console.error(`OKX WebSocket login failed for ${this.config.id}:`, message);
        }
      } else if (message.event === 'error') {
        console.error('OKX WebSocket error:', message);
      } else if (message.arg) {
        // 处理市场数据
        if (message.arg.channel === 'tickers') {
          this.handleTickerUpdate(message);
        } else if (message.arg.channel === 'trades') {
          this.handleTradeUpdate(message);
        } else if (message.arg.channel === 'books') {
          this.handleOrderBookUpdate(message);
        } else if (message.arg.channel === 'candle1m') {
          this.handleCandleUpdate(message);
        } else if (message.arg.channel === 'account' || message.arg.channel === 'positions') {
          this.handleAccountUpdate(message);
        } else if (message.arg.channel === 'orders') {
          this.handleOrderUpdate(message);
        }
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  private handleTickerUpdate(data: any): void {
    if (data.data && data.data.length > 0) {
      const ticker = data.data[0];
      const formattedTicker = {
        symbol: ticker.instId,
        price: parseFloat(ticker.last),
        bid: parseFloat(ticker.bidPx),
        ask: parseFloat(ticker.askPx),
        high: parseFloat(ticker.high24h),
        low: parseFloat(ticker.low24h),
        volume: parseFloat(ticker.vol24h),
        quoteVolume: parseFloat(ticker.volCcy24h),
        change: parseFloat(ticker.sodUtc8),
        changePercent: parseFloat(ticker.sodUtc8) / parseFloat(ticker.open24h) * 100,
        timestamp: Date.now(),
      };

      this.emitEvent('ticker_update', { symbol: ticker.instId, ticker: formattedTicker });
    }
  }

  private handleTradeUpdate(data: any): void {
    if (data.data && data.data.length > 0) {
      const trade = data.data[0];
      const formattedTrade = {
        id: trade.tradeId,
        symbol: trade.instId,
        price: parseFloat(trade.px),
        amount: parseFloat(trade.sz),
        timestamp: trade.ts,
        isMaker: trade.side === 'sell',
      };

      this.emitEvent('trade_update', { symbol: trade.instId, trade: formattedTrade });
    }
  }

  private handleOrderBookUpdate(data: any): void {
    if (data.data && data.data.length > 0) {
      const book = data.data[0];
      const orderbook = {
        symbol: book.instId,
        bids: book.bids.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])]),
        asks: book.asks.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])]),
        timestamp: Date.now(),
      };

      this.emitEvent('orderbook_update', { symbol: book.instId, orderbook });
    }
  }

  private handleCandleUpdate(data: any): void {
    if (data.data && data.data.length > 0) {
      const candle = data.data[0];
      const formattedCandle = {
        timestamp: candle.ts,
        datetime: new Date(candle.ts).toISOString(),
        symbol: candle.instId,
        open: parseFloat(candle.o),
        high: parseFloat(candle.h),
        low: parseFloat(candle.l),
        close: parseFloat(candle.c),
        volume: parseFloat(candle.vol),
      };

      this.emitEvent('kline_update', { symbol: candle.instId, candle: formattedCandle });
    }
  }

  private handleAccountUpdate(data: any): void {
    if (data.data && data.data.length > 0) {
      const accountData = data.data[0];
      
      if (accountData.balances) {
        // 处理余额更新
        const balances = accountData.balances.map((b: any) => ({
          asset: b.ccy,
          free: parseFloat(b.availBal),
          used: parseFloat(b.frozenBal),
          total: parseFloat(b.bal),
        }));

        this.emitEvent('balance_update', { balances });
      }
      
      if (accountData.positions) {
        // 处理持仓更新
        const positions = accountData.positions
          .filter((p: any) => Math.abs(p.pos) > 0)
          .map((p: any) => ({
            symbol: p.instId,
            side: p.pos > 0 ? 'long' : 'short',
            size: Math.abs(p.pos),
            entryPrice: parseFloat(p.avgPx),
            markPrice: parseFloat(p.markPx),
            pnl: parseFloat(p.upl),
            roe: parseFloat(p.uplRatio) * 100,
            leverage: parseFloat(p.lever),
            margin: parseFloat(p.margin),
            liquidationPrice: parseFloat(p.liqPx),
            status: 'open',
          }));

        this.emitEvent('position_update', { positions });
      }
    }
  }

  private handleOrderUpdate(data: any): void {
    if (data.data && data.data.length > 0) {
      const orderData = data.data[0];
      const order = {
        id: orderData.ordId,
        clientOrderId: orderData.clOrdId,
        symbol: orderData.instId,
        type: orderData.ordType.toLowerCase(),
        side: orderData.side.toLowerCase(),
        amount: parseFloat(orderData.sz),
        price: parseFloat(orderData.px),
        status: this.mapOKXOrderStatus(orderData.state),
        filled: parseFloat(orderData.accFillSz),
        remaining: parseFloat(orderData.sz) - parseFloat(orderData.accFillSz),
        average: parseFloat(orderData.avgPx),
        createTime: orderData.cTime,
        updateTime: orderData.uTime,
        exchangeId: orderData.ordId,
      };

      this.emitEvent('order_update', { order });
    }
  }

  private mapOKXOrderStatus(state: string): string {
    const statusMap: { [key: string]: string } = {
      'live': 'open',
      'partially_filled': 'open',
      'filled': 'filled',
      'canceled': 'cancelled',
      'untriggered': 'pending',
    };
    return statusMap[state] || state;
  }

  protected async subscribeToSymbol(symbol: string, options?: SubscriptionOptions): Promise<void> {
    const formattedSymbol = this.formatSymbol(symbol);
    
    // 订阅ticker数据
    await this.wsSubscribe({
      channel: 'tickers',
      instId: formattedSymbol,
    });
    
    // 订阅trade数据
    await this.wsSubscribe({
      channel: 'trades',
      instId: formattedSymbol,
    });
    
    // 订阅orderbook数据
    await this.wsSubscribe({
      channel: 'books',
      instId: formattedSymbol,
    });
    
    // 订阅K线数据
    const interval = options?.interval || '1m';
    await this.wsSubscribe({
      channel: `candle${interval}`,
      instId: formattedSymbol,
    });
  }

  protected async unsubscribeFromSymbol(symbol: string): Promise<void> {
    const formattedSymbol = this.formatSymbol(symbol);
    
    await this.wsUnsubscribe({
      channel: 'tickers',
      instId: formattedSymbol,
    });
    
    await this.wsUnsubscribe({
      channel: 'trades',
      instId: formattedSymbol,
    });
    
    await this.wsUnsubscribe({
      channel: 'books',
      instId: formattedSymbol,
    });
    
    await this.wsUnsubscribe({
      channel: 'candle1m',
      instId: formattedSymbol,
    });
  }

  private async wsSubscribe(params: any): Promise<void> {
    const message = JSON.stringify({
      op: 'subscribe',
      args: [params],
    });
    
    this.ws.send(message);
  }

  private async wsUnsubscribe(params: any): Promise<void> {
    const message = JSON.stringify({
      op: 'unsubscribe',
      args: [params],
    });
    
    this.ws.send(message);
  }

  private async loginWebSocket(): Promise<void> {
    const crypto = require('crypto');
    const timestamp = Date.now().toString();
    const sign = crypto
      .createHmac('sha256', this.config.apiSecret)
      .update(timestamp + 'GET' + '/users/self/verify')
      .digest('base64');

    const loginMessage = JSON.stringify({
      op: 'login',
      args: [{
        apiKey: this.config.apiKey,
        passphrase: this.config.passphrase,
        timestamp,
        sign,
      }],
    });

    this.ws.send(loginMessage);
    this.loginRequestSent = true;
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === 1) {
        this.lastPingTime = Date.now();
        this.ws.send(JSON.stringify({ op: 'ping' }));
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
    this.loginRequestSent = false;
    
    // 尝试重连
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect to OKX (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect().catch(console.error);
      }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1));
    } else {
      console.error('Max reconnection attempts reached for OKX');
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
    // OKX使用不同的符号格式
    return symbol.replace('/', '-').toUpperCase();
  }

  private async getAssetValueInUSD(asset: string, amount: number): Promise<number> {
    try {
      if (asset === 'USDT' || asset === 'USD') return amount;
      
      const ticker = await this.getTicker(`${asset}-USDT`);
      return amount * ticker.last;
    } catch {
      return 0;
    }
  }
}