import ccxt from 'ccxt';

async function testProxyConfigs() {
  console.log('🧪 Testing different proxy configurations...\n');
  
  const proxyUrl = process.env.http_proxy || 'http://172.25.64.1:7890';
  
  const configs = [
    {
      name: 'Basic proxy',
      config: { proxy: proxyUrl }
    },
    {
      name: 'Proxy without http://',
      config: { proxy: proxyUrl.replace('http://', '') }
    },
    {
      name: 'Proxy with options only',
      config: { 
        options: {
          proxy: proxyUrl
        }
      }
    },
    {
      name: 'Full proxy configuration',
      config: {
        proxy: proxyUrl,
        options: {
          proxy: proxyUrl,
          httpsProxy: proxyUrl,
          httpProxy: proxyUrl
        }
      }
    },
    {
      name: 'Agent-based proxy',
      config: {
        proxy: proxyUrl,
        agent: require('https-proxy-agent')(proxyUrl)
      }
    }
  ];
  
  for (const { name, config } of configs) {
    console.log(`\n--- Testing: ${name} ---`);
    console.log('Config:', JSON.stringify(config, null, 2));
    
    try {
      const exchange = new ccxt.bybit({
        testnet: true,
        enableRateLimit: true,
        timeout: 15000,
        ...config,
        options: {
          defaultType: 'spot',
          ...config.options
        }
      });
      
      const time = await exchange.fetchTime();
      console.log('✅ SUCCESS:', new Date(time).toISOString());
      
    } catch (error) {
      console.log('❌ FAILED:', error.message);
      if (error.message.includes('Invalid URL')) {
        console.log('   This is the "Invalid URL" error we need to fix');
      }
    }
  }
}

testProxyConfigs().catch(console.error);