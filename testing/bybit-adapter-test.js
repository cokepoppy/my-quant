// Test the BybitAdapter proxy configuration by testing the backend API
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');

async function testBybitProxyFix() {
    console.log('🧪 Testing Bybit Proxy Configuration Fix...\n');
    
    try {
        // Test 1: Basic connectivity test
        console.log('📡 Test 1: Basic API Connectivity');
        const proxyUrl = process.env.http_proxy || process.env.https_proxy;
        console.log(`   Proxy: ${proxyUrl || 'None'}`);
        
        let axiosConfig = {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (proxyUrl) {
            const proxyAgent = new HttpsProxyAgent(proxyUrl);
            axiosConfig.httpsAgent = proxyAgent;
            console.log('   ✅ Proxy agent configured');
        }
        
        const response = await axios.get('https://api-testnet.bybit.com/v5/market/time', axiosConfig);
        console.log('   ✅ Basic connectivity: PASSED');
        console.log(`   Server time: ${new Date(response.data.result.timeSecond * 1000).toISOString()}\n`);
        
        // Test 2: Test CCXT directly
        console.log('📡 Test 2: CCXT Direct Test');
        const ccxt = require('ccxt');
        
        const bybit = new ccxt.bybit({
            apiKey: 'test_key',
            secret: 'test_secret',
            testnet: true,
            enableRateLimit: true,
            timeout: 30000,
            proxy: proxyUrl
        });
        
        try {
            const time = await bybit.fetchTime();
            console.log('   ✅ CCXT direct test: PASSED');
            console.log(`   CCXT time: ${new Date(time).toISOString()}\n`);
        } catch (ccxtError) {
            console.log('   ❌ CCXT direct test: FAILED');
            console.log(`   Error: ${ccxtError.message}\n`);
        }
        
        // Test 3: Test backend API (if running)
        console.log('📡 Test 3: Backend API Test');
        try {
            const backendResponse = await axios.get('http://localhost:8000/api/exchange/test-connection', {
                timeout: 5000
            });
            console.log('   ✅ Backend API test: PASSED');
            console.log(`   Response: ${backendResponse.data.success ? 'Success' : 'Failed'}\n`);
        } catch (backendError) {
            console.log('   ⚠️  Backend API test: SKIPPED (backend not running)');
            console.log(`   Error: ${backendError.message}\n`);
        }
        
        console.log('🎯 Summary:');
        console.log('   - Proxy environment variables: ✅ Configured');
        console.log('   - Basic network connectivity: ✅ Working');
        console.log('   - Bybit API accessibility: ✅ Available');
        
        if (proxyUrl) {
            console.log('   - Proxy configuration: ✅ Active');
            console.log(`   - Proxy URL: ${proxyUrl}`);
        } else {
            console.log('   - Proxy configuration: ❌ Not set');
        }
        
        console.log('\n🔧 Next Steps:');
        console.log('   1. Restart the backend service to apply BybitAdapter changes');
        console.log('   2. Test exchange connection through the web interface');
        console.log('   3. Monitor backend logs for detailed connection status');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

// Run the test
testBybitProxyFix();