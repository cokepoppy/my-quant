import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

async function diagnoseStrategyStatusIssue() {
  try {
    console.log('🔍 诊断策略状态切换问题...\n');
    
    // 1. 首先登录获取token
    console.log('📋 步骤1: 登录获取认证token');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功，获取token');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. 获取策略列表
    console.log('\n📋 步骤2: 获取策略列表');
    const strategiesResponse = await axios.get(`${BASE_URL}/strategies`, { headers });
    const strategies = strategiesResponse.data.data.strategies;
    
    console.log(`📊 找到 ${strategies.length} 个策略:`);
    strategies.forEach((strategy: any, index: number) => {
      console.log(`   ${index + 1}. ${strategy.name} (ID: ${strategy.id}, 状态: ${strategy.status})`);
    });
    
    if (strategies.length === 0) {
      console.log('❌ 没有找到策略，无法测试状态切换');
      return;
    }
    
    // 3. 选择第一个策略进行测试
    const testStrategy = strategies[0];
    console.log(`\n📋 步骤3: 测试策略状态切换`);
    console.log(`🎯 选择策略: ${testStrategy.name} (当前状态: ${testStrategy.status})`);
    
    // 4. 测试状态切换API
    const newStatus = testStrategy.status === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? '启用' : '停用';
    
    console.log(`\n📋 步骤4: 调用状态切换API`);
    console.log(`🔄 请求: PUT /strategies/${testStrategy.id}/status`);
    console.log(`📦 数据: { "status": "${newStatus}" }`);
    
    try {
      const statusResponse = await axios.put(
        `${BASE_URL}/strategies/${testStrategy.id}/status`,
        { status: newStatus },
        { headers }
      );
      
      console.log('✅ 状态切换API调用成功');
      console.log(`📥 响应:`, JSON.stringify(statusResponse.data, null, 2));
      
      // 5. 验证状态是否更新
      console.log(`\n📋 步骤5: 验证状态更新`);
      const verifyResponse = await axios.get(`${BASE_URL}/strategies/${testStrategy.id}`, { headers });
      const updatedStrategy = verifyResponse.data.data.strategy;
      
      console.log(`🔍 验证结果:`);
      console.log(`   原状态: ${testStrategy.status}`);
      console.log(`   新状态: ${updatedStrategy.status}`);
      console.log(`   期望状态: ${newStatus}`);
      
      if (updatedStrategy.status === newStatus) {
        console.log('✅ 状态切换验证成功');
      } else {
        console.log('❌ 状态切换验证失败');
      }
      
    } catch (error: any) {
      console.log('❌ 状态切换API调用失败');
      console.log('📥 错误响应:', error.response?.data || error.message);
      console.log('🔍 错误详情:');
      if (error.response) {
        console.log(`   状态码: ${error.response.status}`);
        console.log(`   状态文本: ${error.response.statusText}`);
        console.log(`   响应数据:`, JSON.stringify(error.response.data, null, 2));
      } else {
        console.log(`   错误消息: ${error.message}`);
      }
    }
    
    // 6. 测试前端可能遇到的问题
    console.log(`\n📋 步骤6: 检查前端可能的问题`);
    
    // 检查策略ID格式
    console.log(`🔍 策略ID格式检查:`);
    console.log(`   ID类型: ${typeof testStrategy.id}`);
    console.log(`   ID值: "${testStrategy.id}"`);
    console.log(`   ID长度: ${testStrategy.id.length}`);
    
    // 检查状态值
    console.log(`🔍 状态值检查:`);
    console.log(`   当前状态: "${testStrategy.status}"`);
    console.log(`   目标状态: "${newStatus}"`);
    console.log(`   有效状态值: ['draft', 'active', 'inactive', 'archived']`);
    
    // 模拟前端请求
    console.log(`\n📋 步骤7: 模拟前端请求`);
    try {
      const frontendRequest = {
        strategyId: testStrategy.id,
        status: newStatus
      };
      
      console.log(`📦 前端请求数据:`, JSON.stringify(frontendRequest, null, 2));
      
      // 这应该是前端实际调用的方式
      const frontendResponse = await axios.put(
        `${BASE_URL}/strategies/${testStrategy.id}/status`,
        { status: newStatus },
        { headers }
      );
      
      console.log('✅ 前端请求模拟成功');
      
    } catch (error: any) {
      console.log('❌ 前端请求模拟失败');
      console.log('🔍 错误:', error.response?.data || error.message);
    }
    
    console.log('\n🎉 诊断完成！');
    
  } catch (error) {
    console.error('❌ 诊断失败:', error);
  }
}

diagnoseStrategyStatusIssue();