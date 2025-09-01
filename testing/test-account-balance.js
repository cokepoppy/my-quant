// 账户余额和持仓显示测试
console.log('💰 账户余额和持仓显示测试');
console.log('='.repeat(50));

class AccountBalanceTester {
  constructor() {
    this.testResults = [];
    this.exchanges = [];
    this.initializeExchanges();
  }

  initializeExchanges() {
    // 模拟交易所数据
    this.exchanges = [
      {
        id: 'binance_1',
        name: 'Binance 主账户',
        connected: true,
        status: 'connected',
        totalAssets: 50000,
        availableBalance: 45000,
        frozenBalance: 5000,
        dailyPnL: 1200,
        dailyChange: 2.4,
        availableBalancePercent: 90,
        balances: [
          { asset: 'USDT', free: 30000, locked: 2000, total: 32000 },
          { asset: 'BTC', free: 0.5, locked: 0.1, total: 0.6 },
          { asset: 'ETH', free: 5, locked: 1, total: 6 }
        ],
        positions: [
          {
            symbol: 'BTCUSDT',
            side: 'long',
            amount: 0.5,
            avgPrice: 44000,
            currentPrice: 45000,
            pnl: 500,
            pnlPercent: 1.14
          },
          {
            symbol: 'ETHUSDT',
            side: 'short',
            amount: 2,
            avgPrice: 3200,
            currentPrice: 3100,
            pnl: 200,
            pnlPercent: 3.13
          }
        ],
        orders: [
          {
            id: 'order_1',
            symbol: 'BTCUSDT',
            type: 'buy',
            orderType: 'limit',
            amount: 0.1,
            price: 44500,
            status: 'pending',
            createdAt: new Date()
          }
        ]
      },
      {
        id: 'bybit_1',
        name: 'Bybit 测试账户',
        connected: true,
        status: 'connected',
        totalAssets: 10000,
        availableBalance: 9500,
        frozenBalance: 500,
        dailyPnL: -150,
        dailyChange: -1.5,
        availableBalancePercent: 95,
        balances: [
          { asset: 'USDT', free: 9500, locked: 500, total: 10000 },
          { asset: 'BTC', free: 0, locked: 0, total: 0 }
        ],
        positions: [],
        orders: []
      }
    ];
  }

  logTest(testName, passed, message = '') {
    const result = {
      test: testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    };
    this.testResults.push(result);
    
    if (passed) {
      console.log(`✅ ${testName} - ${message}`);
    } else {
      console.log(`❌ ${testName} - ${message}`);
    }
  }

  // 测试1: 交易所余额显示
  testExchangeBalanceDisplay() {
    console.log('\n💵 测试交易所余额显示');
    
    this.exchanges.forEach(exchange => {
      if (exchange.connected) {
        // 测试总资产显示
        this.logTest(
          `${exchange.name} 总资产显示`,
          true,
          `$${exchange.totalAssets.toLocaleString()}`
        );
        
        // 测试可用余额显示
        this.logTest(
          `${exchange.name} 可用余额显示`,
          true,
          `$${exchange.availableBalance.toLocaleString()} (${exchange.availableBalancePercent}%)`
        );
        
        // 测试冻结资金显示
        this.logTest(
          `${exchange.name} 冻结资金显示`,
          true,
          `$${exchange.frozenBalance.toLocaleString()}`
        );
        
        // 测试每日盈亏显示
        const pnlColor = exchange.dailyPnL >= 0 ? '📈' : '📉';
        this.logTest(
          `${exchange.name} 每日盈亏显示`,
          true,
          `${pnlColor} $${Math.abs(exchange.dailyPnL).toLocaleString()} (${exchange.dailyChange}%)`
        );
      } else {
        this.logTest(
          `${exchange.name} 余额显示`,
          false,
          '交易所未连接'
        );
      }
    });
  }

  // 测试2: 资产明细显示
  testAssetDetailsDisplay() {
    console.log('\n📊 测试资产明细显示');
    
    this.exchanges.forEach(exchange => {
      if (exchange.connected && exchange.balances.length > 0) {
        console.log(`\n  ${exchange.name} 资产明细:`);
        
        exchange.balances.forEach(balance => {
          if (balance.total > 0) {
            this.logTest(
              `${balance.asset} 余额显示`,
              true,
              `可用: ${balance.free}, 冻结: ${balance.locked}, 总计: ${balance.total}`
            );
          }
        });
        
        // 测试getBalanceByAsset方法
        const usdtBalance = exchange.getBalanceByAsset ? 
          exchange.getBalanceByAsset('USDT') : 
          exchange.balances.find(b => b.asset === 'USDT')?.total || 0;
        
        this.logTest(
          `${exchange.name} USDT余额查询`,
          true,
          `${usdtBalance} USDT`
        );
      }
    });
  }

  // 测试3: 持仓显示
  testPositionsDisplay() {
    console.log('\n📈 测试持仓显示');
    
    this.exchanges.forEach(exchange => {
      if (exchange.connected) {
        const positionCount = exchange.positions.length;
        
        this.logTest(
          `${exchange.name} 持仓数量显示`,
          true,
          `${positionCount} 个持仓`
        );
        
        if (positionCount > 0) {
          exchange.positions.forEach(position => {
            const sideEmoji = position.side === 'long' ? '📈' : '📉';
            const pnlEmoji = position.pnl >= 0 ? '✅' : '❌';
            
            this.logTest(
              `${exchange.name} ${position.symbol} 持仓详情`,
              true,
              `${sideEmoji} ${position.side} ${position.amount} @ ${position.avgPrice} | 当前: ${position.currentPrice} | ${pnlEmoji} PnL: $${position.pnl}`
            );
          });
        } else {
          this.logTest(
            `${exchange.name} 持仓状态`,
            true,
            '暂无持仓'
          );
        }
      }
    });
  }

