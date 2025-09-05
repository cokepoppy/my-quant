import { exchangeService } from './src/exchanges/ExchangeService';
import { PrismaClient } from '@prisma/client';

async function testBybitConnection() {
  console.log('🧪 Testing Bybit connection and market data fetch...');
  
  const prisma = new PrismaClient();
  
  try {
    // Get the first available account
    const account = await prisma.account.findFirst({
      where: {
        isActive: true,
        exchange: 'bybit'
      }
    });
    
    if (!account) {
      console.log('❌ No active Bybit account found');
      return;
    }
    
    console.log('📋 Found account:', {
      id: account.id,
      name: account.name,
      exchange: account.exchange,
      accountId: account.accountId,
      testnet: account.testnet,
      syncStatus: account.syncStatus,
      isActive: account.isActive
    });
    
    // Manually load the exchange into the exchange service
    console.log('🔄 Manually loading exchange into service...');
    const exchangeConfig = {
      id: account.accountId,
      name: account.exchange.charAt(0).toUpperCase() + account.exchange.slice(1),
      apiKey: account.apiKey,
      apiSecret: account.apiSecret,
      passphrase: account.passphrase || undefined,
      testnet: account.testnet,
      enableRateLimit: true
    };
    
    try {
      const connected = await exchangeService.createAdapter(exchangeConfig).testConnection();
      if (connected) {
        await exchangeService.addExchange(exchangeConfig);
        console.log('✅ Exchange loaded successfully');
      } else {
        console.log('❌ Failed to connect to exchange');
      }
    } catch (error) {
      console.log('❌ Error loading exchange:', error.message);
    }
    
    // Test 1: Get ticker data
    console.log('\n📈 Test 1: Fetching BTC/USDT ticker...');
    try {
      const ticker = await exchangeService.getTicker(account.accountId, 'BTCUSDT');
      console.log('✅ Ticker data received:');
      console.log('  - Symbol:', ticker.symbol);
      console.log('  - Last price:', ticker.last);
      console.log('  - Bid:', ticker.bid);
      console.log('  - Ask:', ticker.ask);
      console.log('  - 24h change:', ticker.percentage);
      console.log('  - Volume:', ticker.volume);
    } catch (error) {
      console.log('❌ Failed to fetch ticker:', error.message);
    }
    
    // Test 2: Get positions from Bybit
    console.log('\n📊 Test 2: Fetching positions from Bybit...');
    try {
      const positions = await exchangeService.getPositions(account.accountId);
      console.log('✅ Positions data received:', positions.length, 'positions');
      positions.forEach(pos => {
        console.log(`  - ${pos.symbol}: ${pos.side} ${pos.quantity} @ ${pos.entryPrice}`);
      });
    } catch (error) {
      console.log('❌ Failed to fetch positions:', error.message);
    }
    
    // Test 3: Get balance from Bybit
    console.log('\n💰 Test 3: Fetching balance from Bybit...');
    try {
      const balance = await exchangeService.getBalance(account.accountId);
      console.log('✅ Balance data received:');
      console.log('  - Total balance:', balance.total);
      console.log('  - Available balance:', balance.available);
      console.log('  - Used balance:', balance.used);
    } catch (error) {
      console.log('❌ Failed to fetch balance:', error.message);
    }
    
    // Test 4: Test our positions endpoint
    console.log('\n🔍 Test 4: Testing our positions endpoint logic...');
    
    // Get executed trades for this account
    const trades = await prisma.trade.findMany({
      where: {
        accountId: account.id,
        status: 'executed'
      },
      select: {
        id: true,
        symbol: true,
        type: true,
        side: true,
        quantity: true,
        price: true,
        status: true,
        timestamp: true,
        commission: true,
        pnl: true,
        notes: true,
        accountId: true
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
    
    console.log('📋 Found', trades.length, 'executed trades');
    
    if (trades.length > 0) {
      // Calculate positions from trades
      const positionMap = new Map();
      
      trades.forEach(trade => {
        const notes = JSON.parse(trade.notes || '{}');
        const symbol = trade.symbol;
        const side = trade.side;
        const quantity = trade.quantity;
        const price = trade.price;
        
        if (!positionMap.has(symbol)) {
          positionMap.set(symbol, {
            id: `pos_${symbol}_${trade.accountId}`,
            symbol: symbol,
            side: side,
            quantity: 0,
            entryPrice: price,
            currentPrice: price,
            pnl: 0,
            pnlPercentage: 0,
            timestamp: trade.timestamp,
            accountId: trade.accountId,
            trades: []
          });
        }
        
        const position = positionMap.get(symbol);
        position.trades.push(trade);
        
        // Calculate net position
        if (side === 'long') {
          position.quantity += quantity;
        } else {
          position.quantity -= quantity;
        }
        
        // Update entry price (average)
        if (position.quantity !== 0) {
          const totalValue = position.trades.reduce((sum, t) => sum + (t.quantity * t.price), 0);
          const totalQuantity = position.trades.reduce((sum, t) => sum + t.quantity, 0);
          position.entryPrice = totalValue / totalQuantity;
        }
      });
      
      // Filter out positions with zero quantity
      const positions = Array.from(positionMap.values()).filter(pos => Math.abs(pos.quantity) > 0.000001);
      
      console.log('📊 Calculated', positions.length, 'positions from trades');
      
      // Get current market prices for PnL calculation
      for (const position of positions) {
        try {
          console.log(`\n📈 Fetching market data for ${position.symbol} from exchange ${account.accountId}`);
          
          // Fetch real market data from Bybit
          const marketData = await exchangeService.getTicker(account.accountId, position.symbol.replace('/', ''));
          position.currentPrice = marketData.last || marketData.bid || marketData.ask || position.entryPrice;
          
          console.log(`✅ Got market data for ${position.symbol}: $${position.currentPrice}`);
          
          // Calculate PnL
          if (position.side === 'long') {
            position.pnl = (position.currentPrice - position.entryPrice) * Math.abs(position.quantity);
          } else {
            position.pnl = (position.entryPrice - position.currentPrice) * Math.abs(position.quantity);
          }
          
          // Calculate PnL percentage
          position.pnlPercentage = (position.pnl / (position.entryPrice * Math.abs(position.quantity))) * 100;
          
          console.log(`💰 Calculated PnL for ${position.symbol}: $${position.pnl.toFixed(2)} (${position.pnlPercentage.toFixed(2)}%)`);
          
        } catch (error) {
          console.log(`❌ Failed to get market data for ${position.symbol}, using entry price:`, error.message);
          position.currentPrice = position.entryPrice;
          position.pnl = 0;
          position.pnlPercentage = 0;
        }
      }
      
      console.log('\n📊 Final positions data:');
      positions.forEach(pos => {
        console.log(`  - ${pos.symbol}: ${pos.side} ${pos.quantity} @ $${pos.entryPrice.toFixed(2)} | Current: $${pos.currentPrice.toFixed(2)} | PnL: $${pos.pnl.toFixed(2)} (${pos.pnlPercentage.toFixed(2)}%)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testBybitConnection().catch(console.error);