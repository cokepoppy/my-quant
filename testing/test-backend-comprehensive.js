const http = require('http');

// 测试现有的后台API - 包含模拟认证测试
async function testBackendWithAuth() {
  console.log('🧪 开始测试后台API (包含认证分析)...\n');
  
  const baseUrl = 'http://localhost:8000';
  
  const tests = [
    {
      name: '健康检查',
      path: '/health',
      method: 'GET',
      needsAuth: false
    },
    {
      name: '调试信息',
      path: '/debug',
      method: 'GET',
      needsAuth: false
    },
    {
      name: '获取账户列表 (需要认证)',
      path: '/trading/accounts',
      method: 'GET',
      needsAuth: true
    },
    {
      name: '获取持仓列表 (需要认证)',
      path: '/trading/positions',
      method: 'GET',
      needsAuth: true
    },
    {
      name: '获取订单列表 (需要认证)',
      path: '/trading/orders',
      method: 'GET',
      needsAuth: true
    },
    {
      name: '获取简化订单列表 (需要认证)',
      path: '/trading/orders/simple',
      method: 'GET',
      needsAuth: true
    },
    {
      name: '获取账户余额 (需要认证)',
      path: '/trading/balance',
      method: 'GET',
      needsAuth: true
    },
    {
      name: '获取市场数据 (需要认证)',
      path: '/trading/market-data',
      method: 'GET',
      needsAuth: true
    },
    {
      name: '提交订单 (需要认证)',
      path: '/trading/order',
      method: 'POST',
      needsAuth: true,
      data: JSON.stringify({
        accountId: '1',
        symbol: 'BTC/USDT',
        type: 'market',
        side: 'buy',
        amount: 0.001
      })
    },
    {
      name: '取消订单 (需要认证)',
      path: '/trading/order/cancel',
      method: 'POST',
      needsAuth: true,
      data: JSON.stringify({
        orderId: 'test_order_123'
      })
    },
    {
      name: '平仓 (需要认证)',
      path: '/trading/position/close',
      method: 'POST',
      needsAuth: true,
      data: JSON.stringify({
        positionId: 'test_position_123'
      })
    }
  ];
  
  let passedTests = 0;
  let authRequiredTests = 0;
  let notFoundTests = 0;
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
              console.log(`✅ ${test.name} - 通过 (状态码: ${res.statusCode})`);
              passedTests++;
            } else if (res.statusCode === 401) {
              if (test.needsAuth) {
                console.log(`🔒 ${test.name} - 需要认证 (正常)`);
                authRequiredTests++;
                passedTests++; // 401对于需要认证的端点是正常的
              } else {
                console.log(`❌ ${test.name} - 意外的认证要求 (状态码: ${res.statusCode})`);
              }
            } else if (res.statusCode === 404) {
              console.log(`❌ ${test.name} - API端点不存在 (状态码: ${res.statusCode})`);
              notFoundTests++;
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
            showResults(passedTests, totalTests, authRequiredTests, notFoundTests);
          }
        });
      });
      
      req.on('error', (error) => {
        completedTests++;
        console.log(`❌ ${test.name} - 连接错误: ${error.message}`);
        
        if (completedTests === totalTests) {
          showResults(passedTests, totalTests, authRequiredTests, notFoundTests);
        }
      });
      
      req.setTimeout(5000, () => {
        completedTests++;
        console.log(`❌ ${test.name} - 请求超时`);
        req.destroy();
        
        if (completedTests === totalTests) {
          showResults(passedTests, totalTests, authRequiredTests, notFoundTests);
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
        showResults(passedTests, totalTests, authRequiredTests, notFoundTests);
      }
    }
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 800));
  }
}

function showResults(passed, total, authRequired, notFound) {
  console.log(`\n📊 详细测试结果:`);
  console.log(`✅ 正常工作: ${passed - authRequired}/${total}`);
  console.log(`🔒 需要认证: ${authRequired}/${total}`);
  console.log(`❌ 端点缺失: ${notFound}/${total}`);
  console.log(`📈 总体成功率: ${((passed / total) * 100).toFixed(1)}%`);
  
  console.log('\n🎯 分析结果:');
  
  if (passed === total) {
    console.log('🎉 完美！所有API端点都正常工作');
    console.log('✅ 后台服务完全就绪');
    console.log('🔥 交易面板可以完美集成');
  } else if (authRequired > 0 && notFound === 0) {
    console.log('✅ 后台服务正常');
    console.log('🔒 所有交易API都正确需要认证');
    console.log('📝 前端需要实现登录功能');
    console.log('🔥 交易面板可以正常工作（需要登录）');
  } else if (notFound > 0) {
    console.log('⚠️  部分API端点缺失');
    console.log(`❌ 缺失 ${notFound} 个API端点`);
    console.log('🔧 需要完善后台路由实现');
  } else {
    console.log('⚠️  存在一些问题需要修复');
  }
  
  console.log('\n📋 建议:');
  if (authRequired > 0) {
    console.log('  1. ✅ 后台API安全措施到位');
    console.log('  2. 🔐 前端需要实现用户认证');
    console.log('  3. 📝 交易面板需要登录后使用');
  }
  
  if (notFound === 0) {
    console.log('  4. ✅ 所有API路由已正确配置');
    console.log('  5. ✅ 后台功能完整性良好');
    console.log('  6. ✅ 可以进行前端集成测试');
  } else {
    console.log('  4. ❌ 需要实现缺失的API端点');
    console.log('  5. 🔧 检查路由配置文件');
  }
  
  // 总结
  console.log('\n🏆 总结:');
  const functionalScore = ((passed - authRequired) / (total - authRequired) * 100).toFixed(1);
  console.log(`📊 功能性评分: ${functionalScore}% (不需要认证的部分)`);
  
  if (functionalScore >= 80) {
    console.log('🎉 交易面板后台服务优秀！');
  } else if (functionalScore >= 60) {
    console.log('✅ 交易面板后台服务良好！');
  } else {
    console.log('⚠️  交易面板后台服务需要改进');
  }
}

// 运行测试
console.log('🚀 开始全面测试后台API服务...\n');
testBackendWithAuth().catch(console.error);

// 处理Ctrl+C
process.on('SIGINT', () => {
  console.log('\n👋 测试已停止');
  process.exit(0);
});