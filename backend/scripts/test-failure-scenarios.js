// 模拟前端可能遇到的具体问题
const http = require('http');

// 测试数据
const loginData = JSON.stringify({
  email: 'test@example.com',
  password: 'password123'
});

console.log('🔍 模拟前端策略状态切换的详细问题诊断...\n');

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
        
        // 2. 测试各种可能导致前端失败的情况
        testFailureScenarios(token);
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

function testFailureScenarios(token) {
  console.log('\n📋 步骤2: 测试各种可能导致前端失败的情况');
  
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
          
          // 测试各种失败场景
          const scenarios = [
            {
              name: '正常状态切换',
              test: () => testNormalStatusUpdate(token, strategy.id)
            },
            {
              name: '无效的策略ID',
              test: () => testInvalidStrategyId(token)
            },
            {
              name: '空的状态值',
              test: () => testEmptyStatus(token, strategy.id)
            },
            {
              name: '无效的状态值',
              test: () => testInvalidStatus(token, strategy.id)
            },
            {
              name: '错误的认证token',
              test: () => testWrongToken(strategy.id)
            },
            {
              name: '缺少认证头',
              test: () => testNoAuth(strategy.id)
            },
            {
              name: '错误的Content-Type',
              test: () => testWrongContentType(token, strategy.id)
            },
            {
              name: '空请求体',
              test: () => testEmptyBody(token, strategy.id)
            }
          ];
          
          // 依次测试每个场景
          scenarios.forEach((scenario, index) => {
            setTimeout(() => {
              console.log(`\n🔍 测试场景 ${index + 1}: ${scenario.name}`);
              scenario.test();
            }, index * 1000);
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

function testNormalStatusUpdate(token, strategyId) {
  const statusData = JSON.stringify({ status: 'active' });
  
  const options = {
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
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', chunk => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log(`   结果: ${response.success ? '✅ 成功' : '❌ 失败'} - ${response.message}`);
      } catch (error) {
        console.log(`   结果: ❌ 解析失败 - ${error.message}`);
      }
    });
  });
  
  req.on('error', (e) => {
    console.log(`   结果: ❌ 请求失败 - ${e.message}`);
  });
  
  req.write(statusData);
  req.end();
}

function testInvalidStrategyId(token) {
  const statusData = JSON.stringify({ status: 'active' });
  
  const options = {
    hostname: 'localhost',
    port: 8000,
    path: '/strategies/invalid-strategy-id/status',
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(statusData)
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
        console.log(`   结果: ${response.success ? '✅ 成功' : '❌ 失败'} - ${response.message}`);
      } catch (error) {
        console.log(`   结果: ❌ 解析失败 - ${error.message}`);
      }
    });
  });
  
  req.on('error', (e) => {
    console.log(`   结果: ❌ 请求失败 - ${e.message}`);
  });
  
  req.write(statusData);
  req.end();
}

function testEmptyStatus(token, strategyId) {
  const statusData = JSON.stringify({ });
  
  const options = {
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
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', chunk => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log(`   结果: ${response.success ? '✅ 成功' : '❌ 失败'} - ${response.message}`);
      } catch (error) {
        console.log(`   结果: ❌ 解析失败 - ${error.message}`);
      }
    });
  });
  
  req.on('error', (e) => {
    console.log(`   结果: ❌ 请求失败 - ${e.message}`);
  });
  
  req.write(statusData);
  req.end();
}

function testInvalidStatus(token, strategyId) {
  const statusData = JSON.stringify({ status: 'invalid_status' });
  
  const options = {
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
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', chunk => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log(`   结果: ${response.success ? '✅ 成功' : '❌ 失败'} - ${response.message}`);
        if (response.errors) {
          console.log(`   验证错误: ${JSON.stringify(response.errors)}`);
        }
      } catch (error) {
        console.log(`   结果: ❌ 解析失败 - ${error.message}`);
      }
    });
  });
  
  req.on('error', (e) => {
    console.log(`   结果: ❌ 请求失败 - ${e.message}`);
  });
  
  req.write(statusData);
  req.end();
}

function testWrongToken(strategyId) {
  const statusData = JSON.stringify({ status: 'active' });
  
  const options = {
    hostname: 'localhost',
    port: 8000,
    path: `/strategies/${strategyId}/status`,
    method: 'PUT',
    headers: {
      'Authorization': `Bearer wrong_token`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(statusData)
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
        console.log(`   结果: ${response.success ? '✅ 成功' : '❌ 失败'} - ${response.message}`);
      } catch (error) {
        console.log(`   结果: ❌ 解析失败 - ${error.message}`);
      }
    });
  });
  
  req.on('error', (e) => {
    console.log(`   结果: ❌ 请求失败 - ${e.message}`);
  });
  
  req.write(statusData);
  req.end();
}

function testNoAuth(strategyId) {
  const statusData = JSON.stringify({ status: 'active' });
  
  const options = {
    hostname: 'localhost',
    port: 8000,
    path: `/strategies/${strategyId}/status`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(statusData)
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
        console.log(`   结果: ${response.success ? '✅ 成功' : '❌ 失败'} - ${response.message}`);
      } catch (error) {
        console.log(`   结果: ❌ 解析失败 - ${error.message}`);
      }
    });
  });
  
  req.on('error', (e) => {
    console.log(`   结果: ❌ 请求失败 - ${e.message}`);
  });
  
  req.write(statusData);
  req.end();
}

function testWrongContentType(token, strategyId) {
  const statusData = JSON.stringify({ status: 'active' });
  
  const options = {
    hostname: 'localhost',
    port: 8000,
    path: `/strategies/${strategyId}/status`,
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(statusData)
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
        console.log(`   结果: ${response.success ? '✅ 成功' : '❌ 失败'} - ${response.message}`);
      } catch (error) {
        console.log(`   结果: ❌ 解析失败 - ${error.message}`);
      }
    });
  });
  
  req.on('error', (e) => {
    console.log(`   结果: ❌ 请求失败 - ${e.message}`);
  });
  
  req.write(statusData);
  req.end();
}

function testEmptyBody(token, strategyId) {
  const options = {
    hostname: 'localhost',
    port: 8000,
    path: `/strategies/${strategyId}/status`,
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': 0
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
        console.log(`   结果: ${response.success ? '✅ 成功' : '❌ 失败'} - ${response.message}`);
      } catch (error) {
        console.log(`   结果: ❌ 解析失败 - ${error.message}`);
      }
    });
  });
  
  req.on('error', (e) => {
    console.log(`   结果: ❌ 请求失败 - ${e.message}`);
  });
  
  req.end();
}

console.log('🔍 这个测试将帮助我们确定:');
console.log('   1. 哪些特定的请求会导致失败');
console.log('   2. 失败的具体原因');
console.log('   3. 服务器返回的错误信息');
console.log('   4. 是否存在认证或权限问题');