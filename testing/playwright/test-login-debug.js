const { chromium } = require('playwright');

(async () => {
    console.log('🔐 简化版登录测试 - 专门检查渲染问题');
    
    // 创建浏览器实例
    const browser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--enable-font-antialiasing',
            '--force-color-profile=srgb'
        ]
    });
    
    const page = await browser.newPage({
        viewport: { width: 1280, height: 720 }
    });
    
    try {
        console.log('📱 导航到登录页面...');
        await page.goto('http://localhost:3001/login', { 
            waitUntil: 'networkidle',
            timeout: 10000 
        });
        
        // 等待页面完全加载
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);
        
        // 检查页面是否有内容
        const pageContent = await page.evaluate(() => {
            return {
                title: document.title,
                bodyInnerHTML: document.body.innerHTML.substring(0, 1000),
                hasLoginForm: !!document.querySelector('form'),
                hasInputs: document.querySelectorAll('input').length,
                hasButtons: document.querySelectorAll('button').length,
                hasText: document.body.textContent.length > 0,
                bodyClasses: document.body.className
            };
        });
        
        console.log('📄 页面内容检查:', pageContent);
        
        // 创建截图目录
        const fs = require('fs');
        const screenshotDir = '../screenshots/debug-render';
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }
        
        // 截图1: 基本页面
        await page.screenshot({ 
            path: `${screenshotDir}/01-basic-page.png`,
            fullPage: true
        });
        
        // 检查CSS是否加载
        const cssCheck = await page.evaluate(() => {
            const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
            return {
                stylesCount: styles.length,
                styleSheets: Array.from(document.styleSheets).map(sheet => ({
                    href: sheet.href,
                    rules: sheet.cssRules ? sheet.cssRules.length : 0
                }))
            };
        });
        
        console.log('🎨 CSS检查:', cssCheck);
        
        // 检查字体
        const fontCheck = await page.evaluate(() => {
            const testElement = document.querySelector('body') || document.querySelector('div');
            if (!testElement) return { noElement: true };
            
            const style = window.getComputedStyle(testElement);
            return {
                fontFamily: style.fontFamily,
                fontSize: style.fontSize,
                color: style.color,
                backgroundColor: style.backgroundColor,
                display: style.display,
                visibility: style.visibility,
                opacity: style.opacity
            };
        });
        
        console.log('🔤 字体检查:', fontCheck);
        
        // 尝试强制等待更长时间
        console.log('⏳ 等待更长时间确保渲染完成...');
        await page.waitForTimeout(5000);
        
        // 截图2: 等待后的页面
        await page.screenshot({ 
            path: `${screenshotDir}/02-after-wait.png`,
            fullPage: true
        });
        
        // 检查是否有iframe或其他内容
        const iframeCheck = await page.evaluate(() => {
            return {
                iframes: document.querySelectorAll('iframe').length,
                frames: window.frames.length,
                hasShadowDOM: !!document.querySelector('*').shadowRoot
            };
        });
        
        console.log('🪟 iframe检查:', iframeCheck);
        
        // 检查控制台错误
        page.on('console', msg => {
            console.log(`🖥️  控制台 ${msg.type()}: ${msg.text()}`);
        });
        
        page.on('pageerror', error => {
            console.log(`❌ 页面错误: ${error.message}`);
        });
        
        // 最后再等一会儿
        await page.waitForTimeout(2000);
        
        // 截图3: 最终页面
        await page.screenshot({ 
            path: `${screenshotDir}/03-final-page.png`,
            fullPage: true
        });
        
        // 保存调试信息
        const debugInfo = {
            timestamp: new Date().toISOString(),
            pageContent: pageContent,
            cssCheck: cssCheck,
            fontCheck: fontCheck,
            iframeCheck: iframeCheck,
            userAgent: await page.evaluate(() => navigator.userAgent),
            viewport: await page.viewportSize()
        };
        
        require('fs').writeFileSync(
            `${screenshotDir}/debug-info.json`,
            JSON.stringify(debugInfo, null, 2)
        );
        
        console.log('🔍 调试信息已保存到', `${screenshotDir}/debug-info.json`);
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        console.error('错误堆栈:', error.stack);
        
    } finally {
        await browser.close();
        console.log('🔚 测试完成');
    }
})();