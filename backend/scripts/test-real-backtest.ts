import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

async function testRealBacktest() {
  try {
    console.log('🔐 登录获取认证token...');
    
    // 登录获取token
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功，获取token');
    
    // 设置认证头
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('📊 获取用户策略...');
    const strategiesResponse = await axios.get(`${BASE_URL}/strategies`, { headers });
    const strategies = strategiesResponse.data.data;
    
    if (strategies.length === 0) {
      console.log('❌ 没有找到策略，创建一个测试策略...');
      
      // 创建测试策略
      const createStrategyResponse = await axios.post(`${BASE_URL}/strategies`, {
        name: 'SMA Crossover Strategy',
        description: 'Simple moving average crossover strategy',
        code: `
          // Simple moving average crossover strategy
          function strategy(data, params) {
            const shortMA = calculateMA(data, params.shortPeriod);
            const longMA = calculateMA(data, params.longPeriod);
            
            if (shortMA > longMA && data.position <= 0) {
              return { action: 'buy', quantity: 0.1 };
            } else if (shortMA < longMA && data.position > 0) {
              return { action: 'sell', quantity: data.position };
            }
            
            return { action: 'hold' };
          }
        `,
        type: 'technical',
        parameters: {
          shortPeriod: 10,
          longPeriod: 30
        }
      }, { headers });
      
      const strategyId = createStrategyResponse.data.data.id;
      console.log(`✅ 创建测试策略成功: ${strategyId}`);
      
      // 使用新创建的策略进行回测
      await runBacktest(headers, strategyId);
    } else {
      console.log(`✅ 找到 ${strategies.length} 个策略`);
      const strategyId = strategies[0].id;
      console.log(`📊 使用策略: ${strategies[0].name}`);
      
      await runBacktest(headers, strategyId);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

async function runBacktest(headers, strategyId) {
  console.log('🧪 启动回测...');
  
  const backtestConfig = {
    strategyId: strategyId,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    initialCapital: 10000,
    parameters: {
      shortPeriod: 10,
      longPeriod: 30
    }
  };
  
  console.log('📋 回测配置:', backtestConfig);
  
  const backtestResponse = await axios.post(`${BASE_URL}/backtest/start`, backtestConfig, { headers });
  console.log('✅ 回测启动成功:', backtestResponse.data);
  
  // 等待一段时间后检查回测结果
  console.log('⏳ 等待回测完成...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 检查回测状态
  const backtestId = backtestResponse.data.data.id;
  const statusResponse = await axios.get(`${BASE_URL}/backtest/results/${backtestId}`, { headers });
  console.log('📊 回测状态:', statusResponse.data);
}

testRealBacktest();