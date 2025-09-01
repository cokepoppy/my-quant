const { chromium } = require('playwright');

(async () => {
    console.log('🏠 交易面板真实交易测试');
    
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
                if (msg.text().includes('交易') || msg.text().includes('Trading') || msg.text().includes('click') || msg.text().includes('成功')) {
                    console.log(`📝 控制台日志: ${msg.text()}`);
                }
            }
        });
        
        // 监听网络请求
        page.on('request', request => {
            if (request.url().includes('/api/trading') || request.url().includes('/api/order') || request.url().includes('/api/exchange')) {
                console.log(`📡 API请求: ${request.method()} ${request.url()}`);
            }
        });
        
        page.on('response', response => {
            if (response.url().includes('/api/trading') || response.url().includes('/api/order') || response.url().includes('/api/exchange')) {
                console.log(`📡 API响应: ${response.status()} ${response.url()}`);
            }
        });
        
        // 1. 首先登录
        console.log('🔐 步骤1: 登录系统...');
        await page.goto('http://localhost:3001/login', { 
            waitUntil: 'networkidle',
            timeout: 15000 
        });
        
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
        
        console.log('✅ 登录成功');
        
        // 创建截图目录
        const fs = require('fs');
        const screenshotDir = '../screenshots/real-trading-test';
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }
        
        // 截图1: 登录后的主页
        await page.screenshot({ 
            path: `${screenshotDir}/01-after-login.png`,
            fullPage: true 
        });
        
        // 2. 查找并点击交易面板
        console.log('🏠 步骤2: 点击交易面板菜单...');
        
        // 等待侧边栏加载
        await page.waitForSelector('.sidebar-nav, .nav-items, .nav-item', { timeout: 10000 });
        
        // 查找交易面板菜单项
        const tradingPanelSelectors = [
            '.nav-item:has-text("交易面板")',
            '.nav-items:has-text("交易面板") .nav-item',
            'text="交易面板"',
            '.sidebar-nav >> text="交易面板"'
        ];
        
        let tradingClicked = false;
        
        for (const selector of tradingPanelSelectors) {
            try {
                console.log(`尝试选择器: ${selector}`);
                const element = await page.$(selector);
                if (element) {
                    await element.click();
                    tradingClicked = true;
                    console.log('✅ 成功点击交易面板');
                    break;
                }
            } catch (error) {
                console.log(`选择器 ${selector} 失败: ${error.message}`);
            }
        }
        
        // 如果标准选择器失败，尝试查找包含"交易面板"的元素
        if (!tradingClicked) {
            console.log('尝试查找包含"交易面板"的元素...');
            const tradingElements = await page.$$eval('*', elements => {
                return elements
                    .filter(el => el.textContent && el.textContent.includes('交易面板'))
                    .map(el => ({
                        tagName: el.tagName,
                        text: el.textContent?.trim(),
                        className: el.className,
                        id: el.id,
                        isVisible: el.offsetParent !== null
                    }));
            });
            
            console.log(`找到 ${tradingElements.length} 个包含"交易面板"的元素`);
            
            for (const element of tradingElements) {
                if (element.isVisible) {
                    try {
                        const selector = element.id ? `#${element.id}` : 
                                        element.className ? `.${element.className.split(' ').join('.')}` :
                                        `xpath=.//*[contains(text(), "交易面板")]`;
                        
                        await page.click(selector);
                        tradingClicked = true;
                        console.log('✅ 成功点击交易面板元素');
                        break;
                    } catch (error) {
                        console.log(`点击元素失败: ${error.message}`);
                    }
                }
            }
        }
        
        // 等待页面跳转
        await page.waitForTimeout(3000);
        
        // 截图2: 点击交易面板后
        await page.screenshot({ 
            path: `${screenshotDir}/02-trading-panel-clicked.png`,
            fullPage: true 
        });
        
        // 3. 分析交易面板页面
        console.log('🔍 步骤3: 分析交易面板页面...');
        
        const tradingAnalysis = await page.evaluate(() => {
            const result = {
                url: window.location.href,
                title: document.title,
                hasTradingContent: document.body.textContent.includes('交易') || 
                                  document.body.textContent.includes('Trading') ||
                                  document.body.textContent.includes('买入') ||
                                  document.body.textContent.includes('卖出') ||
                                  document.body.textContent.includes('下单'),
                forms: document.querySelectorAll('form').length,
                inputs: document.querySelectorAll('input').length,
                buttons: document.querySelectorAll('button').length,
                selects: document.querySelectorAll('select').length,
                tradingKeywords: [],
                formDetails: []
            };
            
            // 查找交易关键词
            const keywords = ['买入', '卖出', '下单', '交易', '价格', '数量', 'Buy', 'Sell', 'Order', 'Price', 'Amount'];
            keywords.forEach(keyword => {
                if (document.body.textContent.includes(keyword)) {
                    result.tradingKeywords.push(keyword);
                }
            });
            
            // 分析表单详情
            document.querySelectorAll('form').forEach((form, index) => {
                const formInfo = {
                    index: index,
                    action: form.action,
                    method: form.method,
                    inputs: [],
                    buttons: []
                };
                
                form.querySelectorAll('input').forEach(input => {
                    formInfo.inputs.push({
                        type: input.type,
                        name: input.name,
                        placeholder: input.placeholder,
                        value: input.value
                    });
                });
                
                form.querySelectorAll('button').forEach(button => {
                    formInfo.buttons.push({
                        text: button.textContent?.trim(),
                        type: button.type
                    });
                });
                
                result.formDetails.push(formInfo);
            });
            
            return result;
        });
        
        console.log('📊 交易面板分析:');
        console.log(`- URL: ${tradingAnalysis.url}`);
        console.log(`- 标题: ${tradingAnalysis.title}`);
        console.log(`- 有交易内容: ${tradingAnalysis.hasTradingContent}`);
        console.log(`- 表单数量: ${tradingAnalysis.forms}`);
        console.log(`- 输入框数量: ${tradingAnalysis.inputs}`);
        console.log(`- 按钮数量: ${tradingAnalysis.buttons}`);
        console.log(`- 下拉框数量: ${tradingAnalysis.selects}`);
        console.log(`- 交易关键词: ${tradingAnalysis.tradingKeywords.join(', ')}`);
        
        // 显示表单详情
        tradingAnalysis.formDetails.forEach((form, index) => {
            console.log(`\n表单 ${index + 1}:`);
            console.log(`- 输入框: ${form.inputs.length}`);
            form.inputs.forEach(input => {
                console.log(`  ${input.type}: ${input.name} (${input.placeholder})`);
            });
            console.log(`- 按钮: ${form.buttons.length}`);
            form.buttons.forEach(button => {
                console.log(`  ${button.text} (${button.type})`);
            });
        });
        
        // 截图3: 交易面板分析
        await page.screenshot({ 
            path: `${screenshotDir}/03-trading-analysis.png`,
            fullPage: true 
        });
        
        // 4. 如果有交易功能，进行交易测试
        if (tradingAnalysis.hasTradingContent && tradingAnalysis.forms > 0) {
            console.log('\n📝 步骤4: 进行交易测试...');
            
            // 填写第一个表单
            const form = tradingAnalysis.formDetails[0];
            
            // 填写价格
            let priceFilled = false;
            for (const input of form.inputs) {
                if (input.name?.includes('price') || input.placeholder?.includes('价格') || input.placeholder?.includes('Price')) {
                    try {
                        await page.fill(`input[name="${input.name}"], input[placeholder="${input.placeholder}"]`, '50000');
                        priceFilled = true;
                        console.log('✅ 价格填写完成');
                        break;
                    } catch (error) {
                        console.log(`价格填写失败: ${error.message}`);
                    }
                }
            }
            
            // 如果没有找到价格字段，填写第一个数字输入框
            if (!priceFilled) {
                for (const input of form.inputs) {
                    if (input.type === 'number') {
                        try {
                            await page.fill(`input[name="${input.name}"], input[placeholder="${input.placeholder}"]`, '50000');
                            priceFilled = true;
                            console.log('✅ 价格填写完成 (使用第一个数字输入框)');
                            break;
                        } catch (error) {
                            console.log(`价格填写失败: ${error.message}`);
                        }
                    }
                }
            }
            
            // 填写数量
            let amountFilled = false;
            for (const input of form.inputs) {
                if (input.name?.includes('amount') || input.name?.includes('quantity') || input.placeholder?.includes('数量') || input.placeholder?.includes('Amount')) {
                    try {
                        await page.fill(`input[name="${input.name}"], input[placeholder="${input.placeholder}"]`, '0.01');
                        amountFilled = true;
                        console.log('✅ 数量填写完成');
                        break;
                    } catch (error) {
                        console.log(`数量填写失败: ${error.message}`);
                    }
                }
            }
            
            // 如果没有找到数量字段，填写第二个数字输入框
            if (!amountFilled) {
                const numberInputs = form.inputs.filter(input => input.type === 'number');
                if (numberInputs.length > 1) {
                    try {
                        const secondInput = numberInputs[1];
                        await page.fill(`input[name="${secondInput.name}"], input[placeholder="${secondInput.placeholder}"]`, '0.01');
                        amountFilled = true;
                        console.log('✅ 数量填写完成 (使用第二个数字输入框)');
                    } catch (error) {
                        console.log(`数量填写失败: ${error.message}`);
                    }
                }
            }
            
            await page.waitForTimeout(1000);
            
            // 截图4: 表单填写完成
            await page.screenshot({ 
                path: `${screenshotDir}/04-form-filled.png`,
                fullPage: true 
            });
            
            // 点击下单按钮
            let orderClicked = false;
            for (const button of form.buttons) {
                if (button.text?.includes('买入') || button.text?.includes('卖出') || button.text?.includes('下单') || button.text?.includes('提交') || button.type === 'submit') {
                    try {
                        await page.click(`button:has-text("${button.text}"), button[type="${button.type}"]`);
                        orderClicked = true;
                        console.log(`✅ 点击下单按钮: ${button.text}`);
                        break;
                    } catch (error) {
                        console.log(`点击按钮失败: ${error.message}`);
                    }
                }
            }
            
            // 如果没有找到合适的按钮，点击第一个按钮
            if (!orderClicked && form.buttons.length > 0) {
                try {
                    const firstButton = form.buttons[0];
                    await page.click('button');
                    orderClicked = true;
                    console.log(`✅ 点击第一个按钮: ${firstButton.text}`);
                } catch (error) {
                    console.log(`点击第一个按钮失败: ${error.message}`);
                }
            }
            
            await page.waitForTimeout(3000);
            
            // 截图5: 下单结果
            await page.screenshot({ 
                path: `${screenshotDir}/05-order-result.png`,
                fullPage: true 
            });
            
            // 检查下单结果
            const orderResult = await page.evaluate(() => {
                return {
                    hasSuccessMessage: document.body.textContent.includes('成功') || 
                                     document.body.textContent.includes('success') ||
                                     document.body.textContent.includes('已提交'),
                    hasErrorMessage: document.body.textContent.includes('错误') || 
                                    document.body.textContent.includes('error') ||
                                    document.body.textContent.includes('失败'),
                    pageContent: document.body.textContent.substring(0, 1000)
                };
            });
            
            console.log('🎯 下单结果:');
            console.log(`- 有成功消息: ${orderResult.hasSuccessMessage}`);
            console.log(`- 有错误消息: ${orderResult.hasErrorMessage}`);
            
            // 保存测试结果
            const testResult = {
                timestamp: new Date().toISOString(),
                tradingAnalysis: tradingAnalysis,
                formFillResult: {
                    priceFilled: priceFilled,
                    amountFilled: amountFilled,
                    orderClicked: orderClicked
                },
                orderResult: orderResult,
                testData: {
                    price: '50000',
                    amount: '0.01',
                    action: 'buy'
                }
            };
            
            require('fs').writeFileSync(
                `${screenshotDir}/real-trading-test-result.json`,
                JSON.stringify(testResult, null, 2)
            );
            
        } else {
            console.log('❌ 未找到交易功能，无法进行交易测试');
        }
        
        console.log('\n🎉 交易面板测试完成！');
        console.log('📁 截图保存在:', screenshotDir);
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        console.error('错误堆栈:', error.stack);
        
        // 错误截图
        try {
            await page.screenshot({ 
                path: '../screenshots/real-trading-test/error-screenshot.png',
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