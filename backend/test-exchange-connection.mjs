#!/usr/bin/env node

// 测试真实交易所连接
import { exchangeService } from './src/exchanges/ExchangeService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testExchangeConnection() {
  try {
    console.log('🔧 测试真实交易所连接...\n');

    // 1. 检查配置的账户
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      take: 2
    });

    console.log('📋 配置的账户:');
    accounts.forEach(account => {
      console.log(`- ${account.name} (${account.exchange}, testnet: ${account.testnet})`);
    });

    if (accounts.length === 0) {
      console.log('❌ 没有找到活跃的交易所账户');
      return;
    }

    // 2. 测试第一个账户的连接
    const testAccount = accounts[0];
    console.log(`\n🔗 测试连接: ${testAccount.name} (${testAccount.exchange})`);

    // 3. 手动加载交易所配置
    console.log('\n🔄 手动加载交易所配置...');
    await exchangeService.loadExchangesFromDatabase();
    
    // 4. 检查交易所服务状态
    console.log('\n📊 交易所服务状态:');
    const statuses = exchangeService.getAllExchangeStatuses();
    console.log('- 已配置的交易所数量:', Object.keys(statuses).length);
    
    // 显示连接状态
    for (const [exchangeId, status] of Object.entries(statuses)) {
      console.log(`- ${exchangeId}: ${status.connected ? '已连接' : '未连接'} (${status.exchange})`);
    }
    
    // 5. 获取第一个可用的交易所ID
    const availableExchangeIds = Object.keys(statuses);
    if (availableExchangeIds.length === 0) {
      console.log('❌ 没有可用的交易所连接');
      return;
    }
    
    const firstExchangeId = availableExchangeIds[0];
    console.log(`\n🎯 使用交易所ID: ${firstExchangeId}`);
    
    // 6. 测试获取账户余额
    try {
      console.log('\n💰 测试获取账户余额...');
      const balances = await exchangeService.getBalance(firstExchangeId);
      console.log('✅ 余额获取成功:', balances.length, '个资产');
      if (balances.length > 0) {
        console.log('主要资产:');
        balances.slice(0, 3).forEach(balance => {
          console.log(`- ${balance.asset}: ${balance.free} (可用), ${balance.total} (总计)`);
        });
      }
    } catch (error) {
      console.log('❌ 获取余额失败:', error.message);
    }

    // 7. 测试获取市场价格
    try {
      console.log('\n📈 测试获取市场价格...');
      const ticker = await exchangeService.getTicker(firstExchangeId, 'BTCUSDT');
      console.log('✅ 价格获取成功:');
      console.log(`- BTC/USDT: ${ticker.last} (${ticker.change}% ${ticker.change >= 0 ? '↑' : '↓'})`);
    } catch (error) {
      console.log('❌ 获取价格失败:', error.message);
    }

    // 8. 测试获取订单簿
    try {
      console.log('\n📚 测试获取订单簿...');
      const orderbook = await exchangeService.getOrderBook(firstExchangeId, 'BTCUSDT', 5);
      console.log('✅ 订单簿获取成功:');
      console.log(`- 买一: ${orderbook.bids[0]?.price} @ ${orderbook.bids[0]?.quantity}`);
      console.log(`- 卖一: ${orderbook.asks[0]?.price} @ ${orderbook.asks[0]?.quantity}`);
    } catch (error) {
      console.log('❌ 获取订单簿失败:', error.message);
    }

    console.log('\n🎉 交易所连接测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testExchangeConnection();