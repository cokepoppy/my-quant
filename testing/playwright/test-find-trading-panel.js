const { chromium } = require('playwright');

(async () => {
    console.log('🏠 查找侧边栏交易面板测试');
    
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
                if (msg.text().includes('交易') || msg.text().includes('Trading') || msg.text().includes('click')) {
                    console.log(`📝 控制台日志: ${msg.text()}`);
                }
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
        const screenshotDir = '../screenshots/find-trading-panel';
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }
        
        // 截图1: 登录后的主页
        await page.screenshot({ 
            path: `${screenshotDir}/01-after-login.png`,
            fullPage: true 
        });
        
        // 2. 详细分析页面结构，寻找侧边栏
        console.log('🔍 步骤2: 分析页面结构，寻找侧边栏...');
        
        const pageAnalysis = await page.evaluate(() => {
            const result = {
                url: window.location.href,
                title: document.title,
                sidebars: [],
                menus: [],
                navigation: [],
                allElements: []
            };
            
            // 查找侧边栏
            document.querySelectorAll('.sidebar, .side-menu, .nav-menu, .navigation, .menu, [class*="sidebar"], [class*="side-menu"]').forEach(sidebar => {
                const sidebarInfo = {
                    className: sidebar.className,
                    id: sidebar.id,
                    innerHTML: sidebar.innerHTML.substring(0, 500),
                    links: [],
                    buttons: []
                };
                
                // 查找侧边栏中的链接
                sidebar.querySelectorAll('a').forEach(link => {
                    sidebarInfo.links.push({
                        text: link.textContent?.trim(),
                        href: link.href,
                        className: link.className
                    });
                });
                
                // 查找侧边栏中的按钮
                sidebar.querySelectorAll('button').forEach(button => {
                    sidebarInfo.buttons.push({
                        text: button.textContent?.trim(),
                        className: button.className
                    });
                });
                
                result.sidebars.push(sidebarInfo);
            });
            
            // 查找菜单项
            document.querySelectorAll('.menu-item, .nav-item, .sidebar-item, [class*="menu-item"], [class*="nav-item"]').forEach(item => {
                result.menus.push({
                    text: item.textContent?.trim(),
                    className: item.className,
                    href: item.querySelector('a')?.href || ''
                });
            });
            
            // 查找导航
            document.querySelectorAll('nav, .nav, .navigation').forEach(nav => {
                const navInfo = {
                    className: nav.className,
                    items: []
                };
                
                nav.querySelectorAll('a, button').forEach(item => {
                    navInfo.items.push({
                        text: item.textContent?.trim(),
                        href: item.href || '',
                        tagName: item.tagName
                    });
                });
                
                result.navigation.push(navInfo);
            });
            
            // 查找包含"交易"的元素
            document.querySelectorAll('*').forEach(element => {
                const text = element.textContent?.trim();
                if (text && (text.includes('交易') || text.includes('Trading'))) {
                    result.allElements.push({
                        tagName: element.tagName,
                        text: text,
                        className: element.className,
                        id: element.id,
                        href: element.href || '',
                        isVisible: element.offsetParent !== null
                    });
                }
            });
            
            return result;
        });
        
        console.log('📊 页面分析结果:');
        console.log(`- 侧边栏数量: ${pageAnalysis.sidebars.length}`);
        console.log(`- 菜单项数量: ${pageAnalysis.menus.length}`);
        console.log(`- 导航数量: ${pageAnalysis.navigation.length}`);
        console.log(`- 包含"交易"的元素: ${pageAnalysis.allElements.length}`);
        
        // 显示侧边栏详情
        pageAnalysis.sidebars.forEach((sidebar, index) => {
            console.log(`\n侧边栏 ${index + 1}:`);
            console.log(`- 类名: ${sidebar.className}`);
            console.log(`- 链接数量: ${sidebar.links.length}`);
            sidebar.links.forEach((link, linkIndex) => {
                console.log(`  ${linkIndex + 1}. ${link.text} -> ${link.href}`);
            });
            console.log(`- 按钮数量: ${sidebar.buttons.length}`);
            sidebar.buttons.forEach((button, buttonIndex) => {
                console.log(`  ${buttonIndex + 1}. ${button.text}`);
            });
        });
        
        // 显示包含"交易"的元素
        console.log('\n🏠 包含"交易"的元素:');
        pageAnalysis.allElements.forEach((element, index) => {
            console.log(`${index + 1}. ${element.tagName}: "${element.text}" (${element.isVisible ? '可见' : '不可见'})`);
            if (element.href) {
                console.log(`   链接: ${element.href}`);
            }
        });
        
        // 截图2: 分析页面结构
        await page.screenshot({ 
            path: `${screenshotDir}/02-page-analysis.png`,
            fullPage: true 
        });
        
        // 3. 尝试点击交易相关的元素
        console.log('\n🖱️  步骤3: 尝试点击交易相关元素...');
        
        let tradingClicked = false;
        let tradingPageUrl = '';
        
        // 优先点击包含"交易面板"的元素
        for (const element of pageAnalysis.allElements) {
            if (element.text.includes('交易面板') && element.isVisible) {
                try {
                    console.log(`点击 "${element.text}"...`);
                    
                    if (element.tagName === 'A') {
                        await page.goto(element.href, { waitUntil: 'networkidle' });
                    } else {
                        // 查找并点击元素
                        const selector = element.id ? `#${element.id}` : 
                                        element.className ? `.${element.className.split(' ').join('.')}` :
                                        `text="${element.text}"`;
                        
                        await page.click(selector);
                    }
                    
                    tradingClicked = true;
                    tradingPageUrl = page.url();
                    console.log(`✅ 成功点击交易面板，跳转到: ${tradingPageUrl}`);
                    break;
                } catch (error) {
                    console.log(`❌ 点击失败: ${error.message}`);
                }
            }
        }
        
        // 如果没有找到"交易面板"，尝试点击其他交易相关元素
        if (!tradingClicked) {
            for (const element of pageAnalysis.allElements) {
                if ((element.text.includes('交易') || element.text.includes('Trading')) && element.isVisible) {
                    try {
                        console.log(`点击 "${element.text}"...`);
                        
                        if (element.tagName === 'A') {
                            await page.goto(element.href, { waitUntil: 'networkidle' });
                        } else {
                            const selector = element.id ? `#${element.id}` : 
                                            `text="${element.text}"`;
                            
                            await page.click(selector);
                        }
                        
                        tradingClicked = true;
                        tradingPageUrl = page.url();
                        console.log(`✅ 成功点击交易元素，跳转到: ${tradingPageUrl}`);
                        break;
                    } catch (error) {
                        console.log(`❌ 点击失败: ${error.message}`);
                    }
                }
            }
        }
        
        await page.waitForTimeout(3000);
        
        // 截图3: 点击后的页面
        await page.screenshot({ 
            path: `${screenshotDir}/03-after-click.png`,
            fullPage: true 
        });
        
        // 4. 分析交易页面
        console.log('\n🔍 步骤4: 分析交易页面...');
        
        const tradingPageAnalysis = await page.evaluate(() => {
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
                tradingKeywords: []
            };
            
            // 查找交易关键词
            const keywords = ['买入', '卖出', '下单', '交易', '价格', '数量', 'Buy', 'Sell', 'Order', 'Price', 'Amount'];
            keywords.forEach(keyword => {
                if (document.body.textContent.includes(keyword)) {
                    result.tradingKeywords.push(keyword);
                }
            });
            
            return result;
        });
        
        console.log('📊 交易页面分析:');
        console.log(`- URL: ${tradingPageAnalysis.url}`);
        console.log(`- 标题: ${tradingPageAnalysis.title}`);
        console.log(`- 有交易内容: ${tradingPageAnalysis.hasTradingContent}`);
        console.log(`- 表单数量: ${tradingPageAnalysis.forms}`);
        console.log(`- 输入框数量: ${tradingPageAnalysis.inputs}`);
        console.log(`- 按钮数量: ${tradingPageAnalysis.buttons}`);
        console.log(`- 下拉框数量: ${tradingPageAnalysis.selects}`);
        console.log(`- 交易关键词: ${tradingPageAnalysis.tradingKeywords.join(', ')}`);
        
        // 5. 如果找到交易功能，进行交易测试
        if (tradingPageAnalysis.hasTradingContent && tradingPageAnalysis.forms > 0) {
            console.log('\n📝 步骤5: 测试交易功能...');
            
            // 填写交易表单
            const priceFilled = await page.fill('input[name="price"], input[placeholder*="价格"], input[placeholder*="Price"]', '50000');
            const amountFilled = await page.fill('input[name="amount"], input[placeholder*="数量"], input[placeholder*="Amount"], input[name="quantity"]', '0.01');
            
            console.log(`价格填写: ${priceFilled ? '✅ 成功' : '❌ 失败'}`);
            console.log(`数量填写: ${amountFilled ? '✅ 成功' : '❌ 失败'}`);
            
            await page.waitForTimeout(1000);
            
            // 截图4: 表单填写完成
            await page.screenshot({ 
                path: `${screenshotDir}/04-form-filled.png`,
                fullPage: true 
            });
            
            // 点击下单按钮
            const orderClicked = await page.click('button[type="submit"], button:has-text("买入"), button:has-text("卖出"), button:has-text("下单"), button:has-text("立即下单")');
            
            console.log(`下单点击: ${orderClicked ? '✅ 成功' : '❌ 失败'}`);
            
            await page.waitForTimeout(2000);
            
            // 截图5: 下单结果
            await page.screenshot({ 
                path: `${screenshotDir}/05-order-result.png`,
                fullPage: true 
            });
        }
        
        // 保存测试结果
        const testResult = {
            timestamp: new Date().toISOString(),
            pageAnalysis: pageAnalysis,
            tradingClicked: tradingClicked,
            tradingPageUrl: tradingPageUrl,
            tradingPageAnalysis: tradingPageAnalysis
        };
        
        require('fs').writeFileSync(
            `${screenshotDir}/find-trading-panel-result.json`,
            JSON.stringify(testResult, null, 2)
        );
        
        console.log('\n🎉 测试完成！');
        console.log('📁 截图保存在:', screenshotDir);
        console.log('📊 测试结果保存在:', `${screenshotDir}/find-trading-panel-result.json`);
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        console.error('错误堆栈:', error.stack);
        
        // 错误截图
        try {
            await page.screenshot({ 
                path: '../screenshots/find-trading-panel/error-screenshot.png',
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