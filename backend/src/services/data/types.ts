export interface MarketData {
  symbol: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  source: string;
  qualityScore?: number;
}

export interface RealTimeData extends MarketData {
  bid?: number;
  ask?: number;
  lastSize?: number;
}

export interface HistoricalDataRequest {
  symbol: string;
  startTime: Date;
  endTime: Date;
  interval: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';
}

export interface DataSourceConfig {
  name: string;
  type: 'rest' | 'websocket' | 'file';
  apiKey?: string;
  baseUrl?: string;
  rateLimit: number; // requests per minute
  timeout: number; // milliseconds
  enabled: boolean;
}

export interface DataSourceAdapter {
  name: string;
  config: DataSourceConfig;
  connect(): Promise<boolean>;
  disconnect(): Promise<boolean>;
  fetchHistoricalData(request: HistoricalDataRequest): Promise<MarketData[]>;
  fetchRealTimeData(symbols: string[]): Promise<RealTimeData[]>;
  subscribe(symbols: string[], callback: (data: RealTimeData) => void): Promise<void>;
  unsubscribe(symbols: string[]): Promise<void>;
  isConnected(): boolean;
  getLastError(): Error | null;
  getStatus(): DataSourceStatus;
}

export interface DataSourceStatus {
  name: string;
  isConnected: boolean;
  lastUpdate: Date;
  errorCount: number;
  requestCount: number;
  responseTime: number;
}

export interface DataProcessor {
  name: string;
  process(data: MarketData[]): MarketData[];
  validate(data: MarketData): boolean;
  transform(data: MarketData): MarketData;
}

export interface DataValidator {
  validate(data: MarketData): ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  qualityScore: number;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // time to live in seconds
  maxSize: number; // maximum number of cached items
}

export interface DataQuery {
  symbol: string;
  startTime?: Date;
  endTime?: Date;
  interval?: string;
  limit?: number;
  source?: string;
}