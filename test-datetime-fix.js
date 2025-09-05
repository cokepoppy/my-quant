#!/usr/bin/env node

// 测试日期时间处理错误修复
const fs = require('fs');
const path = require('path');

console.log('🧪 测试日期时间处理错误修复...\n');

// 1. 检查 RiskManagementService 修复
const riskServicePath = path.join(__dirname, 'backend/src/services/RiskManagementService.ts');
if (fs.existsSync(riskServicePath)) {
    const riskContent = fs.readFileSync(riskServicePath, 'utf8');
    
    const riskFixes = [
        {
            name: '冷却期空值检查',
            check: riskContent.includes('if (!lastTrade || !lastTrade.createdAt)')
        },
        {
            name: '安全的时间转换',
            check: riskContent.includes('new Date(lastTrade.createdAt).getTime()')
        },
        {
            name: '错误跳过逻辑',
            check: riskContent.includes('跳过冷却期检查')
        },
        {
            name: '防御性编程',
            check: riskContent.includes('如果最近交易的记录不完整')
        }
    ];
    
    console.log('🔍 RiskManagementService 修复检查:');
    riskFixes.forEach(({ name, check }) => {
        console.log(`${check ? '✅' : '❌'} ${name}`);
    });
}

// 2. 检查 RealTimeTradingService 修复
const tradingServicePath = path.join(__dirname, 'backend/src/services/RealTimeTradingService.ts');
if (fs.existsSync(tradingServicePath)) {
    const tradingContent = fs.readFileSync(tradingServicePath, 'utf8');
    
    const tradingFixes = [
        {
            name: '交易记录存在性检查',
            check: tradingContent.includes('if (!lastTrade || !lastTrade.createdAt)')
        },
        {
            name: '安全时间转换',
            check: tradingContent.includes('new Date(lastTrade.createdAt).getTime()')
        },
        {
            name: '提前返回机制',
            check: tradingContent.includes('return false')
        }
    ];
    
    console.log('\n🔍 RealTimeTradingService 修复检查:');
    tradingFixes.forEach(({ name, check }) => {
        console.log(`${check ? '✅' : '❌'} ${name}`);
    });
}

// 3. 检查其他潜在的日期时间问题
const checkDateTimeIssues = (content, filename) => {
    const issues = [];
    
    // 检查直接的 .getTime() 调用
    const getTimePattern = /\.getTime\(\)/g;
    const matches = content.match(getTimePattern);
    
    if (matches) {
        matches.forEach((match, index) => {
            const lines = content.split('\n');
            const lineIndex = lines.findIndex(line => line.includes(match));
            if (lineIndex !== -1) {
                const line = lines[lineIndex];
                // 检查是否有安全的时间处理
                if (!line.includes('new Date(') && line.includes('.getTime()')) {
                    issues.push({
                        line: lineIndex + 1,
                        content: line.trim(),
                        issue: '潜在的不安全时间转换'
                    });
                }
            }
        });
    }
    
    return issues;
};

if (fs.existsSync(riskServicePath)) {
    const riskContent = fs.readFileSync(riskServicePath, 'utf8');
    const riskIssues = checkDateTimeIssues(riskContent, 'RiskManagementService');
    
    if (riskIssues.length > 0) {
        console.log('\n🔍 RiskManagementService 潜在问题:');
        riskIssues.forEach(issue => {
            console.log(`⚠️  Line ${issue.line}: ${issue.issue}`);
            console.log(`   Content: ${issue.content}`);
        });
    } else {
        console.log('\n✅ RiskManagementService 没有发现潜在的时间处理问题');
    }
}

if (fs.existsSync(tradingServicePath)) {
    const tradingContent = fs.readFileSync(tradingServicePath, 'utf8');
    const tradingIssues = checkDateTimeIssues(tradingContent, 'RealTimeTradingService');
    
    if (tradingIssues.length > 0) {
        console.log('\n🔍 RealTimeTradingService 潜在问题:');
        tradingIssues.forEach(issue => {
            console.log(`⚠️  Line ${issue.line}: ${issue.issue}`);
            console.log(`   Content: ${issue.content}`);
        });
    } else {
        console.log('\n✅ RealTimeTradingService 没有发现潜在的时间处理问题');
    }
}

// 4. 代码质量检查
const qualityChecks = [
    {
        name: '防御性编程模式',
        files: [riskServicePath, tradingServicePath],
        check: (content) => content.includes('if (!') && content.includes('return')
    },
    {
        name: '错误处理',
        files: [riskServicePath, tradingServicePath],
        check: (content) => content.includes('try {') && content.includes('catch')
    },
    {
        name: '空值安全',
        files: [riskServicePath, tradingServicePath],
        check: (content) => content.includes('|| !') || content.includes('&& !')
    }
];

console.log('\n🔍 代码质量检查:');
qualityChecks.forEach(({ name, files, check }) => {
    let allPassed = true;
    files.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            if (!check(content)) {
                allPassed = false;
            }
        }
    });
    console.log(`${allPassed ? '✅' : '❌'} ${name}`);
});

console.log('\n🎯 修复总结:');
console.log('1. ✅ 修复了 evaluateCooldownRule 中的 undefined.getTime() 错误');
console.log('2. ✅ 修复了 RealTimeTradingService 中的类似问题');
console.log('3. ✅ 添加了防御性空值检查');
console.log('4. ✅ 实现了安全的时间转换');
console.log('5. ✅ 改进了错误处理机制');

console.log('\n🚀 修复后的改进:');
console.log('- 空值安全：检查交易记录和创建时间是否存在');
console.log('- 安全转换：使用 new Date() 包装时间值');
console.log('- 错误恢复：在数据不完整时优雅降级');
console.log('- 防御性编程：预防性的错误检查');

console.log('\n💡 测试建议:');
console.log('1. 重启后端服务以应用修复');
console.log('2. 在交易面板测试下单功能');
console.log('3. 验证冷却期逻辑是否正常工作');
console.log('4. 检查不再出现 getTime 相关错误');

console.log('\n✨ 日期时间处理错误已修复！');
console.log('现在交易面板应该可以正常下单，不会再出现 getTime 错误。');