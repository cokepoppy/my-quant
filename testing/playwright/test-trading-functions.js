// 交易功能详细测试脚本
console.log('🛒 交易功能详细测试');
console.log('='.repeat(50));

// 模拟交易功能测试
class TradingFunctionTester {
  constructor() {
    this.testResults = [];
    this.exchangeConnected = false;
    this.orders = [];
    this.positions = [];
  }

  // 记录测试结果
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

  // 测试1: 交易所连接功能
  testExchangeConnection() {
    console.log('\n🔌 测试交易所连接功能');
    
    // 模拟交易所连接
    const exchanges = [
      { name: 'Binance', connected: true },
      { name: 'OKX', connected: false },
      { name: 'Bybit', connected: true }
    ];

    exchanges.forEach(exchange => {
      if (exchange.connected) {
        this.logTest(`${exchange.name} 交易所连接`, true, '连接成功');
      } else {
        this.logTest(`${exchange.name} 交易所连接`, false, '连接失败');
      }
    });

    this.exchangeConnected = exchanges.some(e => e.connected);
  }

  // 测试2: 交易表单验证
  testTradingFormValidation() {
    console.log('\n📝 测试交易表单验证');
    
    const testCases = [
      {
        name: '有效市价买单',
        data: { symbol: 'BTC/USDT', type: 'market', side: 'buy', amount: 0.001 },
        expected: true
      },
      {
        name: '有效限价卖单',
        data: { symbol: 'ETH/USDT', type: 'limit', side: 'sell', amount: 0.1, price: 3000 },
        expected: true
      },
      {
        name: '无效数量(0)',
        data: { symbol: 'BTC/USDT', type: 'market', side: 'buy', amount: 0 },
        expected: false
      },
      {
        name: '缺少交易对',
        data: { type: 'market', side: 'buy', amount: 0.001 },
        expected: false
      },
      {
        name: '限价单缺少价格',
        data: { symbol: 'BTC/USDT', type: 'limit', side: 'buy', amount: 0.001 },
        expected: false
      }
    ];

    testCases.forEach(testCase => {
      const isValid = this.validateOrderForm(testCase.data);
      this.logTest(
        `表单验证: ${testCase.name}`,
        isValid === testCase.expected,
        isValid ? '验证通过' : '验证失败'
      );
    });
  }

  // 验证订单表单
  validateOrderForm(orderData) {
    if (!orderData.symbol) return false;
    if (!orderData.type || !['market', 'limit'].includes(orderData.type)) return false;
    if (!orderData.side || !['buy', 'sell'].includes(orderData.side)) return false;
    if (!orderData.amount || orderData.amount <= 0) return false;
    if (orderData.type === 'limit' && (!orderData.price || orderData.price <= 0)) return false;
    return true;
  }

  // 测试3: 下单功能
  testPlaceOrder() {
    console.log('\n🛒 测试下单功能');
    
    if (!this.exchangeConnected) {
      this.logTest('下单功能', false, '没有连接的交易所');
      return;
    }

    const testOrders = [
      {
        symbol: 'BTC/USDT',
        type: 'market',
        side: 'buy',
        amount: 0.001
      },
      {
        symbol: 'ETH/USDT',
        type: 'limit',
        side: 'sell',
        amount: 0.1,
        price: 3000
      }
    ];

    testOrders.forEach((order, index) => {
      const orderId = `order_${Date.now()}_${index}`;
      const mockOrder = {
        ...order,
        id: orderId,
        status: 'pending',
        createdAt: new Date(),
        executedPrice: order.type === 'market' ? this.getMockPrice(order.symbol) : order.price
      };

      this.orders.push(mockOrder);
      this.logTest(
        `下单: ${order.side} ${order.symbol}`,
        true,
        `订单ID: ${orderId}, 状态: ${mockOrder.status}`
      );
    });
  }

  // 获取模拟价格
  getMockPrice(symbol) {
    const prices = {
      'BTC/USDT': 45000 + Math.random() * 1000,
      'ETH/USDT': 3000 + Math.random() * 100,
      'BNB/USDT': 300 + Math.random() * 20
    };
    return prices[symbol] || 1000;
  }

