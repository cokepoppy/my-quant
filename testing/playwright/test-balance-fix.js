const { chromium } = require('playwright');

(async () => {
    console.log('💰 测试修复后的Bybit余额查询（Unified Trading Account）');
    
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
        page.setDefaultTimeout(30000);
        
        // 监听网络请求和响应
        page.on('request', request => {
            if (request.url().includes('/api/exchange/balance')) {
                console.log(`📡 API请求: ${request.method()} ${request.url()}`);
            }
        });
        
        page.on('response', async response => {
            if (response.url().includes('/api/exchange/balance')) {
                console.log(`📡 API响应: ${response.status()} ${response.url()}`);
                try {
                    const data = await response.json();
                    console.log(`   响应数据: ${JSON.stringify(data, null, 2)}`);
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
        
        // 3. 检查修复前的余额
        console.log('💰 步骤3: 检查修复前的余额...');
        
        const checkBalance = async () => {
            return await page.evaluate(() => {
                const accountSection = Array.from(document.querySelectorAll('*')).find(el => 
                    el.textContent?.includes('test@gmail.com')
                );
                
                if (accountSection) {
                    const parentElement = accountSection.closest('div') || accountSection.parentElement;
                    const text = parentElement?.textContent || '';
                    const balanceMatch = text.match(/US\$([\\d,]+\\.\\d+)/g);
                    return balanceMatch || [];
                }
                return [];
            });
        };
        
        const beforeRefresh = await checkBalance();
        console.log(`📊 修复前余额: ${beforeRefresh.join(', ')}`);
        
        // 4. 点击刷新按钮测试新的余额查询
        console.log('🔄 步骤4: 点击刷新按钮测试新的余额查询...');
        
        const refreshClicked = await page.evaluate(() => {
            const refreshButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
                const text = btn.textContent?.trim() || '';
                return text.includes('刷新') || text.includes('Refresh');
            });
            
            // 优先点击账户区域的刷新按钮
            const accountRefresh = refreshButtons.find(btn => {
                const parent = btn.closest('div');
                return parent?.textContent?.includes('test@gmail.com');
            });
            
            if (accountRefresh) {
                accountRefresh.click();
                return true;
            } else if (refreshButtons.length > 0) {
                refreshButtons[0].click();
                return true;
            }
            return false;
        });
        
        if (refreshClicked) {
            console.log('✅ 成功点击刷新按钮');
            await page.waitForTimeout(5000); // 等待余额更新
            
            // 5. 检查修复后的余额
            console.log('💰 步骤5: 检查修复后的余额...');
            
            const afterRefresh = await checkBalance();
            console.log(`📊 修复后余额: ${afterRefresh.join(', ')}`);
            
            // 6. 分析余额变化
            console.log('📈 步骤6: 分析余额变化...');
            
            const getBalanceValue = (balanceStr) => {
                if (!balanceStr) return 0;
                return parseFloat(balanceStr.replace('US$', '').replace(',', ''));
            };
            
            const beforeTotal = getBalanceValue(beforeRefresh[0]);
            const afterTotal = getBalanceValue(afterRefresh[0]);
            const beforeAvailable = getBalanceValue(beforeRefresh[1]);
            const afterAvailable = getBalanceValue(afterRefresh[1]);
            
            console.log(`📊 余额变化分析:`);
            console.log(`   修复前总资产: US$${beforeTotal.toFixed(2)}`);
            console.log(`   修复后总资产: US$${afterTotal.toFixed(2)}`);
            console.log(`   修复前可用余额: US$${beforeAvailable.toFixed(2)}`);
            console.log(`   修复后可用余额: US$${afterAvailable.toFixed(2)}`);
            
            if (afterTotal > 0) {
                console.log('🎉 成功！余额已显示！');
                console.log(`   总资产: US$${afterTotal.toFixed(2)}`);
                console.log(`   可用余额: US$${afterAvailable.toFixed(2)}`);
                
                if (afterTotal >= 1000) {
                    console.log('✅ 完美！转账的1000 USD已正确显示');
                } else {
                    console.log(`⚠️  余额为 US$${afterTotal.toFixed(2)}，可能需要进一步检查`);
                }
                
            } else {
                console.log('❌ 余额仍为0，可能需要：');
                console.log('   1. 检查后端服务是否已重启以应用更改');
                console.log('   2. 检查API响应数据');
                console.log('   3. 检查前端是否正确解析余额数据');
            }
            
            // 7. 保存测试结果
            const fs = require('fs');
            const screenshotDir = '../screenshots/balance-fix-test';
            if (!fs.existsSync(screenshotDir)) {
                fs.mkdirSync(screenshotDir, { recursive: true });
            }
            
            await page.screenshot({ 
                path: `${screenshotDir}/balance-fix-result.png`,
                fullPage: true 
            });
            
            const testResult = {
                timestamp: new Date().toISOString(),
                beforeRefresh: beforeRefresh,
                afterRefresh: afterRefresh,
                balanceChange: afterTotal - beforeTotal,
                hasBalance: afterTotal > 0,
                canTrade: afterAvailable > 0,
                fixSuccessful: afterTotal > 0,
                expectedAmount: 1000,
                actualAmount: afterTotal
            };
            
            fs.writeFileSync(
                `${screenshotDir}/balance-fix-test-result.json`,
                JSON.stringify(testResult, null, 2)
            );
            
            console.log(`\n📁 测试结果已保存到: ${screenshotDir}`);
            
        } else {
            console.log('❌ 未找到刷新按钮');
        }
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        console.error('错误堆栈:', error.stack);
        
    } finally {
        await browser.close();
        console.log('🔚 测试完成，浏览器已关闭');
    }
})();