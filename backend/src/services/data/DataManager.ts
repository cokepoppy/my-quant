import { EventEmitter } from 'events';
import { BaseDataSourceAdapter } from './adapters/BaseAdapter';
import { DataProcessor } from './processors/DataProcessor';
import { DataValidator } from './validators/DataValidator';
import { getDataCache } from './cache/DataCache';
import { 
  MarketData, 
  RealTimeData, 
  HistoricalDataRequest, 
  DataQuery,
  DataSourceConfig,
  DataSourceStatus 
} from './types';

export class DataManager extends EventEmitter {
  private adapters: Map<string, BaseDataSourceAdapter> = new Map();
  private processor: DataProcessor;
  private isInitialized: boolean = false;

  constructor() {
    super();
    this.processor = new DataProcessor();
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('Initializing data manager...');
    
    // Initialize all adapters
    for (const adapter of this.adapters.values()) {
      try {
        const connected = await adapter.connect();
        if (connected) {
          console.log(`Connected to data source: ${adapter.getName()}`);
        } else {
          console.error(`Failed to connect to data source: ${adapter.getName()}`);
        }
      } catch (error) {
        console.error(`Error connecting to data source ${adapter.getName()}:`, error);
      }
    }

    this.isInitialized = true;
    this.emit('initialized');
  }

  public async shutdown(): Promise<void> {
    console.log('Shutting down data manager...');
    
    // Disconnect all adapters
    const disconnectPromises = Array.from(this.adapters.values()).map(adapter => {
      return adapter.disconnect().catch(error => {
        console.error(`Error disconnecting from ${adapter.getName()}:`, error);
      });
    });

    await Promise.all(disconnectPromises);
    this.isInitialized = false;
    this.emit('shutdown');
  }

  public registerAdapter(adapter: BaseDataSourceAdapter): void {
    const name = adapter.getName();
    
    if (this.adapters.has(name)) {
      throw new Error(`Adapter ${name} is already registered`);
    }

    this.adapters.set(name, adapter);
    
    // Listen for adapter events
    adapter.on('error', (error) => {
      this.emit('adapterError', { adapter: name, error });
    });

    adapter.on('data', (data: RealTimeData) => {
      this.handleRealTimeData(name, data);
    });

    console.log(`Registered data adapter: ${name}`);
  }

  public unregisterAdapter(name: string): void {
    const adapter = this.adapters.get(name);
    if (adapter) {
      adapter.disconnect();
      this.adapters.delete(name);
      console.log(`Unregistered data adapter: ${name}`);
    }
  }

  public async fetchHistoricalData(request: HistoricalDataRequest): Promise<MarketData[]> {
    if (!this.isInitialized) {
      throw new Error('Data manager is not initialized');
    }

    // Try to get from cache first
    const cachedData = getDataCache().getHistoricalData(
      request.symbol, 
      request.interval,
      request.limit
    );

    if (cachedData) {
      console.log(`Cache hit for ${request.symbol} ${request.interval}`);
      return cachedData;
    }

    // Get data from adapters
    const adapterPromises = Array.from(this.adapters.values())
      .filter(adapter => adapter.isConnected())
      .map(adapter => 
        adapter.fetchHistoricalData(request).catch(error => {
          console.error(`Error fetching historical data from ${adapter.getName()}:`, error);
          return [] as MarketData[];
        })
      );

    const results = await Promise.all(adapterPromises);
    const allData = results.flat();

    // Process and validate data
    const processedData = this.processor.process(allData);
    
    // Cache the result
    getDataCache().setHistoricalData(request.symbol, request.interval, processedData);

    console.log(`Fetched ${processedData.length} historical records for ${request.symbol}`);
    return processedData;
  }

  public async fetchRealTimeData(symbols: string[]): Promise<RealTimeData[]> {
    if (!this.isInitialized) {
      throw new Error('Data manager is not initialized');
    }

    const adapterPromises = Array.from(this.adapters.values())
      .filter(adapter => adapter.isConnected())
      .map(adapter => 
        adapter.fetchRealTimeData(symbols).catch(error => {
          console.error(`Error fetching real-time data from ${adapter.getName()}:`, error);
          return [] as RealTimeData[];
        })
      );

    const results = await Promise.all(adapterPromises);
    const allData = results.flat();

    // Process and validate data
    const processedData = allData.map(data => {
      const validated = this.processor.transform(data);
      return validated as RealTimeData;
    });

    // Update cache
    processedData.forEach(data => {
      getDataCache().setRealTimeData(data.symbol, data);
    });

    return processedData;
  }

