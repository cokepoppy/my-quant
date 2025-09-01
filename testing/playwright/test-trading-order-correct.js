const { chromium } = require('playwright');

(async () => {
    console.log('🏠 交易下单功能测试');
    
    // 创建浏览器实例
    const browser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--enable-font-antialiasing',
            '--force-color-profile=srgb',
            '--disable-features=VizDisplayCompositor'
        ]
    });
    
    const page = await browser.newPage({
        viewport: { width: 1280, height: 720 }
    });
    
    try {
        // 设置超时时间
        page.setDefaultTimeout(30000);
        
        // 监听控制台消息
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`❌ 控制台错误: ${msg.text()}`);
            } else if (msg.type() === 'log') {
                console.log(`📝 控制台日志: ${msg.text()}`);
            }
        });
        
        page.on('pageerror', error => {
            console.log(`❌ 页面错误: ${error.message}`);
        });
        
        // 监听网络请求
        page.on('request', request => {
            if (request.url().includes('/api/trading') || request.url().includes('/api/order')) {
                console.log(`📡 API请求: ${request.method()} ${request.url()}`);
            }
        });
        
        page.on('response', response => {
            if (response.url().includes('/api/trading') || response.url().includes('/api/order')) {
                console.log(`📡 API响应: ${response.status()} ${response.url()}`);
            }
        });
        
        // 1. 首先登录
        console.log('🔐 步骤1: 登录系统...');
        await page.goto('http://localhost:3001/login', { 
            waitUntil: 'networkidle',
            timeout: 15000 
        });
        
        // 等待登录页面加载
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);
        
        // 填写登录表单
        await page.fill('input[type="email"], input[placeholder*="邮箱"]', 'test@example.com');
        await page.fill('input[type="password"], input[placeholder*="密码"]', 'password123');
        await page.waitForTimeout(500);
        
        // 点击登录按钮
        await page.click('button[type="submit"], button');
        
        // 等待登录完成
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 验证登录成功
        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
            throw new Error('登录失败');
        }
        
        console.log('✅ 登录成功');
        
        // 创建截图目录
        const fs = require('fs');
        const screenshotDir = '../screenshots/trading-order-test';
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }
        
        // 截图1: 登录后的页面
        await page.screenshot({ 
            path: `${screenshotDir}/01-after-login.png`,
            fullPage: true 
        });
        
        // 2. 导航到交易面板
        console.log('🏠 步骤2: 导航到交易面板...');
        
        // 查找交易面板链接或按钮
        const tradingSelectors = [
            'a[href*="trading"]',
            'button:has-text("交易")',
            'button:has-text("Trading")',
            '.nav-item a[href*="trading"]',
            '.sidebar-item[href*="trading"]',
            '[data-testid*="trading"]',
            'a:has-text("交易")',
            'button:has-text("交易面板")'
        ];
        
        let tradingFound = false;
        for (const selector of tradingSelectors) {
            try {
                const element = await page.$(selector);
                if (element) {
                    await element.click();
                    tradingFound = true;
                    console.log(`✅ 找到并点击交易面板: ${selector}`);
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        
        if (!tradingFound) {
            console.log('⚠️  未找到交易面板链接，尝试直接导航...');
            await page.goto('http://localhost:3001/trading', { 
                waitUntil: 'networkidle' 
            });
        }
        
        // 等待页面加载
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 截图2: 交易面板页面
        await page.screenshot({ 
            path: `${screenshotDir}/02-trading-panel.png`,
            fullPage: true 
        });
        
        // 3. 分析交易面板结构
        console.log('🔍 步骤3: 分析交易面板结构...');
        
        const panelAnalysis = await page.evaluate(() => {
            const result = {
                url: window.location.href,
                title: document.title,
                forms: [],
                inputs: [],
                selects: [],
                buttons: [],
                tradingElements: []
            };
            
            // 查找表单
            document.querySelectorAll('form').forEach((form, index) => {
                result.forms.push({
                    index: index,
                    action: form.action,
                    method: form.method,
                    id: form.id,
                    className: form.className
                });
            });
            
            // 查找输入框
            document.querySelectorAll('input').forEach((input, index) => {
                result.inputs.push({
                    index: index,
                    type: input.type,
                    name: input.name,
                    id: input.id,
                    placeholder: input.placeholder,
                    className: input.className,
                    value: input.value
                });
            });
            
            // 查找下拉框
            document.querySelectorAll('select').forEach((select, index) => {
                result.selects.push({
                    index: index,
                    name: select.name,
                    id: select.id,
                    className: select.className
                });
            });
            
            // 查找按钮
            document.querySelectorAll('button').forEach((button, index) => {
                result.buttons.push({
                    index: index,
                    text: button.textContent?.trim(),
                    id: button.id,
                    className: button.className,
                    type: button.type
                });
            });
            
            // 查找交易相关元素
            const tradingKeywords = ['buy', 'sell', 'order', 'trade', '交易', '买入', '卖出', '下单', '价格', '数量'];
            document.querySelectorAll('*').forEach(element => {
                const text = element.textContent?.toLowerCase() || '';
                if (tradingKeywords.some(keyword => text.includes(keyword))) {
                    result.tradingElements.push({
                        tag: element.tagName,
                        text: element.textContent?.trim(),
                        className: element.className
                    });
                }
            });
            
            return result;
        });
        
        console.log('📊 交易面板分析:');
        console.log(`- 表单数量: ${panelAnalysis.forms.length}`);
        console.log(`- 输入框数量: ${panelAnalysis.inputs.length}`);
        console.log(`- 下拉框数量: ${panelAnalysis.selects.length}`);
        console.log(`- 按钮数量: ${panelAnalysis.buttons.length}`);
        console.log(`- 交易相关元素: ${panelAnalysis.tradingElements.length}`);
        
        // 截图3: 交易面板分析
        await page.screenshot({ 
            path: `${screenshotDir}/03-panel-analysis.png`,
            fullPage: true 
        });
        
        // 4. 查找并填写交易表单
        console.log('📝 步骤4: 填写交易表单...');
        
        // 查找交易表单
        let tradingForm = null;
        if (panelAnalysis.forms.length > 0) {
            // 优先查找包含交易相关字段的表单
            for (let i = 0; i < panelAnalysis.forms.length; i++) {
                const form = await page.$(`form:nth-of-type(${i + 1})`);
                const hasTradingFields = await form.$$eval('input', inputs => 
                    inputs.some(input => 
                        input.placeholder?.includes('价格') || 
                        input.placeholder?.includes('数量') ||
                        input.name?.includes('price') ||
                        input.name?.includes('amount') ||
                        input.name?.includes('quantity')
                    )
                );
                
                if (hasTradingFields) {
                    tradingForm = form;
                    break;
                }
            }
            
            // 如果没有找到，使用第一个表单
            if (!tradingForm && panelAnalysis.forms.length > 0) {
                tradingForm = await page.$('form');
            }
        }
        
        if (!tradingForm) {
            console.log('⚠️  未找到交易表单，尝试直接查找输入框...');
        } else {
            console.log('✅ 找到交易表单');
        }
        
        // 填写价格字段
        const priceSelectors = [
            'input[name="price"]',
            'input[placeholder*="价格"]',
            'input[placeholder*="Price"]',
            'input[type="number"]:first-of-type'
        ];
        
        let priceFilled = false;
        for (const selector of priceSelectors) {
            try {
                const priceInput = await page.$(selector);
                if (priceInput) {
                    await priceInput.fill('50000'); // 假设比特币价格
                    priceFilled = true;
                    console.log('✅ 价格填写完成');
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        
        // 填写数量字段
        const amountSelectors = [
            'input[name="amount"]',
            'input[name="quantity"]',
            'input[placeholder*="数量"]',
            'input[placeholder*="Amount"]',
            'input[type="number"]:nth-of-type(2)'
        ];
        
        let amountFilled = false;
        for (const selector of amountSelectors) {
            try {
                const amountInput = await page.$(selector);
                if (amountInput) {
                    await amountInput.fill('0.01'); // 买入0.01个
                    amountFilled = true;
                    console.log('✅ 数量填写完成');
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        
        // 截图4: 表单填写完成
        await page.screenshot({ 
            path: `${screenshotDir}/04-form-filled.png`,
            fullPage: true 
        });
        
        // 5. 查找并点击下单按钮
        console.log('🖱️  步骤5: 点击下单按钮...');
        
        const orderButtonSelectors = [
            'button[type="submit"]',
            'button:has-text("买入")',
            'button:has-text("Buy")',
            'button:has-text("卖出")',
            'button:has-text("Sell")',
            'button:has-text("下单")',
            'button:has-text("Order")',
            'button:has-text("立即下单")',
            'button:has-text("确认下单")'
        ];
        
        let orderClicked = false;
        for (const selector of orderButtonSelectors) {
            try {
                const button = await page.$(selector);
                if (button) {
                    await button.click();
                    orderClicked = true;
                    console.log(`✅ 点击下单按钮: ${selector}`);
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        
        if (!orderClicked) {
            console.log('⚠️  未找到下单按钮，尝试查找其他按钮...');
            const buttons = await page.$$('button');
            for (let i = 0; i < buttons.length; i++) {
                const text = await buttons[i].textContent();
                if (text && (text.includes('买') || text.includes('卖') || text.includes('单') || text.includes('Order'))) {
                    await buttons[i].click();
                    orderClicked = true;
                    console.log(`✅ 点击下单按钮: button[${i}]`);
                    break;
                }
            }
        }
        
        // 截图5: 下单提交
        await page.screenshot({ 
            path: `${screenshotDir}/05-order-submitted.png`,
            fullPage: true 
        });
        
        // 6. 等待下单结果
        console.log('⏳ 步骤6: 等待下单结果...');
        await page.waitForTimeout(3000);
        
        // 检查是否有确认弹窗
        try {
            const confirmButton = await page.$('button:has-text("确认"), button:has-text("确定"), button:has-text("Confirm")');
            if (confirmButton) {
                console.log('🔔 发现确认弹窗，点击确认...');
                await confirmButton.click();
                await page.waitForTimeout(2000);
            }
        } catch (e) {
            // 没有确认弹窗，继续
        }
        
        // 截图6: 最终结果
        await page.screenshot({ 
            path: `${screenshotDir}/06-final-result.png`,
            fullPage: true 
        });
        
        // 获取最终状态
        const finalState = {
            url: page.url(),
            title: await page.title(),
            priceFilled: priceFilled,
            amountFilled: amountFilled,
            orderClicked: orderClicked,
            panelAnalysis: panelAnalysis
        };
        
        console.log('🎯 交易下单测试结果:');
        console.log('====================');
        console.log(`价格填写: ${priceFilled ? '✅ 成功' : '❌ 失败'}`);
        console.log(`数量填写: ${amountFilled ? '✅ 成功' : '❌ 失败'}`);
        console.log(`下单点击: ${orderClicked ? '✅ 成功' : '❌ 失败'}`);
        console.log(`当前URL: ${finalState.url}`);
        console.log(`页面标题: ${finalState.title}`);
        
        // 保存测试结果
        const testResult = {
            timestamp: new Date().toISOString(),
            testType: 'trading-order',
            finalState: finalState,
            testData: {
                price: '50000',
                amount: '0.01',
                action: 'buy'
            }
        };
        
        require('fs').writeFileSync(
            `${screenshotDir}/trading-order-test-result.json`,
            JSON.stringify(testResult, null, 2)
        );
        
        console.log(`📊 测试结果已保存到 ${screenshotDir}/trading-order-test-result.json`);
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        console.error('错误堆栈:', error.stack);
        
        // 错误截图
        try {
            await page.screenshot({ 
                path: '../screenshots/trading-order-test/error-screenshot.png',
                fullPage: true 
            });
        } catch (e) {
            console.log('截图失败:', e.message);
        }
        
    } finally {
        await browser.close();
        console.log('🔚 测试完成，浏览器已关闭');
    }
})();