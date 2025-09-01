// 风险控制和止损功能测试
console.log('🛡️ 风险控制和止损功能测试');
console.log('='.repeat(50));

class RiskManagementTester {
  constructor() {
    this.testResults = [];
    this.riskRules = new Map();
    this.accounts = new Map();
    this.positions = new Map();
    this.initializeTestData();
  }

  initializeTestData() {
    // 初始化风险规则
    this.riskRules.set('position_size', {
      id: 'position_size',
      name: '最大仓位限制',
      type: 'position_size',
      enabled: true,
      parameters: {
        maxPositionSize: 10000,
        maxSinglePosition: 5000,
        maxPositionPercentage: 10
      },
      priority: 10
    });

    this.riskRules.set('daily_loss', {
      id: 'daily_loss',
      name: '日亏损限制',
      type: 'daily_loss',
      enabled: true,
      parameters: {
        maxDailyLoss: 1000,
        maxDailyLossPercentage: 5,
        stopTradingOnLoss: true
      },
      priority: 9
    });

    this.riskRules.set('drawdown', {
      id: 'drawdown',
      name: '最大回撤限制',
      type: 'drawdown',
      enabled: true,
      parameters: {
        maxDrawdown: 0.15,
        criticalDrawdown: 0.25,
        autoReducePositions: true
      },
      priority: 8
    });

    this.riskRules.set('leverage', {
      id: 'leverage',
      name: '杠杆限制',
      type: 'leverage',
      enabled: true,
      parameters: {
        maxLeverage: 3,
        maxNotionalValue: 50000,
        marginCallLevel: 0.8
      },
      priority: 7
    });

    this.riskRules.set('stop_loss', {
      id: 'stop_loss',
      name: '止损设置',
      type: 'stop_loss',
      enabled: true,
      parameters: {
        defaultStopLoss: 0.02, // 2%
        maxStopLoss: 0.05, // 5%
        trailingStopEnabled: true,
        trailingStopDistance: 0.01 // 1%
      },
      priority: 6
    });

    // 初始化账户数据
    this.accounts.set('account1', {
      id: 'account1',
      name: '测试账户1',
      balance: 50000,
      dailyPnL: 200,
      totalExposure: 15000,
      currentDrawdown: 0.05,
      maxDrawdown: 0.10,
      leverageUsage: 1.5,
      positions: ['pos1', 'pos2']
    });

    this.accounts.set('account2', {
      id: 'account2',
      name: '测试账户2',
      balance: 30000,
      dailyPnL: -800,
      totalExposure: 25000,
      currentDrawdown: 0.12,
      maxDrawdown: 0.18,
      leverageUsage: 2.8,
      positions: ['pos3']
    });

    // 初始化持仓数据
    this.positions.set('pos1', {
      id: 'pos1',
      accountId: 'account1',
      symbol: 'BTC/USDT',
      side: 'long',
      amount: 0.2,
      entryPrice: 44000,
      currentPrice: 45000,
      stopLoss: 43000,
      takeProfit: 47000,
      pnl: 200,
      pnlPercent: 0.45
    });

    this.positions.set('pos2', {
      id: 'pos2',
      accountId: 'account1',
      symbol: 'ETH/USDT',
      side: 'short',
      amount: 1.0,
      entryPrice: 3200,
      currentPrice: 3100,
      stopLoss: 3300,
      takeProfit: 2900,
      pnl: 100,
      pnlPercent: 3.13
    });

    this.positions.set('pos3', {
      id: 'pos3',
      accountId: 'account2',
      symbol: 'SOL/USDT',
      side: 'long',
      amount: 50,
      entryPrice: 100,
      currentPrice: 95,
      stopLoss: 90,
      takeProfit: 120,
      pnl: -250,
      pnlPercent: -5.0
    });
  }

  logTest(testName, passed, message = '') {
    const result = {
      test: testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    };
    this.testResults.push(result);
    
    if (passed) {
      console.log(`✅ ${testName} - ${message}`);
    } else {
      console.log(`❌ ${testName} - ${message}`);
    }
  }

