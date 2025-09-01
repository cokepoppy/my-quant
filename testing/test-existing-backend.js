const http = require('http');

// 测试现有的后台API
async function testExistingBackend() {
  console.log('🧪 开始测试现有的后台API...\n');
  
  const baseUrl = 'http://localhost:8000';
  
  const tests = [
    {
      name: '基础连接测试',
      path: '/api/test',
      method: 'GET'
    },
    {
      name: '获取账户列表',
      path: '/api/trading/accounts',
      method: 'GET'
    },
    {
      name: '获取持仓列表',
      path: '/api/trading/positions',
      method: 'GET'
    },
    {
      name: '获取订单列表',
      path: '/api/trading/orders',
      method: 'GET'
    },
    {
      name: '获取账户余额',
      path: '/api/trading/balance',
      method: 'GET'
    },
    {
      name: '获取市场数据',
      path: '/api/trading/market-data',
      method: 'GET'
    },
    {
      name: '提交订单',
      path: '/api/trading/order',
      method: 'POST',
      data: JSON.stringify({
        accountId: '1',
        symbol: 'BTC/USDT',
        type: 'market',
        side: 'buy',
        amount: 0.001
      })
    },
    {
      name: '取消订单',
      path: '/api/trading/order/cancel',
      method: 'POST',
      data: JSON.stringify({
        orderId: 'test_order_123'
      })
    },
    {
      name: '平仓',
      path: '/api/trading/position/close',
      method: 'POST',
      data: JSON.stringify({
        positionId: 'test_position_123'
      })
    }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  let completedTests = 0;
  
  for (const test of tests) {
    try {
      console.log(`🔍 测试: ${test.name}`);
      
      const options = {
        hostname: 'localhost',
        port: 8000,
        path: test.path,
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TradingPanel-Test/1.0'
        }
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          completedTests++;
          
          try {
            const response = JSON.parse(data);
            
            if (res.statusCode === 200) {
              if (response.success !== false) {
                console.log(`✅ ${test.name} - 通过 (状态码: ${res.statusCode})`);
                passedTests++;
              } else {
                console.log(`❌ ${test.name} - API返回失败: ${response.message || '未知错误'}`);
              }
            } else if (res.statusCode === 404) {
              console.log(`⚠️  ${test.name} - API端点不存在 (状态码: ${res.statusCode})`);
            } else if (res.statusCode === 500) {
              console.log(`❌ ${test.name} - 服务器内部错误 (状态码: ${res.statusCode})`);
            } else {
              console.log(`⚠️  ${test.name} - 其他状态码: ${res.statusCode}`);
            }
            
            // 如果是POST请求，打印响应数据
            if (test.method === 'POST' && response.data) {
              console.log(`   响应数据: ${JSON.stringify(response.data).substring(0, 100)}...`);
            }
            
          } catch (error) {
            console.log(`❌ ${test.name} - 解析错误: ${error.message}`);
            console.log(`   原始响应: ${data.substring(0, 200)}...`);
          }
          
          // 检查是否所有测试都完成了
          if (completedTests === totalTests) {
            showResults(passedTests, totalTests);
          }
        });
      });
      
      req.on('error', (error) => {
        completedTests++;
        console.log(`❌ ${test.name} - 连接错误: ${error.message}`);
        
        if (completedTests === totalTests) {
          showResults(passedTests, totalTests);
        }
      });
      
      req.setTimeout(5000, () => {
        completedTests++;
        console.log(`❌ ${test.name} - 请求超时`);
        req.destroy();
        
        if (completedTests === totalTests) {
          showResults(passedTests, totalTests);
        }
      });
      
      if (test.data) {
        req.write(test.data);
      }
      
      req.end();
      
    } catch (error) {
      completedTests++;
      console.log(`❌ ${test.name} - 错误: ${error.message}`);
      
      if (completedTests === totalTests) {
        showResults(passedTests, totalTests);
      }
    }
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

function showResults(passed, total) {
  console.log(`\n📊 测试结果: ${passed}/${total} 通过`);
  
  const successRate = (passed / total * 100).toFixed(1);
  console.log(`📈 成功率: ${successRate}%`);
  
  if (passed === total) {
    console.log('🎉 所有API测试通过！');
    console.log('✅ 后台API服务完全正常工作');
  } else if (passed >= total * 0.7) {
    console.log('✅ 大部分API测试通过');
    console.log('⚠️  少数API可能存在问题，但不影响主要功能');
  } else {
    console.log('❌ 多数API测试失败');
    console.log('🔧 需要检查后台服务配置');
  }
  
  console.log('\n📋 建议:');
  if (passed < total) {
    console.log('  1. 检查后台服务是否正常运行');
    console.log('  2. 验证API路由是否正确配置');
    console.log('  3. 检查数据库连接是否正常');
    console.log('  4. 查看后台服务日志');
  } else {
    console.log('  1. 后台API服务正常，可以继续开发');
    console.log('  2. 可以进行前端集成测试');
  }
}

// 运行测试
testExistingBackend().catch(console.error);

// 处理Ctrl+C
process.on('SIGINT', () => {
  console.log('\n👋 测试已停止');
  process.exit(0);
});