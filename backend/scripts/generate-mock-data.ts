import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateMockMarketData() {
  try {
    console.log('📈 生成模拟市场数据...');
    
    const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');
    
    let totalRecords = 0;
    
    for (const symbol of symbols) {
      console.log(`🔄 处理 ${symbol}...`);
      
      const records = [];
      let currentPrice = symbol === 'BTCUSDT' ? 45000 : 
                        symbol === 'ETHUSDT' ? 2500 : 300;
      
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        // 生成每日数据
        const change = (Math.random() - 0.5) * 0.1; // ±5% 日内波动
        const open = currentPrice;
        const close = currentPrice * (1 + change);
        const high = Math.max(open, close) * (1 + Math.random() * 0.02);
        const low = Math.min(open, close) * (1 - Math.random() * 0.02);
        const volume = Math.random() * 1000000 + 100000;
        
        records.push({
          symbol,
          timestamp: new Date(currentDate),
          open,
          high,
          low,
          close,
          volume,
          interval: '1d',
          source: 'generated'
        });
        
        currentPrice = close;
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // 批量插入数据
      await prisma.marketData.createMany({
        data: records,
        skipDuplicates: true
      });
      
      totalRecords += records.length;
      console.log(`✅ ${symbol}: ${records.length} 条记录`);
    }
    
    console.log(`🎉 总共生成 ${totalRecords} 条市场数据`);
    
  } catch (error) {
    console.error('❌ 生成数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateMockMarketData();