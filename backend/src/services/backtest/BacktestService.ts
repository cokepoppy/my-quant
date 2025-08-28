import { PrismaClient, Strategy, Backtest, MarketData, Trade } from '@prisma/client'
import BacktestEngine, { BacktestConfig, BacktestResult } from './BacktestEngine'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

export interface BacktestRequest {
  strategyId: string
  userId: string
  name: string
  description?: string
  startDate: Date
  endDate: Date
  initialCapital: number
  symbols: string[]
  timeframe: string
  commission?: number
  slippage?: number
  leverage?: number
  riskLimits?: string[]
  outputOptions?: string[]
}

export interface BacktestProgress {
  backtestId: string
  progress: number
  currentStep: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  error?: string
}

export class BacktestService {
  private activeBacktests: Map<string, AbortController> = new Map()

  async startBacktest(request: BacktestRequest): Promise<string> {
    try {
      // 验证策略是否存在
      const strategy = await prisma.strategy.findFirst({
        where: {
          id: request.strategyId,
          userId: request.userId
        }
      })

      if (!strategy) {
        throw new Error('策略不存在或无权限访问')
      }

      // 创建回测记录
      const backtest = await prisma.backtest.create({
        data: {
          name: request.name,
          description: request.description || '',
          strategyId: request.strategyId,
          userId: request.userId,
          startDate: request.startDate,
          endDate: request.endDate,
          initialCapital: request.initialCapital,
          symbols: request.symbols,
          status: 'pending',
          parameters: {
            commission: request.commission || 0.001,
            slippage: request.slippage || 0.001,
            leverage: request.leverage || 1,
            riskLimits: request.riskLimits || [],
            outputOptions: request.outputOptions || []
          }
        }
      })

      // 启动回测
      const abortController = new AbortController()
      this.activeBacktests.set(backtest.id, abortController)

      this.executeBacktest(backtest.id, request, abortController.signal).catch(error => {
        logger.error(`回测执行失败: ${backtest.id}`, error)
        this.updateBacktestStatus(backtest.id, 'failed', error.message)
      })

      return backtest.id
    } catch (error) {
      logger.error('启动回测失败:', error)
      throw error
    }
  }

  private async executeBacktest(
    backtestId: string,
    request: BacktestRequest,
    abortSignal: AbortSignal
  ): Promise<void> {
    try {
      // 更新状态为运行中
      await this.updateBacktestStatus(backtestId, 'running', '初始化回测引擎...')

      // 获取策略
      const strategy = await prisma.strategy.findUnique({
        where: { id: request.strategyId }
      })

      if (!strategy) {
        throw new Error('策略不存在')
      }

      // 获取市场数据
      await this.updateBacktestStatus(backtestId, 'running', '获取市场数据...')
      const marketData = await this.getMarketData(
        request.symbols,
        request.timeframe,
        request.startDate,
        request.endDate
      )

      if (marketData.length === 0) {
        throw new Error('没有找到市场数据')
      }

      // 配置回测引擎
      const config: BacktestConfig = {
        initialCapital: request.initialCapital,
        commission: request.commission || 0.001,
        slippage: request.slippage || 0.001,
        leverage: request.leverage || 1,
        symbols: request.symbols,
        timeframe: request.timeframe,
        riskLimits: request.riskLimits || [],
        outputOptions: request.outputOptions || []
      }

      const engine = new BacktestEngine(config)

      // 执行回测
      await this.updateBacktestStatus(backtestId, 'running', '执行策略回测...')
      const result = await engine.run(
        strategy,
        marketData,
        (progress, step) => {
          this.updateBacktestProgress(backtestId, progress, step)
        },
        (level, message) => {
          this.logBacktest(backtestId, level, message)
        }
      )

      // 检查是否被取消
      if (abortSignal.aborted) {
        await this.updateBacktestStatus(backtestId, 'cancelled', '回测已取消')
        return
      }

      // 保存结果
      await this.saveBacktestResults(backtestId, result)

      // 保存交易记录
      if (result.trades.length > 0) {
        await this.saveTrades(backtestId, result.trades, request.userId, request.strategyId)
      }

      await this.updateBacktestStatus(backtestId, 'completed', '回测完成')

      logger.info(`回测完成: ${backtestId}`)
    } catch (error) {
      if (abortSignal.aborted) {
        await this.updateBacktestStatus(backtestId, 'cancelled', '回测已取消')
      } else {
        await this.updateBacktestStatus(backtestId, 'failed', error.message)
        throw error
      }
    } finally {
      this.activeBacktests.delete(backtestId)
    }
  }

