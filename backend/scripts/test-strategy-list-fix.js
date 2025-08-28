// 测试修复后的策略列表功能
const http = require('http');

// 测试数据
const loginData = JSON.stringify({
  email: 'test@example.com',
  password: 'password123'
});

console.log('🔍 测试修复后的策略列表功能...\n');

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
  
  const params = {
    page: 1,
    limit: 10,
    search: undefined,
    status: undefined,
    type: undefined
  };
  
  console.log('🔥 请求参数:', params);
  
  const options = {
    hostname: 'localhost',
    port: 8000,
    path: '/strategies',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  // 添加查询参数
  const queryString = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined) {
      queryString.append(key, params[key]);
    }
  });
  
  if (queryString.toString()) {
    options.path += '?' + queryString.toString();
  }
  
  console.log('🔥 请求URL:', options.path);
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', chunk => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        console.log('📥 API原始响应:', data);
        
        const apiResponse = JSON.parse(data);
        
        console.log('📥 API响应解析结果:', {
          success: apiResponse.success,
          message: apiResponse.message,
          hasData: 'data' in apiResponse,
          dataType: typeof apiResponse.data,
          dataKeys: Object.keys(apiResponse.data || {})
        });
        
        // 模拟修复后的API拦截器
        console.log('\n🔥 模拟修复后的API拦截器处理...');
        
        if (apiResponse.success) {
          const result = apiResponse.data !== undefined ? apiResponse.data : apiResponse;
          console.log('🔥 拦截器提取的result:', result);
          
          // 检查result是否有success属性
          if ('success' in result) {
            console.log('✅ result有success属性，直接返回');
            const finalResponse = result;
            console.log('🔥 最终响应:', finalResponse);
            
            // 模拟前端API函数处理
            processStrategyListResponse(finalResponse);
          } else {
            console.log('⚠️ result没有success属性，包装返回');
            const finalResponse = {
              success: apiResponse.success,
              message: apiResponse.message,
              data: result
            };
            console.log('🔥 最终响应:', finalResponse);
            
            // 模拟前端API函数处理
            processStrategyListResponse(finalResponse);
          }
        } else {
          console.log('❌ API响应失败');
          console.log('❌ 前端显示错误消息: 加载策略列表失败: ' + apiResponse.message);
        }
        
      } catch (error) {
        console.log('❌ 解析API响应失败:', error.message);
        console.log('❌ 前端显示错误消息: 加载策略列表失败: 未知错误');
      }
    });
  });
  
  req.on('error', (e) => {
    console.log('❌ API请求失败:', e.message);
    console.log('❌ 前端显示错误消息: 加载策略列表失败: ' + e.message);
  });
  
  req.end();
}

function processStrategyListResponse(response) {
  console.log('\n🔥 模拟前端getStrategies函数处理响应...');
  
  console.log('🔥 前端接收到的响应:', {
    success: response.success,
    message: response.message,
    hasData: 'data' in response,
    hasStrategies: 'strategies' in response,
    hasPagination: 'pagination' in response
  });
  
  // 处理不同的响应结构
  let strategiesData = [];
  let paginationData = { total: 0 };
  
  if (response.success !== undefined && response.data) {
    // 新结构：{ success: true, data: { strategies: [...], pagination: {...} } }
    console.log('🔥 getStrategies: 使用新响应结构');
    strategiesData = response.data.strategies || [];
    paginationData = response.data.pagination || { total: 0 };
  } else if (response.strategies && response.pagination) {
    // 旧结构：{ strategies: [...], pagination: {...} }
    console.log('🔥 getStrategies: 使用旧响应结构');
    strategiesData = response.strategies || [];
    paginationData = response.pagination || { total: 0 };
  } else {
    console.log('🔥 getStrategies: 未知的响应结构，使用默认值');
    strategiesData = [];
    paginationData = { total: 0 };
  }
  
  console.log('🔥 处理后的数据:', {
    strategies: strategiesData,
    pagination: paginationData
  });
  
  // 模拟前端组件使用数据
  console.log('\n🔥 模拟前端组件使用数据...');
  console.log('🔥 strategies.value =', strategiesData);
  console.log('🔥 totalStrategies.value =', paginationData.total);
  console.log('🔥 策略数量:', strategiesData.length);
  console.log('🔥 总数:', paginationData.total);
  
  if (strategiesData.length > 0) {
    console.log('✅ 策略列表加载成功');
    console.log('📋 策略列表:');
    strategiesData.forEach((strategy, index) => {
      console.log(`   ${index + 1}. ${strategy.name} (ID: ${strategy.id}, 状态: ${strategy.status})`);
    });
    
    // 测试获取策略详情
    const firstStrategy = strategiesData[0];
    testStrategyDetailAPI(token, firstStrategy.id);
  } else {
    console.log('⚠️ 策略列表为空');
  }
}

