import { type Page } from '@playwright/test';

export class TestUtils {
  /**
   * 等待元素出现
   */
  static async waitForElement(page: Page, selector: string, timeout = 10000) {
    await page.waitForSelector(selector, { timeout });
  }

  /**
   * 等待元素消失
   */
  static async waitForElementHidden(page: Page, selector: string, timeout = 10000) {
    await page.waitForSelector(selector, { state: 'hidden', timeout });
  }

  /**
   * 安全点击元素
   */
  static async safeClick(page: Page, selector: string) {
    await this.waitForElement(page, selector);
    await page.click(selector);
  }

  /**
   * 安全填充表单
   */
  static async safeFill(page: Page, selector: string, value: string) {
    await this.waitForElement(page, selector);
    await page.fill(selector, value);
  }

  /**
   * 获取文本内容
   */
  static async getText(page: Page, selector: string) {
    await this.waitForElement(page, selector);
    return await page.textContent(selector);
  }

  /**
   * 检查元素是否存在
   */
  static async isElementVisible(page: Page, selector: string) {
    try {
      await this.waitForElement(page, selector, 5000);
      return await page.isVisible(selector);
    } catch {
      return false;
    }
  }

  /**
   * 等待导航完成
   */
  static async waitForNavigation(page: Page) {
    await page.waitForLoadState('networkidle');
  }

  /**
   * 获取随机字符串
   */
  static getRandomString(length = 8) {
    return Math.random().toString(36).substring(2, length + 2);
  }

  /**
   * 获取随机邮箱
   */
  static getRandomEmail() {
    return `test-${this.getRandomString()}@example.com`;
  }

  /**
   * 拍截图
   */
  static async takeScreenshot(page: Page, name: string) {
    await page.screenshot({ path: `test-results/${name}.png` });
  }

  /**
   * 等待WebSocket连接
   */
  static async waitForWebSocket(page: Page, url: string) {
    return await page.waitForResponse(response => 
      response.url().includes(url) && response.status() === 101
    );
  }

  /**
   * 模拟API响应
   */
  static async mockAPI(page: Page, url: string, responseData: any) {
    await page.route(url, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(responseData)
      });
    });
  }

  /**
   * 获取控制台日志
   */
  static async getConsoleLogs(page: Page) {
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });
    return logs;
  }

  /**
   * 等待特定数量的元素
   */
  static async waitForElementCount(page: Page, selector: string, count: number, timeout = 10000) {
    await page.waitForFunction(
      (sel, cnt) => document.querySelectorAll(sel).length === cnt,
      { selector, count, timeout }
    );
  }

  /**
   * 检查元素是否包含特定文本
   */
  static async elementContainsText(page: Page, selector: string, text: string) {
    await this.waitForElement(page, selector);
    const elementText = await page.textContent(selector);
    return elementText?.includes(text) || false;
  }

  /**
   * 等待页面标题
   */
  static async waitForPageTitle(page: Page, title: string, timeout = 10000) {
    await page.waitForFunction(
      (expectedTitle) => document.title === expectedTitle,
      { title: expectedTitle, timeout }
    );
  }

  /**
   * 获取元素的属性值
   */
  static async getAttribute(page: Page, selector: string, attributeName: string) {
    await this.waitForElement(page, selector);
    return await page.getAttribute(selector, attributeName);
  }

  /**
   * 检查元素是否禁用
   */
  static async isElementDisabled(page: Page, selector: string) {
    await this.waitForElement(page, selector);
    return await page.isDisabled(selector);
  }

  /**
   * 滚动到元素
   */
  static async scrollToElement(page: Page, selector: string) {
    await this.waitForElement(page, selector);
    await page.$eval(selector, element => element.scrollIntoView());
  }

  /**
   * 等待动画完成
   */
  static async waitForAnimations(page: Page, selector: string) {
    await this.waitForElement(page, selector);
    await page.waitForFunction(
      (sel) => {
        const element = document.querySelector(sel);
        if (!element) return true;
        return element.getAnimations().length === 0;
      },
      { selector }
    );
  }
}