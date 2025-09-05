#!/usr/bin/env node

// Direct test of BybitAdapter to understand why getTicker is failing
import { BybitAdapter } from './src/exchanges/adapters/BybitAdapter';
import { ExchangeConfig } from './src/exchanges/types';

async function testBybitAdapterDirectly() {
  try {
    console.log('🧪 Testing BybitAdapter directly...\n');

    // Create exchange config (using the same config as the working exchange)
    const exchangeConfig: ExchangeConfig = {
      id: 'bybit_1756707550542_tsfer5hxm',
      name: 'Bybit',
      apiKey: process.env.BYBIT_API_KEY || 'your_api_key_here',
      apiSecret: process.env.BYBIT_API_SECRET || 'your_api_secret_here',
      testnet: true,
      enableRateLimit: true
    };

    console.log('📋 Exchange config:', {
      id: exchangeConfig.id,
      name: exchangeConfig.name,
      testnet: exchangeConfig.testnet
    });

    // Create adapter instance
    const adapter = new BybitAdapter(exchangeConfig);

    // Test 1: Get ticker for BTC/USDT
    console.log('\n🔍 Testing getTicker for BTC/USDT...');
    try {
      const ticker = await adapter.getTicker('BTC/USDT');
      console.log('✅ Ticker response:', JSON.stringify(ticker, null, 2));
    } catch (error) {
      console.log('❌ Ticker error:', error.message);
      console.log('📊 Full error:', error);
    }

    // Test 2: Get balance
    console.log('\n🔍 Testing getBalance...');
    try {
      const balance = await adapter.getBalance();
      console.log('✅ Balance response:', JSON.stringify(balance, null, 2));
    } catch (error) {
      console.log('❌ Balance error:', error.message);
      console.log('📊 Full error:', error);
    }

    // Test 3: Get positions
    console.log('\n🔍 Testing getPositions...');
    try {
      const positions = await adapter.getPositions();
      console.log('✅ Positions response:', JSON.stringify(positions, null, 2));
    } catch (error) {
      console.log('❌ Positions error:', error.message);
      console.log('📊 Full error:', error);
    }

    console.log('\n🎉 Direct adapter testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testBybitAdapterDirectly();