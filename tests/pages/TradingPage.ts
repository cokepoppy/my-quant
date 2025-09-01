import { type Page, type Locator } from '@playwright/test';

export class TradingPage {
  readonly page: Page;
  readonly addExchangeButton: Locator;
  readonly exchangeDialog: Locator;
  readonly exchangeNameInput: Locator;
  readonly exchangeTypeSelect: Locator;
  readonly apiKeyInput: Locator;
  readonly apiSecretInput: Locator;
  readonly testnetCheckbox: Locator;
  readonly testConnectionButton: Locator;
  readonly saveExchangeButton: Locator;
  readonly successMessage: Locator;
  readonly exchangeList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addExchangeButton = page.locator('[data-testid="add-exchange-btn"]');
    this.exchangeDialog = page.locator('[data-testid="exchange-dialog"]');
    this.exchangeNameInput = page.locator('[data-testid="exchange-name"]');
    this.exchangeTypeSelect = page.locator('[data-testid="exchange-type"]');
    this.apiKeyInput = page.locator('[data-testid="api-key"]');
    this.apiSecretInput = page.locator('[data-testid="api-secret"]');
    this.testnetCheckbox = page.locator('[data-testid="testnet"]');
    this.testConnectionButton = page.locator('[data-testid="test-connection-btn"]');
    this.saveExchangeButton = page.locator('[data-testid="save-exchange-btn"]');
    this.successMessage = page.locator('[data-testid="success-message"]');
    this.exchangeList = page.locator('[data-testid="exchange-list"]');
  }

  async goto() {
    await this.page.goto('/trading');
  }

  async clickAddExchange() {
    await this.addExchangeButton.click();
  }

  async fillExchangeForm(name: string, type: string, apiKey: string, apiSecret: string, testnet: boolean = true) {
    await this.exchangeNameInput.fill(name);
    await this.exchangeTypeSelect.selectOption(type);
    await this.apiKeyInput.fill(apiKey);
    await this.apiSecretInput.fill(apiSecret);
    if (testnet) {
      await this.testnetCheckbox.check();
    } else {
      await this.testnetCheckbox.uncheck();
    }
  }

  async testConnection() {
    await this.testConnectionButton.click();
  }

  async saveExchange() {
    await this.saveExchangeButton.click();
  }

  async getSuccessMessage() {
    return await this.successMessage.textContent();
  }

  async getExchangeCount() {
    return await this.exchangeList.locator('[data-testid="exchange-item"]').count();
  }

  async isExchangeVisible(exchangeName: string) {
    return await this.exchangeList.locator(`[data-testid="exchange-item"] >> text="${exchangeName}"`).isVisible();
  }
}