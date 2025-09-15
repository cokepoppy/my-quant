import { EventEmitter } from 'events';
import { 
  DataSourceAdapter, 
  DataSourceConfig, 
  DataSourceStatus, 
  HistoricalDataRequest, 
  MarketData, 
  RealTimeData 
} from './types';

export abstract class BaseDataSourceAdapter extends EventEmitter implements DataSourceAdapter {
  protected config: DataSourceConfig;
  protected connected: boolean = false;
  protected lastError: Error | null = null;
  protected connectionTime: Date | null = null;
  protected requestCount: number = 0;
  protected errorCount: number = 0;
  protected lastResponseTime: number = 0;

  constructor(config: DataSourceConfig) {
    super();
    this.config = config;
  }

  abstract connect(): Promise<boolean>;
  abstract disconnect(): Promise<boolean>;
  abstract fetchHistoricalData(request: HistoricalDataRequest): Promise<MarketData[]>;
  abstract fetchRealTimeData(symbols: string[]): Promise<RealTimeData[]>;
  abstract subscribe(symbols: string[], callback: (data: RealTimeData) => void): Promise<void>;
  abstract unsubscribe(symbols: string[]): Promise<void>;

  public getName(): string {
    return this.config.name;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public getLastError(): Error | null {
    return this.lastError;
  }

  public getStatus(): DataSourceStatus {
    return {
      name: this.config.name,
      isConnected: this.connected,
      lastUpdate: this.connectionTime || new Date(),
      errorCount: this.errorCount,
      requestCount: this.requestCount,
      responseTime: this.lastResponseTime
    };
  }

  protected updateMetrics(responseTime: number, hasError: boolean = false): void {
    this.lastResponseTime = responseTime;
    this.requestCount++;
    
    if (hasError) {
      this.errorCount++;
      this.emit('error', new Error(`Request failed for ${this.config.name}`));
    }
  }

  protected handleError(error: Error): void {
    this.lastError = error;
    this.errorCount++;
    this.emit('error', error);
  }

  protected async rateLimit(): Promise<void> {
    if (this.config.rateLimit > 0) {
      const delay = 60000 / this.config.rateLimit; // Convert to milliseconds
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  protected async timeoutPromise<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  protected validateSymbol(symbol: string): boolean {
    return typeof symbol === 'string' && symbol.length > 0;
  }

  protected validateSymbols(symbols: string[]): boolean {
    return Array.isArray(symbols) && symbols.every(symbol => this.validateSymbol(symbol));
  }

  protected formatTimestamp(timestamp: Date | string | number): Date {
    if (timestamp instanceof Date) {
      return timestamp;
    }
    
    if (typeof timestamp === 'string') {
      return new Date(timestamp);
    }
    
    if (typeof timestamp === 'number') {
      return new Date(timestamp);
    }
    
    throw new Error('Invalid timestamp format');
  }

  protected logRequest(method: string, params: any): void {
    console.log(`[${this.config.name}] ${method}:`, params);
  }

  protected logResponse(method: string, data: any, responseTime: number): void {
    console.log(`[${this.config.name}] ${method} completed in ${responseTime}ms`);
  }
}