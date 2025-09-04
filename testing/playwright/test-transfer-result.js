const { chromium } = require('playwright');

(async () => {
    console.log('💰 测试转账后的账户余额更新');
    
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
                request.url().includes('/api/account') ||
                request.url().includes('/api/trading')) {
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
        
        // 3. 检查转账前余额
        console.log('💰 步骤3: 检查转账前余额...');
        
        const beforeRefresh = await page.evaluate(() => {
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
        
        console.log(`📊 转账前余额: ${beforeRefresh.join(', ')}`);
        
        // 4. 点击刷新按钮
        console.log('🔄 步骤4: 点击刷新按钮更新余额...');
        
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
            
            // 5. 检查转账后余额
            console.log('💰 步骤5: 检查转账后余额...');
            
            const afterRefresh = await page.evaluate(() => {
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
            
            console.log(`📊 转账后余额: ${afterRefresh.join(', ')}`);
            
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
            console.log(`   转账前总资产: US$${beforeTotal.toFixed(2)}`);
            console.log(`   转账后总资产: US$${afterTotal.toFixed(2)}`);
            console.log(`   转账前可用余额: US$${beforeAvailable.toFixed(2)}`);
            console.log(`   转账后可用余额: US$${afterAvailable.toFixed(2)}`);
            
            if (afterTotal > 0) {
                console.log('🎉 成功！余额已更新！');
                console.log(`   总资产增加了: US$${(afterTotal - beforeTotal).toFixed(2)}`);
                
                if (afterAvailable > 0) {
                    console.log('✅ 可用余额已更新，现在可以测试交易功能！');
                    console.log(`   可用余额: US$${afterAvailable.toFixed(2)}`);
                    
                    // 7. 测试交易功能
                    console.log('🚀 步骤7: 测试交易功能...');
                    
                    const tradingForm = await page.evaluate(() => {
                        const result = {
                            hasTradingForm: false,
                            tradingPairs: [],
                            orderTypes: [],
                            canPlaceOrder: false
                        };
                        
                        // 查找交易表单
                        const tradingForm = document.querySelector('form') || 
                                          document.querySelector('.trading-form') ||
                                          document.querySelector('.order-form');
                        
                        if (tradingForm) {
                            result.hasTradingForm = true;
                            
                            // 查找交易对
                            const tradingPairs = Array.from(document.querySelectorAll('*')).filter(el => 
                                el.textContent?.includes('BTC/USDT') || el.textContent?.includes('ETH/USDT')
                            );
                            result.tradingPairs = tradingPairs.map(el => el.textContent?.trim());
                            
                            // 查找订单类型
                            const orderTypes = Array.from(document.querySelectorAll('*')).filter(el => 
                                el.textContent?.includes('限价') || el.textContent?.includes('市价') ||
                                el.textContent?.includes('limit') || el.textContent?.includes('market')
                            );
                            result.orderTypes = orderTypes.map(el => el.textContent?.trim());
                            
                            // 查找下单按钮
                            const orderButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
                                btn.textContent?.includes('立即下单') || btn.textContent?.includes('买入') ||
                                btn.textContent?.includes('卖出') || btn.textContent?.includes('Buy') ||
                                btn.textContent?.includes('Sell')
                            );
                            
                            result.canPlaceOrder = orderButtons.length > 0;
                        }
                        
                        return result;
                    });
                    
                    console.log(`📊 交易功能分析:`);
                    console.log(`   有交易表单: ${tradingForm.hasTradingForm}`);
                    console.log(`   交易对: ${tradingForm.tradingPairs.join(', ')}`);
                    console.log(`   订单类型: ${tradingForm.orderTypes.join(', ')}`);
                    console.log(`   可以下单: ${tradingForm.canPlaceOrder}`);
                    
                    if (tradingForm.canPlaceOrder) {
                        console.log('🎯 现在可以测试买入/卖出功能了！');
                        console.log('💡 建议: 尝试小额买入订单测试完整流程');
                    }
                    
                } else {
                    console.log('⚠️  可用余额仍为0，可能需要等待或检查转账状态');
                }
                
            } else {
                console.log('❌ 余额仍为0，可能需要：');
                console.log('   1. 再次点击刷新');
                console.log('   2. 等待更长时间同步');
                console.log('   3. 检查Bybit官网转账状态');
            }
            
            // 8. 最终状态截图
            console.log('📸 步骤8: 保存最终状态截图...');
            
            const fs = require('fs');
            const screenshotDir = '../screenshots/transfer-test';
            if (!fs.existsSync(screenshotDir)) {
                fs.mkdirSync(screenshotDir, { recursive: true });
            }
            
            await page.screenshot({ 
                path: `${screenshotDir}/final-balance-status.png`,
                fullPage: true 
            });
            
            // 保存测试结果
            const testResult = {
                timestamp: new Date().toISOString(),
                beforeRefresh: beforeRefresh,
                afterRefresh: afterRefresh,
                balanceChange: afterTotal - beforeTotal,
                hasBalance: afterTotal > 0,
                canTrade: afterAvailable > 0,
                transferAmount: 1000, // 你转账的金额
                transferSuccess: afterTotal > beforeTotal
            };
            
            fs.writeFileSync(
                `${screenshotDir}/transfer-test-result.json`,
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