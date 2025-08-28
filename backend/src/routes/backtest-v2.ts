import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { body, query, validationResult } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

console.log('New backtest routes loaded');

// Main backtest endpoint - matches new frontend API
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    console.log('New backtest request received:', req.body);
    
    const { 
      strategyId, 
      name, 
      description,
      symbols,
      startDate, 
      endDate, 
      initialCapital = 10000,
      timeframe = '1h',
      commission = 0.001,
      slippage = 0.001,
      leverage = 1,
      riskLimits = [],
      outputOptions = [],
      parameters = {} 
    } = req.body;
    
    if (!strategyId || !name || !symbols || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: strategyId, name, symbols, startDate, endDate'
      });
    }

    // Create backtest record
    const backtest = await prisma.backtest.create({
      data: {
        name,
        strategyId: String(strategyId),
        userId: req.user!.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        initialCapital: Number(initialCapital),
        parameters: {
          ...parameters,
          timeframe,
          commission: Number(commission),
          slippage: Number(slippage),
          leverage: Number(leverage),
          symbols: symbols,
          riskLimits: riskLimits || [],
          outputOptions: outputOptions || [],
          description: description || ''
        }
      }
    });

    // Start backtest in background
    setImmediate(async () => {
      try {
        // Update progress (stored in parameters since no progress field in DB)
        await prisma.backtest.update({
          where: { id: backtest.id },
          data: { 
            parameters: {
              ...backtest.parameters,
              progress: 0.25,
              currentStep: 'Loading market data'
            }
          }
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate backtest processing
        await prisma.backtest.update({
          where: { id: backtest.id },
          data: { 
            parameters: {
              ...backtest.parameters,
              progress: 0.5,
              currentStep: 'Running strategy'
            }
          }
        });

        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await prisma.backtest.update({
          where: { id: backtest.id },
          data: { 
            parameters: {
              ...backtest.parameters,
              progress: 0.75,
              currentStep: 'Calculating results'
            }
          }
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate results
        const results = {
          totalReturn: Math.random() * 20 - 5, // -5% to 15%
          annualizedReturn: Math.random() * 15 - 2,
          sharpeRatio: Math.random() * 2 + 0.5,
          maxDrawdown: Math.random() * 10 + 2,
          winRate: Math.random() * 30 + 40,
          profitFactor: Math.random() * 2 + 1,
          totalTrades: Math.floor(Math.random() * 50) + 10,
          averageTrade: Math.random() * 200 - 50,
          benchmarkReturn: Math.random() * 10 - 2,
          excessReturn: Math.random() * 8 - 2,
          informationRatio: Math.random() * 1.5,
          volatility: Math.random() * 15 + 5,
          totalCommission: Math.random() * 100,
          totalSlippage: Math.random() * 50,
          equityCurve: Array.from({ length: 20 }, (_, i) => ({
            timestamp: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000).toISOString(),
            value: initialCapital * (1 + (Math.random() * 0.1 - 0.05))
          }))
        };

        await prisma.backtest.update({
          where: { id: backtest.id },
          data: {
            status: 'completed',
            finalCapital: initialCapital * (1 + results.totalReturn / 100),
            totalReturn: results.totalReturn / 100,
            sharpeRatio: results.sharpeRatio,
            maxDrawdown: results.maxDrawdown / 100,
            winRate: results.winRate / 100,
            totalTrades: results.totalTrades,
            results: results
          }
        });

        // Generate some sample trades
        const trades = [];
        for (let i = 0; i < Math.floor(Math.random() * 10) + 5; i++) {
          const isBuy = i % 2 === 0;
          trades.push({
            symbol: symbols[0] || 'BTCUSDT',
            type: isBuy ? 'buy' : 'sell',
            side: isBuy ? 'long' : 'short',
            quantity: Math.random() * 0.1 + 0.01,
            price: 45000 + Math.random() * 5000,
            timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            status: 'completed',
            commission: Math.random() * 10,
            slippage: Math.random() * 5,
            pnl: isBuy ? 0 : (Math.random() * 200 - 50),
            profit: isBuy ? 0 : (Math.random() * 200 - 50),
            notes: isBuy ? 'Entry trade' : 'Exit trade'
          });
        }

        // Save trades
        for (const trade of trades) {
          await prisma.trade.create({
            data: {
              ...trade,
              backtestId: backtest.id,
              strategyId: backtest.strategyId,
              userId: req.user!.id
            }
          });
        }

      } catch (error) {
        console.error('Backtest processing error:', error);
        await prisma.backtest.update({
          where: { id: backtest.id },
          data: { 
            status: 'failed',
            parameters: {
              ...backtest.parameters,
              currentStep: 'Failed',
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        });
      }
    });

    res.json({
      success: true,
      message: 'Backtest started successfully',
      data: backtest
    });
  } catch (error) {
    console.error('Error starting backtest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start backtest',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get specific backtest - matches new frontend API
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const backtest = await prisma.backtest.findFirst({
      where: {
        id,
        userId: req.user!.id
      },
      include: {
        strategy: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        trades: {
          select: {
            id: true,
            symbol: true,
            type: true,
            side: true,
            quantity: true,
            price: true,
            timestamp: true,
            status: true,
            pnl: true,
            profit: true,
            commission: true,
            slippage: true,
            notes: true
          },
          orderBy: {
            timestamp: 'asc'
          }
        }
      }
    });

    if (!backtest) {
      return res.status(404).json({
        success: false,
        message: 'Backtest not found'
      });
    }

    res.json({
      success: true,
      message: 'Backtest retrieved successfully',
      data: backtest
    });
  } catch (error) {
    console.error('Error fetching backtest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch backtest',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get backtest history - matches new frontend API (main endpoint)
router.get('/', authenticate, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('strategyId').optional().isString().withMessage('Strategy ID must be a string'),
  query('status').optional().isIn(['all', 'pending', 'running', 'completed', 'failed']).withMessage('Invalid status')
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

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const strategyId = req.query.strategyId as string;
    const status = req.query.status as string || 'all';
    const offset = (page - 1) * limit;

    const whereClause: any = {
      userId: req.user!.id
    };

    if (strategyId) {
      whereClause.strategyId = strategyId;
    }

    if (status !== 'all') {
      whereClause.status = status;
    }

    const [backtests, total] = await Promise.all([
      prisma.backtest.findMany({
        where: whereClause,
        include: {
          strategy: {
            select: {
              id: true,
              name: true,
              type: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.backtest.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      message: 'Backtest history retrieved successfully',
      data: {
        backtests,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching backtest history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch backtest history',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get backtest statistics
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const stats = await prisma.backtest.groupBy({
      by: ['status'],
      where: {
        userId: req.user!.id
      },
      _count: {
        status: true
      }
    });

    const avgReturn = await prisma.backtest.aggregate({
      where: {
        userId: req.user!.id,
        status: 'completed',
        totalReturn: { not: null }
      },
      _avg: {
        totalReturn: true
      }
    });

    const totalTrades = await prisma.backtest.aggregate({
      where: {
        userId: req.user!.id,
        status: 'completed',
        totalTrades: { not: null }
      },
      _sum: {
        totalTrades: true
      }
    });

    res.json({
      success: true,
      message: 'Backtest statistics retrieved successfully',
      data: {
        statusCounts: stats,
        avgReturn: avgReturn._avg.totalReturn || 0,
        totalTrades: totalTrades._sum.totalTrades || 0
      }
    });
  } catch (error) {
    console.error('Error fetching backtest statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch backtest statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cancel backtest - matches new frontend API
router.post('/:id/cancel', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const backtest = await prisma.backtest.findFirst({
      where: {
        id,
        userId: req.user!.id,
        status: 'running'
      }
    });

    if (!backtest) {
      return res.status(404).json({
        success: false,
        message: 'Running backtest not found'
      });
    }

    await prisma.backtest.update({
      where: { id },
      data: {
        status: 'cancelled',
        parameters: {
          ...backtest.parameters,
          currentStep: 'Cancelled'
        }
      }
    });

    res.json({
      success: true,
      message: 'Backtest cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling backtest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel backtest',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get backtest trades - matches new frontend API
router.get('/:id/trades', authenticate, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
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

    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Verify backtest belongs to user
    const backtest = await prisma.backtest.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!backtest) {
      return res.status(404).json({
        success: false,
        message: 'Backtest not found'
      });
    }

    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where: {
          backtestId: id,
          userId: req.user!.id
        },
        orderBy: {
          timestamp: 'asc'
        },
        skip: offset,
        take: limit
      }),
      prisma.trade.count({
        where: {
          backtestId: id,
          userId: req.user!.id
        }
      })
    ]);

    res.json({
      success: true,
      message: 'Backtest trades retrieved successfully',
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
  } catch (error) {
    console.error('Error fetching backtest trades:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch backtest trades',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get backtest templates - matches new frontend API
router.get('/templates', authenticate, async (req: AuthRequest, res) => {
  try {
    // Return some predefined backtest templates
    const templates = [
      {
        id: 'sma-crossover',
        name: 'SMA Crossover',
        description: 'Simple moving average crossover strategy',
        parameters: {
          shortPeriod: 10,
          longPeriod: 30,
          riskPerTrade: 0.02
        }
      },
      {
        id: 'rsi-mean-reversion',
        name: 'RSI Mean Reversion',
        description: 'RSI-based mean reversion strategy',
        parameters: {
          rsiPeriod: 14,
          oversold: 30,
          overbought: 70,
          riskPerTrade: 0.02
        }
      },
      {
        id: 'breakout',
        name: 'Breakout Strategy',
        description: 'Price breakout strategy',
        parameters: {
          lookbackPeriod: 20,
          breakoutMultiplier: 1.5,
          riskPerTrade: 0.02
        }
      }
    ];

    res.json({
      success: true,
      message: 'Backtest templates retrieved successfully',
      data: templates
    });
  } catch (error) {
    console.error('Error fetching backtest templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch backtest templates',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;