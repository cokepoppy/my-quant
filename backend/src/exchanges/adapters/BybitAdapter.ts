import { BaseExchange } from '../base/BaseExchange';
import { ExchangeConfig } from '../types';
import ccxt from 'ccxt';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

export class BybitAdapter extends BaseExchange {
  private exchange: ccxt.bybit;

  constructor(config: ExchangeConfig) {
    super(config);
    
    console.log('BybitAdapter: Initializing with testnet:', config.testnet);
    console.log('BybitAdapter: Environment proxy http_proxy:', process.env.http_proxy);
    console.log('BybitAdapter: Environment proxy https_proxy:', process.env.https_proxy);
    
    this.exchange = new ccxt.bybit({
      apiKey: config.apiKey,
      secret: config.apiSecret,
      testnet: config.testnet,
      enableRateLimit: config.enableRateLimit,
      timeout: 30000,
      options: {
        defaultType: 'spot' // 可以根据需要改为 'linear', 'inverse' 等
      }
    });
    
    // Note: CCXT will automatically use environment variables (http_proxy, https_proxy) if set
    // Don't manually set proxy as it can cause URL concatenation issues
  }

  async testConnection(): Promise<boolean> {
    try {
      // 使用环境变量中的代理设置（如果存在）
      const proxyUrl = process.env.http_proxy || process.env.https_proxy;
      
      let axiosInstance;
      if (proxyUrl) {
        console.log('🔗 Using proxy:', proxyUrl);
        const proxyAgent = new HttpsProxyAgent(proxyUrl);
        
        axiosInstance = axios.create({
          httpsAgent: proxyAgent,
          timeout: 15000
        });
      } else {
        console.log('🔗 No proxy configured, using direct connection');
        axiosInstance = axios.create({
          proxy: false,
          timeout: 10000
        });
      }
      
      // 获取基础URL
      const baseUrl = this.exchange.testnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
      
      // 使用axios测试连接，避免CCXT的代理问题
      const response = await axiosInstance.get(`${baseUrl}/v5/market/time`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.retCode === 0) {
        console.log('✅ Server time test passed');
        console.log(`   Server time: ${new Date(response.data.result.timeSecond * 1000).toISOString()}`);
        
        // 简单的API测试，不使用CCXT的fetchBalance
        try {
          const balanceResponse = await this.exchange.fetchTime();
          console.log('✅ CCXT connection test passed');
        } catch (ccxtError) {
          console.log('⚠️  CCXT connection failed, but basic API works');
          console.log('   CCXT Error:', ccxtError.message);
        }
        
        return true;
      } else {
        console.error('❌ Server time test failed');
        console.error('   Error:', response.data.retMsg);
        return false;
      }
    } catch (error) {
      console.error('Bybit connection test failed:', error);
      return false;
    }
  }

