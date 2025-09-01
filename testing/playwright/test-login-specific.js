const { chromium } = require('playwright');

(async () => {
    console.log('🔐 开始测试登录页面 - test@example.com 账户');
    
    // 创建浏览器实例 - 无头模式
    const browser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    });
    
    // 创建页面
    const page = await browser.newPage();
    
    try {
        // 设置超时时间
        page.setDefaultTimeout(30000);
        
        // 导航到登录页面
        console.log('📱 导航到登录页面...');
        await page.goto('http://localhost:3001/login', { 
            waitUntil: 'networkidle',
            timeout: 10000 
        });
        
        // 等待页面加载
        await page.waitForLoadState('domcontentloaded');
        
        // 创建登录截图目录
        const screenshotDir = '../screenshots/login';
        const fs = require('fs');
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }
        
        // 截图1: 初始登录页面
        await page.screenshot({ 
            path: `${screenshotDir}/01-initial-page.png`,
            fullPage: true 
        });
        console.log('📸 已保存初始页面截图');
        
        // 获取页面标题和URL
        const title = await page.title();
        const url = page.url();
        console.log(`📄 页面标题: ${title}`);
        console.log(`🔗 当前URL: ${url}`);
        
        // 分析页面结构
        const pageAnalysis = await page.evaluate(() => {
            const result = {
                title: document.title,
                url: window.location.href,
                forms: [],
                inputs: [],
                buttons: [],
                links: []
            };
            
            // 查找所有表单
            document.querySelectorAll('form').forEach((form, index) => {
                result.forms.push({
                    index: index,
                    action: form.action,
                    method: form.method,
                    id: form.id,
                    className: form.className
                });
            });
            
            // 查找所有输入框
            document.querySelectorAll('input').forEach((input, index) => {
                result.inputs.push({
                    index: index,
                    type: input.type,
                    name: input.name,
                    id: input.id,
                    placeholder: input.placeholder,
                    className: input.className,
                    required: input.required
                });
            });
            
            // 查找所有按钮
            document.querySelectorAll('button').forEach((button, index) => {
                result.buttons.push({
                    index: index,
                    type: button.type,
                    text: button.textContent?.trim(),
                    id: button.id,
                    className: button.className
                });
            });
            
            // 查找所有链接
            document.querySelectorAll('a').forEach((link, index) => {
                result.links.push({
                    index: index,
                    text: link.textContent?.trim(),
                    href: link.href,
                    id: link.id,
                    className: link.className
                });
            });
            
            return result;
        });
        
        console.log('🔍 页面分析结果:');
        console.log(`- 表单数量: ${pageAnalysis.forms.length}`);
        console.log(`- 输入框数量: ${pageAnalysis.inputs.length}`);
        console.log(`- 按钮数量: ${pageAnalysis.buttons.length}`);
        console.log(`- 链接数量: ${pageAnalysis.links.length}`);
        
        // 截图2: 表单分析完成
        await page.screenshot({ 
            path: `${screenshotDir}/02-form-analysis.png`,
            fullPage: true 
        });
        console.log('📸 已保存表单分析截图');
        
        // 填写登录表单
        console.log('📝 开始填写登录表单...');
        
        // 查找并填写邮箱
        const emailFilled = await page.fill('input[type="email"], input[name="email"], input[placeholder*="邮箱"], input[placeholder*="email"], input[id*="email"], input[class*="email"]', 'test@example.com');
        if (!emailFilled) {
            console.log('⚠️  未找到邮箱输入框，尝试其他选择器...');
            await page.fill('input[placeholder*="请输入"], input[placeholder*="输入"], input:not([type="password"])', 'test@example.com');
        }
        console.log('✅ 邮箱填写完成');
        
        // 截图3: 邮箱填写完成
        await page.screenshot({ 
            path: `${screenshotDir}/03-email-filled.png`,
            fullPage: true 
        });
        console.log('📸 已保存邮箱填写截图');
        
        // 查找并填写密码
        const passwordFilled = await page.fill('input[type="password"], input[name="password"], input[placeholder*="密码"], input[placeholder*="password"], input[id*="password"], input[class*="password"]', 'password123');
        if (!passwordFilled) {
            console.log('⚠️  未找到密码输入框，尝试其他选择器...');
            await page.fill('input[type="password"]', 'password123');
        }
        console.log('✅ 密码填写完成');
        
        // 截图4: 密码填写完成
        await page.screenshot({ 
            path: `${screenshotDir}/04-password-filled.png`,
            fullPage: true 
        });
        console.log('📸 已保存密码填写截图');
        
        // 查找并点击登录按钮
        console.log('🖱️  查找登录按钮...');
        
        const loginClicked = await Promise.race([
            // 尝试多种选择器
            page.click('button[type="submit"], button:has-text("登录"), button:has-text("Login"), button:has-text("Sign in"), button:has-text("登陆"), input[type="submit"]'),
            page.click('button:has-text("登录")'),
            page.click('button:has-text("Login")'),
            page.click('button:has-text("Sign in")'),
            page.click('button:has-text("登陆")'),
            page.click('button'),
            new Promise(resolve => setTimeout(() => resolve(false), 5000))
        ]);
        
        if (loginClicked === false) {
            console.log('⚠️  未找到登录按钮，尝试通过表单提交...');
            await page.evaluate(() => {
                const forms = document.querySelectorAll('form');
                if (forms.length > 0) {
                    forms[0].submit();
                }
            });
        } else {
            console.log('✅ 登录按钮点击成功');
        }
        
        // 截图5: 登录提交完成
        await page.screenshot({ 
            path: `${screenshotDir}/05-login-submitted.png`,
            fullPage: true 
        });
        console.log('📸 已保存登录提交截图');
        
        // 等待页面响应
        console.log('⏳ 等待登录响应...');
        await page.waitForTimeout(3000);
        
        // 获取登录后的状态
        const afterLoginUrl = page.url();
        const afterLoginTitle = await page.title();
        
        console.log(`🔗 登录后URL: ${afterLoginUrl}`);
        console.log(`📄 登录后标题: ${afterLoginTitle}`);
        
        // 检查是否登录成功
        const loginSuccess = afterLoginUrl.includes('/dashboard') || 
                           afterLoginUrl.includes('/home') || 
                           afterLoginUrl.includes('/index') ||
                           afterLoginUrl !== 'http://localhost:3001/login';
        
        // 截图6: 最终结果
        await page.screenshot({ 
            path: `${screenshotDir}/06-final-result.png`,
            fullPage: true 
        });
        console.log('📸 已保存最终结果截图');
        
        // 输出测试结果
        console.log('\n🎯 登录测试结果:');
        console.log('====================');
        console.log(`测试账户: test@example.com`);
        console.log(`测试密码: password123`);
        console.log(`初始URL: ${url}`);
        console.log(`最终URL: ${afterLoginUrl}`);
        console.log(`登录状态: ${loginSuccess ? '✅ 成功' : '❌ 失败'}`);
        
        if (loginSuccess) {
            console.log('🎉 登录测试通过！');
        } else {
            console.log('❌ 登录测试失败，请检查账户信息或服务器状态');
        }
        
        // 保存测试结果到文件
        const testResult = {
            timestamp: new Date().toISOString(),
            testAccount: 'test@example.com',
            testPassword: 'password123',
            initialUrl: url,
            finalUrl: afterLoginUrl,
            initialTitle: title,
            finalTitle: afterLoginTitle,
            loginSuccess: loginSuccess,
            pageAnalysis: pageAnalysis
        };
        
        require('fs').writeFileSync(
            `${screenshotDir}/login-test-result.json`,
            JSON.stringify(testResult, null, 2)
        );
        
        console.log(`📊 测试结果已保存到 ${screenshotDir}/login-test-result.json`);
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        
        // 错误截图
        try {
            await page.screenshot({ 
                path: `${screenshotDir}/error-screenshot.png`,
                fullPage: true 
            });
            console.log('📸 已保存错误截图');
        } catch (screenshotError) {
            console.error('截图失败:', screenshotError.message);
        }
        
    } finally {
        // 关闭浏览器
        await browser.close();
        console.log('🔚 测试完成，浏览器已关闭');
    }
})();