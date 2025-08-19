const Backtest = require('../models/Backtest')
const Trade = require('../models/Trade')
const Strategy = require('../models/Strategy')
const MarketData = require('../models/MarketData')
const logger = require('../utils/logger')
const cache = require('../utils/cache')
const { generatePDF } = require('../utils/pdfGenerator')

class BacktestService {
  // 执行回测
  async executeBacktest(backtest) {
    try {
      logger.info(`开始执行回测: ${backtest._id}`)

      // 获取策略信息
      const strategy = await Strategy.findById(backtest.strategyId)
      if (!strategy) {
        throw new Error('策略不存在')
      }

      // 获取市场数据
      const marketData = await this.getMarketData(
        backtest.symbols,
        backtest.timeframe,
        backtest.startDate,
        backtest.endDate
      )

      if (marketData.length === 0) {
        throw new Error('没有找到市场数据')
      }

      // 初始化回测引擎
      const engine = new BacktestEngine({
        initialCapital: backtest.initialCapital,
        commission: backtest.commission,
        slippage: backtest.slippage,
        leverage: backtest.leverage,
        symbols: backtest.symbols,
        riskLimits: backtest.riskLimits
      })

      // 执行策略
      const results = await engine.run(strategy, marketData, {
        onProgress: (progress, step) => {
          this.updateProgress(backtest._id, progress, step)
        },
        onLog: (level, message) => {
          this.logBacktest(backtest._id, level, message)
        }
      })

      // 保存交易记录
      if (results.trades && results.trades.length > 0) {
        await this.saveTrades(backtest._id, results.trades)
      }

      // 计算性能指标
      const performance = this.calculatePerformance(results)

      return {
        ...performance,
        trades: results.trades.length,
        totalCommission: results.totalCommission,
        totalSlippage: results.totalSlippage
      }
    } catch (error) {
      logger.error(`回测执行失败: ${backtest._id}`, error)
      throw error
    }
  }

  // 获取市场数据
  async getMarketData(symbols, timeframe, startDate, endDate) {
    try {
      const cacheKey = `market_data:${symbols.join(',')}:${timeframe}:${startDate}:${endDate}`
      let data = await cache.get(cacheKey)

      if (!data) {
        // 从数据库获取数据
        const promises = symbols.map(symbol => {
          return MarketData.find({
            symbol,
            timeframe,
            timestamp: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          }).sort({ timestamp: 1 })
        })

        const results = await Promise.all(promises)
        data = results.flat()

        // 缓存数据
        await cache.set(cacheKey, data, 3600) // 1小时缓存
      }

      return data
    } catch (error) {
      logger.error('获取市场数据失败:', error)
      throw error
    }
  }

  // 保存交易记录
  async saveTrades(backtestId, trades) {
    try {
      const tradeDocs = trades.map(trade => ({
        backtestId,
        timestamp: trade.timestamp,
        symbol: trade.symbol,
        type: trade.type,
        price: trade.price,
        quantity: trade.quantity,
        amount: trade.amount,
        fee: trade.fee,
        slippage: trade.slippage,
        pnl: trade.pnl,
        pnlPercent: trade.pnlPercent,
        balance: trade.balance,
        position: trade.position
      }))

      await Trade.insertMany(tradeDocs)
    } catch (error) {
      logger.error('保存交易记录失败:', error)
      throw error
    }
  }

  // 计算性能指标
  calculatePerformance(results) {
    const { trades, equityCurve } = results

    // 基本指标
    const initialCapital = results.initialCapital
    const finalCapital = results.finalCapital
    const totalReturn = (finalCapital - initialCapital) / initialCapital

    // 年化收益率
    const days = Math.ceil((new Date().getTime() - new Date(results.startDate).getTime()) / (1000 * 60 * 60 * 24))
    const years = days / 365.25
    const annualizedReturn = Math.pow(1 + totalReturn, 1 / years) - 1

    // 计算日收益率
    const dailyReturns = this.calculateDailyReturns(equityCurve)

    // 夏普比率
    const avgDailyReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length
    const dailyVolatility = Math.sqrt(dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgDailyReturn, 2), 0) / dailyReturns.length)
    const sharpeRatio = dailyVolatility > 0 ? (avgDailyReturn / dailyVolatility) * Math.sqrt(252) : 0

    // 最大回撤
    const maxDrawdown = this.calculateMaxDrawdown(equityCurve)

    // 胜率和盈亏比
    const winningTrades = trades.filter(t => t.pnl > 0)
    const losingTrades = trades.filter(t => t.pnl < 0)
    const winRate = trades.length > 0 ? winningTrades.length / trades.length : 0

    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0
    const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0)) / losingTrades.length : 0
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0

    // 波动率
    const volatility = dailyVolatility * Math.sqrt(252)

    return {
      totalReturn,
      annualizedReturn,
      sharpeRatio,
      maxDrawdown,
      winRate,
      profitFactor,
      volatility,
      totalTrades: trades.length,
      averageTrade: trades.length > 0 ? trades.reduce((sum, t) => sum + t.pnl, 0) / trades.length : 0,
      benchmarkReturn: 0.05, // 假设基准收益率为5%
      excessReturn: annualizedReturn - 0.05,
      informationRatio: 0 // 需要基准数据计算
    }
  }

  // 计算日收益率
  calculateDailyReturns(equityCurve) {
    const dailyReturns = []
    for (let i = 1; i < equityCurve.length; i++) {
      const dailyReturn = (equityCurve[i].value - equityCurve[i - 1].value) / equityCurve[i - 1].value
      dailyReturns.push(dailyReturn)
    }
    return dailyReturns
  }

  // 计算最大回撤
  calculateMaxDrawdown(equityCurve) {
    let maxDrawdown = 0
    let peak = equityCurve[0].value

    for (const point of equityCurve) {
      if (point.value > peak) {
        peak = point.value
      }
      const drawdown = (peak - point.value) / peak
      maxDrawdown = Math.max(maxDrawdown, drawdown)
    }

    return maxDrawdown
  }

  // 更新进度
  async updateProgress(backtestId, progress, step) {
    try {
      await Backtest.findByIdAndUpdate(backtestId, {
        progress,
        currentStep: step
      })
    } catch (error) {
      logger.error('更新进度失败:', error)
    }
  }

  // 记录日志
  async logBacktest(backtestId, level, message) {
    try {
      const cacheKey = `backtest:${backtestId}:logs`
      const logs = await cache.get(cacheKey) || []
      
      logs.push({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        level,
        message
      })

      // 保持最近1000条日志
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000)
      }

      await cache.set(cacheKey, logs, 3600)
    } catch (error) {
      logger.error('记录日志失败:', error)
    }
  }

  // 生成回测报告
  async generateBacktestReport(backtest) {
    try {
      const reportData = {
        title: `${backtest.strategyName} 回测报告`,
        backtest,
        generatedAt: new Date().toISOString()
      }

      return await generatePDF(reportData)
    } catch (error) {
      logger.error('生成回测报告失败:', error)
      throw error
    }
  }

  // 生成交易记录CSV
  generateTradesCSV(trades) {
    const headers = [
      '时间', '标的', '类型', '价格', '数量', '金额', '手续费', '滑点', '盈亏', '盈亏比例', '余额', '持仓'
    ]

    const rows = trades.map(trade => [
      trade.timestamp,
      trade.symbol,
      trade.type === 'buy' ? '买入' : '卖出',
      trade.price,
      trade.quantity,
      trade.amount,
      trade.fee,
      trade.slippage,
      trade.pnl,
      trade.pnlPercent,
      trade.balance,
      trade.position
    ])

    return this.convertToCSV(headers, rows)
  }

  // 转换为CSV格式
  convertToCSV(headers, rows) {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n')

    return csvContent
  }

  // 对比回测结果
  async compareBacktests(backtests) {
    try {
      const comparison = {
        backtests: backtests.map(b => ({
          id: b._id,
          name: b.strategyName,
          status: b.status,
          results: b.results
        })),
        metrics: this.calculateComparisonMetrics(backtests),
        recommendations: this.generateRecommendations(backtests)
      }

      return comparison
    } catch (error) {
      logger.error('对比回测结果失败:', error)
      throw error
    }
  }

  // 计算对比指标
  calculateComparisonMetrics(backtests) {
    const metrics = {
      bestReturn: null,
      bestSharpe: null,
      lowestDrawdown: null,
      mostStable: null
    }

    backtests.forEach(backtest => {
      const results = backtest.results
      if (!results) return

      // 最佳收益
      if (!metrics.bestReturn || results.totalReturn > metrics.bestReturn.value) {
        metrics.bestReturn = {
          backtestId: backtest._id,
          value: results.totalReturn,
          name: backtest.strategyName
        }
      }

      // 最佳夏普比率
      if (!metrics.bestSharpe || results.sharpeRatio > metrics.bestSharpe.value) {
        metrics.bestSharpe = {
          backtestId: backtest._id,
          value: results.sharpeRatio,
          name: backtest.strategyName
        }
      }

      // 最低回撤
      if (!metrics.lowestDrawdown || results.maxDrawdown < metrics.lowestDrawdown.value) {
        metrics.lowestDrawdown = {
          backtestId: backtest._id,
          value: results.maxDrawdown,
          name: backtest.strategyName
        }
      }

      // 最稳定（波动率最低）
      if (!metrics.mostStable || results.volatility < metrics.mostStable.value) {
        metrics.mostStable = {
          backtestId: backtest._id,
          value: results.volatility,
          name: backtest.strategyName
        }
      }
    })

    return metrics
  }

  // 生成建议
  generateRecommendations(backtests) {
    const recommendations = []

    // 分析各种指标
    const avgReturn = backtests.reduce((sum, b) => sum + (b.results?.totalReturn || 0), 0) / backtests.length
    const avgSharpe = backtests.reduce((sum, b) => sum + (b.results?.sharpeRatio || 0), 0) / backtests.length
    const avgDrawdown = backtests.reduce((sum, b) => sum + (b.results?.maxDrawdown || 0), 0) / backtests.length

    if (avgReturn < 0) {
      recommendations.push({
        type: 'warning',
        message: '平均收益率为负，建议优化策略或更换策略'
      })
    }

    if (avgSharpe < 1) {
      recommendations.push({
        type: 'warning',
        message: '夏普比率偏低，风险调整后收益不佳'
      })
    }

    if (avgDrawdown > 0.2) {
      recommendations.push({
        type: 'warning',
        message: '平均回撤较大，建议加强风险管理'
      })
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        message: '策略表现良好，可考虑实盘测试'
      })
    }

    return recommendations
  }

  // 启动参数优化
  async startParameterOptimization(backtest, options) {
    try {
      const optimizationId = `opt_${Date.now()}`
      
      // 这里可以集成遗传算法、网格搜索等优化方法
      // 目前返回一个模拟的优化ID
      logger.info(`启动参数优化: ${optimizationId}`)
      
      return optimizationId
    } catch (error) {
      logger.error('启动参数优化失败:', error)
      throw error
    }
  }

  // 分析回测结果
  async analyzeBacktest(backtest) {
    try {
      const analysis = {
        riskAnalysis: this.analyzeRisk(backtest),
        performanceAnalysis: this.analyzePerformance(backtest),
        tradeAnalysis: this.analyzeTrades(backtest),
        recommendations: this.generateBacktestRecommendations(backtest)
      }

      return analysis
    } catch (error) {
      logger.error('分析回测结果失败:', error)
      throw error
    }
  }

  // 分析风险
  analyzeRisk(backtest) {
    const results = backtest.results
    if (!results) return {}

    return {
      varCoefficient: results.volatility / results.annualizedReturn,
      riskAdjustedReturn: results.annualizedReturn / results.maxDrawdown,
      worstMonth: this.calculateWorstMonth(backtest),
      bestMonth: this.calculateBestMonth(backtest),
      recoveryTime: this.calculateRecoveryTime(backtest)
    }
  }

  // 分析性能
  analyzePerformance(backtest) {
    const results = backtest.results
    if (!results) return {}

    return {
      consistency: this.calculateConsistency(backtest),
      stability: this.calculateStability(backtest),
      efficiency: this.calculateEfficiency(backtest),
      marketConditions: this.analyzeMarketConditions(backtest)
    }
  }

  // 分析交易
  analyzeTrades(backtest) {
    const trades = backtest.trades || []
    if (trades.length === 0) return {}

    const winningTrades = trades.filter(t => t.pnl > 0)
    const losingTrades = trades.filter(t => t.pnl < 0)

    return {
      avgWinningTrade: winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0,
      avgLosingTrade: losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length : 0,
      largestWin: Math.max(...trades.map(t => t.pnl)),
      largestLoss: Math.min(...trades.map(t => t.pnl)),
      consecutiveWins: this.calculateConsecutiveWins(trades),
      consecutiveLosses: this.calculateConsecutiveLosses(trades)
    }
  }

  // 生成回测建议
  generateBacktestRecommendations(backtest) {
    const recommendations = []
    const results = backtest.results

    if (!results) return recommendations

    if (results.sharpeRatio < 1) {
      recommendations.push({
        type: 'risk',
        message: '夏普比率偏低，建议优化风险管理'
      })
    }

    if (results.maxDrawdown > 0.3) {
      recommendations.push({
        type: 'risk',
        message: '最大回撤过大，建议设置止损'
      })
    }

    if (results.winRate < 0.5) {
      recommendations.push({
        type: 'strategy',
        message: '胜率偏低，建议优化入场策略'
      })
    }

    if (results.profitFactor < 1.5) {
      recommendations.push({
        type: 'strategy',
        message: '盈亏比不足，建议优化出场策略'
      })
    }

    return recommendations
  }

  // 计算最差月份
  calculateWorstMonth(backtest) {
    // 实现逻辑
    return -0.05 // 示例值
  }

  // 计算最佳月份
  calculateBestMonth(backtest) {
    // 实现逻辑
    return 0.08 // 示例值
  }

  // 计算恢复时间
  calculateRecoveryTime(backtest) {
    // 实现逻辑
    return 15 // 示例值（天）
  }

  // 计算一致性
  calculateConsistency(backtest) {
    // 实现逻辑
    return 0.75 // 示例值
  }

  // 计算稳定性
  calculateStability(backtest) {
    // 实现逻辑
    return 0.8 // 示例值
  }

  // 计算效率
  calculateEfficiency(backtest) {
    // 实现逻辑
    return 0.7 // 示例值
  }

  // 分析市场条件
  analyzeMarketConditions(backtest) {
    // 实现逻辑
    return {
      trend: 'bullish',
      volatility: 'medium',
      liquidity: 'high'
    }
  }

  // 计算连续盈利
  calculateConsecutiveWins(trades) {
    let maxWins = 0
    let currentWins = 0

    trades.forEach(trade => {
      if (trade.pnl > 0) {
        currentWins++
        maxWins = Math.max(maxWins, currentWins)
      } else {
        currentWins = 0
      }
    })

    return maxWins
  }

  // 计算连续亏损
  calculateConsecutiveLosses(trades) {
    let maxLosses = 0
    let currentLosses = 0

    trades.forEach(trade => {
      if (trade.pnl < 0) {
        currentLosses++
        maxLosses = Math.max(maxLosses, currentLosses)
      } else {
        currentLosses = 0
      }
    })

    return maxLosses
  }
}

// 回测引擎类
class BacktestEngine {
  constructor(options) {
    this.initialCapital = options.initialCapital
    this.commission = options.commission
    this.slippage = options.slippage
    this.leverage = options.leverage
    this.symbols = options.symbols
    this.riskLimits = options.riskLimits
    
    this.capital = this.initialCapital
    this.positions = new Map()
    this.trades = []
    this.equityCurve = []
    this.currentStep = 0
    this.totalSteps = 0
  }

  async run(strategy, marketData, callbacks = {}) {
    try {
      const { onProgress, onLog } = callbacks
      
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
        const signals = await this.executeStrategy(strategy, data)
        
        // 执行交易
        await this.executeTrades(signals, data, onLog)
        
        // 更新权益曲线
        this.updateEquityCurve(data.timestamp)
      }

      // 平仓所有持仓
      await this.closeAllPositions(marketData[marketData.length - 1], onLog)

      return {
        trades: this.trades,
        equityCurve: this.equityCurve,
        initialCapital: this.initialCapital,
        finalCapital: this.capital,
        startDate: marketData[0].timestamp,
        endDate: marketData[marketData.length - 1].timestamp,
        totalCommission: this.trades.reduce((sum, t) => sum + t.fee, 0),
        totalSlippage: this.trades.reduce((sum, t) => sum + t.slippage, 0)
      }
    } catch (error) {
      logger.error('回测引擎运行失败:', error)
      throw error
    }
  }

  async executeStrategy(strategy, data) {
    // 这里应该执行具体的策略逻辑
    // 目前返回示例信号
    return []
  }

  async executeTrades(signals, data, onLog) {
    // 执行交易信号
    for (const signal of signals) {
      await this.executeTrade(signal, data, onLog)
    }
  }

  async executeTrade(signal, data, onLog) {
    try {
      const { symbol, type, quantity, price } = signal
      
      // 计算实际价格（包含滑点）
      const actualPrice = type === 'buy' ? price * (1 + this.slippage) : price * (1 - this.slippage)
      
      // 计算手续费
      const fee = actualPrice * quantity * this.commission
      
      // 检查资金是否足够
      const requiredCapital = actualPrice * quantity + fee
      if (this.capital < requiredCapital) {
        if (onLog) {
          onLog('warning', `资金不足，无法执行交易: ${symbol} ${type} ${quantity}`)
        }
        return
      }

      // 执行交易
      const trade = {
        timestamp: data.timestamp,
        symbol,
        type,
        price: actualPrice,
        quantity,
        amount: actualPrice * quantity,
        fee,
        slippage: Math.abs(actualPrice - price) * quantity,
        balance: this.capital
      }

      // 更新资金和持仓
      if (type === 'buy') {
        this.capital -= requiredCapital
        const currentPosition = this.positions.get(symbol) || 0
        this.positions.set(symbol, currentPosition + quantity)
        trade.position = currentPosition + quantity
      } else {
        this.capital += actualPrice * quantity - fee
        const currentPosition = this.positions.get(symbol) || 0
        this.positions.set(symbol, Math.max(0, currentPosition - quantity))
        trade.position = Math.max(0, currentPosition - quantity)
      }

      // 计算盈亏
      trade.pnl = this.calculatePnL(trade)
      trade.pnlPercent = (trade.pnl / this.initialCapital) * 100

      this.trades.push(trade)

      if (onLog) {
        onLog('info', `执行交易: ${symbol} ${type} ${quantity} @ ${actualPrice}`)
      }
    } catch (error) {
      logger.error('执行交易失败:', error)
      if (onLog) {
        onLog('error', `执行交易失败: ${error.message}`)
      }
    }
  }

  calculatePnL(trade) {
    // 简化的盈亏计算
    // 实际应该根据持仓成本计算
    return 0
  }

  updateEquityCurve(timestamp) {
    const totalEquity = this.capital + this.calculatePositionsValue()
    this.equityCurve.push({
      timestamp,
      value: totalEquity
    })
  }

  calculatePositionsValue() {
    // 计算持仓市值
    return 0 // 简化实现
  }

  async closeAllPositions(data, onLog) {
    // 平仓所有持仓
    for (const [symbol, quantity] of this.positions) {
      if (quantity > 0) {
        await this.executeTrade({
          symbol,
          type: 'sell',
          quantity,
          price: data.close // 使用收盘价
        }, data, onLog)
      }
    }
  }
}

module.exports = new BacktestService()