  async connect(): Promise<boolean> {
    try {
      // Bybit不需要显式连接，testConnection就足够了
      return await this.testConnection();
    } catch (error) {
      console.error('Failed to connect to Bybit:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    // Bybit不需要显式断开连接
  }

  async getMarkets(): Promise<any[]> {
    try {
      const markets = await this.exchange.loadMarkets();
      return Object.values(markets);
    } catch (error) {
      console.error('Failed to fetch Bybit markets:', error);
      throw error;
    }
  }

  async getBalance(): Promise<any[]> {
    try {
      const balance = await this.exchange.fetchBalance();
      const result = [];
      
      for (const [asset, data] of Object.entries(balance.total)) {
        if (data > 0) {
          result.push({
            asset,
            free: balance.free[asset] || 0,
            used: balance.used[asset] || 0,
            total: data,
            valueInUSD: balance.total[asset] * (this.exchange.markets[`${asset}/USDT`]?.last || 1)
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error('Failed to fetch Bybit balance:', error);
      throw error;
    }
  }

  async getPositions(): Promise<any[]> {
    try {
      const positions = await this.exchange.fetchPositions();
      return positions.map(pos => ({
        symbol: pos.symbol,
        side: pos.side === 'long' ? 'long' : 'short',
        size: pos.contracts || pos.size,
        entryPrice: pos.entryPrice,
        markPrice: pos.markPrice,
        pnl: pos.unrealized,
        roe: pos.percentage,
        leverage: pos.leverage,
        margin: pos.initialMargin || pos.margin,
        liquidationPrice: pos.liquidationPrice,
        status: pos.side === 'long' && pos.size > 0 ? 'open' : pos.side === 'short' && pos.size > 0 ? 'open' : 'closed',
        exchangeId: pos.id
      }));
    } catch (error) {
      console.error('Failed to fetch Bybit positions:', error);
      throw error;
    }
  }

  async getOrders(symbol?: string): Promise<any[]> {
    try {
      const orders = await this.exchange.fetchOrders(symbol, undefined, 100);
      return orders.map(order => ({
        exchangeId: order.id,
        symbol: order.symbol,
        type: order.type,
        side: order.side,
        quantity: order.amount,
        price: order.price,
        stopPrice: order.stopPrice,
        status: order.status,
        filledQuantity: order.filled,
        averagePrice: order.average,
        commission: order.fee?.cost || 0,
        feeCurrency: order.fee?.currency,
        createTime: order.datetime,
        updateTime: order.lastTradeTimestamp ? new Date(order.lastTradeTimestamp).toISOString() : undefined,
        metadata: order
      }));
    } catch (error) {
      console.error('Failed to fetch Bybit orders:', error);
      throw error;
    }
  }

  async getOpenOrders(symbol?: string): Promise<any[]> {
    try {
      const orders = await this.exchange.fetchOpenOrders(symbol);
      return orders.map(order => ({
        exchangeId: order.id,
        symbol: order.symbol,
        type: order.type,
        side: order.side,
        quantity: order.amount,
        price: order.price,
        stopPrice: order.stopPrice,
        status: order.status,
        filledQuantity: order.filled,
        averagePrice: order.average,
        commission: order.fee?.cost || 0,
        feeCurrency: order.fee?.currency,
        createTime: order.datetime,
        updateTime: order.lastTradeTimestamp ? new Date(order.lastTradeTimestamp).toISOString() : undefined,
        metadata: order
      }));
    } catch (error) {
      console.error('Failed to fetch Bybit open orders:', error);
      throw error;
    }
  }

  async getClosedOrders(symbol?: string, limit?: number): Promise<any[]> {
    try {
      const orders = await this.exchange.fetchClosedOrders(symbol, undefined, limit || 50);
      return orders.map(order => ({
        exchangeId: order.id,
        symbol: order.symbol,
        type: order.type,
        side: order.side,
        quantity: order.amount,
        price: order.price,
        stopPrice: order.stopPrice,
        status: order.status,
        filledQuantity: order.filled,
        averagePrice: order.average,
        commission: order.fee?.cost || 0,
        feeCurrency: order.fee?.currency,
        createTime: order.datetime,
        updateTime: order.lastTradeTimestamp ? new Date(order.lastTradeTimestamp).toISOString() : undefined,
        metadata: order
      }));
    } catch (error) {
      console.error('Failed to fetch Bybit closed orders:', error);
      throw error;
    }
  }

  async getOrder(orderId: string): Promise<any> {
    try {
      const order = await this.exchange.fetchOrder(orderId);
      return {
        exchangeId: order.id,
        symbol: order.symbol,
        type: order.type,
        side: order.side,
        quantity: order.amount,
        price: order.price,
        stopPrice: order.stopPrice,
        status: order.status,
        filledQuantity: order.filled,
        averagePrice: order.average,
        commission: order.fee?.cost || 0,
        feeCurrency: order.fee?.currency,
        createTime: order.datetime,
        updateTime: order.lastTradeTimestamp ? new Date(order.lastTradeTimestamp).toISOString() : undefined,
        metadata: order
      };
    } catch (error) {
      console.error('Failed to fetch Bybit order:', error);
      throw error;
    }
  }

  async placeOrder(orderRequest: any): Promise<any> {
    try {
      const order = await this.exchange.createOrder(
        orderRequest.symbol,
        orderRequest.type,
        orderRequest.side,
        orderRequest.amount,
        orderRequest.price,
        orderRequest.params
      );
      
      return {
        exchangeId: order.id,
        symbol: order.symbol,
        type: order.type,
        side: order.side,
        quantity: order.amount,
        price: order.price,
        stopPrice: order.stopPrice,
        status: order.status,
        filledQuantity: order.filled,
        averagePrice: order.average,
        commission: order.fee?.cost || 0,
        feeCurrency: order.fee?.currency,
        createTime: order.datetime,
        updateTime: order.lastTradeTimestamp ? new Date(order.lastTradeTimestamp).toISOString() : undefined,
        metadata: order
      };
    } catch (error) {
      console.error('Failed to place Bybit order:', error);
      throw error;
    }
  }

  async cancelOrder(orderId: string, symbol?: string): Promise<boolean> {
    try {
      await this.exchange.cancelOrder(orderId, symbol);
      return true;
    } catch (error) {
      console.error('Failed to cancel Bybit order:', error);
      return false;
    }
  }

  async cancelAllOrders(symbol?: string): Promise<boolean> {
    try {
      await this.exchange.cancelAllOrders(symbol);
      return true;
    } catch (error) {
      console.error('Failed to cancel all Bybit orders:', error);
      return false;
    }
  }

  async getTrades(symbol?: string, limit?: number): Promise<any[]> {
    try {
      const trades = await this.exchange.fetchMyTrades(symbol, undefined, limit);
      return trades.map(trade => ({
        exchangeId: trade.id,
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.amount,
        price: trade.price,
        timestamp: trade.datetime,
        fee: trade.fee?.cost || 0,
        feeCurrency: trade.fee?.currency,
        metadata: trade
      }));
    } catch (error) {
      console.error('Failed to fetch Bybit trades:', error);
      throw error;
    }
  }

  async getTicker(symbol: string): Promise<any> {
    try {
      const ticker = await this.exchange.fetchTicker(symbol);
      return {
        symbol: ticker.symbol,
        bid: ticker.bid,
        ask: ticker.ask,
        last: ticker.last,
        high: ticker.high,
        low: ticker.low,
        volume: ticker.volume,
        timestamp: ticker.datetime,
        change: ticker.change,
        percentage: ticker.percentage,
        average: ticker.vwap,
        metadata: ticker
      };
    } catch (error) {
      console.error('Failed to fetch Bybit ticker:', error);
      throw error;
    }
  }

  async getTickers(symbols?: string[]): Promise<any[]> {
    try {
      const tickers = await this.exchange.fetchTickers(symbols);
      return Object.values(tickers).map(ticker => ({
        symbol: ticker.symbol,
        bid: ticker.bid,
        ask: ticker.ask,
        last: ticker.last,
        high: ticker.high,
        low: ticker.low,
        volume: ticker.volume,
        timestamp: ticker.datetime,
        change: ticker.change,
        percentage: ticker.percentage,
        average: ticker.vwap,
        metadata: ticker
      }));
    } catch (error) {
      console.error('Failed to fetch Bybit tickers:', error);
      throw error;
    }
  }

  async getOrderBook(symbol: string, limit?: number): Promise<any> {
    try {
      const orderbook = await this.exchange.fetchOrderBook(symbol, limit);
      return {
        symbol: orderbook.symbol,
        bids: orderbook.bids,
        asks: orderbook.asks,
        timestamp: orderbook.datetime,
        nonce: orderbook.nonce,
        metadata: orderbook
      };
    } catch (error) {
      console.error('Failed to fetch Bybit orderbook:', error);
      throw error;
    }
  }

  async getOHLCV(symbol: string, timeframe?: string, limit?: number): Promise<any[]> {
    try {
      const ohlcv = await this.exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
      return ohlcv.map(candle => ({
        timestamp: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5],
        metadata: candle
      }));
    } catch (error) {
      console.error('Failed to fetch Bybit OHLCV:', error);
      throw error;
    }
  }
}