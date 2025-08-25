import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { body, query, validationResult } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

// Get trading accounts
router.get('/accounts', authenticate, async (req: AuthRequest, res) => {
  try {
    const accounts = await prisma.account.findMany({
      where: {
        userId: req.user!.id,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        type: true,
        balance: true,
        currency: true,
        broker: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      message: 'Trading accounts retrieved successfully',
      data: accounts
    });
  } catch (error) {
    console.error('Error fetching trading accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trading accounts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get account details
router.get('/accounts/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const account = await prisma.account.findFirst({
      where: {
        id,
        userId: req.user!.id,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    res.json({
      success: true,
      message: 'Account details retrieved successfully',
      data: account
    });
  } catch (error) {
    console.error('Error fetching account details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch account details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get positions
router.get('/positions', authenticate, async (req: AuthRequest, res) => {
  try {
    const { accountId } = req.query;

    // For now, return mock positions data
    // In a real implementation, this would fetch from broker API
    const positions = [
      {
        id: '1',
        symbol: 'BTCUSDT',
        side: 'long',
        quantity: 0.5,
        entryPrice: 45000,
        currentPrice: 46500,
        pnl: 750,
        pnlPercentage: 1.67,
        timestamp: new Date()
      },
      {
        id: '2',
        symbol: 'ETHUSDT',
        side: 'short',
        quantity: 2.0,
        entryPrice: 3200,
        currentPrice: 3100,
        pnl: 200,
        pnlPercentage: 3.13,
        timestamp: new Date()
      }
    ];

    res.json({
      success: true,
      message: 'Positions retrieved successfully',
      data: positions
    });
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch positions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Place order
router.post('/order', authenticate, [
  body('accountId').notEmpty().withMessage('Account ID is required'),
  body('symbol').notEmpty().withMessage('Symbol is required'),
  body('type').isIn(['market', 'limit', 'stop', 'stop_limit']).withMessage('Invalid order type'),
  body('side').isIn(['buy', 'sell']).withMessage('Invalid order side'),
  body('quantity').isFloat({ min: 0 }).withMessage('Quantity must be positive'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('stopPrice').optional().isFloat({ min: 0 }).withMessage('Stop price must be positive')
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

    const { accountId, symbol, type, side, quantity, price, stopPrice } = req.body;

    // Verify account exists and belongs to user
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: req.user!.id,
        isActive: true
      }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Create trade record
    const trade = await prisma.trade.create({
      data: {
        strategyId: 'manual', // Manual trading
        userId: req.user!.id,
        symbol,
        type: side,
        side: side === 'buy' ? 'long' : 'short',
        quantity,
        price: price || 0, // Market orders will have price filled later
        timestamp: new Date(),
        status: 'pending',
        notes: JSON.stringify({
          orderType: type,
          accountId,
          stopPrice
        })
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    // Simulate order execution (in real implementation, this would call broker API)
    setTimeout(async () => {
      try {
        // Mock execution price
        const executionPrice = price || (Math.random() * 1000 + 40000); // Mock price
        
        await prisma.trade.update({
          where: { id: trade.id },
          data: {
            status: 'executed',
            price: executionPrice,
            commission: executionPrice * quantity * 0.001, // 0.1% commission
            pnl: side === 'buy' ? 0 : 0 // PnL calculated on close
          }
        });
      } catch (error) {
        console.error('Error executing trade:', error);
      }
    }, 1000);

    res.json({
      success: true,
      message: 'Order placed successfully',
      data: {
        orderId: trade.id,
        status: trade.status,
        timestamp: trade.timestamp
      }
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to place order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Close position
router.post('/close', authenticate, [
  body('positionId').notEmpty().withMessage('Position ID is required'),
  body('quantity').isFloat({ min: 0 }).withMessage('Quantity must be positive')
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

    const { positionId, quantity } = req.body;

    // In a real implementation, this would find the open position and close it
    // For now, we'll create a closing trade record
    
    const closingTrade = await prisma.trade.create({
      data: {
        strategyId: 'manual_close',
        userId: req.user!.id,
        symbol: 'BTCUSDT', // Mock symbol
        type: 'sell', // Closing position
        side: 'short',
        quantity,
        price: 46000, // Mock closing price
        timestamp: new Date(),
        status: 'executed',
        commission: 46000 * quantity * 0.001,
        notes: JSON.stringify({
          closingPositionId: positionId
        })
      }
    });

    res.json({
      success: true,
      message: 'Position closed successfully',
      data: {
        tradeId: closingTrade.id,
        status: closingTrade.status,
        timestamp: closingTrade.timestamp
      }
    });
  } catch (error) {
    console.error('Error closing position:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close position',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get order history
router.get('/orders', authenticate, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['all', 'pending', 'executed', 'cancelled', 'failed']).withMessage('Invalid status')
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
    const status = req.query.status as string || 'all';
    const offset = (page - 1) * limit;

    const whereClause: any = {
      userId: req.user!.id
    };

    if (status !== 'all') {
      whereClause.status = status;
    }

    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where: whereClause,
        select: {
          id: true,
          symbol: true,
          type: true,
          side: true,
          quantity: true,
          price: true,
          status: true,
          timestamp: true,
          commission: true,
          pnl: true
        },
        orderBy: {
          timestamp: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.trade.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      message: 'Orders retrieved successfully',
      data: {
        orders: trades,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get trading statistics
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const stats = await prisma.trade.groupBy({
      by: ['status'],
      where: {
        userId: req.user!.id
      },
      _count: {
        status: true
      },
      _sum: {
        pnl: true
      }
    });

    const totalPnl = await prisma.trade.aggregate({
      where: {
        userId: req.user!.id,
        status: 'executed'
      },
      _sum: {
        pnl: true
      }
    });

    res.json({
      success: true,
      message: 'Trading statistics retrieved successfully',
      data: {
        statusCounts: stats,
        totalPnl: totalPnl._sum.pnl || 0
      }
    });
  } catch (error) {
    console.error('Error fetching trading statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trading statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;