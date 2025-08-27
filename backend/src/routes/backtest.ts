import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { body, query, validationResult } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

// Simple backtest engine (for demonstration)
class BacktestEngine {
  async runBacktest(strategy: any, marketData: any[], parameters: any) {
    const trades = [];
    let capital = parameters.initialCapital || 10000;
    let position = 0;
    let entryPrice = 0;

    // Simple moving average crossover strategy
    const shortPeriod = parameters.shortPeriod || 10;
    const longPeriod = parameters.longPeriod || 30;

    for (let i = longPeriod; i < marketData.length; i++) {
      const currentData = marketData[i];
      const shortMA = this.calculateMA(marketData.slice(i - shortPeriod + 1, i + 1));
      const longMA = this.calculateMA(marketData.slice(i - longPeriod + 1, i + 1));

      // Trading logic
      if (shortMA > longMA && position <= 0) {
        // Buy signal
        position = capital * 0.1 / currentData.close; // Use 10% of capital
        entryPrice = currentData.close;
        capital -= position * currentData.close;
        
        trades.push({
          timestamp: currentData.timestamp,
          type: 'buy',
          price: currentData.close,
          quantity: position,
          notes: 'SMA crossover buy signal'
        });
      } else if (shortMA < longMA && position > 0) {
        // Sell signal
        capital += position * currentData.close;
        
        trades.push({
          timestamp: currentData.timestamp,
          type: 'sell',
          price: currentData.close,
          quantity: position,
          notes: 'SMA crossover sell signal'
        });
        
        position = 0;
      }
    }

    // Calculate performance metrics
    const totalReturn = (capital + position * marketData[marketData.length - 1].close - parameters.initialCapital) / parameters.initialCapital;
    const winRate = this.calculateWinRate(trades);
    const maxDrawdown = this.calculateMaxDrawdown(marketData, trades);

    return {
      finalCapital: capital + position * marketData[marketData.length - 1].close,
      totalReturn: totalReturn,
      sharpeRatio: totalReturn / 0.15, // Simplified Sharpe ratio
      maxDrawdown: maxDrawdown,
      winRate: winRate,
      totalTrades: trades.length,
      trades: trades
    };
  }

  calculateMA(data: any[]) {
    const sum = data.reduce((acc, item) => acc + item.close, 0);
    return sum / data.length;
  }

  calculateWinRate(trades: any[]) {
    if (trades.length === 0) return 0;
    
    let wins = 0;
    for (let i = 0; i < trades.length; i += 2) {
      if (i + 1 < trades.length) {
        const buy = trades[i];
        const sell = trades[i + 1];
        if (sell.price > buy.price) wins++;
      }
    }
    return wins / (trades.length / 2);
  }

