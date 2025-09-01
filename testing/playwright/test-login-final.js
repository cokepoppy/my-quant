const { chromium } = require('playwright');

(async () => {
    console.log('🔐 最终优化版登录测试 - 解决文字渲染问题');
    
    // 创建浏览器实例 - 使用更优化的配置
    const browser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-features=VizDisplayCompositor',
            '--disable-gpu-driver-bug-workarounds',
            '--disable-gpu-sandbox',
            '--disable-software-rasterizer',
            '--disable-extensions',
            '--disable-low-res-tiling',
            '--disable-low-end-device-mode',
            '--enable-font-antialiasing',
            '--force-color-profile=srgb',
            '--disable-2d-canvas-clip-aa',
            '--disable-accelerated-2d-canvas',
            '--disable-web-security', // 可能有助于字体加载
            '--allow-running-insecure-content'
        ]
    });
    
    const page = await browser.newPage({
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true
    });
    
    try {
        console.log('📱 导航到登录页面...');
        
        // 设置更长的超时时间
        page.setDefaultTimeout(60000);
        
        // 监听控制台消息
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`❌ 控制台错误: ${msg.text()}`);
            }
        });
        
        page.on('pageerror', error => {
            console.log(`❌ 页面错误: ${error.message}`);
        });
        
        // 导航到登录页面
        await page.goto('http://localhost:3001/login', { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });
        
        // 等待Vue应用完全挂载
        console.log('⏳ 等待Vue应用挂载...');
        await page.waitForSelector('#app[data-v-app]', { timeout: 30000 });
        
        // 等待关键元素出现
        console.log('⏳ 等待关键元素加载...');
        await page.waitForSelector('form', { timeout: 10000 });
        await page.waitForSelector('input[type="email"], input[placeholder*="邮箱"]', { timeout: 10000 });
        await page.waitForSelector('button', { timeout: 10000 });
        
        // 等待所有网络请求完成
        console.log('⏳ 等待网络请求完成...');
        await page.waitForLoadState('networkidle');
        
        // 额外等待确保样式完全应用
        console.log('⏳ 等待样式完全应用...');
        await page.waitForTimeout(3000);
        
        // 强制触发重绘
        await page.evaluate(() => {
            document.body.style.display = 'none';
            document.body.offsetHeight; // 触发重排
            document.body.style.display = '';
        });
        
        await page.waitForTimeout(1000);
        
        // 创建截图目录
        const fs = require('fs');
        const screenshotDir = '../screenshots/login-final';
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }
        
        // 验证页面状态
        const pageState = await page.evaluate(() => {
            const loginForm = document.querySelector('form');
            const emailInput = document.querySelector('input[type="email"], input[placeholder*="邮箱"]');
            const passwordInput = document.querySelector('input[type="password"], input[placeholder*="密码"]');
            const loginButton = document.querySelector('button');
            
            return {
                hasLoginForm: !!loginForm,
                hasEmailInput: !!emailInput,
                hasPasswordInput: !!passwordInput,
                hasLoginButton: !!loginButton,
                emailInputVisible: emailInput ? emailInput.offsetParent !== null : false,
                passwordInputVisible: passwordInput ? passwordInput.offsetParent !== null : false,
                loginButtonVisible: loginButton ? loginButton.offsetParent !== null : false,
                bodyClasses: document.body.className,
                appElement: !!document.querySelector('#app[data-v-app]')
            };
        });
        
        console.log('📊 页面状态:', pageState);
        
        // 截图1: 完全加载的页面
        console.log('📸 截图1: 完全加载的页面...');
        await page.screenshot({ 
            path: `${screenshotDir}/01-fully-loaded.png`,
            fullPage: true,
            animations: 'disabled',
            caret: 'hide'
        });
        
        // 填写表单
        console.log('📝 填写登录表单...');
        
        // 填写邮箱
        await page.fill('input[type="email"], input[placeholder*="邮箱"]', 'test@example.com');
        await page.waitForTimeout(500);
        
        // 截图2: 邮箱填写完成
        console.log('📸 截图2: 邮箱填写完成...');
        await page.screenshot({ 
            path: `${screenshotDir}/02-email-filled.png`,
            fullPage: true,
            animations: 'disabled',
            caret: 'hide'
        });
        
        // 填写密码
        await page.fill('input[type="password"], input[placeholder*="密码"]', 'password123');
        await page.waitForTimeout(500);
        
        // 截图3: 密码填写完成
        console.log('📸 截图3: 密码填写完成...');
        await page.screenshot({ 
            path: `${screenshotDir}/03-password-filled.png`,
            fullPage: true,
            animations: 'disabled',
            caret: 'hide'
        });
        
        // 点击登录
        console.log('🖱️  点击登录按钮...');
        await page.click('button');
        
        // 等待登录完成
        console.log('⏳ 等待登录完成...');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 截图4: 登录结果
        console.log('📸 截图4: 登录结果...');
        await page.screenshot({ 
            path: `${screenshotDir}/04-login-result.png`,
            fullPage: true,
            animations: 'disabled',
            caret: 'hide'
        });
        
        // 获取最终状态
        const finalState = {
            url: page.url(),
            title: await page.title(),
            loginSuccess: !page.url().includes('/login')
        };
        
        console.log('🎯 最终状态:', finalState);
        
        // 保存测试结果
        const testResult = {
            timestamp: new Date().toISOString(),
            pageState: pageState,
            finalState: finalState,
            testAccount: 'test@example.com',
            testPassword: 'password123'
        };
        
        require('fs').writeFileSync(
            `${screenshotDir}/final-test-result.json`,
            JSON.stringify(testResult, null, 2)
        );
        
        console.log('🎉 测试完成！');
        console.log('📁 截图保存在:', screenshotDir);
        console.log('📊 测试结果保存在:', `${screenshotDir}/final-test-result.json`);
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        console.error('错误堆栈:', error.stack);
        
        // 错误截图
        try {
            await page.screenshot({ 
                path: '../screenshots/login-final/error-screenshot.png',
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