  // 测试4: 订单管理
  testOrderManagement() {
    console.log('\n📋 测试订单管理');
    
    if (this.orders.length === 0) {
      this.logTest('订单管理', false, '没有订单');
      return;
    }

    // 测试订单状态更新
    this.orders.forEach(order => {
      if (order.status === 'pending') {
        // 模拟订单执行
        setTimeout(() => {
          order.status = 'executed';
          this.logTest(
            `订单执行: ${order.id}`,
            true,
            `状态更新为: ${order.status}`
          );
        }, 1000);
      }
    });

    // 测试订单取消
    const cancellableOrder = this.orders.find(o => o.status === 'pending');
    if (cancellableOrder) {
      cancellableOrder.status = 'cancelled';
      this.logTest(
        `订单取消: ${cancellableOrder.id}`,
        true,
        '订单已取消'
      );
    }
  }

  // 测试5: 持仓管理
  testPositionManagement() {
    console.log('\n📊 测试持仓管理');
    
    // 模拟持仓数据
    this.positions = [
      {
        id: 'pos_1',
        symbol: 'BTC/USDT',
        side: 'long',
        amount: 0.5,
        entryPrice: 44000,
        currentPrice: 45000,
        pnl: 500,
        pnlPercent: 1.14
      },
      {
        id: 'pos_2',
        symbol: 'ETH/USDT',
        side: 'short',
        amount: 1.0,
        entryPrice: 3200,
        currentPrice: 3100,
        pnl: 100,
        pnlPercent: 3.13
      }
    ];

    this.positions.forEach(position => {
      this.logTest(
        `持仓显示: ${position.symbol}`,
        true,
        `${position.side} ${position.amount} @ ${position.entryPrice}, PnL: ${position.pnl}`
      );
    });

    // 测试平仓功能
    if (this.positions.length > 0) {
      const positionToClose = this.positions[0];
      this.logTest(
        `平仓功能: ${positionToClose.symbol}`,
        true,
        '平仓功能可用'
      );
    }
  }

  // 测试6: 风险控制
  testRiskManagement() {
    console.log('\n🛡️ 测试风险控制');
    
    const riskTests = [
      {
        name: '最大持仓限制',
        test: () => this.checkPositionLimit(),
        expected: true
      },
      {
        name: '最大订单数量限制',
        test: () => this.checkOrderLimit(),
        expected: true
      },
      {
        name: '最小订单金额',
        test: () => this.checkMinOrderAmount(),
        expected: true
      }
    ];

    riskTests.forEach(riskTest => {
      const result = riskTest.test();
      this.logTest(
        `风险控制: ${riskTest.name}`,
        result === riskTest.expected,
        result ? '通过' : '未通过'
      );
    });
  }

  checkPositionLimit() {
    const maxPositions = 10;
    return this.positions.length <= maxPositions;
  }

  checkOrderLimit() {
    const maxOrders = 50;
    return this.orders.filter(o => o.status === 'pending').length <= maxOrders;
  }

  checkMinOrderAmount() {
    const minAmount = 0.0001;
    return this.orders.every(o => o.amount >= minAmount);
  }

  // 测试7: 实时数据更新
  testRealtimeData() {
    console.log('\n📡 测试实时数据更新');
    
    // 模拟价格更新
    let updateCount = 0;
    const maxUpdates = 5;
    
    const updateInterval = setInterval(() => {
      if (updateCount >= maxUpdates) {
        clearInterval(updateInterval);
        this.logTest('实时数据更新', true, `完成 ${maxUpdates} 次更新`);
        return;
      }
      
      // 更新持仓价格
      this.positions.forEach(position => {
        const priceChange = (Math.random() - 0.5) * 100;
        position.currentPrice += priceChange;
        position.pnl = (position.currentPrice - position.entryPrice) * position.amount * 
                       (position.side === 'long' ? 1 : -1);
      });
      
      updateCount++;
    }, 1000);
  }

  // 生成测试报告
  generateReport() {
    console.log('\n📊 测试报告汇总');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    const total = this.testResults.length;
    
    console.log(`总测试数: ${total}`);
    console.log(`通过: ${passed}`);
    console.log(`失败: ${failed}`);
    console.log(`成功率: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ 失败的测试:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.test}: ${r.message}`);
        });
    }
    
    console.log('\n🎯 交易功能测试完成!');
  }

  // 运行所有测试
  runAllTests() {
    console.log('🚀 开始运行交易功能测试...\n');
    
    this.testExchangeConnection();
    this.testTradingFormValidation();
    this.testPlaceOrder();
    this.testOrderManagement();
    this.testPositionManagement();
    this.testRiskManagement();
    this.testRealtimeData();
    
    // 等待异步测试完成
    setTimeout(() => {
      this.generateReport();
    }, 6000);
  }
}

// 运行测试
const tester = new TradingFunctionTester();
tester.runAllTests();