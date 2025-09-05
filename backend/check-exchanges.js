const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkExchanges() {
  try {
    console.log('🔍 查询数据库中的交易所配置...\n');
    
    const exchanges = await prisma.exchange.findMany();
    console.log(`📊 找到 ${exchanges.length} 个交易所配置:\n`);
    
    exchanges.forEach((ex, index) => {
      console.log(`${index + 1}. 交易所配置:`);
      console.log(`   ID: ${ex.id}`);
      console.log(`   邮箱: ${ex.email}`);
      console.log(`   交易所类型: ${ex.exchangeType}`);
      console.log(`   状态: ${ex.isActive ? '启用' : '禁用'}`);
      console.log(`   测试网: ${ex.testnet}`);
      console.log(`   创建时间: ${ex.createdAt}`);
      console.log('---');
    });
    
    // 同时检查账户表
    console.log('\n🔍 查询账户表...\n');
    const accounts = await prisma.account.findMany();
    console.log(`📊 找到 ${accounts.length} 个账户:\n`);
    
    accounts.forEach((acc, index) => {
      console.log(`${index + 1}. 账户信息:`);
      console.log(`   ID: ${acc.id}`);
      console.log(`   用户ID: ${acc.userId}`);
      console.log(`   名称: ${acc.name}`);
      console.log(`   类型: ${acc.type}`);
      console.log(`   余额: ${acc.balance}`);
      console.log(`   状态: ${acc.isActive ? '启用' : '禁用'}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkExchanges();