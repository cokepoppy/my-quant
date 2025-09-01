import { type Page } from '@playwright/test';
import { TestUtils } from '../utils/test-utils';

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/login');
    await TestUtils.waitForPageTitle(this.page, '登录');
  }

  async login(email: string, password: string) {
    await TestUtils.safeFill(this.page, '[data-testid="email-input"]', email);
    await TestUtils.safeFill(this.page, '[data-testid="password-input"]', password);
    await TestUtils.safeClick(this.page, '[data-testid="login-button"]');
    await this.page.waitForURL('/dashboard');
  }

  async getErrorMessage() {
    return await TestUtils.getText(this.page, '[data-testid="error-message"]');
  }

  async isLoginButtonEnabled() {
    return !(await TestUtils.isElementDisabled(this.page, '[data-testid="login-button"]'));
  }
}