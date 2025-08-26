#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Test endpoints
app.post('/data-test/test-connection', (req, res) => {
  console.log('Testing connection:', req.body);
  const { source, type } = req.body;
  
  setTimeout(() => {
    const isConnected = Math.random() > 0.2;
    const latency = Math.floor(Math.random() * 500) + 50;
    
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
      res.status(500).json({
        success: false,
        message: 'Connection timeout',
        error: 'Connection timeout'
      });
    }
  }, 1000);
});

app.post('/data-test/sample', (req, res) => {
  console.log('Getting sample data:', req.body);
  const { source, symbol, limit = 5 } = req.body;
  
  setTimeout(() => {
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
        source: source
      });
    }
    
    res.json({
      success: true,
      message: 'Sample data retrieved successfully',
      data: data
    });
  }, 800);
});

app.post('/data-test/test-api', (req, res) => {
  console.log('Testing API:', req.body);
  const { source, apiType, symbol, interval } = req.body;
  
  setTimeout(() => {
    const basePrice = symbol.includes('BTC') ? 45000 : symbol.includes('ETH') ? 3000 : 100;
    const price = basePrice + (Math.random() - 0.5) * basePrice * 0.02;
    
    let testData;
    switch (apiType) {
      case 'market':
        testData = {
          symbol,
          price: parseFloat(price.toFixed(2)),
          change24h: parseFloat(((Math.random() - 0.5) * 10).toFixed(2)),
          volume24h: Math.floor(Math.random() * 1000000000),
          high24h: parseFloat((price * 1.02).toFixed(2)),
          low24h: parseFloat((price * 0.98).toFixed(2)),
          timestamp: new Date().toISOString(),
          source: source
        };
        break;
      case 'historical':
        const historicalData = [];
        for (let i = 0; i < 10; i++) {
          const histPrice = basePrice + (Math.random() - 0.5) * basePrice * 0.02;
          historicalData.push({
            timestamp: new Date(Date.now() - i * 3600000).toISOString(),
            open: parseFloat((histPrice * (1 - Math.random() * 0.01)).toFixed(2)),
            high: parseFloat((histPrice * (1 + Math.random() * 0.015)).toFixed(2)),
            low: parseFloat((histPrice * (1 - Math.random() * 0.015)).toFixed(2)),
            close: parseFloat(histPrice.toFixed(2)),
            volume: Math.floor(Math.random() * 1000000)
          });
        }
        testData = {
          symbol,
          interval,
          data: historicalData,
          count: historicalData.length
        };
        break;
      case 'realtime':
        testData = {
          symbol,
          price: parseFloat(price.toFixed(2)),
          bid: parseFloat((price - 0.5).toFixed(2)),
          ask: parseFloat((price + 0.5).toFixed(2)),
          lastSize: Math.floor(Math.random() * 1000),
          timestamp: new Date().toISOString(),
          source: source
        };
        break;
      default:
        testData = { symbol, message: 'Unknown API type' };
    }
    
    res.json({
      success: true,
      message: 'API test successful',
      data: testData
    });
  }, 1200);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});