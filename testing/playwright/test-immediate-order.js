const { chromium } = require('playwright');

(async () => {
    console.log('🚀 立即下单功能测试');
    
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
                if (msg.text().includes('下单') || msg.text().includes('交易') || msg.text().includes('订单') || 
                    msg.text().includes('成功') || msg.text().includes('失败') || msg.text().includes('error')) {
                    console.log(`📝 控制台日志: ${msg.text()}`);
                }
            }
        });
        
        // 监听网络请求
        page.on('request', request => {
            if (request.url().includes('/api/order') || request.url().includes('/api/trading') || request.url().includes('/api/exchange')) {
                console.log(`📡 API请求: ${request.method()} ${request.url()}`);
                if (request.postData()) {
                    console.log(`📡 请求数据: ${request.postData()}`);
                }
            }
        });
        
        page.on('response', response => {
            if (response.url().includes('/api/order') || response.url().includes('/api/trading') || response.url().includes('/api/exchange')) {
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
        const screenshotDir = '../screenshots/immediate-order-test';
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }
        
        // 截图1: 登录后的主页
        await page.screenshot({ 
            path: `${screenshotDir}/01-after-login.png`,
            fullPage: true 
        });
        
        // 2. 点击交易面板菜单
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
        
        await page.waitForTimeout(3000);
        
        // 截图2: 交易面板页面
        await page.screenshot({ 
            path: `${screenshotDir}/02-trading-panel.png`,
            fullPage: true 
        });
        
        // 3. 查找立即下单按钮
        console.log('🚀 步骤3: 查找立即下单按钮...');
        
        const orderButtons = await page.evaluate(() => {
            const buttons = [];
            document.querySelectorAll('button').forEach(button => {
                const text = button.textContent?.trim() || '';
                if (text.includes('立即下单') || text.includes('下单') || text.includes('买入') || text.includes('卖出')) {
                    buttons.push({
                        text: text,
                        className: button.className,
                        id: button.id,
                        isVisible: button.offsetParent !== null
                    });
                }
            });
            return buttons;
        });
        
        console.log(`📊 找到 ${orderButtons.length} 个下单相关按钮:`);
        orderButtons.forEach((button, index) => {
            console.log(`按钮 ${index + 1}: "${button.text}" (${button.isVisible ? '可见' : '不可见'})`);
        });
        
        // 4. 分析交易表单
        console.log('🔍 步骤4: 分析交易表单...');
        
        const formAnalysis = await page.evaluate(() => {
            const result = {
                hasForm: false,
                inputs: [],
                selects: [],
                tradingPairs: [],
                orderTypes: [],
                forms: []
            };
            
            // 查找表单
            const forms = document.querySelectorAll('form');
            result.hasForm = forms.length > 0;
            
            // 查找输入框
            document.querySelectorAll('input').forEach(input => {
                result.inputs.push({
                    type: input.type,
                    name: input.name,
                    placeholder: input.placeholder,
                    value: input.value,
                    id: input.id,
                    className: input.className
                });
            });
            
            // 查找下拉框
            document.querySelectorAll('select').forEach(select => {
                result.selects.push({
                    name: select.name,
                    id: select.id,
                    className: select.className,
                    options: Array.from(select.options).map(option => option.text)
                });
            });
            
            // 查找交易对信息
            document.querySelectorAll('*').forEach(element => {
                const text = element.textContent?.trim() || '';
                if (text.includes('/') && (text.includes('BTC') || text.includes('ETH') || text.includes('USDT'))) {
                    result.tradingPairs.push(text.substring(0, 50));
                }
            });
            
            // 查找订单类型
            document.querySelectorAll('*').forEach(element => {
                const text = element.textContent?.trim() || '';
                if (text.includes('限价') || text.includes('市价') || text.includes('limit') || text.includes('market')) {
                    result.orderTypes.push(text.substring(0, 50));
                }
            });
            
            return result;
        });
        
        console.log('📊 交易表单分析:');
        console.log(`- 有表单: ${formAnalysis.hasForm}`);
        console.log(`- 输入框数量: ${formAnalysis.inputs.length}`);
        console.log(`- 下拉框数量: ${formAnalysis.selects.length}`);
        console.log(`- 交易对: ${formAnalysis.tradingPairs.join(', ')}`);
        console.log(`- 订单类型: ${formAnalysis.orderTypes.join(', ')}`);
        
        // 显示输入框详情
        formAnalysis.inputs.forEach((input, index) => {
            console.log(`输入框 ${index + 1}: ${input.type} - ${input.placeholder} (${input.name})`);
        });
        
        await page.waitForTimeout(1000);
        
        // 截图3: 表单分析
        await page.screenshot({ 
            path: `${screenshotDir}/03-form-analysis.png`,
            fullPage: true 
        });
        
        // 5. 尝试点击立即下单按钮
        console.log('🚀 步骤5: 点击立即下单按钮...');
        
        let orderClicked = false;
        
        // 尝试点击立即下单按钮
        for (const button of orderButtons) {
            if (button.isVisible && button.text.includes('立即下单')) {
                try {
                    let selector;
                    if (button.id) {
                        selector = `#${button.id}`;
                    } else if (button.className) {
                        selector = `.${button.className.split(' ').join('.')}`;
                    } else {
                        selector = `button:has-text("${button.text}")`;
                    }
                    
                    console.log(`尝试点击立即下单按钮`);
                    await page.click(selector);
                    orderClicked = true;
                    console.log('✅ 成功点击立即下单按钮');
                    break;
                } catch (error) {
                    console.log(`点击按钮失败: ${error.message}`);
                }
            }
        }
        
        // 如果没有找到立即下单按钮，尝试通用选择器
        if (!orderClicked) {
            const orderSelectors = [
                'button:has-text("立即下单")',
                'button:has-text("下单")',
                'button:has-text("买入")',
                'button:has-text("卖出")',
                '.order-btn',
                '.place-order-btn'
            ];
            
            for (const selector of orderSelectors) {
                try {
                    console.log(`尝试选择器: ${selector}`);
                    await page.click(selector);
                    orderClicked = true;
                    console.log('✅ 成功点击下单按钮');
                    break;
                } catch (error) {
                    console.log(`选择器 ${selector} 失败: ${error.message}`);
                }
            }
        }
        
        await page.waitForTimeout(3000);
        
        // 截图4: 点击下单按钮后
        await page.screenshot({ 
            path: `${screenshotDir}/04-order-clicked.png`,
            fullPage: true 
        });
        
        // 6. 检查是否有下单对话框
        console.log('🔍 步骤6: 检查下单对话框...');
        
        const dialogAnalysis = await page.evaluate(() => {
            const result = {
                hasDialog: false,
                hasOrderForm: false,
                inputs: [],
                buttons: [],
                dialogContent: ''
            };
            
            // 查找模态框
            const modals = document.querySelectorAll('.modal, .dialog, .popup, [role="dialog"], .el-dialog, .v-dialog');
            result.hasDialog = modals.length > 0;
            
            if (result.hasDialog) {
                // 在模态框中查找表单
                const modal = modals[0];
                result.dialogContent = modal.textContent?.substring(0, 500) || '';
                
                // 查找模态框中的输入框
                modal.querySelectorAll('input').forEach(input => {
                    result.inputs.push({
                        type: input.type,
                        placeholder: input.placeholder,
                        name: input.name,
                        value: input.value
                    });
                });
                
                // 查找模态框中的按钮
                modal.querySelectorAll('button').forEach(button => {
                    result.buttons.push({
                        text: button.textContent?.trim() || '',
                        type: button.type
                    });
                });
                
                // 查找表单
                const forms = modal.querySelectorAll('form');
                result.hasOrderForm = forms.length > 0;
            }
            
            return result;
        });
        
        console.log('📊 下单对话框分析:');
        console.log(`- 有对话框: ${dialogAnalysis.hasDialog}`);
        console.log(`- 有下单表单: ${dialogAnalysis.hasOrderForm}`);
        console.log(`- 输入框数量: ${dialogAnalysis.inputs.length}`);
        console.log(`- 按钮数量: ${dialogAnalysis.buttons.length}`);
        
        // 显示输入框详情
        dialogAnalysis.inputs.forEach((input, index) => {
            console.log(`输入框 ${index + 1}: ${input.type} - ${input.placeholder} (${input.name})`);
        });
        
        // 显示按钮详情
        dialogAnalysis.buttons.forEach((button, index) => {
            console.log(`按钮 ${index + 1}: "${button.text}" (${button.type})`);
        });
        
        // 7. 如果有下单表单，填写并提交
        if (dialogAnalysis.hasOrderForm && dialogAnalysis.inputs.length > 0) {
            console.log('📝 步骤7: 填写下单表单...');
            
            let priceFilled = false;
            let amountFilled = false;
            
            // 填写价格
            for (const input of dialogAnalysis.inputs) {
                if (input.placeholder?.includes('价格') || input.name?.includes('price')) {
                    try {
                        await page.fill(`input[placeholder="${input.placeholder}"], input[name="${input.name}"]`, '50000');
                        priceFilled = true;
                        console.log('✅ 价格填写完成');
                        break;
                    } catch (error) {
                        console.log(`价格填写失败: ${error.message}`);
                    }
                }
            }
            
            // 填写数量
            for (const input of dialogAnalysis.inputs) {
                if (input.placeholder?.includes('数量') || input.name?.includes('amount') || input.placeholder?.includes('数量')) {
                    try {
                        await page.fill(`input[placeholder="${input.placeholder}"], input[name="${input.name}"]`, '0.01');
                        amountFilled = true;
                        console.log('✅ 数量填写完成');
                        break;
                    } catch (error) {
                        console.log(`数量填写失败: ${error.message}`);
                    }
                }
            }
            
            await page.waitForTimeout(1000);
            
            // 截图5: 表单填写完成
            await page.screenshot({ 
                path: `${screenshotDir}/05-order-form-filled.png`,
                fullPage: true 
            });
            
            // 8. 提交订单
            console.log('🚀 步骤8: 提交订单...');
            
            let submitClicked = false;
            
            // 查找提交按钮
            for (const button of dialogAnalysis.buttons) {
                if (button.text.includes('下单') || button.text.includes('买入') || button.text.includes('卖出') || button.type === 'submit') {
                    try {
                        await page.click(`button:has-text("${button.text}")`);
                        submitClicked = true;
                        console.log(`✅ 点击提交按钮: ${button.text}`);
                        break;
                    } catch (error) {
                        console.log(`点击提交按钮失败: ${error.message}`);
                    }
                }
            }
            
            if (submitClicked) {
                await page.waitForTimeout(3000);
                
                // 截图6: 提交结果
                await page.screenshot({ 
                    path: `${screenshotDir}/06-order-submitted.png`,
                    fullPage: true 
                });
                
                // 检查提交结果
                const submitResult = await page.evaluate(() => {
                    return {
                        hasSuccessMessage: document.body.textContent.includes('成功') || 
                                         document.body.textContent.includes('success') ||
                                         document.body.textContent.includes('下单成功') ||
                                         document.body.textContent.includes('已提交'),
                        hasErrorMessage: document.body.textContent.includes('错误') || 
                                        document.body.textContent.includes('error') ||
                                        document.body.textContent.includes('失败') ||
                                        document.body.textContent.includes('下单失败'),
                        pageContent: document.body.textContent.substring(0, 1000)
                    };
                });
                
                console.log('📊 提交结果:');
                console.log(`- 有成功消息: ${submitResult.hasSuccessMessage}`);
                console.log(`- 有错误消息: ${submitResult.hasErrorMessage}`);
            }
        }
        
        // 保存测试结果
        const testResult = {
            timestamp: new Date().toISOString(),
            orderButtons: orderButtons,
            formAnalysis: formAnalysis,
            dialogAnalysis: dialogAnalysis,
            orderClicked: orderClicked
        };
        
        fs.writeFileSync(
            `${screenshotDir}/immediate-order-test-result.json`,
            JSON.stringify(testResult, null, 2)
        );
        
        console.log('\\n🎉 立即下单功能测试完成！');
        console.log('📁 截图保存在:', screenshotDir);
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        console.error('错误堆栈:', error.stack);
        
        // 错误截图
        try {
            await page.screenshot({ 
                path: '../screenshots/immediate-order-test/error-screenshot.png',
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