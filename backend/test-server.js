const http = require('http');

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Backend server is running'
    }));
  } else if (req.url === '/api/test' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'API test endpoint working',
      data: {
        version: '1.0.0',
        environment: 'development'
      }
    }));
  } else if (req.url === '/api/auth/test' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Auth endpoint test working',
      data: {
        endpoints: ['POST /register', 'POST /login', 'GET /me']
      }
    }));
  } else if (req.url === '/api/strategies/test' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Strategies endpoint test working',
      data: {
        endpoints: ['GET /', 'POST /', 'GET /:id', 'PUT /:id', 'DELETE /:id']
      }
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      message: 'Route not found'
    }));
  }
});

const PORT = 8000;
server.listen(PORT, () => {
  console.log(`🚀 Test HTTP server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 API test: http://localhost:${PORT}/api/test`);
  console.log(`🔐 Auth test: http://localhost:${PORT}/api/auth/test`);
  console.log(`📈 Strategies test: http://localhost:${PORT}/api/strategies/test`);
});