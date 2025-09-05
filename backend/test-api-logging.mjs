#!/usr/bin/env node

// 测试API调用详细日志
import { exchangeService } from './src/exchanges/ExchangeService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testApiLogging() {
  try {
    console.log('🧪 测试API调用详细日志...\n');

    // 1. 加载交易所配置
    console.log('🔄 加载交易所配置...');
    await exchangeService.loadExchangesFromDatabase();
    
    // 2. 获取可用的交易所
    const statuses = exchangeService.getAllExchangeStatuses();
    const exchangeIds = Object.keys(statuses);
    
    if (exchangeIds.length === 0) {
      console.log('❌ 没有可用的交易所连接');
      return;
    }
    
    const exchangeId = exchangeIds[0];
    console.log(`🎯 使用交易所: ${exchangeId}\n`);
    
    // 3. 测试API调用 - 获取市场价格
    console.log('📈 测试获取市场价格 API...');
    console.log('='.repeat(50));
    
    const startTime = Date.now();
    const ticker = await exchangeService.getTicker(exchangeId, 'BTCUSDT');
    const endTime = Date.now();
    
    console.log('='.repeat(50));
    console.log('✅ 市场价格API调用完成');
    console.log('⏱️  耗时:', endTime - startTime, 'ms');
    console.log('📊 结果:', JSON.stringify(ticker, null, 2));
    
    console.log('\n' + '='.repeat(50));
    
    // 4. 测试API调用 - 获取订单簿
    console.log('📚 测试获取订单簿 API...');
    console.log('='.repeat(50));
    
    const orderbookStartTime = Date.now();
    const orderbook = await exchangeService.getOrderBook(exchangeId, 'BTCUSDT', 3);
    const orderbookEndTime = Date.now();
    
    console.log('='.repeat(50));
    console.log('✅ 订单簿API调用完成');
    console.log('⏱️  耗时:', orderbookEndTime - orderbookStartTime, 'ms');
    console.log('📊 结果:', JSON.stringify(orderbook, null, 2));
    
    console.log('\n' + '='.repeat(50));
    
    // 5. 测试API调用 - 获取账户余额
    console.log('💰 测试获取账户余额 API...');
    console.log('='.repeat(50));
    
    const balanceStartTime = Date.now();
    const balances = await exchangeService.getBalance(exchangeId);
    const balanceEndTime = Date.now();
    
    console.log('='.repeat(50));
    console.log('✅ 账户余额API调用完成');
    console.log('⏱️  耗时:', balanceEndTime - balanceStartTime, 'ms');
    console.log('📊 结果:', JSON.stringify(balances, null, 2));
    
    console.log('\n🎉 API调用日志测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    console.error('📊 错误详情:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
  } finally {
    await prisma.$disconnect();
  }
}

testApiLogging();