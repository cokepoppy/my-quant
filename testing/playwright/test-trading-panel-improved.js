const { chromium } = require('playwright');

async function testTradingPanelImproved() {
  console.log('开始改进版交易面板快速交易测试...');
  
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
    // === 步骤1: 强制重新登录 ===
    console.log('步骤1: 强制重新登录...');
    
    // 清除cookies并重新访问登录页面
    await context.clearCookies();
    await page.goto('http://localhost:3001/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });

    // 等待登录页面完全加载
    await page.waitForSelector('body', { timeout: 10000 });
    
    // 截图保存登录页面
    await page.screenshot({ path: 'login-page-start.png' });
    console.log('✅ 登录页面截图保存');

    // 填写登录表单 - 使用更精确的选择器
    console.log('填写登录表单...');
    
    // 通过JavaScript填写表单，确保填写成功
    await page.evaluate(() => {
      // 查找邮箱输入框
      const emailInputs = document.querySelectorAll('input[type="email"], input[placeholder*="邮箱"], input[placeholder*="email"]');
      const emailInput = emailInputs[0] || document.querySelector('input[class*="inner"]');
      if (emailInput) {
        emailInput.value = 'admin@example.com';
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        emailInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      // 查找密码输入框
      const passwordInputs = document.querySelectorAll('input[type="password"], input[placeholder*="密码"], input[placeholder*="password"]');
      const passwordInput = passwordInputs[0];
      if (passwordInput) {
        passwordInput.value = 'admin123';
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
        passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    
    console.log('✅ 登录表单填写完成');
    
    // 截图保存填写后的表单
    await page.screenshot({ path: 'login-form-filled.png' });

    // 查找并点击登录按钮
    console.log('点击登录按钮...');
    const loginButton = await page.$('button:has-text("登录"), button[type="submit"], .login-button, .el-button--primary');
    if (loginButton) {
      await loginButton.click();
      console.log('✅ 点击登录按钮');
    } else {
      // 通过JavaScript点击
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
          const text = button.textContent;
          if (text && text.includes('登录')) {
            button.click();
            break;
          }
        }
      });
      console.log('✅ 通过JavaScript点击登录按钮');
    }

    // 等待登录完成
    await page.waitForTimeout(5000);
    
    // 检查登录后的URL
    const afterLoginUrl = page.url();
    console.log(`登录后URL: ${afterLoginUrl}`);
    
    // 截图保存登录后状态
    await page.screenshot({ path: 'after-login.png' });
    console.log('✅ 登录后状态截图保存');

    // 检查是否真的登录成功
    const isLoggedIn = !afterLoginUrl.includes('login');
    if (!isLoggedIn) {
      throw new Error('登录失败，仍在登录页面');
    }
    
    console.log('✅ 登录成功！');

    // === 步骤2: 寻找并点击交易面板 ===
    console.log('步骤2: 寻找并点击交易面板...');
    
    // 等待页面完全加载
    await page.waitForTimeout(3000);
    
    // 获取页面内容分析
    const pageContent = await page.content();
    console.log('页面内容包含"交易":', pageContent.includes('交易'));
    console.log('页面内容包含"Trading":', pageContent.includes('Trading'));
    
    // 查找所有可能的导航元素
    const navigationElements = await page.$$([
      'nav a', 
      '.nav a', 
      '.sidebar a', 
      '.menu a', 
      '.navigation a',
      'header a',
      '.header a',
      '.top-nav a',
      '.main-nav a'
    ].join(', '));
    
    console.log(`找到 ${navigationElements.length} 个导航链接`);
    
    let tradingFound = false;
    for (let i = 0; i < navigationElements.length; i++) {
      const element = navigationElements[i];
      const text = await element.textContent();
      const href = await element.getAttribute('href');
      
      console.log(`导航链接 ${i + 1}: "${text}" -> ${href}`);
      
      if (text && (text.includes('交易') || text.includes('Trading') || text.includes('交易面板') || (href && href.includes('trading')))) {
        await element.click();
        tradingFound = true;
        console.log(`✅ 点击交易导航: "${text}"`);
        break;
      }
    }
    
    if (!tradingFound) {
      // 尝试查找按钮
      const buttons = await page.$$('button');
      console.log(`找到 ${buttons.length} 个按钮`);
      
      for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        const text = await button.textContent();
        
        if (text && (text.includes('交易') || text.includes('Trading'))) {
          await button.click();
          tradingFound = true;
          console.log(`✅ 点击交易按钮: "${text}"`);
          break;
        }
      }
    }
    
    // 等待页面跳转
    await page.waitForTimeout(3000);
    
    // 检查点击后的URL
    const afterTradingClickUrl = page.url();
    console.log(`点击交易后URL: ${afterTradingClickUrl}`);
    
    // 截图保存交易面板页面
    await page.screenshot({ path: 'trading-panel-page.png' });
    console.log('✅ 交易面板页面截图保存');

    // === 步骤3: 查找快速交易功能 ===
    console.log('步骤3: 查找快速交易功能...');
    
    // 查找快速交易相关的元素
    const quickTradeElements = await page.$$([
      'button:has-text("快速交易")',
      'button:has-text("Quick Trade")',
      'a:has-text("快速交易")',
      'a:has-text("Quick Trade")',
      '.quick-trade',
      '[class*="quick"]',
      '[data-testid*="quick"]'
    ].join(', '));
    
    console.log(`找到 ${quickTradeElements.length} 个快速交易相关元素`);
    
    // 显示快速交易元素信息
    for (let i = 0; i < quickTradeElements.length; i++) {
      const element = quickTradeElements[i];
      const text = await element.textContent();
      const className = await element.getAttribute('class');
      console.log(`快速交易元素 ${i + 1}: "${text}" -> class: ${className}`);
    }
    
    // 如果找到快速交易按钮，点击它
    if (quickTradeElements.length > 0) {
      await quickTradeElements[0].click();
      console.log('✅ 点击快速交易元素');
      await page.waitForTimeout(2000);
    }
    
    // 截图保存快速交易页面
    await page.screenshot({ path: 'quick-trade-found.png' });
    console.log('✅ 快速交易页面截图保存');

    // === 步骤4: 分析交易表单 ===
    console.log('步骤4: 分析交易表单...');
    
    // 通过JavaScript详细分析页面结构
    const formAnalysis = await page.evaluate(() => {
      const result = {
        forms: [],
        inputs: [],
        selects: [],
        buttons: [],
        textAreas: []
      };
      
      // 分析所有表单
      document.querySelectorAll('form').forEach((form, index) => {
        const formData = {
          index,
          action: form.action,
          method: form.method,
          className: form.className,
          inputs: []
        };
        
        form.querySelectorAll('input').forEach(input => {
          formData.inputs.push({
            type: input.type,
            name: input.name,
            placeholder: input.placeholder,
            value: input.value,
            className: input.className,
            required: input.required
          });
        });
        
        result.forms.push(formData);
      });
      
      // 分析所有输入框
      document.querySelectorAll('input').forEach(input => {
        result.inputs.push({
          type: input.type,
          name: input.name,
          placeholder: input.placeholder,
          value: input.value,
          className: input.className,
          required: input.required
        });
      });
      
      // 分析所有选择框
      document.querySelectorAll('select').forEach(select => {
        result.selects.push({
          name: select.name,
          className: select.className,
          options: Array.from(select.options).map(option => ({
            value: option.value,
            text: option.text
          }))
        });
      });
      
      // 分析所有按钮
      document.querySelectorAll('button').forEach(button => {
        result.buttons.push({
          text: button.textContent,
          type: button.type,
          className: button.className,
          disabled: button.disabled
        });
      });
      
      // 查找交易相关的特定元素
      result.tradingElements = {
        symbolElements: Array.from(document.querySelectorAll('[class*="symbol"], [name*="symbol"], [data-testid*="symbol"]')).map(el => ({
          tagName: el.tagName,
          className: el.className,
          name: el.getAttribute('name')
        })),
        amountElements: Array.from(document.querySelectorAll('[class*="amount"], [name*="amount"], [data-testid*="amount"], [placeholder*="数量"], [placeholder*="amount"]')).map(el => ({
          tagName: el.tagName,
          className: el.className,
          name: el.getAttribute('name')
        })),
        priceElements: Array.from(document.querySelectorAll('[class*="price"], [name*="price"], [data-testid*="price"], [placeholder*="价格"], [placeholder*="price"]')).map(el => ({
          tagName: el.tagName,
          className: el.className,
          name: el.getAttribute('name')
        })),
        buyButtons: Array.from(document.querySelectorAll('button')).filter(btn => {
          const text = btn.textContent;
          return text && (text.includes('买') || text.includes('Buy') || text.includes('买入'));
        }).map(btn => ({
          text: btn.textContent,
          className: btn.className
        })),
        sellButtons: Array.from(document.querySelectorAll('button')).filter(btn => {
          const text = btn.textContent;
          return text && (text.includes('卖') || text.includes('Sell') || text.includes('卖出'));
        }).map(btn => ({
          text: btn.textContent,
          className: btn.className
        }))
      };
      
      return result;
    });
    
    console.log('表单分析结果:');
    console.log(`- 表单数量: ${formAnalysis.forms.length}`);
    console.log(`- 输入框数量: ${formAnalysis.inputs.length}`);
    console.log(`- 选择框数量: ${formAnalysis.selects.length}`);
    console.log(`- 按钮数量: ${formAnalysis.buttons.length}`);
    console.log(`- 交易对元素: ${formAnalysis.tradingElements.symbolElements.length}`);
    console.log(`- 数量元素: ${formAnalysis.tradingElements.amountElements.length}`);
    console.log(`- 价格元素: ${formAnalysis.tradingElements.priceElements.length}`);
    console.log(`- 买入按钮: ${formAnalysis.tradingElements.buyButtons.length}`);
    console.log(`- 卖出按钮: ${formAnalysis.tradingElements.sellButtons.length}`);
    
    // 截图保存表单分析页面
    await page.screenshot({ path: 'form-analysis.png' });
    console.log('✅ 表单分析页面截图保存');

    // === 步骤5: 尝试执行交易操作 ===
    console.log('步骤5: 尝试执行交易操作...');
    
    // 如果找到买入按钮，点击它
    if (formAnalysis.tradingElements.buyButtons.length > 0) {
      const buyButtonInfo = formAnalysis.tradingElements.buyButtons[0];
      console.log(`找到买入按钮: "${buyButtonInfo.text}"`);
      
      // 通过JavaScript点击买入按钮
      await page.evaluate(() => {
        const buyButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
          const text = btn.textContent;
          return text && (text.includes('买') || text.includes('Buy') || text.includes('买入'));
        });
        
        if (buyButtons.length > 0) {
          buyButtons[0].click();
        }
      });
      
      console.log('✅ 点击买入按钮');
      await page.waitForTimeout(2000);
    }
    
    // 截图保存交易操作后页面
    await page.screenshot({ path: 'trade-operation.png' });
    console.log('✅ 交易操作后页面截图保存');

    // === 步骤6: 检查交易结果 ===
    console.log('步骤6: 检查交易结果...');
    
    // 检查是否有弹窗或模态框
    const hasModal = await page.$('.modal, .dialog, [class*="modal"], [class*="dialog"], .el-dialog');
    if (hasModal) {
      console.log('✅ 发现模态框');
      const modalText = await hasModal.textContent();
      console.log(`模态框内容: ${modalText}`);
      
      // 尝试点击确认按钮
      const confirmButton = await hasModal.$('button:has-text("确认"), button:has-text("确定"), button:has-text("OK"), button:has-text("是")');
      if (confirmButton) {
        await confirmButton.click();
        console.log('✅ 点击确认按钮');
        await page.waitForTimeout(1000);
      }
    }
    
    // 检查页面变化
    const finalUrl = page.url();
    console.log(`最终URL: ${finalUrl}`);
    
    // 最终截图
    await page.screenshot({ path: 'final-trading-result.png' });
    console.log('✅ 最终交易结果截图保存');

    // 返回测试结果
    return {
      success: true,
      message: '改进版交易面板测试完成',
      details: {
        loginSuccess: isLoggedIn,
        tradingFound,
        formAnalysis: {
          forms: formAnalysis.forms.length,
          inputs: formAnalysis.inputs.length,
          selects: formAnalysis.selects.length,
          buttons: formAnalysis.buttons.length,
          symbolElements: formAnalysis.tradingElements.symbolElements.length,
          amountElements: formAnalysis.tradingElements.amountElements.length,
          priceElements: formAnalysis.tradingElements.priceElements.length,
          buyButtons: formAnalysis.tradingElements.buyButtons.length,
          sellButtons: formAnalysis.tradingElements.sellButtons.length
        },
        finalUrl,
        hasModal: !!hasModal
      }
    };

  } catch (error) {
    console.error('❌ 改进版交易面板测试过程中发生错误:', error);
    
    // 错误时截图
    await page.screenshot({ path: 'improved-trading-error.png' });
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
  testTradingPanelImproved()
    .then(result => {
      console.log('\n' + '='.repeat(80));
      console.log('🎯 改进版交易面板快速交易测试结果');
      console.log('='.repeat(80));
      console.log(`✅ 测试成功: ${result.success}`);
      console.log(`📝 测试消息: ${result.message}`);
      
      if (result.success) {
        console.log('\n📋 测试详情:');
        console.log(`🔐 登录状态: ${result.details.loginSuccess ? '成功' : '失败'}`);
        console.log(`🏠 交易面板: ${result.details.tradingFound ? '找到' : '未找到'}`);
        
        console.log('\n📝 表单分析结果:');
        console.log(`📋 表单数量: ${result.details.formAnalysis.forms}`);
        console.log(`📝 输入框: ${result.details.formAnalysis.inputs}`);
        console.log(`📋 选择框: ${result.details.formAnalysis.selects}`);
        console.log(`🔘 按钮: ${result.details.formAnalysis.buttons}`);
        console.log(`📊 交易对元素: ${result.details.formAnalysis.symbolElements}`);
        console.log(`💰 数量元素: ${result.details.formAnalysis.amountElements}`);
        console.log(`💵 价格元素: ${result.details.formAnalysis.priceElements}`);
        console.log(`🟢 买入按钮: ${result.details.formAnalysis.buyButtons}`);
        console.log(`🔴 卖出按钮: ${result.details.formAnalysis.sellButtons}`);
        
        console.log('\n🌐 最终状态:');
        console.log(`🔗 最终URL: ${result.details.finalUrl}`);
        console.log(`🖼️ 模态框: ${result.details.hasModal ? '发现' : '未发现'}`);
        
        console.log('\n🎉 改进版测试完成!');
        console.log('✅ 详细页面结构分析完成');
        console.log('✅ 交易功能元素识别完成');
        console.log('✅ 用户交互流程测试完成');
        
      } else {
        console.log('\n❌ 测试失败详情:');
        console.log(`错误信息: ${result.message}`);
        if (result.error) {
          console.log(`错误对象: ${JSON.stringify(result.error, null, 2)}`);
        }
      }
      
      console.log('\n📸 截图文件:');
      console.log('- login-page-start.png (登录页面开始)');
      console.log('- login-form-filled.png (登录表单填写后)');
      console.log('- after-login.png (登录后状态)');
      console.log('- trading-panel-page.png (交易面板页面)');
      console.log('- quick-trade-found.png (快速交易功能)');
      console.log('- form-analysis.png (表单分析页面)');
      console.log('- trade-operation.png (交易操作后)');
      console.log('- final-trading-result.png (最终交易结果)');
      if (!result.success) {
        console.log('- improved-trading-error.png (错误页面)');
      }
      
      console.log('='.repeat(80));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ 改进版交易面板测试执行失败:', error);
      process.exit(1);
    });
}

module.exports = { testTradingPanelImproved };