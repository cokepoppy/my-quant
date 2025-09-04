import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { body, query, validationResult } from 'express-validator';
import { exchangeService } from '../exchanges/ExchangeService';
import { ExchangeConfig } from '../exchanges/types';

const router = Router();
const prisma = new PrismaClient();

console.log('Exchange management routes loaded');

// 重新加载交易所实例
router.post('/reload', authenticate, async (req: AuthRequest, res) => {
  try {
    await exchangeService.loadExchangesFromDatabase();
    res.json({
      success: true,
      message: 'Exchanges reloaded successfully'
    });
  } catch (error) {
    console.error('Error reloading exchanges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reload exchanges',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 测试连接配置
router.post('/test', [
  body('exchange').isIn(['binance', 'okx', 'bybit']).withMessage('Invalid exchange'),
  body('apiKey').notEmpty().withMessage('API key is required'),
  body('apiSecret').notEmpty().withMessage('API secret is required'),
  body('testnet').optional().isBoolean().withMessage('Testnet must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { exchange, apiKey, apiSecret, passphrase, testnet = false } = req.body;

    // 创建交易所配置
    const exchangeConfig: ExchangeConfig = {
      id: exchange,
      name: exchange.charAt(0).toUpperCase() + exchange.slice(1),
      apiKey,
      apiSecret,
      passphrase,
      testnet,
      enableRateLimit: true
    };

    // 测试连接
    const connectionSuccess = await exchangeService.testConnection(exchangeConfig);
    
    if (connectionSuccess) {
      res.json({
        success: true,
        message: 'Connection test successful'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Connection test failed'
      });
    }
  } catch (error) {
    console.error('Error testing connection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test connection',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 获取所有账户
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user!.id },
      include: {
        balances: true,
        positions: true,
        orders: {
          where: { status: { in: ['pending', 'open'] } },
          orderBy: { createTime: 'desc' },
          take: 10
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      message: 'Accounts retrieved successfully',
      data: accounts
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch accounts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 创建账户
router.post('/', authenticate, [
  body('name').notEmpty().withMessage('Account name is required'),
  body('exchange').isIn(['binance', 'okx', 'bybit']).withMessage('Invalid exchange'),
  body('type').isIn(['demo', 'live']).withMessage('Invalid account type'),
  body('apiKey').notEmpty().withMessage('API key is required'),
  body('apiSecret').notEmpty().withMessage('API secret is required'),
  body('testnet').isBoolean().withMessage('Testnet must be boolean')
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

    const { name, exchange, type, apiKey, apiSecret, passphrase, testnet } = req.body;

    // 创建唯一的交易所实例ID（支持同一交易所类型的多个账户）
    const instanceId = `${exchange}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const exchangeConfig: ExchangeConfig = {
      id: instanceId,
      name: exchange.charAt(0).toUpperCase() + exchange.slice(1),
      apiKey,
      apiSecret,
      passphrase,
      testnet,
      enableRateLimit: true
    };

    // 测试连接并添加交易所实例
    const connectionSuccess = await exchangeService.addExchange(exchangeConfig);
    if (!connectionSuccess) {
      return res.status(400).json({
        success: false,
        message: 'Failed to connect to exchange'
      });
    }

    // 创建账户记录
    const account = await prisma.account.create({
      data: {
        userId: req.user!.id,
        name,
        exchange,
        type,
        accountId: instanceId, // 存储交易所实例ID
        apiKey,
        apiSecret,
        passphrase,
        testnet,
        balance: 0, // 初始余额为0，后续同步时会更新
        syncStatus: 'connected'
      }
    });

    // 同步初始数据
    try {
      const syncResult = await exchangeService.syncExchangeData(exchangeConfig.id);
      
      if (syncResult.success) {
        // 更新账户同步状态
        await prisma.account.update({
          where: { id: account.id },
          data: {
            syncStatus: 'connected',
            lastSyncAt: new Date()
          }
        });
      }
    } catch (syncError) {
      console.error('Initial sync failed:', syncError);
    }

    res.json({
      success: true,
      message: 'Account created successfully',
      data: account
    });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create account',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 更新账户
router.put('/:id', authenticate, [
  body('name').optional().notEmpty().withMessage('Account name cannot be empty'),
  body('apiKey').optional().notEmpty().withMessage('API key cannot be empty'),
  body('apiSecret').optional().notEmpty().withMessage('API secret cannot be empty')
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
    const { name, apiKey, apiSecret, passphrase, isActive } = req.body;

    // 检查账户所有权
    const account = await prisma.account.findFirst({
      where: { id, userId: req.user!.id }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // 如果修改了API信息，需要重新测试连接
    if (apiKey || apiSecret) {
      const exchangeConfig: ExchangeConfig = {
        id: account.exchange,
        name: account.exchange.charAt(0).toUpperCase() + account.exchange.slice(1),
        apiKey: apiKey || account.apiKey!,
        apiSecret: apiSecret || account.apiSecret!,
        passphrase: passphrase || account.passphrase || undefined,
        testnet: account.testnet,
        enableRateLimit: true
      };

      // 移除旧连接
      await exchangeService.removeExchange(account.exchange);
      
      // 测试新连接
      const connectionSuccess = await exchangeService.addExchange(exchangeConfig);
      if (!connectionSuccess) {
        return res.status(400).json({
          success: false,
          message: 'Failed to connect to exchange with new credentials'
        });
      }
    }

    // 更新账户信息
    const updatedAccount = await prisma.account.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(apiKey && { apiKey }),
        ...(apiSecret && { apiSecret }),
        ...(passphrase !== undefined && { passphrase }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({
      success: true,
      message: 'Account updated successfully',
      data: updatedAccount
    });
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update account',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 删除账户
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // 检查账户所有权
    const account = await prisma.account.findFirst({
      where: { id, userId: req.user!.id }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // 移除交易所连接
    await exchangeService.removeExchange(account.exchange);

    // 删除账户
    await prisma.account.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 连接账户
router.post('/:id/connect', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // 检查账户所有权
    const account = await prisma.account.findFirst({
      where: { id, userId: req.user!.id }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // 创建交易所配置
    const exchangeConfig: ExchangeConfig = {
      id: account.exchange,
      name: account.exchange.charAt(0).toUpperCase() + account.exchange.slice(1),
      apiKey: account.apiKey!,
      apiSecret: account.apiSecret!,
      passphrase: account.passphrase || undefined,
      testnet: account.testnet,
      enableRateLimit: true
    };

    // 连接交易所
    const connected = await exchangeService.connectExchange(exchangeConfig.id);
    
    if (connected) {
      // 更新账户状态
      await prisma.account.update({
        where: { id },
        data: {
          syncStatus: 'connected',
          lastSyncAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Account connected successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to connect account'
      });
    }
  } catch (error) {
    console.error('Error connecting account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect account',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 断开账户连接
router.post('/:id/disconnect', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // 检查账户所有权
    const account = await prisma.account.findFirst({
      where: { id, userId: req.user!.id }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // 断开交易所连接
    await exchangeService.disconnectExchange(account.exchange);

    // 更新账户状态
    await prisma.account.update({
      where: { id },
      data: {
        syncStatus: 'disconnected'
      }
    });

    res.json({
      success: true,
      message: 'Account disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect account',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 同步账户数据
router.post('/:id/sync', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // 检查账户所有权
    const account = await prisma.account.findFirst({
      where: { id, userId: req.user!.id }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // 更新同步状态
    await prisma.account.update({
      where: { id },
      data: {
        syncStatus: 'syncing'
      }
    });

    // 同步数据
    const syncResult = await exchangeService.syncExchangeData(account.exchange);

    if (syncResult.success) {
      // 更新账户状态
      await prisma.account.update({
        where: { id },
        data: {
          syncStatus: 'connected',
          lastSyncAt: new Date(syncResult.timestamp)
        }
      });

      res.json({
        success: true,
        message: 'Account data synced successfully',
        data: syncResult
      });
    } else {
      // 更新账户状态
      await prisma.account.update({
        where: { id },
        data: {
          syncStatus: 'error',
          errorLog: { message: syncResult.error, timestamp: syncResult.timestamp }
        }
      });

      res.status(400).json({
        success: false,
        message: 'Failed to sync account data',
        error: syncResult.error
      });
    }
  } catch (error) {
    console.error('Error syncing account:', error);
    
    // 更新账户状态
    await prisma.account.update({
      where: { id },
      data: {
        syncStatus: 'error',
        errorLog: { 
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now()
        }
      }
    });

    res.status(500).json({
      success: false,
      message: 'Failed to sync account data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 获取账户余额
router.get('/:id/balance', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // 检查账户所有权
    const account = await prisma.account.findFirst({
      where: { id, userId: req.user!.id }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // 获取余额数据
    const balances = await exchangeService.getBalance(account.accountId);

    // 更新数据库中的余额数据
    await prisma.balance.deleteMany({
      where: { accountId: id }
    });

    for (const balance of balances) {
      await prisma.balance.create({
        data: {
          accountId: id,
          asset: balance.asset,
          free: balance.free,
          locked: balance.used,
          total: balance.total,
          valueInUSD: balance.valueInUSD
        }
      });
    }

    res.json({
      success: true,
      message: 'Balance retrieved successfully',
      data: balances
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

// 获取账户持仓
router.get('/:id/positions', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // 检查账户所有权
    const account = await prisma.account.findFirst({
      where: { id, userId: req.user!.id }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // 获取持仓数据
    const positions = await exchangeService.getPositions(account.accountId);

    // 更新数据库中的持仓数据
    await prisma.position.deleteMany({
      where: { accountId: id }
    });

    for (const position of positions) {
      await prisma.position.create({
        data: {
          accountId: id,
          symbol: position.symbol,
          side: position.side,
          size: position.size,
          entryPrice: position.entryPrice,
          markPrice: position.markPrice,
          pnl: position.pnl,
          roe: position.roe,
          leverage: position.leverage,
          margin: position.margin,
          liquidationPrice: position.liquidationPrice,
          status: position.status,
          exchangeId: position.exchangeId
        }
      });
    }

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

// 获取账户订单
router.get('/:id/orders', authenticate, [
  query('status').optional().isIn(['all', 'open', 'closed']).withMessage('Invalid status'),
  query('symbol').optional().isString().withMessage('Symbol must be a string'),
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
    const { status = 'all', symbol, limit = 50 } = req.query;

    // 检查账户所有权
    const account = await prisma.account.findFirst({
      where: { id, userId: req.user!.id }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    let orders: any[] = [];

    // 获取订单数据
    if (status === 'open') {
      orders = await exchangeService.getOpenOrders(account.exchange, symbol as string);
    } else if (status === 'closed') {
      orders = await exchangeService.getClosedOrders(account.exchange, symbol as string, Number(limit));
    } else {
      orders = await exchangeService.getOrders(account.exchange, symbol as string);
    }

    res.json({
      success: true,
      message: 'Orders retrieved successfully',
      data: orders
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

// 创建订单
router.post('/:id/orders', authenticate, [
  body('symbol').notEmpty().withMessage('Symbol is required'),
  body('type').isIn(['market', 'limit', 'stop', 'stop_limit', 'take_profit']).withMessage('Invalid order type'),
  body('side').isIn(['buy', 'sell']).withMessage('Invalid order side'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be positive'),
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

    const { id } = req.params;
    const orderData = req.body;

    // 检查账户所有权
    const account = await prisma.account.findFirst({
      where: { id, userId: req.user!.id }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // 创建订单
    const order = await exchangeService.placeOrder(account.exchange, orderData);

    // 保存订单到数据库
    await prisma.order.create({
      data: {
        accountId: id,
        exchangeId: order.exchangeId,
        symbol: order.symbol,
        type: order.type,
        side: order.side,
        quantity: order.amount,
        price: order.price,
        stopPrice: order.stopPrice,
        status: order.status,
        filledQuantity: order.filled,
        averagePrice: order.average,
        commission: order.fee,
        feeCurrency: order.feeCurrency,
        createTime: new Date(order.createTime),
        updateTime: order.updateTime ? new Date(order.updateTime) : undefined,
        metadata: order.metadata
      }
    });

    res.json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 取消订单
router.delete('/:id/orders/:orderId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id, orderId } = req.params;

    // 检查账户所有权
    const account = await prisma.account.findFirst({
      where: { id, userId: req.user!.id }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // 取消订单
    const success = await exchangeService.cancelOrder(account.exchange, orderId);

    if (success) {
      // 更新订单状态
      await prisma.order.updateMany({
        where: { 
          accountId: id,
          exchangeId: orderId
        },
        data: {
          status: 'cancelled',
          updateTime: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Order cancelled successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to cancel order'
      });
    }
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 获取市场数据
router.get('/:id/market/:symbol/ticker', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id, symbol } = req.params;

    // 检查账户所有权
    const account = await prisma.account.findFirst({
      where: { id, userId: req.user!.id }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // 获取行情数据
    const ticker = await exchangeService.getTicker(account.exchange, symbol);

    res.json({
      success: true,
      message: 'Ticker retrieved successfully',
      data: ticker
    });
  } catch (error) {
    console.error('Error fetching ticker:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticker',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 获取订单簿
router.get('/:id/market/:symbol/orderbook', authenticate, [
  query('limit').optional().isInt({ min: 5, max: 100 }).withMessage('Limit must be between 5 and 100')
], async (req: AuthRequest, res) => {
  try {
    const { id, symbol } = req.params;
    const { limit = 20 } = req.query;

    // 检查账户所有权
    const account = await prisma.account.findFirst({
      where: { id, userId: req.user!.id }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // 获取订单簿数据
    const orderbook = await exchangeService.getOrderBook(account.exchange, symbol, Number(limit));

    res.json({
      success: true,
      message: 'Orderbook retrieved successfully',
      data: orderbook
    });
  } catch (error) {
    console.error('Error fetching orderbook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orderbook',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 获取K线数据
router.get('/:id/market/:symbol/ohlcv', authenticate, [
  query('timeframe').optional().isIn(['1m', '5m', '15m', '30m', '1h', '4h', '1d']).withMessage('Invalid timeframe'),
  query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('Limit must be between 1 and 500')
], async (req: AuthRequest, res) => {
  try {
    const { id, symbol } = req.params;
    const { timeframe = '1h', limit = 100 } = req.query;

    // 检查账户所有权
    const account = await prisma.account.findFirst({
      where: { id, userId: req.user!.id }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // 获取K线数据
    const ohlcv = await exchangeService.getOHLCV(account.exchange, symbol, timeframe as string, Number(limit));

    res.json({
      success: true,
      message: 'OHLCV data retrieved successfully',
      data: ohlcv
    });
  } catch (error) {
    console.error('Error fetching OHLCV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch OHLCV',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;