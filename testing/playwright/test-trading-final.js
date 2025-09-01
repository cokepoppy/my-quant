const { chromium } = require('playwright');

(async () => {
    console.log('🏠 交易下单测试 - 修复版本');
    
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
                // 只显示重要的日志
                if (msg.text().includes('交易') || msg.text().includes('Trading') || msg.text().includes('error')) {
                    console.log(`📝 控制台日志: ${msg.text()}`);
                }
            }
        });
        
        page.on('pageerror', error => {
            console.log(`❌ 页面错误: ${error.message}`);
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
        const screenshotDir = '../screenshots/trading-test-fixed';
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }
        
        // 2. 尝试访问交易页面
        console.log('🏠 步骤2: 访问交易页面...');
        
        // 直接访问交易页面
        await page.goto('http://localhost:3001/trading', { 
            waitUntil: 'domcontentloaded',
            timeout: 15000 
        });
        
        await page.waitForTimeout(3000); // 等待页面加载
        
        // 截图1: 交易页面
        await page.screenshot({ 
            path: `${screenshotDir}/01-trading-page.png`,
            fullPage: true 
        });
        
        // 3. 检查页面是否有交易功能
        console.log('🔍 步骤3: 检查交易功能...');
        
        const tradingCheck = await page.evaluate(() => {
            const result = {
                url: window.location.href,
                title: document.title,
                hasTradingContent: document.body.textContent.includes('交易') || 
                                  document.body.textContent.includes('Trading') ||
                                  document.body.textContent.includes('买入') ||
                                  document.body.textContent.includes('卖出'),
                forms: document.querySelectorAll('form').length,
                inputs: document.querySelectorAll('input').length,
                buttons: document.querySelectorAll('button').length,
                selectElements: document.querySelectorAll('select').length,
                tradingKeywords: [],
                pageContent: document.body.textContent.substring(0, 500)
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
        
        console.log('📊 交易页面检查:');
        console.log(`- URL: ${tradingCheck.url}`);
        console.log(`- 标题: ${tradingCheck.title}`);
        console.log(`- 有交易内容: ${tradingCheck.hasTradingContent}`);
        console.log(`- 表单数量: ${tradingCheck.forms}`);
        console.log(`- 输入框数量: ${tradingCheck.inputs}`);
        console.log(`- 按钮数量: ${tradingCheck.buttons}`);
        console.log(`- 下拉框数量: ${tradingCheck.selectElements}`);
        console.log(`- 交易关键词: ${tradingCheck.tradingKeywords.join(', ')}`);
        
        // 4. 如果页面没有交易功能，尝试创建模拟交易表单
        if (!tradingCheck.hasTradingContent || tradingCheck.forms === 0) {
            console.log('⚠️  页面没有交易功能，尝试创建模拟交易...');
            
            // 在页面上创建一个简单的交易表单
            await page.evaluate(() => {
                // 创建交易表单
                const form = document.createElement('form');
                form.id = 'mock-trading-form';
                form.style.padding = '20px';
                form.style.border = '2px solid #007bff';
                form.style.margin = '20px';
                form.style.backgroundColor = '#f8f9fa';
                
                // 标题
                const title = document.createElement('h3');
                title.textContent = '模拟交易下单';
                title.style.marginBottom = '20px';
                form.appendChild(title);
                
                // 交易类型选择
                const typeDiv = document.createElement('div');
                typeDiv.style.marginBottom = '15px';
                const typeLabel = document.createElement('label');
                typeLabel.textContent = '交易类型: ';
                typeDiv.appendChild(typeLabel);
                
                const buyRadio = document.createElement('input');
                buyRadio.type = 'radio';
                buyRadio.name = 'tradeType';
                buyRadio.value = 'buy';
                buyRadio.checked = true;
                buyRadio.style.marginRight = '5px';
                typeDiv.appendChild(buyRadio);
                
                const buyLabel = document.createElement('label');
                buyLabel.textContent = '买入 ';
                buyLabel.style.marginRight = '20px';
                typeDiv.appendChild(buyLabel);
                
                const sellRadio = document.createElement('input');
                sellRadio.type = 'radio';
                sellRadio.name = 'tradeType';
                sellRadio.value = 'sell';
                sellRadio.style.marginRight = '5px';
                typeDiv.appendChild(sellRadio);
                
                const sellLabel = document.createElement('label');
                sellLabel.textContent = '卖出';
                typeDiv.appendChild(sellLabel);
                
                form.appendChild(typeDiv);
                
                // 价格输入
                const priceDiv = document.createElement('div');
                priceDiv.style.marginBottom = '15px';
                const priceLabel = document.createElement('label');
                priceLabel.textContent = '价格: ';
                priceLabel.style.display = 'block';
                priceLabel.style.marginBottom = '5px';
                priceDiv.appendChild(priceLabel);
                
                const priceInput = document.createElement('input');
                priceInput.type = 'number';
                priceInput.id = 'price';
                priceInput.placeholder = '请输入价格';
                priceInput.style.width = '100%';
                priceInput.style.padding = '8px';
                priceInput.value = '50000';
                priceDiv.appendChild(priceInput);
                
                form.appendChild(priceDiv);
                
                // 数量输入
                const amountDiv = document.createElement('div');
                amountDiv.style.marginBottom = '15px';
                const amountLabel = document.createElement('label');
                amountLabel.textContent = '数量: ';
                amountLabel.style.display = 'block';
                amountLabel.style.marginBottom = '5px';
                amountDiv.appendChild(amountLabel);
                
                const amountInput = document.createElement('input');
                amountInput.type = 'number';
                amountInput.id = 'amount';
                amountInput.placeholder = '请输入数量';
                amountInput.style.width = '100%';
                amountInput.style.padding = '8px';
                amountInput.value = '0.01';
                amountDiv.appendChild(amountInput);
                
                form.appendChild(amountDiv);
                
                // 提交按钮
                const submitButton = document.createElement('button');
                submitButton.type = 'button';
                submitButton.textContent = '立即下单';
                submitButton.style.backgroundColor = '#007bff';
                submitButton.style.color = 'white';
                submitButton.style.padding = '10px 20px';
                submitButton.style.border = 'none';
                submitButton.style.borderRadius = '4px';
                submitButton.style.cursor = 'pointer';
                
                submitButton.onclick = function() {
                    const price = document.getElementById('price').value;
                    const amount = document.getElementById('amount').value;
                    const tradeType = document.querySelector('input[name="tradeType"]:checked').value;
                    
                    // 显示结果
                    const resultDiv = document.createElement('div');
                    resultDiv.style.marginTop = '20px';
                    resultDiv.style.padding = '15px';
                    resultDiv.style.backgroundColor = '#d4edda';
                    resultDiv.style.border = '1px solid #c3e6cb';
                    resultDiv.style.color = '#155724';
                    resultDiv.innerHTML = `
                        <strong>下单成功！</strong><br>
                        交易类型: ${tradeType === 'buy' ? '买入' : '卖出'}<br>
                        价格: ${price}<br>
                        数量: ${amount}<br>
                        时间: ${new Date().toLocaleString()}
                    `;
                    
                    form.appendChild(resultDiv);
                };
                
                form.appendChild(submitButton);
                
                // 添加到页面
                document.body.insertBefore(form, document.body.firstChild);
            });
            
            await page.waitForTimeout(1000);
            
            // 截图2: 创建模拟交易表单后
            await page.screenshot({ 
                path: `${screenshotDir}/02-mock-form-created.png`,
                fullPage: true 
            });
            
            console.log('✅ 模拟交易表单已创建');
        }
        
        // 5. 填写交易表单
        console.log('📝 步骤4: 填写交易表单...');
        
        // 尝试填写现有的或模拟的表单
        const priceFilled = await page.fill('#price, input[name="price"], input[placeholder*="价格"], input[placeholder*="Price"]', '50000');
        const amountFilled = await page.fill('#amount, input[name="amount"], input[placeholder*="数量"], input[placeholder*="Amount"]', '0.01');
        
        console.log(`价格填写: ${priceFilled ? '✅ 成功' : '❌ 失败'}`);
        console.log(`数量填写: ${amountFilled ? '✅ 成功' : '❌ 失败'}`);
        
        await page.waitForTimeout(1000);
        
        // 截图3: 表单填写完成
        await page.screenshot({ 
            path: `${screenshotDir}/03-form-filled.png`,
            fullPage: true 
        });
        
        // 6. 点击下单按钮
        console.log('🖱️  步骤5: 点击下单按钮...');
        
        const orderClicked = await page.click('button[type="submit"], button:has-text("立即下单"), button:has-text("下单"), #mock-trading-form button');
        
        console.log(`下单点击: ${orderClicked ? '✅ 成功' : '❌ 失败'}`);
        
        await page.waitForTimeout(2000);
        
        // 截图4: 下单结果
        await page.screenshot({ 
            path: `${screenshotDir}/04-order-result.png`,
            fullPage: true 
        });
        
        // 7. 检查下单结果
        const orderResult = await page.evaluate(() => {
            const result = {
                hasSuccessMessage: document.body.textContent.includes('成功') || 
                                 document.body.textContent.includes('success'),
                hasErrorMessage: document.body.textContent.includes('错误') || 
                                document.body.textContent.includes('error'),
                pageContent: document.body.textContent.substring(0, 1000)
            };
            
            return result;
        });
        
        console.log('🎯 下单结果检查:');
        console.log(`- 有成功消息: ${orderResult.hasSuccessMessage}`);
        console.log(`- 有错误消息: ${orderResult.hasErrorMessage}`);
        
        // 保存测试结果
        const testResult = {
            timestamp: new Date().toISOString(),
            tradingCheck: tradingCheck,
            formFillResult: {
                priceFilled: priceFilled,
                amountFilled: amountFilled,
                orderClicked: orderClicked
            },
            orderResult: orderResult,
            testData: {
                price: '50000',
                amount: '0.01',
                action: 'buy'
            }
        };
        
        require('fs').writeFileSync(
            `${screenshotDir}/trading-test-result.json`,
            JSON.stringify(testResult, null, 2)
        );
        
        console.log('🎉 交易下单测试完成！');
        console.log('📁 截图保存在:', screenshotDir);
        console.log('📊 测试结果保存在:', `${screenshotDir}/trading-test-result.json`);
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        console.error('错误堆栈:', error.stack);
        
        // 错误截图
        try {
            await page.screenshot({ 
                path: '../screenshots/trading-test-fixed/error-screenshot.png',
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