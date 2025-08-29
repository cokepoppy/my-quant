import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { exchangeService } from '../exchanges/ExchangeService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  accountId?: string;
}

export class TradingWebSocketHandler {
  private io: Server;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> socketId set
  private accountSubscriptions: Map<string, Set<string>> = new Map(); // accountId -> socketId set

  constructor(io: Server) {
    this.io = io;
    this.setupAuthentication();
    this.setupEventHandlers();
    this.setupExchangeEventHandlers();
  }

  private setupAuthentication(): void {
    this.io.use((socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        socket.userId = decoded.userId;
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected for trading`);
      
      // Track user connections
      if (!this.userSockets.has(socket.userId!)) {
        this.userSockets.set(socket.userId!, new Set());
      }
      this.userSockets.get(socket.userId!)!.add(socket.id);

      // Handle account subscription
      socket.on('subscribe:account', async (data: { accountId: string }) => {
        await this.handleAccountSubscription(socket, data.accountId);
      });

      // Handle symbol subscription
      socket.on('subscribe:symbol', async (data: { accountId: string; symbol: string }) => {
        await this.handleSymbolSubscription(socket, data.accountId, data.symbol);
      });

      // Handle order placement
      socket.on('place:order', async (data: { accountId: string; order: any }) => {
        await this.handlePlaceOrder(socket, data.accountId, data.order);
      });

      // Handle order cancellation
      socket.on('cancel:order', async (data: { accountId: string; orderId: string; symbol?: string }) => {
        await this.handleCancelOrder(socket, data.accountId, data.orderId, data.symbol);
      });

      // Handle connection status requests
      socket.on('request:status', async (data: { accountId: string }) => {
        await this.sendStatusUpdate(socket, data.accountId);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnection(socket);
      });
    });
  }

  private setupExchangeEventHandlers(): void {
    // 监听所有交易所事件
    exchangeService.onEvent('connected', (event) => {
      this.broadcastToAccount(event.exchange, 'exchange:connected', {
        exchange: event.exchange,
        timestamp: event.timestamp
      });
    });

    exchangeService.onEvent('disconnected', (event) => {
      this.broadcastToAccount(event.exchange, 'exchange:disconnected', {
        exchange: event.exchange,
        timestamp: event.timestamp
      });
    });

    exchangeService.onEvent('error', (event) => {
      this.broadcastToAccount(event.exchange, 'exchange:error', {
        exchange: event.exchange,
        error: event.data.error,
        timestamp: event.timestamp
      });
    });

    exchangeService.onEvent('order_update', (event) => {
      this.broadcastToAccount(event.exchange, 'order:update', {
        exchange: event.exchange,
        order: event.data,
        timestamp: event.timestamp
      });
    });

    exchangeService.onEvent('balance_update', (event) => {
      this.broadcastToAccount(event.exchange, 'balance:update', {
        exchange: event.exchange,
        balance: event.data,
        timestamp: event.timestamp
      });
    });

    exchangeService.onEvent('position_update', (event) => {
      this.broadcastToAccount(event.exchange, 'position:update', {
        exchange: event.exchange,
        position: event.data,
        timestamp: event.timestamp
      });
    });

    exchangeService.onEvent('ticker_update', (event) => {
      this.broadcastToSymbol(event.exchange, event.data.symbol, 'ticker:update', {
        exchange: event.exchange,
        symbol: event.data.symbol,
        ticker: event.data.ticker,
        timestamp: event.timestamp
      });
    });

    exchangeService.onEvent('trade_update', (event) => {
      this.broadcastToSymbol(event.exchange, event.data.symbol, 'trade:update', {
        exchange: event.exchange,
        symbol: event.data.symbol,
        trade: event.data.trade,
        timestamp: event.timestamp
      });
    });

    exchangeService.onEvent('orderbook_update', (event) => {
      this.broadcastToSymbol(event.exchange, event.data.symbol, 'orderbook:update', {
        exchange: event.exchange,
        symbol: event.data.symbol,
        orderbook: event.data.orderbook,
        timestamp: event.timestamp
      });
    });
  }

  private async handleAccountSubscription(socket: AuthenticatedSocket, accountId: string): Promise<void> {
    try {
      // 验证账户所有权
      const account = await prisma.account.findFirst({
        where: {
          id: accountId,
          userId: socket.userId
        }
      });

      if (!account) {
        socket.emit('error', { message: 'Account not found or access denied' });
        return;
      }

      // 添加到账户订阅
      if (!this.accountSubscriptions.has(accountId)) {
        this.accountSubscriptions.set(accountId, new Set());
      }
      this.accountSubscriptions.get(accountId)!.add(socket.id);

      // 连接到交易所
      await exchangeService.connectExchange(account.exchange);

      // 订阅账户相关的所有交易对
      const symbols = await this.getAccountSymbols(accountId);
      if (symbols.length > 0) {
        await exchangeService.subscribeMarketData(account.exchange, symbols);
      }

      // 发送初始数据
      await this.sendInitialData(socket, accountId);

      socket.emit('subscribed:account', { accountId, status: 'success' });
    } catch (error) {
      console.error('Error handling account subscription:', error);
      socket.emit('error', { message: 'Failed to subscribe to account' });
    }
  }

  private async handleSymbolSubscription(socket: AuthenticatedSocket, accountId: string, symbol: string): Promise<void> {
    try {
      // 验证账户所有权
      const account = await prisma.account.findFirst({
        where: {
          id: accountId,
          userId: socket.userId
        }
      });

      if (!account) {
        socket.emit('error', { message: 'Account not found or access denied' });
        return;
      }

      // 订阅交易对数据
      await exchangeService.subscribeMarketData(account.exchange, [symbol]);

      socket.emit('subscribed:symbol', { accountId, symbol, status: 'success' });
    } catch (error) {
      console.error('Error handling symbol subscription:', error);
      socket.emit('error', { message: 'Failed to subscribe to symbol' });
    }
  }

  private async handlePlaceOrder(socket: AuthenticatedSocket, accountId: string, orderData: any): Promise<void> {
    try {
      // 验证账户所有权
      const account = await prisma.account.findFirst({
        where: {
          id: accountId,
          userId: socket.userId
        }
      });

      if (!account) {
        socket.emit('error', { message: 'Account not found or access denied' });
        return;
      }

      // 执行风控检查
      const riskCheck = await this.performRiskCheck(accountId, orderData);
      if (!riskCheck.passed) {
        socket.emit('order:rejected', {
          accountId,
          reason: riskCheck.reason,
          timestamp: Date.now()
        });
        return;
      }

      // 下单
      const order = await exchangeService.placeOrder(account.exchange, orderData);

      // 保存订单到数据库
      await this.saveOrderToDatabase(accountId, order);

      socket.emit('order:placed', {
        accountId,
        order,
        timestamp: Date.now()
      });

      // 广播订单更新
      this.broadcastToAccount(accountId, 'order:placed', {
        accountId,
        order,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error placing order:', error);
      socket.emit('order:failed', {
        accountId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
    }
  }

  private async handleCancelOrder(socket: AuthenticatedSocket, accountId: string, orderId: string, symbol?: string): Promise<void> {
    try {
      // 验证账户所有权
      const account = await prisma.account.findFirst({
        where: {
          id: accountId,
          userId: socket.userId
        }
      });

      if (!account) {
        socket.emit('error', { message: 'Account not found or access denied' });
        return;
      }

      // 取消订单
      const success = await exchangeService.cancelOrder(account.exchange, orderId, symbol);

      if (success) {
        // 更新数据库中的订单状态
        await this.updateOrderStatus(accountId, orderId, 'cancelled');

        socket.emit('order:cancelled', {
          accountId,
          orderId,
          timestamp: Date.now()
        });

        // 广播订单更新
        this.broadcastToAccount(accountId, 'order:cancelled', {
          accountId,
          orderId,
          timestamp: Date.now()
        });
      } else {
        socket.emit('order:cancel_failed', {
          accountId,
          orderId,
          error: 'Failed to cancel order',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      socket.emit('order:cancel_failed', {
        accountId,
        orderId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
    }
  }

  private async sendStatusUpdate(socket: AuthenticatedSocket, accountId: string): Promise<void> {
    try {
      const status = exchangeService.getExchangeStatus(accountId);
      socket.emit('status:update', {
        accountId,
        status,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error sending status update:', error);
    }
  }

  private async sendInitialData(socket: AuthenticatedSocket, accountId: string): Promise<void> {
    try {
      // 获取账户信息
      const account = await prisma.account.findUnique({
        where: { id: accountId },
        include: {
          user: {
            select: { id: true, username: true }
          }
        }
      });

      if (!account) return;

      // 发送账户信息
      socket.emit('account:data', {
        accountId,
        account: {
          id: account.id,
          name: account.name,
          exchange: account.exchange,
          status: account.syncStatus,
          lastSyncAt: account.lastSyncAt
        },
        timestamp: Date.now()
      });

      // 获取并发送余额
      const balances = await exchangeService.getBalance(account.exchange);
      socket.emit('balance:data', {
        accountId,
        balances,
        timestamp: Date.now()
      });

      // 获取并发送持仓
      const positions = await exchangeService.getPositions(account.exchange);
      socket.emit('position:data', {
        accountId,
        positions,
        timestamp: Date.now()
      });

      // 获取并发送当前订单
      const orders = await exchangeService.getOpenOrders(account.exchange);
      socket.emit('order:data', {
        accountId,
        orders,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  }

  private async getAccountSymbols(accountId: string): Promise<string[]> {
    try {
      // 从数据库获取该账户的交易对
      const orders = await prisma.order.findMany({
        where: {
          accountId,
          status: { in: ['open', 'pending'] }
        },
        select: { symbol: true },
        distinct: ['symbol']
      });

      return orders.map(order => order.symbol);
    } catch (error) {
      console.error('Error getting account symbols:', error);
      return [];
    }
  }

  private async performRiskCheck(accountId: string, orderData: any): Promise<{ passed: boolean; reason?: string }> {
    try {
      // 检查账户权限
      const account = await prisma.account.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        return { passed: false, reason: 'Account not found' };
      }

      // 检查API权限
      if (account.apiPermissions) {
        const permissions = account.apiPermissions as any;
        if (permissions.trading !== true) {
          return { passed: false, reason: 'Trading not permitted for this account' };
        }
      }

      // 检查订单大小限制
      if (orderData.amount && account.maxOrderSize) {
        if (parseFloat(orderData.amount) > account.maxOrderSize) {
          return { passed: false, reason: 'Order size exceeds maximum allowed' };
        }
      }

      // 检查日交易限制
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayTrades = await prisma.trade.count({
        where: {
          accountId,
          createdAt: { gte: today }
        }
      });

      if (account.dailyTradeLimit && todayTrades >= account.dailyTradeLimit) {
        return { passed: false, reason: 'Daily trade limit exceeded' };
      }

      return { passed: true };
    } catch (error) {
      console.error('Error performing risk check:', error);
      return { passed: false, reason: 'Risk check failed' };
    }
  }

  private async saveOrderToDatabase(accountId: string, order: any): Promise<void> {
    try {
      await prisma.order.create({
        data: {
          accountId,
          exchangeOrderId: order.id,
          symbol: order.symbol,
          type: order.type,
          side: order.side,
          amount: order.amount.toString(),
          price: order.price?.toString(),
          status: order.status,
          filled: order.filled?.toString() || '0',
          remaining: order.remaining?.toString() || order.amount.toString(),
          average: order.average?.toString(),
          cost: order.cost?.toString(),
          fee: order.fee?.toString(),
          feeCurrency: order.feeCurrency,
          clientOrderId: order.clientOrderId,
          exchangeId: order.exchangeId,
          metadata: order.metadata
        }
      });
    } catch (error) {
      console.error('Error saving order to database:', error);
    }
  }

  private async updateOrderStatus(accountId: string, orderId: string, status: string): Promise<void> {
    try {
      await prisma.order.updateMany({
        where: {
          accountId,
          OR: [
            { exchangeOrderId: orderId },
            { id: orderId }
          ]
        },
        data: { status }
      });
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  }

  private broadcastToAccount(accountId: string, event: string, data: any): void {
    const sockets = this.accountSubscriptions.get(accountId);
    if (sockets) {
      sockets.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  private broadcastToSymbol(exchangeId: string, symbol: string, event: string, data: any): void {
    // 广播给所有订阅了该交易对的用户
    this.io.emit(event, data);
  }

  private handleDisconnection(socket: AuthenticatedSocket): void {
    console.log(`User ${socket.userId} disconnected from trading`);
    
    // 清理用户连接记录
    if (socket.userId && this.userSockets.has(socket.userId)) {
      this.userSockets.get(socket.userId)!.delete(socket.id);
      if (this.userSockets.get(socket.userId)!.size === 0) {
        this.userSockets.delete(socket.userId);
      }
    }

    // 清理账户订阅记录
    this.accountSubscriptions.forEach((sockets, accountId) => {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        this.accountSubscriptions.delete(accountId);
      }
    });
  }

  // 公共方法，供外部使用
  public getConnectedUsers(): number {
    return this.userSockets.size;
  }

  public getAccountSubscriptions(): number {
    return this.accountSubscriptions.size;
  }

  public getUserAccounts(userId: string): string[] {
    const accounts: string[] = [];
    this.accountSubscriptions.forEach((sockets, accountId) => {
      if (sockets.size > 0) {
        accounts.push(accountId);
      }
    });
    return accounts;
  }
}