// Simple test to check if our balance fix is working
const { testDirectBybitAPI } = require('./test-direct-bybit-api');

console.log('🔧 Testing our backend balance API...');

// Test the backend balance endpoint
const testBackendBalance = async () => {
    try {
        const fetch = require('node-fetch');
        
        const response = await fetch('http://localhost:8000/api/exchange/balance', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZ',
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('📊 Backend API Response:');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.success && data.data) {
            const totalBalance = data.data.reduce((sum, item) => sum + (item.valueInUSD || 0), 0);
            console.log(`\n💰 Total Balance from Backend: $${totalBalance.toFixed(2)}`);
            
            if (totalBalance > 0) {
                console.log('✅ Balance fix is working!');
            } else {
                console.log('❌ Balance still showing 0');
            }
        }
        
    } catch (error) {
        console.error('❌ Backend API test failed:', error.message);
        console.log('   Backend may not be running');
    }
};

// Run both tests
Promise.all([
    testDirectBybitAPI(),
    testBackendBalance()
]).then(() => {
    console.log('\n🎉 Test completed');
}).catch(error => {
    console.error('❌ Test failed:', error.message);
});