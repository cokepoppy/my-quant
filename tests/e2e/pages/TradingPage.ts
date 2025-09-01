import { type Page } from '@playwright/test';
import { TestUtils } from '../utils/test-utils';

export class TradingPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/trading');
    await TestUtils.waitForPageTitle(this.page, '交易面板');
  }

  // 交易所相关操作
  async getExchangeCount() {
    await TestUtils.waitForElement(this.page, '[data-testid="exchange-tab"]');
    return await this.page.locator('[data-testid="exchange-tab"]').count();
  }

  async clickAddExchange() {
    await TestUtils.safeClick(this.page, '[data-testid="add-exchange-btn"]');
  }

  async fillExchangeForm(name: string, exchange: string, apiKey: string, apiSecret: string, isTest: boolean) {
    await TestUtils.safeFill(this.page, '[data-testid="exchange-name"]', name);
    await this.page.selectOption('[data-testid="exchange-select"]', exchange);
    await TestUtils.safeFill(this.page, '[data-testid="api-key"]', apiKey);
    await TestUtils.safeFill(this.page, '[data-testid="api-secret"]', apiSecret);
    
    if (isTest) {
      await this.page.check('[data-testid="test-mode"]');
    }
  }

  async testConnection() {
    await TestUtils.safeClick(this.page, '[data-testid="test-connection-btn"]');
  }

  async saveExchange() {
    await TestUtils.safeClick(this.page, '[data-testid="save-exchange-btn"]');
  }

  // 交易相关操作
  async selectSymbol(symbol: string) {
    await this.page.selectOption('[data-testid="symbol-select"]', symbol);
  }

  async selectOrderType(type: 'market' | 'limit' | 'stop' | 'stop_limit') {
    await TestUtils.safeClick(this.page, `[data-testid="${type}-order-type"]`);
  }

  async setOrderAmount(amount: string) {
    await TestUtils.safeFill(this.page, '[data-testid="order-amount"]', amount);
  }

  async setOrderPrice(price: string) {
    await TestUtils.safeFill(this.page, '[data-testid="order-price"]', price);
  }

  async setStopPrice(price: string) {
    await TestUtils.safeFill(this.page, '[data-testid="stop-price"]', price);
  }

  async clickBuyButton() {
    await TestUtils.safeClick(this.page, '[data-testid="buy-button"]');
  }

  async clickSellButton() {
    await TestUtils.safeClick(this.page, '[data-testid="sell-button"]');
  }

  // 订单管理
  async cancelOrder(orderId: string) {
    await TestUtils.safeClick(this.page, `[data-testid="cancel-order-${orderId}"]`);
  }

  async getOrderCount() {
    await TestUtils.waitForElement(this.page, '[data-testid="order-item"]');
    return await this.page.locator('[data-testid="order-item"]').count();
  }

  async getOpenOrders() {
    const orders = [];
    const orderElements = await this.page.locator('[data-testid="order-item"]').all();
    
    for (const element of orderElements) {
      const symbol = await element.locator('[data-testid="order-symbol"]').textContent();
      const type = await element.locator('[data-testid="order-type"]').textContent();
      const amount = await element.locator('[data-testid="order-amount"]').textContent();
      const price = await element.locator('[data-testid="order-price"]').textContent();
      const status = await element.locator('[data-testid="order-status"]').textContent();
      
      orders.push({ symbol, type, amount, price, status });
    }
    
    return orders;
  }

  // 持仓管理
  async getPositionCount() {
    return await this.page.locator('[data-testid="position-item"]').count();
  }

  async getPositions() {
    const positions = [];
    const positionElements = await this.page.locator('[data-testid="position-item"]').all();
    
    for (const element of positionElements) {
      const symbol = await element.locator('[data-testid="position-symbol"]').textContent();
      const side = await element.locator('[data-testid="position-side"]').textContent();
      const size = await element.locator('[data-testid="position-size"]').textContent();
      const entryPrice = await element.locator('[data-testid="position-entry"]').textContent();
      const currentPrice = await element.locator('[data-testid="position-current"]').textContent();
      const pnl = await element.locator('[data-testid="position-pnl"]').textContent();
      
      positions.push({ symbol, side, size, entryPrice, currentPrice, pnl });
    }
    
    return positions;
  }

  // 市场数据
  async getCurrentPrice(symbol: string) {
    const priceElement = this.page.locator(`[data-testid="price-${symbol}"]`);
    if (await priceElement.isVisible()) {
      return await priceElement.textContent();
    }
    return null;
  }

  async get24hChange(symbol: string) {
    const changeElement = this.page.locator(`[data-testid="change-${symbol}"]`);
    if (await changeElement.isVisible()) {
      return await changeElement.textContent();
    }
    return null;
  }

  // 验证方法
  async isTradingPanelVisible() {
    return await TestUtils.isElementVisible(this.page, '[data-testid="trading-panel"]');
  }

  async isOrderFormVisible() {
    return await TestUtils.isElementVisible(this.page, '[data-testid="order-form"]');
  }

  async isPositionsTableVisible() {
    return await TestUtils.isElementVisible(this.page, '[data-testid="positions-table"]');
  }

  async isOrdersTableVisible() {
    return await TestUtils.isElementVisible(this.page, '[data-testid="orders-table"]');
  }

  async getSuccessMessage() {
    return await TestUtils.getText(this.page, '[data-testid="success-message"]');
  }

  async getErrorMessage() {
    return await TestUtils.getText(this.page, '[data-testid="error-message"]');
  }

  async getValidationMessage(field: string) {
    return await TestUtils.getText(this.page, `[data-testid="${field}-error"]`);
  }

  // 等待特定状态
  async waitForOrderToAppear(symbol: string, timeout = 10000) {
    await TestUtils.waitForElement(this.page, `[data-testid="order-${symbol}"]`, timeout);
  }

  async waitForOrderToDisappear(orderId: string, timeout = 10000) {
    await TestUtils.waitForElementHidden(this.page, `[data-testid="order-${orderId}"]`, timeout);
  }

  async waitForPriceUpdate(symbol: string, timeout = 5000) {
    const initialPrice = await this.getCurrentPrice(symbol);
    await this.page.waitForFunction(
      (sym, initialPrice) => {
        const priceElement = document.querySelector(`[data-testid="price-${sym}"]`);
        return priceElement && priceElement.textContent !== initialPrice;
      },
      { symbol, initialPrice, timeout }
    );
  }

  // 风险管理相关
  async getRiskIndicators() {
    const indicators = {};
    
    const riskScore = await this.page.locator('[data-testid="risk-score"]');
    if (await riskScore.isVisible()) {
      indicators['riskScore'] = await riskScore.textContent();
    }
    
    const marginLevel = await this.page.locator('[data-testid="margin-level"]');
    if (await marginLevel.isVisible()) {
      indicators['marginLevel'] = await marginLevel.textContent();
    }
    
    const drawdown = await this.page.locator('[data-testid="drawdown"]');
    if (await drawdown.isVisible()) {
      indicators['drawdown'] = await drawdown.textContent();
    }
    
    return indicators;
  }

  // WebSocket 连接状态
  async getWebSocketStatus() {
    const statusElement = this.page.locator('[data-testid="ws-status"]');
    if (await statusElement.isVisible()) {
      return await statusElement.textContent();
    }
    return 'unknown';
  }

  // 截图和调试
  async takeScreenshot(name: string) {
    await TestUtils.takeScreenshot(this.page, `trading-${name}`);
  }

  async getPageTitle() {
    return await this.page.title();
  }

  async getCurrentUrl() {
    return this.page.url();
  }
}