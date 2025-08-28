// 模拟前端完整的API调用流程
const http = require('http');

// 测试数据
const loginData = JSON.stringify({
  email: 'test@example.com',
  password: 'password123'
});

console.log('🔍 模拟前端完整的API调用流程...\n');

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
        
        // 2. 获取策略列表
        getStrategies(token);
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

function getStrategies(token) {
  console.log('\n📋 步骤2: 获取策略列表');
  
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
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', chunk => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        console.log('📥 策略列表响应:');
        console.log('   成功:', response.success);
        console.log('   消息:', response.message);
        console.log('   数据类型:', typeof response.data);
        console.log('   策略数量:', response.data?.strategies?.length || 0);
        
        if (response.success && response.data.strategies.length > 0) {
          const strategy = response.data.strategies[0];
          console.log(`✅ 找到策略: ${strategy.name} (ID: ${strategy.id})`);
          
          // 模拟前端组件接收到的props
          const props = {
            strategyId: strategy.id,
            strategy: strategy
          };
          
          console.log('🔥 模拟前端组件props:');
          console.log('   strategyId:', props.strategyId);
          console.log('   strategy.name:', props.strategy.name);
          console.log('   strategy.status:', props.strategy.status);
          
          // 3. 模拟StrategyDetail组件的完整流程
          simulateStrategyDetailFlow(token, props);
        } else {
          console.log('❌ 没有找到策略');
        }
      } catch (error) {
        console.log('❌ 解析策略列表响应失败:', error.message);
      }
    });
  });
  
  req.on('error', (e) => {
    console.log('❌ 获取策略列表失败:', e.message);
  });
  
  req.end();
}

function simulateStrategyDetailFlow(token, props) {
  console.log('\n📋 步骤3: 模拟StrategyDetail组件的完整流程');
  
  // 模拟StrategyDetail组件的策略对象
  const strategy = {
    id: props.strategyId,
    name: props.strategy.name,
    status: props.strategy.status
  };
  
  console.log('🔥 组件内部策略对象:');
  console.log('   id:', strategy.id);
  console.log('   name:', strategy.name);
  console.log('   status:', strategy.status);
  
  // 模拟loadStrategy函数的行为
  console.log('\n🔥 模拟loadStrategy函数...');
  
  // 由于props.strategy存在，直接使用传入的数据
  console.log('🔥 使用传入的策略数据');
  console.log('🔥 策略对象合并后:', strategy);
  
  // 4. 模拟toggleStrategyStatus函数
  console.log('\n🔥 模拟toggleStrategyStatus函数...');
  
  const newStatus = strategy.status === 'active' ? 'inactive' : 'active';
  const actionText = newStatus === 'active' ? '启用' : '停用';
  
  console.log('🔥 计划状态切换:');
  console.log('   从:', strategy.status);
  console.log('   到:', newStatus);
  console.log('   操作:', actionText);
  
  // 5. 模拟API调用
  console.log('\n🔥 模拟API调用: strategyApi.updateStrategyStatus');
  
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
  
  console.log('🔥 API请求详情:');
  console.log('   URL:', options.path);
  console.log('   方法:', options.method);
  console.log('   头部:', options.headers);
  console.log('   数据:', statusData);
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', chunk => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        console.log('📥 API原始响应:');
        console.log('   响应状态:', res.statusCode);
        console.log('   响应数据:', data);
        
        const response = JSON.parse(data);
        
        console.log('📥 解析后的API响应:');
        console.log('   成功:', response.success);
        console.log('   消息:', response.message);
        console.log('   数据类型:', typeof response.data);
        console.log('   数据:', response.data);
        
        // 模拟前端API拦截器的处理
        console.log('\n🔥 模拟前端API拦截器处理...');
        
        if (response.success) {
          console.log('✅ 拦截器: 响应成功');
          console.log('🔥 拦截器返回的数据:', response.data);
          
          // 模拟前端组件处理成功响应
          console.log('\n🔥 模拟前端组件处理成功响应...');
          strategy.status = newStatus;
          console.log('✅ 本地状态更新成功');
          console.log('🔥 更新后的状态:', strategy.status);
          console.log('✅ 显示成功消息: 策略' + actionText + '成功');
        } else {
          console.log('❌ 拦截器: 响应失败');
          console.log('❌ 错误消息:', response.message);
          console.log('❌ 抛出错误: new Error("' + response.message + '")');
          
          // 模拟前端组件处理失败响应
          console.log('\n🔥 模拟前端组件处理失败响应...');
          console.log('❌ 显示错误消息: 操作失败: ' + response.message);
        }
        
      } catch (error) {
        console.log('❌ 解析API响应失败:', error.message);
        console.log('❌ 显示错误消息: 操作失败: 未知错误');
      }
    });
  });
  
  req.on('error', (e) => {
    console.log('❌ API请求失败:', e.message);
    console.log('❌ 显示错误消息: 操作失败: ' + e.message);
  });
  
  req.write(statusData);
  req.end();
}

console.log('🔍 这个测试将帮助我们确定:');
console.log('   1. 完整的前端API调用流程');
console.log('   2. 每个步骤的详细状态');
console.log('   3. API响应的完整结构');
console.log('   4. 前端拦截器的处理逻辑');
console.log('   5. 可能的问题所在');