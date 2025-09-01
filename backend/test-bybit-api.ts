import { createHmac } from 'crypto';
import axios from 'axios';

interface BybitCredentials {
  apiKey: string;
  apiSecret: string;
  testnet: boolean;
}

interface BybitResponse {
  retCode: number;
  retMsg: string;
  result: any;
  time: number;
}

class BybitAPITest {
  private credentials: BybitCredentials;
  private baseUrl: string;

  constructor() {
    this.credentials = {
      apiKey: process.env.BYBIT_API_KEY || process.env.BYBIT_API_KEY_ID || '',
      apiSecret: process.env.BYBIT_API_SECRET || '',
      testnet: process.env.BYBIT_TESTNET === 'true'
    };

    this.baseUrl = process.env.BYBIT_API_BASE_URL || (this.credentials.testnet 
      ? 'https://api-testnet.bybit.com' 
      : 'https://api.bybit.com');
  }

  private generateSignature(timestamp: string, params: string): string {
    return createHmac('sha256', this.credentials.apiSecret)
      .update(timestamp + this.credentials.apiKey + '5000' + params)
      .digest('hex');
  }

  private async makeRequest(endpoint: string, method: string = 'GET', params: any = {}): Promise<BybitResponse> {
    try {
      const timestamp = Date.now().toString();
      const queryString = new URLSearchParams(params).toString();
      const signature = this.generateSignature(timestamp, queryString);

      const headers = {
        'X-BAPI-API-KEY': this.credentials.apiKey,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-SIGN': signature,
        'X-BAPI-RECV-WINDOW': '5000',
        'Content-Type': 'application/json'
      };

      const url = `${this.baseUrl}${endpoint}${queryString ? '?' + queryString : ''}`;

      const response = await axios({
        method,
        url,
        headers,
        data: method === 'POST' ? params : undefined
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          retCode: -1,
          retMsg: `Request failed: ${error.message}`,
          result: null,
          time: Date.now()
        };
      }
      return {
        retCode: -1,
        retMsg: `Unknown error: ${error}`,
        result: null,
        time: Date.now()
      };
    }
  }

  async testConnection(): Promise<boolean> {
    console.log('🔍 Testing Bybit API Connection...');
    console.log(`📍 Base URL: ${this.baseUrl}`);
    console.log(`🔑 API Key: ${this.credentials.apiKey.substring(0, 8)}...`);
    console.log(`🧪 Testnet: ${this.credentials.testnet}`);

    // Test 1: Get server time
    console.log('\n📅 Testing server time endpoint...');
    const timeResponse = await this.makeRequest('/v5/market/time');
    if (timeResponse.retCode === 0) {
      console.log('✅ Server time test passed');
      console.log(`   Server time: ${new Date(timeResponse.result.timeSecond * 1000).toISOString()}`);
    } else {
      console.log('❌ Server time test failed');
      console.log(`   Error: ${timeResponse.retMsg}`);
      return false;
    }

    // Test 2: Get wallet balance (requires authentication)
    console.log('\n💰 Testing wallet balance endpoint...');
    const balanceResponse = await this.makeRequest('/v5/account/wallet-balance', 'GET', {
      accountType: 'UNIFIED'
    });

    if (balanceResponse.retCode === 0) {
      console.log('✅ Wallet balance test passed');
      console.log(`   Account Type: ${balanceResponse.result.accountType}`);
      console.log(`   Total Wallet Balance: ${balanceResponse.result.totalWalletBalance}`);
    } else {
      console.log('❌ Wallet balance test failed');
      console.log(`   Error: ${balanceResponse.retMsg}`);
      console.log(`   Code: ${balanceResponse.retCode}`);
      return false;
    }

    // Test 3: Get account information
    console.log('\n👤 Testing account information endpoint...');
    const accountResponse = await this.makeRequest('/v5/account/info', 'GET');
    
    if (accountResponse.retCode === 0) {
      console.log('✅ Account info test passed');
      console.log(`   Account ID: ${accountResponse.result.accountId}`);
      console.log(`   Account Type: ${accountResponse.result.accountType}`);
    } else {
      console.log('❌ Account info test failed');
      console.log(`   Error: ${accountResponse.retMsg}`);
      console.log(`   Code: ${accountResponse.retCode}`);
      return false;
    }

    return true;
  }

  async testMarketData(): Promise<boolean> {
    console.log('\n📊 Testing market data endpoints...');

    // Test 1: Get tickers
    console.log('📈 Testing BTCUSDT ticker...');
    const tickerResponse = await axios.get(`${this.baseUrl}/v5/market/tickers?category=linear&symbol=BTCUSDT`);
    
    if (tickerResponse.data.retCode === 0) {
      console.log('✅ Ticker test passed');
      console.log(`   BTCUSDT Price: ${tickerResponse.data.result.list[0].lastPrice}`);
    } else {
      console.log('❌ Ticker test failed');
      console.log(`   Error: ${tickerResponse.data.retMsg}`);
      return false;
    }

    return true;
  }
}

// Run the test
async function main() {
  try {
    // Load environment variables
    require('dotenv').config();
    
    const bybitTest = new BybitAPITest();
    
    console.log('🚀 Starting Bybit API Connection Test\n');
    
    // Test authentication endpoints
    const authSuccess = await bybitTest.testConnection();
    
    // Test market data endpoints
    const marketSuccess = await bybitTest.testMarketData();
    
    console.log('\n🎯 Test Summary:');
    console.log(`   Authentication: ${authSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Market Data: ${marketSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (authSuccess && marketSuccess) {
      console.log('\n🎉 All tests passed! Bybit API connection is working correctly.');
      process.exit(0);
    } else {
      console.log('\n💥 Some tests failed. Please check your API credentials and network connection.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export default BybitAPITest;