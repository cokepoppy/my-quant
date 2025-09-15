import axios from 'axios';
import { BaseDataSourceAdapter } from './BaseAdapter';
import { 
  MarketData, 
  RealTimeData, 
  HistoricalDataRequest, 
  DataSourceConfig 
} from '../types';

interface YahooFinanceResponse {
  chart: {
    result: Array<{
      meta: {
        symbol: string;
        currency: string;
        exchangeName: string;
        instrumentType: string;
        firstTradeDate: number;
        regularMarketTime: number;
        gmtoffset: number;
        timezone: string;
        exchangeTimezoneName: string;
        regularMarketPrice: number;
        chartPreviousClose: number;
        priceHint: number;
        currentTradingPeriod: {
          pre: any;
          regular: any;
          post: any;
        };
        dataGranularity: string;
        range: string;
        validRanges: string[];
      };
      timestamps: number[];
      indicators: {
        quote: Array<{
          open: number[];
          high: number[];
          low: number[];
          close: number[];
          volume: number[];
        }>;
        adjclose: Array<{
          adjclose: number[];
        }>;
      };
    }>;
    error: any;
  };
}

export class YahooFinanceAdapter extends BaseDataSourceAdapter {
  private baseUrl: string = 'https://query1.finance.yahoo.com';
  private realTimeUrl: string = 'https://query2.finance.yahoo.com';

  constructor(config: DataSourceConfig) {
    const defaultBaseUrl = 'https://query1.finance.yahoo.com';
    const finalConfig = {
      ...config,
      baseUrl: config.baseUrl || defaultBaseUrl,
      rateLimit: config.rateLimit || 100,
      timeout: config.timeout || 10000
    };
    super(finalConfig);
  }

  public async connect(): Promise<boolean> {
    try {
      // Test connection with a simple request
      await this.fetchHistoricalData({
        symbol: 'AAPL',
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endTime: new Date(),
        interval: '1d'
      });

      this.connected = true;
      this.connectionTime = new Date();
      this.emit('connected');
      return true;
    } catch (error) {
      this.handleError(error);
      return false;
    }
  }

  public async disconnect(): Promise<boolean> {
    this.connected = false;
    this.connectionTime = null;
    this.emit('disconnected');
    return true;
  }

