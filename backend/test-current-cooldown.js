#!/usr/bin/env node

// 直接测试当前数据库中的冷却期配置
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCurrentCooldown() {
  try {
    console.log('🔍 测试当前数据库中的冷却期配置...\n');

    // 查询当前的冷却期规则
    const cooldownRule = await prisma.riskRule.findFirst({
      where: {
        type: 'cooldown',
        enabled: true
      }
    });

    if (!cooldownRule) {
      console.log('❌ 未找到冷却期规则');
      return;
    }

    console.log('📋 数据库中的冷却期规则:');
    console.log('  - 规则ID:', cooldownRule.id);
    console.log('  - 规则名称:', cooldownRule.name);
    console.log('  - 规则类型:', cooldownRule.type);
    console.log('  - 启用状态:', cooldownRule.enabled);
    console.log('  - 冷却期参数:', cooldownRule.parameters.cooldownPeriod, '秒');
    console.log('  - 更新时间:', cooldownRule.updatedAt);
    console.log('  - 创建时间:', cooldownRule.createdAt);

    // 检查是否有其他冷却期规则
    const allCooldownRules = await prisma.riskRule.findMany({
      where: {
        type: 'cooldown'
      }
    });

    console.log('\n🔍 所有冷却期规则:');
    allCooldownRules.forEach((rule, index) => {
      console.log(`${index + 1}. ${rule.name} (${rule.enabled ? '启用' : '禁用'}) - ${rule.parameters.cooldownPeriod}秒`);
    });

    // 模拟一次风险评估看看实际使用的参数
    console.log('\n🧪 模拟风险评估测试...');
    
    // 获取最新的交易记录
    const recentTrade = await prisma.trade.findFirst({
      where: {
        status: 'executed'
      },
      orderBy: { timestamp: 'desc' }
    });

    if (recentTrade) {
      const now = Date.now();
      const tradeTime = new Date(recentTrade.timestamp).getTime();
      const timeSinceLastTrade = Math.floor((now - tradeTime) / 1000);
      
      console.log(`最近交易时间: ${recentTrade.timestamp}`);
      console.log(`距离上次交易: ${timeSinceLastTrade} 秒`);
      console.log(`数据库中冷却期: ${cooldownRule.parameters.cooldownPeriod} 秒`);
      console.log(`是否满足冷却期: ${timeSinceLastTrade >= cooldownRule.parameters.cooldownPeriod ? '是' : '否'}`);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCurrentCooldown();