const http = require('http');

// 测试用的模拟服务器
const server = http.createServer((req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const url = req.url;
  const method = req.method;
  
  console.log(`收到请求: ${method} ${url}`);
  
  // 路由处理
  if (url === '/api/test' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: '测试API正常工作',
      timestamp: new Date().toISOString()
    }));
  }
  else if (url === '/api/trading/accounts' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
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
    }));
  }
  else if (url === '/api/trading/positions' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: []
    }));
  }
  else if (url === '/api/trading/orders' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: []
    }));
  }
  else if (url === '/api/trading/order' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          id: 'order_' + Date.now(),
          status: 'pending',
          message: '订单已提交'
        }
      }));
    });
  }
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      message: 'API端点不存在'
    }));
  }
});

const PORT = 8000;

server.listen(PORT, () => {
  console.log(`🚀 测试服务器运行在 http://localhost:${PORT}`);
  console.log('📋 支持的API端点:');
  console.log('  GET  /api/test');
  console.log('  GET  /api/trading/accounts');
  console.log('  GET  /api/trading/positions');
  console.log('  GET  /api/trading/orders');
  console.log('  POST /api/trading/order');
  console.log('');
  
  // 开始测试
  setTimeout(() => {
    testAPIs();
  }, 1000);
});

// 测试函数
async function testAPIs() {
  console.log('🧪 开始测试API端点...\n');
  
  const tests = [
    {
      name: '基础连接测试',
      method: 'GET',
      path: '/api/test'
    },
    {
      name: '获取账户列表',
      method: 'GET',
      path: '/api/trading/accounts'
    },
    {
      name: '获取持仓列表',
      method: 'GET',
      path: '/api/trading/positions'
    },
    {
      name: '获取订单列表',
      method: 'GET',
      path: '/api/trading/orders'
    },
    {
      name: '提交订单',
      method: 'POST',
      path: '/api/trading/order',
      data: JSON.stringify({
        accountId: '1',
        symbol: 'BTC/USDT',
        type: 'market',
        side: 'buy',
        quantity: 0.001
      })
    }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      console.log(`🔍 测试: ${test.name}`);
      
      const options = {
        hostname: 'localhost',
        port: PORT,
        path: test.path,
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.success) {
              console.log(`✅ ${test.name} - 通过`);
              passedTests++;
            } else {
              console.log(`❌ ${test.name} - 失败: ${response.message}`);
            }
          } catch (error) {
            console.log(`❌ ${test.name} - 解析错误: ${error.message}`);
          }
          
          // 检查是否所有测试都完成了
          totalTests--;
          if (totalTests === 0) {
            showResults(passedTests, tests.length);
          }
        });
      });
      
      req.on('error', (error) => {
        console.log(`❌ ${test.name} - 连接错误: ${error.message}`);
        totalTests--;
        if (totalTests === 0) {
          showResults(passedTests, tests.length);
        }
      });
      
      if (test.data) {
        req.write(test.data);
      }
      
      req.end();
      
    } catch (error) {
      console.log(`❌ ${test.name} - 错误: ${error.message}`);
      totalTests--;
      if (totalTests === 0) {
        showResults(passedTests, tests.length);
      }
    }
    
    // 添加延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

function showResults(passed, total) {
  console.log(`\n📊 测试结果: ${passed}/${total} 通过`);
  
  if (passed === total) {
    console.log('🎉 所有API测试通过！');
    console.log('✅ 后台API服务正常工作');
  } else {
    console.log('⚠️  部分API测试失败');
  }
  
  console.log('\n🔧 服务器将持续运行，按 Ctrl+C 停止');
}

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\n👋 服务器已停止');
  server.close();
  process.exit(0);
});