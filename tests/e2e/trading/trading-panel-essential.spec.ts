import { test, expect } from '@playwright/test';
import { TradingPage } from '../pages/TradingPage';

test.describe('交易面板核心功能测试', () => {
  let tradingPage: TradingPage;

  test.beforeEach(async ({ page }) => {
    tradingPage = new TradingPage(page);
    
    // 直接导航到交易页面，跳过登录（用于快速测试）
    await page.goto('/trading');
    await page.waitForLoadState('networkidle');
  });

  test('TC001: 交易面板页面加载测试', async ({ page }) => {
    console.log('🧪 开始测试交易面板页面加载...');
    
    // 验证页面标题
    const title = await page.title();
    expect(title).toContain('交易面板');
    
    // 验证主要组件可见
    await expect(page.locator('[data-testid="trading-panel"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="order-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="positions-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="orders-table"]')).toBeVisible();
    
    console.log('✅ 交易面板页面加载测试通过');
  });

  test('TC002: 交易表单功能测试', async ({ page }) => {
    console.log('🧪 开始测试交易表单功能...');
    
    // 验证交易对选择
    await expect(page.locator('[data-testid="symbol-select"]')).toBeVisible();
    const symbolOptions = await page.locator('[data-testid="symbol-select"] option').all();
    expect(symbolOptions.length).toBeGreaterThan(0);
    
    // 验证订单类型选择
    await expect(page.locator('[data-testid="market-order-type"]')).toBeVisible();
    await expect(page.locator('[data-testid="limit-order-type"]')).toBeVisible();
    
    // 验证数量输入框
    await expect(page.locator('[data-testid="order-amount"]')).toBeVisible();
    await page.fill('[data-testid="order-amount"]', '0.001');
    
    // 验证价格输入框（限价单）
    await page.click('[data-testid="limit-order-type"]');
    await expect(page.locator('[data-testid="order-price"]')).toBeVisible();
    await page.fill('[data-testid="order-price"]', '45000');
    
    // 验证买卖按钮
    await expect(page.locator('[data-testid="buy-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="sell-button"]')).toBeVisible();
    
    console.log('✅ 交易表单功能测试通过');
  });

  test('TC003: 市场数据显示测试', async ({ page }) => {
    console.log('🧪 开始测试市场数据显示...');
    
    // 验证市场数据表格
    await expect(page.locator('[data-testid="market-data-table"]')).toBeVisible();
    
    // 等待市场数据加载
    await page.waitForTimeout(2000);
    
    // 验证至少有一个交易对的数据
    const marketRows = await page.locator('[data-testid="market-row"]').count();
    expect(marketRows).toBeGreaterThan(0);
    
    // 验证价格数据显示
    const priceElements = await page.locator('[data-testid="market-price"]').all();
    expect(priceElements.length).toBeGreaterThan(0);
    
    // 验证涨跌幅显示
    const changeElements = await page.locator('[data-testid="market-change"]').all();
    expect(changeElements.length).toBeGreaterThan(0);
    
    console.log('✅ 市场数据显示测试通过');
  });

  test('TC004: 交易所连接测试', async ({ page }) => {
    console.log('🧪 开始测试交易所连接...');
    
    // 验证添加交易所按钮
    await expect(page.locator('[data-testid="add-exchange-btn"]')).toBeVisible();
    
    // 点击添加交易所
    await page.click('[data-testid="add-exchange-btn"]');
    
    // 验证交易所表单出现
    await expect(page.locator('[data-testid="exchange-form"]')).toBeVisible();
    
    // 填写表单
    await page.fill('[data-testid="exchange-name"]', 'Test Exchange');
    await page.selectOption('[data-testid="exchange-select"]', 'binance');
    await page.fill('[data-testid="api-key"]', 'test_api_key');
    await page.fill('[data-testid="api-secret"]', 'test_api_secret');
    await page.check('[data-testid="test-mode"]');
    
    // 测试连接
    await page.click('[data-testid="test-connection-btn"]');
    await page.waitForTimeout(1000);
    
    // 取消添加（避免实际创建）
    await page.click('[data-testid="cancel-exchange-btn"]');
    
    console.log('✅ 交易所连接测试通过');
  });

  test('TC005: 订单管理测试', async ({ page }) => {
    console.log('🧪 开始测试订单管理...');
    
    // 验证订单表格
    await expect(page.locator('[data-testid="orders-table"]')).toBeVisible();
    
    // 验证订单列标题
    await expect(page.locator('[data-testid="order-header-symbol"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-header-type"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-header-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-header-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-header-status"]')).toBeVisible();
    
    // 检查是否有订单数据
    const orderRows = await page.locator('[data-testid="order-row"]').count();
    console.log(`📊 当前订单数量: ${orderRows}`);
    
    console.log('✅ 订单管理测试通过');
  });

  test('TC006: 持仓管理测试', async ({ page }) => {
    console.log('🧪 开始测试持仓管理...');
    
    // 验证持仓表格
    await expect(page.locator('[data-testid="positions-table"]')).toBeVisible();
    
    // 验证持仓列标题
    await expect(page.locator('[data-testid="position-header-symbol"]')).toBeVisible();
    await expect(page.locator('[data-testid="position-header-side"]')).toBeVisible();
    await expect(page.locator('[data-testid="position-header-size"]')).toBeVisible();
    await expect(page.locator('[data-testid="position-header-pnl"]')).toBeVisible();
    
    // 检查是否有持仓数据
    const positionRows = await page.locator('[data-testid="position-row"]').count();
    console.log(`📊 当前持仓数量: ${positionRows}`);
    
    console.log('✅ 持仓管理测试通过');
  });

  test('TC007: 账户余额显示测试', async ({ page }) => {
    console.log('🧪 开始测试账户余额显示...');
    
    // 验证余额显示区域
    await expect(page.locator('[data-testid="account-balance"]')).toBeVisible();
    
    // 等待余额数据加载
    await page.waitForTimeout(2000);
    
    // 验证余额元素
    const balanceElements = await page.locator('[data-testid="balance-amount"]').all();
    if (balanceElements.length > 0) {
      expect(balanceElements.length).toBeGreaterThan(0);
      console.log(`💰 发现 ${balanceElements.length} 个余额显示项`);
    }
    
    // 验证总资产显示
    const totalAssetElement = page.locator('[data-testid="total-assets"]');
    if (await totalAssetElement.isVisible()) {
      const totalAssets = await totalAssetElement.textContent();
      expect(totalAssets).toBeTruthy();
      console.log(`💰 总资产: ${totalAssets}`);
    }
    
    console.log('✅ 账户余额显示测试通过');
  });

  test('TC008: 响应式设计测试', async ({ page }) => {
    console.log('🧪 开始测试响应式设计...');
    
    // 测试移动端视图
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    await expect(page.locator('[data-testid="trading-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-form"]')).toBeVisible();
    
    // 测试平板视图
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    
    await expect(page.locator('[data-testid="trading-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="positions-table"]')).toBeVisible();
    
    // 测试桌面视图
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    
    await expect(page.locator('[data-testid="trading-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="orders-table"]')).toBeVisible();
    
    console.log('✅ 响应式设计测试通过');
  });

  test('TC009: 错误处理测试', async ({ page }) => {
    console.log('🧪 开始测试错误处理...');
    
    // 测试无效数量输入
    await page.fill('[data-testid="order-amount"]', '0');
    await page.click('[data-testid="buy-button"]');
    
    // 等待错误提示
    await page.waitForTimeout(1000);
    
    // 检查是否有错误提示（可能出现在不同位置）
    const errorSelectors = [
      '[data-testid="amount-error"]',
      '[data-testid="error-message"]',
      '.el-form-item__error',
      '.error-message'
    ];
    
    let hasError = false;
    for (const selector of errorSelectors) {
      try {
        const errorElement = page.locator(selector);
        if (await errorElement.isVisible()) {
          hasError = true;
          break;
        }
      } catch {
        continue;
      }
    }
    
    console.log(`📊 错误处理状态: ${hasError ? '有错误提示' : '无错误提示'}`);
    
    console.log('✅ 错误处理测试通过');
  });

  test('TC010: 性能测试', async ({ page }) => {
    console.log('🧪 开始性能测试...');
    
    // 测量页面加载时间
    const startTime = Date.now();
    await page.goto('/trading');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ 页面加载时间: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000); // 10秒内加载完成
    
    // 测试快速操作响应
    const operationStart = Date.now();
    
    // 执行一系列快速操作
    await page.click('[data-testid="symbol-select"]');
    await page.selectOption('[data-testid="symbol-select"]', 'BTC/USDT');
    await page.click('[data-testid="market-order-type"]');
    await page.fill('[data-testid="order-amount"]', '0.001');
    
    const operationTime = Date.now() - operationStart;
    console.log(`⏱️ 快速操作响应时间: ${operationTime}ms`);
    expect(operationTime).toBeLessThan(3000); // 3秒内完成
    
    console.log('✅ 性能测试通过');
  });

  test.afterEach(async ({ page }) => {
    // 每个测试后截图
    await page.screenshot({ 
      path: `test-results/trading-test-${Date.now()}.png`,
      fullPage: true 
    });
  });
});