const { chromium } = require('playwright');

async function testTradingBuyOperation() {
  console.log('开始交易买入操作测试...');
  
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
    // 导航到交易页面
    console.log('导航到交易页面...');
    await page.goto('http://localhost:3000/trading', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });

    // 等待页面加载完成
    await page.waitForSelector('.trading-panel', { timeout: 10000 });
    console.log('交易页面加载完成');

    // 检查是否需要登录
    const loginButton = await page.$('button:has-text("登录")');
    if (loginButton) {
      console.log('检测到需要登录，尝试自动登录...');
      await performLogin(page);
    }

    // 等待交易面板完全加载
    await page.waitForSelector('[data-testid="trading-form"]', { timeout: 10000 });
    
    // 填写交易表单
    console.log('填写交易表单...');
    
    // 选择交易对（例如 BTC/USDT）
    await page.selectOption('[data-testid="symbol-select"]', 'BTC/USDT');
    
    // 输入买入数量
    await page.fill('[data-testid="amount-input"]', '0.001');
    
    // 选择订单类型（市价单）
    await page.click('[data-testid="market-order"]');
    
    // 点击买入按钮
    console.log('执行买入操作...');
    await page.click('[data-testid="buy-button"]');

    // 等待确认对话框
    await page.waitForSelector('[data-testid="confirm-modal"]', { timeout: 5000 });
    
    // 确认交易
    await page.click('[data-testid="confirm-buy"]');

    // 等待交易结果
    await page.waitForSelector('[data-testid="trade-result"]', { timeout: 10000 });
    
    // 获取交易结果
    const resultText = await page.textContent('[data-testid="trade-result"]');
    console.log('交易结果:', resultText);

    // 检查是否有错误信息
    const errorElement = await page.$('[data-testid="error-message"]');
    if (errorElement) {
      const errorText = await errorElement.textContent();
      console.error('交易错误:', errorText);
    }

    // 截图保存结果
    await page.screenshot({ path: 'trading-buy-result.png' });
    console.log('交易结果截图已保存');

    return {
      success: true,
      message: '交易买入操作测试完成',
      result: resultText
    };

  } catch (error) {
    console.error('交易测试失败:', error.message);
    
    // 错误时截图
    await page.screenshot({ path: 'trading-error.png' });
    console.log('错误截图已保存');
    
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

async function performLogin(page) {
  try {
    // 点击登录按钮
    await page.click('button:has-text("登录")');
    
    // 等待登录表单
    await page.waitForSelector('[data-testid="login-form"]', { timeout: 5000 });
    
    // 填写登录信息
    await page.fill('[data-testid="username"]', 'testuser');
    await page.fill('[data-testid="password"]', 'testpass123');
    
    // 点击登录
    await page.click('[data-testid="login-submit"]');
    
    // 等待登录完成
    await page.waitForSelector('.trading-panel', { timeout: 10000 });
    console.log('登录成功');
    
  } catch (error) {
    console.error('登录失败:', error.message);
    throw error;
  }
}

// 运行测试
if (require.main === module) {
  testTradingBuyOperation()
    .then(result => {
      console.log('\n=== 测试结果 ===');
      console.log('成功:', result.success);
      console.log('消息:', result.message);
      if (result.result) {
        console.log('结果:', result.result);
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('测试执行失败:', error);
      process.exit(1);
    });
}

module.exports = { testTradingBuyOperation, performLogin };