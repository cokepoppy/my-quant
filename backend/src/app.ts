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
import tradingRoutes from './routes/trading';
import monitoringRoutes from './routes/monitoring';

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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/strategies', strategyRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/backtest', backtestRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/monitoring', monitoringRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Setup Real-time Data Service
let realTimeDataService: RealTimeDataService | null = null;

// Initialize real-time data service after server starts
server.on('listening', () => {
  realTimeDataService = new RealTimeDataService(server);
  console.log('🔌 Real-time data service initialized');
});

// Start server
const PORT = config.PORT;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${config.NODE_ENV}`);
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