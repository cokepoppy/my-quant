const { chromium } = require('playwright');

async function testTradingBuyHeadless() {
  console.log('开始无头模式交易买入测试...');
  
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  });

  const page = await context.newPage();
  
  try {
    // 设置请求拦截器来模拟API调用
    await page.route('**/api/**', async (route) => {
      const request = route.request();
      const url = request.url();
      
      console.log(`拦截到API请求: ${request.method()} ${url}`);
      
      if (url.includes('/auth/login')) {
        // 模拟登录响应
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            token: 'mock-jwt-token-for-testing',
            user: {
              id: 1,
              username: 'testuser',
              email: 'test@example.com'
            }
          })
        });
      } else if (url.includes('/trading/accounts')) {
        // 模拟交易账户响应
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'account-1',
                exchange: 'binance',
                type: 'spot',
                balance: 10000,
                currency: 'USDT'
              }
            ]
          })
        });
      } else if (url.includes('/trading/order')) {
        // 模拟下单响应
        const postData = JSON.parse(request.postData() || '{}');
        console.log('下单请求数据:', postData);
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              orderId: 'mock-order-' + Date.now(),
              symbol: postData.symbol || 'BTCUSDT',
              type: postData.type || 'market',
              side: postData.side || 'buy',
              quantity: postData.quantity || 0.001,
              status: 'filled',
              price: 45000,
              executedQuantity: postData.quantity || 0.001,
              timestamp: new Date().toISOString()
            }
          })
        });
      } else {
        // 对于其他API请求，继续实际请求
        await route.continue();
      }
    });

    // 模拟前端页面进行交易操作
    console.log('模拟前端交易操作...');
    
    // 1. 模拟登录
    console.log('步骤1: 模拟用户登录...');
    const loginResponse = await page.request.post('http://localhost:8000/api/auth/login', {
      data: {
        username: 'testuser',
        password: 'testpass123'
      }
    });
    
    const loginResult = await loginResponse.json();
    console.log('登录结果:', loginResult);
    
    // 2. 获取交易账户
    console.log('步骤2: 获取交易账户...');
    const accountsResponse = await page.request.get('http://localhost:8000/api/trading/accounts', {
      headers: {
        'Authorization': `Bearer ${loginResult.token}`
      }
    });
    
    const accountsResult = await accountsResponse.json();
    console.log('账户信息:', accountsResult);
    
    // 3. 执行买入操作
    console.log('步骤3: 执行买入操作...');
    const buyOrderData = {
      accountId: 'account-1',
      symbol: 'BTCUSDT',
      type: 'market',
      side: 'buy',
      quantity: 0.001
    };
    
    const buyResponse = await page.request.post('http://localhost:8000/api/trading/order', buyOrderData, {
      headers: {
        'Authorization': `Bearer ${loginResult.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const buyResult = await buyResponse.json();
    console.log('买入操作结果:', buyResult);
    
    // 4. 验证结果
    console.log('步骤4: 验证交易结果...');
    
    if (buyResult.success && buyResult.data) {
      console.log('✅ 买入操作成功!');
      console.log(`订单ID: ${buyResult.data.orderId}`);
      console.log(`交易对: ${buyResult.data.symbol}`);
      console.log(`数量: ${buyResult.data.quantity}`);
      console.log(`价格: ${buyResult.data.price}`);
      console.log(`状态: ${buyResult.data.status}`);
      
      return {
        success: true,
        message: '无头模式交易买入测试成功',
        order: buyResult.data
      };
    } else {
      console.log('❌ 买入操作失败');
      return {
        success: false,
        message: '买入操作失败',
        error: buyResult
      };
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    return {
      success: false,
      message: error.message,
      error: error
    };
  } finally {
    await context.close();
    await browser.close();
  }
}

// 运行测试
if (require.main === module) {
  testTradingBuyHeadless()
    .then(result => {
      console.log('\n=== 无头模式交易买入测试结果 ===');
      console.log('成功:', result.success);
      console.log('消息:', result.message);
      
      if (result.success && result.order) {
        console.log('\n📋 订单详情:');
        console.log(`订单ID: ${result.order.orderId}`);
        console.log(`交易对: ${result.order.symbol}`);
        console.log(`类型: ${result.order.type}`);
        console.log(`方向: ${result.order.side}`);
        console.log(`数量: ${result.order.quantity}`);
        console.log(`价格: ${result.order.price}`);
        console.log(`状态: ${result.order.status}`);
        console.log(`时间: ${result.order.timestamp}`);
      }
      
      if (result.error) {
        console.log('\n❌ 错误信息:', JSON.stringify(result.error, null, 2));
      }
      
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('测试执行失败:', error);
      process.exit(1);
    });
}

module.exports = { testTradingBuyHeadless };