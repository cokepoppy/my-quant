import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

class RealTimeDataService {
  private io: SocketIOServer;
  private prisma: PrismaClient;
  private marketDataInterval: NodeJS.Timeout | null = null;
  private systemMetricsInterval: NodeJS.Timeout | null = null;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });
    
    this.prisma = new PrismaClient();
    this.initializeSocketHandlers();
    this.startDataStreams();
  }

  private initializeSocketHandlers() {
    // Authentication middleware
    this.io.use((socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        socket.userId = decoded.id;
        socket.username = decoded.username;
        next();
      } catch (err) {
        next(new Error('Invalid token'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User connected: ${socket.username} (${socket.userId})`);

      // Join user-specific room
      socket.join(`user:${socket.userId}`);

      // Handle market data subscription
      socket.on('subscribe:market', (data) => {
        this.handleMarketDataSubscription(socket, data);
      });

      // Handle market data unsubscription
      socket.on('unsubscribe:market', (data) => {
        this.handleMarketDataUnsubscription(socket, data);
      });

      // Handle strategy updates subscription
      socket.on('subscribe:strategies', () => {
        socket.join('strategies_updates');
        this.sendStrategyUpdates(socket);
      });

      // Handle trading updates subscription
      socket.on('subscribe:trading', () => {
        socket.join('trading_updates');
        this.sendTradingUpdates(socket);
      });

      // Handle system metrics subscription
      socket.on('subscribe:metrics', () => {
        socket.join('system_metrics');
        this.sendSystemMetrics(socket);
      });

      // Handle custom alerts subscription
      socket.on('subscribe:alerts', () => {
        socket.join(`alerts:${socket.userId}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.username} (${socket.userId})`);
      });

      // Send initial data
      this.sendInitialData(socket);
    });
  }

  private startDataStreams() {
    // Start market data stream (every 2 seconds)
    this.marketDataInterval = setInterval(() => {
      this.broadcastMarketData();
    }, 2000);

    // Start system metrics stream (every 5 seconds)
    this.systemMetricsInterval = setInterval(() => {
      this.broadcastSystemMetrics();
    }, 5000);

    // Start trade updates stream (every 3 seconds)
    setInterval(() => {
      this.broadcastTradeUpdates();
    }, 3000);

    // Start strategy status updates (every 10 seconds)
    setInterval(() => {
      this.broadcastStrategyStatus();
    }, 10000);
  }

  private async sendInitialData(socket: AuthenticatedSocket) {
    try {
      // Send user's accounts
      const accounts = await this.prisma.account.findMany({
        where: {
          userId: socket.userId,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          type: true,
          balance: true,
          currency: true
        }
      });

      socket.emit('initial:accounts', accounts);

      // Send user's strategies
      const strategies = await this.prisma.strategy.findMany({
        where: {
          userId: socket.userId
        },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      });

      socket.emit('initial:strategies', strategies);

      // Send recent trades
      const recentTrades = await this.prisma.trade.findMany({
        where: {
          userId: socket.userId
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 10,
        select: {
          id: true,
          symbol: true,
          type: true,
          side: true,
          quantity: true,
          price: true,
          status: true,
          timestamp: true
        }
      });

      socket.emit('initial:trades', recentTrades);

      console.log(`Initial data sent to user: ${socket.username}`);
    } catch (error) {
      console.error('Error sending initial data:', error);
      socket.emit('error', { message: 'Failed to load initial data' });
    }
  }

  private handleMarketDataSubscription(socket: AuthenticatedSocket, data: { symbols: string[] }) {
    const { symbols } = data;
    
    if (!symbols || !Array.isArray(symbols)) {
      socket.emit('error', { message: 'Invalid symbols data' });
      return;
    }

    // Join symbol-specific rooms
    symbols.forEach(symbol => {
      socket.join(`market:${symbol}`);
    });

    console.log(`User ${socket.username} subscribed to market data for: ${symbols.join(', ')}`);
    
    // Send current market data for subscribed symbols
    this.sendCurrentMarketData(socket, symbols);
  }

  private handleMarketDataUnsubscription(socket: AuthenticatedSocket, data: { symbols: string[] }) {
    const { symbols } = data;
    
    if (!symbols || !Array.isArray(symbols)) {
      socket.emit('error', { message: 'Invalid symbols data' });
      return;
    }

    // Leave symbol-specific rooms
    symbols.forEach(symbol => {
      socket.leave(`market:${symbol}`);
    });

    console.log(`User ${socket.username} unsubscribed from market data for: ${symbols.join(', ')}`);
  }

  private async sendCurrentMarketData(socket: AuthenticatedSocket, symbols: string[]) {
    try {
      const marketData = await this.generateMarketData(symbols);
      socket.emit('market:data', marketData);
    } catch (error) {
      console.error('Error sending market data:', error);
    }
  }

  private async broadcastMarketData() {
    try {
      // Get all subscribed symbols
      const subscribedSymbols = this.getSubscribedSymbols();
      
      if (subscribedSymbols.length === 0) return;

      const marketData = await this.generateMarketData(subscribedSymbols);
      
      // Broadcast to each symbol's room
      subscribedSymbols.forEach(symbol => {
        this.io.to(`market:${symbol}`).emit('market:data', {
          [symbol]: marketData[symbol]
        });
      });
    } catch (error) {
      console.error('Error broadcasting market data:', error);
    }
  }

  private async generateMarketData(symbols: string[]) {
    const marketData: any = {};
    const basePrices: any = {
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

    for (const symbol of symbols) {
      const basePrice = basePrices[symbol] || 100;
      const currentPrice = basePrice + (Math.random() - 0.5) * basePrice * 0.01;
      const prevClose = basePrice;
      const change = currentPrice - prevClose;
      const changePercent = (change / prevClose) * 100;

      marketData[symbol] = {
        symbol,
        price: currentPrice,
        prevClose,
        change,
        changePercent,
        volume: Math.floor(Math.random() * 1000000),
        high24h: currentPrice * 1.02,
        low24h: currentPrice * 0.98,
        timestamp: new Date(),
        bid: currentPrice * 0.999,
        ask: currentPrice * 1.001
      };
    }

    return marketData;
  }

  private async broadcastSystemMetrics() {
    try {
      const metrics = this.generateSystemMetrics();
      this.io.to('system_metrics').emit('system:metrics', metrics);
    } catch (error) {
      console.error('Error broadcasting system metrics:', error);
    }
  }

  private generateSystemMetrics() {
    const { cpus, totalmem, freemem } = require('os');
    const totalMemory = totalmem();
    const freeMemory = freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      cpu: {
        usage: Math.random() * 100,
        cores: cpus().length,
        loadAverage: [Math.random() * 2, Math.random() * 2, Math.random() * 2]
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        usage: (usedMemory / totalMemory) * 100
      },
      disk: {
        total: 100 * 1024 * 1024 * 1024,
        used: Math.random() * 100 * 1024 * 1024 * 1024,
        free: Math.random() * 100 * 1024 * 1024 * 1024,
        usage: Math.random() * 100
      },
      uptime: process.uptime(),
      timestamp: new Date()
    };
  }

  private async broadcastTradeUpdates() {
    try {
      // Generate some mock trade updates
      const tradeUpdates = this.generateTradeUpdates();
      
      if (tradeUpdates.length > 0) {
        this.io.to('trading_updates').emit('trading:updates', tradeUpdates);
      }
    } catch (error) {
      console.error('Error broadcasting trade updates:', error);
    }
  }

  private generateTradeUpdates() {
    const updates: any[] = [];
    
    // Generate 1-3 random trade updates
    const numUpdates = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numUpdates; i++) {
      const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const types = ['buy', 'sell'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      updates.push({
        id: `trade_${Date.now()}_${i}`,
        symbol,
        type,
        quantity: Math.random() * 2,
        price: this.getSymbolPrice(symbol),
        timestamp: new Date(),
        status: 'executed'
      });
    }
    
    return updates;
  }

  private getSymbolPrice(symbol: string): number {
    const prices: any = {
      'BTCUSDT': 45000,
      'ETHUSDT': 3200,
      'BNBUSDT': 320
    };
    return prices[symbol] || 100;
  }

  private async broadcastStrategyStatus() {
    try {
      // Get strategy status updates
      const strategyUpdates = await this.getStrategyStatusUpdates();
      
      if (strategyUpdates.length > 0) {
        this.io.to('strategies_updates').emit('strategies:status', strategyUpdates);
      }
    } catch (error) {
      console.error('Error broadcasting strategy status:', error);
    }
  }

  private async getStrategyStatusUpdates() {
    // In a real implementation, this would query the database for strategy status changes
    // For now, generate mock updates
    return [
      {
        strategyId: 'strategy_1',
        status: 'active',
        performance: {
          profitRate: (Math.random() - 0.5) * 10,
          totalTrades: Math.floor(Math.random() * 100),
          winRate: Math.random() * 100
        },
        timestamp: new Date()
      }
    ];
  }

  private async sendStrategyUpdates(socket: AuthenticatedSocket) {
    try {
      const strategies = await this.prisma.strategy.findMany({
        where: {
          userId: socket.userId
        },
        select: {
          id: true,
          name: true,
          status: true,
          type: true,
          createdAt: true,
          updatedAt: true
        }
      });

      socket.emit('strategies:list', strategies);
    } catch (error) {
      console.error('Error sending strategy updates:', error);
    }
  }

  private async sendTradingUpdates(socket: AuthenticatedSocket) {
    try {
      const accounts = await this.prisma.account.findMany({
        where: {
          userId: socket.userId,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          balance: true,
          currency: true
        }
      });

      const recentTrades = await this.prisma.trade.findMany({
        where: {
          userId: socket.userId
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 5,
        select: {
          id: true,
          symbol: true,
          type: true,
          quantity: true,
          price: true,
          timestamp: true
        }
      });

      socket.emit('trading:accounts', accounts);
      socket.emit('trading:recent', recentTrades);
    } catch (error) {
      console.error('Error sending trading updates:', error);
    }
  }

  private async sendSystemMetrics(socket: AuthenticatedSocket) {
    try {
      const metrics = this.generateSystemMetrics();
      socket.emit('system:metrics', metrics);
    } catch (error) {
      console.error('Error sending system metrics:', error);
    }
  }

  private getSubscribedSymbols(): string[] {
    // This would track which symbols have active subscriptions
    // For now, return a default list
    return ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
  }

  // Public methods for external event emission
  public emitTradeUpdate(tradeData: any) {
    this.io.to('trading_updates').emit('trading:update', tradeData);
  }

  public emitStrategyUpdate(strategyData: any) {
    this.io.to('strategies_updates').emit('strategies:update', strategyData);
  }

  public emitAlert(alertData: any) {
    this.io.emit('alert:new', alertData);
  }

  public emitSystemAlert(alertData: any) {
    this.io.to('system_metrics').emit('system:alert', alertData);
  }

  // Cleanup method
  public destroy() {
    if (this.marketDataInterval) {
      clearInterval(this.marketDataInterval);
    }
    if (this.systemMetricsInterval) {
      clearInterval(this.systemMetricsInterval);
    }
  }
}

export default RealTimeDataService;