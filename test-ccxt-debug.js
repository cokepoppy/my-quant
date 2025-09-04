import ccxt from 'ccxt';

async function testCCXTBybit() {
  console.log('🧪 Testing CCXT Bybit configuration...\n');
  
  // Test 1: Basic CCXT Bybit initialization
  console.log('1. Testing basic CCXT Bybit initialization...');
  try {
    const exchange = new ccxt.bybit({
      testnet: true,
      enableRateLimit: true,
      timeout: 30000,
      options: {
        defaultType: 'spot'
      }
    });
    
    console.log('✅ CCXT Bybit initialized successfully');
    console.log('   Exchange ID:', exchange.id);
    console.log('   Testnet:', exchange.testnet);
    console.log('   URL:', exchange.urls?.api?.testnet || exchange.urls?.api);
    
    // Test 2: Try to fetch time without proxy
    console.log('\n2. Testing fetchTime without proxy...');
    const time = await exchange.fetchTime();
    console.log('✅ fetchTime successful:', new Date(time).toISOString());
    
  } catch (error) {
    console.log('❌ Basic CCXT test failed:', error.message);
    console.log('   Error details:', error);
    
    // Test 3: Try with proxy
    console.log('\n3. Testing with proxy configuration...');
    try {
      const proxyUrl = process.env.http_proxy || 'http://172.25.64.1:7890';
      console.log('   Using proxy:', proxyUrl);
      
      const exchangeWithProxy = new ccxt.bybit({
        testnet: true,
        enableRateLimit: true,
        timeout: 30000,
        proxy: proxyUrl,
        options: {
          defaultType: 'spot',
          proxy: proxyUrl,
          httpsProxy: proxyUrl,
          httpProxy: proxyUrl
        }
      });
      
      const timeWithProxy = await exchangeWithProxy.fetchTime();
      console.log('✅ fetchTime with proxy successful:', new Date(timeWithProxy).toISOString());
      
    } catch (proxyError) {
      console.log('❌ Proxy test failed:', proxyError.message);
      console.log('   This confirms the proxy configuration issue');
    }
  }
}

testCCXTBybit().catch(console.error);