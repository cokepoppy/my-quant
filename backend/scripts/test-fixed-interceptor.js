// 测试修复后的API拦截器逻辑
const http = require('http');

// 测试数据
const loginData = JSON.stringify({
  email: 'test@example.com',
  password: 'password123'
});

console.log('🔍 测试修复后的API拦截器逻辑...\n');

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
        
        // 2. 测试策略状态切换
        testStrategyStatusUpdate(token);
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

function testStrategyStatusUpdate(token) {
  console.log('\n📋 步骤2: 测试策略状态切换');
  
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
          
          // 测试状态切换
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
          
          console.log(`\n🔥 测试状态切换: ${strategy.status} -> ${newStatus}`);
          
          const statusReq = http.request(statusOptions, (res) => {
            let data = '';
            
            res.on('data', chunk => {
              data += chunk;
            });
            
            res.on('end', () => {
              try {
                console.log('📥 API原始响应:', data);
                const response = JSON.parse(data);
                
                console.log('📥 解析后的响应:');
                console.log('   success:', response.success);
                console.log('   message:', response.message);
                console.log('   data.type:', typeof response.data);
                console.log('   data.keys:', Object.keys(response.data || {}));
                
                // 模拟修复后的拦截器逻辑
                console.log('\n🔥 模拟修复后的拦截器处理:');
                
                if (response.success) {
                  const result = response.data !== undefined ? response.data : response;
                  console.log('🔥 拦截器提取的result:', result);
                  console.log('🔥 result.type:', typeof result);
                  console.log('🔥 result.keys:', Object.keys(result));
                  
                  // 检查result是否有success属性
                  if ('success' in result) {
                    console.log('✅ result有success属性，直接返回');
                    console.log('🔥 最终返回:', result);
                  } else {
                    console.log('⚠️ result没有success属性，包装返回');
                    const finalResult = {
                      success: response.success,
                      message: response.message,
                      data: result
                    };
                    console.log('🔥 最终返回:', finalResult);
                  }
                } else {
                  console.log('❌ API响应失败');
                }
                
              } catch (error) {
                console.log('❌ 解析响应失败:', error.message);
              }
            });
          });
          
          statusReq.on('error', (e) => {
            console.log('❌ 状态切换请求失败:', e.message);
          });
          
          statusReq.write(statusData);
          statusReq.end();
          
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

console.log('🔍 这个测试将帮助我们验证:');
console.log('   1. API响应的完整结构');
console.log('   2. 修复后的拦截器逻辑');
console.log('   3. 返回数据的正确性');
console.log('   4. success属性的处理');