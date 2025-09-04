import ccxt from 'ccxt';

async function testCCXTWithoutProxy() {
  console.log('🧪 Testing CCXT without proxy (just for comparison)...\n');
  
  try {
    const exchange = new ccxt.bybit({
      testnet: true,
      enableRateLimit: true,
      timeout: 30000,
      options: {
        defaultType: 'spot'
      }
    });
    
    console.log('CCXT Bybit initialized successfully');
    console.log('Testing fetchTime...');
    
    const time = await exchange.fetchTime();
    console.log('✅ SUCCESS:', new Date(time).toISOString());
    
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
}

async function testManualProxy() {
  console.log('\n🧪 Testing manual proxy approach...\n');
  
  // Instead of using CCXT's proxy, we'll manually handle proxy requests
  const axios = require('axios');
  const HttpsProxyAgent = require('https-proxy-agent');
  
  const proxyUrl = process.env.http_proxy || 'http://172.25.64.1:7890';
  console.log('Using proxy:', proxyUrl);
  
  try {
    const proxyAgent = new HttpsProxyAgent(proxyUrl);
    
    const response = await axios.get('https://api-testnet.bybit.com/v5/market/time', {
      httpsAgent: proxyAgent,
      timeout: 15000
    });
    
    console.log('✅ Manual proxy request successful');
    console.log('Server time:', new Date(response.data.result.timeSecond * 1000).toISOString());
    
  } catch (error) {
    console.log('❌ Manual proxy request failed:', error.message);
  }
}

async function testCCXTEnvironment() {
  console.log('\n🧪 Testing CCXT with environment variables...\n');
  
  // Save original environment
  const originalProxy = process.env.HTTP_PROXY;
  const originalHttpsProxy = process.env.HTTPS_PROXY;
  
  try {
    // Set environment variables
    process.env.HTTP_PROXY = process.env.http_proxy;
    process.env.HTTPS_PROXY = process.env.https_proxy;
    
    const exchange = new ccxt.bybit({
      testnet: true,
      enableRateLimit: true,
      timeout: 30000,
      options: {
        defaultType: 'spot'
      }
    });
    
    console.log('Testing fetchTime with environment proxy...');
    const time = await exchange.fetchTime();
    console.log('✅ SUCCESS:', new Date(time).toISOString());
    
  } catch (error) {
    console.log('❌ Environment proxy test failed:', error.message);
  } finally {
    // Restore original environment
    process.env.HTTP_PROXY = originalProxy;
    process.env.HTTPS_PROXY = originalHttpsProxy;
  }
}

async function runAllTests() {
  await testCCXTWithoutProxy();
  await testManualProxy();
  await testCCXTEnvironment();
}

runAllTests().catch(console.error);