#!/usr/bin/env node

const http = require('http');

// 测试函数
async function testAPI(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试交易面板相关API...\n');
  
  const tests = [
    {
      name: '健康检查',
      endpoint: '/health',
      method: 'GET'
    },
    {
      name: '获取交易所列表',
      endpoint: '/api/exchange',
      method: 'GET'
    },
    {
      name: '测试交易所连接配置',
      endpoint: '/api/exchange/test',
      method: 'POST',
      data: {
        exchange: 'bybit',
        apiKey: 'test_key',
        apiSecret: 'test_secret',
        testnet: true
      }
    },
    {
      name: '创建交易所账户',
      endpoint: '/api/exchange',
      method: 'POST',
      data: {
        name: 'Test Bybit Account',
        exchange: 'bybit',
        type: 'demo',
        apiKey: 'test_key_123',
        apiSecret: 'test_secret_456',
        testnet: true,
        balance: 0
      }
    }
  ];
  
  for (const test of tests) {
    console.log(`📋 测试: ${test.name}`);
    console.log(`   端点: ${test.method} ${test.endpoint}`);
    
    try {
      const response = await testAPI(test.endpoint, test.method, test.data);
      
      console.log(`   状态码: ${response.status}`);
      
      if (response.status === 200) {
        console.log('   ✅ 成功');
        
        try {
          const data = JSON.parse(response.body);
          if (data.success !== false) {
            console.log(`   响应: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
          } else {
            console.log(`   ❌ 业务错误: ${data.message || '未知错误'}`);
          }
        } catch (e) {
          console.log(`   响应: ${response.body.substring(0, 200)}...`);
        }
      } else {
        console.log(`   ❌ HTTP错误: ${response.status}`);
        console.log(`   响应: ${response.body.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`   ❌ 网络错误: ${error.message}`);
    }
    
    console.log(''); // 空行分隔
  }
  
  console.log('🎯 API测试完成');
}

// 运行测试
runTests().catch(console.error);