import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { body, query, validationResult } from 'express-validator';
import { riskManagementService } from '../services/RiskManagementService';
import { exchangeService } from '../exchanges/ExchangeService';

const router = Router();
const prisma = new PrismaClient();

console.log('📝 Trading routes loaded');

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

// Get positions - updated to return real data from executed trades
router.get('/positions', authenticate, async (req: AuthRequest, res) => {
  try {
    console.log('📋 GET POSITIONS ENDPOINT CALLED');
    console.log('📋 Request query:', req.query);
    console.log('📋 User info:', req.user);
    
    const { accountId } = req.query;

    // Build where clause
    const whereClause: any = {
      userId: req.user!.id,
      status: 'executed'
    };

    if (accountId) {
      whereClause.accountId = accountId;
    }

    console.log('📋 Where clause:', whereClause);

    // Get all executed trades to calculate positions
    const trades = await prisma.trade.findMany({
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
        pnl: true,
        notes: true,
        accountId: true
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    console.log('📋 Found trades:', trades.length);

    // Calculate positions from trades
    const positionMap = new Map();
    
    trades.forEach(trade => {
      const notes = JSON.parse(trade.notes || '{}');
      const symbol = trade.symbol;
      const side = trade.side; // 'long' or 'short'
      const quantity = trade.quantity;
      const price = trade.price;
      
      if (!positionMap.has(symbol)) {
        positionMap.set(symbol, {
          id: `pos_${symbol}_${trade.accountId}`,
          symbol: symbol,
          side: side,
          quantity: 0,
          entryPrice: price,
          currentPrice: price, // Will update with market data later
          pnl: 0,
          pnlPercentage: 0,
          timestamp: trade.timestamp,
          accountId: trade.accountId,
          trades: []
        });
      }
      
      const position = positionMap.get(symbol);
      position.trades.push(trade);
      
      // Calculate net position
      if (side === 'long') {
        position.quantity += quantity;
      } else {
        position.quantity -= quantity;
      }
      
      // Update entry price (average)
      if (position.quantity !== 0) {
        const totalValue = position.trades.reduce((sum, t) => sum + (t.quantity * t.price), 0);
        const totalQuantity = position.trades.reduce((sum, t) => sum + t.quantity, 0);
        position.entryPrice = totalValue / totalQuantity;
      }
    });

    // Filter out positions with zero quantity
    const positions = Array.from(positionMap.values()).filter(pos => Math.abs(pos.quantity) > 0.000001);

    // Get current market prices for PnL calculation
    for (const position of positions) {
      try {
        // Get the account to find the exchange ID
        const account = await prisma.account.findUnique({
          where: { id: position.accountId },
          select: { accountId: true }
        });
        
        if (!account?.accountId) {
          throw new Error('Account not found or no exchange ID');
        }
        
        console.log(`📈 Fetching market data for ${position.symbol} from exchange ${account.accountId}`);
        
        // Fetch real market data from Bybit
        const marketData = await exchangeService.getTicker(account.accountId, position.symbol.replace('/', ''));
        position.currentPrice = marketData.last || marketData.bid || marketData.ask || position.entryPrice;
        
        console.log(`✅ Got market data for ${position.symbol}: $${position.currentPrice}`);
        
        // Calculate PnL
        if (position.side === 'long') {
          position.pnl = (position.currentPrice - position.entryPrice) * Math.abs(position.quantity);
        } else {
          position.pnl = (position.entryPrice - position.currentPrice) * Math.abs(position.quantity);
        }
        
        // Calculate PnL percentage
        position.pnlPercentage = (position.pnl / (position.entryPrice * Math.abs(position.quantity))) * 100;
        
        console.log(`💰 Calculated PnL for ${position.symbol}: $${position.pnl} (${position.pnlPercentage.toFixed(2)}%)`);
        
      } catch (error) {
        console.log(`❌ Failed to get market data for ${position.symbol}, using entry price:`, error.message);
        position.currentPrice = position.entryPrice;
        position.pnl = 0;
        position.pnlPercentage = 0;
      }
    }

    console.log('📋 Calculated positions:', positions.length);

    const response = {
      success: true,
      message: 'Positions retrieved successfully',
      data: positions
    };

    console.log('📋 Sending response:', JSON.stringify(response, null, 2));
    
    res.json(response);
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
  console.log('🚀 ORDER ROUTE CALLED!');
  console.log('📋 Request method:', req.method);
  console.log('📋 Request URL:', req.url);
  console.log('📋 Request headers:', req.headers);
  console.log('📋 Request body:', req.body);
  console.log('📋 User info:', req.user);
  
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

    // Enhanced order validation using RiskManagementService
    const orderData = {
      accountId,
      symbol,
      type,
      side,
      amount: quantity.toString(),
      price: price?.toString(),
      stopPrice: stopPrice?.toString(),
      userId: req.user!.id
    };

    console.log('🔄 ABOUT TO CALL RISK MANAGEMENT VALIDATE ORDER...');
    console.log('   - Order data:', JSON.stringify(orderData, null, 2));
    
    const validation = await riskManagementService.validateOrder(orderData);
    
    console.log('📊 BACK FROM RISK MANAGEMENT VALIDATION:');
    console.log('   - Validation result:', validation.valid);
    console.log('   - Errors:', validation.errors);
    console.log('   - Warnings:', validation.warnings);

    if (!validation.valid) {
      console.log('❌ VALIDATION FAILED - Returning 400 error');
      return res.status(400).json({
        success: false,
        message: 'Order validation failed',
        errors: validation.errors,
        warnings: validation.warnings
      });
    } else {
      console.log('✅ VALIDATION PASSED - Continuing with order execution');
    }

    // Use adjusted order parameters if provided
    const finalOrderData = validation.adjustedOrder || orderData;

    // Find or create manual strategy for this user
    let manualStrategy = await prisma.strategy.findFirst({
      where: {
        userId: req.user!.id,
        name: 'Manual Trading'
      }
    });

    if (!manualStrategy) {
      manualStrategy = await prisma.strategy.create({
        data: {
          name: 'Manual Trading',
          description: 'Manual trading orders placed through the trading panel',
          code: '// Manual trading strategy',
          type: 'manual',
          status: 'active',
          userId: req.user!.id
        }
      });
    }

    // Create trade record
    const trade = await prisma.trade.create({
      data: {
        strategyId: manualStrategy.id,
        userId: req.user!.id,
        symbol,
        type: side,
        side: side === 'buy' ? 'long' : 'short',
        quantity: parseFloat(finalOrderData.amount),
        price: parseFloat(finalOrderData.price) || 0, // Market orders will have price filled later
        timestamp: new Date(),
        status: 'pending',
        accountId: accountId, // 添加账户ID
        notes: JSON.stringify({
          orderType: type,
          accountId,
          stopPrice: finalOrderData.stopPrice,
          validationWarnings: validation.warnings
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

    // Execute real order via exchange API
    const targetExchangeId = account.accountId; // Use the account's exchange ID directly
    let exchangeOrderData: any = {};
    
    console.log('🎯 Using exchange ID:', targetExchangeId);
    
    // Prepare order data for exchange
    exchangeOrderData = {
      symbol: symbol.replace('/', ''), // Bybit format: BTCUSDT instead of BTC/USDT
      type: type === 'market' ? 'market' : 'limit',
      side: side,
      amount: parseFloat(finalOrderData.amount),
      price: type === 'limit' ? parseFloat(finalOrderData.price) : undefined,
      params: {
        test: account.testnet // Use testnet for testing
      }
    };
    
    try {
      console.log('🚀 Executing real order via Bybit API...');
      console.log('📋 Exchange order data:', exchangeOrderData);
      console.log('🚀 Sending API request to exchange:', targetExchangeId);
      console.log('📤 Request details:');
      console.log('  - Symbol:', exchangeOrderData.symbol);
      console.log('  - Type:', exchangeOrderData.type);
      console.log('  - Side:', exchangeOrderData.side);
      console.log('  - Amount:', exchangeOrderData.amount);
      console.log('  - Price:', exchangeOrderData.price || 'Market');
      console.log('  - Testnet:', exchangeOrderData.params.test);
      
      // Execute order via real exchange API
      const startTime = Date.now();
      const exchangeOrder = await exchangeService.placeOrder(targetExchangeId, exchangeOrderData);
      const endTime = Date.now();
      
      console.log('✅ Exchange order response received!');
      console.log('⏱️  API call duration:', endTime - startTime, 'ms');
      console.log('📥 Response details:');
      console.log('  - Exchange Order ID:', exchangeOrder.exchangeId);
      console.log('  - Status:', exchangeOrder.status);
      console.log('  - Symbol:', exchangeOrder.symbol);
      console.log('  - Type:', exchangeOrder.type);
      console.log('  - Side:', exchangeOrder.side);
      console.log('  - Quantity:', exchangeOrder.quantity);
      console.log('  - Price:', exchangeOrder.price);
      console.log('  - Filled Quantity:', exchangeOrder.filledQuantity);
      console.log('  - Average Price:', exchangeOrder.averagePrice);
      console.log('  - Commission:', exchangeOrder.commission, exchangeOrder.feeCurrency);
      console.log('  - Create Time:', exchangeOrder.createTime);
      console.log('  - Update Time:', exchangeOrder.updateTime);
      console.log('  - Full metadata:', JSON.stringify(exchangeOrder.metadata, null, 2));
      
      // Update trade record with real execution data
      await prisma.trade.update({
        where: { id: trade.id },
        data: {
          status: exchangeOrder.status === 'closed' || exchangeOrder.status === 'filled' ? 'executed' : 'pending',
          price: exchangeOrder.averagePrice || exchangeOrder.price || parseFloat(finalOrderData.price) || 0,
          commission: exchangeOrder.commission || 0,
          pnl: side === 'buy' ? 0 : 0, // PnL calculated on close
          notes: JSON.stringify({
            ...JSON.parse(trade.notes || '{}'),
            exchangeOrderId: exchangeOrder.exchangeId,
            exchangeStatus: exchangeOrder.status,
            filledQuantity: exchangeOrder.filledQuantity,
            averagePrice: exchangeOrder.averagePrice,
            commission: exchangeOrder.commission,
            feeCurrency: exchangeOrder.feeCurrency
          })
        }
      });
      
      console.log('✅ Trade record updated with exchange data');
    } catch (error) {
      console.error('❌ Error executing real order via API!');
      console.error('📊 Error details:');
      console.error('  - Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('  - Error type:', error.constructor.name);
      console.error('  - Exchange ID:', targetExchangeId || 'undefined');
      console.error('  - Order Data:', JSON.stringify(exchangeOrderData || {}, null, 2));
      
      // Detailed error logging for different error types
      if (error instanceof Error) {
        console.error('  - Stack trace:', error.stack);
      }
      
      // Check for specific error types
      if ('response' in error) {
        console.error('  - HTTP Response Status:', error.response?.status);
        console.error('  - HTTP Response Data:', JSON.stringify(error.response?.data, null, 2));
      }
      
      if ('request' in error) {
        console.error('  - Request details:', error.request);
      }
      
      console.error('  - Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
      // Handle specific error types with user-friendly messages
      let userErrorMessage = 'Unknown execution error';
      let errorCategory = 'unknown';
      let shouldFallbackToSimulation = false;
      
      if (error.message?.includes('regulatory restrictions') || error.message?.includes('retCode":10024')) {
        userErrorMessage = '交易服务因监管限制暂时不可用，已切换到模拟交易模式。';
        errorCategory = 'regulatory';
        shouldFallbackToSimulation = true;
      } else if (error.message?.includes('insufficient') || error.message?.includes('balance')) {
        userErrorMessage = '账户余额不足，请充值后重试。';
        errorCategory = 'insufficient_balance';
      } else if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
        userErrorMessage = '账户权限不足，请检查API密钥配置。';
        errorCategory = 'permission';
      }
      
      // Make sure targetExchangeId is defined for error handling
      const errorExchangeId = targetExchangeId || account.accountId || 'unknown';
      
      if (shouldFallbackToSimulation) {
        // Fallback to simulation mode for regulatory restrictions
        console.log('🔄 Regulatory restriction detected, falling back to simulation mode...');
        
        // Simulate successful order execution
        const simulatedPrice = 45000 + Math.random() * 1000; // Random price around 45k
        const simulatedCommission = simulatedPrice * parseFloat(finalOrderData.amount) * 0.001;
        
        await prisma.trade.update({
          where: { id: trade.id },
          data: {
            status: 'executed',
            price: simulatedPrice,
            commission: simulatedCommission,
            pnl: side === 'buy' ? 0 : 0, // PnL calculated on close
            notes: JSON.stringify({
              ...JSON.parse(trade.notes || '{}'),
              executionMode: 'simulation',
              executionReason: 'regulatory_restriction_fallback',
              simulatedPrice,
              simulatedCommission,
              regulatoryError: error.message,
              fallbackAt: new Date().toISOString()
            })
          }
        });
        
        console.log('✅ Simulated order execution completed');
        
        return res.json({
          success: true,
          message: userErrorMessage,
          data: {
            orderId: trade.id,
            status: 'executed',
            timestamp: trade.timestamp,
            executionMode: 'simulation',
            warnings: [...validation.warnings, '因监管限制已切换到模拟交易模式']
          }
        });
      }
      
      // Update trade record to show execution error
      await prisma.trade.update({
        where: { id: trade.id },
        data: {
          status: 'failed',
          notes: JSON.stringify({
            ...JSON.parse(trade.notes || '{}'),
            executionError: userErrorMessage,
            errorType: error.constructor.name,
            errorCategory: errorCategory,
            exchangeId: targetExchangeId,
            failedAt: new Date().toISOString(),
            rawError: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      });
      
      // Return user-friendly error response
      return res.status(400).json({
        success: false,
        message: userErrorMessage,
        error: {
          type: error.constructor.name,
          category: errorCategory,
          exchange: errorExchangeId
        }
      });
    }

    res.json({
      success: true,
      message: 'Order placed successfully',
      data: {
        orderId: trade.id,
        status: trade.status,
        timestamp: trade.timestamp,
        warnings: validation.warnings.length > 0 ? validation.warnings : undefined
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

    // Find or create manual strategy for closing positions
    let manualStrategy = await prisma.strategy.findFirst({
      where: {
        userId: req.user!.id,
        name: 'Manual Trading'
      }
    });

    if (!manualStrategy) {
      manualStrategy = await prisma.strategy.create({
        data: {
          name: 'Manual Trading',
          description: 'Manual trading orders placed through the trading panel',
          code: '// Manual trading strategy',
          type: 'manual',
          status: 'active',
          userId: req.user!.id
        }
      });
    }

    // In a real implementation, this would find the open position and close it
    // For now, we'll create a closing trade record
    
    const closingTrade = await prisma.trade.create({
      data: {
        strategyId: manualStrategy.id,
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

// Get orders (simplified endpoint for frontend compatibility)
router.get('/orders/simple', authenticate, async (req: AuthRequest, res) => {
  try {
    const trades = await prisma.trade.findMany({
      where: {
        userId: req.user!.id
      },
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
      take: 50 // Limit to recent 50 orders
    });

    res.json({
      success: true,
      message: 'Orders retrieved successfully',
      data: trades
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

// Get order history - updated to match frontend expected format
router.get('/orders', authenticate, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['all', 'pending', 'executed', 'cancelled', 'failed']).withMessage('Invalid status'),
  query('accountId').optional().isString().withMessage('Account ID must be a string')
], async (req: AuthRequest, res) => {
  try {
    console.log('📋 GET ORDERS ENDPOINT CALLED');
    console.log('📋 Request query:', req.query);
    console.log('📋 User info:', req.user);
    
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
    const accountId = req.query.accountId as string;
    const offset = (page - 1) * limit;

    const whereClause: any = {
      userId: req.user!.id
    };

    if (status !== 'all') {
      whereClause.status = status;
    }
    
    if (accountId) {
      whereClause.accountId = accountId;
    }

    console.log('📋 Where clause:', whereClause);

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
          pnl: true,
          notes: true
        },
        orderBy: {
          timestamp: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.trade.count({ where: whereClause })
    ]);

    console.log('📋 Found trades:', trades.length);

    // Format trades to match frontend expected format
    const formattedTrades = trades.map(trade => {
      const notes = JSON.parse(trade.notes || '{}');
      return {
        id: trade.id,
        symbol: trade.symbol,
        type: trade.side === 'long' ? 'buy' : 'sell',
        orderType: notes.orderType || 'limit',
        quantity: trade.quantity,
        price: trade.price,
        status: trade.status === 'executed' ? '已成交' : 
               trade.status === 'pending' ? '待成交' : 
               trade.status === 'failed' ? '失败' : trade.status,
        timestamp: trade.timestamp,
        createdAt: trade.timestamp,
        exchangeOrderId: notes.exchangeOrderId,
        filledQuantity: notes.filledQuantity,
        averagePrice: notes.averagePrice,
        commission: trade.commission
      };
    });

    const response = {
      success: true,
      message: 'Orders retrieved successfully',
      data: {
        orders: formattedTrades,
        total,
        page,
        limit
      }
    };

    console.log('📋 Sending response:', JSON.stringify(response, null, 2));
    
    res.json(response);
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

// Get account balance
router.get('/balance', authenticate, async (req: AuthRequest, res) => {
  try {
    const { accountId } = req.query;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'Account ID is required'
      });
    }

    // Verify account exists and belongs to user
    const account = await prisma.account.findFirst({
      where: {
        id: accountId as string,
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

    // Calculate current balance based on trades
    const trades = await prisma.trade.findMany({
      where: {
        userId: req.user!.id,
        status: 'executed'
      }
    });

    const totalPnl = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalCommission = trades.reduce((sum, trade) => sum + (trade.commission || 0), 0);

    const balanceData = {
      accountId,
      totalBalance: account.balance + totalPnl - totalCommission,
      availableBalance: account.balance,
      totalPnl,
      totalCommission,
      currency: account.currency,
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      message: 'Balance retrieved successfully',
      data: balanceData
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch balance',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get market data
router.get('/market-data', authenticate, async (req: AuthRequest, res) => {
  try {
    const { symbols } = req.query;
    
    // Default symbols if none provided
    const defaultSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
    const requestedSymbols = symbols ? (symbols as string).split(',') : defaultSymbols;

    // Mock market data (in real implementation, this would fetch from exchange API)
    const marketData = requestedSymbols.map(symbol => ({
      symbol,
      price: Math.random() * 50000 + 1000, // Mock price
      change24h: (Math.random() - 0.5) * 10, // Mock 24h change
      volume24h: Math.random() * 1000000, // Mock volume
      high24h: Math.random() * 50000 + 2000,
      low24h: Math.random() * 50000 + 500,
      timestamp: new Date()
    }));

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

// Cancel order
router.post('/order/cancel', authenticate, [
  body('orderId').notEmpty().withMessage('Order ID is required')
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

    const { orderId } = req.body;

    // Find and update the order
    const order = await prisma.trade.findFirst({
      where: {
        id: orderId,
        userId: req.user!.id,
        status: 'pending'
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or cannot be cancelled'
      });
    }

    await prisma.trade.update({
      where: { id: orderId },
      data: {
        status: 'cancelled',
        notes: JSON.stringify({
          ...JSON.parse(order.notes || '{}'),
          cancelledAt: new Date(),
          cancelledBy: 'user'
        })
      }
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        orderId,
        status: 'cancelled',
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Place stop-loss order
router.post('/order/stop-loss', authenticate, [
  body('accountId').notEmpty().withMessage('Account ID is required'),
  body('symbol').notEmpty().withMessage('Symbol is required'),
  body('side').isIn(['buy', 'sell']).withMessage('Invalid order side'),
  body('quantity').isFloat({ min: 0 }).withMessage('Quantity must be positive'),
  body('stopPrice').isFloat({ min: 0 }).withMessage('Stop price must be positive'),
  body('triggerPrice').optional().isFloat({ min: 0 }).withMessage('Trigger price must be positive'),
  body('limitPrice').optional().isFloat({ min: 0 }).withMessage('Limit price must be positive')
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

    const { accountId, symbol, side, quantity, stopPrice, triggerPrice, limitPrice } = req.body;

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

    // Validate stop-loss order
    const stopLossData = {
      accountId,
      symbol,
      type: limitPrice ? 'stop_limit' : 'stop',
      side,
      amount: quantity.toString(),
      stopPrice: stopPrice.toString(),
      price: limitPrice?.toString(),
      triggerPrice: triggerPrice?.toString(),
      userId: req.user!.id,
      orderType: 'stop_loss'
    };

    const validation = await riskManagementService.validateOrder(stopLossData);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Stop-loss order validation failed',
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    // Find or create manual strategy for stop-loss orders
    let manualStrategy = await prisma.strategy.findFirst({
      where: {
        userId: req.user!.id,
        name: 'Manual Trading'
      }
    });

    if (!manualStrategy) {
      manualStrategy = await prisma.strategy.create({
        data: {
          name: 'Manual Trading',
          description: 'Manual trading orders placed through the trading panel',
          code: '// Manual trading strategy',
          type: 'manual',
          status: 'active',
          userId: req.user!.id
        }
      });
    }

    // Use validated order data
    const finalOrderData = validation.adjustedOrder || stopLossData;

    // Create stop-loss order record
    const stopLossOrder = await prisma.trade.create({
      data: {
        strategyId: manualStrategy.id,
        userId: req.user!.id,
        symbol,
        type: side,
        side: side === 'buy' ? 'long' : 'short',
        quantity: parseFloat(finalOrderData.amount),
        price: parseFloat(finalOrderData.price) || 0,
        timestamp: new Date(),
        status: 'pending',
        accountId: accountId,
        notes: JSON.stringify({
          orderType: 'stop_loss',
          accountId,
          stopPrice: finalOrderData.stopPrice,
          triggerPrice: finalOrderData.triggerPrice,
          limitPrice: finalOrderData.price,
          validationWarnings: validation.warnings
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

    // Start monitoring for stop-loss trigger
    startStopLossMonitoring(stopLossOrder.id, finalOrderData);

    res.json({
      success: true,
      message: 'Stop-loss order placed successfully',
      data: {
        orderId: stopLossOrder.id,
        status: stopLossOrder.status,
        timestamp: stopLossOrder.timestamp,
        stopPrice: finalOrderData.stopPrice,
        limitPrice: finalOrderData.price,
        warnings: validation.warnings.length > 0 ? validation.warnings : undefined
      }
    });
  } catch (error) {
    console.error('Error placing stop-loss order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to place stop-loss order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update stop-loss order
router.put('/order/stop-loss/:orderId', authenticate, [
  body('stopPrice').optional().isFloat({ min: 0 }).withMessage('Stop price must be positive'),
  body('limitPrice').optional().isFloat({ min: 0 }).withMessage('Limit price must be positive'),
  body('quantity').optional().isFloat({ min: 0 }).withMessage('Quantity must be positive')
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

    const { orderId } = req.params;
    const { stopPrice, limitPrice, quantity } = req.body;

    // Find the stop-loss order
    const order = await prisma.trade.findFirst({
      where: {
        id: orderId,
        userId: req.user!.id,
        status: 'pending'
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Stop-loss order not found or cannot be modified'
      });
    }

    // Parse existing order notes
    const notes = JSON.parse(order.notes || '{}');
    
    // Update order data
    const updatedOrder = {
      ...order,
      quantity: quantity || order.quantity,
      notes: JSON.stringify({
        ...notes,
        stopPrice: stopPrice || notes.stopPrice,
        limitPrice: limitPrice || notes.limitPrice,
        updatedAt: new Date()
      })
    };

    // Validate updated order
    const validation = await riskManagementService.validateOrder({
      accountId: notes.accountId,
      symbol: order.symbol,
      type: notes.limitPrice ? 'stop_limit' : 'stop',
      side: order.side,
      amount: updatedOrder.quantity.toString(),
      stopPrice: (stopPrice || notes.stopPrice).toString(),
      price: limitPrice?.toString(),
      userId: req.user!.id,
      orderType: 'stop_loss'
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Stop-loss order update validation failed',
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    // Update the order
    const updated = await prisma.trade.update({
      where: { id: orderId },
      data: updatedOrder
    });

    res.json({
      success: true,
      message: 'Stop-loss order updated successfully',
      data: {
        orderId: updated.id,
        status: updated.status,
        timestamp: updated.timestamp,
        stopPrice: validation.adjustedOrder?.stopPrice || stopPrice || notes.stopPrice,
        limitPrice: validation.adjustedOrder?.price || limitPrice || notes.limitPrice,
        warnings: validation.warnings
      }
    });
  } catch (error) {
    console.error('Error updating stop-loss order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stop-loss order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get stop-loss orders
router.get('/orders/stop-loss', authenticate, async (req: AuthRequest, res) => {
  try {
    const { accountId } = req.query;

    const whereClause: any = {
      userId: req.user!.id,
      notes: {
        path: ['orderType'],
        equals: 'stop_loss'
      }
    };

    if (accountId) {
      whereClause.notes = {
        path: ['accountId'],
        equals: accountId
      };
    }

    const stopLossOrders = await prisma.trade.findMany({
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
        notes: true
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    // Parse notes to extract stop-loss specific data
    const formattedOrders = stopLossOrders.map(order => {
      const notes = JSON.parse(order.notes || '{}');
      return {
        ...order,
        stopPrice: notes.stopPrice,
        limitPrice: notes.limitPrice,
        triggerPrice: notes.triggerPrice,
        accountId: notes.accountId
      };
    });

    res.json({
      success: true,
      message: 'Stop-loss orders retrieved successfully',
      data: formattedOrders
    });
  } catch (error) {
    console.error('Error fetching stop-loss orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stop-loss orders',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Stop-loss monitoring function
function startStopLossMonitoring(orderId: string, orderData: any): void {
  try {
    // Start monitoring price movements
    const monitoringInterval = setInterval(async () => {
      try {
        // Get current market price (mock implementation)
        const currentPrice = Math.random() * 1000 + 40000; // Mock price
        const stopPrice = parseFloat(orderData.stopPrice);
        const side = orderData.side;

        // Check if stop-loss should be triggered
        let shouldTrigger = false;
        
        if (side === 'sell' && currentPrice <= stopPrice) {
          shouldTrigger = true; // Stop-loss for long position
        } else if (side === 'buy' && currentPrice >= stopPrice) {
          shouldTrigger = true; // Stop-loss for short position
        }

        if (shouldTrigger) {
          clearInterval(monitoringInterval);
          
          // Execute stop-loss order
          await executeStopLossOrder(orderId, orderData, currentPrice);
        }
      } catch (error) {
        console.error('Error monitoring stop-loss order:', error);
      }
    }, 5000); // Check every 5 seconds

    // Store monitoring interval reference for cleanup
    global.stopLossMonitors = global.stopLossMonitors || {};
    global.stopLossMonitors[orderId] = monitoringInterval;

  } catch (error) {
    console.error('Error starting stop-loss monitoring:', error);
  }
}

// Execute stop-loss order
async function executeStopLossOrder(orderId: string, orderData: any, triggerPrice: number): Promise<void> {
  try {
    const executionPrice = orderData.price ? parseFloat(orderData.price) : triggerPrice;
    
    // Update order status
    await prisma.trade.update({
      where: { id: orderId },
      data: {
        status: 'executed',
        price: executionPrice,
        notes: JSON.stringify({
          ...JSON.parse(orderData.notes || '{}'),
          executedAt: new Date(),
          triggerPrice,
          executionPrice
        })
      }
    });

    console.log(`Stop-loss order ${orderId} executed at price ${executionPrice}`);

    // Clean up monitoring
    if (global.stopLossMonitors && global.stopLossMonitors[orderId]) {
      clearInterval(global.stopLossMonitors[orderId]);
      delete global.stopLossMonitors[orderId];
    }
  } catch (error) {
    console.error('Error executing stop-loss order:', error);
  }
}

// Get positions by account
router.get('/positions/by-account', authenticate, async (req: AuthRequest, res) => {
  try {
    const { accountId } = req.query;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'Account ID is required'
      });
    }

    // Verify account exists and belongs to user
    const account = await prisma.account.findFirst({
      where: {
        id: accountId as string,
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

    // Get mock positions (in real implementation, this would fetch from broker API)
    const positions = [
      {
        id: 'pos_1',
        symbol: 'BTCUSDT',
        side: 'long',
        quantity: 0.5,
        entryPrice: 45000,
        currentPrice: 46500,
        pnl: 750,
        pnlPercentage: 1.67,
        timestamp: new Date(),
        accountId
      },
      {
        id: 'pos_2',
        symbol: 'ETHUSDT',
        side: 'short',
        quantity: 2.0,
        entryPrice: 3200,
        currentPrice: 3100,
        pnl: 200,
        pnlPercentage: 3.13,
        timestamp: new Date(),
        accountId
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

export default router;