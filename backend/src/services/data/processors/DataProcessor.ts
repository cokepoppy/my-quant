import { MarketData, DataProcessor as DataProcessorInterface } from '../types';
import { DataValidator } from '../validators/DataValidator';

export class DataProcessor implements DataProcessorInterface {
  public name: string;

  constructor(name: string = 'DefaultDataProcessor') {
    this.name = name;
  }

  public process(dataArray: MarketData[]): MarketData[] {
    // Step 1: Filter out invalid data
    const validData = DataValidator.filterValidData(dataArray);
    
    // Step 2: Sort by timestamp
    const sortedData = validData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Step 3: Process each data point
    const processedData = sortedData.map(data => this.transform(data));
    
    // Step 4: Remove duplicates
    const uniqueData = this.removeDuplicates(processedData);
    
    return uniqueData;
  }

  public validate(data: MarketData): boolean {
    return DataValidator.validate(data).isValid;
  }

  public transform(data: MarketData): MarketData {
    const transformed = { ...data };
    
    // Ensure timestamp is a Date object
    if (!(transformed.timestamp instanceof Date)) {
      transformed.timestamp = new Date(transformed.timestamp);
    }
    
    // Round prices to 8 decimal places (for crypto) or 4 decimal places (for stocks)
    const isCrypto = this.isCryptoSymbol(transformed.symbol);
    const precision = isCrypto ? 8 : 4;
    
    transformed.open = this.roundPrice(transformed.open, precision);
    transformed.high = this.roundPrice(transformed.high, precision);
    transformed.low = this.roundPrice(transformed.low, precision);
    transformed.close = this.roundPrice(transformed.close, precision);
    
    // Ensure volume is an integer
    transformed.volume = Math.round(transformed.volume);
    
    // Add quality score if not present
    if (!transformed.qualityScore) {
      const validation = DataValidator.validate(transformed);
      transformed.qualityScore = validation.qualityScore;
    }
    
    return transformed;
  }

