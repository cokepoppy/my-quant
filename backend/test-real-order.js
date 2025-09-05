#!/usr/bin/env node

// 测试真实API下单
const fetch = require('node-fetch');

async function testRealOrder() {
  try {
    console.log('🧪 测试真实API下单...\n');

    // 根据用户提供的购买记录构建订单数据
    const orderData = {
      accountId: 'cmf0qbhfk0001lxpknbxekf5x', // 使用第一个账户ID
      symbol: 'BTC/USDT',
      type: 'limit', // 限价单
      side: 'buy', // 买入
      quantity: 0.001, // 0.001 BTC
      price: 109612.95, // 限价 109,612.95 USDT
      timeInForce: 'gtc' // Good Till Cancel
    };

    console.log('📋 订单数据:');
    console.log('  - 账户ID:', orderData.accountId);
    console.log('  - 交易对:', orderData.symbol);
    console.log('  - 订单类型:', orderData.type);
    console.log('  - 方向:', orderData.side);
    console.log('  - 数量:', orderData.quantity);
    console.log('  - 价格:', orderData.price);
    console.log('  - 有效期:', orderData.timeInForce);

    // 发送交易请求
    console.log('\n🚀 发送交易请求...');
    const response = await fetch('http://localhost:8000/api/trading/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-token-here' // 需要真实的token
      },
      body: JSON.stringify(orderData)
    });

    console.log('📊 响应状态:', response.status);
    console.log('📊 响应头:', Object.fromEntries(response.headers));

    if (response.ok) {
      const result = await response.json();
      console.log('✅ 交易成功:', JSON.stringify(result, null, 2));
    } else {
      const error = await response.json();
      console.log('❌ 交易失败:', JSON.stringify(error, null, 2));
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.log('💡 这可能是因为需要认证token');
    console.log('🌐 请直接在前端交易面板测试下单功能');
  }
}

testRealOrder();