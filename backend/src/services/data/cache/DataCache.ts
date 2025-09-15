import { MarketData, RealTimeData, CacheConfig } from '../types';

export class DataCache {
  private cache: Map<string, { data: MarketData[]; timestamp: number; ttl: number }>;
  private realTimeCache: Map<string, { data: RealTimeData; timestamp: number }>;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    this.cache = new Map();
    this.realTimeCache = new Map();
    
    // Start cleanup interval
    if (this.config.enabled) {
      setInterval(() => this.cleanup(), 60000); // Cleanup every minute
    }
  }

  public getHistoricalData(symbol: string, interval: string, limit?: number): MarketData[] | null {
    if (!this.config.enabled) {
      return null;
    }

    const key = this.getHistoricalKey(symbol, interval);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    if (this.isExpired(cached.timestamp, cached.ttl)) {
      this.cache.delete(key);
      return null;
    }

    // Apply limit if specified
    let data = cached.data;
    if (limit && limit > 0) {
      data = data.slice(-limit);
    }

    return data;
  }

  public setHistoricalData(symbol: string, interval: string, data: MarketData[], ttl: number = 3600): void {
    if (!this.config.enabled) {
      return;
    }

    const key = this.getHistoricalKey(symbol, interval);
    
    // Check cache size limit
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data: [...data],
      timestamp: Date.now(),
      ttl: ttl * 1000 // Convert to milliseconds
    });
  }

  public getRealTimeData(symbol: string): RealTimeData | null {
    if (!this.config.enabled) {
      return null;
    }

    const cached = this.realTimeCache.get(symbol);
    if (!cached) {
      return null;
    }

    // Real-time data expires after 30 seconds
    if (this.isExpired(cached.timestamp, 30000)) {
      this.realTimeCache.delete(symbol);
      return null;
    }

    return cached.data;
  }

  public setRealTimeData(symbol: string, data: RealTimeData): void {
    if (!this.config.enabled) {
      return;
    }

    this.realTimeCache.set(symbol, {
      data: { ...data },
      timestamp: Date.now()
    });
  }

  public clear(): void {
    this.cache.clear();
    this.realTimeCache.clear();
  }

  public clearHistorical(symbol?: string, interval?: string): void {
    if (symbol && interval) {
      const key = this.getHistoricalKey(symbol, interval);
      this.cache.delete(key);
    } else if (symbol) {
      // Clear all intervals for a symbol
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${symbol}:`)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all historical data
      this.cache.clear();
    }
  }

  public clearRealTime(symbol?: string): void {
    if (symbol) {
      this.realTimeCache.delete(symbol);
    } else {
      this.realTimeCache.clear();
    }
  }

  public getStats(): {
    historicalCacheSize: number;
    realTimeCacheSize: number;
    hitRate: number;
  } {
    return {
      historicalCacheSize: this.cache.size,
      realTimeCacheSize: this.realTimeCache.size,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }

  private getHistoricalKey(symbol: string, interval: string): string {
    return `${symbol}:${interval}`;
  }

  private isExpired(timestamp: number, ttl: number): boolean {
    return Date.now() - timestamp > ttl;
  }

  private cleanup(): void {
    const now = Date.now();

    // Clean historical cache
    for (const [key, cached] of this.cache.entries()) {
      if (this.isExpired(cached.timestamp, cached.ttl)) {
        this.cache.delete(key);
      }
    }

    // Clean real-time cache
    for (const [key, cached] of this.realTimeCache.entries()) {
      if (this.isExpired(cached.timestamp, 30000)) {
        this.realTimeCache.delete(key);
      }
    }
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, cached] of this.cache.entries()) {
      if (cached.timestamp < oldestTime) {
        oldestTime = cached.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

// Singleton instance
export let dataCache: DataCache;

export function initDataCache(config: CacheConfig): void {
  dataCache = new DataCache(config);
}

export function getDataCache(): DataCache {
  if (!dataCache) {
    throw new Error('Data cache not initialized');
  }
  return dataCache;
}