  public removeDuplicates(dataArray: MarketData[]): MarketData[] {
    const seen = new Set<string>();
    const uniqueData: MarketData[] = [];
    
    for (const data of dataArray) {
      const key = `${data.symbol}:${data.timestamp.getTime()}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        uniqueData.push(data);
      }
    }
    
    return uniqueData;
  }

  public fillMissingData(dataArray: MarketData[]): MarketData[] {
    if (dataArray.length < 2) {
      return dataArray;
    }

    const result: MarketData[] = [];
    let lastValidData = dataArray[0];

    for (let i = 0; i < dataArray.length; i++) {
      const currentData = dataArray[i];
      const prevData = result[result.length - 1] || lastValidData;

      // Check for time gaps
      if (prevData && currentData.timestamp > prevData.timestamp) {
        const timeDiff = currentData.timestamp.getTime() - prevData.timestamp.getTime();
        const expectedInterval = this.getExpectedInterval(prevData, currentData);
        
        if (expectedInterval && timeDiff > expectedInterval * 1.5) {
          // Fill missing data points
          const filledData = this.interpolateData(prevData, currentData, expectedInterval);
          result.push(...filledData);
        }
      }

      result.push(currentData);
      lastValidData = currentData;
    }

    return result;
  }

  public smoothData(dataArray: MarketData[], windowSize: number = 5): MarketData[] {
    if (dataArray.length < windowSize) {
      return dataArray;
    }

    const result: MarketData[] = [];
    const halfWindow = Math.floor(windowSize / 2);

    for (let i = 0; i < dataArray.length; i++) {
      const start = Math.max(0, i - halfWindow);
      const end = Math.min(dataArray.length, i + halfWindow + 1);
      const window = dataArray.slice(start, end);

      if (window.length > 0) {
        const smoothed = this.calculateMovingAverage(window);
        result.push({
          ...dataArray[i],
          open: smoothed.open,
          high: smoothed.high,
          low: smoothed.low,
          close: smoothed.close
        });
      } else {
        result.push(dataArray[i]);
      }
    }

    return result;
  }

  public calculateTechnicalIndicators(dataArray: MarketData[]): MarketData[] {
    if (dataArray.length < 20) {
      return dataArray;
    }

    return dataArray.map((data, index) => {
      const indicators = this.calculateIndicators(dataArray, index);
      return {
        ...data,
        ...indicators
      };
    });
  }

  private roundPrice(price: number, precision: number): number {
    return Math.round(price * Math.pow(10, precision)) / Math.pow(10, precision);
  }

  private isCryptoSymbol(symbol: string): boolean {
    const cryptoSymbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'DOT', 'DOGE', 'AVAX'];
    return cryptoSymbols.some(crypto => symbol.includes(crypto));
  }

  private getExpectedInterval(prevData: MarketData, currentData: MarketData): number | null {
    // Common intervals in milliseconds
    const intervals = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    };

    // Try to detect interval from data
    const timeDiff = currentData.timestamp.getTime() - prevData.timestamp.getTime();
    
    for (const [interval, ms] of Object.entries(intervals)) {
      if (Math.abs(timeDiff - ms) < ms * 0.1) {
        return ms;
      }
    }
    
    return null;
  }

  private interpolateData(prevData: MarketData, currentData: MarketData, intervalMs: number): MarketData[] {
    const result: MarketData[] = [];
    const timeDiff = currentData.timestamp.getTime() - prevData.timestamp.getTime();
    const steps = Math.floor(timeDiff / intervalMs) - 1;
    
    for (let i = 1; i <= steps; i++) {
      const ratio = i / (steps + 1);
      const timestamp = new Date(prevData.timestamp.getTime() + (intervalMs * i));
      
      result.push({
        symbol: prevData.symbol,
        timestamp,
        open: this.interpolate(prevData.open, currentData.open, ratio),
        high: this.interpolate(prevData.high, currentData.high, ratio),
        low: this.interpolate(prevData.low, currentData.low, ratio),
        close: this.interpolate(prevData.close, currentData.close, ratio),
        volume: Math.round(this.interpolate(prevData.volume, currentData.volume, ratio)),
        source: prevData.source,
        qualityScore: 0.8 // Interpolated data has lower quality score
      });
    }
    
    return result;
  }

  private interpolate(start: number, end: number, ratio: number): number {
    return start + (end - start) * ratio;
  }

  private calculateMovingAverage(window: MarketData[]): {
    open: number;
    high: number;
    low: number;
    close: number;
  } {
    const sum = window.reduce((acc, data) => ({
      open: acc.open + data.open,
      high: acc.high + data.high,
      low: acc.low + data.low,
      close: acc.close + data.close
    }), { open: 0, high: 0, low: 0, close: 0 });

    const count = window.length;
    return {
      open: sum.open / count,
      high: sum.high / count,
      low: sum.low / count,
      close: sum.close / count
    };
  }

  private calculateIndicators(dataArray: MarketData[], index: number): any {
    const indicators: any = {};
    
    if (index >= 20) {
      // Simple Moving Average (20)
      const sma20 = this.calculateSMA(dataArray, index, 20);
      indicators.sma20 = sma20;
      
      // Exponential Moving Average (12)
      const ema12 = this.calculateEMA(dataArray, index, 12);
      indicators.ema12 = ema12;
      
      // Relative Strength Index (14)
      const rsi = this.calculateRSI(dataArray, index, 14);
      indicators.rsi = rsi;
    }
    
    return indicators;
  }

  private calculateSMA(dataArray: MarketData[], index: number, period: number): number {
    const sum = dataArray.slice(index - period + 1, index + 1)
      .reduce((acc, data) => acc + data.close, 0);
    return sum / period;
  }

  private calculateEMA(dataArray: MarketData[], index: number, period: number): number {
    if (index === 0) return dataArray[0].close;
    
    const multiplier = 2 / (period + 1);
    const emaPrev = this.calculateEMA(dataArray, index - 1, period);
    return dataArray[index].close * multiplier + emaPrev * (1 - multiplier);
  }

  private calculateRSI(dataArray: MarketData[], index: number, period: number): number {
    if (index < period) return 50;
    
    const gains: number[] = [];
    const losses: number[] = [];
    
    for (let i = index - period + 1; i <= index; i++) {
      const change = dataArray[i].close - dataArray[i - 1].close;
      if (change > 0) {
        gains.push(change);
        losses.push(0);
      } else {
        gains.push(0);
        losses.push(Math.abs(change));
      }
    }
    
    const avgGain = gains.reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    return rsi;
  }
}