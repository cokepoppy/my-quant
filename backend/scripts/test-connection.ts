import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔗 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test query
    const userCount = await prisma.user.count();
    console.log(`📊 Found ${userCount} users in database`);
    
    // Test TimescaleDB extension
    try {
      const result = await prisma.$queryRaw`
        SELECT extname FROM pg_extension WHERE extname = 'timescaledb'
      `;
      console.log('📈 TimescaleDB extension:', Array.isArray(result) && result.length > 0 ? '✅ Active' : '❌ Not found');
    } catch (error) {
      console.log('⚠️  TimescaleDB check failed:', error);
    }
    
    console.log('🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();