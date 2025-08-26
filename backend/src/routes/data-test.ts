import { Router } from 'express';
import { body, validationResult } from 'express-validator';

const router = Router();

// Test data source connection
router.post('/test-connection', async (req, res) => {
  try {
    const { source, type } = req.body;
    
    console.log(`Testing connection to ${source} (${type})`);
    
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful connection for demo
    const isConnected = Math.random() > 0.2; // 80% success rate
    const latency = Math.floor(Math.random() * 500) + 50; // 50-550ms
    
    if (isConnected) {
      res.json({
        success: true,
        message: 'Connection test successful',
        data: {
          source,
          type,
          connected: true,
          latency,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      throw new Error('Connection timeout');
    }
  } catch (error) {
    console.error('Connection test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get sample data from data source
router.post('/sample', async (req, res) => {
  try {
    const { source, symbol, limit = 5 } = req.body;
    
    console.log(`Getting sample data from ${source} for ${symbol}`);
    
    // Generate sample data based on source type
    let sampleData;
    
    switch (source) {
      case 'binance':
      case 'okx':
      case 'huobi':
        sampleData = generateExchangeSampleData(symbol, limit);
        break;
      case 'yahoo':
        sampleData = generateYahooSampleData(symbol, limit);
        break;
      default:
        sampleData = generateGenericSampleData(symbol, limit);
    }
    
    res.json({
      success: true,
      message: 'Sample data retrieved successfully',
      data: sampleData
    });
  } catch (error) {
    console.error('Failed to get sample data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sample data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test API data source
router.post('/test-api', async (req, res) => {
  try {
    const { source, apiType, symbol, interval } = req.body;
    
    console.log(`Testing API ${source} ${apiType} for ${symbol}`);
    
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    let testData;
    
    switch (apiType) {
      case 'market':
        testData = generateMarketDataSample(symbol);
        break;
      case 'historical':
        testData = generateHistoricalDataSample(symbol, interval);
        break;
      case 'realtime':
        testData = generateRealtimeDataSample(symbol);
        break;
      default:
        testData = generateGenericSampleData(symbol, 1);
    }
    
    res.json({
      success: true,
      message: 'API test successful',
      data: testData
    });
  } catch (error) {
    console.error('API test failed:', error);
    res.status(500).json({
      success: false,
      message: 'API test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper functions to generate sample data
function generateExchangeSampleData(symbol: string, limit: number) {
  const basePrice = symbol.includes('BTC') ? 45000 : symbol.includes('ETH') ? 3000 : 100;
  const data = [];
  
  for (let i = 0; i < limit; i++) {
    const price = basePrice + (Math.random() - 0.5) * basePrice * 0.02;
    data.push({
      symbol,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      open: price * (1 - Math.random() * 0.01),
      high: price * (1 + Math.random() * 0.015),
      low: price * (1 - Math.random() * 0.015),
      close: price,
      volume: Math.floor(Math.random() * 1000000),
      source: 'exchange'
    });
  }
  
  return data;
}

function generateYahooSampleData(symbol: string, limit: number) {
  const basePrice = symbol.includes('BTC') ? 45000 : symbol.includes('ETH') ? 3000 : 100;
  const data = [];
  
  for (let i = 0; i < limit; i++) {
    const price = basePrice + (Math.random() - 0.5) * basePrice * 0.02;
    data.push({
      symbol,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      open: price * (1 - Math.random() * 0.01),
      high: price * (1 + Math.random() * 0.015),
      low: price * (1 - Math.random() * 0.015),
      close: price,
      volume: Math.floor(Math.random() * 1000000),
      source: 'yahoo',
      qualityScore: 0.95
    });
  }
  
  return data;
}

function generateGenericSampleData(symbol: string, limit: number) {
  const basePrice = 100;
  const data = [];
  
  for (let i = 0; i < limit; i++) {
    const price = basePrice + (Math.random() - 0.5) * basePrice * 0.02;
    data.push({
      symbol,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      open: price * (1 - Math.random() * 0.01),
      high: price * (1 + Math.random() * 0.015),
      low: price * (1 - Math.random() * 0.015),
      close: price,
      volume: Math.floor(Math.random() * 1000000),
      source: 'generic'
    });
  }
  
  return data;
}

function generateMarketDataSample(symbol: string) {
  const basePrice = symbol.includes('BTC') ? 45000 : symbol.includes('ETH') ? 3000 : 100;
  const price = basePrice + (Math.random() - 0.5) * basePrice * 0.02;
  
  return {
    symbol,
    price: parseFloat(price.toFixed(2)),
    change24h: parseFloat(((Math.random() - 0.5) * 10).toFixed(2)),
    volume24h: Math.floor(Math.random() * 1000000000),
    high24h: parseFloat((price * 1.02).toFixed(2)),
    low24h: parseFloat((price * 0.98).toFixed(2)),
    timestamp: new Date().toISOString(),
    source: 'market-api'
  };
}

function generateHistoricalDataSample(symbol: string, interval: string) {
  const data = [];
  const basePrice = symbol.includes('BTC') ? 45000 : symbol.includes('ETH') ? 3000 : 100;
  const intervalMs = interval === '1m' ? 60000 : interval === '5m' ? 300000 : interval === '1h' ? 3600000 : 86400000;
  
  for (let i = 0; i < 10; i++) {
    const price = basePrice + (Math.random() - 0.5) * basePrice * 0.02;
    data.push({
      timestamp: new Date(Date.now() - i * intervalMs).toISOString(),
      open: parseFloat((price * (1 - Math.random() * 0.01)).toFixed(2)),
      high: parseFloat((price * (1 + Math.random() * 0.015)).toFixed(2)),
      low: parseFloat((price * (1 - Math.random() * 0.015)).toFixed(2)),
      close: parseFloat(price.toFixed(2)),
      volume: Math.floor(Math.random() * 1000000)
    });
  }
  
  return {
    symbol,
    interval,
    data,
    count: data.length
  };
}

function generateRealtimeDataSample(symbol: string) {
  const basePrice = symbol.includes('BTC') ? 45000 : symbol.includes('ETH') ? 3000 : 100;
  const price = basePrice + (Math.random() - 0.5) * basePrice * 0.001;
  
  return {
    symbol,
    price: parseFloat(price.toFixed(2)),
    bid: parseFloat((price - 0.5).toFixed(2)),
    ask: parseFloat((price + 0.5).toFixed(2)),
    lastSize: Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    source: 'realtime-api'
  };
}

export default router;