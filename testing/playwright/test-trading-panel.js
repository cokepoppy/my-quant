#!/usr/bin/env node

const { chromium } = require('playwright');

async function testTradingPanel() {
  console.log('🚀 开始测试交易面板功能...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 访问前端应用
    console.log('📍 访问前端应用...');
    await page.goto('http://localhost:3001');
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    console.log('✅ 前端页面加载成功');
    
    // 检查页面标题
    const title = await page.title();
    console.log(`📄 页面标题: ${title}`);
    
    // 检查是否需要登录
    const loginForm = await page.$('[data-testid="email-input"]');
    if (loginForm) {
      console.log('🔐 检测到登录页面，尝试登录...');
      
      // 使用测试凭据登录
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');
      
      // 等待登录完成
      await page.waitForTimeout(2000);
    }
    
    // 检查是否跳转到交易页面
    await page.waitForURL('/trading', { timeout: 10000 }).catch(() => {
      console.log('⚠️  未自动跳转到交易页面，手动导航...');
      page.goto('/trading');
    });
    
    console.log('✅ 成功进入交易页面');
    
    // 截图保存当前状态
    await page.screenshot({ path: 'trading-panel-initial.png' });
    console.log('📸 已保存初始状态截图');
    
    // 测试1: 检查交易面板基本元素
    console.log('\n📋 测试1: 检查交易面板基本元素');
    
    const elementsToCheck = [
      { selector: '[data-testid="add-exchange-btn"]', name: '添加交易所按钮' },
      { selector: '.exchange-tabs', name: '交易所选项卡' },
      { selector: '.trading-form', name: '交易表单' },
      { selector: '[data-testid="symbol-select"]', name: '交易对选择' },
      { selector: '[data-testid="buy-button"]', name: '买入按钮' },
      { selector: '[data-testid="sell-button"]', name: '卖出按钮' }
    ];
    
    for (const element of elementsToCheck) {
      const isVisible = await page.isVisible(element.selector).catch(() => false);
      console.log(`  ${isVisible ? '✅' : '❌'} ${element.name}: ${isVisible ? '可见' : '不可见'}`);
    }
    
    // 测试2: 尝试添加交易所
    console.log('\n📋 测试2: 尝试添加交易所');
    
    const addExchangeBtn = await page.$('[data-testid="add-exchange-btn"]');
    if (addExchangeBtn) {
      await addExchangeBtn.click();
      console.log('✅ 点击添加交易所按钮');
      
      // 等待对话框出现
      await page.waitForTimeout(1000);
      
      // 检查对话框元素
      const dialogVisible = await page.isVisible('[data-testid="exchange-dialog"]').catch(() => false);
      console.log(`  交易所对话框: ${dialogVisible ? '可见' : '不可见'}`);
      
      if (dialogVisible) {
        // 填写测试表单
        await page.fill('[data-testid="exchange-name"]', 'Test Exchange');
        await page.selectOption('[data-testid="exchange-type"]', 'bybit');
        await page.fill('[data-testid="api-key"]', 'test_api_key_123');
        await page.fill('[data-testid="api-secret"]', 'test_api_secret_456');
        await page.check('[data-testid="testnet"]');
        
        console.log('✅ 填写交易所表单完成');
        
        // 截图保存表单状态
        await page.screenshot({ path: 'exchange-form-filled.png' });
        
        // 关闭对话框
        await page.click('.el-dialog__headerbtn .el-dialog__close');
        console.log('✅ 关闭交易所对话框');
      }
    }
    
    // 测试3: 检查交易表单功能
    console.log('\n📋 测试3: 检查交易表单功能');
    
    // 检查交易对选择
    const symbolSelect = await page.$('[data-testid="symbol-select"]');
    if (symbolSelect) {
      const options = await page.$$eval('[data-testid="symbol-select"] option', options => 
        options.map(option => option.textContent)
      );
      console.log(`  可用交易对: ${options.join(', ')}`);
    }
    
    // 检查交易类型选择
    const orderTypeButtons = await page.$$('.el-radio-button__inner');
    console.log(`  订单类型按钮数量: ${orderTypeButtons.length}`);
    
    // 测试4: 尝试填写交易表单
    console.log('\n📋 测试4: 尝试填写交易表单');
    
    try {
      // 选择交易对
      await page.selectOption('[data-testid="symbol-select"]', 'BTC/USDT');
      console.log('✅ 选择交易对: BTC/USDT');
      
      // 选择买入方向
      await page.click('input[value="buy"]');
      console.log('✅ 选择买入方向');
      
      // 选择市价单
      await page.click('input[value="market"]');
      console.log('✅ 选择市价单');
      
      // 输入数量
      await page.fill('[data-testid="order-amount"]', '0.001');
      console.log('✅ 输入数量: 0.001');
      
      // 截图保存表单状态
      await page.screenshot({ path: 'trading-form-filled.png' });
      console.log('✅ 交易表单填写完成');
      
      // 检查下单按钮状态
      const buyButton = await page.$('[data-testid="buy-button"]');
      const isDisabled = await buyButton.isDisabled();
      console.log(`  买入按钮状态: ${isDisabled ? '禁用' : '可用'}`);
      
    } catch (error) {
      console.log(`❌ 交易表单测试失败: ${error.message}`);
    }
    
    // 测试5: 检查持仓和订单区域
    console.log('\n📋 测试5: 检查持仓和订单区域');
    
    const positionsSection = await page.$('.positions-section');
    const ordersSection = await page.$('.orders-section');
    
    console.log(`  持仓区域: ${positionsSection ? '可见' : '不可见'}`);
    console.log(`  订单区域: ${ordersSection ? '可见' : '不可见'}`);
    
    // 最终截图
    await page.screenshot({ path: 'trading-panel-final.png' });
    console.log('📸 已保存最终状态截图');
    
    console.log('\n🎯 交易面板功能测试完成');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    
    // 错误截图
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('📸 已保存错误状态截图');
    
  } finally {
    await browser.close();
  }
}

// 运行测试
testTradingPanel().catch(console.error);