// 模拟前端 StrategyDetail.vue 的情况
const http = require('http');

// 测试数据
const loginData = JSON.stringify({
  email: 'test@example.com',
  password: 'password123'
});

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

console.log('🔍 模拟前端 StrategyDetail.vue 的策略状态切换问题...\n');

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
        
        // 2. 获取策略列表（模拟前端策略选择）
        simulateFrontendStrategySelection(token);
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

function simulateFrontendStrategySelection(token) {
  console.log('\n📋 步骤2: 模拟前端策略选择');
  
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
          const strategies = response.data.strategies;
          console.log(`✅ 找到 ${strategies.length} 个策略`);
          
          // 选择第一个策略进行测试
          const selectedStrategy = strategies[0];
          console.log(`🎯 选择策略: ${selectedStrategy.name} (ID: ${selectedStrategy.id}, 状态: ${selectedStrategy.status})`);
          
          // 模拟 StrategyDetail.vue 接收到的 props
          const props = {
            strategyId: selectedStrategy.id,
            strategy: selectedStrategy
          };
          
          console.log('📦 StrategyDetail.vue 接收到的 props:');
          console.log(`   strategyId: ${props.strategyId}`);
          console.log(`   strategy.name: ${props.strategy.name}`);
          console.log(`   strategy.status: ${props.strategy.status}`);
          
          // 模拟 toggleStrategyStatus 函数调用
          simulateToggleStrategyStatus(token, props);
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

function simulateToggleStrategyStatus(token, props) {
  console.log('\n📋 步骤3: 模拟 toggleStrategyStatus 函数');
  
  // 模拟 StrategyDetail.vue 中的 strategy 对象
  const strategy = {
    id: props.strategyId,
    name: props.strategy.name,
    status: props.strategy.status
  };
  
  console.log('🔄 当前 strategy 对象:');
  console.log(`   id: ${strategy.id}`);
  console.log(`   name: ${strategy.name}`);
  console.log(`   status: ${strategy.status}`);
  
  // 计算新状态
  const newStatus = strategy.status === 'active' ? 'inactive' : 'active';
  const actionText = newStatus === 'active' ? '启用' : '停用';
  
  console.log(`📋 计划状态切换:`);
  console.log(`   当前状态: ${strategy.status}`);
  console.log(`   目标状态: ${newStatus}`);
  console.log(`   操作: ${actionText}`);
  
  // 模拟 API 调用
  const statusData = JSON.stringify({ status: newStatus });
  
  const statusOptions = {
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
  
  console.log(`🌐 API 调用:`);
  console.log(`   方法: PUT`);
  console.log(`   路径: /strategies/${props.strategyId}/status`);
  console.log(`   数据: { "status": "${newStatus}" }`);
  
  const statusReq = http.request(statusOptions, (res) => {
    let data = '';
    
    res.on('data', chunk => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        console.log('📥 API 响应:', data);
        const response = JSON.parse(data);
        
        if (response.success) {
          console.log('✅ 状态切换 API 调用成功');
          
          // 模拟前端更新本地状态
          strategy.status = newStatus;
          console.log(`🔄 前端状态更新:`);
          console.log(`   strategy.status 更新为: ${strategy.status}`);
          
          // 验证状态更新
          verifyStatusUpdate(token, props.strategyId, newStatus);
        } else {
          console.log('❌ 状态切换 API 调用失败:', response.message);
          console.log('🔍 这可能是前端看到错误的原因');
        }
      } catch (error) {
        console.log('❌ 解析状态切换响应失败:', error.message);
      }
    });
  });
  
  statusReq.on('error', (e) => {
    console.log('❌ 状态切换请求失败:', e.message);
    console.log('🔍 这可能是网络问题导致的错误');
  });
  
  statusReq.write(statusData);
  statusReq.end();
}

function verifyStatusUpdate(token, strategyId, expectedStatus) {
  console.log('\n📋 步骤4: 验证状态更新');
  
  const verifyOptions = {
    hostname: 'localhost',
    port: 8000,
    path: `/strategies/${strategyId}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  const verifyReq = http.request(verifyOptions, (res) => {
    let data = '';
    
    res.on('data', chunk => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        console.log('📥 验证响应:', data);
        const response = JSON.parse(data);
        
        if (response.success) {
          const updatedStrategy = response.data.strategy;
          console.log(`🔍 验证结果:`);
          console.log(`   期望状态: ${expectedStatus}`);
          console.log(`   实际状态: ${updatedStrategy.status}`);
          
          if (updatedStrategy.status === expectedStatus) {
            console.log('✅ 状态更新验证成功');
            console.log('\n🎉 结论: 策略状态切换功能完全正常！');
            console.log('📋 如果前端仍然看到错误，可能是以下原因:');
            console.log('   1. 前端组件没有正确接收到策略ID');
            console.log('   2. 前端状态更新逻辑有问题');
            console.log('   3. 前端错误处理逻辑有问题');
          } else {
            console.log('❌ 状态更新验证失败');
          }
        } else {
          console.log('❌ 获取策略详情失败:', response.message);
        }
      } catch (error) {
        console.log('❌ 解析验证响应失败:', error.message);
      }
    });
  });
  
  verifyReq.on('error', (e) => {
    console.log('❌ 验证请求失败:', e.message);
  });
  
  verifyReq.end();
}