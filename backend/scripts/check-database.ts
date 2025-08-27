import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 检查数据库连接和数据...');
    
    // 检查用户数据
    const userCount = await prisma.user.count();
    console.log(`👥 用户数量: ${userCount}`);
    
    // 检查策略数据
    const strategyCount = await prisma.strategy.count();
    console.log(`📊 策略数量: ${strategyCount}`);
    
    // 检查市场数据
    const marketDataCount = await prisma.marketData.count();
    console.log(`📈 市场数据记录: ${marketDataCount}`);
    
    // 检查回测数据
    const backtestCount = await prisma.backtest.count();
    console.log(`🧪 回测记录: ${backtestCount}`);
    
    // 检查交易数据
    const tradeCount = await prisma.trade.count();
    console.log(`💼 交易记录: ${tradeCount}`);
    
    // 检查最新的市场数据
    if (marketDataCount > 0) {
      const latestData = await prisma.marketData.findFirst({
        orderBy: { timestamp: 'desc' }
      });
      console.log(`📅 最新数据时间: ${latestData?.timestamp}`);
      console.log(`💰 最新价格: ${latestData?.close}`);
    }
    
    // 检查是否有BTC数据
    const btcData = await prisma.marketData.findFirst({
      where: { symbol: 'BTCUSDT' }
    });
    console.log(`₿ BTC数据存在: ${btcData ? '是' : '否'}`);
    
    console.log('✅ 数据库检查完成');
    
  } catch (error) {
    console.error('❌ 数据库检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();