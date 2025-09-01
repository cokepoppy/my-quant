#!/usr/bin/env node

/**
 * 交易面板 Playwright 测试运行脚本
 * 运行所有交易面板相关的测试并生成详细报告
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TradingPanelTestRunner {
  constructor() {
    this.results = {
      startTime: new Date(),
      endTime: null,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      testFiles: [],
      errors: []
    };
    
    this.testFiles = [
      'tests/e2e/trading/trading-panel-essential.spec.ts',
      'tests/e2e/trading/trading-panel-comprehensive.spec.ts',
      'tests/e2e/trading/trading-operations.spec.ts'
    ];
    
    this.reportsDir = path.join(__dirname, 'test-results');
    this.ensureReportsDir();
  }

  ensureReportsDir() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  async runTests() {
    console.log('🚀 开始运行交易面板 Playwright 测试');
    console.log('='.repeat(60));
    
    for (const testFile of this.testFiles) {
      await this.runTestFile(testFile);
    }
    
    this.results.endTime = new Date();
    await this.generateReport();
    await this.generateSummary();
  }

  async runTestFile(testFile) {
    console.log(`\n🧪 运行测试文件: ${testFile}`);
    console.log('-'.repeat(40));
    
    const startTime = Date.now();
    const fileResult = {
      fileName: testFile,
      startTime: new Date(startTime),
      endTime: null,
      duration: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      output: '',
      error: null
    };

    try {
      // 运行 Playwright 测试
      const command = `npx playwright test ${testFile} --reporter=list,json`;
      
      const child = spawn(command, [], {
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let error = '';

      child.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        process.stdout.write(text);
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        error += text;
        process.stderr.write(text);
      });

      await new Promise((resolve, reject) => {
        child.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Test process exited with code ${code}`));
          }
        });

        child.on('error', (err) => {
          reject(err);
        });
      });

      // 解析测试结果
      const parsedResult = this.parseTestOutput(output);
      fileResult.totalTests = parsedResult.total;
      fileResult.passedTests = parsedResult.passed;
      fileResult.failedTests = parsedResult.failed;
      fileResult.skippedTests = parsedResult.skipped;
      fileResult.output = output;

    } catch (err) {
      console.error(`❌ 测试文件 ${testFile} 运行失败:`, err.message);
      fileResult.error = err.message;
      fileResult.output = error;
      this.results.errors.push({
        file: testFile,
        error: err.message,
        timestamp: new Date()
      });
    }

    fileResult.endTime = new Date();
    fileResult.duration = fileResult.endTime - fileResult.startTime;

    // 更新总体结果
    this.results.totalTests += fileResult.totalTests;
    this.results.passedTests += fileResult.passedTests;
    this.results.failedTests += fileResult.failedTests;
    this.results.skippedTests += fileResult.skippedTests;
    this.results.testFiles.push(fileResult);

    // 显示文件结果
    this.displayFileResult(fileResult);
  }

  parseTestOutput(output) {
    const result = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    };

    // 解析输出中的测试统计信息
    const lines = output.split('\n');
    
    for (const line of lines) {
      // 查找测试统计行
      const testMatch = line.match(/(\d+)\s+test(s)?/i);
      if (testMatch) {
        result.total += parseInt(testMatch[1]);
      }

      // 查找通过测试数
      const passedMatch = line.match(/(\d+)\s+passed/i);
      if (passedMatch) {
        result.passed += parseInt(passedMatch[1]);
      }

      // 查找失败测试数
      const failedMatch = line.match(/(\d+)\s+failed/i);
      if (failedMatch) {
        result.failed += parseInt(failedMatch[1]);
      }

      // 查找跳过测试数
      const skippedMatch = line.match(/(\d+)\s+skipped/i);
      if (skippedMatch) {
        result.skipped += parseInt(skippedMatch[1]);
      }
    }

    return result;
  }

  displayFileResult(fileResult) {
    const duration = (fileResult.duration / 1000).toFixed(2);
    const successRate = fileResult.totalTests > 0 
      ? ((fileResult.passedTests / fileResult.totalTests) * 100).toFixed(1)
      : 0;

    console.log(`\n📊 测试文件结果:`);
    console.log(`  ⏱️  运行时间: ${duration}s`);
    console.log(`  📝 总测试数: ${fileResult.totalTests}`);
    console.log(`  ✅ 通过: ${fileResult.passedTests}`);
    console.log(`  ❌ 失败: ${fileResult.failedTests}`);
    console.log(`  ⏭️  跳过: ${fileResult.skippedTests}`);
    console.log(`  📈 成功率: ${successRate}%`);

    if (fileResult.error) {
      console.log(`  ⚠️  错误: ${fileResult.error}`);
    }

    console.log('-'.repeat(40));
  }

  async generateReport() {
    const reportPath = path.join(this.reportsDir, 'trading-panel-test-report.json');
    
    const report = {
      metadata: {
        testName: '交易面板 Playwright 测试报告',
        testRunner: 'Playwright',
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
        skippedTests: this.results.skippedTests,
        successRate: this.results.totalTests > 0 
          ? ((this.results.passedTests / this.results.totalTests) * 100).toFixed(1)
          : 0
      },
      testFiles: this.results.testFiles,
      errors: this.results.errors
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 详细报告已生成: ${reportPath}`);
  }

  async generateSummary() {
    const duration = (this.results.endTime - this.results.startTime) / 1000;
    const successRate = this.results.totalTests > 0 
      ? ((this.results.passedTests / this.results.totalTests) * 100).toFixed(1)
      : 0;

    console.log('\n🎯 交易面板 Playwright 测试完成!');
    console.log('='.repeat(60));
    console.log(`⏱️  总运行时间: ${duration.toFixed(2)}s`);
    console.log(`📝 总测试数: ${this.results.totalTests}`);
    console.log(`✅ 通过: ${this.results.passedTests}`);
    console.log(`❌ 失败: ${this.results.failedTests}`);
    console.log(`⏭️  跳过: ${this.results.skippedTests}`);
    console.log(`📈 成功率: ${successRate}%`);

    if (this.results.errors.length > 0) {
      console.log('\n⚠️  错误汇总:');
      this.results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.file}: ${error.error}`);
      });
    }

    // 显示各文件结果
    console.log('\n📋 各测试文件结果:');
    this.results.testFiles.forEach((file, index) => {
      const fileSuccessRate = file.totalTests > 0 
        ? ((file.passedTests / file.totalTests) * 100).toFixed(1)
        : 0;
      const status = file.error ? '❌' : (file.failedTests === 0 ? '✅' : '⚠️');
      console.log(`  ${status} ${file.fileName}: ${fileSuccessRate}% (${file.passedTests}/${file.totalTests})`);
    });

    console.log('\n📁 测试结果文件:');
    console.log(`  📄 JSON 报告: ${path.join(this.reportsDir, 'trading-panel-test-report.json')}`);
    console.log(`  🖼️  截图: ${this.reportsDir}/trading-test-*.png`);
    console.log(`  📊 HTML 报告: playwright-report/index.html`);

    console.log('\n🎉 测试完成!');
  }
}

// 运行测试
if (require.main === module) {
  const runner = new TradingPanelTestRunner();
  runner.runTests().catch(console.error);
}

module.exports = TradingPanelTestRunner;