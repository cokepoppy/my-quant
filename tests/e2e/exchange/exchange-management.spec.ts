import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { TradingPage } from '../pages/TradingPage';

test.describe('交易所管理功能', () => {
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

  test('should display trading page with exchange management', async () => {
    await expect(tradingPage.addExchangeButton).toBeVisible();
    await expect(tradingPage.exchangeList).toBeVisible();
  });

  test('should open exchange dialog when clicking add exchange button', async () => {
    await tradingPage.clickAddExchange();
    await expect(tradingPage.exchangeDialog).toBeVisible();
    await expect(tradingPage.exchangeNameInput).toBeVisible();
    await expect(tradingPage.exchangeTypeSelect).toBeVisible();
    await expect(tradingPage.apiKeyInput).toBeVisible();
    await expect(tradingPage.apiSecretInput).toBeVisible();
    await expect(tradingPage.testnetCheckbox).toBeVisible();
  });

  test('should show validation errors for empty required fields', async () => {
    await tradingPage.clickAddExchange();
    await tradingPage.saveExchange();
    
    // 验证错误提示
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="api-key-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="api-secret-error"]')).toBeVisible();
  });

  test('should add Bybit exchange successfully', async () => {
    await tradingPage.clickAddExchange();
    
    // 填写表单
    await tradingPage.fillExchangeForm(
      'Test Bybit Account',
      'bybit',
      process.env.BYBIT_API_KEY || 'test_api_key',
      process.env.BYBIT_API_SECRET || 'test_api_secret',
      true
    );
    
    // 测试连接
    await tradingPage.testConnection();
    await page.waitForTimeout(2000); // 等待连接测试
    
    // 保存交易所
    await tradingPage.saveExchange();
    
    // 验证成功消息
    await expect(tradingPage.successMessage).toBeVisible();
    const successMessage = await tradingPage.getSuccessMessage();
    expect(successMessage).toContain('添加成功');
    
    // 验证交易所列表更新
    await expect(tradingPage.exchangeList).toBeVisible();
    const exchangeCount = await tradingPage.getExchangeCount();
    expect(exchangeCount).toBeGreaterThan(0);
    
    // 验证新添加的交易所可见
    await expect(tradingPage.isExchangeVisible('Test Bybit Account')).resolves.toBe(true);
  });

  test('should add Binance exchange successfully', async () => {
    await tradingPage.clickAddExchange();
    
    // 填写表单
    await tradingPage.fillExchangeForm(
      'Test Binance Account',
      'binance',
      process.env.BINANCE_API_KEY || 'test_api_key',
      process.env.BINANCE_API_SECRET || 'test_api_secret',
      true
    );
    
    // 测试连接
    await tradingPage.testConnection();
    await page.waitForTimeout(2000);
    
    // 保存交易所
    await tradingPage.saveExchange();
    
    // 验证成功消息
    await expect(tradingPage.successMessage).toBeVisible();
    
    // 验证交易所列表更新
    const exchangeCount = await tradingPage.getExchangeCount();
    expect(exchangeCount).toBeGreaterThan(0);
  });

  test('should handle connection test failure', async () => {
    await tradingPage.clickAddExchange();
    
    // 填写错误的API密钥
    await tradingPage.fillExchangeForm(
      'Test Failed Connection',
      'bybit',
      'invalid_api_key',
      'invalid_api_secret',
      true
    );
    
    // 测试连接
    await tradingPage.testConnection();
    await page.waitForTimeout(2000);
    
    // 验证错误消息
    await expect(page.locator('[data-testid="connection-error"]')).toBeVisible();
  });

  test('should display exchange status correctly', async () => {
    // 添加一个交易所
    await tradingPage.clickAddExchange();
    await tradingPage.fillExchangeForm(
      'Status Test Account',
      'bybit',
      process.env.BYBIT_API_KEY || 'test_api_key',
      process.env.BYBIT_API_SECRET || 'test_api_secret',
      true
    );
    await tradingPage.testConnection();
    await page.waitForTimeout(2000);
    await tradingPage.saveExchange();
    
    // 验证状态显示
    await expect(tradingPage.isExchangeVisible('Status Test Account')).resolves.toBe(true);
    await expect(page.locator('[data-testid="connection-status"]')).toBeVisible();
  });
});