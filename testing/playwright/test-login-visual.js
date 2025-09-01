const { chromium } = require('playwright');

(async () => {
    console.log('🔐 开始测试登录页面 - 非无头模式对比测试');
    
    // 创建浏览器实例 - 非无头模式，用于对比
    const browser = await chromium.launch({
        headless: false, // 改为非无头模式
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--start-maximized'
        ]
    });
    
    // 创建页面
    const page = await browser.newPage({
        viewport: { width: 1280, height: 720 }
    });
    
    try {
        // 设置超时时间
        page.setDefaultTimeout(30000);
        
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
        
        // 等待额外时间确保渲染完成
        await page.waitForTimeout(3000);
        
        // 创建截图目录
        const screenshotDir = '../screenshots/login-visual-test';
        const fs = require('fs');
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }
        
        // 检查页面渲染状态
        const renderCheck = await page.evaluate(() => {
            const body = document.body;
            const computedStyle = window.getComputedStyle(body);
            
            return {
                bodyBackground: computedStyle.backgroundColor,
                bodyColor: computedStyle.color,
                bodyFontFamily: computedStyle.fontFamily,
                bodyFontSize: computedStyle.fontSize,
                bodyDisplay: computedStyle.display,
                bodyVisibility: computedStyle.visibility,
                hasDarkTheme: body.classList.contains('dark'),
                documentReadyState: document.readyState,
                stylesheetsLoaded: document.styleSheets.length,
                imagesLoaded: document.images.length
            };
        });
        
        console.log('🎨 渲染检查结果:', renderCheck);
        
        // 截图1: 非无头模式初始页面
        console.log('📸 截图1: 非无头模式初始页面...');
        await page.screenshot({ 
            path: `${screenshotDir}/01-visual-initial.png`,
            fullPage: true,
            animations: 'disabled'
        });
        
        // 检查文字元素
        const textElements = await page.evaluate(() => {
            const textElements = [];
            const allElements = document.querySelectorAll('*');
            
            allElements.forEach(element => {
                const text = element.textContent?.trim();
                if (text && text.length > 0 && element.offsetParent !== null) {
                    const style = window.getComputedStyle(element);
                    if (style.display !== 'none' && style.visibility !== 'hidden') {
                        textElements.push({
                            tag: element.tagName,
                            text: text.substring(0, 50),
                            fontSize: style.fontSize,
                            fontFamily: style.fontFamily,
                            color: style.color,
                            backgroundColor: style.backgroundColor,
                            display: style.display,
                            visibility: style.visibility
                        });
                    }
                }
            });
            
            return textElements.slice(0, 20); // 只返回前20个元素
        });
        
        console.log('📝 文字元素检查:', textElements);
        
        // 填写表单
        console.log('📝 填写登录表单...');
        await page.fill('input[type="email"], input[placeholder*="邮箱"]', 'test@example.com');
        await page.waitForTimeout(500);
        
        await page.fill('input[type="password"], input[placeholder*="密码"]', 'password123');
        await page.waitForTimeout(500);
        
        // 截图2: 表单填写完成
        console.log('📸 截图2: 表单填写完成...');
        await page.screenshot({ 
            path: `${screenshotDir}/02-visual-form-filled.png`,
            fullPage: true,
            animations: 'disabled'
        });
        
        // 点击登录
        console.log('🖱️  点击登录按钮...');
        await page.click('button[type="submit"], button:has-text("登录")');
        
        // 等待响应
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 截图3: 登录结果
        console.log('📸 截图3: 登录结果...');
        await page.screenshot({ 
            path: `${screenshotDir}/03-visual-result.png`,
            fullPage: true,
            animations: 'disabled'
        });
        
        console.log('🎯 非无头模式测试完成');
        console.log('请手动检查截图以确认文字是否正确显示');
        
        // 保存渲染检查结果
        const testResult = {
            timestamp: new Date().toISOString(),
            mode: 'non-headless',
            renderCheck: renderCheck,
            textElements: textElements,
            finalUrl: page.url(),
            finalTitle: await page.title()
        };
        
        require('fs').writeFileSync(
            `${screenshotDir}/visual-test-result.json`,
            JSON.stringify(testResult, null, 2)
        );
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        
    } finally {
        // 等待用户手动关闭浏览器
        console.log('🔍 浏览器将保持打开状态，请手动检查页面渲染效果');
        console.log('⏰ 10秒后自动关闭浏览器...');
        
        await page.waitForTimeout(10000);
        
        // 关闭浏览器
        await browser.close();
        console.log('🔚 测试完成，浏览器已关闭');
    }
})();