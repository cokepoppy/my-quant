const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:8000';
const API_URL = `${BASE_URL}/api`;

// 测试用户凭据
const TEST_USER = {
  username: 'testuser',
  password: 'testpass123'
};

let authToken = '';

// 登录获取token
async function login() {
  try {
    console.log('🔐 正在登录...');
    const response = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    
    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ 登录成功');
      return true;
    } else {
      console.error('❌ 登录失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ 登录请求失败:', error.message);
    return false;
  }
}

// 测试交易账户API
async function testTradingAccounts() {
  try {
    console.log('📊 测试交易账户API...');
    
    const response = await axios.get(`${API_URL}/trading/accounts`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ 交易账户API响应:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('❌ 交易账户API测试失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试持仓API
async function testPositions() {
  try {
    console.log('📈 测试持仓API...');
    
    const response = await axios.get(`${API_URL}/trading/positions`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ 持仓API响应:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('❌ 持仓API测试失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试下单API
async function testPlaceOrder() {
  try {
    console.log('🛒 测试下单API...');
    
    const orderData = {
      accountId: 'test-account-id',
      symbol: 'BTCUSDT',
      type: 'market',
      side: 'buy',
      quantity: 0.001
    };
    
    const response = await axios.post(`${API_URL}/trading/order`, orderData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ 下单API响应:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('❌ 下单API测试失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试订单历史API
async function testOrderHistory() {
  try {
    console.log('📋 测试订单历史API...');
    
    const response = await axios.get(`${API_URL}/trading/orders`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      params: {
        page: 1,
        limit: 10
      }
    });
    
    console.log('✅ 订单历史API响应:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('❌ 订单历史API测试失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试交易统计API
async function testTradingStats() {
  try {
    console.log('📊 测试交易统计API...');
    
    const response = await axios.get(`${API_URL}/trading/stats`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ 交易统计API响应:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('❌ 交易统计API测试失败:', error.response?.data || error.message);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试交易面板API功能...\n');
  
  // 登录
  const loggedIn = await login();
  if (!loggedIn) {
    console.error('❌ 登录失败，无法继续测试');
    return;
  }
  
  console.log('\n📋 开始API测试...\n');
  
  const tests = [
    { name: '交易账户API', test: testTradingAccounts },
    { name: '持仓API', test: testPositions },
    { name: '下单API', test: testPlaceOrder },
    { name: '订单历史API', test: testOrderHistory },
    { name: '交易统计API', test: testTradingStats }
  ];
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const testCase of tests) {
    try {
      const result = await testCase.test();
      if (result) {
        passedTests++;
        console.log(`✅ ${testCase.name} - 通过`);
      } else {
        failedTests++;
        console.log(`❌ ${testCase.name} - 失败`);
      }
    } catch (error) {
      failedTests++;
      console.log(`❌ ${testCase.name} - 异常: ${error.message}`);
    }
    console.log(''); // 空行分隔
  }
  
  console.log('🎯 测试结果汇总:');
  console.log(`✅ 通过: ${passedTests}`);
  console.log(`❌ 失败: ${failedTests}`);
  console.log(`📊 成功率: ${((passedTests / tests.length) * 100).toFixed(1)}%`);
}

// 运行测试
runTests().catch(console.error);