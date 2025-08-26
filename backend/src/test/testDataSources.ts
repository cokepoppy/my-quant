import { initDataManager, YahooFinanceAdapter, DataSourceConfig, initDataCache } from '../services/data';

async function testDataSources() {
  console.log('🚀 Testing data sources...\n');

  try {
    // Initialize cache first
    initDataCache({
      enabled: true,
      ttl: 3600,
      maxSize: 1000
    });
    console.log('✅ Data cache initialized');
    // Initialize data manager
    const manager = initDataManager();
    
    // Create Yahoo Finance adapter
    const yahooConfig: DataSourceConfig = {
      name: 'Yahoo Finance',
      type: 'rest',
      rateLimit: 100,
      timeout: 10000,
      enabled: true
    };
    
    const yahooAdapter = new YahooFinanceAdapter(yahooConfig);
    manager.registerAdapter(yahooAdapter);
    
    // Initialize data manager
    await manager.initialize();
    console.log('✅ Data manager initialized successfully\n');

    // Test 1: Get adapter status
    console.log('📊 Testing adapter status...');
    const statuses = manager.getAdapterStatuses();
    console.log('Adapter statuses:', statuses);
    console.log('✅ Adapter status test passed\n');

    // Test 2: Fetch historical data
    console.log('📈 Testing historical data fetch...');
    const historicalRequest = {
      symbol: 'AAPL',
      startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      endTime: new Date(),
      interval: '1d' as const
    };
    
    const historicalData = await manager.fetchHistoricalData(historicalRequest);
    console.log(`Historical data fetched: ${historicalData.length} records`);
    if (historicalData.length > 0) {
      console.log('Sample record:', historicalData[0]);
    }
    console.log('✅ Historical data test passed\n');

    // Test 3: Fetch real-time data
    console.log('⚡ Testing real-time data fetch...');
    const realTimeData = await manager.fetchRealTimeData(['AAPL', 'GOOGL']);
    console.log(`Real-time data fetched: ${realTimeData.length} symbols`);
    realTimeData.forEach(data => {
      console.log(`${data.symbol}: $${data.close}`);
    });
    console.log('✅ Real-time data test passed\n');

    // Test 4: Data quality report
    console.log('🔍 Testing data quality report...');
    const qualityReport = manager.getDataQualityReport(['AAPL']);
    console.log('Quality report:', qualityReport[0]);
    console.log('✅ Data quality test passed\n');

    // Test 5: Quick data fetch
    console.log('🚀 Testing quick data fetch...');
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 30 * 24 * 60 * 60 * 1000);
    const quickData = await manager.fetchHistoricalData({
      symbol: 'AAPL',
      startTime,
      endTime,
      interval: '1d'
    });
    
    if (quickData.length > 0) {
      const prices = quickData.map(d => d.close);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const firstPrice = prices[0];
      const lastPrice = prices[prices.length - 1];
      const change = lastPrice - firstPrice;
      const changePercent = (change / firstPrice) * 100;
      
      console.log('Quick data summary:');
      console.log(`  Current Price: $${lastPrice.toFixed(2)}`);
      console.log(`  Change: $${change.toFixed(2)} (${changePercent.toFixed(2)}%)`);
      console.log(`  Min: $${minPrice.toFixed(2)}, Max: $${maxPrice.toFixed(2)}`);
      console.log(`  Data Points: ${quickData.length}`);
    }
    console.log('✅ Quick data test passed\n');

    // Cleanup
    await manager.shutdown();
    console.log('🎉 All data source tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Data source test failed:', error);
    process.exit(1);
  }
}

// Run tests
testDataSources();