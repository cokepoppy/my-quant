#!/usr/bin/env node

const axios = require('axios');

async function testBalanceAPI() {
  console.log('🧪 Testing Balance API after CCXT fixes...\n');
  
  try {
    // First, login to get token
    console.log('1. Logging in to get authentication token...');
    const loginResponse = await axios.post('http://localhost:8000/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    
    // Get exchange accounts
    console.log('\n2. Getting exchange accounts...');
    const exchangesResponse = await axios.get('http://localhost:8000/exchange', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!exchangesResponse.data.success) {
      throw new Error('Failed to get exchanges');
    }
    
    const exchanges = exchangesResponse.data.data;
    console.log(`✅ Found ${exchanges.length} exchange accounts`);
    
    // Test balance for each exchange
    for (const exchange of exchanges) {
      console.log(`\n3. Testing balance for exchange: ${exchange.name} (${exchange.id})`);
      console.log(`   Account ID: ${exchange.accountId}`);
      
      try {
        const balanceResponse = await axios.get(`http://localhost:8000/exchange/${exchange.id}/balance`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
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
        
      } catch (balanceError) {
        console.log('❌ Balance API failed:', balanceError.response?.data || balanceError.message);
      }
    }
    
    console.log('\n✅ Balance API testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testBalanceAPI();