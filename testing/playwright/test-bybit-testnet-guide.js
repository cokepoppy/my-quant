const { chromium } = require('playwright');

(async () => {
    console.log('🔍 查看Bybit测试网资产页面，寻找领取测试币的方法');
    
    // 创建浏览器实例
    const browser = await chromium.launch({
        headless: false, // 设置为false可以看到浏览器界面
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
        console.log('🌐 访问Bybit测试网资产页面...');
        
        // 设置代理
        const proxyUrl = process.env.http_proxy || process.env.https_proxy;
        if (proxyUrl) {
            console.log(`🔗 使用代理: ${proxyUrl}`);
        }
        
        // 访问资产页面
        await page.goto('https://testnet.bybit.com/user/assets/home/tradingaccount', { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });
        
        console.log('✅ 页面加载完成');
        
        // 等待页面完全加载
        await page.waitForTimeout(3000);
        
        // 创建截图目录
        const fs = require('fs');
        const screenshotDir = '../screenshots/bybit-testnet-guide';
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }
        
        // 截图1: 完整页面
        await page.screenshot({ 
            path: `${screenshotDir}/01-trading-account-page.png`,
            fullPage: true 
        });
        
        // 分析页面内容，寻找领取测试币的相关元素
        console.log('🔍 分析页面内容...');
        
        const pageAnalysis = await page.evaluate(() => {
            const result = {
                pageTitle: document.title,
                buttons: [],
                links: [],
                forms: [],
                textContent: '',
                elementsWithText: []
            };
            
            // 查找所有按钮
            document.querySelectorAll('button').forEach(button => {
                const text = button.textContent?.trim() || '';
                if (text) {
                    result.buttons.push({
                        text: text,
                        isVisible: button.offsetParent !== null,
                        className: button.className
                    });
                }
            });
            
            // 查找所有链接
            document.querySelectorAll('a').forEach(link => {
                const text = link.textContent?.trim() || '';
                const href = link.href;
                if (text) {
                    result.links.push({
                        text: text,
                        href: href,
                        isVisible: link.offsetParent !== null
                    });
                }
            });
            
            // 查找表单
            document.querySelectorAll('form').forEach(form => {
                result.forms.push({
                    action: form.action,
                    className: form.className
                });
            });
            
            // 查找包含特定关键词的元素
            const keywords = ['deposit', 'withdraw', 'transfer', 'faucet', 'test', 'bonus', 'get', 'claim', 'receive', '充值', '领取', '获取', '测试'];
            document.querySelectorAll('*').forEach(element => {
                const text = element.textContent?.trim() || '';
                if (text && keywords.some(keyword => text.toLowerCase().includes(keyword))) {
                    result.elementsWithText.push({
                        tagName: element.tagName,
                        text: text.substring(0, 100),
                        isVisible: element.offsetParent !== null
                    });
                }
            });
            
            // 获取页面主要内容
            result.textContent = document.body.textContent.substring(0, 1000);
            
            return result;
        });
        
        console.log('📊 页面分析结果:');
        console.log(`页面标题: ${pageAnalysis.pageTitle}`);
        console.log(`按钮数量: ${pageAnalysis.buttons.length}`);
        console.log(`链接数量: ${pageAnalysis.links.length}`);
        console.log(`表单数量: ${pageAnalysis.forms.length}`);
        console.log(`相关元素数量: ${pageAnalysis.elementsWithText.length}`);
        
        // 显示重要按钮
        console.log('\n🔘 重要按钮:');
        pageAnalysis.buttons.forEach((button, index) => {
            if (button.isVisible && (button.text.includes('Deposit') || button.text.includes('Withdraw') || 
                button.text.includes('Transfer') || button.text.includes('充值') || button.text.includes('领取') ||
                button.text.includes('获取') || button.text.includes('测试'))) {
                console.log(`  ${index + 1}. "${button.text}" (可见: ${button.isVisible})`);
            }
        });
        
        // 显示重要链接
        console.log('\n🔗 重要链接:');
        pageAnalysis.links.forEach((link, index) => {
            if (link.isVisible && (link.text.includes('Deposit') || link.text.includes('Withdraw') || 
                link.text.includes('Transfer') || link.text.includes('Faucet') || link.text.includes('Test') ||
                link.text.includes('充值') || link.text.includes('领取') || link.text.includes('获取'))) {
                console.log(`  ${index + 1}. "${link.text}" -> ${link.href}`);
            }
        });
        
        // 显示相关元素
        console.log('\n🔍 相关元素:');
        pageAnalysis.elementsWithText.forEach((element, index) => {
            console.log(`  ${index + 1}. ${element.tagName}: "${element.text}" (可见: ${element.isVisible})`);
        });
        
        // 截图2: 滚动到相关元素
        if (pageAnalysis.elementsWithText.length > 0) {
            console.log('\n📸 滚动到相关元素并截图...');
            
            // 尝试滚动到第一个相关元素
            const firstElement = pageAnalysis.elementsWithText[0];
            if (firstElement.isVisible) {
                await page.evaluate(() => {
                    const elements = document.querySelectorAll('*');
                    for (let element of elements) {
                        const text = element.textContent?.trim() || '';
                        if (text.includes('Deposit') || text.includes('充值') || text.includes('领取') || text.includes('获取')) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            break;
                        }
                    }
                });
                
                await page.waitForTimeout(2000);
                
                await page.screenshot({ 
                    path: `${screenshotDir}/02-relevant-elements.png`,
                    fullPage: true 
                });
            }
        }
        
        // 截图3: 查找导航菜单
        console.log('\n🧭 检查导航菜单...');
        
        const navigationAnalysis = await page.evaluate(() => {
            const result = {
                menuItems: [],
                navigationBars: []
            };
            
            // 查找导航栏
            document.querySelectorAll('nav, .nav, .navigation, .menu, .sidebar').forEach(nav => {
                result.navigationBars.push({
                    className: nav.className,
                    text: nav.textContent?.trim().substring(0, 100)
                });
            });
            
            // 查找菜单项
            document.querySelectorAll('li, .menu-item, .nav-item').forEach(item => {
                const text = item.textContent?.trim() || '';
                if (text && (text.includes('Wallet') || text.includes('资产') || text.includes('Faucet') || 
                    text.includes('Deposit') || text.includes('充值') || text.includes('领取'))) {
                    result.menuItems.push({
                        text: text,
                        isVisible: item.offsetParent !== null
                    });
                }
            });
            
            return result;
        });
        
        console.log(`导航栏数量: ${navigationAnalysis.navigationBars.length}`);
        console.log(`相关菜单项数量: ${navigationAnalysis.menuItems.length}`);
        
        navigationAnalysis.menuItems.forEach((item, index) => {
            console.log(`  ${index + 1}. "${item.text}" (可见: ${item.isVisible})`);
        });
        
        // 提供建议
        console.log('\n💡 建议的操作步骤:');
        console.log('1. 查找页面上的 "Deposit" 或 "充值" 按钮');
        console.log('2. 检查是否有 "Faucet" 或 "领取测试币" 选项');
        console.log('3. 查看导航菜单中的 "Wallet" 或 "资产" 选项');
        console.log('4. 寻找 "Get Test BTC" 或类似按钮');
        
        console.log('\n📁 截图已保存到:', screenshotDir);
        console.log('🔗 请手动检查页面，寻找以下关键词:');
        console.log('   - Deposit / 充值');
        console.log('   - Faucet / 水龙头');
        console.log('   - Get Test BTC / 获取测试币');
        console.log('   - Bonus / 奖金');
        console.log('   - Claim / 领取');
        
        // 保存分析结果
        const analysisResult = {
            timestamp: new Date().toISOString(),
            url: 'https://testnet.bybit.com/user/assets/home/tradingaccount',
            pageAnalysis: pageAnalysis,
            navigationAnalysis: navigationAnalysis,
            suggestions: [
                '查找Deposit或充值按钮',
                '检查Faucet或水龙头选项',
                '查看导航菜单中的Wallet或资产',
                '寻找Get Test BTC按钮',
                '检查是否有Bonus或Claim选项'
            ]
        };
        
        fs.writeFileSync(
            `${screenshotDir}/bybit-testnet-analysis.json`,
            JSON.stringify(analysisResult, null, 2)
        );
        
        console.log('\n✅ 分析完成！请查看截图和结果文件。');
        
        // 保持浏览器打开，让用户可以手动操作
        console.log('\n🌐 浏览器保持打开状态，你可以手动操作...');
        console.log('💡 提示: 查找以下关键词的按钮或链接:');
        console.log('   - Deposit');
        console.log('   - Faucet'); 
        console.log('   - Get Test BTC');
        console.log('   - 充值');
        console.log('   - 领取');
        console.log('   - 获取测试币');
        
        // 等待用户手动操作
        await page.waitForTimeout(30000); // 30秒后自动关闭
        
    } catch (error) {
        console.error('❌ 分析过程中发生错误:', error.message);
        console.error('错误堆栈:', error.stack);
        
        // 错误截图
        try {
            await page.screenshot({ 
                path: '../screenshots/bybit-testnet-guide/error-screenshot.png',
                fullPage: true 
            });
        } catch (e) {
            console.log('截图失败:', e.message);
        }
        
    } finally {
        await browser.close();
        console.log('🔚 浏览器已关闭');
    }
})();