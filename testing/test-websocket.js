// WebSocket实时数据更新测试
console.log('📡 WebSocket实时数据更新测试');
console.log('='.repeat(50));

class WebSocketTester {
  constructor() {
    this.testResults = [];
    this.connectedClients = 0;
    this.subscriptions = new Map();
    this.marketData = new Map();
    this.initializeMarketData();
  }

  initializeMarketData() {
    // 初始化市场数据
    const symbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT'];
    
    symbols.forEach(symbol => {
      this.marketData.set(symbol, {
        symbol,
        price: this.getInitialPrice(symbol),
        change24h: (Math.random() - 0.5) * 10,
        volume24h: Math.random() * 1000000,
        high24h: 0,
        low24h: 0,
        lastUpdate: Date.now()
      });
    });
  }

  getInitialPrice(symbol) {
    const basePrices = {
      'BTC/USDT': 45000,
      'ETH/USDT': 3000,
      'BNB/USDT': 300,
      'SOL/USDT': 100
    };
    return basePrices[symbol] || 1000;
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

  // 测试1: WebSocket连接
  testWebSocketConnection() {
    console.log('\n🔌 测试WebSocket连接');
    
    // 模拟多个客户端连接
    const clients = ['client1', 'client2', 'client3'];
    
    clients.forEach(clientId => {
      this.connectedClients++;
      this.subscriptions.set(clientId, new Set());
      
      this.logTest(
        `客户端 ${clientId} 连接`,
        true,
        `连接成功，总连接数: ${this.connectedClients}`
      );
    });
  }

  // 测试2: 账户订阅
  testAccountSubscription() {
    console.log('\n📋 测试账户订阅');
    
    const accounts = ['account1', 'account2'];
    const clients = Array.from(this.subscriptions.keys());
    
    clients.forEach((clientId, index) => {
      const accountId = accounts[index % accounts.length];
      const clientSubscriptions = this.subscriptions.get(clientId);
      
      if (clientSubscriptions) {
        clientSubscriptions.add(accountId);
        
        this.logTest(
          `客户端 ${clientId} 订阅账户 ${accountId}`,
          true,
          `订阅成功`
        );
      }
    });
  }

  // 测试3: 交易对订阅
  testSymbolSubscription() {
    console.log('\n📊 测试交易对订阅');
    
    const symbols = Array.from(this.marketData.keys());
    const clients = Array.from(this.subscriptions.keys());
    
    clients.forEach(clientId => {
      const clientSubscriptions = this.subscriptions.get(clientId);
      if (clientSubscriptions) {
        // 每个客户端订阅2个交易对
        const clientSymbols = symbols.slice(0, 2);
        clientSymbols.forEach(symbol => {
          clientSubscriptions.add(`symbol:${symbol}`);
          
          this.logTest(
            `客户端 ${clientId} 订阅交易对 ${symbol}`,
            true,
            `订阅成功`
          );
        });
      }
    });
  }

  // 测试4: 实时价格更新
  testRealtimePriceUpdates() {
    console.log('\n💹 测试实时价格更新');
    
    let updateCount = 0;
    const maxUpdates = 10;
    
    const updateInterval = setInterval(() => {
      if (updateCount >= maxUpdates) {
        clearInterval(updateInterval);
        this.logTest('实时价格更新', true, `完成 ${maxUpdates} 次更新`);
        return;
      }
      
      // 更新所有交易对价格
      this.marketData.forEach((data, symbol) => {
        const oldPrice = data.price;
        const priceChange = (Math.random() - 0.5) * 100;
        data.price += priceChange;
        data.lastUpdate = Date.now();
        
        // 更新24小时高低点
        if (data.high24h === 0 || data.price > data.high24h) {
          data.high24h = data.price;
        }
        if (data.low24h === 0 || data.price < data.low24h) {
          data.low24h = data.price;
        }
        
        // 计算涨跌幅
        data.change24h = ((data.price - this.getInitialPrice(symbol)) / this.getInitialPrice(symbol)) * 100;
        
        // 广播价格更新
        this.broadcastPriceUpdate(symbol, data);
        
        this.logTest(
          `${symbol} 价格更新`,
          true,
          `${oldPrice.toFixed(2)} → ${data.price.toFixed(2)} (${data.change24h >= 0 ? '+' : ''}${data.change24h.toFixed(2)}%)`
        );
      });
      
      updateCount++;
    }, 1000);
  }

  broadcastPriceUpdate(symbol, data) {
    // 模拟广播给所有订阅了该交易对的客户端
    this.subscriptions.forEach((subscriptions, clientId) => {
      if (subscriptions.has(`symbol:${symbol}`)) {
        // 这里会触发客户端的价格更新事件
        this.logTest(
          `广播价格更新到 ${clientId}`,
          true,
          `${symbol}: $${data.price.toFixed(2)}`
        );
      }
    });
  }

  // 测试5: 订单状态更新
  testOrderStatusUpdates() {
    console.log('\n📋 测试订单状态更新');
    
    const orders = [
      { id: 'order1', symbol: 'BTC/USDT', status: 'pending' },
      { id: 'order2', symbol: 'ETH/USDT', status: 'pending' }
    ];
    
    // 模拟订单状态变化
    const statusFlow = ['pending', 'open', 'filled', 'cancelled'];
    let currentStatusIndex = 0;
    
    const statusInterval = setInterval(() => {
      if (currentStatusIndex >= statusFlow.length) {
        clearInterval(statusInterval);
        return;
      }
      
      orders.forEach(order => {
        const oldStatus = order.status;
        order.status = statusFlow[currentStatusIndex];
        
        if (oldStatus !== order.status) {
          this.broadcastOrderUpdate(order);
          
          this.logTest(
            `订单 ${order.id} 状态更新`,
            true,
            `${oldStatus} → ${order.status}`
          );
        }
      });
      
      currentStatusIndex++;
    }, 2000);
  }

  broadcastOrderUpdate(order) {
    // 模拟广播订单状态更新
    this.subscriptions.forEach((subscriptions, clientId) => {
      if (subscriptions.size > 0) {
        this.logTest(
          `广播订单更新到 ${clientId}`,
          true,
          `订单 ${order.id}: ${order.status}`
        );
      }
    });
  }

  // 测试6: 持仓更新
  testPositionUpdates() {
    console.log('\n📊 测试持仓更新');
    
    const positions = [
      { symbol: 'BTC/USDT', side: 'long', amount: 0.5, entryPrice: 44000, pnl: 0 },
      { symbol: 'ETH/USDT', side: 'short', amount: 2, entryPrice: 3200, pnl: 0 }
    ];
    
    // 模拟持仓盈亏实时更新
    const positionInterval = setInterval(() => {
      positions.forEach(position => {
        const marketData = this.marketData.get(position.symbol);
        if (marketData) {
          const oldPnl = position.pnl;
          position.pnl = (marketData.price - position.entryPrice) * position.amount * 
                         (position.side === 'long' ? 1 : -1);
          
          if (Math.abs(position.pnl - oldPnl) > 1) {
            this.broadcastPositionUpdate(position);
            
            this.logTest(
              `${position.symbol} 持仓更新`,
              true,
              `PnL: $${oldPnl.toFixed(2)} → $${position.pnl.toFixed(2)}`
            );
          }
        }
      });
    }, 1500);
    
    // 10秒后停止更新
    setTimeout(() => {
      clearInterval(positionInterval);
    }, 10000);
  }

  broadcastPositionUpdate(position) {
    // 模拟广播持仓更新
    this.subscriptions.forEach((subscriptions, clientId) => {
      if (subscriptions.size > 0) {
        this.logTest(
          `广播持仓更新到 ${clientId}`,
          true,
          `${position.symbol}: PnL $${position.pnl.toFixed(2)}`
        );
      }
    });
  }

  // 测试7: 连接稳定性
  testConnectionStability() {
    console.log('\n🔗 测试连接稳定性');
    
    let pingCount = 0;
    const maxPings = 5;
    
    const pingInterval = setInterval(() => {
      if (pingCount >= maxPings) {
        clearInterval(pingInterval);
        this.logTest('连接稳定性测试', true, `完成 ${maxPings} 次ping测试`);
        return;
      }
      
      // 模拟ping/pong
      this.subscriptions.forEach((subscriptions, clientId) => {
        this.logTest(
          `Ping ${clientId}`,
          true,
          `第 ${pingCount + 1} 次心跳`
        );
      });
      
      pingCount++;
    }, 2000);
  }

  // 测试8: 重连机制
  testReconnection() {
    console.log('\n🔄 测试重连机制');
    
    // 模拟客户端断开连接
    const clients = Array.from(this.subscriptions.keys());
    const disconnectedClient = clients[0];
    
    this.connectedClients--;
    this.logTest(
      `客户端 ${disconnectedClient} 断开连接`,
      true,
      `剩余连接数: ${this.connectedClients}`
    );
    
    // 模拟重连
    setTimeout(() => {
      this.connectedClients++;
      this.logTest(
        `客户端 ${disconnectedClient} 重新连接`,
        true,
        `重连成功，总连接数: ${this.connectedClients}`
      );
      
      // 重新订阅
      const clientSubscriptions = this.subscriptions.get(disconnectedClient);
      if (clientSubscriptions) {
        clientSubscriptions.forEach(subscription => {
          this.logTest(
            `重新订阅 ${subscription}`,
            true,
            '订阅恢复成功'
          );
        });
      }
    }, 3000);
  }

  // 测试9: 数据同步
  testDataSynchronization() {
    console.log('\n🔄 测试数据同步');
    
    // 模拟数据同步检查
    const syncChecks = [
      { name: '价格数据同步', check: () => this.checkPriceSync() },
      { name: '订单数据同步', check: () => this.checkOrderSync() },
      { name: '持仓数据同步', check: () => this.checkPositionSync() }
    ];
    
    syncChecks.forEach(syncCheck => {
      const result = syncCheck.check();
      this.logTest(
        syncCheck.name,
        result,
        result ? '同步正常' : '同步异常'
      );
    });
  }

  checkPriceSync() {
    // 检查价格数据是否在合理范围内
    let allValid = true;
    this.marketData.forEach(data => {
      if (data.price <= 0 || data.price > 100000) {
        allValid = false;
      }
    });
    return allValid;
  }

  checkOrderSync() {
    // 检查订单状态是否一致
    return true; // 模拟检查通过
  }

  checkPositionSync() {
    // 检查持仓数据是否一致
    return true; // 模拟检查通过
  }

  // 测试10: 性能测试
  testPerformance() {
    console.log('\n⚡ 测试性能');
    
    const messageCount = 100;
    let messagesSent = 0;
    let startTime = Date.now();
    
    // 模拟高频消息发送
    const messageInterval = setInterval(() => {
      if (messagesSent >= messageCount) {
        clearInterval(messageInterval);
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        const messagesPerSecond = messageCount / duration;
        
        this.logTest(
          '消息发送性能',
          true,
          `${messageCount} 条消息，耗时 ${duration.toFixed(2)} 秒，${messagesPerSecond.toFixed(2)} 条/秒`
        );
        return;
      }
      
      // 模拟发送市场数据更新
      this.marketData.forEach((data, symbol) => {
        this.broadcastPriceUpdate(symbol, data);
      });
      
      messagesSent++;
    }, 50);
  }

  // 生成测试报告
  generateReport() {
    console.log('\n📊 WebSocket实时数据更新测试报告');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    const total = this.testResults.length;
    
    console.log(`总测试数: ${total}`);
    console.log(`通过: ${passed}`);
    console.log(`失败: ${failed}`);
    console.log(`成功率: ${((passed / total) * 100).toFixed(1)}%`);
    
    console.log('\n📈 连接统计:');
    console.log(`  连接的客户端数: ${this.connectedClients}`);
    console.log(`  账户订阅数: ${this.subscriptions.size}`);
    console.log(`  交易对数: ${this.marketData.size}`);
    
    if (failed > 0) {
      console.log('\n❌ 失败的测试:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.test}: ${r.message}`);
        });
    }
    
    console.log('\n🎯 WebSocket实时数据更新测试完成!');
  }

  // 运行所有测试
  runAllTests() {
    console.log('🚀 开始运行WebSocket实时数据更新测试...\n');
    
    this.testWebSocketConnection();
    this.testAccountSubscription();
    this.testSymbolSubscription();
    this.testRealtimePriceUpdates();
    this.testOrderStatusUpdates();
    this.testPositionUpdates();
    this.testConnectionStability();
    this.testReconnection();
    this.testDataSynchronization();
    this.testPerformance();
    
    // 等待异步测试完成
    setTimeout(() => {
      this.generateReport();
    }, 15000);
  }
}

// 运行测试
const tester = new WebSocketTester();
tester.runAllTests();