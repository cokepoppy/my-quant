import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

import config from './config';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import RealTimeDataService from './services/realTimeData';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import strategyRoutes from './routes/strategies';
import dataRoutes from './routes/data';
import backtestRoutes from './routes/backtest';
import backtestV2Routes from './routes/backtest-v2';
import tradingRoutes from './routes/trading';
import exchangeRoutes from './routes/exchange';
import riskRoutes from './routes/risk';
import monitoringRoutes from './routes/monitoring';
import systemRoutes from './routes/system';
import dataTestRoutes from './routes/data-simple'
import tradingLogsRoutes from './routes/trading-logs';
import multiExchangeRoutes from './routes/multi-exchange';
import { exchangeService } from './exchanges/ExchangeService';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const server = createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Debug endpoint
app.get('/debug', (req, res) => {
  res.json({
    message: 'Debug endpoint working',
    routes: app._router.stack.map(layer => layer.route?.path).filter(Boolean)
  });
});

// Bybit API debug endpoint
app.get('/debug-bybit', async (req, res) => {
  try {
    console.log('🧪 Bybit API Debug endpoint called');
    
    // Test with the first available exchange
    const exchanges = exchangeService.getAllExchangeStatuses();
    const exchangeIds = Object.keys(exchanges);
    
    if (exchangeIds.length === 0) {
      return res.json({
        success: false,
        message: 'No exchanges available'
      });
    }
    
    const exchangeId = exchangeIds[0];
    console.log(`🔍 Testing with exchange: ${exchangeId}`);
    
    // Test getTicker
    console.log('📈 Testing getTicker...');
    try {
      const ticker = await exchangeService.getTicker(exchangeId, 'BTC/USDT');
      console.log('✅ getTicker success:', ticker);
    } catch (error) {
      console.log('❌ getTicker failed:', error.message);
    }
    
    // Test getBalance
    console.log('💰 Testing getBalance...');
    try {
      const balance = await exchangeService.getBalance(exchangeId);
      console.log('✅ getBalance success:', balance);
    } catch (error) {
      console.log('❌ getBalance failed:', error.message);
    }
    
    // Test getPositions
    console.log('📊 Testing getPositions...');
    try {
      const positions = await exchangeService.getPositions(exchangeId);
      console.log('✅ getPositions success:', positions);
    } catch (error) {
      console.log('❌ getPositions failed:', error.message);
    }
    
    // Test getOrders
    console.log('📋 Testing getOrders...');
    try {
      const orders = await exchangeService.getOrders(exchangeId);
      console.log('✅ getOrders success:', orders);
    } catch (error) {
      console.log('❌ getOrders failed:', error.message);
    }
    
    res.json({
      success: true,
      message: 'Bybit API debug test completed',
      exchangeId: exchangeId
    });
    
  } catch (error) {
    console.error('❌ Debug endpoint failed:', error);
    res.json({
      success: false,
      message: error.message
    });
  }
});

// API Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/strategies', strategyRoutes);
app.use('/data', dataRoutes);
app.use('/backtest', backtestRoutes);
app.use('/backtest-v2', backtestV2Routes);
app.use('/trading', tradingRoutes);
app.use('/exchange', exchangeRoutes);
app.use('/risk', riskRoutes);
app.use('/monitoring', monitoringRoutes);
app.use('/system', systemRoutes);
app.use('/data-test', dataTestRoutes);
app.use('/trading-logs', tradingLogsRoutes);
app.use('/multi-exchange', multiExchangeRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Import Socket.IO setup
import { setupSocketIO } from './socket';

// Setup Socket.IO handlers
const socketHandlers = setupSocketIO(io);

// Setup Real-time Data Service
let realTimeDataService: RealTimeDataService | null = null;

// Initialize real-time data service after server starts
server.on('listening', () => {
  realTimeDataService = new RealTimeDataService(server);
  console.log('🔌 Real-time data service initialized');
  console.log('🔄 Trading WebSocket handler initialized');
});

// Start server
const PORT = config.PORT;
server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${config.NODE_ENV}`);
  
  // Load exchanges from database on startup
  exchangeService.loadExchangesFromDatabase().catch(error => {
    console.error('Failed to load exchanges on startup:', error);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

export { app, io };