const { chromium } = require('playwright');

(async () => {
    console.log('💰 测试Bybit账户余额（通过我们的系统）');
    
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
        
        // 监听网络请求
        page.on('request', request => {
            if (request.url().includes('/api/exchange/balance') || 
                request.url().includes('/api/account') ||
                request.url().includes('/api/trading')) {
                console.log(`📡 API请求: ${request.method()} ${request.url()}`);
            }
        });
        
        page.on('response', response => {
            if (response.url().includes('/api/exchange/balance') || 
                response.url().includes('/api/account') ||
                response.url().includes('/api/trading')) {
                console.log(`📡 API响应: ${response.status()} ${response.url()}`);
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
        
        // 2. 导航到交易面板
        console.log('🏠 步骤2: 导航到交易面板...');
        
        // 等待侧边栏加载
        await page.waitForSelector('.sidebar-nav, .nav-items, .nav-item', { timeout: 10000 });
        
        // 查找交易面板菜单项
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
        
        // 3. 查找余额信息
        console.log('💰 步骤3: 查找余额信息...');
        
        const balanceInfo = await page.evaluate(() => {
            const result = {
                accountElements: [],
                balanceText: '',
                totalAssets: '',
                availableBalance: '',
                todayProfit: '',
                hasBalance: false,
                balanceDetails: []
            };
            
            // 查找包含余额信息的元素
            document.querySelectorAll('*').forEach(element => {
                const text = element.textContent?.trim() || '';
                if (text.includes('US$') && (text.includes('总资产') || text.includes('可用余额') || 
                    text.includes('今日盈亏') || text.includes('Balance'))) {
                    result.accountElements.push({
                        tagName: element.tagName,
                        text: text.substring(0, 100),
                        isVisible: element.offsetParent !== null
                    });
                }
            });
            
            // 查找test@gmail.com账户的余额信息
            const accountSection = Array.from(document.querySelectorAll('*')).find(el => 
                el.textContent?.includes('test@gmail.com')
            );
            
            if (accountSection) {
                const parentElement = accountSection.closest('div') || accountSection.parentElement;
                if (parentElement) {
                    result.balanceText = parentElement.textContent?.substring(0, 500) || '';
                    
                    // 提取余额信息
                    const balanceMatch = result.balanceText.match(/US\$([\d,]+\.\d+)/g);
                    if (balanceMatch) {
                        result.balanceDetails = balanceMatch;
                        result.hasBalance = balanceMatch.length > 0;
                        
                        // 尝试识别不同类型的余额
                        balanceMatch.forEach((balance, index) => {
                            const value = parseFloat(balance.replace('US$', '').replace(',', ''));
                            if (index === 0) result.totalAssets = balance;
                            else if (index === 1) result.availableBalance = balance;
                            else if (index === 2 && balance.includes('+')) result.todayProfit = balance;
                        });
                    }
                }
            }
            
            return result;
        });
        
        console.log('📊 余额信息分析:');
        console.log(`   有余额信息: ${balanceInfo.hasBalance}`);
        console.log(`   账户元素数量: ${balanceInfo.accountElements.length}`);
        console.log(`   余额详情: ${balanceInfo.balanceDetails.join(', ')}`);
        
        if (balanceInfo.totalAssets) {
            console.log(`   总资产: ${balanceInfo.totalAssets}`);
        }
        if (balanceInfo.availableBalance) {
            console.log(`   可用余额: ${balanceInfo.availableBalance}`);
        }
        if (balanceInfo.todayProfit) {
            console.log(`   今日盈亏: ${balanceInfo.todayProfit}`);
        }
        
        // 显示相关元素
        balanceInfo.accountElements.forEach((element, index) => {
            console.log(`   元素 ${index + 1}: ${element.tagName} - "${element.text}"`);
        });
        
        // 4. 点击刷新按钮测试余额更新
        console.log('🔄 步骤4: 测试余额刷新...');
        
        const refreshClicked = await page.evaluate(() => {
            const refreshButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
                btn.textContent?.includes('刷新') || btn.textContent?.includes('Refresh')
            );
            
            if (refreshButtons.length > 0) {
                refreshButtons[0].click();
                return true;
            }
            return false;
        });
        
        if (refreshClicked) {
            console.log('✅ 点击了刷新按钮');
            await page.waitForTimeout(3000);
            
            // 再次检查余额
            const updatedBalance = await page.evaluate(() => {
                const accountSection = Array.from(document.querySelectorAll('*')).find(el => 
                    el.textContent?.includes('test@gmail.com')
                );
                
                if (accountSection) {
                    const parentElement = accountSection.closest('div') || accountSection.parentElement;
                    const text = parentElement?.textContent || '';
                    const balanceMatch = text.match(/US\$([\d,]+\.\d+)/g);
                    return balanceMatch || [];
                }
                return [];
            });
            
            console.log(`🔄 刷新后余额: ${updatedBalance.join(', ')}`);
        } else {
            console.log('⚠️  未找到刷新按钮');
        }
        
        // 5. 最终结论
        console.log('\n🎯 测试结论:');
        
        if (balanceInfo.hasBalance) {
            const totalAssets = balanceInfo.totalAssets || 'US$0.00';
            const assetValue = parseFloat(totalAssets.replace('US$', '').replace(',', ''));
            
            if (assetValue > 0) {
                console.log('✅ 账户有余额！测试币已到账。');
                console.log(`   总资产: ${totalAssets}`);
                
                if (assetValue < 1) {
                    console.log('💡 提示: 余额较少，可能需要领取更多测试币');
                }
            } else {
                console.log('⚠️  账户余额仍为0，可能需要：');
                console.log('   1. 等待测试币到账（通常需要几分钟）');
                console.log('   2. 检查测试币领取状态');
                console.log('   3. 尝试重新领取测试币');
            }
        } else {
            console.log('❌ 未找到账户余额信息');
            console.log('   可能的原因：');
            console.log('   1. 页面加载问题');
            console.log('   2. 账户未正确连接');
            console.log('   3. 测试币还未到账');
        }
        
        // 保存测试结果
        const fs = require('fs');
        const testResult = {
            timestamp: new Date().toISOString(),
            balanceInfo: balanceInfo,
            conclusion: balanceInfo.hasBalance ? '账户有余额' : '账户无余额',
            totalAssets: balanceInfo.totalAssets,
            availableBalance: balanceInfo.availableBalance,
            todayProfit: balanceInfo.todayProfit,
            refreshClicked: refreshClicked
        };
        
        const screenshotDir = '../screenshots/balance-test';
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }
        
        await page.screenshot({ 
            path: `${screenshotDir}/balance-test-result.png`,
            fullPage: true 
        });
        
        fs.writeFileSync(
            `${screenshotDir}/balance-test-result.json`,
            JSON.stringify(testResult, null, 2)
        );
        
        console.log(`\n📁 测试结果已保存到: ${screenshotDir}`);
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        console.error('错误堆栈:', error.stack);
        
    } finally {
        await browser.close();
        console.log('🔚 测试完成，浏览器已关闭');
    }
})();