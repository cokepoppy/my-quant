import { MarketData, ValidationResult } from '../types';

export class DataValidator {
  private static readonly PRICE_MIN = 0;
  private static readonly PRICE_MAX = 1000000;
  private static readonly VOLUME_MIN = 0;
  private static readonly VOLUME_MAX = 10000000000;

  public static validate(data: MarketData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let qualityScore = 100;

    // Validate symbol
    if (!data.symbol || typeof data.symbol !== 'string' || data.symbol.trim() === '') {
      errors.push('Invalid or missing symbol');
      qualityScore -= 20;
    }

    // Validate timestamp
    if (!data.timestamp || !(data.timestamp instanceof Date) || isNaN(data.timestamp.getTime())) {
      errors.push('Invalid or missing timestamp');
      qualityScore -= 20;
    } else if (data.timestamp > new Date()) {
      warnings.push('Timestamp is in the future');
      qualityScore -= 5;
    } else if (data.timestamp < new Date('2000-01-01')) {
      warnings.push('Timestamp is too old');
      qualityScore -= 5;
    }

    // Validate prices
    const prices = [data.open, data.high, data.low, data.close];
    
    prices.forEach((price, index) => {
      const priceNames = ['open', 'high', 'low', 'close'];
      const priceName = priceNames[index];
      
      if (typeof price !== 'number' || isNaN(price)) {
        errors.push(`Invalid ${priceName} price: ${price}`);
        qualityScore -= 15;
      } else if (price < this.PRICE_MIN || price > this.PRICE_MAX) {
        errors.push(`${priceName} price out of range: ${price}`);
        qualityScore -= 10;
      }
    });

    // Validate price relationships
    if (errors.length === 0) {
      if (data.high < Math.max(data.open, data.close)) {
        errors.push('High price is not the maximum price');
        qualityScore -= 15;
      }
      
      if (data.low > Math.min(data.open, data.close)) {
        errors.push('Low price is not the minimum price');
        qualityScore -= 15;
      }
      
      if (data.open <= 0 || data.close <= 0) {
        errors.push('Open or close price cannot be zero or negative');
        qualityScore -= 10;
      }
    }

    // Validate volume
    if (typeof data.volume !== 'number' || isNaN(data.volume)) {
      errors.push('Invalid volume');
      qualityScore -= 10;
    } else if (data.volume < this.VOLUME_MIN || data.volume > this.VOLUME_MAX) {
      warnings.push('Volume seems unusual');
      qualityScore -= 5;
    }

    // Validate source
    if (!data.source || typeof data.source !== 'string' || data.source.trim() === '') {
      errors.push('Invalid or missing source');
      qualityScore -= 10;
    }

    // Additional quality checks
    if (data.open === data.high && data.high === data.low && data.low === data.close) {
      warnings.push('All prices are the same - possible data issue');
      qualityScore -= 5;
    }

    // Check for unusual price movements
    if (errors.length === 0) {
      const priceChange = Math.abs(data.close - data.open);
      const priceChangePercent = (priceChange / data.open) * 100;
      
      if (priceChangePercent > 50) {
        warnings.push(`Large price movement detected: ${priceChangePercent.toFixed(2)}%`);
        qualityScore -= 3;
      }
    }

    // Ensure quality score is within bounds
    qualityScore = Math.max(0, Math.min(100, qualityScore));

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      qualityScore
    };
  }

  public static validateBatch(dataArray: MarketData[]): ValidationResult[] {
    return dataArray.map(data => this.validate(data));
  }

  public static filterValidData(dataArray: MarketData[]): MarketData[] {
    return dataArray.filter(data => this.validate(data).isValid);
  }

  public static getDataQualitySummary(dataArray: MarketData[]): {
    totalRecords: number;
    validRecords: number;
    averageQualityScore: number;
    errorSummary: { [key: string]: number };
    warningSummary: { [key: string]: number };
  } {
    const results = this.validateBatch(dataArray);
    
    const validRecords = results.filter(r => r.isValid).length;
    const averageQualityScore = results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length;
    
    const errorSummary: { [key: string]: number } = {};
    const warningSummary: { [key: string]: number } = {};
    
    results.forEach(result => {
      result.errors.forEach(error => {
        errorSummary[error] = (errorSummary[error] || 0) + 1;
      });
      
      result.warnings.forEach(warning => {
        warningSummary[warning] = (warningSummary[warning] || 0) + 1;
      });
    });

    return {
      totalRecords: dataArray.length,
      validRecords,
      averageQualityScore,
      errorSummary,
      warningSummary
    };
  }
}