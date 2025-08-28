// 简化版策略列表功能测试
const http = require('http');

// 测试数据
const loginData = JSON.stringify({
  email: 'test@example.com',
  password: 'password123'
});

console.log('🔍 简化版策略列表功能测试...\n');

// 1. 登录
const loginOptions = {
  hostname: 'localhost',
  port: 8000,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
};

console.log('📋 步骤1: 登录获取认证token');

const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  
  res.on('data', chunk => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.success) {
        const token = response.data.token;
        console.log('✅ 登录成功，获取token');
        
        // 2. 测试策略列表API
        testStrategyListAPI(token);
      } else {
        console.log('❌ 登录失败:', response.message);
      }
    } catch (error) {
      console.log('❌ 解析登录响应失败:', error.message);
    }
  });
});

loginReq.on('error', (e) => {
  console.log('❌ 登录请求失败:', e.message);
});

loginReq.write(loginData);
loginReq.end();

function testStrategyListAPI(token) {
  console.log('\n📋 步骤2: 测试策略列表API');
  
  const options = {
    hostname: 'localhost',
    port: 8000,
    path: '/strategies?page=1&limit=10',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', chunk => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        console.log('📥 API原始响应:', data);
        
        const apiResponse = JSON.parse(data);
        
        console.log('📥 API响应结构:', {
          success: apiResponse.success,
          hasData: 'data' in apiResponse,
          dataKeys: Object.keys(apiResponse.data || {})
        });
        
        // 模拟修复后的API拦截器处理
        if (apiResponse.success) {
          const result = apiResponse.data !== undefined ? apiResponse.data : apiResponse;
          
          if ('success' in result) {
            console.log('✅ result有success属性，直接返回');
            const finalResponse = result;
            console.log('🔥 最终响应:', finalResponse);
            processStrategyListResponse(finalResponse);
          } else {
            console.log('⚠️ result没有success属性，包装返回');
            const finalResponse = {
              success: apiResponse.success,
              message: apiResponse.message,
              data: result
            };
            console.log('🔥 最终响应:', finalResponse);
            processStrategyListResponse(finalResponse);
          }
        } else {
          console.log('❌ API响应失败');
        }
        
      } catch (error) {
        console.log('❌ 解析API响应失败:', error.message);
      }
    });
  });
  
  req.on('error', (e) => {
    console.log('❌ API请求失败:', e.message);
  });
  
  req.end();
}

function processStrategyListResponse(response) {
  console.log('\n🔥 模拟前端getStrategies函数处理响应...');
  
  console.log('🔥 响应结构:', {
    success: response.success,
    hasData: 'data' in response,
    hasStrategies: 'strategies' in response,
    hasPagination: 'pagination' in response
  });
  
  // 处理不同的响应结构
  let strategiesData = [];
  let paginationData = { total: 0 };
  
  if (response.success !== undefined && response.data) {
    // 新结构：{ success: true, data: { strategies: [...], pagination: {...} } }
    console.log('🔥 使用新响应结构');
    strategiesData = response.data.strategies || [];
    paginationData = response.data.pagination || { total: 0 };
  } else if (response.strategies && response.pagination) {
    // 旧结构：{ strategies: [...], pagination: {...} }
    console.log('🔥 使用旧响应结构');
    strategiesData = response.strategies || [];
    paginationData = response.pagination || { total: 0 };
  } else {
    console.log('🔥 未知的响应结构，使用默认值');
    strategiesData = [];
    paginationData = { total: 0 };
  }
  
  console.log('🔥 处理后的数据:', {
    strategies: strategiesData,
    pagination: paginationData
  });
  
  // 模拟前端组件使用数据
  console.log('\n🔥 模拟前端组件使用数据...');
  console.log('🔥 strategies.value =', strategiesData.length, '个策略');
  console.log('🔥 totalStrategies.value =', paginationData.total);
  
  if (strategiesData.length > 0) {
    console.log('✅ 策略列表加载成功');
    console.log('📋 策略列表:');
    strategiesData.forEach((strategy, index) => {
      console.log(`   ${index + 1}. ${strategy.name} (ID: ${strategy.id}, 状态: ${strategy.status})`);
    });
    
    // 测试策略状态切换
    const firstStrategy = strategiesData[0];
    testStrategyStatusUpdate(token, firstStrategy);
  } else {
    console.log('⚠️ 策略列表为空');
  }
}

function testStrategyStatusUpdate(token, strategy) {
  console.log('\n📋 步骤3: 测试策略状态切换');
  
  const newStatus = strategy.status === 'active' ? 'inactive' : 'active';
  const statusData = JSON.stringify({ status: newStatus });
  
  const options = {
    hostname: 'localhost',
    port: 8000,
    path: `/strategies/${strategy.id}/status`,
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(statusData)
    }
  };
  
  console.log(`🔥 测试状态切换: ${strategy.status} -> ${newStatus}`);
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', chunk => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        console.log('📥 状态切换API响应:', data);
        
        const apiResponse = JSON.parse(data);
        
        // 模拟修复后的API拦截器处理
        if (apiResponse.success) {
          const result = apiResponse.data !== undefined ? apiResponse.data : apiResponse;
          
          if ('success' in result) {
            console.log('✅ 状态切换成功，直接返回');
            console.log('🔥 最终响应:', result);
          } else {
            console.log('⚠️ 包装返回响应');
            const finalResponse = {
              success: apiResponse.success,
              message: apiResponse.message,
              data: result
            };
            console.log('🔥 最终响应:', finalResponse);
          }
        } else {
          console.log('❌ 状态切换失败');
        }
        
      } catch (error) {
        console.log('❌ 解析状态切换响应失败:', error.message);
      }
    });
  });
  
  req.on('error', (e) => {
    console.log('❌ 状态切换请求失败:', e.message);
  });
  
  req.write(statusData);
  req.end();
}

console.log('🔍 这个测试将验证:');
console.log('   1. 策略列表API的完整流程');
console.log('   2. 修复后的API拦截器');
console.log('   3. 前端组件的数据处理');
console.log('   4. 策略状态切换功能');
console.log('   5. 整体功能的正确性');