// 简单移动平均线交叉策略
function simpleMACrossover(data, currentIndex, allData, params) {
  const { shortPeriod = 10, longPeriod = 30 } = params
  
  if (currentIndex < longPeriod) {
    return [] // 数据不足，不产生信号
  }

  const currentData = data
  const shortMA = calculateMA(allData, currentIndex, shortPeriod)
  const longMA = calculateMA(allData, currentIndex, longPeriod)
  
  const prevShortMA = calculateMA(allData, currentIndex - 1, shortPeriod)
  const prevLongMA = calculateMA(allData, currentIndex - 1, longPeriod)

  const signals = []

  // 金叉买入信号
  if (shortMA > longMA && prevShortMA <= prevLongMA) {
    signals.push({
      type: 'buy',
      symbol: currentData.symbol,
      quantity: 0.1, // 10%仓位
      price: currentData.close,
      reason: 'SMA Golden Cross'
    })
  }
  
  // 死叉卖出信号
  else if (shortMA < longMA && prevShortMA >= prevLongMA) {
    signals.push({
      type: 'sell',
      symbol: currentData.symbol,
      quantity: 1, // 全部卖出
      price: currentData.close,
      reason: 'SMA Death Cross'
    })
  }

  return signals
}

// 计算移动平均线
function calculateMA(allData, currentIndex, period) {
  if (currentIndex < period - 1) return 0
  
  let sum = 0
  for (let i = currentIndex - period + 1; i <= currentIndex; i++) {
    sum += allData[i].close
  }
  
  return sum / period
}

// RSI超卖策略
function rsiOversoldStrategy(data, currentIndex, allData, params) {
  const { rsiPeriod = 14, oversoldLevel = 30, overboughtLevel = 70 } = params
  
  if (currentIndex < rsiPeriod) {
    return []
  }

  const rsi = calculateRSI(allData, currentIndex, rsiPeriod)
  
  const signals = []

  // RSI超卖买入
  if (rsi < oversoldLevel) {
    signals.push({
      type: 'buy',
      symbol: data.symbol,
      quantity: 0.05, // 5%仓位
      price: data.close,
      reason: `RSI Oversold (${rsi.toFixed(2)})`
    })
  }
  
  // RSI超买卖出
  else if (rsi > overboughtLevel) {
    signals.push({
      type: 'sell',
      symbol: data.symbol,
      quantity: 1, // 全部卖出
      price: data.close,
      reason: `RSI Overbought (${rsi.toFixed(2)})`
    })
  }

  return signals
}

// 计算RSI
function calculateRSI(allData, currentIndex, period) {
  if (currentIndex < period) return 50
  
  let gains = 0
  let losses = 0
  
  for (let i = currentIndex - period + 1; i <= currentIndex; i++) {
    const change = allData[i].close - allData[i - 1].close
    if (change > 0) {
      gains += change
    } else {
      losses += Math.abs(change)
    }
  }
  
  const avgGain = gains / period
  const avgLoss = losses / period
  const rs = avgGain / avgLoss
  
  return 100 - (100 / (1 + rs))
}

// 布林带策略
function bollingerBandsStrategy(data, currentIndex, allData, params) {
  const { period = 20, stdDev = 2 } = params
  
  if (currentIndex < period) {
    return []
  }

  const { upper, middle, lower } = calculateBollingerBands(allData, currentIndex, period, stdDev)
  const currentPrice = data.close
  
  const signals = []

  // 价格触及下轨买入
  if (currentPrice <= lower) {
    signals.push({
      type: 'buy',
      symbol: data.symbol,
      quantity: 0.1, // 10%仓位
      price: currentPrice,
      reason: 'Price touched lower Bollinger Band'
    })
  }
  
  // 价格触及上轨卖出
  else if (currentPrice >= upper) {
    signals.push({
      type: 'sell',
      symbol: data.symbol,
      quantity: 1, // 全部卖出
      price: currentPrice,
      reason: 'Price touched upper Bollinger Band'
    })
  }

  return signals
}

// 计算布林带
function calculateBollingerBands(allData, currentIndex, period, stdDev) {
  if (currentIndex < period) {
    return { upper: 0, middle: 0, lower: 0 }
  }
  
  // 计算中轨（简单移动平均）
  let sum = 0
  for (let i = currentIndex - period + 1; i <= currentIndex; i++) {
    sum += allData[i].close
  }
  const middle = sum / period
  
  // 计算标准差
  let variance = 0
  for (let i = currentIndex - period + 1; i <= currentIndex; i++) {
    variance += Math.pow(allData[i].close - middle, 2)
  }
  const standardDeviation = Math.sqrt(variance / period)
  
  const upper = middle + (standardDeviation * stdDev)
  const lower = middle - (standardDeviation * stdDev)
  
  return { upper, middle, lower }
}

// 主策略函数 - 根据参数选择策略
function strategy(data, currentIndex, allData, params) {
  const { strategyType = 'sma' } = params
  
  switch (strategyType) {
    case 'sma':
      return simpleMACrossover(data, currentIndex, allData, params)
    case 'rsi':
      return rsiOversoldStrategy(data, currentIndex, allData, params)
    case 'bollinger':
      return bollingerBandsStrategy(data, currentIndex, allData, params)
    default:
      return simpleMACrossover(data, currentIndex, allData, params)
  }
}

// 导出策略函数
module.exports = strategy