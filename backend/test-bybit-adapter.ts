import { BybitAdapter } from './src/exchanges/adapters/BybitAdapter';
import { ExchangeConfig } from './src/exchanges/types';

// Load environment variables
require('dotenv').config();

async function testBybitAdapter() {
  console.log('🚀 Testing BybitAdapter...');
  
  const config: ExchangeConfig = {
    name: 'bybit',
    apiKey: process.env.BYBIT_API_KEY || process.env.BYBIT_API_KEY_ID || '',
    apiSecret: process.env.BYBIT_API_SECRET || '',
    testnet: process.env.BYBIT_TESTNET === 'true',
    enableRateLimit: true
  };

  console.log('📋 Configuration:');
  console.log(`  Testnet: ${config.testnet}`);
  console.log(`  API Key: ${config.apiKey.substring(0, 8)}...`);
  console.log(`  Enable Rate Limit: ${config.enableRateLimit}`);

  const adapter = new BybitAdapter(config);

  try {
    console.log('\n🔍 Testing connection...');
    const isConnected = await adapter.testConnection();
    
    if (isConnected) {
      console.log('✅ BybitAdapter connection test passed!');
      
      // Test additional functionality
      console.log('\n📊 Testing markets...');
      try {
        const markets = await adapter.getMarkets();
        console.log(`✅ Found ${markets.length} markets`);
      } catch (error) {
        console.log('⚠️  Markets test failed:', error.message);
      }
      
      console.log('\n💰 Testing balance...');
      try {
        const balance = await adapter.getBalance();
        console.log(`✅ Balance retrieved successfully`);
        console.log(`   Assets: ${balance.length}`);
      } catch (error) {
        console.log('⚠️  Balance test failed:', error.message);
      }
      
      console.log('\n📈 Testing ticker...');
      try {
        const ticker = await adapter.getTicker('BTCUSDT');
        console.log(`✅ BTCUSDT ticker: ${ticker.last}`);
      } catch (error) {
        console.log('⚠️  Ticker test failed:', error.message);
      }
      
    } else {
      console.log('❌ BybitAdapter connection test failed');
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
    process.exit(1);
  }
}

testBybitAdapter();