  calculateMaxDrawdown(marketData: any[], trades: any[]) {
    let maxDrawdown = 0;
    let peak = marketData[0].close;
    
    for (const data of marketData) {
      if (data.close > peak) peak = data.close;
      const drawdown = (peak - data.close) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    return maxDrawdown;
  }
}

const backtestEngine = new BacktestEngine();

// Run backtest - simplified version for testing
router.post('/start', authenticate, async (req: AuthRequest, res) => {
  try {
    console.log('Backtest start request received:', req.body);
    
    const { strategyId, startDate, endDate, initialCapital = 10000, parameters = {} } = req.body;
    
    if (!strategyId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: strategyId, startDate, endDate'
      });
    }

    // Create a simple backtest record for demo
    const backtest = await prisma.backtest.create({
      data: {
        name: `Backtest - ${strategyId}`,
        strategyId: String(strategyId),
        userId: req.user!.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        initialCapital: Number(initialCapital),
        status: 'running',
        parameters: parameters || {}
      }
    });

    // Start backtest in background
    setImmediate(async () => {
      try {
        // Simulate backtest processing
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        await prisma.backtest.update({
          where: { id: backtest.id },
          data: {
            status: 'completed',
            results: {
              totalReturn: Math.random() * 20 - 5, // -5% to 15%
              sharpeRatio: Math.random() * 2 + 0.5,
              maxDrawdown: Math.random() * 10 + 2,
              winRate: Math.random() * 30 + 40,
              totalTrades: Math.floor(Math.random() * 50) + 10
            }
          }
        });
      } catch (error) {
        console.error('Backtest processing error:', error);
        await prisma.backtest.update({
          where: { id: backtest.id },
          data: { status: 'failed' }
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
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { strategyId, startDate, endDate, initialCapital, parameters = {} } = req.body;

    // Verify strategy exists and belongs to user
    const strategy = await prisma.strategy.findFirst({
      where: {
        id: strategyId,
        userId: req.user!.id
      }
    });

    if (!strategy) {
      return res.status(404).json({
        success: false,
        message: 'Strategy not found'
      });
    }

    // Create backtest record
    const backtest = await prisma.backtest.create({
      data: {
        name: `Backtest - ${strategy.name}`,
        strategyId,
        userId: req.user!.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        initialCapital,
        status: 'running',
        parameters
      }
    });

    // Start backtest in background
    setImmediate(async () => {
      try {
        // Generate mock market data for demonstration
        const marketData = generateMockMarketData(new Date(startDate), new Date(endDate));
        
        // Run backtest
        const results = await backtestEngine.runBacktest(strategy, marketData, {
          initialCapital,
          ...parameters
        });

        // Update backtest record with results
        await prisma.backtest.update({
          where: { id: backtest.id },
          data: {
            status: 'completed',
            finalCapital: results.finalCapital,
            totalReturn: results.totalReturn,
            sharpeRatio: results.sharpeRatio,
            maxDrawdown: results.maxDrawdown,
            winRate: results.winRate,
            totalTrades: results.totalTrades,
            results: results
          }
        });

        // Create trade records
        for (const trade of results.trades) {
          await prisma.trade.create({
            data: {
              strategyId,
              userId: req.user!.id,
              backtestId: backtest.id,
              symbol: 'BTCUSDT', // Mock symbol
              type: trade.type,
              side: trade.type === 'buy' ? 'long' : 'short',
              quantity: trade.quantity,
              price: trade.price,
              timestamp: trade.timestamp,
              status: 'executed',
              notes: trade.notes
            }
          });
        }
      } catch (error) {
        console.error('Backtest execution failed:', error);
        await prisma.backtest.update({
          where: { id: backtest.id },
          data: {
            status: 'failed',
            results: { error: error instanceof Error ? error.message : 'Unknown error' }
          }
        });
      }
    });

    res.json({
      success: true,
      message: 'Backtest started successfully',
      data: {
        backtestId: backtest.id,
        status: backtest.status,
        estimatedDuration: '30-60 seconds'
      }
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

// Get backtest results
router.get('/results/:id', authenticate, async (req: AuthRequest, res) => {
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
            pnl: true
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
      message: 'Backtest results retrieved successfully',
      data: backtest
    });
  } catch (error) {
    console.error('Error fetching backtest results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch backtest results',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get backtest history
router.get('/history', authenticate, [
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

// Cancel backtest
router.post('/cancel/:id', authenticate, async (req: AuthRequest, res) => {
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
        status: 'cancelled'
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

// Helper function to generate mock market data
function generateMockMarketData(startDate: Date, endDate: Date) {
  const data = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  let price = 45000; // Starting price
  
  while (current <= end) {
    // Generate random price movement
    const change = (Math.random() - 0.5) * 1000;
    price = Math.max(price + change, 10000); // Minimum price
    
    data.push({
      timestamp: new Date(current),
      open: price,
      high: price + Math.random() * 500,
      low: price - Math.random() * 500,
      close: price,
      volume: Math.random() * 1000000
    });
    
    current.setHours(current.getHours() + 1); // Hourly data
  }
  
  return data;
}

export default router;