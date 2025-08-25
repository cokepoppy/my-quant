import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all strategies for current user
router.get('/', [
  authenticate,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().custom((value) => {
    if (!value || value === '') return true;
    return ['draft', 'active', 'inactive', 'archived'].includes(value);
  }),
  query('type').optional().custom((value) => {
    if (!value || value === '') return true;
    return ['technical', 'statistical', 'ml', 'high_frequency'].includes(value);
  })
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  const { status, type } = req.query;

  const where: any = {
    userId: req.user!.id
  };

  if (status && status !== '') where.status = status;
  if (type && type !== '') where.type = type;

  const [strategies, total] = await Promise.all([
    prisma.strategy.findMany({
      where,
      include: {
        _count: {
          select: {
            backtests: true,
            trades: true
          }
        }
      },
      skip: offset,
      take: limit,
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.strategy.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      strategies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// Get strategy by ID
router.get('/:id', [
  authenticate
], asyncHandler(async (req: AuthRequest, res) => {
  const strategy = await prisma.strategy.findFirst({
    where: {
      id: req.params.id,
      OR: [
        { userId: req.user!.id },
        { user: { role: 'admin' } }
      ]
    },
    include: {
      user: {
        select: {
          id: true,
          username: true
        }
      },
      backtests: {
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  });

  if (!strategy) {
    throw createError('Strategy not found', 404);
  }

  res.json({
    success: true,
    data: { strategy }
  });
}));

// Create new strategy
router.post('/', [
  authenticate,
  body('name').isLength({ min: 1, max: 100 }).trim(),
  body('description').optional().isLength({ max: 500 }),
  body('code').isLength({ min: 1 }),
  body('type').isIn(['technical', 'statistical', 'ml', 'high_frequency']),
  body('parameters').optional().isObject()
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { name, description, code, type, parameters } = req.body;

  const strategy = await prisma.strategy.create({
    data: {
      name,
      description,
      code,
      type,
      parameters,
      userId: req.user!.id
    }
  });

  res.status(201).json({
    success: true,
    message: 'Strategy created successfully',
    data: { strategy }
  });
}));

// Update strategy
router.put('/:id', [
  authenticate,
  body('name').optional().isLength({ min: 1, max: 100 }).trim(),
  body('description').optional().isLength({ max: 500 }),
  body('code').optional().isLength({ min: 1 }),
  body('type').optional().isIn(['technical', 'statistical', 'ml', 'high_frequency']),
  body('status').optional().isIn(['draft', 'active', 'inactive', 'archived']),
  body('parameters').optional().isObject()
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const updateData = req.body;

  // Check if strategy exists and user has permission
  const existingStrategy = await prisma.strategy.findFirst({
    where: {
      id,
      OR: [
        { userId: req.user!.id },
        { user: { role: 'admin' } }
      ]
    }
  });

  if (!existingStrategy) {
    throw createError('Strategy not found', 404);
  }

  const strategy = await prisma.strategy.update({
    where: { id },
    data: updateData
  });

  res.json({
    success: true,
    message: 'Strategy updated successfully',
    data: { strategy }
  });
}));

// Delete strategy
router.delete('/:id', [
  authenticate
], asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  // Check if strategy exists and user has permission
  const existingStrategy = await prisma.strategy.findFirst({
    where: {
      id,
      OR: [
        { userId: req.user!.id },
        { user: { role: 'admin' } }
      ]
    }
  });

  if (!existingStrategy) {
    throw createError('Strategy not found', 404);
  }

  await prisma.strategy.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Strategy deleted successfully'
  });
}));

// Get strategy templates
router.get('/templates/list', [
  authenticate
], asyncHandler(async (req: AuthRequest, res) => {
  const templates = [
    {
      id: 'ma_crossover',
      name: 'Moving Average Crossover',
      description: 'Simple moving average crossover strategy',
      type: 'technical',
      code: `
function maCrossoverStrategy(data, params) {
  const { shortPeriod = 10, longPeriod = 30 } = params;
  
  // Calculate moving averages
  const shortMA = calculateMA(data, shortPeriod);
  const longMA = calculateMA(data, longPeriod);
  
  const signals = [];
  for (let i = longPeriod; i < data.length; i++) {
    if (shortMA[i] > longMA[i] && shortMA[i-1] <= longMA[i-1]) {
      signals.push({ type: 'buy', index: i, price: data[i].close });
    } else if (shortMA[i] < longMA[i] && shortMA[i-1] >= longMA[i-1]) {
      signals.push({ type: 'sell', index: i, price: data[i].close });
    }
  }
  
  return signals;
}

function calculateMA(data, period) {
  const ma = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    ma.push(sum / period);
  }
  return ma;
}
      `,
      parameters: {
        shortPeriod: { type: 'number', default: 10, min: 5, max: 50 },
        longPeriod: { type: 'number', default: 30, min: 20, max: 200 }
      }
    },
    {
      id: 'rsi_oversold',
      name: 'RSI Oversold',
      description: 'RSI oversold strategy with trend confirmation',
      type: 'technical',
      code: `
function rsiOversoldStrategy(data, params) {
  const { rsiPeriod = 14, oversoldLevel = 30, trendPeriod = 50 } = params;
  
  const rsi = calculateRSI(data, rsiPeriod);
  const trendMA = calculateMA(data, trendPeriod);
  
  const signals = [];
  for (let i = Math.max(rsiPeriod, trendPeriod); i < data.length; i++) {
    // Check if RSI is oversold and price is above trend
    if (rsi[i] < oversoldLevel && data[i].close > trendMA[i]) {
      signals.push({ type: 'buy', index: i, price: data[i].close });
    }
  }
  
  return signals;
}

function calculateRSI(data, period) {
  const rsi = [];
  const changes = [];
  
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i].close - data[i-1].close);
  }
  
  for (let i = period - 1; i < changes.length; i++) {
    let gains = 0;
    let losses = 0;
    
    for (let j = 0; j < period; j++) {
      if (changes[i-j] > 0) gains += changes[i-j];
      else losses += Math.abs(changes[i-j]);
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }
  
  return rsi;
}
      `,
      parameters: {
        rsiPeriod: { type: 'number', default: 14, min: 5, max: 30 },
        oversoldLevel: { type: 'number', default: 30, min: 10, max: 40 },
        trendPeriod: { type: 'number', default: 50, min: 20, max: 200 }
      }
    }
  ];

  res.json({
    success: true,
    data: { templates }
  });
}));

// Validate strategy code
router.post('/validate', [
  authenticate,
  body('code').isLength({ min: 1 })
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { code } = req.body;

  // Basic code validation (can be enhanced with actual code analysis)
  const validation = {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[],
    suggestions: [] as string[]
  };

  try {
    // Check for required function
    if (!code.includes('function')) {
      validation.errors.push('Strategy must contain at least one function');
      validation.isValid = false;
    }

    // Check for dangerous operations
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /require\s*\(/,
      /import\s+/,
      /process\./,
      /fs\./,
      /child_process/
    ];

    dangerousPatterns.forEach(pattern => {
      if (pattern.test(code)) {
        validation.errors.push('Code contains potentially dangerous operations');
        validation.isValid = false;
      }
    });

    // Basic syntax check
    try {
      new Function(code);
    } catch (syntaxError: any) {
      validation.errors.push(`Syntax error: ${syntaxError.message}`);
      validation.isValid = false;
    }

    // Check for common strategy patterns
    if (!code.includes('buy') && !code.includes('sell')) {
      validation.warnings.push('Strategy does not contain buy/sell signals');
    }

    if (!code.includes('return')) {
      validation.warnings.push('Strategy should return signals or results');
    }

  } catch (error) {
    validation.errors.push('Validation failed');
    validation.isValid = false;
  }

  res.json({
    success: true,
    data: { validation }
  });
}));

// Start strategy
router.post('/:id/start', [
  authenticate
], asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const strategy = await prisma.strategy.findFirst({
    where: {
      id,
      OR: [
        { userId: req.user!.id },
        { user: { role: 'admin' } }
      ]
    }
  });

  if (!strategy) {
    throw createError('Strategy not found', 404);
  }

  await prisma.strategy.update({
    where: { id },
    data: { status: 'active' }
  });

  res.json({
    success: true,
    message: 'Strategy started successfully'
  });
}));

