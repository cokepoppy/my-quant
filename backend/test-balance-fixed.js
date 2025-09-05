const axios = require('axios');

// Test the balance API with proper authentication
async function testBalanceAPI() {
  try {
    // First, let's test the health endpoint
    console.log('🔍 Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:8000/health');
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Now let's try to get the exchange list without authentication first
    console.log('\n🔍 Testing exchange list endpoint...');
    try {
      const exchangesResponse = await axios.get('http://localhost:8000/api/exchange');
      console.log('Exchange list response:', exchangesResponse.status, exchangesResponse.data);
    } catch (error) {
      console.log('❌ Exchange list failed (expected without auth):', error.response?.status, error.response?.data);
    }
    
    // Let's try to test with a mock authentication token
    console.log('\n🔍 Testing with mock authentication...');
    try {
      const exchangesResponse = await axios.get('http://localhost:8000/api/exchange', {
        headers: {
          'Authorization': 'Bearer mock-token-123'
        }
      });
      console.log('✅ Exchange list with auth:', exchangesResponse.status);
      
      if (exchangesResponse.data.success && exchangesResponse.data.data.length > 0) {
        const firstExchange = exchangesResponse.data.data[0];
        console.log(`📊 First exchange: ${firstExchange.name} (ID: ${firstExchange.id}, AccountID: ${firstExchange.accountId})`);
        
        // Test balance API
        console.log(`\n🔍 Testing balance for exchange ID: ${firstExchange.id}`);
        const balanceResponse = await axios.get(`http://localhost:8000/api/exchange/${firstExchange.id}/balance`, {
          headers: {
            'Authorization': 'Bearer mock-token-123'
          }
        });
        
        console.log('✅ Balance response:', balanceResponse.status, balanceResponse.data);
      } else {
        console.log('❌ No exchanges found in response');
      }
    } catch (error) {
      console.log('❌ Error with authentication:', error.response?.status, error.response?.data);
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