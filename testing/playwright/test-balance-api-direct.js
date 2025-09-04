const { chromium } = require('playwright');

(async () => {
    console.log('💰 测试修复后的余额API（直接调用）');
    
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
        page.setDefaultTimeout(15000);
        
        // 监听API响应
        page.on('response', async response => {
            if (response.url().includes('/api/exchange/balance')) {
                console.log(`📡 API响应: ${response.status()} ${response.url()}`);
                try {
                    const data = await response.json();
                    console.log(`   响应数据: ${JSON.stringify(data, null, 2)}`);
                    
                    if (data.success && data.data) {
                        const totalBalance = data.data.reduce((sum, item) => sum + (item.valueInUSD || 0), 0);
                        console.log(`\n💰 计算总余额: $${totalBalance.toFixed(2)}`);
                        
                        if (totalBalance > 0) {
                            console.log('✅ 余额修复成功！');
                        } else {
                            console.log('❌ 余额仍为0');
                        }
                    }
                } catch (e) {
                    console.log(`   响应解析失败: ${e.message}`);
                }
            }
        });
        
        // 1. 登录系统
        console.log('🔐 步骤1: 登录系统...');
        await page.goto('http://localhost:3001/login', { 
            waitUntil: 'networkidle',
            timeout: 15000 
        });
        
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);
        
        await page.fill('input[type="email"], input[placeholder*="邮箱"]', 'test@example.com');
        await page.fill('input[type="password"], input[placeholder*="密码"]', 'password123');
        await page.waitForTimeout(500);
        
        await page.click('button[type="submit"], button');
        
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        console.log('✅ 登录成功');
        
        // 2. 导航到交易面板
        console.log('🏠 步骤2: 导航到交易面板...');
        
        await page.waitForSelector('.sidebar-nav, .nav-items, .nav-item', { timeout: 10000 });
        
        const tradingPanelSelectors = [
            '.nav-item:has-text("交易面板")',
            '.nav-items:has-text("交易面板") .nav-item',
            'text="交易面板"',
            '.sidebar-nav >> text="交易面板"'
        ];
        
        for (const selector of tradingPanelSelectors) {
            try {
                const element = await page.$(selector);
                if (element) {
                    await element.click();
                    console.log('✅ 成功点击交易面板');
                    break;
                }
            } catch (error) {
                // 继续尝试下一个选择器
            }
        }
        
        await page.waitForTimeout(3000);
        
        // 3. 点击刷新按钮触发余额查询
        console.log('🔄 步骤3: 点击刷新按钮...');
        
        const refreshClicked = await page.evaluate(() => {
            const refreshButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
                const text = btn.textContent?.trim() || '';
                return text.includes('刷新') || text.includes('Refresh');
            });
            
            if (refreshButtons.length > 0) {
                refreshButtons[0].click();
                return true;
            }
            return false;
        });
        
        if (refreshClicked) {
            console.log('✅ 成功点击刷新按钮');
            await page.waitForTimeout(5000); // 等待余额查询完成
            
            console.log('🎉 测试完成！');
        } else {
            console.log('❌ 未找到刷新按钮');
        }
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        
    } finally {
        await browser.close();
        console.log('🔚 测试完成，浏览器已关闭');
    }
})();