// Stop strategy
router.post('/:id/stop', [
  authenticate
], asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const strategy = await prisma.strategy.findFirst({
    where: {
      id,
      OR: [
        { userId: req.user!.id },
        { user: { role: 'admin' } }
      ]
    }
  });

  if (!strategy) {
    throw createError('Strategy not found', 404);
  }

  await prisma.strategy.update({
    where: { id },
    data: { status: 'inactive' }
  });

  res.json({
    success: true,
    message: 'Strategy stopped successfully'
  });
}));

// Get strategy performance
router.get('/:id/performance', [
  authenticate
], asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const strategy = await prisma.strategy.findFirst({
    where: {
      id,
      OR: [
        { userId: req.user!.id },
        { user: { role: 'admin' } }
      ]
    }
  });

  if (!strategy) {
    throw createError('Strategy not found', 404);
  }

  // Get performance metrics from trades
  const trades = await prisma.trade.findMany({
    where: {
      strategyId: id,
      userId: req.user!.id
    }
  });

  const performance = {
    totalTrades: trades.length,
    profitableTrades: trades.filter(t => t.profit && t.profit > 0).length,
    winRate: trades.length > 0 ? (trades.filter(t => t.profit && t.profit > 0).length / trades.length) * 100 : 0,
    totalProfit: trades.reduce((sum, t) => sum + (t.profit || 0), 0),
    averageProfit: trades.length > 0 ? trades.reduce((sum, t) => sum + (t.profit || 0), 0) / trades.length : 0
  };

  res.json({
    success: true,
    data: { performance }
  });
}));

