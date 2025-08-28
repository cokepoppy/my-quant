import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class BacktestEngine {
  async runBacktest(strategy: any, marketData: any[], parameters: any) {
    console.log('🚀 开始回测计算...');
    console.log(`📊 策略: ${strategy.name}`);
    console.log(`📈 数据点数: ${marketData.length}`);
    console.log(`💰 初始资金: ${parameters.initialCapital}`);
    
    const trades = [];
    let capital = parameters.initialCapital || 10000;
    let position = 0;
    let entryPrice = 0;

    // Simple moving average crossover strategy
    const shortPeriod = parameters.shortPeriod || 10;
    const longPeriod = parameters.longPeriod || 30;

    console.log(`⚙️ 策略参数: 短周期=${shortPeriod}, 长周期=${longPeriod}`);
    console.log('📋 开始逐个K线计算...\n');

    for (let i = longPeriod; i < marketData.length; i++) {
      const currentData = marketData[i];
      const shortMA = this.calculateMA(marketData.slice(i - shortPeriod + 1, i + 1));
      const longMA = this.calculateMA(marketData.slice(i - longPeriod + 1, i + 1));

      // 只在有交易信号时打印详细信息
      if (shortMA > longMA && position <= 0) {
        // Buy signal
        position = capital * 0.1 / currentData.close;
        entryPrice = currentData.close;
        capital -= position * currentData.close;
        
        trades.push({
          timestamp: currentData.timestamp,
          type: 'buy',
          price: currentData.close,
          quantity: position,
          notes: 'SMA crossover buy signal'
        });
        
        console.log(`📈 [${currentData.timestamp.toISOString().split('T')[0]}] 买入信号`);
        console.log(`   价格: $${currentData.close.toFixed(2)}`);
        console.log(`   数量: ${position.toFixed(6)}`);
        console.log(`   短MA: ${shortMA.toFixed(2)}, 长MA: ${longMA.toFixed(2)}`);
        console.log(`   剩余资金: $${capital.toFixed(2)}`);
        console.log('');
        
      } else if (shortMA < longMA && position > 0) {
        // Sell signal
        const sellPrice = currentData.close;
        const tradeProfit = (sellPrice - entryPrice) * position;
        capital += position * currentData.close;
        
        trades.push({
          timestamp: currentData.timestamp,
          type: 'sell',
          price: currentData.close,
          quantity: position,
          notes: 'SMA crossover sell signal'
        });
        
        const profitPercent = ((sellPrice - entryPrice) / entryPrice) * 100;
        console.log(`📉 [${currentData.timestamp.toISOString().split('T')[0]}] 卖出信号`);
        console.log(`   价格: $${currentData.close.toFixed(2)}`);
        console.log(`   数量: ${position.toFixed(6)}`);
        console.log(`   交易盈亏: $${tradeProfit.toFixed(2)} (${profitPercent.toFixed(2)}%)`);
        console.log(`   短MA: ${shortMA.toFixed(2)}, 长MA: ${longMA.toFixed(2)}`);
        console.log(`   总资金: $${capital.toFixed(2)}`);
        console.log('');
        
        position = 0;
      }
    }

    // Calculate performance metrics
    const finalCapital = capital + position * marketData[marketData.length - 1].close;
    const totalReturn = (finalCapital - parameters.initialCapital) / parameters.initialCapital;
    const winRate = this.calculateWinRate(trades);
    const maxDrawdown = this.calculateMaxDrawdown(marketData, trades);

    console.log('🎯 回测计算完成!');
    console.log('📊 性能指标:');
    console.log(`   初始资金: $${parameters.initialCapital.toFixed(2)}`);
    console.log(`   最终资金: $${finalCapital.toFixed(2)}`);
    console.log(`   总收益率: ${(totalReturn * 100).toFixed(2)}%`);
    console.log(`   交易次数: ${trades.length}`);
    console.log(`   胜率: ${(winRate * 100).toFixed(2)}%`);
    console.log(`   最大回撤: ${(maxDrawdown * 100).toFixed(2)}%`);
    console.log(`   夏普比率: ${(totalReturn / 0.15).toFixed(2)}`);
    console.log('');

    const results = {
      finalCapital,
      totalReturn,
      sharpeRatio: totalReturn / 0.15,
      maxDrawdown,
      winRate,
      totalTrades: trades.length,
      trades
    };

    return results;
  }

  calculateMA(data: any[]) {
    const sum = data.reduce((acc, item) => acc + item.close, 0);
    return sum / data.length;
  }

  calculateWinRate(trades: any[]) {
    if (trades.length === 0) return 0;
    
    let wins = 0;
    for (let i = 0; i < trades.length; i += 2) {
      if (i + 1 < trades.length) {
        const buy = trades[i];
        const sell = trades[i + 1];
        if (sell.price > buy.price) wins++;
      }
    }
    return wins / (trades.length / 2);
  }

  calculateMaxDrawdown(marketData: any[], trades: any[]) {
    let maxDrawdown = 0;
    let peak = marketData[0].close;
    
    for (const data of marketData) {
      if (data.close > peak) peak = data.close;
      const drawdown = (peak - data.close) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    return maxDrawdown;
  }
}

async function demonstrateBacktestCalculation() {
  try {
    console.log('🧪 回测计算过程演示\n');
    
    // 获取市场数据
    console.log('📈 获取市场数据...');
    const marketData = await prisma.marketData.findMany({
      where: { symbol: 'BTCUSDT' },
      orderBy: { timestamp: 'asc' },
      take: 100 // 限制数据量用于演示
    });
    
    console.log(`✅ 获取到 ${marketData.length} 条BTCUSDT数据\n`);
    
    if (marketData.length === 0) {
      console.log('❌ 没有市场数据，无法进行回测');
      return;
    }
    
    // 创建回测引擎
    const engine = new BacktestEngine();
    
    // 模拟策略
    const strategy = {
      id: 'demo-strategy',
      name: '双均线策略演示',
      code: 'SMA Crossover Strategy'
    };
    
    // 回测参数
    const parameters = {
      initialCapital: 10000,
      shortPeriod: 5,
      longPeriod: 15
    };
    
    // 运行回测
    console.log('🎬 开始回测演示...\n');
    const results = await engine.runBacktest(strategy, marketData, parameters);
    
    console.log('🎉 回测演示完成！');
    console.log('💼 详细交易记录:');
    results.trades.forEach((trade, index) => {
      console.log(`   ${index + 1}. ${trade.type.toUpperCase()} - ${trade.timestamp.toISOString().split('T')[0]} - $${trade.price.toFixed(2)} - ${trade.quantity.toFixed(6)}`);
    });
    
    console.log('\n📋 总结:');
    console.log(`   策略: ${strategy.name}`);
    console.log(`   数据: ${marketData.length} 条BTCUSDT日线数据`);
    console.log(`   参数: 短周期${parameters.shortPeriod}, 长周期${parameters.longPeriod}`);
    console.log(`   结果: ${results.totalReturn > 0 ? '盈利' : '亏损'} ${(results.totalReturn * 100).toFixed(2)}%`);
    
  } catch (error) {
    console.error('❌ 演示失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

demonstrateBacktestCalculation();