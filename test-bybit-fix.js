#!/usr/bin/env node

/**
 * Bybit API Fix Script
 * This script implements the fix for CCXT proxy connectivity issues
 */

const ccxt = require('ccxt');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

console.log('🔧 Bybit API Connectivity Fix\n');

async function testFixedCCXT() {
  try {
    const proxyUrl = process.env.http_proxy || process.env.https_proxy;
    console.log('Testing fixed CCXT configuration...');
    console.log('Proxy URL:', proxyUrl || 'None');
    
    // Method 1: Direct CCXT with explicit proxy
    console.log('\n1. Testing CCXT with explicit proxy configuration...');
    try {
      const bybit1 = new ccxt.bybit({
        apiKey: process.env.BYBIT_API_KEY,
        secret: process.env.BYBIT_API_SECRET,
        testnet: process.env.BYBIT_TESTNET === 'true',
        enableRateLimit: true,
        timeout: 30000,
        options: {
          defaultType: 'spot'
        },
        // Explicit proxy configuration
        proxy: proxyUrl
      });

      const time1 = await bybit1.fetchTime();
      console.log('   ✅ Method 1 (explicit proxy):', new Date(time1).toISOString());
    } catch (error) {
      console.log('   ❌ Method 1 failed:', error.message);
    }

    // Method 2: CCXT with agent configuration
    console.log('\n2. Testing CCXT with HTTPS agent...');
    try {
      const bybit2 = new ccxt.bybit({
        apiKey: process.env.BYBIT_API_KEY,
        secret: process.env.BYBIT_API_SECRET,
        testnet: process.env.BYBIT_TESTNET === 'true',
        enableRateLimit: true,
        timeout: 30000,
        options: {
          defaultType: 'spot',
          agent: proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined
        }
      });

      const time2 = await bybit2.fetchTime();
      console.log('   ✅ Method 2 (HTTPS agent):', new Date(time2).toISOString());
    } catch (error) {
      console.log('   ❌ Method 2 failed:', error.message);
    }

    // Method 3: Custom CCXT with manual URL override
    console.log('\n3. Testing CCXT with manual URL override...');
    try {
      const bybit3 = new ccxt.bybit({
        apiKey: process.env.BYBIT_API_KEY,
        secret: process.env.BYBIT_API_SECRET,
        testnet: process.env.BYBIT_TESTNET === 'true',
        enableRateLimit: true,
        timeout: 30000,
        options: {
          defaultType: 'spot'
        },
        proxy: proxyUrl
      });

      // Manually set the correct URLs
      if (bybit3.testnet) {
        bybit3.urls = {
          api: {
            public: 'https://api-testnet.bybit.com',
            private: 'https://api-testnet.bybit.com',
            v5: 'https://api-testnet.bybit.com'
          }
        };
      }

      const time3 = await bybit3.fetchTime();
      console.log('   ✅ Method 3 (manual URL):', new Date(time3).toISOString());
    } catch (error) {
      console.log('   ❌ Method 3 failed:', error.message);
    }

    // Method 4: Test without proxy
    console.log('\n4. Testing CCXT without proxy...');
    try {
      // Temporarily clear proxy
      const originalProxy = process.env.http_proxy;
      const originalHttpsProxy = process.env.https_proxy;
      delete process.env.http_proxy;
      delete process.env.https_proxy;

      const bybit4 = new ccxt.bybit({
        apiKey: process.env.BYBIT_API_KEY,
        secret: process.env.BYBIT_API_SECRET,
        testnet: process.env.BYBIT_TESTNET === 'true',
        enableRateLimit: true,
        timeout: 30000,
        options: {
          defaultType: 'spot'
        }
      });

      const time4 = await bybit4.fetchTime();
      console.log('   ✅ Method 4 (no proxy):', new Date(time4).toISOString());

      // Restore proxy
      process.env.http_proxy = originalProxy;
      process.env.https_proxy = originalHttpsProxy;
    } catch (error) {
      console.log('   ❌ Method 4 failed:', error.message);
    }

  } catch (error) {
    console.log('Test failed:', error.message);
  }
}

testFixedCCXT().catch(console.error);