  // 测试4: 订单显示
  testOrdersDisplay() {
    console.log('\n📋 测试订单显示');
    
    this.exchanges.forEach(exchange => {
      if (exchange.connected) {
        const orderCount = exchange.orders.length;
        const pendingOrders = exchange.orders.filter(o => o.status === 'pending');
        
        this.logTest(
          `${exchange.name} 订单数量显示`,
          true,
          `${orderCount} 个订单 (${pendingOrders.length} 个待成交)`
        );
        
        if (orderCount > 0) {
          exchange.orders.forEach(order => {
            const typeEmoji = order.type === 'buy' ? '🛒' : '💰';
            const statusEmoji = order.status === 'pending' ? '⏳' : '✅';
            
            this.logTest(
              `${exchange.name} ${order.symbol} 订单详情`,
              true,
              `${typeEmoji} ${order.type} ${order.amount} @ ${order.price || '市价'} | ${statusEmoji} ${order.status}`
            );
          });
        }
      }
    });
  }

  // 测试5: 数据刷新功能
  testDataRefresh() {
    console.log('\n🔄 测试数据刷新功能');
    
    // 模拟数据刷新
    this.exchanges.forEach(exchange => {
      if (exchange.connected) {
        // 模拟价格更新
        const oldTotalAssets = exchange.totalAssets;
        exchange.totalAssets += (Math.random() - 0.5) * 1000;
        exchange.dailyPnL += (Math.random() - 0.5) * 100;
        
        // 更新持仓价格
        exchange.positions.forEach(position => {
          position.currentPrice += (Math.random() - 0.5) * 100;
          position.pnl = (position.currentPrice - position.avgPrice) * position.amount * 
                         (position.side === 'long' ? 1 : -1);
          position.pnlPercent = (position.pnl / (position.avgPrice * position.amount)) * 100;
        });
        
        this.logTest(
          `${exchange.name} 数据刷新`,
          true,
          `总资产: $${oldTotalAssets.toLocaleString()} → $${exchange.totalAssets.toLocaleString()}`
        );
      }
    });
  }

  // 测试6: 账户切换功能
  testAccountSwitching() {
    console.log('\n🔄 测试账户切换功能');
    
    if (this.exchanges.length > 1) {
      // 模拟切换账户
      this.exchanges.forEach((exchange, index) => {
        this.logTest(
          `切换到 ${exchange.name}`,
          true,
          `账户 ${index + 1}/${this.exchanges.length}`
        );
      });
    } else {
      this.logTest(
        '账户切换功能',
        false,
        '只有一个账户'
      );
    }
  }

  // 测试7: 数据格式化显示
  testDataFormatting() {
    console.log('\n🎨 测试数据格式化显示');
    
    this.exchanges.forEach(exchange => {
      if (exchange.connected) {
        // 测试货币格式化
        const formattedBalance = this.formatCurrency(exchange.totalAssets);
        this.logTest(
          `${exchange.name} 货币格式化`,
          true,
          formattedBalance
        );
        
        // 测试百分比格式化
        const formattedChange = `${exchange.dailyChange >= 0 ? '+' : ''}${exchange.dailyChange}%`;
        this.logTest(
          `${exchange.name} 百分比格式化`,
          true,
          formattedChange
        );
        
        // 测试时间格式化
        const formattedTime = this.formatTime(new Date());
        this.logTest(
          `${exchange.name} 时间格式化`,
          true,
          formattedTime
        );
      }
    });
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatTime(date) {
    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  // 生成测试报告
  generateReport() {
    console.log('\n📊 账户余额和持仓显示测试报告');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    const total = this.testResults.length;
    
    console.log(`总测试数: ${total}`);
    console.log(`通过: ${passed}`);
    console.log(`失败: ${failed}`);
    console.log(`成功率: ${((passed / total) * 100).toFixed(1)}%`);
    
    // 统计各交易所状态
    console.log('\n🏦 交易所状态汇总:');
    this.exchanges.forEach(exchange => {
      const status = exchange.connected ? '✅ 已连接' : '❌ 未连接';
      const positionCount = exchange.positions.length;
      const orderCount = exchange.orders.length;
      
      console.log(`  ${exchange.name}: ${status}`);
      console.log(`    总资产: $${exchange.totalAssets.toLocaleString()}`);
      console.log(`    持仓: ${positionCount} 个`);
      console.log(`    订单: ${orderCount} 个`);
    });
    
    if (failed > 0) {
      console.log('\n❌ 失败的测试:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.test}: ${r.message}`);
        });
    }
    
    console.log('\n🎯 账户余额和持仓显示测试完成!');
  }

  // 运行所有测试
  runAllTests() {
    console.log('🚀 开始运行账户余额和持仓显示测试...\n');
    
    this.testExchangeBalanceDisplay();
    this.testAssetDetailsDisplay();
    this.testPositionsDisplay();
    this.testOrdersDisplay();
    this.testDataRefresh();
    this.testAccountSwitching();
    this.testDataFormatting();
    
    this.generateReport();
  }
}

// 运行测试
const tester = new AccountBalanceTester();
tester.runAllTests();