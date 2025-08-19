import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}

export const setupSocketIO = (io: Server) => {
  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      
      if (token) {
        const decoded = jwt.verify(token.replace('Bearer ', ''), config.JWT_SECRET) as any;
        socket.user = decoded;
      }
      
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.id}`);
    
    if (socket.user) {
      console.log(`Authenticated user: ${socket.user.username}`);
      
      // Join user-specific room
      socket.join(`user:${socket.user.id}`);
      
      // Join role-based room
      socket.join(`role:${socket.user.role}`);
    }

    // Handle market data subscription
    socket.on('subscribe_market_data', (symbols: string[]) => {
      console.log(`User ${socket.id} subscribed to market data for symbols:`, symbols);
      symbols.forEach(symbol => {
        socket.join(`market:${symbol}`);
      });
    });

    // Handle market data unsubscription
    socket.on('unsubscribe_market_data', (symbols: string[]) => {
      console.log(`User ${socket.id} unsubscribed from market data for symbols:`, symbols);
      symbols.forEach(symbol => {
        socket.leave(`market:${symbol}`);
      });
    });

    // Handle strategy status subscription
    socket.on('subscribe_strategy_status', (strategyIds: string[]) => {
      console.log(`User ${socket.id} subscribed to strategy status:`, strategyIds);
      strategyIds.forEach(id => {
        socket.join(`strategy:${id}`);
      });
    });

    // Handle custom events
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  // Utility functions for broadcasting
  return {
    broadcastMarketData: (symbol: string, data: any) => {
      io.to(`market:${symbol}`).emit('market_data', { symbol, data });
    },
    
    broadcastStrategyStatus: (strategyId: string, status: any) => {
      io.to(`strategy:${strategyId}`).emit('strategy_status', { strategyId, status });
    },
    
    sendToUser: (userId: string, event: string, data: any) => {
      io.to(`user:${userId}`).emit(event, data);
    },
    
    sendToRole: (role: string, event: string, data: any) => {
      io.to(`role:${role}`).emit(event, data);
    },
    
    broadcastSystemAlert: (alert: any) => {
      io.emit('system_alert', alert);
    }
  };
};