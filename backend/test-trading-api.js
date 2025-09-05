#!/usr/bin/env node

// 测试交易API端点
const fetch = require('node-fetch');

async function testTradingAPI() {
  try {
    console.log('🧪 测试交易API端点...\n');

    // 测试健康检查
    console.log('1. 测试健康检查...');
    const healthResponse = await fetch('http://localhost:8000/health');
    console.log('   状态:', healthResponse.status);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   响应:', healthData);
    }

    // 测试获取交易账户
    console.log('\n2. 测试获取交易账户...');
    const accountsResponse = await fetch('http://localhost:8000/api/trading/accounts');
    console.log('   状态:', accountsResponse.status);
    if (accountsResponse.ok) {
      const accountsData = await accountsResponse.json();
      console.log('   账户数量:', accountsData.data?.length || 0);
      if (accountsData.data && accountsData.data.length > 0) {
        console.log('   第一个账户:', {
          id: accountsData.data[0].id,
          name: accountsData.data[0].name,
          balance: accountsData.data[0].balance
        });
      }
    }

    // 测试下单API（不实际下单）
    console.log('\n3. 测试下单API验证...');
    const orderData = {
      accountId: 'cmf0qbhfk0001lxpknbxekf5x',
      symbol: 'BTC/USDT',
      type: 'limit',
      side: 'buy',
      quantity: 0.001,
      price: 109612.95
    };
    
    console.log('   订单数据:', orderData);
    
    // 由于需要认证token，我们只测试API端点是否存在
    const orderResponse = await fetch('http://localhost:8000/api/trading/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });
    
    console.log('   状态:', orderResponse.status);
    if (orderResponse.status === 401) {
      console.log('   ✅ API端点存在，需要认证');
    } else if (orderResponse.ok) {
      const orderResult = await orderResponse.json();
      console.log('   响应:', orderResult);
    } else {
      const errorText = await orderResponse.text();
      console.log('   错误:', errorText);
    }

    console.log('\n✅ API测试完成');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testTradingAPI();