import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

const prisma = new PrismaClient();

async function initDatabase() {
  try {
    console.log('🚀 Starting database initialization...');
    
    // 1. Generate Prisma client
    console.log('📦 Generating Prisma client...');
    await execAsync('npx prisma generate');
    console.log('✅ Prisma client generated');
    
    // 2. Run database migrations
    console.log('🔄 Running database migrations...');
    try {
      await execAsync('npx prisma migrate dev --name init');
      console.log('✅ Database migrations completed');
    } catch (error) {
      console.log('⚠️  Migration failed, trying push...');
      await execAsync('npx prisma db push');
      console.log('✅ Database schema pushed');
    }
    
    // 3. Test connection
    console.log('🔗 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // 4. Create TimescaleDB hypertable for market data
    console.log('📊 Creating TimescaleDB hypertable...');
    try {
      await prisma.$executeRaw`
        SELECT create_hypertable('market_data', 'timestamp', if_not_exists => TRUE);
      `;
      console.log('✅ TimescaleDB hypertable created');
    } catch (error) {
      console.log('⚠️  TimescaleDB hypertable creation skipped (may already exist)');
    }
    
    // 5. Create indexes for better performance
    console.log('📈 Creating database indexes...');
    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_market_data_symbol_timestamp 
        ON market_data (symbol, timestamp DESC);
      `;
      
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_market_data_interval 
        ON market_data (interval);
      `;
      
      console.log('✅ Database indexes created');
    } catch (error) {
      console.log('⚠️  Index creation skipped:', error);
    }
    
    // 6. Insert some sample data
    console.log('📝 Inserting sample data...');
    try {
      // Check if admin user exists
      const adminExists = await prisma.user.findUnique({
        where: { email: 'admin@example.com' }
      });
      
      if (!adminExists) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await prisma.user.create({
          data: {
            email: 'admin@example.com',
            username: 'admin',
            password: hashedPassword,
            role: 'admin'
          }
        });
        console.log('✅ Admin user created (admin@example.com / admin123)');
      } else {
        console.log('ℹ️  Admin user already exists');
      }
      
      // Create sample strategy
      const strategyExists = await prisma.strategy.findFirst();
      if (!strategyExists) {
        await prisma.strategy.create({
          data: {
            name: 'Sample Moving Average Strategy',
            description: 'A simple moving average crossover strategy',
            code: `
function maStrategy(data, params) {
  const { shortPeriod = 10, longPeriod = 30 } = params;
  
  // Calculate moving averages
  const shortMA = calculateMA(data, shortPeriod);
  const longMA = calculateMA(data, longPeriod);
  
  // Generate signals
  const signals = [];
  for (let i = longPeriod; i < data.length; i++) {
    if (shortMA[i] > longMA[i] && shortMA[i-1] <= longMA[i-1]) {
      signals.push({ type: 'buy', index: i });
    } else if (shortMA[i] < longMA[i] && shortMA[i-1] >= longMA[i-1]) {
      signals.push({ type: 'sell', index: i });
    }
  }
  
  return signals;
}

function calculateMA(data, period) {
  const ma = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    ma.push(sum / period);
  }
  return ma;
}
            `,
            type: 'technical',
            status: 'draft',
            userId: adminExists?.id || 'admin'
          }
        });
        console.log('✅ Sample strategy created');
      }
      
    } catch (error) {
      console.log('⚠️  Sample data insertion failed:', error);
    }
    
    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  initDatabase();
}

export { initDatabase };