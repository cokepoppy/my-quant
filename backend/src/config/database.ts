import { PrismaClient } from '@prisma/client';
import config from '../config';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, use globalThis to prevent multiple instances
  const globalWithPrisma = globalThis as typeof globalThis & {
    prisma: PrismaClient | undefined;
  };
  
  if (!globalWithPrisma.prisma) {
    globalWithPrisma.prisma = new PrismaClient();
  }
  
  prisma = globalWithPrisma.prisma;
}

// Test database connection
export const testConnection = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test TimescaleDB extension
    const result = await prisma.$queryRaw`
      SELECT extname FROM pg_extension WHERE extname = 'timescaledb'
    `;
    
    if (Array.isArray(result) && result.length > 0) {
      console.log('✅ TimescaleDB extension is active');
    } else {
      console.log('⚠️  TimescaleDB extension not found. Some features may not work properly.');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

export default prisma;