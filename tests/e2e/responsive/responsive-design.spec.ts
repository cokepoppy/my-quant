import { test, expect } from '@playwright/test';

test.describe('响应式设计测试', () => {
  const viewports = [
    { width: 1920, height: 1080, name: 'Desktop' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 375, height: 812, name: 'Mobile' }
  ];

  for (const viewport of viewports) {
    test(`should display correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/login');
      
      // 验证主要元素可见
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
      
      // 在移动端验证菜单按钮可见
      if (viewport.width <= 768) {
        await expect(page.locator('[data-testid="mobile-menu-btn"]')).toBeVisible();
      }
    });
  }

  test('should handle mobile navigation correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login');
    
    // 点击移动端菜单
    await page.click('[data-testid="mobile-menu-btn"]');
    
    // 验证导航菜单显示
    await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible();
  });
});