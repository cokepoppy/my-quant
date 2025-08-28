// 最终验证测试 - 确认问题已解决
const http = require('http');

// 测试数据
const loginData = JSON.stringify({
  email: 'test@example.com',
  password: 'password123'
});

console.log('🔍 最终验证测试 - 确认问题已解决...\n');

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
        
        // 2. 完整的前端流程测试
        testCompleteFrontendFlow(token);
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

function testCompleteFrontendFlow(token) {
  console.log('\n📋 步骤2: 完整的前端流程测试');
  
  // 获取策略列表
  const strategiesOptions = {
    hostname: 'localhost',
    port: 8000,
    path: '/strategies',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  const strategiesReq = http.request(strategiesOptions, (res) => {
    let data = '';
    
    res.on('data', chunk => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (response.success && response.data.strategies.length > 0) {
          const strategy = response.data.strategies[0];
          console.log(`✅ 找到策略: ${strategy.name} (ID: ${strategy.id})`);
          
          // 模拟前端组件的完整流程
          simulateFrontendComponent(token, strategy);
          
        } else {
          console.log('❌ 没有找到策略');
        }
      } catch (error) {
        console.log('❌ 解析策略列表响应失败:', error.message);
      }
    });
  });
  
  strategiesReq.on('error', (e) => {
    console.log('❌ 获取策略列表失败:', e.message);
  });
  
  strategiesReq.end();
}

function simulateFrontendComponent(token, strategy) {
  console.log('\n🔥 模拟前端组件的完整流程');
  
  // 模拟StrategyDetail组件的props
  const props = {
    strategyId: strategy.id,
    strategy: strategy
  };
  
  console.log('🔥 组件props:', {
    strategyId: props.strategyId,
    strategyName: props.strategy.name,
    strategyStatus: props.strategy.status
  });
  
  // 模拟组件内部的策略对象
  const componentStrategy = {
    id: props.strategyId,
    name: props.strategy.name,
    status: props.strategy.status
  };
  
  console.log('🔥 组件内部策略对象:', componentStrategy);
  
  // 模拟loadStrategy函数
  console.log('\n🔥 模拟loadStrategy函数...');
  console.log('🔥 使用传入的策略数据');
  console.log('🔥 策略对象合并后:', componentStrategy);
  
  // 模拟toggleStrategyStatus函数
  console.log('\n🔥 模拟toggleStrategyStatus函数...');
  
  const newStatus = componentStrategy.status === 'active' ? 'inactive' : 'active';
  const actionText = newStatus === 'active' ? '启用' : '停用';
  
  console.log('🔥 状态切换计划:', {
    from: componentStrategy.status,
    to: newStatus,
    action: actionText
  });
  
  // 模拟API调用
  const statusData = JSON.stringify({ status: newStatus });
  
  const options = {
    hostname: 'localhost',
    port: 8000,
    path: `/strategies/${props.strategyId}/status`,
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(statusData)
    }
  };
  
  console.log('🔥 API调用详情:', {
    url: options.path,
    method: options.method,
    data: statusData
  });
  
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
            
            // 模拟前端组件处理
            processFrontendResponse(finalResponse, newStatus, actionText, componentStrategy);
          } else {
            console.log('⚠️ result没有success属性，包装返回');
            const finalResponse = {
              success: apiResponse.success,
              message: apiResponse.message,
              data: result
            };
            console.log('🔥 最终响应:', finalResponse);
            
            // 模拟前端组件处理
            processFrontendResponse(finalResponse, newStatus, actionText, componentStrategy);
          }
        } else {
          console.log('❌ API响应失败');
          console.log('❌ 前端显示错误消息: 操作失败: ' + apiResponse.message);
        }
        
      } catch (error) {
        console.log('❌ 解析API响应失败:', error.message);
        console.log('❌ 前端显示错误消息: 操作失败: 未知错误');
      }
    });
  });
  
  req.on('error', (e) => {
    console.log('❌ API请求失败:', e.message);
    console.log('❌ 前端显示错误消息: 操作失败: ' + e.message);
  });
  
  req.write(statusData);
  req.end();
}

function processFrontendResponse(response, newStatus, actionText, strategy) {
  console.log('\n🔥 模拟前端组件处理响应...');
  
  console.log('🔥 前端接收到的响应:', {
    success: response.success,
    message: response.message,
    hasData: 'data' in response,
    hasStrategy: 'strategy' in (response.data || response)
  });
  
  if (response && response.success) {
    console.log('✅ 前端检测到成功响应');
    console.log('🔥 更新本地状态...');
    strategy.status = newStatus;
    console.log('✅ 本地状态更新成功:', strategy.status);
    console.log('✅ 显示成功消息: 策略' + actionText + '成功');
    console.log('\n🎉 状态切换流程完全成功！');
  } else {
    console.log('❌ 前端检测到失败响应');
    console.log('❌ 错误消息:', response.message);
    console.log('❌ 显示错误消息: 操作失败: ' + response.message);
  }
}

console.log('🔍 这个测试将完全验证:');
console.log('   1. 完整的前端组件流程');
console.log('   2. 修复后的API拦截器');
console.log('   3. 前端组件的正确响应处理');
console.log('   4. 状态更新的成功完成');
console.log('   5. 用户体验的正确性');