// Get strategy logs
router.get('/:id/logs', [
  authenticate,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('level').optional().isIn(['info', 'warning', 'error', 'debug'])
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = (page - 1) * limit;
  const { level } = req.query;

  const where: any = {
    strategyId: id,
    userId: req.user!.id
  };

  if (level) where.level = level;

  const [logs, total] = await Promise.all([
    prisma.strategyLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip: offset,
      take: limit
    }),
    prisma.strategyLog.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// Get strategy trades
router.get('/:id/trades', [
  authenticate,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  const where: any = {
    strategyId: id,
    userId: req.user!.id
  };

  const [trades, total] = await Promise.all([
    prisma.trade.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip: offset,
      take: limit
    }),
    prisma.trade.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      trades,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// Update strategy status
router.put('/:id/status', [
  authenticate,
  body('status').isIn(['draft', 'active', 'inactive', 'archived'])
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const { status } = req.body;

  const strategy = await prisma.strategy.findFirst({
    where: {
      id,
      OR: [
        { userId: req.user!.id },
        { user: { role: 'admin' } }
      ]
    }
  });

  if (!strategy) {
    throw createError('Strategy not found', 404);
  }

  const updatedStrategy = await prisma.strategy.update({
    where: { id },
    data: { status }
  });

  res.json({
    success: true,
    message: 'Strategy status updated successfully',
    data: { strategy: updatedStrategy }
  });
}));

// Duplicate strategy
router.post('/:id/duplicate', [
  authenticate
], asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const originalStrategy = await prisma.strategy.findFirst({
    where: {
      id,
      OR: [
        { userId: req.user!.id },
        { user: { role: 'admin' } }
      ]
    }
  });

  if (!originalStrategy) {
    throw createError('Strategy not found', 404);
  }

  const duplicatedStrategy = await prisma.strategy.create({
    data: {
      name: `${originalStrategy.name} (Copy)`,
      description: originalStrategy.description,
      code: originalStrategy.code,
      type: originalStrategy.type,
      parameters: originalStrategy.parameters,
      status: 'draft',
      userId: req.user!.id
    }
  });

  res.status(201).json({
    success: true,
    message: 'Strategy duplicated successfully',
    data: { strategy: duplicatedStrategy }
  });
}));

export default router;