  public async fetchHistoricalData(request: HistoricalDataRequest): Promise<MarketData[]> {
    if (!this.connected) {
      throw new Error('Adapter is not connected');
    }

    const startTime = Date.now();
    this.logRequest('fetchHistoricalData', request);

    try {
      await this.rateLimit();

      const url = this.buildHistoricalDataUrl(request);
      const response = await this.timeoutPromise(
        axios.get<YahooFinanceResponse>(url),
        this.config.timeout
      );

      const data = this.parseHistoricalDataResponse(response.data, request.symbol);
      const responseTime = Date.now() - startTime;
      
      this.updateMetrics(responseTime);
      this.logResponse('fetchHistoricalData', { count: data.length }, responseTime);

      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);
      this.handleError(error as Error);
      throw error;
    }
  }

  public async fetchRealTimeData(symbols: string[]): Promise<RealTimeData[]> {
    if (!this.connected) {
      throw new Error('Adapter is not connected');
    }

    const startTime = Date.now();
    this.logRequest('fetchRealTimeData', { symbols });

    try {
      await this.rateLimit();

      const promises = symbols.map(symbol => this.fetchSingleRealTimeData(symbol));
      const results = await Promise.all(promises);
      const responseTime = Date.now() - startTime;
      
      this.updateMetrics(responseTime);
      this.logResponse('fetchRealTimeData', { count: results.length }, responseTime);

      return results.filter(data => data !== null) as RealTimeData[];
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);
      this.handleError(error as Error);
      throw error;
    }
  }

  public async subscribe(symbols: string[], callback: (data: RealTimeData) => void): Promise<void> {
    // Yahoo Finance doesn't support WebSocket subscriptions
    // We'll implement polling instead
    console.warn('Yahoo Finance adapter does not support real-time subscriptions. Use polling instead.');
    
    // Start polling for real-time data
    this.startPolling(symbols, callback);
  }

  public async unsubscribe(symbols: string[]): Promise<void> {
    // Stop polling for these symbols
    this.stopPolling(symbols);
  }

  private buildHistoricalDataUrl(request: HistoricalDataRequest): string {
    const { symbol, startTime, endTime, interval } = request;
    
    // Convert interval to Yahoo Finance format
    const intervalMap: { [key: string]: string } = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '30m': '30m',
      '1h': '1h',
      '4h': '1h', // Yahoo Finance doesn't have 4h, use 1h instead
      '1d': '1d',
      '1w': '1wk',
      '1M': '1mo'
    };

    const yahooInterval = intervalMap[interval] || '1d';
    const period1 = Math.floor(startTime.getTime() / 1000);
    const period2 = Math.floor(endTime.getTime() / 1000);

    return `${this.baseUrl}/v8/finance/chart/${symbol}?` +
           `interval=${yahooInterval}&` +
           `period1=${period1}&` +
           `period2=${period2}&` +
           `includePrePost=true&` +
           `events=div%7Csplit%7Cearn&` +
           `corsDomain=finance.yahoo.com`;
  }

  private parseHistoricalDataResponse(response: YahooFinanceResponse, symbol: string): MarketData[] {
    if (!response.chart?.result || response.chart.result.length === 0) {
      return [];
    }

    const result = response.chart.result[0];
    const timestamps = result.timestamps;
    const quotes = result.indicators.quote[0];

    if (!timestamps || !quotes || timestamps.length === 0) {
      return [];
    }

    const data: MarketData[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = new Date(timestamps[i] * 1000);
      const open = quotes.open[i];
      const high = quotes.high[i];
      const low = quotes.low[i];
      const close = quotes.close[i];
      const volume = quotes.volume[i];

      // Skip invalid data points
      if (open === null || high === null || low === null || close === null) {
        continue;
      }

      data.push({
        symbol,
        timestamp,
        open,
        high,
        low,
        close,
        volume: volume || 0,
        source: this.config.name,
        qualityScore: 0.9 // Yahoo Finance data is generally reliable
      });
    }

    return data;
  }

  private async fetchSingleRealTimeData(symbol: string): Promise<RealTimeData | null> {
    try {
      const url = `${this.realTimeUrl}/v6/finance/quote?symbols=${symbol}`;
      const response = await this.timeoutPromise(
        axios.get(url),
        this.config.timeout
      );

      const quoteData = response.data.quoteResponse?.result?.[0];
      if (!quoteData) {
        return null;
      }

      return {
        symbol: quoteData.symbol,
        timestamp: new Date(quoteData.regularMarketTime * 1000),
        open: quoteData.regularMarketOpen || quoteData.preMarketPrice || 0,
        high: quoteData.regularMarketDayHigh || 0,
        low: quoteData.regularMarketDayLow || 0,
        close: quoteData.regularMarketPrice || 0,
        volume: quoteData.regularMarketVolume || 0,
        source: this.config.name,
        qualityScore: 0.85,
        bid: quoteData.bid,
        ask: quoteData.ask,
        lastSize: quoteData.lastSize
      };
    } catch (error) {
      console.error(`Error fetching real-time data for ${symbol}:`, error);
      return null;
    }
  }

  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

  private startPolling(symbols: string[], callback: (data: RealTimeData) => void): void {
    symbols.forEach(symbol => {
      if (this.pollingIntervals.has(symbol)) {
        return; // Already polling
      }

      const interval = setInterval(async () => {
        try {
          const data = await this.fetchSingleRealTimeData(symbol);
          if (data) {
            callback(data);
          }
        } catch (error) {
          console.error(`Error polling real-time data for ${symbol}:`, error);
        }
      }, 5000); // Poll every 5 seconds

      this.pollingIntervals.set(symbol, interval);
    });
  }

  private stopPolling(symbols: string[]): void {
    symbols.forEach(symbol => {
      const interval = this.pollingIntervals.get(symbol);
      if (interval) {
        clearInterval(interval);
        this.pollingIntervals.delete(symbol);
      }
    });
  }

  // Helper methods for popular symbols
  public async getStockData(symbol: string, days: number = 30): Promise<MarketData[]> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - days * 24 * 60 * 60 * 1000);

    return this.fetchHistoricalData({
      symbol,
      startTime,
      endTime,
      interval: '1d'
    });
  }

  public async getIntradayData(symbol: string, interval: '1m' | '5m' | '15m' | '30m' | '1h' = '5m', days: number = 7): Promise<MarketData[]> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - days * 24 * 60 * 60 * 1000);

    return this.fetchHistoricalData({
      symbol,
      startTime,
      endTime,
      interval
    });
  }

  // Popular stock symbols
  public static readonly POPULAR_STOCKS = [
    'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'JNJ', 'V'
  ];

  // Popular crypto symbols
  public static readonly POPULAR_CRYPTO = [
    'BTC-USD', 'ETH-USD', 'BNB-USD', 'SOL-USD', 'ADA-USD', 'DOT-USD', 'DOGE-USD', 'AVAX-USD'
  ];

  // Market indices
  public static readonly INDICES = [
    '^GSPC',  // S&P 500
    '^DJI',   // Dow Jones
    '^IXIC',  // NASDAQ
    '^VIX',   // VIX
    '^FTSE',  // FTSE 100
    '^N225'   // Nikkei 225
  ];
}