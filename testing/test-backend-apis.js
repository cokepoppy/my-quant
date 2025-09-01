const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 8000;

// 测试用的模拟路由
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: '测试API正常工作',
    timestamp: new Date().toISOString()
  });
});

// 模拟交易路由
app.get('/api/trading/accounts', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        name: 'Binance 主账户',
        type: 'spot',
        exchange: 'binance',
        connected: true,
        balance: 10000,
        positions: [],
        orders: []
      }
    ]
  });
});

app.post('/api/trading/order', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 'order_' + Date.now(),
      status: 'pending',
      message: '订单已提交'
    }
  });
});

app.get('/api/trading/positions', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

app.get('/api/trading/orders', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

app.listen(PORT, () => {
  console.log(`测试服务器运行在 http://localhost:${PORT}`);
});

// 测试函数
async function testBackendAPIs() {
  const baseUrl = 'http://localhost:8000';
  
  console.log('🧪 开始测试后台API...\n');
  
  const tests = [
    {
      name: '基础连接测试',
      url: '/api/test',
      method: 'GET'
    },
    {
      name: '获取账户列表',
      url: '/api/trading/accounts',
      method: 'GET'
    },
    {
      name: '获取持仓列表',
      url: '/api/trading/positions',
      method: 'GET'
    },
    {
      name: '获取订单列表',
      url: '/api/trading/orders',
      method: 'GET'
    },
    {
      name: '提交订单',
      url: '/api/trading/order',
      method: 'POST',
      data: {
        accountId: '1',
        symbol: 'BTC/USDT',
        type: 'market',
        side: 'buy',
        quantity: 0.001
      }
    }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      console.log(`🔍 测试: ${test.name}`);
      
      const response = await axios({
        method: test.method,
        url: baseUrl + test.url,
        data: test.data,
        timeout: 5000
      });
      
      if (response.data.success) {
        console.log(`✅ ${test.name} - 通过`);
        passedTests++;
      } else {
        console.log(`❌ ${test.name} - 失败: ${response.data.message}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - 错误: ${error.message}`);
    }
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 测试结果: ${passedTests}/${totalTests} 通过`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有API测试通过！');
  } else {
    console.log('⚠️  部分API测试失败，请检查后台服务');
  }
}

// 如果直接运行此脚本，执行测试
if (require.main === module) {
  testBackendAPIs().catch(console.error);
}

module.exports = { app, testBackendAPIs };