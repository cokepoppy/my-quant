#!/usr/bin/env node

// 检查最近的交易记录
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecentTrades() {
  try {
    console.log('🔍 检查最近的交易记录...\n');

    const recentTrades = await prisma.trade.findMany({
      where: {
        status: 'executed'
      },
      orderBy: { timestamp: 'desc' },
      take: 5,
      include: {
        user: {
          select: {
            username: true
          }
        }
      }
    });

    if (recentTrades.length === 0) {
      console.log('📝 没有找到已执行的交易记录');
      return;
    }

    console.log('📈 最近的交易记录:');
    const now = Date.now();
    
    recentTrades.forEach((trade, index) => {
      const tradeTime = new Date(trade.timestamp).getTime();
      const timeAgo = Math.floor((now - tradeTime) / 1000);
      
      console.log(`\n${index + 1}. 📊 交易详情:`);
      console.log(`   - 用户: ${trade.user.username}`);
      console.log(`   - 交易对: ${trade.symbol}`);
      console.log(`   - 方向: ${trade.side === 'long' ? '买入' : '卖出'}`);
      console.log(`   - 数量: ${trade.quantity}`);
      console.log(`   - 价格: ${trade.price}`);
      console.log(`   - 状态: ${trade.status}`);
      console.log(`   - 时间: ${trade.timestamp.toLocaleString()}`);
      console.log(`   - 距今: ${timeAgo} 秒`);
    });

    // 计算距离上次交易的时间
    if (recentTrades.length > 0) {
      const lastTrade = recentTrades[0];
      const lastTradeTime = new Date(lastTrade.timestamp).getTime();
      const timeSinceLastTrade = Math.floor((now - lastTradeTime) / 1000);
      
      // 获取当前的冷却期设置
    const cooldownRule = await prisma.riskRule.findFirst({
      where: {
        type: 'cooldown',
        enabled: true
      }
    });

    const cooldownPeriod = cooldownRule?.parameters?.cooldownPeriod || 300;
    
    console.log(`\n⏰ 时间分析:`);
    console.log(`   - 距离上次交易已过去: ${timeSinceLastTrade} 秒`);
    console.log(`   - 冷却期要求: ${cooldownPeriod} 秒`);
    console.log(`   - 还需等待: ${Math.max(0, cooldownPeriod - timeSinceLastTrade)} 秒`);
    
    if (timeSinceLastTrade >= cooldownPeriod) {
      console.log(`   ✅ 可以立即交易！`);
    } else {
      console.log(`   ⏳ 需要等待 ${cooldownPeriod - timeSinceLastTrade} 秒`);
    }
    }

  } catch (error) {
    console.error('❌ 检查交易记录失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentTrades();