import { PrismaClient, MarketData, Strategy, Backtest, Trade } from '@prisma/client'

const prisma = new PrismaClient()

export interface BacktestConfig {
  initialCapital: number
  commission: number
  slippage: number
  leverage: number
  symbols: string[]
  timeframe: string
  riskLimits?: string[]
  outputOptions?: string[]
}

export interface BacktestSignal {
  type: 'buy' | 'sell'
  symbol: string
  quantity: number
  price: number
  timestamp: Date
  reason?: string
}

export interface BacktestPosition {
  symbol: string
  quantity: number
  avgPrice: number
  unrealizedPnL: number
  realizedPnL: number
}

export interface BacktestResult {
  trades: Trade[]
  equityCurve: Array<{ timestamp: Date; value: number }>
  initialCapital: number
  finalCapital: number
  totalReturn: number
  annualizedReturn: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  profitFactor: number
  totalCommission: number
  totalSlippage: number
  startDate: Date
  endDate: Date
}

export class BacktestEngine {
  private config: BacktestConfig
  private capital: number
  private positions: Map<string, BacktestPosition>
  private trades: Trade[]
  private equityCurve: Array<{ timestamp: Date; value: number }>
  private currentStep: number
  private totalSteps: number

  constructor(config: BacktestConfig) {
    this.config = config
    this.capital = config.initialCapital
    this.positions = new Map()
    this.trades = []
    this.equityCurve = []
    this.currentStep = 0
    this.totalSteps = 0
  }

  async run(
    strategy: Strategy,
    marketData: MarketData[],
    onProgress?: (progress: number, step: string) => void,
    onLog?: (level: string, message: string) => void
  ): Promise<BacktestResult> {
    try {
      this.totalSteps = marketData.length
      this.equityCurve = [{
        timestamp: marketData[0].timestamp,
        value: this.capital
      }]

      // 按时间处理数据
      for (let i = 0; i < marketData.length; i++) {
        const data = marketData[i]
        
        // 更新进度
        const progress = (i + 1) / marketData.length
        if (onProgress) {
          onProgress(progress, `处理数据 ${i + 1}/${marketData.length}`)
        }

        // 执行策略逻辑
        const signals = await this.executeStrategy(strategy, data, i, marketData)
        
        // 执行交易
        for (const signal of signals) {
          await this.executeTrade(signal, data, onLog)
        }
        
        // 更新权益曲线
        this.updateEquityCurve(data.timestamp)
      }

      // 平仓所有持仓
      await this.closeAllPositions(marketData[marketData.length - 1], onLog)

      const result = this.calculateResults(marketData[0].timestamp, marketData[marketData.length - 1].timestamp)
      
      if (onLog) {
        onLog('info', `回测完成，最终资金: ${result.finalCapital.toFixed(2)}`)
      }

      return result
    } catch (error) {
      if (onLog) {
        onLog('error', `回测执行失败: ${error.message}`)
      }
      throw error
    }
  }

  private async executeStrategy(
    strategy: Strategy,
    currentData: MarketData,
    currentIndex: number,
    allData: MarketData[]
  ): Promise<BacktestSignal[]> {
    try {
      // 创建策略执行环境
      const strategyFunction = new Function('data', 'currentIndex', 'allData', 'params', `
        ${strategy.code}
        
        // 如果策略函数存在，调用它
        if (typeof strategy === 'function') {
          return strategy(data, currentIndex, allData, params);
        }
        
        // 如果策略代码直接返回信号，执行它
        try {
          return eval(strategy.code);
        } catch (e) {
          return [];
        }
      `)

      const signals = strategyFunction(
        currentData,
        currentIndex,
        allData,
        strategy.parameters || {}
      )

      // 验证信号格式
      if (!Array.isArray(signals)) {
        return []
      }

      return signals.filter(signal => 
        signal && 
        ['buy', 'sell'].includes(signal.type) &&
        signal.symbol &&
        signal.quantity > 0 &&
        signal.price > 0
      ).map(signal => ({
        ...signal,
        timestamp: currentData.timestamp
      }))
    } catch (error) {
      console.warn('策略执行失败:', error)
      return []
    }
  }

  private async executeTrade(
    signal: BacktestSignal,
    marketData: MarketData,
    onLog?: (level: string, message: string) => void
  ): Promise<void> {
    try {
      const { symbol, type, quantity, price } = signal
      
      // 计算实际价格（包含滑点）
      const actualPrice = type === 'buy' ? price * (1 + this.config.slippage) : price * (1 - this.config.slippage)
      
      // 计算手续费
      const fee = actualPrice * quantity * this.config.commission
      
      // 检查资金是否足够
      const requiredCapital = actualPrice * quantity + fee
      if (this.capital < requiredCapital) {
        if (onLog) {
          onLog('warning', `资金不足，无法执行交易: ${symbol} ${type} ${quantity}`)
        }
        return
      }

      // 获取当前持仓
      const currentPosition = this.positions.get(symbol) || {
        symbol,
        quantity: 0,
        avgPrice: 0,
        unrealizedPnL: 0,
        realizedPnL: 0
      }

      // 执行交易
      if (type === 'buy') {
        // 买入
        this.capital -= requiredCapital
        
        const newQuantity = currentPosition.quantity + quantity
        const newAvgPrice = currentPosition.quantity > 0 
          ? ((currentPosition.avgPrice * currentPosition.quantity) + (actualPrice * quantity)) / newQuantity
          : actualPrice
        
        this.positions.set(symbol, {
          ...currentPosition,
          quantity: newQuantity,
          avgPrice: newAvgPrice
        })
      } else {
        // 卖出
        if (currentPosition.quantity < quantity) {
          if (onLog) {
            onLog('warning', `持仓不足，无法卖出: ${symbol} ${quantity} (当前持仓: ${currentPosition.quantity})`)
          }
          return
        }

        this.capital += actualPrice * quantity - fee
        
        // 计算实现盈亏
        const realizedPnL = (actualPrice - currentPosition.avgPrice) * quantity
        
        const newQuantity = currentPosition.quantity - quantity
        if (newQuantity > 0) {
          this.positions.set(symbol, {
            ...currentPosition,
            quantity: newQuantity,
            realizedPnL: currentPosition.realizedPnL + realizedPnL
          })
        } else {
          this.positions.delete(symbol)
        }
      }

      // 记录交易
      const trade: Trade = {
        id: '', // 将由数据库生成
        strategyId: '', // 将在调用时设置
        userId: '', // 将在调用时设置
        backtestId: '', // 将在调用时设置
        symbol,
        type,
        side: type === 'buy' ? 'long' : 'short',
        quantity,
        price: actualPrice,
        timestamp: new Date(),
        status: 'executed',
        commission: fee,
        slippage: Math.abs(actualPrice - price) * quantity,
        pnl: this.calculateTradePnL(signal, currentPosition),
        profit: this.calculateTradePnL(signal, currentPosition),
        notes: signal.reason
      }

      this.trades.push(trade)

      if (onLog) {
        onLog('info', `执行交易: ${symbol} ${type} ${quantity} @ ${actualPrice.toFixed(2)}`)
      }
    } catch (error) {
      if (onLog) {
        onLog('error', `执行交易失败: ${error.message}`)
      }
    }
  }

  private calculateTradePnL(signal: BacktestSignal, position: BacktestPosition): number {
    if (signal.type === 'buy') {
      return 0 // 买入时不计算盈亏
    } else {
      return (signal.price - position.avgPrice) * signal.quantity
    }
  }

  private updateEquityCurve(timestamp: Date): void {
    const totalEquity = this.capital + this.calculatePositionsValue()
    this.equityCurve.push({
      timestamp,
      value: totalEquity
    })
  }

  private calculatePositionsValue(): number {
    let totalValue = 0
    for (const position of this.positions.values()) {
      // 这里应该使用市场价格，简化实现使用持仓成本
      totalValue += position.quantity * position.avgPrice
    }
    return totalValue
  }

  private async closeAllPositions(
    marketData: MarketData,
    onLog?: (level: string, message: string) => void
  ): Promise<void> {
    for (const [symbol, position] of this.positions) {
      if (position.quantity > 0) {
        await this.executeTrade({
          type: 'sell',
          symbol,
          quantity: position.quantity,
          price: marketData.close,
          timestamp: marketData.timestamp,
          reason: '平仓'
        }, marketData, onLog)
      }
    }
  }

  private calculateResults(startDate: Date, endDate: Date): BacktestResult {
    const initialCapital = this.config.initialCapital
    const finalCapital = this.capital + this.calculatePositionsValue()
    const totalReturn = (finalCapital - initialCapital) / initialCapital

    // 计算年化收益率
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const years = days / 365.25
    const annualizedReturn = years > 0 ? Math.pow(1 + totalReturn, 1 / years) - 1 : 0

    // 计算日收益率
    const dailyReturns = this.calculateDailyReturns()

    // 计算夏普比率
    const avgDailyReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length
    const dailyVolatility = Math.sqrt(dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgDailyReturn, 2), 0) / dailyReturns.length)
    const sharpeRatio = dailyVolatility > 0 ? (avgDailyReturn / dailyVolatility) * Math.sqrt(252) : 0

    // 计算最大回撤
    const maxDrawdown = this.calculateMaxDrawdown()

    // 计算胜率和盈亏比
    const winningTrades = this.trades.filter(t => t.profit && t.profit > 0)
    const losingTrades = this.trades.filter(t => t.profit && t.profit < 0)
    const winRate = this.trades.length > 0 ? winningTrades.length / this.trades.length : 0

    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + (t.profit || 0), 0) / winningTrades.length : 0
    const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.profit || 0), 0)) / losingTrades.length : 0
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0

    return {
      trades: this.trades,
      equityCurve: this.equityCurve,
      initialCapital,
      finalCapital,
      totalReturn,
      annualizedReturn,
      sharpeRatio,
      maxDrawdown,
      winRate,
      profitFactor,
      totalCommission: this.trades.reduce((sum, t) => sum + (t.commission || 0), 0),
      totalSlippage: this.trades.reduce((sum, t) => sum + (t.slippage || 0), 0),
      startDate,
      endDate
    }
  }

  private calculateDailyReturns(): number[] {
    const dailyReturns = []
    for (let i = 1; i < this.equityCurve.length; i++) {
      const dailyReturn = (this.equityCurve[i].value - this.equityCurve[i - 1].value) / this.equityCurve[i - 1].value
      dailyReturns.push(dailyReturn)
    }
    return dailyReturns
  }

  private calculateMaxDrawdown(): number {
    let maxDrawdown = 0
    let peak = this.equityCurve[0].value

    for (const point of this.equityCurve) {
      if (point.value > peak) {
        peak = point.value
      }
      const drawdown = (peak - point.value) / peak
      maxDrawdown = Math.max(maxDrawdown, drawdown)
    }

    return maxDrawdown
  }
}

export default BacktestEngine