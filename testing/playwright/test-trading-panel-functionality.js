#!/usr/bin/env node

/**
 * 交易面板功能测试脚本
 * 使用 Node.js 直接测试，无需浏览器
 */

const fs = require('fs');
const path = require('path');

class TradingPanelTester {
  constructor() {
    this.results = {
      startTime: new Date(),
      endTime: null,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      testResults: []
    };
    
    this.testResultsDir = path.join(__dirname, 'test-results');
    this.ensureTestResultsDir();
  }

  ensureTestResultsDir() {
    if (!fs.existsSync(this.testResultsDir)) {
      fs.mkdirSync(this.testResultsDir, { recursive: true });
    }
  }

  logTest(testName, passed, message = '') {
    const result = {
      test: testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.results.testResults.push(result);
    this.results.totalTests++;
    
    if (passed) {
      this.results.passedTests++;
      console.log(`✅ ${testName} - ${message}`);
    } else {
      this.results.failedTests++;
      console.log(`❌ ${testName} - ${message}`);
    }
  }

  async runAllTests() {
    console.log('🚀 开始运行交易面板功能测试');
    console.log('='.repeat(60));
    
    // 运行所有测试
    this.testFileStructure();
    this.testConfiguration();
    this.testAPIEndpoints();
    this.testWebSocketSetup();
    this.testRiskManagement();
    this.testDatabaseSchema();
    this.testFrontendComponents();
    this.testBackendServices();
    
    this.results.endTime = new Date();
    this.generateReport();
    this.displaySummary();
  }

  testFileStructure() {
    console.log('\n📁 测试文件结构...');
    
    const requiredFiles = [
      'frontend/src/views/trading/TradingPanel.vue',
      'frontend/src/api/trading.ts',
      'backend/src/routes/trading.ts',
      'backend/src/socket/trading.ts',
      'backend/src/services/RiskManagementService.ts',
      'prisma/schema.prisma',
      'playwright.config.ts'
    ];
    
    const optionalFiles = [
      'tests/e2e/trading/trading-operations.spec.ts',
      'tests/e2e/pages/TradingPage.ts',
      'tests/e2e/pages/LoginPage.ts',
      'tests/e2e/utils/test-utils.ts'
    ];
    
    // 测试必需文件
    for (const filePath of requiredFiles) {
      const exists = fs.existsSync(path.join(__dirname, filePath));
      this.logTest(
        `文件存在: ${filePath}`,
        exists,
        exists ? '文件存在' : '文件不存在'
      );
    }
    
    // 测试可选文件
    for (const filePath of optionalFiles) {
      const exists = fs.existsSync(path.join(__dirname, filePath));
      this.logTest(
        `测试文件: ${filePath}`,
        exists,
        exists ? '测试文件存在' : '测试文件不存在（可选）'
      );
    }
    
    // 测试目录结构
    const requiredDirs = [
      'frontend/src/views/trading',
      'frontend/src/api',
      'backend/src/routes',
      'backend/src/socket',
      'backend/src/services',
      'tests/e2e'
    ];
    
    for (const dirPath of requiredDirs) {
      const exists = fs.existsSync(path.join(__dirname, dirPath));
      this.logTest(
        `目录存在: ${dirPath}`,
        exists,
        exists ? '目录存在' : '目录不存在'
      );
    }
  }

  testConfiguration() {
    console.log('\n⚙️ 测试配置文件...');
    
    // 测试 Playwright 配置
    const playwrightConfig = path.join(__dirname, 'playwright.config.ts');
    if (fs.existsSync(playwrightConfig)) {
      const configContent = fs.readFileSync(playwrightConfig, 'utf8');
      
      this.logTest(
        'Playwright 配置文件',
        true,
        '配置文件存在'
      );
      
      // 检查关键配置项
      const hasTestDir = configContent.includes('testDir');
      const hasProjects = configContent.includes('projects');
      const hasReporter = configContent.includes('reporter');
      
      this.logTest(
        'Playwright testDir 配置',
        hasTestDir,
        hasTestDir ? 'testDir 已配置' : 'testDir 未配置'
      );
      
      this.logTest(
        'Playwright projects 配置',
        hasProjects,
        hasProjects ? 'projects 已配置' : 'projects 未配置'
      );
      
      this.logTest(
        'Playwright reporter 配置',
        hasReporter,
        hasReporter ? 'reporter 已配置' : 'reporter 未配置'
      );
    } else {
      this.logTest(
        'Playwright 配置文件',
        false,
        '配置文件不存在'
      );
    }
    
    // 测试环境变量配置
    const envFiles = ['.env', '.env.example', '.env.local'];
    for (const envFile of envFiles) {
      const exists = fs.existsSync(path.join(__dirname, envFile));
      this.logTest(
        `环境变量文件: ${envFile}`,
        exists,
        exists ? '环境变量文件存在' : '环境变量文件不存在'
      );
    }
  }

  testAPIEndpoints() {
    console.log('\n🌐 测试 API 端点...');
    
    // 测试前端 API 定义
    const frontendApiPath = path.join(__dirname, 'frontend/src/api/trading.ts');
    if (fs.existsSync(frontendApiPath)) {
      const apiContent = fs.readFileSync(frontendApiPath, 'utf8');
      
      // 检查关键 API 函数
      const requiredFunctions = [
        'placeOrder',
        'getOrders',
        'getPositions',
        'closePosition',
        'getAccountBalance',
        'getMarketData'
      ];
      
      for (const funcName of requiredFunctions) {
        const hasFunction = apiContent.includes(`export const ${funcName}`) || 
                           apiContent.includes(`export function ${funcName}`);
        this.logTest(
          `API 函数: ${funcName}`,
          hasFunction,
          hasFunction ? `${funcName} 已定义` : `${funcName} 未定义`
        );
      }
      
      // 检查类型定义
      const hasTypeScript = apiContent.includes(':') && apiContent.includes('interface');
      this.logTest(
        'TypeScript 类型定义',
        hasTypeScript,
        hasTypeScript ? '类型定义已添加' : '类型定义缺失'
      );
    }
    
    // 测试后端路由
    const backendRoutesPath = path.join(__dirname, 'backend/src/routes/trading.ts');
    if (fs.existsSync(backendRoutesPath)) {
      const routesContent = fs.readFileSync(backendRoutesPath, 'utf8');
      
      // 检查关键路由
      const requiredRoutes = [
        'router.get(\'/orders\')',
        'router.post(\'/order\')',
        'router.get(\'/positions\')',
        'router.post(\'/position/close\')',
        'router.get(\'/balance\')',
        'router.get(\'/market-data\')'
      ];
      
      for (const route of requiredRoutes) {
        const hasRoute = routesContent.includes(route);
        this.logTest(
          `路由: ${route}`,
          hasRoute,
          hasRoute ? `${route} 已定义` : `${route} 未定义`
        );
      }
      
      // 检查中间件
      const hasAuth = routesContent.includes('authenticate');
      const hasValidation = routesContent.includes('body(');
      
      this.logTest(
        '认证中间件',
        hasAuth,
        hasAuth ? '认证中间件已添加' : '认证中间件缺失'
      );
      
      this.logTest(
        '数据验证',
        hasValidation,
        hasValidation ? '数据验证已添加' : '数据验证缺失'
      );
    }
  }

  testWebSocketSetup() {
    console.log('\n📡 测试 WebSocket 设置...');
    
    const socketPath = path.join(__dirname, 'backend/src/socket/trading.ts');
    if (fs.existsSync(socketPath)) {
      const socketContent = fs.readFileSync(socketPath, 'utf8');
      
      // 检查 WebSocket 处理器
      const hasClass = socketContent.includes('class TradingWebSocketHandler');
      const hasConnection = socketContent.includes('connection');
      const hasSubscription = socketContent.includes('subscribe:account');
      const hasOrderEvents = socketContent.includes('place:order');
      
      this.logTest(
        'WebSocket 处理器类',
        hasClass,
        hasClass ? 'WebSocket 处理器已定义' : 'WebSocket 处理器未定义'
      );
      
      this.logTest(
        '连接处理',
        hasConnection,
        hasConnection ? '连接处理已添加' : '连接处理缺失'
      );
      
      this.logTest(
        '订阅功能',
        hasSubscription,
        hasSubscription ? '订阅功能已添加' : '订阅功能缺失'
      );
      
      this.logTest(
        '订单事件',
        hasOrderEvents,
        hasOrderEvents ? '订单事件已添加' : '订单事件缺失'
      );
      
      // 检查事件类型
      const eventTypes = [
        'order:update',
        'position:update',
        'balance:update',
        'ticker:update'
      ];
      
      for (const eventType of eventTypes) {
        const hasEvent = socketContent.includes(eventType);
        this.logTest(
          `事件类型: ${eventType}`,
          hasEvent,
          hasEvent ? `${eventType} 已支持` : `${eventType} 未支持`
        );
      }
    }
  }

  testRiskManagement() {
    console.log('\n🛡️ 测试风险管理...');
    
    const riskServicePath = path.join(__dirname, 'backend/src/services/RiskManagementService.ts');
    if (fs.existsSync(riskServicePath)) {
      const riskContent = fs.readFileSync(riskServicePath, 'utf8');
      
      // 检查风险管理类
      const hasClass = riskContent.includes('class RiskManagementService');
      const hasAssessment = riskContent.includes('assessTradeRisk');
      const hasValidation = riskContent.includes('validateOrder');
      const hasStopLoss = riskContent.includes('stopLoss');
      
      this.logTest(
        '风险管理服务类',
        hasClass,
        hasClass ? '风险管理服务已定义' : '风险管理服务未定义'
      );
      
      this.logTest(
        '风险评估功能',
        hasAssessment,
        hasAssessment ? '风险评估功能已添加' : '风险评估功能缺失'
      );
      
      this.logTest(
        '订单验证',
        hasValidation,
        hasValidation ? '订单验证已添加' : '订单验证缺失'
      );
      
      this.logTest(
        '止损功能',
        hasStopLoss,
        hasStopLoss ? '止损功能已添加' : '止损功能缺失'
      );
      
      // 检查风险规则
      const riskRules = [
        'positionSize',
        'dailyLoss',
        'drawdown',
        'leverage'
      ];
      
      for (const rule of riskRules) {
        const hasRule = riskContent.toLowerCase().includes(rule.toLowerCase());
        this.logTest(
          `风险规则: ${rule}`,
          hasRule,
          hasRule ? `${rule} 规则已定义` : `${rule} 规则未定义`
        );
      }
    }
  }

  testDatabaseSchema() {
    console.log('\n🗄️ 测试数据库模式...');
    
    const schemaPath = path.join(__dirname, 'prisma/schema.prisma');
    if (fs.existsSync(schemaPath)) {
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      
      // 检查核心模型
      const requiredModels = [
        'User',
        'Account',
        'Order',
        'Position',
        'Trade',
        'MarketData',
        'Strategy'
      ];
      
      for (const model of requiredModels) {
        const hasModel = schemaContent.includes(`model ${model}`);
        this.logTest(
          `数据模型: ${model}`,
          hasModel,
          hasModel ? `${model} 模型已定义` : `${model} 模型未定义`
        );
      }
      
      // 检查关系
      const hasRelations = schemaContent.includes('relation');
      const hasIndexes = schemaContent.includes('index');
      
      this.logTest(
        '数据关系',
        hasRelations,
        hasRelations ? '数据关系已定义' : '数据关系缺失'
      );
      
      this.logTest(
        '数据库索引',
        hasIndexes,
        hasIndexes ? '数据库索引已定义' : '数据库索引缺失'
      );
    }
  }

  testFrontendComponents() {
    console.log('\n🎨 测试前端组件...');
    
    const componentPath = path.join(__dirname, 'frontend/src/views/trading/TradingPanel.vue');
    if (fs.existsSync(componentPath)) {
      const componentContent = fs.readFileSync(componentPath, 'utf8');
      
      // 检查 Vue 组件结构
      const hasScript = componentContent.includes('<script');
      const hasTemplate = componentContent.includes('<template');
      const hasStyle = componentContent.includes('<style');
      
      this.logTest(
        'Vue 组件结构',
        hasScript && hasTemplate && hasStyle,
        'Vue 组件结构完整'
      );
      
      // 检查关键功能
      const hasTradingForm = componentContent.includes('trading-form') || 
                           componentContent.includes('order-form');
      const hasPositionsTable = componentContent.includes('positions') || 
                              componentContent.includes('持仓');
      const hasOrdersTable = componentContent.includes('orders') || 
                           componentContent.includes('订单');
      
      this.logTest(
        '交易表单',
        hasTradingForm,
        hasTradingForm ? '交易表单已添加' : '交易表单缺失'
      );
      
      this.logTest(
        '持仓表格',
        hasPositionsTable,
        hasPositionsTable ? '持仓表格已添加' : '持仓表格缺失'
      );
      
      this.logTest(
        '订单表格',
        hasOrdersTable,
        hasOrdersTable ? '订单表格已添加' : '订单表格缺失'
      );
      
      // 检查响应式设计
      const hasResponsive = componentContent.includes('responsive') || 
                           componentContent.includes('@media');
      
      this.logTest(
        '响应式设计',
        hasResponsive,
        hasResponsive ? '响应式设计已添加' : '响应式设计缺失'
      );
    }
  }

  testBackendServices() {
    console.log('\n⚙️ 测试后端服务...');
    
    // 测试交换服务
    const exchangeServicePath = path.join(__dirname, 'backend/src/services/ExchangeService.ts');
    if (fs.existsSync(exchangeServicePath)) {
      const exchangeContent = fs.readFileSync(exchangeServicePath, 'utf8');
      
      const hasClass = exchangeContent.includes('class ExchangeService');
      const hasMethods = exchangeContent.includes('connectExchange') || 
                        exchangeContent.includes('placeOrder');
      
      this.logTest(
        '交换服务类',
        hasClass,
        hasClass ? '交换服务已定义' : '交换服务未定义'
      );
      
      this.logTest(
        '交换服务方法',
        hasMethods,
        hasMethods ? '交换服务方法已添加' : '交换服务方法缺失'
      );
    }
    
    // 测试认证服务
    const authServicePath = path.join(__dirname, 'backend/src/services/AuthService.ts');
    if (fs.existsSync(authServicePath)) {
      const authContent = fs.readFileSync(authServicePath, 'utf8');
      
      const hasJWT = authContent.includes('jsonwebtoken');
      const hasAuth = authContent.includes('authenticate');
      
      this.logTest(
        'JWT 认证',
        hasJWT,
        hasJWT ? 'JWT 认证已实现' : 'JWT 认证未实现'
      );
      
      this.logTest(
        '认证功能',
        hasAuth,
        hasAuth ? '认证功能已添加' : '认证功能缺失'
      );
    }
  }

  generateReport() {
    const report = {
      metadata: {
        testName: '交易面板功能测试报告',
        testRunner: 'Node.js',
        startTime: this.results.startTime,
        endTime: this.results.endTime,
        duration: this.results.endTime - this.results.startTime,
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch
        }
      },
      summary: {
        totalTests: this.results.totalTests,
        passedTests: this.results.passedTests,
        failedTests: this.results.failedTests,
        successRate: this.results.totalTests > 0 
          ? ((this.results.passedTests / this.results.totalTests) * 100).toFixed(1)
          : 0
      },
      testResults: this.results.testResults
    };
    
    const reportPath = path.join(this.testResultsDir, 'trading-panel-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 测试报告已生成: ${reportPath}`);
  }

  displaySummary() {
    const duration = (this.results.endTime - this.results.startTime) / 1000;
    const successRate = this.results.totalTests > 0 
      ? ((this.results.passedTests / this.results.totalTests) * 100).toFixed(1)
      : 0;

    console.log('\n🎯 交易面板功能测试完成!');
    console.log('='.repeat(60));
    console.log(`⏱️  总运行时间: ${duration.toFixed(2)}s`);
    console.log(`📝 总测试数: ${this.results.totalTests}`);
    console.log(`✅ 通过: ${this.results.passedTests}`);
    console.log(`❌ 失败: ${this.results.failedTests}`);
    console.log(`📈 成功率: ${successRate}%`);

    if (this.results.failedTests > 0) {
      console.log('\n❌ 失败的测试:');
      this.results.testResults
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.test}: ${r.message}`);
        });
    }
    
    console.log('\n🎉 测试完成!');
  }
}

// 运行测试
if (require.main === module) {
  const tester = new TradingPanelTester();
  tester.runAllTests().catch(console.error);
}

module.exports = TradingPanelTester;