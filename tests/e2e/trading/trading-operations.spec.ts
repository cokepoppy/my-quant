import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { TradingPage } from '../pages/TradingPage';

test.describe('交易功能测试', () => {
  let loginPage: LoginPage;
  let tradingPage: TradingPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    tradingPage = new TradingPage(page);
    
    // 登录
    await loginPage.goto();
    await loginPage.login(process.env.TEST_USER_EMAIL || 'test@example.com', process.env.TEST_USER_PASSWORD || 'testpassword123');
    
    // 导航到交易页面
    await tradingPage.goto();
  });

  test('should display trading interface', async ({ page }) => {
    await expect(page.locator('[data-testid="trading-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="symbol-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-type"]')).toBeVisible();
    await expect(page.locator('[data-testid="buy-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="sell-button"]')).toBeVisible();
  });

  test('should place market buy order successfully', async ({ page }) => {
    // 确保已连接交易所
    const exchangeCount = await tradingPage.getExchangeCount();
    if (exchangeCount === 0) {
      // 如果没有交易所，先添加一个
      await tradingPage.clickAddExchange();
      await tradingPage.fillExchangeForm(
        'Test Trading Account',
        'bybit',
        process.env.BYBIT_API_KEY || 'test_api_key',
        process.env.BYBIT_API_SECRET || 'test_api_secret',
        true
      );
      await tradingPage.testConnection();
      await page.waitForTimeout(2000);
      await tradingPage.saveExchange();
      await page.waitForTimeout(1000);
    }

    // 选择交易对
    await page.selectOption('[data-testid="symbol-select"]', 'BTC/USDT');
    
    // 选择市价单
    await page.click('[data-testid="market-order-type"]');
    
    // 输入数量
    await page.fill('[data-testid="order-amount"]', '0.001');
    
    // 点击买入
    await page.click('[data-testid="buy-button"]');
    
    // 验证订单创建成功
    await expect(page.locator('[data-testid="order-success-message"]')).toBeVisible();
    
    // 验证订单出现在订单列表中
    await expect(page.locator('[data-testid="open-orders"]')).toContainText('BTC/USDT');
  });

  test('should place limit sell order successfully', async ({ page }) => {
    // 确保已连接交易所
    const exchangeCount = await tradingPage.getExchangeCount();
    if (exchangeCount === 0) {
      // 如果没有交易所，先添加一个
      await tradingPage.clickAddExchange();
      await tradingPage.fillExchangeForm(
        'Test Trading Account',
        'bybit',
        process.env.BYBIT_API_KEY || 'test_api_key',
        process.env.BYBIT_API_SECRET || 'test_api_secret',
        true
      );
      await tradingPage.testConnection();
      await page.waitForTimeout(2000);
      await tradingPage.saveExchange();
      await page.waitForTimeout(1000);
    }

    // 选择交易对
    await page.selectOption('[data-testid="symbol-select"]', 'BTC/USDT');
    
    // 选择限价单
    await page.click('[data-testid="limit-order-type"]');
    
    // 输入价格
    await page.fill('[data-testid="order-price"]', '45000');
    
    // 输入数量
    await page.fill('[data-testid="order-amount"]', '0.001');
    
    // 点击卖出
    await page.click('[data-testid="sell-button"]');
    
    // 验证订单创建成功
    await expect(page.locator('[data-testid="order-success-message"]')).toBeVisible();
    
    // 验证订单出现在订单列表中
    await expect(page.locator('[data-testid="open-orders"]')).toContainText('BTC/USDT');
  });

  test('should show validation error for invalid order amount', async ({ page }) => {
    // 尝试输入无效数量
    await page.fill('[data-testid="order-amount"]', '0');
    
    // 点击买入
    await page.click('[data-testid="buy-button"]');
    
    // 验证错误提示
    await expect(page.locator('[data-testid="amount-error"]')).toBeVisible();
    const errorMessage = await page.locator('[data-testid="amount-error"]').textContent();
    expect(errorMessage).toContain('数量必须大于0');
  });

  test('should show validation error for insufficient balance', async ({ page }) => {
    // 输入超大数量
    await page.fill('[data-testid="order-amount"]', '1000');
    
    // 点击买入
    await page.click('[data-testid="buy-button"]');
    
    // 验证错误提示
    await expect(page.locator('[data-testid="balance-error"]')).toBeVisible();
  });

  test('should cancel open order successfully', async ({ page }) => {
    // 先下一个单
    await page.selectOption('[data-testid="symbol-select"]', 'BTC/USDT');
    await page.click('[data-testid="limit-order-type"]');
    await page.fill('[data-testid="order-price"]', '45000');
    await page.fill('[data-testid="order-amount"]', '0.001');
    await page.click('[data-testid="buy-button"]');
    await page.waitForTimeout(1000);
    
    // 取消订单
    await page.click('[data-testid="cancel-order-btn"]');
    
    // 验证订单取消成功
    await expect(page.locator('[data-testid="cancel-success-message"]')).toBeVisible();
  });

  test('should display real-time market data', async ({ page }) => {
    // 验证市场价格显示
    await expect(page.locator('[data-testid="market-price"]')).toBeVisible();
    
    // 等待几秒看是否有数据更新
    const initialPrice = await page.locator('[data-testid="market-price"]').textContent();
    await page.waitForTimeout(3000);
    const updatedPrice = await page.locator('[data-testid="market-price"]').textContent();
    
    // 验证价格数据存在（具体值无法预测，但应该有数据）
    expect(initialPrice).toBeTruthy();
    expect(updatedPrice).toBeTruthy();
  });

  test('should display positions correctly', async ({ page }) => {
    // 验证持仓列表
    await expect(page.locator('[data-testid="positions-list"]')).toBeVisible();
    
    // 如果有持仓，验证持仓信息显示
    const positionCount = await page.locator('[data-testid="position-item"]').count();
    if (positionCount > 0) {
      await expect(page.locator('[data-testid="position-symbol"]')).toBeVisible();
      await expect(page.locator('[data-testid="position-size"]')).toBeVisible();
      await expect(page.locator('[data-testid="position-pnl"]')).toBeVisible();
    }
  });
});