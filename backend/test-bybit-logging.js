#!/usr/bin/env node

// Test script to trigger Bybit API calls and log detailed request/response
const axios = require('axios');

async function testBybitAPI() {
  try {
    console.log('🧪 Testing Bybit API calls...\n');

    // Test health endpoint first
    console.log('🔍 Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:8000/health');
    console.log('✅ Health check:', healthResponse.status, healthResponse.data);

    // Test positions endpoint with mock authentication
    console.log('\n🔍 Testing positions endpoint...');
    try {
      const positionsResponse = await axios.get('http://localhost:8000/trading/positions?accountId=cmf0qbhfk0001lxpknbxekf5x', {
        headers: {
          'Authorization': 'Bearer mock-token-123',
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      console.log('✅ Positions response:', positionsResponse.status);
      console.log('📊 Response data:', JSON.stringify(positionsResponse.data, null, 2));
      
    } catch (error) {
      if (error.response) {
        console.log('❌ Positions endpoint error:', error.response.status);
        console.log('📊 Error response:', error.response.data);
      } else {
        console.log('❌ Positions endpoint failed:', error.message);
      }
    }

    // Test orders endpoint
    console.log('\n🔍 Testing orders endpoint...');
    try {
      const ordersResponse = await axios.get('http://localhost:8000/trading/orders?accountId=cmf0qbhfk0001lxpknbxekf5x', {
        headers: {
          'Authorization': 'Bearer mock-token-123',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Orders response:', ordersResponse.status);
      console.log('📊 Response data:', JSON.stringify(ordersResponse.data, null, 2));
      
    } catch (error) {
      if (error.response) {
        console.log('❌ Orders endpoint error:', error.response.status);
        console.log('📊 Error response:', error.response.data);
      } else {
        console.log('❌ Orders endpoint failed:', error.message);
      }
    }

    console.log('\n🎉 API testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testBybitAPI();