function testStrategyDetailAPI(token, strategyId) {
  
  const options = {
    hostname: 'localhost',
    port: 8000,
    path: `/strategies/${strategyId}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  console.log('🔥 请求URL:', options.path);
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', chunk => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        console.log('📥 策略详情API原始响应:', data);
        
        const apiResponse = JSON.parse(data);
        
        console.log('📥 策略详情API响应解析结果:', {
          success: apiResponse.success,
          message: apiResponse.message,
          hasData: 'data' in apiResponse,
          hasStrategy: 'strategy' in apiResponse,
          dataKeys: Object.keys(apiResponse.data || {})
        });
        
        // 模拟修复后的API拦截器处理
        console.log('\n🔥 模拟修复后的API拦截器处理...');
        
        if (apiResponse.success) {
          const result = apiResponse.data !== undefined ? apiResponse.data : apiResponse;
          console.log('🔥 拦截器提取的result:', result);
          
          if ('success' in result) {
            console.log('✅ result有success属性，直接返回');
            const finalResponse = result;
            console.log('🔥 最终响应:', finalResponse);
            processStrategyDetailResponse(finalResponse);
          } else {
            console.log('⚠️ result没有success属性，包装返回');
            const finalResponse = {
              success: apiResponse.success,
              message: apiResponse.message,
              data: result
            };
            console.log('🔥 最终响应:', finalResponse);
            processStrategyDetailResponse(finalResponse);
          }
        } else {
          console.log('❌ API响应失败');
        }
        
      } catch (error) {
        console.log('❌ 解析策略详情API响应失败:', error.message);
      }
    });
  });
  
  req.on('error', (e) => {
    console.log('❌ 策略详情API请求失败:', e.message);
  });
  
  req.end();
}

function processStrategyDetailResponse(response) {
  console.log('\n🔥 模拟前端getStrategyById函数处理响应...');
  
  console.log('🔥 前端接收到的响应:', {
    success: response.success,
    hasStrategy: 'strategy' in response,
    hasData: 'data' in response,
    strategy: response.strategy,
    data: response.data
  });
  
  // 处理不同的响应结构
  let strategyData = null;
  
  if (response.success !== undefined && response.data) {
    // 新结构：{ success: true, data: { strategy: {...} } }
    console.log('🔥 getStrategyById: 使用新响应结构');
    strategyData = response.data.strategy || response.data;
  } else if (response.strategy) {
    // 旧结构：{ strategy: {...} }
    console.log('🔥 getStrategyById: 使用旧响应结构');
    strategyData = response.strategy;
  } else {
    // 直接返回策略对象
    console.log('🔥 getStrategyById: 直接返回策略对象');
    strategyData = response;
  }
  
  console.log('🔥 处理后的策略数据:', strategyData);
  
  if (strategyData) {
    console.log('✅ 策略详情加载成功');
    console.log('📋 策略信息:');
    console.log(`   名称: ${strategyData.name}`);
    console.log(`   ID: ${strategyData.id}`);
    console.log(`   状态: ${strategyData.status}`);
    console.log(`   类型: ${strategyData.type}`);
    console.log(`   描述: ${strategyData.description}`);
  } else {
    console.log('❌ 策略详情加载失败');
  }
}

console.log('🔍 这个测试将验证:');
console.log('   1. 策略列表API的正确响应');
console.log('   2. 修复后的API拦截器处理');
console.log('   3. 前端API函数的正确处理');
console.log('   4. 策略详情API的正确响应');
console.log('   5. 完整的前端组件流程');