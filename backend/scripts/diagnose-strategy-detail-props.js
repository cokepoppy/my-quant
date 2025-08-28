// 详细的 StrategyDetail.vue 组件诊断脚本
const http = require('http');

// 测试数据
const loginData = JSON.stringify({
  email: 'test@example.com',
  password: 'password123'
});

console.log('🔍 详细的 StrategyDetail.vue 组件诊断...\n');

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
        
        // 2. 测试各种可能的策略ID格式
        testStrategyIdFormats(token);
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

function testStrategyIdFormats(token) {
  console.log('\n📋 步骤2: 测试各种策略ID格式');
  
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
          
          // 测试不同的ID格式
          const idFormats = [
            { type: '原始ID', value: strategy.id },
            { type: '字符串ID', value: String(strategy.id) },
            { type: '数字ID', value: parseInt(strategy.id) || strategy.id },
            { type: 'Trim后ID', value: strategy.id.trim() },
            { type: 'Base64编码ID', value: Buffer.from(strategy.id).toString('base64') }
          ];
          
          idFormats.forEach((format, index) => {
            console.log(`\n📋 测试ID格式 ${index + 1}: ${format.type}`);
            console.log(`   ID值: ${format.value}`);
            console.log(`   ID类型: ${typeof format.value}`);
            console.log(`   ID长度: ${format.value.length}`);
            
            // 测试获取策略详情
            testGetStrategyById(token, format.value, format.type);
          });
          
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

function testGetStrategyById(token, strategyId, idType) {
  const getOptions = {
    hostname: 'localhost',
    port: 8000,
    path: `/strategies/${strategyId}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  const getReq = http.request(getOptions, (res) => {
    let data = '';
    
    res.on('data', chunk => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (response.success) {
          console.log(`   ✅ ${idType}: 获取策略成功`);
          console.log(`   📦 策略名称: ${response.data.strategy.name}`);
          console.log(`   📦 策略状态: ${response.data.strategy.status}`);
          
          // 测试状态切换
          testStatusUpdate(token, strategyId, idType);
        } else {
          console.log(`   ❌ ${idType}: 获取策略失败 - ${response.message}`);
        }
      } catch (error) {
        console.log(`   ❌ ${idType}: 解析响应失败 - ${error.message}`);
      }
    });
  });
  
  getReq.on('error', (e) => {
    console.log(`   ❌ ${idType}: 请求失败 - ${e.message}`);
  });
  
  getReq.end();
}

function testStatusUpdate(token, strategyId, idType) {
  const newStatus = 'active';
  const statusData = JSON.stringify({ status: newStatus });
  
  const statusOptions = {
    hostname: 'localhost',
    port: 8000,
    path: `/strategies/${strategyId}/status`,
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(statusData)
    }
  };
  
  const statusReq = http.request(statusOptions, (res) => {
    let data = '';
    
    res.on('data', chunk => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (response.success) {
          console.log(`   ✅ ${idType}: 状态切换成功`);
          console.log(`   🔄 新状态: ${response.data.strategy.status}`);
        } else {
          console.log(`   ❌ ${idType}: 状态切换失败 - ${response.message}`);
          console.log(`   🔍 错误详情:`, response.errors || []);
        }
      } catch (error) {
        console.log(`   ❌ ${idType}: 解析状态切换响应失败 - ${error.message}`);
      }
    });
  });
  
  statusReq.on('error', (e) => {
    console.log(`   ❌ ${idType}: 状态切换请求失败 - ${e.message}`);
  });
  
  statusReq.write(statusData);
  statusReq.end();
}

console.log('🔍 这个测试将帮助我们确定:');
console.log('   1. 不同ID格式是否影响API调用');
console.log('   2. 前端传递的ID格式是否正确');
console.log('   3. API对不同ID格式的兼容性');