  private async getMarketData(
    symbols: string[],
    timeframe: string,
    startDate: Date,
    endDate: Date
  ): Promise<MarketData[]> {
    try {
      const cacheKey = `market_data:${symbols.join(',')}:${timeframe}:${startDate.toISOString()}:${endDate.toISOString()}`
      
      // 尝试从缓存获取
      // const cachedData = await cache.get(cacheKey)
      // if (cachedData) {
      //   return cachedData
      // }

      // 从数据库获取数据
      const marketData = await prisma.marketData.findMany({
        where: {
          symbol: { in: symbols },
          interval: timeframe,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          timestamp: 'asc'
        }
      })

      // 缓存数据
      // await cache.set(cacheKey, marketData, 3600) // 1小时缓存

      return marketData
    } catch (error) {
      logger.error('获取市场数据失败:', error)
      throw error
    }
  }

  private async saveBacktestResults(backtestId: string, result: BacktestResult): Promise<void> {
    try {
      await prisma.backtest.update({
        where: { id: backtestId },
        data: {
          finalCapital: result.finalCapital,
          totalReturn: result.totalReturn,
          sharpeRatio: result.sharpeRatio,
          maxDrawdown: result.maxDrawdown,
          winRate: result.winRate,
          totalTrades: result.trades.length,
          results: {
            ...result,
            equityCurve: result.equityCurve.map(point => ({
              timestamp: point.timestamp.toISOString(),
              value: point.value
            }))
          }
        }
      })
    } catch (error) {
      logger.error('保存回测结果失败:', error)
      throw error
    }
  }

  private async saveTrades(
    backtestId: string,
    trades: Trade[],
    userId: string,
    strategyId: string
  ): Promise<void> {
    try {
      const tradeData = trades.map(trade => ({
        strategyId,
        userId,
        backtestId,
        symbol: trade.symbol,
        type: trade.type,
        side: trade.side,
        quantity: trade.quantity,
        price: trade.price,
        timestamp: trade.timestamp,
        status: trade.status,
        commission: trade.commission,
        slippage: trade.slippage,
        pnl: trade.pnl,
        profit: trade.profit,
        notes: trade.notes
      }))

      await prisma.trade.createMany({
        data: tradeData
      })
    } catch (error) {
      logger.error('保存交易记录失败:', error)
      throw error
    }
  }

  private async updateBacktestStatus(
    backtestId: string,
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled',
    currentStep: string
  ): Promise<void> {
    try {
      await prisma.backtest.update({
        where: { id: backtestId },
        data: {
          status,
          currentStep
        }
      })
    } catch (error) {
      logger.error('更新回测状态失败:', error)
    }
  }

  private async updateBacktestProgress(
    backtestId: string,
    progress: number,
    currentStep: string
  ): Promise<void> {
    try {
      await prisma.backtest.update({
        where: { id: backtestId },
        data: {
          progress,
          currentStep
        }
      })
    } catch (error) {
      logger.error('更新回测进度失败:', error)
    }
  }

  private async logBacktest(backtestId: string, level: string, message: string): Promise<void> {
    try {
      // 这里可以实现日志记录功能
      logger.info(`[${backtestId}] ${level.toUpperCase()}: ${message}`)
    } catch (error) {
      logger.error('记录回测日志失败:', error)
    }
  }

  async cancelBacktest(backtestId: string, userId: string): Promise<void> {
    try {
      // 检查回测是否存在且属于当前用户
      const backtest = await prisma.backtest.findFirst({
        where: {
          id: backtestId,
          userId
        }
      })

      if (!backtest) {
        throw new Error('回测不存在或无权限访问')
      }

      if (backtest.status !== 'running') {
        throw new Error('只能取消正在运行的回测')
      }

      // 取消回测
      const abortController = this.activeBacktests.get(backtestId)
      if (abortController) {
        abortController.abort()
      }

      await this.updateBacktestStatus(backtestId, 'cancelled', '回测已取消')
    } catch (error) {
      logger.error('取消回测失败:', error)
      throw error
    }
  }

  async getBacktest(backtestId: string, userId: string) {
    try {
      const backtest = await prisma.backtest.findFirst({
        where: {
          id: backtestId,
          userId
        },
        include: {
          strategy: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          trades: {
            orderBy: {
              timestamp: 'desc'
            },
            take: 50 // 只返回最近50条交易记录
          }
        }
      })

      if (!backtest) {
        throw new Error('回测不存在或无权限访问')
      }

      return backtest
    } catch (error) {
      logger.error('获取回测失败:', error)
      throw error
    }
  }

