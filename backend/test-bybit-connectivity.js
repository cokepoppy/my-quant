#!/usr/bin/env node

/**
 * Bybit API Connectivity Test Script
 * This script tests various aspects of Bybit API connectivity to identify issues
 */

const ccxt = require('ccxt');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

console.log('🔍 Bybit API Connectivity Test\n');

// Test 1: Environment Variables
console.log('1. Testing Environment Variables...');
console.log('   http_proxy:', process.env.http_proxy || 'Not set');
console.log('   https_proxy:', process.env.https_proxy || 'Not set');
console.log('   BYBIT_API_KEY:', process.env.BYBIT_API_KEY ? 'Set' : 'Not set');
console.log('   BYBIT_API_SECRET:', process.env.BYBIT_API_SECRET ? 'Set' : 'Not set');
console.log('   BYBIT_TESTNET:', process.env.BYBIT_TESTNET || 'Not set');
console.log('');

// Test 2: Basic HTTP connectivity
console.log('2. Testing Basic HTTP Connectivity...');
async function testBasicHttp() {
  try {
    const proxyUrl = process.env.http_proxy || process.env.https_proxy;
    let axiosConfig = {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    if (proxyUrl) {
      console.log(`   Using proxy: ${proxyUrl}`);
      axiosConfig.httpsAgent = new HttpsProxyAgent(proxyUrl);
    }

    const testUrls = [
      'https://api.bybit.com/v5/market/time',
      'https://api-testnet.bybit.com/v5/market/time'
    ];

    for (const url of testUrls) {
      try {
        const response = await axios.get(url, axiosConfig);
        console.log(`   ✅ ${url}: ${response.status} ${response.statusText}`);
        if (response.data.retCode === 0) {
          console.log(`      Server time: ${new Date(response.data.result.timeSecond * 1000).toISOString()}`);
        }
      } catch (error) {
        console.log(`   ❌ ${url}: ${error.message}`);
        if (error.response) {
          console.log(`      Status: ${error.response.status}`);
        }
      }
    }
  } catch (error) {
    console.log('   ❌ HTTP test failed:', error.message);
  }
}

// Test 3: CCXT Configuration
console.log('\n3. Testing CCXT Configuration...');
async function testCCXT() {
  try {
    const proxyUrl = process.env.http_proxy || process.env.https_proxy;
    
    console.log('   Creating CCXT Bybit instance...');
    const bybit = new ccxt.bybit({
      apiKey: process.env.BYBIT_API_KEY || 'demo_key',
      secret: process.env.BYBIT_API_SECRET || 'demo_secret',
      testnet: process.env.BYBIT_TESTNET === 'true',
      enableRateLimit: true,
      timeout: 30000,
      options: {
        defaultType: 'spot'
      }
    });

    // Don't manually set proxy - CCXT should auto-detect from environment
    console.log('   CCXT instance created successfully');
    console.log(`   Testnet: ${bybit.testnet}`);
    console.log(`   Base URL: ${bybit.urls?.api || bybit.urls?.testnet || 'Not configured'}`);
    console.log(`   Timeout: ${bybit.timeout}ms`);

    // Test basic time fetch
    try {
      console.log('   Testing fetchTime()...');
      const time = await bybit.fetchTime();
      console.log(`   ✅ fetchTime(): ${new Date(time).toISOString()}`);
    } catch (error) {
      console.log(`   ❌ fetchTime(): ${error.message}`);
    }

    // Test markets loading
    try {
      console.log('   Testing loadMarkets()...');
      await bybit.loadMarkets();
      console.log(`   ✅ loadMarkets(): Loaded ${Object.keys(bybit.markets).length} markets`);
    } catch (error) {
      console.log(`   ❌ loadMarkets(): ${error.message}`);
    }

    // Test balance fetch (will fail with demo keys but shows connection)
    try {
      console.log('   Testing fetchBalance()...');
      const balance = await bybit.fetchBalance();
      console.log('   ✅ fetchBalance(): Connected successfully');
    } catch (error) {
      console.log(`   ⚠️  fetchBalance(): ${error.message} (expected with demo keys)`);
    }

  } catch (error) {
    console.log('   ❌ CCXT test failed:', error.message);
  }
}

// Test 4: Network Diagnostics
console.log('\n4. Network Diagnostics...');
async function testNetworkDiagnostics() {
  try {
    const { execSync } = require('child_process');
    
    // Test DNS resolution
    try {
      const result = execSync('nslookup api-testnet.bybit.com', { encoding: 'utf8' });
      console.log('   ✅ DNS resolution working');
    } catch (error) {
      console.log('   ❌ DNS resolution failed');
    }

    // Test proxy connectivity
    const proxyUrl = process.env.http_proxy || process.env.https_proxy;
    if (proxyUrl) {
      console.log(`   Testing proxy connectivity to ${proxyUrl}...`);
      try {
        const url = new URL(proxyUrl);
        const testResponse = await axios.get(`http://${url.hostname}:${url.port}`, {
          timeout: 5000
        });
        console.log('   ✅ Proxy connection successful');
      } catch (error) {
        console.log(`   ❌ Proxy connection failed: ${error.message}`);
      }
    } else {
      console.log('   ℹ️  No proxy configured');
    }

  } catch (error) {
    console.log('   ❌ Network diagnostics failed:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  await testBasicHttp();
  await testCCXT();
  await testNetworkDiagnostics();
  
  console.log('\n🔍 Test Summary:');
  console.log('   If basic HTTP works but CCXT fails, the issue is likely in CCXT configuration');
  console.log('   If proxy works for curl but not CCXT, check CCXT proxy handling');
  console.log('   If nothing works, check network connectivity and proxy settings');
}

runAllTests().catch(console.error);