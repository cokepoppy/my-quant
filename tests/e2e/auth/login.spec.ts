import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('用户认证流程', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should display login form', async () => {
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('should show validation error for empty fields', async () => {
    await loginPage.loginButton.click();
    await expect(loginPage.errorMessage).toBeVisible();
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('请输入邮箱');
  });

  test('should show error for invalid email format', async () => {
    await loginPage.login('invalid-email', 'password123');
    await expect(loginPage.errorMessage).toBeVisible();
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('邮箱格式不正确');
  });

  test('should show error for wrong credentials', async () => {
    await loginPage.login('wrong@example.com', 'wrongpassword');
    await expect(loginPage.errorMessage).toBeVisible();
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('邮箱或密码错误');
  });

  test('should login successfully with valid credentials', async () => {
    await loginPage.login(process.env.TEST_USER_EMAIL || 'test@example.com', process.env.TEST_USER_PASSWORD || 'testpassword123');
    
    // 验证登录成功后跳转到交易页面
    await expect(page).toHaveURL('/trading');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should redirect to login page when accessing protected route without auth', async ({ page }) => {
    await page.goto('/trading');
    await expect(page).toHaveURL('/login');
  });
});