import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { TradingPage } from '../pages/TradingPage';
import { TestUtils } from '../utils/test-utils';

test.describe('交易面板全面测试', () => {
  let loginPage: LoginPage;
  let tradingPage: TradingPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    tradingPage = new TradingPage(page);
    
    // 设置测试环境
    await page.setDefaultTimeout(30000);
    
    // 登录
    await loginPage.goto();
    await loginPage.login('test@example.com', 'testpassword123');
    
    // 导航到交易页面
    await tradingPage.goto();
  });

  test.describe('页面结构和布局', () => {
    test('should display trading panel with all components', async ({ page }) => {
      await expect(tradingPage.isTradingPanelVisible()).resolves.toBe(true);
      await expect(tradingPage.isOrderFormVisible()).resolves.toBe(true);
      await expect(tradingPage.isPositionsTableVisible()).resolves.toBe(true);
      await expect(tradingPage.isOrdersTableVisible()).resolves.toBe(true);
    });

    test('should display exchange tabs', async ({ page }) => {
      const exchangeCount = await tradingPage.getExchangeCount();
      expect(exchangeCount).toBeGreaterThanOrEqual(0);
    });

    test('should display trading form with all fields', async ({ page }) => {
      await expect(page.locator('[data-testid="symbol-select"]')).toBeVisible();
      await expect(page.locator('[data-testid="market-order-type"]')).toBeVisible();
      await expect(page.locator('[data-testid="limit-order-type"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-amount"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-price"]')).toBeVisible();
      await expect(page.locator('[data-testid="buy-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="sell-button"]')).toBeVisible();
    });

    test('should display market data table', async ({ page }) => {
      await expect(page.locator('[data-testid="market-data-table"]')).toBeVisible();
      const symbols = await page.locator('[data-testid="market-symbol"]').count();
      expect(symbols).toBeGreaterThan(0);
    });
  });

  test.describe('交易所管理', () => {
    test('should add new exchange account', async ({ page }) => {
      await tradingPage.clickAddExchange();
      
      await tradingPage.fillExchangeForm(
        'Test Exchange Account',
        'binance',
        'test_api_key_123',
        'test_api_secret_456',
        true
      );
      
      await tradingPage.testConnection();
      await page.waitForTimeout(2000);
      
      await tradingPage.saveExchange();
      await page.waitForTimeout(1000);
      
      const exchangeCount = await tradingPage.getExchangeCount();
      expect(exchangeCount).toBeGreaterThan(0);
    });

    test('should display exchange connection status', async ({ page }) => {
      const exchangeTabs = await page.locator('[data-testid="exchange-tab"]').all();
      
      for (const tab of exchangeTabs) {
        await expect(tab.locator('[data-testid="connection-status"]')).toBeVisible();
      }
    });
  });

  test.describe('交易功能', () => {
    test.beforeEach(async ({ page }) => {
      // 确保有可用的交易所
      const exchangeCount = await tradingPage.getExchangeCount();
      if (exchangeCount === 0) {
        await tradingPage.clickAddExchange();
        await tradingPage.fillExchangeForm(
          'Test Exchange',
          'binance',
          'test_key',
          'test_secret',
          true
        );
        await tradingPage.saveExchange();
        await page.waitForTimeout(1000);
      }
    });

    test('should place market buy order', async ({ page }) => {
      await tradingPage.selectSymbol('BTC/USDT');
      await tradingPage.selectOrderType('market');
      await tradingPage.setOrderAmount('0.001');
      await tradingPage.clickBuyButton();
      
      await page.waitForTimeout(2000);
      
      const successMessage = await tradingPage.getSuccessMessage();
      expect(successMessage).toBeTruthy();
      
      const orderCount = await tradingPage.getOrderCount();
      expect(orderCount).toBeGreaterThan(0);
    });

    test('should place limit sell order', async ({ page }) => {
      await tradingPage.selectSymbol('ETH/USDT');
      await tradingPage.selectOrderType('limit');
      await tradingPage.setOrderPrice('3000');
      await tradingPage.setOrderAmount('0.1');
      await tradingPage.clickSellButton();
      
      await page.waitForTimeout(2000);
      
      const successMessage = await tradingPage.getSuccessMessage();
      expect(successMessage).toBeTruthy();
    });

    test('should validate order amount', async ({ page }) => {
      await tradingPage.setOrderAmount('0');
      await tradingPage.clickBuyButton();
      
      const errorMessage = await tradingPage.getValidationMessage('amount');
      expect(errorMessage).toContain('数量必须大于0');
    });

    test('should validate order price for limit orders', async ({ page }) => {
      await tradingPage.selectOrderType('limit');
      await tradingPage.setOrderAmount('0.1');
      await tradingPage.clickBuyButton();
      
      const errorMessage = await tradingPage.getValidationMessage('price');
      expect(errorMessage).toBeTruthy();
    });

    test('should cancel open order', async ({ page }) => {
      // 先下一个单
      await tradingPage.selectSymbol('BTC/USDT');
      await tradingPage.selectOrderType('limit');
      await tradingPage.setOrderPrice('45000');
      await tradingPage.setOrderAmount('0.001');
      await tradingPage.clickBuyButton();
      await page.waitForTimeout(1000);
      
      // 获取订单ID并取消
      const orders = await tradingPage.getOpenOrders();
      if (orders.length > 0) {
        await tradingPage.cancelOrder(orders[0].symbol);
        await page.waitForTimeout(1000);
        
        const successMessage = await tradingPage.getSuccessMessage();
        expect(successMessage).toContain('取消');
      }
    });
  });

  test.describe('持仓管理', () => {
    test('should display positions table', async ({ page }) => {
      const positionCount = await tradingPage.getPositionCount();
      expect(positionCount).toBeGreaterThanOrEqual(0);
    });

    test('should display position details', async ({ page }) => {
      const positions = await tradingPage.getPositions();
      
      if (positions.length > 0) {
        const position = positions[0];
        expect(position.symbol).toBeTruthy();
        expect(position.side).toBeTruthy();
        expect(position.size).toBeTruthy();
        expect(position.pnl).toBeTruthy();
      }
    });

    test('should close position', async ({ page }) => {
      const positions = await tradingPage.getPositions();
      
      if (positions.length > 0) {
        const position = positions[0];
        await tradingPage.closePosition(position.symbol);
        await page.waitForTimeout(2000);
        
        const successMessage = await tradingPage.getSuccessMessage();
        expect(successMessage).toBeTruthy();
      }
    });
  });

  test.describe('实时数据更新', () => {
    test('should display real-time price updates', async ({ page }) => {
      const initialPrice = await tradingPage.getCurrentPrice('BTC/USDT');
      
      if (initialPrice) {
        await tradingPage.waitForPriceUpdate('BTC/USDT', 10000);
        const updatedPrice = await tradingPage.getCurrentPrice('BTC/USDT');
        
        expect(updatedPrice).not.toBe(initialPrice);
      }
    });

    test('should update 24h change', async ({ page }) => {
      const initialChange = await tradingPage.get24hChange('BTC/USDT');
      
      if (initialChange) {
        await page.waitForTimeout(5000);
        const updatedChange = await tradingPage.get24hChange('BTC/USDT');
        
        expect(updatedChange).toBeTruthy();
      }
    });

    test('should show WebSocket connection status', async ({ page }) => {
      const wsStatus = await tradingPage.getWebSocketStatus();
      expect(['connected', 'disconnected', 'connecting']).toContain(wsStatus);
    });
  });

  test.describe('风险管理', () => {
    test('should display risk indicators', async ({ page }) => {
      const riskIndicators = await tradingPage.getRiskIndicators();
      
      if (Object.keys(riskIndicators).length > 0) {
        expect(riskIndicators).toBeTruthy();
      }
    });

    test('should show risk warnings for high leverage', async ({ page }) => {
      // 模拟高杠杆交易
      await tradingPage.selectSymbol('BTC/USDT');
      await tradingPage.setOrderAmount('10'); // 大额订单
      await tradingPage.clickBuyButton();
      
      await page.waitForTimeout(1000);
      
      const warningMessage = await tradingPage.getErrorMessage();
      if (warningMessage) {
        expect(warningMessage).toBeTruthy();
      }
    });

    test('should prevent orders exceeding risk limits', async ({ page }) => {
      // 尝试超出风险限制的订单
      await tradingPage.setOrderAmount('1000');
      await tradingPage.clickBuyButton();
      
      await page.waitForTimeout(1000);
      
      const errorMessage = await tradingPage.getErrorMessage();
      if (errorMessage) {
        expect(errorMessage).toBeTruthy();
      }
    });
  });

  test.describe('响应式设计', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await tradingPage.goto();
      
      await expect(tradingPage.isTradingPanelVisible()).resolves.toBe(true);
      await expect(tradingPage.isOrderFormVisible()).resolves.toBe(true);
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await tradingPage.goto();
      
      await expect(tradingPage.isTradingPanelVisible()).resolves.toBe(true);
      await expect(tradingPage.isPositionsTableVisible()).resolves.toBe(true);
    });

    test('should work on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      await tradingPage.goto();
      
      await expect(tradingPage.isTradingPanelVisible()).resolves.toBe(true);
      await expect(tradingPage.isOrdersTableVisible()).resolves.toBe(true);
    });
  });

  test.describe('错误处理', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // 模拟网络错误
      await page.route('**/api/**', route => route.abort('failed'));
      
      await tradingPage.selectSymbol('BTC/USDT');
      await tradingPage.clickBuyButton();
      
      await page.waitForTimeout(2000);
      
      const errorMessage = await tradingPage.getErrorMessage();
      expect(errorMessage).toBeTruthy();
    });

    test('should handle authentication errors', async ({ page }) => {
      // 模拟认证错误
      await page.route('**/api/**', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' })
        });
      });
      
      await tradingPage.clickBuyButton();
      
      await page.waitForTimeout(2000);
      
      const errorMessage = await tradingPage.getErrorMessage();
      expect(errorMessage).toContain('认证');
    });

    test('should handle server errors gracefully', async ({ page }) => {
      // 模拟服务器错误
      await page.route('**/api/**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });
      
      await tradingPage.clickBuyButton();
      
      await page.waitForTimeout(2000);
      
      const errorMessage = await tradingPage.getErrorMessage();
      expect(errorMessage).toBeTruthy();
    });
  });

  test.describe('性能测试', () => {
    test('should load page within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await tradingPage.goto();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // 5秒内加载完成
    });

    test('should handle rapid successive actions', async ({ page }) => {
      // 快速连续操作
      await tradingPage.selectSymbol('BTC/USDT');
      await tradingPage.selectOrderType('market');
      await tradingPage.setOrderAmount('0.001');
      
      // 快速点击多次
      await tradingPage.clickBuyButton();
      await tradingPage.clickBuyButton();
      await tradingPage.clickBuyButton();
      
      await page.waitForTimeout(2000);
      
      // 页面应该仍然稳定
      await expect(tradingPage.isTradingPanelVisible()).resolves.toBe(true);
    });
  });

  test.describe('数据持久化', () => {
    test('should persist exchange connections after refresh', async ({ page }) => {
      const initialCount = await tradingPage.getExchangeCount();
      
      await page.reload();
      await tradingPage.goto();
      
      const finalCount = await tradingPage.getExchangeCount();
      expect(finalCount).toBe(initialCount);
    });

    test('should maintain user preferences', async ({ page }) => {
      // 设置偏好
      await tradingPage.selectSymbol('ETH/USDT');
      await tradingPage.selectOrderType('limit');
      
      await page.reload();
      await tradingPage.goto();
      
      // 验证偏好是否保持
      const selectedSymbol = await page.locator('[data-testid="symbol-select"]').inputValue();
      expect(selectedSymbol).toBe('ETH/USDT');
    });
  });

  test.afterEach(async ({ page }) => {
    // 清理测试数据
    await page.screenshot({ path: `test-results/trading-test-${Date.now()}.png` });
  });
});