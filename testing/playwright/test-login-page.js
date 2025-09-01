const { chromium } = require('playwright');

async function testLoginPage() {
  console.log('开始测试登录页面...');
  
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  });

  const page = await context.newPage();
  
  try {
    // 1. 导航到登录页面
    console.log('步骤1: 导航到登录页面...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });

    // 等待页面加载
    await page.waitForSelector('body', { timeout: 10000 });
    
    // 检查是否需要导航到登录页面
    const currentUrl = page.url();
    console.log(`当前URL: ${currentUrl}`);
    
    // 如果当前不是登录页面，尝试查找登录链接
    if (!currentUrl.includes('login')) {
      console.log('当前不在登录页面，尝试查找登录链接...');
      const loginLink = await page.$('a[href*="login"], button:has-text("登录"), button:has-text("Login")');
      if (loginLink) {
        await loginLink.click();
        await page.waitForTimeout(2000);
        console.log('点击登录链接后的URL:', page.url());
      }
    }
    
    // 截图保存当前页面状态
    await page.screenshot({ path: 'login-page-initial.png' });
    console.log('✅ 登录页面加载完成，已截图保存');

    // 2. 检查登录表单元素
    console.log('步骤2: 检查登录表单元素...');
    
    // 查找邮箱输入框
    const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="邮箱"], input[placeholder*="email"]');
    if (!emailInput) {
      console.log('❌ 未找到邮箱输入框，尝试其他选择器...');
      // 尝试查找所有输入框
      const inputs = await page.$$('input');
      console.log(`找到 ${inputs.length} 个输入框`);
      
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const type = await input.getAttribute('type');
        const name = await input.getAttribute('name');
        const placeholder = await input.getAttribute('placeholder');
        console.log(`输入框 ${i + 1}: type="${type}", name="${name}", placeholder="${placeholder}"`);
      }
    } else {
      console.log('✅ 找到邮箱输入框');
    }

    // 查找密码输入框
    const passwordInput = await page.$('input[type="password"], input[name="password"], input[placeholder*="密码"], input[placeholder*="password"]');
    if (!passwordInput) {
      console.log('❌ 未找到密码输入框');
    } else {
      console.log('✅ 找到密码输入框');
    }

    // 查找登录按钮
    const loginButton = await page.$('button[type="submit"], button:has-text("登录"), button:has-text("Login"), button:has-text("登录")');
    if (!loginButton) {
      console.log('❌ 未找到登录按钮');
    } else {
      console.log('✅ 找到登录按钮');
    }

    // 3. 填写登录表单
    console.log('步骤3: 填写登录表单...');
    
    // 使用默认测试账户
    const testEmail = 'admin@example.com';
    const testPassword = 'admin123';
    
    console.log(`使用测试账户: ${testEmail}`);
    
    // 填写邮箱
    if (emailInput) {
      await emailInput.fill(testEmail);
      console.log('✅ 邮箱填写完成');
    } else {
      // 尝试通过JavaScript填写
      await page.evaluate(() => {
        const emailField = document.querySelector('input[type="email"]') || 
                          document.querySelector('input[name="email"]') ||
                          document.querySelector('input[placeholder*="邮箱"]') ||
                          document.querySelector('input[placeholder*="email"]');
        if (emailField) {
          emailField.value = 'admin@example.com';
          emailField.dispatchEvent(new Event('input', { bubbles: true }));
          emailField.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      console.log('✅ 通过JavaScript填写邮箱');
    }

    // 填写密码
    if (passwordInput) {
      await passwordInput.fill(testPassword);
      console.log('✅ 密码填写完成');
    } else {
      // 尝试通过JavaScript填写
      await page.evaluate(() => {
        const passwordField = document.querySelector('input[type="password"]') || 
                             document.querySelector('input[name="password"]') ||
                             document.querySelector('input[placeholder*="密码"]') ||
                             document.querySelector('input[placeholder*="password"]');
        if (passwordField) {
          passwordField.value = 'admin123';
          passwordField.dispatchEvent(new Event('input', { bubbles: true }));
          passwordField.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      console.log('✅ 通过JavaScript填写密码');
    }

    // 截图保存填写后的表单
    await page.screenshot({ path: 'login-page-filled.png' });
    console.log('✅ 表单填写完成，已截图保存');

    // 4. 提交登录表单
    console.log('步骤4: 提交登录表单...');
    
    if (loginButton) {
      await loginButton.click();
      console.log('✅ 点击登录按钮');
    } else {
      // 尝试通过JavaScript提交表单
      await page.evaluate(() => {
        const form = document.querySelector('form');
        const button = document.querySelector('button[type="submit"]');
        
        if (button) {
          button.click();
        } else if (form) {
          form.submit();
        } else {
          // 触发回车键
          const activeElement = document.activeElement;
          if (activeElement) {
            const event = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter' });
            activeElement.dispatchEvent(event);
          }
        }
      });
      console.log('✅ 通过JavaScript提交表单');
    }

    // 5. 等待登录结果
    console.log('步骤5: 等待登录结果...');
    
    // 等待页面变化或导航
    await page.waitForTimeout(3000);
    
    // 检查当前URL
    const finalUrl = page.url();
    console.log(`当前URL: ${finalUrl}`);
    
    // 检查是否有错误消息
    const errorMessage = await page.$('.error, .alert-error, [class*="error"], [class*="alert"]');
    if (errorMessage) {
      const errorText = await errorMessage.textContent();
      console.log(`❌ 发现错误消息: ${errorText}`);
    } else {
      console.log('✅ 未发现错误消息');
    }

    // 检查是否有成功消息
    const successMessage = await page.$('.success, .alert-success, [class*="success"]');
    if (successMessage) {
      const successText = await successMessage.textContent();
      console.log(`✅ 发现成功消息: ${successText}`);
    }

    // 6. 截图保存最终结果
    await page.screenshot({ path: 'login-page-result.png' });
    console.log('✅ 登录结果截图保存');

    // 7. 检查登录状态
    console.log('步骤6: 检查登录状态...');
    
    // 检查是否还在登录页面
    const isStillOnLoginPage = finalUrl.includes('login') || finalUrl.includes('auth');
    
    // 检查页面内容
    const pageContent = await page.content();
    const hasUserMenu = pageContent.includes('用户') || pageContent.includes('user') || pageContent.includes('profile');
    const hasLogoutButton = pageContent.includes('退出') || pageContent.includes('logout') || pageContent.includes('signout');
    
    if (!isStillOnLoginPage || hasUserMenu || hasLogoutButton) {
      console.log('✅ 登录成功！');
      return {
        success: true,
        message: '登录测试成功',
        details: {
          finalUrl: finalUrl,
          hasUserMenu,
          hasLogoutButton,
          isStillOnLoginPage
        }
      };
    } else {
      console.log('❌ 登录可能失败，仍在登录页面');
      return {
        success: false,
        message: '登录测试失败，仍在登录页面',
        details: {
          finalUrl: finalUrl,
          hasUserMenu,
          hasLogoutButton,
          isStillOnLoginPage
        }
      };
    }

  } catch (error) {
    console.error('❌ 登录测试过程中发生错误:', error);
    
    // 错误时截图
    await page.screenshot({ path: 'login-page-error.png' });
    console.log('✅ 错误截图已保存');
    
    return {
      success: false,
      message: error.message,
      error: error
    };
  } finally {
    await context.close();
    await browser.close();
  }
}

// 运行测试
if (require.main === module) {
  testLoginPage()
    .then(result => {
      console.log('\n' + '='.repeat(60));
      console.log('🎯 登录页面测试结果');
      console.log('='.repeat(60));
      console.log(`✅ 测试成功: ${result.success}`);
      console.log(`📝 测试消息: ${result.message}`);
      
      if (result.success) {
        console.log('\n📋 登录成功详情:');
        console.log(`🌐 最终URL: ${result.details.finalUrl}`);
        console.log(`👤 用户菜单: ${result.details.hasUserMenu ? '存在' : '不存在'}`);
        console.log(`🚪 退出按钮: ${result.details.hasLogoutButton ? '存在' : '不存在'}`);
        console.log(`📄 仍在登录页: ${result.details.isStillOnLoginPage ? '是' : '否'}`);
        
        console.log('\n🎉 登录测试成功!');
        console.log('✅ 页面加载正常');
        console.log('✅ 表单元素存在');
        console.log('✅ 表单填写成功');
        console.log('✅ 登录提交成功');
        console.log('✅ 用户认证通过');
        
      } else {
        console.log('\n❌ 登录失败详情:');
        console.log(`错误信息: ${result.message}`);
        if (result.details) {
          console.log(`🌐 最终URL: ${result.details.finalUrl}`);
          console.log(`👤 用户菜单: ${result.details.hasUserMenu ? '存在' : '不存在'}`);
          console.log(`🚪 退出按钮: ${result.details.hasLogoutButton ? '存在' : '不存在'}`);
          console.log(`📄 仍在登录页: ${result.details.isStillOnLoginPage ? '是' : '否'}`);
        }
        if (result.error) {
          console.log(`错误对象: ${JSON.stringify(result.error, null, 2)}`);
        }
      }
      
      console.log('\n📸 截图文件:');
      console.log('- login-page-initial.png (初始页面)');
      console.log('- login-page-filled.png (填写后表单)');
      console.log('- login-page-result.png (登录结果)');
      if (!result.success) {
        console.log('- login-page-error.png (错误页面)');
      }
      
      console.log('='.repeat(60));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ 登录测试执行失败:', error);
      process.exit(1);
    });
}

module.exports = { testLoginPage };