#!/usr/bin/env node

const axios = require('axios');

async function testReloadAPI() {
  console.log('🔍 Testing exchange reload API...\n');
  
  try {
    // First login to get token
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:8000/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    
    // Test reload exchanges endpoint
    console.log('\n2. Reloading exchanges...');
    const reloadResponse = await axios.post('http://localhost:8000/exchange/reload', {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Reload response:', reloadResponse.data);
    
    // Get exchanges list
    console.log('\n3. Getting exchanges list...');
    const exchangesResponse = await axios.get('http://localhost:8000/exchange', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Exchanges:', exchangesResponse.data);
    
    // Test balance for each exchange
    if (exchangesResponse.data.success && exchangesResponse.data.data) {
      console.log('\n4. Testing balance for each exchange...');
      for (const exchange of exchangesResponse.data.data) {
        console.log(`\n📊 Testing balance for: ${exchange.name} (${exchange.id})`);
        
        try {
          const balanceResponse = await axios.get(`http://localhost:8000/exchange/${exchange.id}/balance`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('✅ Balance response:', balanceResponse.data);
          
        } catch (balanceError) {
          console.log('❌ Balance API failed:', balanceError.response?.data || balanceError.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Reload API test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testReloadAPI();