import { Router } from 'express';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { query, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Import new data services
import { 
  initDataManager, 
  getDataManager, 
  YahooFinanceAdapter,
  DataSourceConfig 
} from '../services/data';

const router = Router();
const prisma = new PrismaClient();

// Initialize data manager and adapters
let dataManagerInitialized = false;

async function ensureDataManagerInitialized() {
  if (!dataManagerInitialized) {
    const manager = initDataManager();
    
    // Initialize Yahoo Finance adapter
    const yahooConfig: DataSourceConfig = {
      name: 'Yahoo Finance',
      type: 'rest',
      rateLimit: 100,
      timeout: 10000,
      enabled: true
    };
    
    const yahooAdapter = new YahooFinanceAdapter(yahooConfig);
    manager.registerAdapter(yahooAdapter);
    
    await manager.initialize();
    dataManagerInitialized = true;
  }
}

// 配置 multer 用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'data');
    // 确保上传目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一的文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB 限制
  },
  fileFilter: (req, file, cb) => {
    // 检查文件类型
    const allowedTypes = ['.csv', '.json', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

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

// Get market data for single symbol
router.get('/market/:symbol', optionalAuth, [
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

    const { symbol } = req.params;
    const interval = req.query.interval as string || '1h';

    if (!supportedSymbols[symbol]) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported symbol'
      });
    }

    // Generate mock market data for the symbol
    const basePrice = getBasePrice(symbol);
    const currentPrice = basePrice + (Math.random() - 0.5) * basePrice * 0.02;
    const prevClose = basePrice;
    const change = currentPrice - prevClose;
    const changePercent = (change / prevClose) * 100;

    const marketData = {
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

// Get market data
router.get('/market', optionalAuth, [
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
router.get('/historical', optionalAuth, [
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
router.get('/indicators', optionalAuth, [
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
router.get('/symbols', optionalAuth, async (req: AuthRequest, res) => {
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
router.get('/overview', optionalAuth, async (req: AuthRequest, res) => {
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

// 文件上传路由
router.post('/upload', optionalAuth, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有选择文件'
      });
    }

    const { dataType = 'market', timeFormat = 'iso', dataSource = '', autoProcess = true } = req.body;
    
    // 创建导入记录
    const importRecord = await prisma.dataImport.create({
      data: {
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: path.extname(req.file.originalname),
        fileSize: req.file.size,
        dataType: dataType,
        timeFormat: timeFormat,
        dataSource: dataSource,
        status: 'pending',
        autoProcess: autoProcess,
        userId: req.user?.id || null
      }
    });

    // 如果需要自动处理，这里可以添加后台任务
    if (autoProcess) {
      // TODO: 添加后台任务处理文件
      console.log(`开始处理文件: ${req.file.path}`);
    }

    res.json({
      success: true,
      message: '文件上传成功',
      data: {
        id: importRecord.id,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        status: importRecord.status
      }
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({
      success: false,
      message: '文件上传失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 获取导入历史记录
router.get('/imports', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须大于0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('dataType').optional().isString().withMessage('数据类型必须为字符串'),
  query('status').optional().isString().withMessage('状态必须为字符串')
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '验证失败',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const dataType = req.query.dataType as string;
    const status = req.query.status as string;

    const whereClause: any = {};
    if (dataType) whereClause.dataType = dataType;
    if (status) whereClause.status = status;
    if (req.user?.id) whereClause.userId = req.user.id;

    const [imports, total] = await Promise.all([
      prisma.dataImport.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.dataImport.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      message: '获取导入历史成功',
      data: {
        imports,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取导入历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取导入历史失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 获取导入详情
router.get('/imports/:id', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const importRecord = await prisma.dataImport.findUnique({
      where: { id: parseInt(id) }
    });

    if (!importRecord) {
      return res.status(404).json({
        success: false,
        message: '导入记录不存在'
      });
    }

    // 检查权限
    if (req.user?.id && importRecord.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    res.json({
      success: true,
      message: '获取导入详情成功',
      data: importRecord
    });
  } catch (error) {
    console.error('获取导入详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取导入详情失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 删除导入记录
router.delete('/imports/:id', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const importRecord = await prisma.dataImport.findUnique({
      where: { id: parseInt(id) }
    });

    if (!importRecord) {
      return res.status(404).json({
        success: false,
        message: '导入记录不存在'
      });
    }

    // 检查权限
    if (req.user?.id && importRecord.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    // 删除文件
    if (fs.existsSync(importRecord.filePath)) {
      fs.unlinkSync(importRecord.filePath);
    }

    // 删除数据库记录
    await prisma.dataImport.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: '删除导入记录成功'
    });
  } catch (error) {
    console.error('删除导入记录失败:', error);
    res.status(500).json({
      success: false,
      message: '删除导入记录失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// New data source API endpoints

// Get data sources status
router.get('/sources/status', optionalAuth, async (req: AuthRequest, res) => {
  try {
    await ensureDataManagerInitialized();
    const manager = getDataManager();
    const statuses = manager.getAdapterStatuses();

    res.json({
      success: true,
      message: 'Data sources status retrieved successfully',
      data: statuses
    });
  } catch (error) {
    console.error('Error fetching data sources status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch data sources status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get real-time market data from external sources
router.get('/external/realtime', optionalAuth, [
  query('symbols').notEmpty().withMessage('Symbols are required'),
  query('source').optional().isIn(['yahoo', 'binance', 'alpha_vantage']).withMessage('Invalid source')
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

    await ensureDataManagerInitialized();
    const manager = getDataManager();
    
    const symbols = (req.query.symbols as string).split(',');
    const realTimeData = await manager.fetchRealTimeData(symbols);

    res.json({
      success: true,
      message: 'Real-time data retrieved successfully',
      data: realTimeData,
      count: realTimeData.length
    });
  } catch (error) {
    console.error('Error fetching real-time data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch real-time data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get historical data from external sources
router.post('/external/historical', optionalAuth, [
  body('symbol').notEmpty().withMessage('Symbol is required'),
  body('startTime').isISO8601().withMessage('Start time must be valid ISO8601 date'),
  body('endTime').isISO8601().withMessage('End time must be valid ISO8601 date'),
  body('interval').optional().isIn(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M']).withMessage('Invalid interval')
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

    await ensureDataManagerInitialized();
    const manager = getDataManager();
    
    const { symbol, startTime, endTime, interval = '1d' } = req.body;
    
    const historicalData = await manager.fetchHistoricalData({
      symbol,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      interval
    });

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

// Get data quality report
router.get('/quality/:symbol', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { symbol } = req.params;
    
    await ensureDataManagerInitialized();
    const manager = getDataManager();
    
    const qualityReport = manager.getDataQualityReport([symbol]);

    res.json({
      success: true,
      message: 'Data quality report retrieved successfully',
      data: qualityReport[0] || {
        symbol,
        totalRecords: 0,
        validRecords: 0,
        averageQualityScore: 0,
        errors: ['No data available']
      }
    });
  } catch (error) {
    console.error('Error generating data quality report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate data quality report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get supported symbols from external sources
router.get('/external/symbols', optionalAuth, [
  query('source').optional().isIn(['yahoo', 'binance']).withMessage('Invalid source')
], async (req: AuthRequest, res) => {
  try {
    const source = req.query.source as string || 'yahoo';
    
    let symbols: any[] = [];
    
    if (source === 'yahoo') {
      symbols = [
        ...YahooFinanceAdapter.POPULAR_STOCKS.map(symbol => ({
          symbol,
          name: symbol,
          type: 'stock',
          source: 'Yahoo Finance'
        })),
        ...YahooFinanceAdapter.POPULAR_CRYPTO.map(symbol => ({
          symbol,
          name: symbol,
          type: 'crypto',
          source: 'Yahoo Finance'
        })),
        ...YahooFinanceAdapter.INDICES.map(symbol => ({
          symbol,
          name: symbol,
          type: 'index',
          source: 'Yahoo Finance'
        }))
      ];
    }

    res.json({
      success: true,
      message: 'Supported symbols retrieved successfully',
      data: {
        source,
        symbols,
        count: symbols.length
      }
    });
  } catch (error) {
    console.error('Error fetching supported symbols:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supported symbols',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Quick data fetch for popular symbols
router.get('/external/quick/:symbol', optionalAuth, [
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
  query('interval').optional().isIn(['1d', '1h', '4h']).withMessage('Invalid interval')
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

    const { symbol } = req.params;
    const days = parseInt(req.query.days as string) || 30;
    const interval = req.query.interval as string || '1d';

    await ensureDataManagerInitialized();
    const manager = getDataManager();
    
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - days * 24 * 60 * 60 * 1000);

    const historicalData = await manager.fetchHistoricalData({
      symbol,
      startTime,
      endTime,
      interval
    });

    // Calculate basic statistics
    if (historicalData.length > 0) {
      const prices = historicalData.map(d => d.close);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const firstPrice = prices[0];
      const lastPrice = prices[prices.length - 1];
      const change = lastPrice - firstPrice;
      const changePercent = (change / firstPrice) * 100;

      res.json({
        success: true,
        message: 'Quick data fetch completed successfully',
        data: {
          symbol,
          interval,
          days,
          summary: {
            currentPrice: lastPrice,
            change,
            changePercent,
            minPrice,
            maxPrice,
            dataPoints: historicalData.length
          },
          historicalData: historicalData.slice(-50) // Return last 50 points
        }
      });
    } else {
      res.json({
        success: true,
        message: 'No data available for the specified parameters',
        data: {
          symbol,
          interval,
          days,
          summary: null,
          historicalData: []
        }
      });
    }
  } catch (error) {
    console.error('Error in quick data fetch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quick data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;