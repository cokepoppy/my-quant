import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  PORT: process.env.PORT || 8001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://quant:quant123@localhost:5432/quant_trading',
  
  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // API Keys
  JUHE_API_KEY: process.env.JUHE_API_KEY || '',
  TUSHARE_TOKEN: process.env.TUSHARE_TOKEN || '',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3001',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // File Upload
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 10 * 1024 * 1024, // 10MB
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  
  // WebSocket
  WS_PORT: process.env.WS_PORT || 8001,
  
  // BullMQ
  BULLMQ_PREFIX: process.env.BULLMQ_PREFIX || 'quant-trading',
  
  // Timezone
  TIMEZONE: process.env.TIMEZONE || 'Asia/Shanghai',
  
  // Validation
  validate() {
    const required = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET'];
    const missing = required.filter(key => !this[key as keyof typeof config]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
};

export default config;