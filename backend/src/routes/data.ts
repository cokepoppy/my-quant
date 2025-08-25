import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { query, validationResult } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

// Supported symbols and their info
const supportedSymbols = {
  'BTCUSDT': { name: 'Bitcoin', base: 'BTC', quote: 'USDT', precision: 2 },
  'ETHUSDT': { name: 'Ethereum', base: 'ETH', quote: 'USDT', precision: 2 },
  'BNBUSDT': { name: 'Binance Coin', base: 'BNB', quote: 'USDT', precision: 2 },
  'ADAUSDT': { name: 'Cardano', base: 'ADA', quote: 'USDT', precision: 4 },
  'SOLUSDT': { name: 'Solana', base: 'SOL', quote: 'USDT', precision: 2 },
  'DOTUSDT': { name: 'Polkadot', base: 'DOT', quote: 'USDT', precision: 3 },
  '000001.SH': { name: '上证指数', base: '000001', quote: 'SH', precision: 2 },
  '399001.SZ': { name: '深证成指', base: '399001', quote: 'SZ', precision: 2 },
  '399006.SZ': { name: '创业板指', base: '399006', quote: 'SZ', precision: 2 }
};

// Get market data
router.get('/market', authenticate, [
  query('symbols').optional().isString().withMessage('Symbols must be a string'),
  query('interval').optional().isIn(['1m', '5m', '15m', '30m', '1h', '4h', '1d']).withMessage('Invalid interval')
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const symbols = req.query.symbols as string || 'BTCUSDT,ETHUSDT';
    const interval = req.query.interval as string || '1h';
    const symbolList = symbols.split(',');

    // Generate mock market data for requested symbols
    const marketData = {};
    
    for (const symbol of symbolList) {
      if (supportedSymbols[symbol]) {
        const basePrice = getBasePrice(symbol);
        const currentPrice = basePrice + (Math.random() - 0.5) * basePrice * 0.02;
        const prevClose = basePrice;
        const change = currentPrice - prevClose;
        const changePercent = (change / prevClose) * 100;

        marketData[symbol] = {
          symbol,
          ...supportedSymbols[symbol],
          price: currentPrice,
          prevClose,
          change,
          changePercent,
          volume: Math.floor(Math.random() * 1000000),
          high24h: currentPrice * 1.02,
          low24h: currentPrice * 0.98,
          timestamp: new Date(),
          interval
        };
      }
    }

    res.json({
      success: true,
      message: 'Market data retrieved successfully',
      data: marketData
    });
  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch market data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get historical data
router.get('/historical', authenticate, [
  query('symbol').notEmpty().withMessage('Symbol is required'),
  query('interval').optional().isIn(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w']).withMessage('Invalid interval'),
  query('startTime').optional().isISO8601().withMessage('Start time must be valid ISO8601 date'),
  query('endTime').optional().isISO8601().withMessage('End time must be valid ISO8601 date'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000')
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { symbol, interval = '1h', startTime, endTime, limit = 100 } = req.query;

    if (!supportedSymbols[symbol as string]) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported symbol'
      });
    }

    // Try to get data from database first
    const dbData = await getHistoricalDataFromDB(
      symbol as string,
      interval as string,
      startTime ? new Date(startTime as string) : undefined,
      endTime ? new Date(endTime as string) : undefined,
      limit as number
    );

    // If not enough data in database, generate mock data
    let historicalData = dbData;
    if (historicalData.length < (limit as number)) {
      historicalData = generateMockHistoricalData(
        symbol as string,
        interval as string,
        startTime ? new Date(startTime as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endTime ? new Date(endTime as string) : new Date(),
        limit as number
      );
    }

    res.json({
      success: true,
      message: 'Historical data retrieved successfully',
      data: {
        symbol,
        interval,
        data: historicalData,
        count: historicalData.length
      }
    });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch historical data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get technical indicators
router.get('/indicators', authenticate, [
  query('symbol').notEmpty().withMessage('Symbol is required'),
  query('indicators').optional().isString().withMessage('Indicators must be a string'),
  query('interval').optional().isIn(['1m', '5m', '15m', '30m', '1h', '4h', '1d']).withMessage('Invalid interval'),
  query('period').optional().isInt({ min: 1, max: 200 }).withMessage('Period must be between 1 and 200')
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { symbol, indicators = 'ma,rsi,macd', interval = '1h', period = 14 } = req.query;

    if (!supportedSymbols[symbol as string]) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported symbol'
      });
    }

    // Get historical data for calculation
    const historicalData = await getHistoricalDataFromDB(
      symbol as string,
      interval as string,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
      new Date(),
      200
    );

    if (historicalData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Not enough data to calculate indicators'
      });
    }

    const indicatorList = indicators.split(',');
    const calculatedIndicators = {};

    for (const indicator of indicatorList) {
      switch (indicator.trim().toLowerCase()) {
        case 'ma':
          calculatedIndicators['ma'] = calculateMA(historicalData, period as number);
          break;
        case 'ema':
          calculatedIndicators['ema'] = calculateEMA(historicalData, period as number);
          break;
        case 'rsi':
          calculatedIndicators['rsi'] = calculateRSI(historicalData, period as number);
          break;
        case 'macd':
          calculatedIndicators['macd'] = calculateMACD(historicalData);
          break;
        case 'bollinger':
          calculatedIndicators['bollinger'] = calculateBollingerBands(historicalData, period as number);
          break;
      }
    }

    res.json({
      success: true,
      message: 'Technical indicators calculated successfully',
      data: {
        symbol,
        interval,
        indicators: calculatedIndicators,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error calculating indicators:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate indicators',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get supported symbols
router.get('/symbols', authenticate, async (req: AuthRequest, res) => {
  try {
    const symbols = Object.keys(supportedSymbols).map(key => ({
      symbol: key,
      ...supportedSymbols[key]
    }));

    res.json({
      success: true,
      message: 'Supported symbols retrieved successfully',
      data: symbols
    });
  } catch (error) {
    console.error('Error fetching symbols:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch symbols',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get market overview
router.get('/overview', authenticate, async (req: AuthRequest, res) => {
  try {
    const overview = {};
    const symbolKeys = Object.keys(supportedSymbols);

    for (const symbol of symbolKeys) {
      const basePrice = getBasePrice(symbol);
      const currentPrice = basePrice + (Math.random() - 0.5) * basePrice * 0.01;
      const prevClose = basePrice;
      const change = currentPrice - prevClose;
      const changePercent = (change / prevClose) * 100;

      overview[symbol] = {
        symbol,
        name: supportedSymbols[symbol].name,
        price: currentPrice,
        change,
        changePercent,
        volume: Math.floor(Math.random() * 1000000),
        marketCap: Math.floor(currentPrice * Math.random() * 1000000000),
        timestamp: new Date()
      };
    }

    res.json({
      success: true,
      message: 'Market overview retrieved successfully',
      data: overview
    });
  } catch (error) {
    console.error('Error fetching market overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch market overview',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper functions
function getBasePrice(symbol: string): number {
  const prices: any = {
    'BTCUSDT': 45000,
    'ETHUSDT': 3200,
    'BNBUSDT': 320,
    'ADAUSDT': 0.6,
    'SOLUSDT': 100,
    'DOTUSDT': 7.5,
    '000001.SH': 3200,
    '399001.SZ': 10000,
    '399006.SZ': 2000
  };
  return prices[symbol] || 100;
}

async function getHistoricalDataFromDB(symbol: string, interval: string, startTime?: Date, endTime?: Date, limit?: number) {
  const whereClause: any = {
    symbol,
    interval
  };

  if (startTime) {
    whereClause.timestamp = { gte: startTime };
  }
  if (endTime) {
    whereClause.timestamp = { ...whereClause.timestamp, lte: endTime };
  }

  return await prisma.marketData.findMany({
    where: whereClause,
    orderBy: {
      timestamp: 'desc'
    },
    take: limit || 100
  });
}

function generateMockHistoricalData(symbol: string, interval: string, startTime: Date, endTime: Date, limit: number) {
  const data = [];
  const basePrice = getBasePrice(symbol);
  let currentPrice = basePrice;
  
  const intervalMs = getIntervalMs(interval);
  const currentTime = new Date(startTime);
  
  for (let i = 0; i < limit && currentTime <= endTime; i++) {
    const change = (Math.random() - 0.5) * basePrice * 0.005;
    currentPrice = Math.max(currentPrice + change, basePrice * 0.5);
    
    data.push({
      timestamp: new Date(currentTime),
      open: currentPrice,
      high: currentPrice + Math.random() * basePrice * 0.003,
      low: currentPrice - Math.random() * basePrice * 0.003,
      close: currentPrice,
      volume: Math.floor(Math.random() * 100000),
      interval
    });
    
    currentTime.setTime(currentTime.getTime() + intervalMs);
  }
  
  return data.reverse();
}

function getIntervalMs(interval: string): number {
  const intervals: any = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000
  };
  return intervals[interval] || 60 * 60 * 1000;
}

// Technical indicator calculations
function calculateMA(data: any[], period: number) {
  const result = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, item) => acc + item.close, 0);
    result.push(sum / period);
  }
  return result;
}

function calculateEMA(data: any[], period: number) {
  const result = [];
  const multiplier = 2 / (period + 1);
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push(data[i].close);
    } else {
      result.push((data[i].close - result[i - 1]) * multiplier + result[i - 1]);
    }
  }
  return result;
}

function calculateRSI(data: any[], period: number) {
  const result = [];
  const gains = [];
  const losses = [];
  
  for (let i = 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  for (let i = period - 1; i < gains.length; i++) {
    const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b) / period;
    const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b) / period;
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    result.push(rsi);
  }
  
  return result;
}

function calculateMACD(data: any[]) {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  const macdLine = ema12.map((val, idx) => val - ema26[idx]);
  const signalLine = calculateEMA(macdLine.map((val, idx) => ({ close: val })), 9);
  const histogram = macdLine.map((val, idx) => val - signalLine[idx]);
  
  return {
    macd: macdLine,
    signal: signalLine,
    histogram: histogram
  };
}

function calculateBollingerBands(data: any[], period: number) {
  const ma = calculateMA(data, period);
  const result = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const mean = ma[i - period + 1];
    const variance = slice.reduce((acc, item) => acc + Math.pow(item.close - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    result.push({
      upper: mean + 2 * stdDev,
      middle: mean,
      lower: mean - 2 * stdDev
    });
  }
  
  return result;
}

export default router;