  public async subscribeToRealTimeData(symbols: string[], callback: (data: RealTimeData) => void): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Data manager is not initialized');
    }

    const subscriptionPromises = Array.from(this.adapters.values())
      .filter(adapter => adapter.isConnected())
      .map(adapter => 
        adapter.subscribe(symbols, callback).catch(error => {
          console.error(`Error subscribing to real-time data from ${adapter.getName()}:`, error);
        })
      );

    await Promise.all(subscriptionPromises);
    console.log(`Subscribed to real-time data for symbols: ${symbols.join(', ')}`);
  }

  public async unsubscribeFromRealTimeData(symbols: string[]): Promise<void> {
    const subscriptionPromises = Array.from(this.adapters.values())
      .filter(adapter => adapter.isConnected())
      .map(adapter => 
        adapter.unsubscribe(symbols).catch(error => {
          console.error(`Error unsubscribing from real-time data from ${adapter.getName()}:`, error);
        })
      );

    await Promise.all(subscriptionPromises);
    console.log(`Unsubscribed from real-time data for symbols: ${symbols.join(', ')}`);
  }

  public async queryData(query: DataQuery): Promise<MarketData[]> {
    if (!this.isInitialized) {
      throw new Error('Data manager is not initialized');
    }

    // For now, we'll implement a simple query interface
    // In a real implementation, this would query the database
    const request: HistoricalDataRequest = {
      symbol: query.symbol,
      startTime: query.startTime || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endTime: query.endTime || new Date(),
      interval: (query.interval as any) || '1d'
    };

    const data = await this.fetchHistoricalData(request);

    // Apply filters
    let filteredData = data;

    if (query.source) {
      filteredData = filteredData.filter(d => d.source === query.source);
    }

    if (query.limit) {
      filteredData = filteredData.slice(-query.limit);
    }

    return filteredData;
  }

  public getAdapterStatuses(): DataSourceStatus[] {
    return Array.from(this.adapters.values()).map(adapter => adapter.getStatus());
  }

  public getAdapter(name: string): DataSourceAdapter | undefined {
    return this.adapters.get(name);
  }

  public getAvailableAdapters(): string[] {
    return Array.from(this.adapters.keys());
  }

  public getDataQualityReport(symbols: string[]): {
    symbol: string;
    totalRecords: number;
    validRecords: number;
    averageQualityScore: number;
    errors: string[];
  }[] {
    return symbols.map(symbol => {
      // Get recent data for quality analysis
      const query: DataQuery = {
        symbol,
        limit: 100
      };

      try {
        const data = this.queryData(query);
        const summary = DataValidator.getDataQualitySummary(data);
        
        return {
          symbol,
          totalRecords: summary.totalRecords,
          validRecords: summary.validRecords,
          averageQualityScore: summary.averageQualityScore,
          errors: Object.keys(summary.errorSummary)
        };
      } catch (error) {
        return {
          symbol,
          totalRecords: 0,
          validRecords: 0,
          averageQualityScore: 0,
          errors: ['Failed to query data']
        };
      }
    });
  }

  private handleRealTimeData(adapterName: string, data: RealTimeData): void {
    // Process and validate real-time data
    const processedData = this.processor.transform(data);
    
    // Update cache
    getDataCache().setRealTimeData(data.symbol, processedData);
    
    // Emit real-time data event
    this.emit('realTimeData', {
      adapter: adapterName,
      data: processedData
    });
  }
}

// Singleton instance
export let dataManager: DataManager;

export function initDataManager(): DataManager {
  dataManager = new DataManager();
  return dataManager;
}

export function getDataManager(): DataManager {
  if (!dataManager) {
    throw new Error('Data manager not initialized');
  }
  return dataManager;
}