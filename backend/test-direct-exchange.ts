#!/usr/bin/env node

// Simple test script to trigger Bybit API calls directly through ExchangeService
import { exchangeService } from './src/exchanges/ExchangeService';

async function testBybitDirect() {
  try {
    console.log('🧪 Testing Bybit API calls directly through ExchangeService...\n');

    // Test 1: Get ticker for BTC/USDT
    console.log('🔍 Testing getTicker for BTC/USDT...');
    try {
      const ticker = await exchangeService.getTicker('bybit_1756707550542_tsfer5hxm', 'BTC/USDT');
      console.log('✅ Ticker response:', JSON.stringify(ticker, null, 2));
    } catch (error) {
      console.log('❌ Ticker error:', error.message);
    }

    // Test 2: Get balance
    console.log('\n🔍 Testing getBalance...');
    try {
      const balance = await exchangeService.getBalance('bybit_1756707550542_tsfer5hxm');
      console.log('✅ Balance response:', JSON.stringify(balance, null, 2));
    } catch (error) {
      console.log('❌ Balance error:', error.message);
    }

    // Test 3: Get positions
    console.log('\n🔍 Testing getPositions...');
    try {
      const positions = await exchangeService.getPositions('bybit_1756707550542_tsfer5hxm');
      console.log('✅ Positions response:', JSON.stringify(positions, null, 2));
    } catch (error) {
      console.log('❌ Positions error:', error.message);
    }

    // Test 4: Get orders
    console.log('\n🔍 Testing getOrders...');
    try {
      const orders = await exchangeService.getOrders('bybit_1756707550542_tsfer5hxm');
      console.log('✅ Orders response:', JSON.stringify(orders, null, 2));
    } catch (error) {
      console.log('❌ Orders error:', error.message);
    }

    console.log('\n🎉 Direct testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testBybitDirect();