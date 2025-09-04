const { chromium } = require('playwright');

(async () => {
    console.log('💰 强制测试余额API调用');
    
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
        
        // 监听所有API请求
        page.on('request', request => {
            if (request.url().includes('/api/exchange/balance')) {
                console.log(`📡 发送余额API请求: ${request.method()} ${request.url()}`);
            }
        });
        
        page.on('response', async response => {
            if (response.url().includes('/api/exchange/balance')) {
                console.log(`📡 收到余额API响应: ${response.status()}`);
                try {
                    const data = await response.json();
                    console.log(`   响应内容: ${JSON.stringify(data, null, 2)}`);
                    
                    // 分析响应数据
                    if (data.success && data.data) {
                        console.log(`\n📊 余额数据分析:`);
                        console.log(`   账户数量: ${data.data.length}`);
                        
                        let totalUSD = 0;
                        data.data.forEach((balance, index) => {
                            console.log(`   账户 ${index + 1}:`);
                            console.log(`     资产: ${balance.asset}`);
                            console.log(`     可用: ${balance.free}`);
                            console.log(`     总计: ${balance.total}`);
                            console.log(`     价值: $${balance.valueInUSD || 0}`);
                            totalUSD += (balance.valueInUSD || 0);
                        });
                        
                        console.log(`\n💰 总价值: $${totalUSD.toFixed(2)}`);
                        
                        if (totalUSD > 0) {
                            console.log('✅ 余额修复成功！系统显示正确的余额。');
                        } else {
                            console.log('❌ 余额仍为0，可能需要进一步检查。');
                        }
                    } else {
                        console.log(`❌ API返回失败: ${data.message}`);
                    }
                } catch (e) {
                    console.log(`   响应解析错误: ${e.message}`);
                    console.log(`   原始响应: ${await response.text()}`);
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
        
        // 3. 尝试多个方法触发余额查询
        console.log('🔄 步骤3: 尝试触发余额查询...');
        
        // 方法1: 点击刷新按钮
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
            console.log('✅ 点击了刷新按钮');
        }
        
        await page.waitForTimeout(3000);
        
        // 方法2: 查找并点击账户区域
        const accountClicked = await page.evaluate(() => {
            const accountElements = Array.from(document.querySelectorAll('*')).filter(el => 
                el.textContent?.includes('test@gmail.com') || el.textContent?.includes('gmail@gmail.com')
            );
            
            if (accountElements.length > 0) {
                accountElements[0].click();
                return true;
            }
            return false;
        });
        
        if (accountClicked) {
            console.log('✅ 点击了账户区域');
        }
        
        await page.waitForTimeout(3000);
        
        // 方法3: 检查页面上的余额信息
        const balanceInfo = await page.evaluate(() => {
            const result = {
                accountElements: [],
                balanceText: '',
                totalAssets: '',
                availableBalance: ''
            };
            
            // 查找包含余额信息的元素
            document.querySelectorAll('*').forEach(element => {
                const text = element.textContent?.trim() || '';
                if (text.includes('US$') && (text.includes('总资产') || text.includes('可用余额'))) {
                    result.accountElements.push({
                        tagName: element.tagName,
                        text: text.substring(0, 100)
                    });
                }
            });
            
            // 查找账户余额信息
            const accountSection = Array.from(document.querySelectorAll('*')).find(el => 
                el.textContent?.includes('gmail@gmail.com')
            );
            
            if (accountSection) {
                const parentElement = accountSection.closest('div') || accountSection.parentElement;
                if (parentElement) {
                    result.balanceText = parentElement.textContent?.substring(0, 300) || '';
                    
                    // 提取余额信息
                    const balanceMatch = result.balanceText.match(/US\$([\\d,]+\\.\\d+)/g);
                    if (balanceMatch) {
                        if (balanceMatch[0]) result.totalAssets = balanceMatch[0];
                        if (balanceMatch[1]) result.availableBalance = balanceMatch[1];
                    }
                }
            }
            
            return result;
        });
        
        console.log('📊 页面余额信息:');
        console.log(`   总资产: ${balanceInfo.totalAssets || '未找到'}`);
        console.log(`   可用余额: ${balanceInfo.availableBalance || '未找到'}`);
        console.log(`   账户元素数量: ${balanceInfo.accountElements.length}`);
        
        if (balanceInfo.totalAssets && balanceInfo.totalAssets !== 'US$0.00') {
            console.log('✅ 页面显示余额更新！');
        } else {
            console.log('❌ 页面仍显示余额为0');
        }
        
        console.log('🎉 测试完成！');
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        
    } finally {
        await browser.close();
        console.log('🔚 测试完成，浏览器已关闭');
    }
})();