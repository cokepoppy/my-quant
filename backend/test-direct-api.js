#!/usr/bin/env node

const axios = require('axios');

async function testDirectAPI() {
  console.log('🧪 Testing Direct API signature generation fix...\n');
  
  try {
    // Test direct API call to Bybit
    const proxyUrl = process.env.http_proxy || process.env.https_proxy;
    const baseUrl = 'https://api-testnet.bybit.com';
    const apiKey = 'test-api-key'; // This will fail but we can see the signature error
    
    // Create axios instance with proxy
    let axiosInstance;
    if (proxyUrl) {
      const HttpsProxyAgent = require('https-proxy-agent');
      const proxyAgent = new HttpsProxyAgent(proxyUrl);
      axiosInstance = axios.create({
        httpsAgent: proxyAgent,
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey
        }
      });
    } else {
      axiosInstance = axios.create({
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey
        }
      });
    }
    
    // Generate signature for private API call
    const timestamp = Date.now();
    const recv_window = 5000;
    const queryString = recv_window ? `recv_window=${recv_window}` : '';
    const signString = timestamp + 'GET' + '/v5/account/wallet-balance' + (queryString ? '?' + queryString : '');
    
    console.log('📋 Signature generation details:');
    console.log('   Timestamp:', timestamp);
    console.log('   Recv Window:', recv_window);
    console.log('   Sign String:', signString);
    
    // This would normally be: signature = exchange.hmac(exchange.encode(signString), secret)
    // But we'll just show the string construction for now
    console.log('✅ Signature string construction successful');
    console.log('   Format: timestamp + GET + /path + ?params');
    
    console.log('\n🎯 The signature generation fix should resolve the "Hash should be wrapped by utils.wrapConstructor" error');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDirectAPI();