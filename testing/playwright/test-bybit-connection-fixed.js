const { chromium } = require('playwright');

(async () => {
    console.log('🔗 Bybit连接功能测试（修复后）');
    
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
                if (msg.text().includes('连接') || msg.text().includes('成功') || msg.text().includes('失败') || 
                    msg.text().includes('Bybit') || msg.text().includes('测试') || msg.text().includes('proxy')) {
                    console.log(`📝 控制台日志: ${msg.text()}`);
                }
            }
        });
        
        // 监听网络请求
        page.on('request', request => {
            if (request.url().includes('/api/exchange') || request.url().includes('/api/account') || 
                request.url().includes('/api/trading')) {
                console.log(`📡 API请求: ${request.method()} ${request.url()}`);
                if (request.postData()) {
                    console.log(`📡 请求数据: ${request.postData()}`);
                }
            }
        });
        
        page.on('response', response => {
            if (response.url().includes('/api/exchange') || response.url().includes('/api/account') || 
                response.url().includes('/api/trading')) {
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
        const screenshotDir = '../screenshots/bybit-connection-test-fixed';
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
        
        // 3. 查找已添加的交易所账户
        console.log('🔍 步骤3: 查找已添加的交易所账户...');
        
        const accountAnalysis = await page.evaluate(() => {
            const result = {
                hasExchangeAccounts: false,
                accounts: [],
                connectButtons: [],
                accountElements: [],
                pageContent: ''
            };
            
            // 查找包含交易所账户信息的元素
            const accountElements = document.querySelectorAll('*');
            accountElements.forEach(element => {
                const text = element.textContent?.trim() || '';
                if (text.includes('交易所') || text.includes('Exchange') || text.includes('账户') || text.includes('Account')) {
                    result.accountElements.push({
                        tagName: element.tagName,
                        text: text.substring(0, 100),
                        className: element.className,
                        id: element.id,
                        isVisible: element.offsetParent !== null
                    });
                }
            });
            
            // 查找连接按钮
            document.querySelectorAll('button').forEach(button => {
                const buttonText = button.textContent?.trim() || '';
                if (buttonText.includes('连接') || buttonText.includes('Connect')) {
                    result.connectButtons.push({
                        text: buttonText,
                        className: button.className,
                        id: button.id,
                        isVisible: button.offsetParent !== null
                    });
                }
            });
            
            // 检查是否有交易所账户
            result.hasExchangeAccounts = result.accountElements.length > 0;
            result.pageContent = document.body.textContent.substring(0, 1000);
            
            return result;
        });
        
        console.log('📊 交易所账户分析:');
        console.log(`- 有交易所账户: ${accountAnalysis.hasExchangeAccounts}`);
        console.log(`- 账户相关元素: ${accountAnalysis.accountElements.length}`);
        console.log(`- 连接按钮数量: ${accountAnalysis.connectButtons.length}`);
        
        // 显示账户元素
        accountAnalysis.accountElements.forEach((element, index) => {
            console.log(`账户元素 ${index + 1}: ${element.tagName} - "${element.text}" (${element.isVisible ? '可见' : '不可见'})`);
        });
        
        // 显示连接按钮
        accountAnalysis.connectButtons.forEach((button, index) => {
            console.log(`连接按钮 ${index + 1}: "${button.text}" (${button.isVisible ? '可见' : '不可见'})`);
        });
        
        await page.waitForTimeout(1000);
        
        // 截图3: 账户分析
        await page.screenshot({ 
            path: `${screenshotDir}/03-account-analysis.png`,
            fullPage: true 
        });
        
        // 4. 如果有连接按钮，点击连接
        let connectionResult = null;
        
        if (accountAnalysis.connectButtons.length > 0) {
            console.log('🔗 步骤4: 点击连接按钮...');
            
            let connectClicked = false;
            
            // 尝试点击连接按钮
            for (const button of accountAnalysis.connectButtons) {
                if (button.isVisible) {
                    try {
                        let selector;
                        if (button.id) {
                            selector = `#${button.id}`;
                        } else if (button.className) {
                            selector = `.${button.className.split(' ').join('.')}`;
                        } else {
                            selector = `button:has-text("${button.text}")`;
                        }
                        
                        console.log(`尝试点击连接按钮: "${button.text}"`);
                        await page.click(selector);
                        connectClicked = true;
                        console.log('✅ 成功点击连接按钮');
                        break;
                    } catch (error) {
                        console.log(`点击按钮失败: ${error.message}`);
                    }
                }
            }
            
            if (connectClicked) {
                await page.waitForTimeout(5000); // 等待连接结果
                
                // 截图4: 连接过程
                await page.screenshot({ 
                    path: `${screenshotDir}/04-connection-process.png`,
                    fullPage: true 
                });
                
                // 检查连接结果
                connectionResult = await page.evaluate(() => {
                    return {
                        hasSuccessMessage: document.body.textContent.includes('成功') || 
                                         document.body.textContent.includes('success') ||
                                         document.body.textContent.includes('已连接') ||
                                         document.body.textContent.includes('连接成功'),
                        hasErrorMessage: document.body.textContent.includes('错误') || 
                                        document.body.textContent.includes('error') ||
                                        document.body.textContent.includes('失败') ||
                                        document.body.textContent.includes('连接失败'),
                        hasConnectedStatus: document.body.textContent.includes('已连接') || 
                                           document.body.textContent.includes('Connected') ||
                                           document.body.textContent.includes('在线') ||
                                           document.body.textContent.includes('Online'),
                        pageContent: document.body.textContent.substring(0, 1000)
                    };
                });
                
                console.log('📊 连接结果:');
                console.log(`- 有成功消息: ${connectionResult.hasSuccessMessage}`);
                console.log(`- 有错误消息: ${connectionResult.hasErrorMessage}`);
                console.log(`- 有连接状态: ${connectionResult.hasConnectedStatus}`);
            }
        }
        
        // 5. 如果没有现有账户，测试添加新账户
        if (!accountAnalysis.hasExchangeAccounts) {
            console.log('➕ 步骤5: 测试添加新账户...');
            
            // 查找添加交易所按钮
            const addExchangeSelectors = [
                'button:has-text("添加交易所")',
                'button:has-text("添加账户")',
                'button:has-text("连接交易所")',
                'button:has-text("新增交易所")',
                '.add-exchange-btn',
                '.add-account-btn'
            ];
            
            let addClicked = false;
            
            for (const selector of addExchangeSelectors) {
                try {
                    console.log(`尝试选择器: ${selector}`);
                    await page.click(selector);
                    addClicked = true;
                    console.log('✅ 成功点击添加交易所按钮');
                    break;
                } catch (error) {
                    console.log(`选择器 ${selector} 失败: ${error.message}`);
                }
            }
            
            if (addClicked) {
                await page.waitForTimeout(3000);
                
                // 截图5: 添加账户对话框
                await page.screenshot({ 
                    path: `${screenshotDir}/05-add-account-dialog.png`,
                    fullPage: true 
                });
                
                // 分析表单
                const formAnalysis = await page.evaluate(() => {
                    const result = {
                        hasDialog: false,
                        hasForm: false,
                        inputs: [],
                        buttons: [],
                        formContent: ''
                    };
                    
                    // 查找模态框
                    const modals = document.querySelectorAll('.modal, .dialog, .popup, [role="dialog"], .el-dialog, .v-dialog');
                    result.modalExists = modals.length > 0;
                    
                    if (result.modalExists) {
                        const modal = modals[0];
                        result.formContent = modal.textContent?.substring(0, 500) || '';
                        
                        // 查找输入框
                        modal.querySelectorAll('input').forEach(input => {
                            result.inputs.push({
                                type: input.type,
                                placeholder: input.placeholder,
                                name: input.name,
                                value: input.value
                            });
                        });
                        
                        // 查找按钮
                        modal.querySelectorAll('button').forEach(button => {
                            result.buttons.push({
                                text: button.textContent?.trim() || '',
                                type: button.type
                            });
                        });
                    }
                    
                    return result;
                });
                
                console.log('📊 表单分析:');
                console.log(`- 有模态框: ${formAnalysis.modalExists}`);
                console.log(`- 输入框数量: ${formAnalysis.inputs.length}`);
                console.log(`- 按钮数量: ${formAnalysis.buttons.length}`);
                
                // 如果有表单，填写并测试
                if (formAnalysis.inputs.length > 0) {
                    console.log('📝 步骤6: 填写账户信息...');
                    
                    // 使用测试凭据
                    const testCredentials = {
                        account: 'test@gmail.com',
                        apiKey: process.env.TEST_API_KEY || 'test_api_key_placeholder',
                        apiSecret: process.env.TEST_API_SECRET || 'test_api_secret_placeholder'
                    };
                    
                    for (const input of formAnalysis.inputs) {
                        if (input.placeholder?.includes('账户') || input.placeholder?.includes('邮箱')) {
                            await page.fill(`input[placeholder="${input.placeholder}"]`, testCredentials.account);
                        } else if (input.placeholder?.includes('API Key') || input.placeholder?.includes('密钥')) {
                            await page.fill(`input[placeholder="${input.placeholder}"]`, testCredentials.apiKey);
                        } else if (input.placeholder?.includes('API Secret') || input.placeholder?.includes('Secret')) {
                            await page.fill(`input[placeholder="${input.placeholder}"]`, testCredentials.apiSecret);
                        }
                    }
                    
                    await page.waitForTimeout(1000);
                    
                    // 截图6: 表单填写完成
                    await page.screenshot({ 
                        path: `${screenshotDir}/06-form-filled.png`,
                        fullPage: true 
                    });
                    
                    // 测试连接
                    console.log('🔧 步骤7: 测试连接...');
                    
                    const testButton = formAnalysis.buttons.find(btn => 
                        btn.text.includes('测试') || btn.text.includes('Test')
                    );
                    
                    if (testButton) {
                        await page.click(`button:has-text("${testButton.text}")`);
                        await page.waitForTimeout(3000);
                        
                        // 截图7: 测试连接结果
                        await page.screenshot({ 
                            path: `${screenshotDir}/07-test-connection-result.png`,
                            fullPage: true 
                        });
                    }
                }
            }
        }
        
        // 6. 最终状态分析
        console.log('🎯 步骤8: 最终状态分析...');
        
        const finalAnalysis = await page.evaluate(() => {
            const result = {
                connectedAccounts: [],
                statusElements: [],
                buttons: [],
                errorMessages: [],
                successMessages: []
            };
            
            // 查找状态相关元素
            document.querySelectorAll('*').forEach(element => {
                const text = element.textContent?.trim() || '';
                if (text.includes('已连接') || text.includes('Connected') || text.includes('在线') || text.includes('Online')) {
                    result.statusElements.push({
                        tagName: element.tagName,
                        text: text.substring(0, 100),
                        isVisible: element.offsetParent !== null
                    });
                }
                if (text.includes('成功') || text.includes('success')) {
                    result.successMessages.push(text.substring(0, 100));
                }
                if (text.includes('错误') || text.includes('error') || text.includes('失败')) {
                    result.errorMessages.push(text.substring(0, 100));
                }
            });
            
            // 查找所有按钮
            document.querySelectorAll('button').forEach(button => {
                result.buttons.push({
                    text: button.textContent?.trim() || '',
                    isVisible: button.offsetParent !== null
                });
            });
            
            return result;
        });
        
        console.log('📊 最终状态分析:');
        console.log(`- 状态元素数量: ${finalAnalysis.statusElements.length}`);
        console.log(`- 成功消息数量: ${finalAnalysis.successMessages.length}`);
        console.log(`- 错误消息数量: ${finalAnalysis.errorMessages.length}`);
        console.log(`- 按钮数量: ${finalAnalysis.buttons.length}`);
        
        finalAnalysis.statusElements.forEach((element, index) => {
            console.log(`状态元素 ${index + 1}: ${element.tagName} - "${element.text}"`);
        });
        
        finalAnalysis.successMessages.forEach((msg, index) => {
            console.log(`成功消息 ${index + 1}: "${msg}"`);
        });
        
        finalAnalysis.errorMessages.forEach((msg, index) => {
            console.log(`错误消息 ${index + 1}: "${msg}"`);
        });
        
        await page.waitForTimeout(1000);
        
        // 截图8: 最终状态
        await page.screenshot({ 
            path: `${screenshotDir}/08-final-status.png`,
            fullPage: true 
        });
        
        // 保存测试结果
        const testResult = {
            timestamp: new Date().toISOString(),
            accountAnalysis: accountAnalysis,
            connectionResult: connectionResult,
            finalAnalysis: finalAnalysis,
            summary: {
                hasAccounts: accountAnalysis.hasExchangeAccounts,
                hasConnectedAccounts: finalAnalysis.statusElements.length > 0,
                hasSuccessMessages: finalAnalysis.successMessages.length > 0,
                hasErrorMessages: finalAnalysis.errorMessages.length > 0,
                proxyConfigured: process.env.http_proxy || process.env.https_proxy
            }
        };
        
        fs.writeFileSync(
            `${screenshotDir}/bybit-connection-test-result.json`,
            JSON.stringify(testResult, null, 2)
        );
        
        console.log('\n🎉 Bybit连接功能测试完成！');
        console.log('📁 截图保存在:', screenshotDir);
        console.log('📊 测试结果总结:');
        console.log(`  - 有交易所账户: ${testResult.summary.hasAccounts}`);
        console.log(`  - 有连接状态: ${testResult.summary.hasConnectedAccounts}`);
        console.log(`  - 有成功消息: ${testResult.summary.hasSuccessMessages}`);
        console.log(`  - 有错误消息: ${testResult.summary.hasErrorMessages}`);
        console.log(`  - 代理配置: ${testResult.summary.proxyConfigured}`);
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        console.error('错误堆栈:', error.stack);
        
        // 错误截图
        try {
            await page.screenshot({ 
                path: '../screenshots/bybit-connection-test-fixed/error-screenshot.png',
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