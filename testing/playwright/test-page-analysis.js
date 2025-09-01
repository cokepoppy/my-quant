const { chromium } = require('playwright');

(async () => {
    console.log('🔍 页面结构分析测试');
    
    // 创建浏览器实例
    const browser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--enable-font-antialiasing',
            '--force-color-profile=srgb'
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
        
        // 2. 分析主页结构
        console.log('🔍 步骤2: 分析主页结构...');
        
        const mainPageAnalysis = await page.evaluate(() => {
            const result = {
                url: window.location.href,
                title: document.title,
                navigation: [],
                links: [],
                buttons: [],
                menus: []
            };
            
            // 查找导航菜单
            document.querySelectorAll('nav, .nav, .navigation, .sidebar, .menu').forEach(nav => {
                const navItems = [];
                nav.querySelectorAll('a, button').forEach(item => {
                    navItems.push({
                        text: item.textContent?.trim(),
                        href: item.href,
                        className: item.className
                    });
                });
                result.navigation.push({
                    className: nav.className,
                    items: navItems
                });
            });
            
            // 查找所有链接
            document.querySelectorAll('a').forEach(link => {
                if (link.textContent?.trim()) {
                    result.links.push({
                        text: link.textContent?.trim(),
                        href: link.href,
                        className: link.className
                    });
                }
            });
            
            // 查找所有按钮
            document.querySelectorAll('button').forEach(button => {
                if (button.textContent?.trim()) {
                    result.buttons.push({
                        text: button.textContent?.trim(),
                        className: button.className
                    });
                }
            });
            
            // 查找菜单项
            document.querySelectorAll('.menu-item, .nav-item, .sidebar-item, [role="menuitem"]').forEach(item => {
                result.menus.push({
                    text: item.textContent?.trim(),
                    className: item.className
                });
            });
            
            return result;
        });
        
        console.log('📊 主页分析结果:');
        console.log(`- 导航菜单数量: ${mainPageAnalysis.navigation.length}`);
        console.log(`- 链接数量: ${mainPageAnalysis.links.length}`);
        console.log(`- 按钮数量: ${mainPageAnalysis.buttons.length}`);
        console.log(`- 菜单项数量: ${mainPageAnalysis.menus.length}`);
        
        // 显示导航菜单
        mainPageAnalysis.navigation.forEach((nav, index) => {
            console.log(`导航菜单 ${index + 1}:`);
            nav.items.forEach((item, itemIndex) => {
                console.log(`  ${itemIndex + 1}. ${item.text} -> ${item.href}`);
            });
        });
        
        // 显示交易相关的链接
        console.log('\n🏠 交易相关链接:');
        const tradingLinks = mainPageAnalysis.links.filter(link => 
            link.text.includes('交易') || 
            link.text.includes('Trading') || 
            link.text.includes('Trade') ||
            link.href.includes('trading') ||
            link.href.includes('trade')
        );
        
        tradingLinks.forEach((link, index) => {
            console.log(`${index + 1}. ${link.text} -> ${link.href}`);
        });
        
        // 显示交易相关的按钮
        console.log('\n🔘 交易相关按钮:');
        const tradingButtons = mainPageAnalysis.buttons.filter(button => 
            button.text.includes('交易') || 
            button.text.includes('Trading') || 
            button.text.includes('Trade') ||
            button.text.includes('买入') ||
            button.text.includes('卖出') ||
            button.text.includes('下单')
        );
        
        tradingButtons.forEach((button, index) => {
            console.log(`${index + 1}. ${button.text}`);
        });
        
        // 3. 尝试访问常见的交易页面
        console.log('\n🧪 步骤3: 测试常见交易页面...');
        
        const tradingPages = [
            '/trading',
            '/trade',
            '/exchange',
            '/order',
            '/market',
            '/dashboard',
            '/strategy'
        ];
        
        for (const pagePath of tradingPages) {
            try {
                console.log(`\n📄 测试页面: ${pagePath}`);
                
                // 尝试访问页面
                await page.goto(`http://localhost:3001${pagePath}`, { 
                    waitUntil: 'domcontentloaded',
                    timeout: 10000 
                });
                
                await page.waitForTimeout(2000);
                
                // 检查页面是否加载成功
                const pageCheck = await page.evaluate(() => {
                    return {
                        url: window.location.href,
                        title: document.title,
                        hasError: document.body.textContent.includes('404') || 
                                document.body.textContent.includes('Page not found') ||
                                document.body.textContent.includes('错误'),
                        hasContent: document.body.textContent.length > 100,
                        hasForm: document.querySelectorAll('form').length > 0,
                        hasTradingElements: document.body.textContent.includes('交易') || 
                                         document.body.textContent.includes('Trading') ||
                                         document.body.textContent.includes('买入') ||
                                         document.body.textContent.includes('卖出')
                    };
                });
                
                console.log(`  - URL: ${pageCheck.url}`);
                console.log(`  - 标题: ${pageCheck.title}`);
                console.log(`  - 有错误: ${pageCheck.hasError}`);
                console.log(`  - 有内容: ${pageCheck.hasContent}`);
                console.log(`  - 有表单: ${pageCheck.hasForm}`);
                console.log(`  - 有交易元素: ${pageCheck.hasTradingElements}`);
                
                if (pageCheck.hasContent && !pageCheck.hasError) {
                    console.log(`  ✅ 页面 ${pagePath} 可访问`);
                    
                    // 如果有交易元素，详细分析
                    if (pageCheck.hasTradingElements) {
                        const tradingAnalysis = await page.evaluate(() => {
                            return {
                                forms: document.querySelectorAll('form').length,
                                inputs: document.querySelectorAll('input').length,
                                buttons: document.querySelectorAll('button').length,
                                tradingKeywords: document.body.textContent.match(/(交易|Trading|买入|卖出|下单|价格|数量|Buy|Sell|Order|Price|Amount)/g) || []
                            };
                        });
                        
                        console.log(`    表单数量: ${tradingAnalysis.forms}`);
                        console.log(`    输入框数量: ${tradingAnalysis.inputs}`);
                        console.log(`    按钮数量: ${tradingAnalysis.buttons}`);
                        console.log(`    交易关键词: ${tradingAnalysis.tradingKeywords.join(', ')}`);
                    }
                } else {
                    console.log(`  ❌ 页面 ${pagePath} 不可访问`);
                }
                
            } catch (error) {
                console.log(`  ❌ 访问 ${pagePath} 失败: ${error.message}`);
            }
        }
        
        // 4. 保存分析结果
        const analysisResult = {
            timestamp: new Date().toISOString(),
            mainPageAnalysis: mainPageAnalysis,
            tradingPages: tradingPages,
            testResults: '已输出到控制台'
        };
        
        require('fs').writeFileSync(
            '../screenshots/page-analysis-result.json',
            JSON.stringify(analysisResult, null, 2)
        );
        
        console.log('\n📊 分析结果已保存到 ../screenshots/page-analysis-result.json');
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        console.error('错误堆栈:', error.stack);
        
    } finally {
        await browser.close();
        console.log('🔚 测试完成，浏览器已关闭');
    }
})();