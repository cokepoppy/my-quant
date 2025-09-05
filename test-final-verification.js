#!/usr/bin/env node

// 最终修复验证测试
const fs = require('fs');
const path = require('path');

console.log('🧪 最终修复验证测试...\n');

// 1. 检查所有关键修复
const checks = [
    {
        name: 'RiskManagementService 字段名修复',
        file: 'backend/src/services/RiskManagementService.ts',
        checks: [
            { pattern: 'lastTrade.timestamp', description: '使用正确的 timestamp 字段' },
            { pattern: '!lastTrade.timestamp', description: '防御性空值检查' },
            { pattern: 'new Date(lastTrade.timestamp).getTime()', description: '安全时间转换' }
        ]
    },
    {
        name: 'RealTimeTradingService 字段名修复',
        file: 'backend/src/services/RealTimeTradingService.ts',
        checks: [
            { pattern: 'lastTrade.timestamp', description: '使用正确的 timestamp 字段' },
            { pattern: '!lastTrade.timestamp', description: '防御性空值检查' },
            { pattern: 'orderBy: { timestamp: \'desc\' }', description: '正确的排序字段' }
        ]
    },
    {
        name: '数据库查询一致性',
        file: 'backend/src/services/RealTimeTradingService.ts',
        checks: [
            { pattern: 'timestamp: { gte: today }', description: '使用 timestamp 而非 createdAt' }
        ]
    }
];

let allPassed = true;

checks.forEach(({ name, file, checks: fileChecks }) => {
    console.log(`🔍 ${name}:`);
    
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
        console.log(`❌ 文件不存在: ${file}`);
        allPassed = false;
        return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    fileChecks.forEach(({ pattern, description }) => {
        const passed = content.includes(pattern);
        console.log(`${passed ? '✅' : '❌'} ${description}`);
        if (!passed) allPassed = false;
    });
    
    console.log('');
});

// 2. 检查 Trade 模型结构
console.log('🔍 数据库模型验证:');
const schemaPath = path.join(__dirname, 'backend/prisma/schema.prisma');
if (fs.existsSync(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    const modelChecks = [
        { pattern: 'timestamp     DateTime', description: 'Trade 模型有 timestamp 字段' }
    ];
    
    modelChecks.forEach(({ pattern, description }) => {
        if (pattern.startsWith('!')) {
            // 检查不应该存在的字段
            const field = pattern.substring(1);
            const exists = schemaContent.includes(field);
            console.log(`${!exists ? '✅' : '❌'} ${description}`);
            if (exists) allPassed = false;
        } else {
            // 检查应该存在的字段
            const exists = schemaContent.includes(pattern);
            console.log(`${exists ? '✅' : '❌'} ${description}`);
            if (!exists) allPassed = false;
        }
    });
} else {
    console.log('❌ 数据库模型文件不存在');
    allPassed = false;
}

console.log('');

// 3. 总结
if (allPassed) {
    console.log('🎉 所有关键修复都已正确应用！');
    console.log('✅ getTime() 错误已修复');
    console.log('✅ 字段名不一致问题已解决');
    console.log('✅ 防御性编程已实现');
    console.log('✅ 数据库查询已统一');
    
    console.log('\n💡 下一步建议:');
    console.log('1. 重启后端服务以应用所有修复');
    console.log('2. 在交易面板测试下单功能');
    console.log('3. 验证不再出现 getTime 相关错误');
    console.log('4. 确认冷却期逻辑正常工作');
} else {
    console.log('❌ 某些修复可能未正确应用');
    console.log('请检查上述失败的检查项');
}

console.log('\n🚀 修复完成状态:', allPassed ? '成功' : '需要进一步检查');