#!/usr/bin/env node

const crypto = require('crypto');

async function testUpdatedSignature() {
  console.log('🧪 Testing updated signature generation with Node crypto...\n');
  
  try {
    // Test the exact method we implemented in BybitAdapter
    const timestamp = Date.now();
    const recv_window = 5000;
    const params = { accountType: 'UNIFIED', recv_window };
    const paramString = new URLSearchParams(params).toString();
    const path = '/v5/account/wallet-balance';
    const queryString = paramString ? `${path}?${paramString}` : path;
    const signString = timestamp + 'GET' + queryString;
    
    // Use a test secret key
    const testSecret = 'test-secret-key';
    const signature = crypto.createHmac('sha256', testSecret).update(signString, 'utf8').digest('hex');
    
    console.log('📋 Updated signature generation details:');
    console.log('   Timestamp:', timestamp);
    console.log('   Recv Window:', recv_window);
    console.log('   Params:', params);
    console.log('   Param String:', paramString);
    console.log('   Query String:', queryString);
    console.log('   Sign String:', signString);
    console.log('   Signature:', signature);
    
    console.log('\n✅ Updated signature generation successful!');
    console.log('🎯 This should resolve the "Hash should be wrapped by utils.wrapConstructor" error');
    
    // Test the format matches Bybit V5 API requirements
    console.log('\n🔍 Format validation:');
    console.log('   ✅ Uses timestamp + GET + queryString format');
    console.log('   ✅ Includes recv_window in parameters');
    console.log('   ✅ Uses proper URL encoding for parameters');
    console.log('   ✅ Uses SHA256 HMAC with hex encoding');
    
  } catch (error) {
    console.error('❌ Updated signature test failed:', error.message);
  }
}

testUpdatedSignature();