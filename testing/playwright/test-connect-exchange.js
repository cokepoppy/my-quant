const { chromium } = require('playwright');

(async () => {
    console.log('🔗 连接交易所账户测试');
    
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
                if (msg.text().includes('连接') || msg.text().includes('成功') || msg.text().includes('失败') || msg.text().includes('交易所')) {
                    console.log(`📝 控制台日志: ${msg.text()}`);
                }
            }
        });
        
        // 监听网络请求
        page.on('request', request => {
            if (request.url().includes('/api/exchange') || request.url().includes('/api/account')) {
                console.log(`📡 API请求: ${request.method()} ${request.url()}`);
            }
        });
        
        page.on('response', response => {
            if (response.url().includes('/api/exchange') || response.url().includes('/api/account')) {
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
        const screenshotDir = '../screenshots/connect-exchange-test';
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
        
        // 3. 分析交易面板，查找已添加的交易所账户
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
        
        // 4. 点击连接按钮
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
        
        // 如果没有找到特定的连接按钮，尝试通用选择器
        if (!connectClicked) {
            const connectSelectors = [
                'button:has-text("连接")',
                'button:has-text("Connect")',
                'button:has-text("连接交易所")',
                'button:has-text("连接账户")',
                '.connect-btn',
                '.connect-exchange-btn'
            ];
            
            for (const selector of connectSelectors) {
                try {
                    console.log(`尝试选择器: ${selector}`);
                    await page.click(selector);
                    connectClicked = true;
                    console.log('✅ 成功点击连接按钮');
                    break;
                } catch (error) {
                    console.log(`选择器 ${selector} 失败: ${error.message}`);
                }
            }
        }
        
        await page.waitForTimeout(3000);
        
        // 截图4: 点击连接后
        await page.screenshot({ 
            path: `${screenshotDir}/04-connect-clicked.png`,
            fullPage: true 
        });
        
        // 5. 检查连接结果
        console.log('🎯 步骤5: 检查连接结果...');
        
        const connectionResult = await page.evaluate(() => {
            const result = {
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
            
            return result;
        });
        
        console.log('📊 连接结果:');
        console.log(`- 有成功消息: ${connectionResult.hasSuccessMessage}`);
        console.log(`- 有错误消息: ${connectionResult.hasErrorMessage}`);
        console.log(`- 有连接状态: ${connectionResult.hasConnectedStatus}`);
        
        // 6. 再次分析页面状态
        console.log('🔍 步骤6: 再次分析页面状态...');
        
        const finalAnalysis = await page.evaluate(() => {
            const result = {
                connectedAccounts: [],
                statusElements: [],
                buttons: []
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
        console.log(`- 按钮数量: ${finalAnalysis.buttons.length}`);
        
        finalAnalysis.statusElements.forEach((element, index) => {
            console.log(`状态元素 ${index + 1}: ${element.tagName} - "${element.text}"`);
        });
        
        finalAnalysis.buttons.forEach((button, index) => {
            if (button.text) {
                console.log(`按钮 ${index + 1}: "${button.text}" (${button.isVisible ? '可见' : '不可见'})`);
            }
        });
        
        await page.waitForTimeout(1000);
        
        // 截图5: 最终状态
        await page.screenshot({ 
            path: `${screenshotDir}/05-final-status.png`,
            fullPage: true 
        });
        
        // 保存测试结果
        const testResult = {
            timestamp: new Date().toISOString(),
            accountAnalysis: accountAnalysis,
            connectionResult: connectionResult,
            finalAnalysis: finalAnalysis,
            connectClicked: connectClicked
        };
        
        fs.writeFileSync(
            `${screenshotDir}/connect-exchange-test-result.json`,
            JSON.stringify(testResult, null, 2)
        );
        
        console.log('\\n🎉 连接交易所账户测试完成！');
        console.log('📁 截图保存在:', screenshotDir);
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        console.error('错误堆栈:', error.stack);
        
        // 错误截图
        try {
            await page.screenshot({ 
                path: '../screenshots/connect-exchange-test/error-screenshot.png',
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