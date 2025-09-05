const axios = require('axios');

async function testBalanceAPI() {
  try {
    // First, get the list of exchanges to find the correct ID
    console.log('🔍 Getting exchange list...');
    const exchangesResponse = await axios.get('http://localhost:8000/api/exchange', {
      headers: {
        'Authorization': 'Bearer test-token' // You may need to replace this with a valid token
      }
    });
    
    console.log('Exchanges response:', JSON.stringify(exchangesResponse.data, null, 2));
    
    if (exchangesResponse.data.success && exchangesResponse.data.data.length > 0) {
      const firstExchange = exchangesResponse.data.data[0];
      console.log(`\n📊 Testing balance for exchange: ${firstExchange.name} (ID: ${firstExchange.id})`);
      
      // Test balance API
      const balanceResponse = await axios.get(`http://localhost:8000/api/exchange/${firstExchange.id}/balance`, {
        headers: {
          'Authorization': 'Bearer test-token' // You may need to replace this with a valid token
        }
      });
      
      console.log('Balance response:', JSON.stringify(balanceResponse.data, null, 2));
    } else {
      console.log('❌ No exchanges found');
    }
    
  } catch (error) {
    console.error('❌ Error testing balance API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testBalanceAPI();