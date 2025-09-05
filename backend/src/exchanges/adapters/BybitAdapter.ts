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
    
    const exchangeConfig: any = {
      apiKey: config.apiKey,
      secret: config.apiSecret,
      testnet: config.testnet,
      enableRateLimit: config.enableRateLimit,
      timeout: 30000,
      options: {
        defaultType: 'spot', // 可以根据需要改为 'linear', 'inverse' 等
        // 启用详细的CCXT日志
        verbose: true,
        // 自定义日志记录器
        log: (message: string) => {
          console.log('🔍 CCXT Log:', message);
        },
        // 自定义请求日志
        fetchHeaders: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    };
    
    // Configure proxy using agent only (this works!)
    const proxyUrl = process.env.http_proxy || process.env.https_proxy;
    if (proxyUrl) {
      console.log('BybitAdapter: Using proxy agent:', proxyUrl);
      const HttpsProxyAgent = require('https-proxy-agent');
      exchangeConfig.agent = new HttpsProxyAgent(proxyUrl);
    }
    
    this.exchange = new ccxt.bybit(exchangeConfig);
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('🔗 Testing Bybit connection...');
      
      // First test: Basic API connectivity with axios
      const proxyUrl = process.env.http_proxy || process.env.https_proxy;
      const baseUrl = this.exchange.testnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
      
      console.log(`🔗 Testing basic connectivity to: ${baseUrl}/v5/market/time`);
      
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
      
      // Test basic connectivity
      const response = await axiosInstance.get(`${baseUrl}/v5/market/time`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.retCode !== 0) {
        console.error('❌ Basic API test failed:', response.data.retMsg);
        return false;
      }
      
      console.log('✅ Basic connectivity test passed');
      console.log(`   Server time: ${new Date(response.data.result.timeSecond * 1000).toISOString()}`);
      
      // Test CCXT connectivity
      console.log('🔗 Testing CCXT connectivity...');
      
      let ccxtConnected = false;
      
      try {
        console.log('📡 Calling this.exchange.fetchTime()...');
        const time = await this.exchange.fetchTime();
        console.log('✅ CCXT connection test passed:', new Date(time).toISOString());
        ccxtConnected = true;
      } catch (ccxtError) {
        console.log('⚠️  CCXT connection failed:', ccxtError.message);
        
        // Try without proxy if proxy is configured
        const proxyUrl = process.env.http_proxy || process.env.https_proxy;
        if (proxyUrl) {
          console.log('\n🔍 Trying without proxy...');
          try {
            console.log('   🔄 Removing proxy configuration...');
            const originalProxy = this.exchange.proxy;
            const originalOptions = { ...this.exchange.options };
            
            this.exchange.proxy = undefined;
            delete this.exchange.options.proxy;
            delete this.exchange.options.httpsProxy;
            delete this.exchange.options.httpProxy;
            
            console.log('   📡 Calling this.exchange.fetchTime() without proxy...');
            const time2 = await this.exchange.fetchTime();
            console.log('✅ CCXT connection test passed (without proxy):', new Date(time2).toISOString());
            ccxtConnected = true;
            
            // Keep the no-proxy configuration
            console.log('   💾 Keeping no-proxy configuration for this session');
          } catch (fallbackError) {
            console.log('❌ CCXT without proxy also failed:', fallbackError.message);
            // We'll continue with basic connectivity working
            ccxtConnected = true;
          }
        } else {
          // No proxy configured, but CCXT failed - continue with basic connectivity
          ccxtConnected = true;
        }
      }
      
      // Third test: Account access (if credentials are provided and CCXT connected)
      if (ccxtConnected && this.exchange.apiKey && this.exchange.secret) {
        try {
          console.log('🔗 Testing account access...');
          await this.exchange.fetchBalance();
          console.log('✅ Account access test passed');
        } catch (balanceError) {
          console.log('⚠️  Account access failed, but basic connectivity works');
          console.log('   Balance Error:', balanceError.message);
          // Don't fail the connection test for balance issues
        }
      }
      
      return ccxtConnected;
    } catch (error) {
      console.error('❌ Bybit connection test failed:', error.message);
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', error.response.data);
      }
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
      console.log('🔍 Fetching Bybit Unified Trading Account balance...');
      
      // Try multiple approaches to get the unified account balance
      let response;
      
      // Approach 1: Try the direct API approach (most reliable)
      try {
        console.log('📡 Approach 1: Direct API call to /v5/account/wallet-balance');
        
        const proxyUrl = process.env.http_proxy || process.env.https_proxy;
        const baseUrl = this.exchange.testnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
        
        // Create axios instance with proxy
        let axiosInstance;
        if (proxyUrl) {
          const HttpsProxyAgent = require('https-proxy-agent');
          const proxyAgent = new HttpsProxyAgent(proxyUrl);
          axiosInstance = axios.create({
            httpsAgent: proxyAgent,
            timeout: 15000,
            headers: {
              'Content-Type': 'application/json',
              'X-API-KEY': this.exchange.apiKey
            }
          });
        } else {
          axiosInstance = axios.create({
            timeout: 15000,
            headers: {
              'Content-Type': 'application/json',
              'X-API-KEY': this.exchange.apiKey
            }
          });
        }
        
        // Generate signature for private API call using Node crypto (most reliable)
        const crypto = require('crypto');
        const timestamp = Date.now();
        const recv_window = 5000;
        const params = { accountType: 'UNIFIED', recv_window };
        const paramString = new URLSearchParams(params).toString();
        const path = '/v5/account/wallet-balance';
        const queryString = paramString ? `${path}?${paramString}` : path;
        const signString = timestamp + 'GET' + queryString;
        const signature = crypto.createHmac('sha256', this.exchange.secret).update(signString, 'utf8').digest('hex');
        
        const apiResponse = await axiosInstance.get(`${baseUrl}/v5/account/wallet-balance`, {
          params: {
            accountType: 'UNIFIED',
            recv_window: recv_window
          },
          headers: {
            'X-API-KEY': this.exchange.apiKey,
            'X-TIMESTAMP': timestamp.toString(),
            'X-RECV-WINDOW': recv_window.toString(),
            'X-SIGNATURE': signature
          }
        });
        
        if (apiResponse.data.retCode === 0) {
          response = apiResponse.data;
          console.log('✅ Direct API approach successful');
        } else {
          throw new Error(`API Error: ${apiResponse.data.retMsg}`);
        }
        
      } catch (error) {
        console.log('⚠️  Direct API approach failed:', error.message);
        
        // Approach 2: Try CCXT fetch method
        try {
          console.log('📡 Approach 2: CCXT fetch method');
          response = await this.exchange.fetch('GET', '/v5/account/wallet-balance', {
            accountType: 'UNIFIED'
          });
          console.log('✅ Using CCXT fetch approach');
        } catch (error2) {
          console.log('⚠️  CCXT fetch approach failed:', error2.message);
          
          // Approach 3: Try the default fetchBalance with unified options
          try {
            console.log('📡 Approach 3: CCXT fetchBalance with unified type');
            response = await this.exchange.fetchBalance({
              type: 'unified'
            });
            console.log('✅ Using fetchBalance with unified type');
          } catch (error3) {
            console.log('⚠️  Unified fetchBalance failed:', error3.message);
            
            // Approach 4: Try default fetchBalance
            try {
              console.log('📡 Approach 4: Default fetchBalance');
              response = await this.exchange.fetchBalance();
              console.log('✅ Using default fetchBalance');
            } catch (error4) {
              console.log('❌ All balance fetching approaches failed');
              throw new Error('All balance fetching methods failed. Last error: ' + error4.message);
            }
          }
        }
      }
      
      console.log('📊 Balance response type:', typeof response);
      console.log('📊 Balance response keys:', Object.keys(response || {}));
      
      const result = [];
      
      // Handle different response formats
      if (response && response.retCode !== undefined) {
        // Bybit V5 API response format
        if (response.retCode !== 0) {
          throw new Error(`Bybit API Error: ${response.retMsg}`);
        }
        
        const balanceData = response.result;
        if (balanceData && balanceData.list && balanceData.list.length > 0) {
          const account = balanceData.list[0];
          
          if (account.coin && account.coin.length > 0) {
            for (const coin of account.coin) {
              const walletBalance = parseFloat(coin.walletBalance || 0);
              const availableToWithdraw = parseFloat(coin.availableToWithdraw || 0);
              const usdValue = parseFloat(coin.usdValue || 0);
              
              if (walletBalance > 0 || usdValue > 0) {
                result.push({
                  asset: coin.coin,
                  free: availableToWithdraw,
                  used: walletBalance - availableToWithdraw,
                  total: walletBalance,
                  valueInUSD: usdValue
                });
              }
            }
          }
          
          console.log(`✅ Successfully fetched balance for ${account.coin?.length || 0} assets`);
          console.log(`   Total Equity: ${account.totalEquity || '0.00'}`);
          console.log(`   Available Balance: ${account.availableBalance || '0.00'}`);
        }
      } else if (response && response.total !== undefined) {
        // CCXT standard balance format
        console.log('📊 Processing CCXT standard balance format');
        
        for (const [asset, data] of Object.entries(response.total)) {
          if (data > 0) {
            result.push({
              asset,
              free: response.free[asset] || 0,
              used: response.used[asset] || 0,
              total: data,
              valueInUSD: data * (this.exchange.markets[`${asset}/USDT`]?.last || 1)
            });
          }
        }
        
        console.log(`✅ Successfully fetched balance for ${result.length} assets (CCXT format)`);
      } else {
        console.log('⚠️  Unknown response format:', response);
        throw new Error('Unknown balance response format');
      }
      
      return result;
    } catch (error) {
      console.error('Failed to fetch Bybit balance:', error);
      console.error('Error details:', error.message);
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
      console.log('🔧 BybitAdapter: Creating order...');
      console.log('📤 CCXT createOrder parameters:');
      console.log('  - Symbol:', orderRequest.symbol);
      console.log('  - Type:', orderRequest.type);
      console.log('  - Side:', orderRequest.side);
      console.log('  - Amount:', orderRequest.amount);
      console.log('  - Price:', orderRequest.price);
      console.log('  - Params:', JSON.stringify(orderRequest.params, null, 2));
      
      const startTime = Date.now();
      const order = await this.exchange.createOrder(
        orderRequest.symbol,
        orderRequest.type,
        orderRequest.side,
        orderRequest.amount,
        orderRequest.price,
        orderRequest.params
      );
      const endTime = Date.now();
      
      console.log('✅ BybitAdapter: Order created successfully!');
      console.log('⏱️  CCXT createOrder duration:', endTime - startTime, 'ms');
      console.log('📥 Raw CCXT response:');
      console.log('  - Order ID:', order.id);
      console.log('  - Symbol:', order.symbol);
      console.log('  - Type:', order.type);
      console.log('  - Side:', order.side);
      console.log('  - Amount:', order.amount);
      console.log('  - Price:', order.price);
      console.log('  - Status:', order.status);
      console.log('  - Filled:', order.filled);
      console.log('  - Average:', order.average);
      console.log('  - Fee:', order.fee);
      console.log('  - Datetime:', order.datetime);
      console.log('  - Last Trade Timestamp:', order.lastTradeTimestamp);
      console.log('  - Full CCXT order object:', JSON.stringify(order, null, 2));
      
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
      console.error('❌ BybitAdapter: Failed to place order!');
      console.error('📊 Error details:');
      console.error('  - Error message:', error.message);
      console.error('  - Error code:', error.code);
      console.error('  - Error type:', error.constructor.name);
      if (error.response) {
        console.error('  - HTTP Status:', error.response.status);
        console.error('  - HTTP Headers:', JSON.stringify(error.response.headers, null, 2));
        console.error('  - Response Body:', JSON.stringify(error.response.data, null, 2));
      }
      if (error.request) {
        console.error('  - Request details:', error.request);
      }
      console.error('  - Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
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
      console.log('📈 BybitAdapter: Fetching ticker...');
      console.log('📤 Request details:');
      console.log('  - Symbol:', symbol);
      console.log('  - Exchange ID:', this.config.id);
      console.log('  - Testnet:', this.config.testnet);
      
      const startTime = Date.now();
      const ticker = await this.exchange.fetchTicker(symbol);
      const endTime = Date.now();
      
      console.log('✅ BybitAdapter: Ticker fetched successfully!');
      console.log('⏱️  fetchTicker duration:', endTime - startTime, 'ms');
      console.log('📥 Raw CCXT ticker response:');
      console.log('  - Symbol:', ticker.symbol);
      console.log('  - Bid:', ticker.bid);
      console.log('  - Ask:', ticker.ask);
      console.log('  - Last:', ticker.last);
      console.log('  - High:', ticker.high);
      console.log('  - Low:', ticker.low);
      console.log('  - Volume:', ticker.volume);
      console.log('  - Timestamp:', ticker.timestamp);
      console.log('  - Datetime:', ticker.datetime);
      console.log('  - Change:', ticker.change);
      console.log('  - Percentage:', ticker.percentage);
      console.log('  - Average:', ticker.average);
      console.log('  - Vwap:', ticker.vwap);
      console.log('  - Open:', ticker.open);
      console.log('  - Close:', ticker.close);
      console.log('  - Previous Close:', ticker.previousClose);
      console.log('  - Full CCXT ticker object:', JSON.stringify(ticker, null, 2));
      
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