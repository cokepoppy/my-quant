const http = require('http');

// 测试数据
const testData = {
  email: 'test@example.com',
  password: 'password123'
};

const loginData = JSON.stringify(testData);

// 创建登录请求
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

console.log('🔍 开始诊断策略状态切换问题...\n');

console.log('📋 步骤1: 登录获取认证token');

const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  
  res.on('data', chunk => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      console.log('📥 登录响应:', data);
      const response = JSON.parse(data);
      
      if (response.success) {
        const token = response.data.token;
        console.log('✅ 登录成功，获取token');
        
        // 继续测试策略状态切换
        testStrategyStatus(token);
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

function testStrategyStatus(token) {
  console.log('\n📋 步骤2: 获取策略列表');
  
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
        console.log('📥 策略列表响应:', data);
        const response = JSON.parse(data);
        
        if (response.success && response.data.strategies.length > 0) {
          const strategies = response.data.strategies;
          console.log(`✅ 找到 ${strategies.length} 个策略`);
          
          // 选择第一个策略进行测试
          const testStrategy = strategies[0];
          console.log(`🎯 测试策略: ${testStrategy.name} (ID: ${testStrategy.id}, 状态: ${testStrategy.status})`);
          
          // 测试状态切换
          testStatusUpdate(token, testStrategy);
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

function testStatusUpdate(token, strategy) {
  console.log('\n📋 步骤3: 测试状态切换');
  
  const newStatus = strategy.status === 'active' ? 'inactive' : 'active';
  const statusData = JSON.stringify({ status: newStatus });
  
  const statusOptions = {
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
  
  console.log(`🔄 请求: PUT /strategies/${strategy.id}/status`);
  console.log(`📦 数据: { "status": "${newStatus}" }`);
  
  const statusReq = http.request(statusOptions, (res) => {
    let data = '';
    
    res.on('data', chunk => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        console.log('📥 状态切换响应:', data);
        const response = JSON.parse(data);
        
        if (response.success) {
          console.log('✅ 状态切换成功');
          
          // 验证状态更新
          verifyStatusUpdate(token, strategy.id, newStatus);
        } else {
          console.log('❌ 状态切换失败:', response.message);
        }
      } catch (error) {
        console.log('❌ 解析状态切换响应失败:', error.message);
      }
    });
  });
  
  statusReq.on('error', (e) => {
    console.log('❌ 状态切换请求失败:', e.message);
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
          console.log(`   原期望状态: ${expectedStatus}`);
          console.log(`   实际状态: ${updatedStrategy.status}`);
          
          if (updatedStrategy.status === expectedStatus) {
            console.log('✅ 状态更新验证成功');
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
  
  console.log('\n🎉 诊断完成！');
}