  async getBacktests(userId: string, options?: {
    page?: number
    limit?: number
    status?: string
    strategyId?: string
  }) {
    try {
      const page = options?.page || 1
      const limit = options?.limit || 20
      const offset = (page - 1) * limit

      const where: any = { userId }
      if (options?.status) where.status = options.status
      if (options?.strategyId) where.strategyId = options.strategyId

      const [backtests, total] = await Promise.all([
        prisma.backtest.findMany({
          where,
          include: {
            strategy: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          },
          skip: offset,
          take: limit,
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.backtest.count({ where })
      ])

      return {
        backtests,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      logger.error('获取回测列表失败:', error)
      throw error
    }
  }

  async getBacktestTrades(backtestId: string, userId: string, options?: {
    page?: number
    limit?: number
  }) {
    try {
      // 检查回测权限
      const backtest = await prisma.backtest.findFirst({
        where: {
          id: backtestId,
          userId
        }
      })

      if (!backtest) {
        throw new Error('回测不存在或无权限访问')
      }

      const page = options?.page || 1
      const limit = options?.limit || 50
      const offset = (page - 1) * limit

      const [trades, total] = await Promise.all([
        prisma.trade.findMany({
          where: {
            backtestId
          },
          skip: offset,
          take: limit,
          orderBy: {
            timestamp: 'desc'
          }
        }),
        prisma.trade.count({
          where: {
            backtestId
          }
        })
      ])

      return {
        trades,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      logger.error('获取回测交易记录失败:', error)
      throw error
    }
  }

  async deleteBacktest(backtestId: string, userId: string): Promise<void> {
    try {
      // 检查回测权限
      const backtest = await prisma.backtest.findFirst({
        where: {
          id: backtestId,
          userId
        }
      })

      if (!backtest) {
        throw new Error('回测不存在或无权限访问')
      }

      // 如果正在运行，先取消
      if (backtest.status === 'running') {
        await this.cancelBacktest(backtestId, userId)
      }

      // 删除相关交易记录
      await prisma.trade.deleteMany({
        where: {
          backtestId
        }
      })

      // 删除回测记录
      await prisma.backtest.delete({
        where: {
          id: backtestId
        }
      })
    } catch (error) {
      logger.error('删除回测失败:', error)
      throw error
    }
  }

  async getBacktestStats(userId: string) {
    try {
      // 获取状态统计
      const statusStats = await prisma.backtest.groupBy({
        by: ['status'],
        where: { userId },
        _count: { status: true }
      })

      // 获取性能统计
      const performanceStats = await prisma.backtest.aggregate({
        where: {
          userId,
          status: 'completed',
          totalReturn: { not: null }
        },
        _avg: {
          totalReturn: true,
          sharpeRatio: true,
          maxDrawdown: true,
          winRate: true
        },
        _max: {
          totalReturn: true,
          sharpeRatio: true
        },
        _min: {
          maxDrawdown: true
        }
      })

      // 获取交易统计
      const tradeStats = await prisma.backtest.aggregate({
        where: {
          userId,
          status: 'completed',
          totalTrades: { not: null }
        },
        _sum: {
          totalTrades: true
        },
        _avg: {
          totalTrades: true
        }
      })

      // 获取最近的回测
      const recentBacktests = await prisma.backtest.findMany({
        where: { userId },
        include: {
          strategy: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })

      return {
        statusCounts: statusStats.reduce((acc, item) => {
          acc[item.status] = item._count.status
          return acc
        }, {} as Record<string, number>),
        performance: {
          avgReturn: performanceStats._avg.totalReturn || 0,
          avgSharpeRatio: performanceStats._avg.sharpeRatio || 0,
          avgMaxDrawdown: performanceStats._avg.maxDrawdown || 0,
          avgWinRate: performanceStats._avg.winRate || 0,
          maxReturn: performanceStats._max.totalReturn || 0,
          maxSharpeRatio: performanceStats._max.sharpeRatio || 0,
          minDrawdown: performanceStats._min.maxDrawdown || 0
        },
        trades: {
          totalTrades: tradeStats._sum.totalTrades || 0,
          avgTradesPerBacktest: tradeStats._avg.totalTrades || 0
        },
        recentBacktests
      }
    } catch (error) {
      logger.error('获取回测统计失败:', error)
      throw error
    }
  }
}

export default BacktestService