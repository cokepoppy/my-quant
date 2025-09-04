const axios = require('axios');

async function testBalanceFix() {
  try {
    console.log('🧪 Testing complete balance synchronization fix...\n');
    
    // 1. First check if backend is healthy
    console.log('1. Checking backend health...');
    const healthResponse = await axios.get('http://localhost:8000/health');
    console.log('✅ Backend is healthy:', healthResponse.data);
    
    // 2. Get exchange accounts
    console.log('\n2. Getting exchange accounts...');
    const exchangesResponse = await axios.get('http://localhost:8000/exchange');
    console.log('✅ Exchange accounts found:', exchangesResponse.data.data?.length || 0);
    
    if (!exchangesResponse.data.data || exchangesResponse.data.data.length === 0) {
      console.log('❌ No exchange accounts found');
      return;
    }
    
    // 3. Test balance API for each exchange
    console.log('\n3. Testing balance API for each exchange...');
    
    for (const exchange of exchangesResponse.data.data) {
      console.log(`\n🏦 Testing exchange: ${exchange.name} (${exchange.id})`);
      
      try {
        const balanceResponse = await axios.get(`http://localhost:8000/exchange/${exchange.id}/balance`);
        console.log('✅ Balance API response:', balanceResponse.data);
        
        if (balanceResponse.data.success && balanceResponse.data.data) {
          const balances = balanceResponse.data.data;
          console.log(`📊 Found ${balances.length} balance entries`);
          
          let totalValue = 0;
          for (const balance of balances) {
            console.log(`   ${balance.asset}: ${balance.free} (USD: $${balance.valueInUSD || 0})`);
            totalValue += balance.valueInUSD || 0;
          }
          
          console.log(`💰 Total portfolio value: $${totalValue.toFixed(2)}`);
          
          if (totalValue > 0) {
            console.log('🎉 SUCCESS: Balance synchronization is working!');
          } else {
            console.log('⚠️  WARNING: Balance API responded but total value is 0');
          }
        } else {
          console.log('❌ Balance API returned no data');
        }
      } catch (error) {
        console.log('❌ Balance API failed:', error.response?.data || error.message);
      }
    }
    
    console.log('\n✅ Balance synchronization test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testBalanceFix();