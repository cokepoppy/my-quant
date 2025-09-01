const { chromium } = require('playwright');

(async () => {
    console.log('🔐 开始测试登录页面 - 改进版本，确保正确渲染');
    
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
            '--disable-gpu',
            '--enable-font-antialiasing',
            '--force-color-profile=srgb',
            '--disable-features=VizDisplayCompositor'
        ]
    });
    
    // 创建页面
    const page = await browser.newPage({
        viewport: { width: 1280, height: 720 }
    });
    
    try {
        // 设置超时时间
        page.setDefaultTimeout(30000);
        
        // 监听网络请求，确保资源加载完成
        let resourcesLoaded = 0;
        let totalResources = 0;
        
        page.on('request', request => {
            totalResources++;
        });
        
        page.on('response', response => {
            resourcesLoaded++;
        });
        
        // 导航到登录页面
        console.log('📱 导航到登录页面...');
        await page.goto('http://localhost:3001/login', { 
            waitUntil: 'networkidle',
            timeout: 15000 
        });
        
        // 等待页面完全加载
        console.log('⏳ 等待页面完全加载...');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForLoadState('networkidle');
        
        // 额外等待CSS和字体加载
        await page.waitForTimeout(2000);
        
        // 检查页面是否正确加载
        const pageCheck = await page.evaluate(() => {
            return {
                title: document.title,
                bodyClasses: document.body.className,
                hasStyles: document.querySelectorAll('style, link[rel="stylesheet"]').length > 0,
                hasFonts: document.querySelectorAll('link[rel="preload"][as="font"]').length > 0,
                formExists: document.querySelectorAll('form').length > 0,
                inputsExist: document.querySelectorAll('input').length > 0,
                buttonsExist: document.querySelectorAll('button').length > 0
            };
        });
        
        console.log('🔍 页面检查结果:', pageCheck);
        
        // 创建登录截图目录
        const screenshotDir = '../screenshots/login-fixed';
        const fs = require('fs');
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }
        
        // 截图1: 初始登录页面 - 确保渲染完成
        console.log('📸 截图1: 初始页面...');
        await page.screenshot({ 
            path: `${screenshotDir}/01-initial-page.png`,
            fullPage: true,
            animations: 'disabled'
        });
        
        // 获取页面内容检查
        const contentCheck = await page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input'));
            const buttons = Array.from(document.querySelectorAll('button'));
            const forms = Array.from(document.querySelectorAll('form'));
            
            return {
                inputs: inputs.map(input => ({
                    type: input.type,
                    placeholder: input.placeholder,
                    value: input.value,
                    visible: input.offsetParent !== null,
                    computedStyle: window.getComputedStyle(input).display
                })),
                buttons: buttons.map(button => ({
                    text: button.textContent?.trim(),
                    visible: button.offsetParent !== null,
                    computedStyle: window.getComputedStyle(button).display
                })),
                forms: forms.map(form => ({
                    action: form.action,
                    visible: form.offsetParent !== null
                }))
            };
        });
        
        console.log('📋 内容检查:', JSON.stringify(contentCheck, null, 2));
        
        // 填写登录表单
        console.log('📝 填写登录表单...');
        
        // 查找邮箱输入框
        const emailInput = await page.waitForSelector('input[type="email"], input[placeholder*="邮箱"], input[placeholder*="email"]', { timeout: 5000 });
        await emailInput.fill('test@example.com');
        console.log('✅ 邮箱填写完成');
        
        // 截图2: 邮箱填写完成
        await page.screenshot({ 
            path: `${screenshotDir}/02-email-filled.png`,
            fullPage: true,
            animations: 'disabled'
        });
        
        // 查找密码输入框
        const passwordInput = await page.waitForSelector('input[type="password"], input[placeholder*="密码"], input[placeholder*="password"]', { timeout: 5000 });
        await passwordInput.fill('password123');
        console.log('✅ 密码填写完成');
        
        // 截图3: 密码填写完成
        await page.screenshot({ 
            path: `${screenshotDir}/03-password-filled.png`,
            fullPage: true,
            animations: 'disabled'
        });
        
        // 查找登录按钮
        const loginButton = await page.waitForSelector('button[type="submit"], button:has-text("登录"), button:has-text("Login")', { timeout: 5000 });
        
        // 截图4: 登录前状态
        await page.screenshot({ 
            path: `${screenshotDir}/04-before-login.png`,
            fullPage: true,
            animations: 'disabled'
        });
        
        // 点击登录按钮
        console.log('🖱️  点击登录按钮...');
        await loginButton.click();
        
        // 等待页面响应
        console.log('⏳ 等待登录响应...');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 截图5: 登录后结果
        await page.screenshot({ 
            path: `${screenshotDir}/05-after-login.png`,
            fullPage: true,
            animations: 'disabled'
        });
        
        // 获取登录结果
        const finalUrl = page.url();
        const finalTitle = await page.title();
        
        console.log('🎯 登录测试结果:');
        console.log('====================');
        console.log(`测试账户: test@example.com`);
        console.log(`初始URL: http://localhost:3001/login`);
        console.log(`最终URL: ${finalUrl}`);
        console.log(`页面标题: ${finalTitle}`);
        console.log(`登录状态: ${finalUrl.includes('/login') ? '❌ 失败' : '✅ 成功'}`);
        
        // 保存测试结果
        const testResult = {
            timestamp: new Date().toISOString(),
            testAccount: 'test@example.com',
            testPassword: 'password123',
            initialUrl: 'http://localhost:3001/login',
            finalUrl: finalUrl,
            finalTitle: finalTitle,
            loginSuccess: !finalUrl.includes('/login'),
            pageCheck: pageCheck,
            contentCheck: contentCheck
        };
        
        require('fs').writeFileSync(
            `${screenshotDir}/login-test-result.json`,
            JSON.stringify(testResult, null, 2)
        );
        
        console.log(`📊 测试结果已保存到 ${screenshotDir}/login-test-result.json`);
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        console.error('错误堆栈:', error.stack);
        
        // 错误截图
        try {
            await page.screenshot({ 
                path: '../screenshots/login-fixed/error-screenshot.png',
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