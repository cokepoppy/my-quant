const { chromium } = require('playwright');

(async () => {
    console.log('🏠 添加交易所账户测试');
    
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
                if (msg.text().includes('交易') || msg.text().includes('连接') || msg.text().includes('成功') || msg.text().includes('失败')) {
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
        const screenshotDir = '../screenshots/add-exchange-test';
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
        
        // 3. 查找并点击添加交易所按钮
        console.log('🔧 步骤3: 查找添加交易所按钮...');
        
        const addExchangeSelectors = [
            'button:has-text("添加交易所")',
            'button:has-text("添加账户")',
            'button:has-text("连接交易所")',
            'button:has-text("新增交易所")',
            '.add-exchange-btn',
            '.add-account-btn',
            'text="添加交易所"',
            'text="添加账户"'
        ];
        
        let addExchangeClicked = false;
        
        for (const selector of addExchangeSelectors) {
            try {
                console.log(`尝试选择器: ${selector}`);
                const element = await page.$(selector);
                if (element) {
                    await element.click();
                    addExchangeClicked = true;
                    console.log('✅ 成功点击添加交易所按钮');
                    break;
                }
            } catch (error) {
                console.log(`选择器 ${selector} 失败: ${error.message}`);
            }
        }
        
        // 如果标准选择器失败，尝试查找包含"添加"和"交易所"的元素
        if (!addExchangeClicked) {
            console.log('尝试查找包含"添加"和"交易所"的元素...');
            const addElements = await page.$$eval('*', elements => {
                return elements
                    .filter(el => el.textContent && 
                           (el.textContent.includes('添加') && el.textContent.includes('交易所')) ||
                           (el.textContent.includes('添加') && el.textContent.includes('账户')))
                    .map(el => ({
                        tagName: el.tagName,
                        text: el.textContent?.trim(),
                        className: el.className,
                        id: el.id,
                        isVisible: el.offsetParent !== null
                    }));
            });
            
            console.log(`找到 ${addElements.length} 个相关元素`);
            
            for (const element of addElements) {
                if (element.isVisible) {
                    try {
                        const selector = element.id ? `#${element.id}` : 
                                        element.className ? `.${element.className.split(' ').join('.')}` :
                                        `xpath=.//*[contains(text(), "${element.text}")]`;
                        
                        await page.click(selector);
                        addExchangeClicked = true;
                        console.log(`✅ 成功点击: ${element.text}`);
                        break;
                    } catch (error) {
                        console.log(`点击元素失败: ${error.message}`);
                    }
                }
            }
        }
        
        await page.waitForTimeout(2000);
        
        // 截图3: 点击添加交易所后的页面
        await page.screenshot({ 
            path: `${screenshotDir}/03-add-exchange-clicked.png`,
            fullPage: true 
        });
        
        // 4. 分析对话框或表单
        console.log('🔍 步骤4: 分析对话框或表单...');
        
        const formAnalysis = await page.evaluate(() => {
            const result = {
                hasDialog: false,
                hasForm: false,
                inputs: [],
                buttons: [],
                selects: [],
                formContent: '',
                modalExists: false
            };
            
            // 查找模态框
            const modals = document.querySelectorAll('.modal, .dialog, .popup, [role="dialog"], .el-dialog, .v-dialog');
            result.modalExists = modals.length > 0;
            
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
            
            // 查找按钮
            document.querySelectorAll('button').forEach(button => {
                result.buttons.push({
                    text: button.textContent?.trim(),
                    type: button.type,
                    id: button.id,
                    className: button.className
                });
            });
            
            // 查找下拉框
            document.querySelectorAll('select').forEach(select => {
                result.selects.push({
                    name: select.name,
                    id: select.id,
                    className: select.className
                });
            });
            
            // 获取表单内容
            if (result.modalExists) {
                result.formContent = modals[0].textContent?.substring(0, 500) || '';
            } else if (result.hasForm) {
                result.formContent = forms[0].textContent?.substring(0, 500) || '';
            }
            
            return result;
        });
        
        console.log('📊 表单分析结果:');
        console.log(`- 有模态框: ${formAnalysis.modalExists}`);
        console.log(`- 有表单: ${formAnalysis.hasForm}`);
        console.log(`- 输入框数量: ${formAnalysis.inputs.length}`);
        console.log(`- 按钮数量: ${formAnalysis.buttons.length}`);
        console.log(`- 下拉框数量: ${formAnalysis.selects.length}`);
        
        // 显示输入框详情
        formAnalysis.inputs.forEach((input, index) => {
            console.log(`输入框 ${index + 1}: ${input.type} - ${input.placeholder} (${input.name})`);
        });
        
        // 显示按钮详情
        formAnalysis.buttons.forEach((button, index) => {
            console.log(`按钮 ${index + 1}: "${button.text}" (${button.type})`);
        });
        
        // 5. 填写表单
        console.log('📝 步骤5: 填写交易所账户信息...');
        
        let accountFilled = false;
        let apiKeyFilled = false;
        let apiSecretFilled = false;
        
        // 填写账户邮箱
        const accountSelectors = [
            'input[placeholder*="账户"]',
            'input[placeholder*="邮箱"]',
            'input[placeholder*="email"]',
            'input[placeholder*="account"]',
            'input[name*="account"]',
            'input[name*="email"]',
            'input[id*="account"]',
            'input[id*="email"]'
        ];
        
        for (const selector of accountSelectors) {
            try {
                await page.fill(selector, 'test@gmail.com');
                accountFilled = true;
                console.log('✅ 账户填写完成');
                break;
            } catch (error) {
                // 继续尝试下一个选择器
            }
        }
        
        // 填写API Key
        const apiKeySelectors = [
            'input[placeholder*="API Key"]',
            'input[placeholder*="API密钥"]',
            'input[placeholder*="api_key"]',
            'input[placeholder*="key"]',
            'input[name*="api_key"]',
            'input[name*="key"]',
            'input[id*="api_key"]',
            'input[id*="key"]'
        ];
        
        for (const selector of apiKeySelectors) {
            try {
                await page.fill(selector, process.env.TEST_API_KEY || 'test_api_key_placeholder');
                apiKeyFilled = true;
                console.log('✅ API Key填写完成');
                break;
            } catch (error) {
                // 继续尝试下一个选择器
            }
        }
        
        // 填写API Secret
        const apiSecretSelectors = [
            'input[placeholder*="API Secret"]',
            'input[placeholder*="API密钥"]',
            'input[placeholder*="secret"]',
            'input[placeholder*="api_secret"]',
            'input[name*="api_secret"]',
            'input[name*="secret"]',
            'input[id*="api_secret"]',
            'input[id*="secret"]'
        ];
        
        for (const selector of apiSecretSelectors) {
            try {
                await page.fill(selector, process.env.TEST_API_SECRET || 'test_api_secret_placeholder');
                apiSecretFilled = true;
                console.log('✅ API Secret填写完成');
                break;
            } catch (error) {
                // 继续尝试下一个选择器
            }
        }
        
        await page.waitForTimeout(1000);
        
        // 截图4: 表单填写完成
        await page.screenshot({ 
            path: `${screenshotDir}/04-form-filled.png`,
            fullPage: true 
        });
        
        // 6. 点击测试连接按钮
        console.log('🔧 步骤6: 测试连接...');
        
        const testConnectionSelectors = [
            'button:has-text("测试连接")',
            'button:has-text("测试")',
            'button:has-text("连接测试")',
            'button:has-text("Test Connection")',
            'button:has-text("Test")'
        ];
        
        let testClicked = false;
        
        for (const selector of testConnectionSelectors) {
            try {
                await page.click(selector);
                testClicked = true;
                console.log('✅ 点击测试连接按钮');
                break;
            } catch (error) {
                // 继续尝试下一个选择器
            }
        }
        
        if (testClicked) {
            await page.waitForTimeout(3000); // 等待测试结果
            
            // 截图5: 测试连接结果
            await page.screenshot({ 
                path: `${screenshotDir}/05-test-connection.png`,
                fullPage: true 
            });
            
            // 检查测试结果
            const testResult = await page.evaluate(() => {
                return {
                    hasSuccessMessage: document.body.textContent.includes('成功') || 
                                     document.body.textContent.includes('success') ||
                                     document.body.textContent.includes('连接成功'),
                    hasErrorMessage: document.body.textContent.includes('错误') || 
                                    document.body.textContent.includes('error') ||
                                    document.body.textContent.includes('失败') ||
                                    document.body.textContent.includes('连接失败'),
                    resultContent: document.body.textContent.substring(0, 1000)
                };
            });
            
            console.log('📊 测试连接结果:');
            console.log(`- 有成功消息: ${testResult.hasSuccessMessage}`);
            console.log(`- 有错误消息: ${testResult.hasErrorMessage}`);
        }
        
        // 7. 点击保存并连接按钮
        console.log('💾 步骤7: 保存并连接...');
        
        const saveSelectors = [
            'button:has-text("保存并连接")',
            'button:has-text("保存")',
            'button:has-text("连接")',
            'button:has-text("提交")',
            'button:has-text("确认")',
            'button:has-text("Save")',
            'button:has-text("Connect")',
            'button[type="submit"]'
        ];
        
        let saveClicked = false;
        
        for (const selector of saveSelectors) {
            try {
                await page.click(selector);
                saveClicked = true;
                console.log('✅ 点击保存并连接按钮');
                break;
            } catch (error) {
                // 继续尝试下一个选择器
            }
        }
        
        await page.waitForTimeout(3000);
        
        // 截图6: 保存结果
        await page.screenshot({ 
            path: `${screenshotDir}/06-save-result.png`,
            fullPage: true 
        });
        
        // 8. 检查最终结果
        const finalResult = await page.evaluate(() => {
            return {
                hasSuccessMessage: document.body.textContent.includes('成功') || 
                                 document.body.textContent.includes('success') ||
                                 document.body.textContent.includes('已保存'),
                hasErrorMessage: document.body.textContent.includes('错误') || 
                                document.body.textContent.includes('error') ||
                                document.body.textContent.includes('失败'),
                hasExchangeAccount: document.body.textContent.includes('交易所') || 
                                   document.body.textContent.includes('账户') ||
                                   document.body.textContent.includes('Exchange'),
                pageContent: document.body.textContent.substring(0, 1000)
            };
        });
        
        console.log('🎯 最终结果:');
        console.log(`- 有成功消息: ${finalResult.hasSuccessMessage}`);
        console.log(`- 有错误消息: ${finalResult.hasErrorMessage}`);
        console.log(`- 有交易所账户: ${finalResult.hasExchangeAccount}`);
        
        // 保存测试结果
        const testResult = {
            timestamp: new Date().toISOString(),
            formAnalysis: formAnalysis,
            formFillResult: {
                accountFilled: accountFilled,
                apiKeyFilled: apiKeyFilled,
                apiSecretFilled: apiSecretFilled,
                testClicked: testClicked,
                saveClicked: saveClicked
            },
            testData: {
                account: 'test@gmail.com',
                apiKey: process.env.TEST_API_KEY || 'test_api_key_placeholder',
                apiSecret: process.env.TEST_API_SECRET || 'test_api_secret_placeholder'
            },
            finalResult: finalResult
        };
        
        fs.writeFileSync(
            `${screenshotDir}/add-exchange-test-result.json`,
            JSON.stringify(testResult, null, 2)
        );
        
        console.log('\\n🎉 添加交易所账户测试完成！');
        console.log('📁 截图保存在:', screenshotDir);
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        console.error('错误堆栈:', error.stack);
        
        // 错误截图
        try {
            await page.screenshot({ 
                path: '../screenshots/add-exchange-test/error-screenshot.png',
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