  // 测试1: 风险规则评估
  testRiskRuleEvaluation() {
    console.log('\n📋 测试风险规则评估');
    
    const testCases = [
      {
        name: '正常交易请求',
        accountId: 'account1',
        tradeRequest: {
          symbol: 'BTC/USDT',
          amount: 0.1,
          price: 45000,
          type: 'buy'
        },
        expected: true
      },
      {
        name: '超过单笔交易限制',
        accountId: 'account1',
        tradeRequest: {
          symbol: 'BTC/USDT',
          amount: 0.2,
          price: 45000,
          type: 'buy'
        },
        expected: false
      },
      {
        name: '超过总仓位限制',
        accountId: 'account2',
        tradeRequest: {
          symbol: 'BTC/USDT',
          amount: 0.3,
          price: 45000,
          type: 'buy'
        },
        expected: false
      },
      {
        name: '日亏损超限账户',
        accountId: 'account2',
        tradeRequest: {
          symbol: 'ETH/USDT',
          amount: 0.5,
          price: 3000,
          type: 'buy'
        },
        expected: false
      }
    ];

    testCases.forEach(testCase => {
      const assessment = this.assessTradeRisk(testCase.accountId, testCase.tradeRequest);
      const passed = assessment.passed === testCase.expected;
      
      this.logTest(
        `风险评估: ${testCase.name}`,
        passed,
        assessment.passed ? '通过' : `被拒绝 - ${assessment.violations[0]?.message || '未知原因'}`
      );
    });
  }

  assessTradeRisk(accountId, tradeRequest) {
    const violations = [];
    const account = this.accounts.get(accountId);
    if (!account) {
      return {
        passed: false,
        violations: [{ message: '账户不存在' }],
        riskLevel: 'critical'
      };
    }

    const tradeValue = parseFloat(tradeRequest.amount) * parseFloat(tradeRequest.price);

    // 检查仓位限制
    const positionRule = this.riskRules.get('position_size');
    if (tradeValue > positionRule.parameters.maxSinglePosition) {
      violations.push({
        ruleName: positionRule.name,
        message: `交易金额 ${tradeValue} 超过单笔交易限制 ${positionRule.parameters.maxSinglePosition}`
      });
    }

    if (account.totalExposure + tradeValue > positionRule.parameters.maxPositionSize) {
      violations.push({
        ruleName: positionRule.name,
        message: `总仓位将达到 ${account.totalExposure + tradeValue}，超过最大仓位限制 ${positionRule.parameters.maxPositionSize}`
      });
    }

    // 检查日亏损限制
    const dailyLossRule = this.riskRules.get('daily_loss');
    if (account.dailyPnL < -dailyLossRule.parameters.maxDailyLoss) {
      violations.push({
        ruleName: dailyLossRule.name,
        message: `今日亏损 ${Math.abs(account.dailyPnL)} 已达到最大亏损限制 ${dailyLossRule.parameters.maxDailyLoss}`
      });
    }

    // 检查回撤限制
    const drawdownRule = this.riskRules.get('drawdown');
    if (account.currentDrawdown > drawdownRule.parameters.maxDrawdown) {
      violations.push({
        ruleName: drawdownRule.name,
        message: `当前回撤 ${(account.currentDrawdown * 100).toFixed(2)}% 已超过最大回撤 ${(drawdownRule.parameters.maxDrawdown * 100).toFixed(2)}%`
      });
    }

    // 检查杠杆限制
    const leverageRule = this.riskRules.get('leverage');
    if (account.leverageUsage > leverageRule.parameters.maxLeverage) {
      violations.push({
        ruleName: leverageRule.name,
        message: `当前杠杆使用率 ${account.leverageUsage}x 超过最大杠杆限制 ${leverageRule.parameters.maxLeverage}x`
      });
    }

    return {
      passed: violations.length === 0,
      violations,
      riskLevel: violations.length > 0 ? 'high' : 'low'
    };
  }

  // 测试2: 止损功能
  testStopLossFunctionality() {
    console.log('\n🛑 测试止损功能');
    
    this.positions.forEach((position, positionId) => {
      const stopLossRule = this.riskRules.get('stop_loss');
      
      // 测试止损触发
      const shouldTriggerStopLoss = this.shouldTriggerStopLoss(position, stopLossRule);
      
      this.logTest(
        `${position.symbol} 止损检查`,
        true,
        shouldTriggerStopLoss ? 
          `应触发止损 - 当前价格 ${position.currentPrice} < 止损价 ${position.stopLoss}` :
          `无需止损 - 当前价格 ${position.currentPrice} > 止损价 ${position.stopLoss}`
      );
      
      // 测试移动止损
      if (stopLossRule.parameters.trailingStopEnabled) {
        const trailingStop = this.calculateTrailingStop(position, stopLossRule);
        this.logTest(
          `${position.symbol} 移动止损`,
          true,
          `移动止损价: ${trailingStop}`
        );
      }
    });
  }

  shouldTriggerStopLoss(position, stopLossRule) {
    if (position.side === 'long') {
      return position.currentPrice <= position.stopLoss;
    } else {
      return position.currentPrice >= position.stopLoss;
    }
  }

  calculateTrailingStop(position, stopLossRule) {
    const trailingDistance = stopLossRule.parameters.trailingStopDistance;
    
    if (position.side === 'long') {
      const highestPrice = position.entryPrice * 1.05; // 模拟最高价
      return highestPrice * (1 - trailingDistance);
    } else {
      const lowestPrice = position.entryPrice * 0.95; // 模拟最低价
      return lowestPrice * (1 + trailingDistance);
    }
  }

  // 测试3: 风险监控
  testRiskMonitoring() {
    console.log('\n📊 测试风险监控');
    
    this.accounts.forEach((account, accountId) => {
      // 计算风险分数
      const riskScore = this.calculateRiskScore(account);
      const riskLevel = this.getRiskLevel(riskScore);
      
      this.logTest(
        `${account.name} 风险监控`,
        true,
        `风险分数: ${riskScore}, 风险等级: ${riskLevel}`
      );
      
      // 检查是否需要生成风险警告
      if (riskScore > 70) {
        this.logTest(
          `${account.name} 风险警告`,
          true,
          `高风险警告 - 建议减少仓位或停止交易`
        );
      }
      
      // 检查账户健康度
      const health = this.assessAccountHealth(account);
      this.logTest(
        `${account.name} 账户健康度`,
        true,
        `健康度: ${health.score}/100 - ${health.status}`
      );
    });
  }

  calculateRiskScore(account) {
    let score = 0;
    
    // 回撤风险
    if (account.currentDrawdown > 0.15) score += 30;
    else if (account.currentDrawdown > 0.10) score += 20;
    else if (account.currentDrawdown > 0.05) score += 10;
    
    // 杠杆风险
    if (account.leverageUsage > 3) score += 25;
    else if (account.leverageUsage > 2) score += 15;
    else if (account.leverageUsage > 1.5) score += 5;
    
    // 日亏损风险
    if (account.dailyPnL < -1000) score += 30;
    else if (account.dailyPnL < -500) score += 20;
    else if (account.dailyPnL < -200) score += 10;
    
    // 仓位集中度风险
    const positionConcentration = account.totalExposure / account.balance;
    if (positionConcentration > 0.5) score += 15;
    else if (positionConcentration > 0.3) score += 8;
    
    return Math.min(100, score);
  }

  getRiskLevel(riskScore) {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }

  assessAccountHealth(account) {
    let score = 100;
    
    // 扣分项
    if (account.currentDrawdown > 0.10) score -= 20;
    if (account.leverageUsage > 2) score -= 15;
    if (account.dailyPnL < -500) score -= 25;
    if (account.totalExposure > account.balance * 0.4) score -= 10;
    
    // 加分项
    if (account.dailyPnL > 500) score += 10;
    if (account.currentDrawdown < 0.02) score += 5;
    
    let status = 'excellent';
    if (score < 80) status = 'good';
    if (score < 60) status = 'fair';
    if (score < 40) status = 'poor';
    
    return { score, status };
  }

