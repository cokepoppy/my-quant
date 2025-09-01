const { chromium } = require('playwright');

async function testTradingAPI() {
  console.log('开始交易API测试...');
  
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
    // 首先测试后端API是否可用
    console.log('测试后端API连接...');
    const apiResponse = await page.request.get('http://localhost:8000/api/health');
    
    if (apiResponse.status() !== 200) {
      throw new Error(`后端API不可用，状态码: ${apiResponse.status()}`);
    }
    
    console.log('后端API连接正常');
    
    // 测试用户登录获取token
    console.log('测试用户登录...');
    const loginResponse = await page.request.post('http://localhost:8000/api/auth/login', {
      data: {
        username: 'testuser',
        password: 'testpass123'
      }
    });
    
    if (loginResponse.status() !== 200) {
      throw new Error(`登录失败，状态码: ${loginResponse.status()}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log('登录成功，获取到token');
    
    // 测试交易买入API
    console.log('测试交易买入API...');
    const tradeResponse = await page.request.post('http://localhost:8000/api/trading/buy', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        symbol: 'BTC/USDT',
        amount: 0.001,
        type: 'market',
        price: null
      }
    });
    
    const tradeData = await tradeResponse.json();
    console.log('交易API响应:', tradeData);
    
    if (tradeResponse.status() === 200) {
      console.log('✅ 交易买入API测试成功');
      return {
        success: true,
        message: '交易买入API测试成功',
        data: tradeData
      };
    } else {
      console.log('❌ 交易买入API测试失败');
      return {
        success: false,
        message: '交易买入API测试失败',
        error: tradeData,
        status: tradeResponse.status()
      };
    }
    
  } catch (error) {
    console.error('API测试失败:', error.message);
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
  testTradingAPI()
    .then(result => {
      console.log('\n=== API测试结果 ===');
      console.log('成功:', result.success);
      console.log('消息:', result.message);
      if (result.data) {
        console.log('响应数据:', JSON.stringify(result.data, null, 2));
      }
      if (result.error) {
        console.log('错误信息:', JSON.stringify(result.error, null, 2));
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('测试执行失败:', error);
      process.exit(1);
    });
}

module.exports = { testTradingAPI };