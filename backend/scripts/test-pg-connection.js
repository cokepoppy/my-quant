const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'quant',
  host: 'localhost',
  database: 'quant_trading',
  password: 'quant123',
  port: 5432,
});

async function testConnection() {
  try {
    console.log('🔗 Testing PostgreSQL connection...');
    
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL successfully');
    
    // Test basic query
    const result = await client.query('SELECT NOW() as time');
    console.log('📅 Database time:', result.rows[0].time);
    
    // Test TimescaleDB extension
    try {
      const extResult = await client.query(`
        SELECT extname FROM pg_extension WHERE extname = 'timescaledb'
      `);
      console.log('📈 TimescaleDB extension:', extResult.rows.length > 0 ? '✅ Active' : '❌ Not found');
    } catch (error) {
      console.log('⚠️  TimescaleDB check failed:', error.message);
    }
    
    // Test table creation
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS test_connection (
          id SERIAL PRIMARY KEY,
          message TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      await client.query(`
        INSERT INTO test_connection (message) VALUES ('Database connection test successful')
      `);
      
      const testResult = await client.query('SELECT COUNT(*) as count FROM test_connection');
      console.log('📊 Test table records:', testResult.rows[0].count);
      
      await client.query('TRUNCATE TABLE test_connection');
      console.log('✅ Test table cleaned up');
      
    } catch (error) {
      console.log('⚠️  Table test failed:', error.message);
    }
    
    await client.release();
    console.log('🎉 PostgreSQL connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ PostgreSQL connection test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testConnection();