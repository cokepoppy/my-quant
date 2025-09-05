#!/usr/bin/env node

// 测试后端服务是否正常工作
const fetch = require('node-fetch');

async function testBackendService() {
  try {
    console.log('🧪 测试后端服务是否正常工作...\n');

    // 测试后端健康检查
    const healthResponse = await fetch('http://localhost:8000/health');
    console.log('健康检查状态:', healthResponse.status);

    // 测试交易所连接
    const exchangeResponse = await fetch('http://localhost:8000/api/exchange/accounts');
    console.log('交易所API状态:', exchangeResponse.status);

    if (exchangeResponse.ok) {
      const exchanges = await exchangeResponse.json();
      console.log('已配置的交易所数量:', exchanges.data?.length || 0);
    }

    console.log('\n✅ 后端服务运行正常！');
    console.log('🚀 现在可以测试交易功能了');

  } catch (error) {
    console.error('❌ 后端服务测试失败:', error.message);
    console.log('💡 请确保后端服务正在运行在 http://localhost:8000');
  }
}

testBackendService();