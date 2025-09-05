#!/usr/bin/env node

// 修改冷却期为5秒
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateCooldownTo5Seconds() {
  try {
    console.log('🔧 修改冷却期为5秒...\n');

    // 查找当前的冷却期规则
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

    console.log('📋 当前冷却期规则:');
    console.log('  - 规则ID:', cooldownRule.id);
    console.log('  - 规则名称:', cooldownRule.name);
    console.log('  - 当前冷却期:', cooldownRule.parameters.cooldownPeriod, '秒');

    // 修改冷却期为5秒
    const newCooldownPeriod = 5;
    const updatedRule = await prisma.riskRule.update({
      where: { id: cooldownRule.id },
      data: {
        parameters: {
          ...cooldownRule.parameters,
          cooldownPeriod: newCooldownPeriod
        }
      }
    });

    console.log('\n✅ 冷却期已更新:');
    console.log('  - 新的冷却期:', newCooldownPeriod, '秒');
    console.log('  - 更新时间:', updatedRule.updatedAt);

    console.log('\n💡 现在你可以每5秒进行一次交易');

  } catch (error) {
    console.error('❌ 修改冷却期失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCooldownTo5Seconds();