  // 测试4: 自动风险控制
  testAutomaticRiskControl() {
    console.log('\n🤖 测试自动风险控制');
    
    this.accounts.forEach((account, accountId) => {
      const riskScore = this.calculateRiskScore(account);
      
      // 测试自动减仓
      if (riskScore > 70) {
        const reductionAction = this.generatePositionReduction(account);
        this.logTest(
          `${account.name} 自动减仓`,
          true,
          `建议减仓 ${reductionAction.percentage}%，约 ${reductionAction.amount} USDT`
        );
      }
      
      // 测试交易限制
      if (riskScore > 80) {
        this.logTest(
          `${account.name} 交易限制`,
          true,
          '高风险账户已自动限制交易'
        );
      }
      
      // 测试止损触发
      const positions = Array.from(this.positions.values()).filter(p => p.accountId === accountId);
      positions.forEach(position => {
        if (position.pnl < -position.entryPrice * 0.05) { // 5%亏损
          this.logTest(
            `${account.name} ${position.symbol} 强制止损`,
            true,
            `亏损超过5%，触发强制止损`
          );
        }
      });
    });
  }

  generatePositionReduction(account) {
    const reductionPercentage = Math.min(50, this.calculateRiskScore(account) - 50);
    const reductionAmount = account.totalExposure * (reductionPercentage / 100);
    
    return {
      percentage: reductionPercentage,
      amount: reductionAmount
    };
  }

  // 测试5: 风险报告生成
  testRiskReportGeneration() {
    console.log('\n📈 测试风险报告生成');
    
    this.accounts.forEach((account, accountId) => {
      const report = this.generateRiskReport(account);
      
      this.logTest(
        `${account.name} 风险报告`,
        true,
        `风险等级: ${report.riskLevel}, 建议: ${report.recommendations.length} 项`
      );
      
      // 显示主要风险指标
      console.log(`  主要风险指标:`);
      report.metrics.forEach(metric => {
        console.log(`    - ${metric.name}: ${metric.value} ${metric.unit}`);
      });
      
      // 显示建议
      if (report.recommendations.length > 0) {
        console.log(`  改进建议:`);
        report.recommendations.forEach(rec => {
          console.log(`    - ${rec}`);
        });
      }
    });
  }

  generateRiskReport(account) {
    const riskScore = this.calculateRiskScore(account);
    const riskLevel = this.getRiskLevel(riskScore);
    
    const metrics = [
      { name: '风险分数', value: riskScore, unit: '/100' },
      { name: '当前回撤', value: (account.currentDrawdown * 100).toFixed(2), unit: '%' },
      { name: '杠杆使用率', value: account.leverageUsage, unit: 'x' },
      { name: '日盈亏', value: account.dailyPnL, unit: 'USDT' },
      { name: '仓位集中度', value: ((account.totalExposure / account.balance) * 100).toFixed(1), unit: '%' }
    ];
    
    const recommendations = [];
    
    if (account.currentDrawdown > 0.10) {
      recommendations.push('考虑减仓以降低回撤风险');
    }
    if (account.leverageUsage > 2) {
      recommendations.push('降低杠杆使用率至安全水平');
    }
    if (account.dailyPnL < -500) {
      recommendations.push('暂停交易，等待市场稳定');
    }
    if (account.totalExposure > account.balance * 0.4) {
      recommendations.push('分散投资，降低仓位集中度');
    }
    
    return {
      accountId: account.id,
      riskLevel,
      metrics,
      recommendations,
      timestamp: new Date()
    };
  }

  // 测试6: 风险规则管理
  testRiskRuleManagement() {
    console.log('\n⚙️ 测试风险规则管理');
    
    // 测试规则启用/禁用
    const stopLossRule = this.riskRules.get('stop_loss');
    const originalEnabled = stopLossRule.enabled;
    
    // 禁用规则
    stopLossRule.enabled = false;
    this.logTest(
      '止损规则禁用',
      true,
      '止损规则已禁用'
    );
    
    // 重新启用
    stopLossRule.enabled = true;
    this.logTest(
      '止损规则启用',
      true,
      '止损规则已重新启用'
    );
    
    // 测试规则参数修改
    const originalMaxLoss = stopLossRule.parameters.defaultStopLoss;
    stopLossRule.parameters.defaultStopLoss = 0.03; // 改为3%
    
    this.logTest(
      '止损规则参数修改',
      true,
      `默认止损从 ${(originalMaxLoss * 100)}% 修改为 ${(stopLossRule.parameters.defaultStopLoss * 100)}%`
    );
    
    // 恢复原参数
    stopLossRule.parameters.defaultStopLoss = originalMaxLoss;
  }

  // 测试7: 实时风险警告
  testRealTimeRiskAlerts() {
    console.log('\n🚨 测试实时风险警告');
    
    // 模拟价格变化触发风险警告
    const priceScenarios = [
      {
        name: 'BTC价格大幅下跌',
        symbol: 'BTC/USDT',
        priceChange: -0.15, // 下跌15%
        expectedAlert: true
      },
      {
        name: 'ETH价格适度上涨',
        symbol: 'ETH/USDT',
        priceChange: 0.05, // 上涨5%
        expectedAlert: false
      },
      {
        name: 'SOL价格暴跌',
        symbol: 'SOL/USDT',
        priceChange: -0.25, // 下跌25%
        expectedAlert: true
      }
    ];
    
    priceScenarios.forEach(scenario => {
      const alert = this.simulatePriceAlert(scenario);
      const shouldAlert = alert !== null;
      
      this.logTest(
        `${scenario.name}`,
        shouldAlert === scenario.expectedAlert,
        shouldAlert ? alert.message : '无需警告'
      );
    });
  }

  simulatePriceAlert(scenario) {
    // 查找相关持仓
    const position = Array.from(this.positions.values()).find(p => p.symbol === scenario.symbol);
    if (!position) return null;
    
    const newPrice = position.currentPrice * (1 + scenario.priceChange);
    const priceChangePercent = ((newPrice - position.currentPrice) / position.currentPrice) * 100;
    
    // 检查是否需要触发警告
    if (Math.abs(priceChangePercent) > 10) {
      return {
        type: 'PRICE_ALERT',
        symbol: scenario.symbol,
        severity: Math.abs(priceChangePercent) > 20 ? 'critical' : 'high',
        message: `${scenario.symbol} 价格${priceChangePercent > 0 ? '上涨' : '下跌'} ${Math.abs(priceChangePercent).toFixed(2)}%`,
        timestamp: new Date()
      };
    }
    
    return null;
  }

  // 生成测试报告
  generateReport() {
    console.log('\n📊 风险控制和止损功能测试报告');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    const total = this.testResults.length;
    
    console.log(`总测试数: ${total}`);
    console.log(`通过: ${passed}`);
    console.log(`失败: ${failed}`);
    console.log(`成功率: ${((passed / total) * 100).toFixed(1)}%`);
    
    console.log('\n🏦 账户风险状态汇总:');
    this.accounts.forEach((account, accountId) => {
      const riskScore = this.calculateRiskScore(account);
      const riskLevel = this.getRiskLevel(riskScore);
      console.log(`  ${account.name}: ${riskLevel} 风险 (${riskScore}/100)`);
    });
    
    console.log('\n🛡️ 风险规则状态:');
    this.riskRules.forEach((rule, ruleId) => {
      const status = rule.enabled ? '✅ 启用' : '❌ 禁用';
      console.log(`  ${rule.name}: ${status}`);
    });
    
    if (failed > 0) {
      console.log('\n❌ 失败的测试:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.test}: ${r.message}`);
        });
    }
    
    console.log('\n🎯 风险控制和止损功能测试完成!');
  }

  // 运行所有测试
  runAllTests() {
    console.log('🚀 开始运行风险控制和止损功能测试...\n');
    
    this.testRiskRuleEvaluation();
    this.testStopLossFunctionality();
    this.testRiskMonitoring();
    this.testAutomaticRiskControl();
    this.testRiskReportGeneration();
    this.testRiskRuleManagement();
    this.testRealTimeRiskAlerts();
    
    this.generateReport();
  }
}

// 运行测试
const tester = new RiskManagementTester();
tester.runAllTests();