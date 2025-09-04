#!/usr/bin/env node

// Import ExchangeService and test reload
const path = require('path');
const { ExchangeService } = require('./src/exchanges/ExchangeService');

async function testExchangeReload() {
  console.log('🔍 Testing exchange reload...\n');
  
  try {
    const exchangeService = new ExchangeService();
    
    // Clear existing exchanges
    exchangeService.exchanges.clear();
    console.log('🗑️  Cleared existing exchanges');
    
    // Reload from database
    console.log('🔄 Reloading exchanges from database...');
    await exchangeService.loadExchangesFromDatabase();
    
    // Check loaded exchanges
    console.log(`\n📋 Loaded ${exchangeService.exchanges.size} exchanges:`);
    for (const [id, exchange] of exchangeService.exchanges) {
      console.log(`   ✅ ${id}`);
    }
    
    // Test the specific exchange that's failing
    const failingId = 'bybit_1756707550542_tsfer5hxm';
    const exchange = exchangeService.exchanges.get(failingId);
    
    if (exchange) {
      console.log(`\n🎯 Testing failing exchange: ${failingId}`);
      try {
        const balance = await exchange.getBalance();
        console.log('✅ Balance fetch successful:', balance);
      } catch (error) {
        console.log('❌ Balance fetch failed:', error.message);
      }
    } else {
      console.log(`\n❌ Exchange ${failingId} not found in loaded exchanges`);
    }
    
  } catch (error) {
    console.error('❌ Exchange reload test failed:', error.message);
  }
}

testExchangeReload();