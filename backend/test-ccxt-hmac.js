#!/usr/bin/env node

const ccxt = require('ccxt');

async function testCCXTHMAC() {
  console.log('🧪 Testing CCXT HMAC methods...\n');
  
  try {
    const exchange = new ccxt.bybit({
      testnet: true,
      enableRateLimit: true,
      timeout: 30000,
      apiKey: 'test-api-key',
      secret: 'test-secret-key'
    });
    
    console.log('✅ CCXT Bybit instance created');
    
    // Test different ways to generate HMAC
    const signString = '1756801453898GET/v5/account/wallet-balance?recv_window=5000';
    
    console.log('🔍 Testing different HMAC approaches...');
    
    // Method 1: Direct hmac (what we tried)
    try {
      const encoded = exchange.encode(signString);
      console.log('   Encoded string:', encoded);
      
      const signature1 = exchange.hmac(encoded, exchange.secret);
      console.log('   ✅ Method 1 (exchange.hmac) successful:', signature1);
      
    } catch (error) {
      console.log('   ❌ Method 1 failed:', error.message);
    }
    
    // Method 2: Using the internal v5 signing method
    try {
      // Bybit V5 uses a specific signing method
      const timestamp = Date.now();
      const recv_window = 5000;
      const params = { accountType: 'UNIFIED', recv_window };
      
      // Create the signature string according to Bybit V5 API
      const paramString = new URLSearchParams(params).toString();
      const path = '/v5/account/wallet-balance';
      const queryString = paramString ? `${path}?${paramString}` : path;
      const signString = timestamp + 'GET' + queryString;
      
      console.log('   Sign string for V5:', signString);
      
      // Use CCXT's built-in signing for Bybit V5
      const signature = exchange.hmac(exchange.encode(signString), exchange.secret);
      console.log('   ✅ Method 2 (V5 signing) successful:', signature);
      
    } catch (error) {
      console.log('   ❌ Method 2 failed:', error.message);
    }
    
    // Method 3: Using node crypto directly (fallback)
    try {
      const crypto = require('crypto');
      const signature = crypto.createHmac('sha256', exchange.secret).update(signString, 'utf8').digest('hex');
      console.log('   ✅ Method 3 (Node crypto) successful:', signature);
      
    } catch (error) {
      console.log('   ❌ Method 3 failed:', error.message);
    }
    
    console.log('\n🎯 The best approach is Method 3 (Node crypto) for direct API calls');
    
  } catch (error) {
    console.error('❌ CCXT HMAC test failed:', error.message);
  }
}

testCCXTHMAC();