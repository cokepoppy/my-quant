const http = require('http');

// 测试现有的后台API - 使用正确的路径
async function testExistingBackend() {
  console.log('🧪 开始测试现有的后台API (使用正确的路径)...\n');
  
  const baseUrl = 'http://localhost:8000';
  
  const tests = [
    {
      name: '健康检查',
      path: '/health',
      method: 'GET'
    },
    {
      name: '调试信息',
      path: '/debug',
      method: 'GET'
    },
    {
      name: '获取账户列表',
      path: '/trading/accounts',
      method: 'GET'
    },
    {
      name: '获取持仓列表',
      path: '/trading/positions',
      method: 'GET'
    },
    {
      name: '获取订单列表',
      path: '/trading/orders',
      method: 'GET'
    },
    {
      name: '获取简化订单列表',
      path: '/trading/orders/simple',
      method: 'GET'
    },
    {
      name: '获取账户余额',
      path: '/trading/balance',
      method: 'GET'
    },
    {
      name: '获取市场数据',
      path: '/trading/market-data',
      method: 'GET'
    },
    {
      name: '提交订单',
      path: '/trading/order',
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
      path: '/trading/order/cancel',
      method: 'POST',
      data: JSON.stringify({
        orderId: 'test_order_123'
      })
    },
    {
      name: '平仓',
      path: '/trading/position/close',
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
      console.log(`   ${test.method} ${test.path}`);
      
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
                
                // 显示一些响应信息
                if (response.data && typeof response.data === 'object') {
                  const dataKeys = Object.keys(response.data);
                  if (dataKeys.length > 0) {
                    console.log(`   响应包含: ${dataKeys.slice(0, 3).join(', ')}${dataKeys.length > 3 ? '...' : ''}`);
                  }
                }
              } else {
                console.log(`❌ ${test.name} - API返回失败: ${response.message || '未知错误'}`);
              }
            } else if (res.statusCode === 404) {
              console.log(`⚠️  ${test.name} - API端点不存在 (状态码: ${res.statusCode})`);
            } else if (res.statusCode === 500) {
              console.log(`❌ ${test.name} - 服务器内部错误 (状态码: ${res.statusCode})`);
              if (response.message) {
                console.log(`   错误信息: ${response.message}`);
              }
            } else {
              console.log(`⚠️  ${test.name} - 其他状态码: ${res.statusCode}`);
            }
            
          } catch (error) {
            console.log(`❌ ${test.name} - 解析错误: ${error.message}`);
            if (data.length > 0) {
              console.log(`   原始响应: ${data.substring(0, 100)}...`);
            }
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
    await new Promise(resolve => setTimeout(resolve, 800));
  }
}

function showResults(passed, total) {
  console.log(`\n📊 测试结果: ${passed}/${total} 通过`);
  
  const successRate = (passed / total * 100).toFixed(1);
  console.log(`📈 成功率: ${successRate}%`);
  
  if (passed === total) {
    console.log('🎉 所有API测试通过！');
    console.log('✅ 后台API服务完全正常工作');
    console.log('🔥 交易面板可以正常与后台通信');
  } else if (passed >= total * 0.7) {
    console.log('✅ 大部分API测试通过');
    console.log('⚠️  少数API可能存在问题，但不影响主要功能');
    console.log('📝 交易面板基本功能可用');
  } else if (passed >= total * 0.5) {
    console.log('⚠️  部分API测试通过');
    console.log('🔧 需要修复一些API端点');
    console.log('📝 交易面板核心功能可能受影响');
  } else {
    console.log('❌ 多数API测试失败');
    console.log('🔧 需要检查后台服务配置');
    console.log('📝 交易面板无法正常工作');
  }
  
  console.log('\n📋 建议:');
  if (passed < total) {
    console.log('  1. 检查后台服务日志');
    console.log('  2. 验证数据库连接');
    console.log('  3. 确认所有路由已正确配置');
    console.log('  4. 测试数据库表是否已创建');
  } else {
    console.log('  1. ✅ 后台API服务正常');
    console.log('  2. ✅ 可以进行前端集成测试');
    console.log('  3. ✅ 交易面板功能验证完成');
  }
}

// 运行测试
console.log('🚀 开始测试后台API服务...\n');
testExistingBackend().catch(console.error);

// 处理Ctrl+C
process.on('SIGINT', () => {
  console.log('\n👋 测试已停止');
  process.exit(0);
});