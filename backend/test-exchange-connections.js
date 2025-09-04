#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const ccxt = require('ccxt');

async function testExchangeConnections() {
  console.log('🔍 Testing exchange connections...\n');
  
  try {
    const prisma = new PrismaClient();
    
    // Get all accounts
    const accounts = await prisma.account.findMany({
      where: { syncStatus: 'connected' }
    });
    
    console.log(`📋 Testing ${accounts.length} accounts:\n`);
    
    for (const account of accounts) {
      console.log(`🔍 Testing account: ${account.accountId}`);
      console.log(`   Email: ${account.email || 'N/A'}`);
      console.log(`   Exchange: ${account.exchange}`);
      console.log(`   Testnet: ${account.testnet}`);
      
      try {
        // Create exchange config
        const exchangeConfig = {
          id: account.accountId,
          name: account.exchange.charAt(0).toUpperCase() + account.exchange.slice(1),
          apiKey: account.apiKey,
          apiSecret: account.apiSecret,
          passphrase: account.passphrase || undefined,
          testnet: account.testnet,
          enableRateLimit: true
        };
        
        console.log(`   API Key: ${account.apiKey ? '✅ Present' : '❌ Missing'}`);
        console.log(`   API Secret: ${account.apiSecret ? '✅ Present' : '❌ Missing'}`);
        
        // Test basic connection
        const exchange = new ccxt.bybit(exchangeConfig);
        
        console.log(`   📡 Testing basic connectivity...`);
        const time = await exchange.fetchTime();
        console.log(`   ✅ Basic connectivity: ${new Date(time).toISOString()}`);
        
        // Test account access
        console.log(`   🔗 Testing account access...`);
        const balance = await exchange.fetchBalance();
        console.log(`   ✅ Account access successful`);
        console.log(`   💰 Total balance: ${balance.total ? Object.keys(balance.total).length : 0} currencies`);
        
      } catch (error) {
        console.log(`   ❌ Connection failed: ${error.message}`);
        if (error.message.includes('timestamp')) {
          console.log(`   ⚠️  Timestamp sync issue - this is expected with test credentials`);
        }
      }
      
      console.log('');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Failed to test exchange connections:', error.message);
  }
}

testExchangeConnections();