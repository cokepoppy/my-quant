const Backtest = require('../models/Backtest')
const Strategy = require('../models/Strategy')
const Trade = require('../models/Trade')
const User = require('../models/User')
const { ValidationError } = require('../utils/errors')
const { validationResult } = require('express-validator')
const backtestService = require('../services/backtestService')
const cache = require('../utils/cache')
const logger = require('../utils/logger')

class BacktestController {
  // 获取回测记录列表
  async getBacktests(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        status = '',
        strategyId = '',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query

      const query = { userId: req.user.id }

      // 搜索过滤
      if (search) {
        query.$or = [
          { strategyName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      }

      // 状态过滤
      if (status) {
        query.status = status
      }

      // 策略过滤
      if (strategyId) {
        query.strategyId = strategyId
      }

      const skip = (page - 1) * limit
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

      const [backtests, total] = await Promise.all([
        Backtest.find(query)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .populate('strategyId', 'name type language'),
        Backtest.countDocuments(query)
      ])

      res.json({
        success: true,
        data: backtests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      logger.error('获取回测记录失败:', error)
      res.status(500).json({
        success: false,
        message: '获取回测记录失败',
        error: error.message
      })
    }
  }

  // 获取单个回测记录
  async getBacktestById(req, res) {
    try {
      const { id } = req.params

      const backtest = await Backtest.findOne({
        _id: id,
        userId: req.user.id
      }).populate('strategyId', 'name type language code config')

      if (!backtest) {
        return res.status(404).json({
          success: false,
          message: '回测记录不存在'
        })
      }

      res.json({
        success: true,
        data: backtest
      })
    } catch (error) {
      logger.error('获取回测记录失败:', error)
      res.status(500).json({
        success: false,
        message: '获取回测记录失败',
        error: error.message
      })
    }
  }

  // 开始回测
  async startBacktest(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '参数验证失败',
          errors: errors.array()
        })
      }

      const {
        strategyId,
        startDate,
        endDate,
        initialCapital,
        benchmark,
        dataFrequency,
        commission,
        slippage,
        leverage,
        symbols,
        timeframe,
        riskLimits,
        outputOptions
      } = req.body

      // 验证策略是否存在且属于当前用户
      const strategy = await Strategy.findOne({
        _id: strategyId,
        userId: req.user.id
      })

      if (!strategy) {
        return res.status(404).json({
          success: false,
          message: '策略不存在'
        })
      }

      // 创建回测记录
      const backtest = new Backtest({
        userId: req.user.id,
        strategyId,
        strategyName: strategy.name,
        startDate,
        endDate,
        initialCapital,
        benchmark,
        dataFrequency,
        commission,
        slippage,
        leverage,
        symbols: symbols || strategy.config.symbols,
        timeframe: timeframe || strategy.config.timeframe,
        riskLimits,
        outputOptions,
        status: 'pending',
        progress: 0,
        currentStep: '初始化中...'
      })

      await backtest.save()

      // 异步执行回测
      this.executeBacktest(backtest._id).catch(error => {
        logger.error('回测执行失败:', error)
      })

      res.json({
        success: true,
        data: backtest,
        message: '回测任务已启动'
      })
    } catch (error) {
      logger.error('启动回测失败:', error)
      res.status(500).json({
        success: false,
        message: '启动回测失败',
        error: error.message
      })
    }
  }

  // 执行回测
  async executeBacktest(backtestId) {
    try {
      const backtest = await Backtest.findById(backtestId)
      if (!backtest) {
        throw new Error('回测记录不存在')
      }

      // 更新状态为运行中
      backtest.status = 'running'
      backtest.currentStep = '准备回测数据...'
      await backtest.save()

      // 执行回测逻辑
      const result = await backtestService.executeBacktest(backtest)

      // 更新回测结果
      backtest.status = 'completed'
      backtest.results = result
      backtest.progress = 1
      backtest.currentStep = '回测完成'
      backtest.completedAt = new Date()
      backtest.duration = Math.floor((new Date().getTime() - new Date(backtest.createdAt).getTime()) / 1000)

      await backtest.save()

      // 缓存结果
      await cache.set(`backtest:${backtestId}`, result, 3600)

      logger.info(`回测完成: ${backtestId}`)
    } catch (error) {
      logger.error(`回测执行失败: ${backtestId}`, error)

      // 更新状态为失败
      const backtest = await Backtest.findById(backtestId)
      if (backtest) {
        backtest.status = 'failed'
        backtest.currentStep = '回测失败'
        backtest.error = error.message
        backtest.completedAt = new Date()
        await backtest.save()
      }
    }
  }

  // 取消回测
  async cancelBacktest(req, res) {
    try {
      const { id } = req.params

      const backtest = await Backtest.findOne({
        _id: id,
        userId: req.user.id
      })

      if (!backtest) {
        return res.status(404).json({
          success: false,
          message: '回测记录不存在'
        })
      }

      if (backtest.status !== 'running') {
        return res.status(400).json({
          success: false,
          message: '只能取消正在运行的回测'
        })
      }

      // 更新状态为已取消
      backtest.status = 'cancelled'
      backtest.currentStep = '回测已取消'
      backtest.completedAt = new Date()
      await backtest.save()

      // 清理缓存
      await cache.del(`backtest:${id}`)

      res.json({
        success: true,
        message: '回测已取消'
      })
    } catch (error) {
      logger.error('取消回测失败:', error)
      res.status(500).json({
        success: false,
        message: '取消回测失败',
        error: error.message
      })
    }
  }

  // 删除回测记录
  async deleteBacktest(req, res) {
    try {
      const { id } = req.params

      const backtest = await Backtest.findOne({
        _id: id,
        userId: req.user.id
      })

      if (!backtest) {
        return res.status(404).json({
          success: false,
          message: '回测记录不存在'
        })
      }

      // 删除相关的交易记录
      await Trade.deleteMany({ backtestId: id })

      // 删除回测记录
      await Backtest.findByIdAndDelete(id)

      // 清理缓存
      await cache.del(`backtest:${id}`)

      res.json({
        success: true,
        message: '删除成功'
      })
    } catch (error) {
      logger.error('删除回测记录失败:', error)
      res.status(500).json({
        success: false,
        message: '删除回测记录失败',
        error: error.message
      })
    }
  }

  // 获取回测进度
  async getBacktestProgress(req, res) {
    try {
      const { id } = req.params

      const backtest = await Backtest.findOne({
        _id: id,
        userId: req.user.id
      })

      if (!backtest) {
        return res.status(404).json({
          success: false,
          message: '回测记录不存在'
        })
      }

      res.json({
        success: true,
        data: {
          status: backtest.status,
          progress: backtest.progress,
          currentStep: backtest.currentStep,
          completedAt: backtest.completedAt
        }
      })
    } catch (error) {
      logger.error('获取回测进度失败:', error)
      res.status(500).json({
        success: false,
        message: '获取回测进度失败',
        error: error.message
      })
    }
  }

  // 获取回测交易记录
  async getBacktestTrades(req, res) {
    try {
      const { id } = req.params
      const {
        page = 1,
        limit = 20,
        search = '',
        type = '',
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = req.query

      // 验证回测记录是否存在且属于当前用户
      const backtest = await Backtest.findOne({
        _id: id,
        userId: req.user.id
      })

      if (!backtest) {
        return res.status(404).json({
          success: false,
          message: '回测记录不存在'
        })
      }

      const query = { backtestId: id }

      // 搜索过滤
      if (search) {
        query.$or = [
          { symbol: { $regex: search, $options: 'i' } },
          { type: { $regex: search, $options: 'i' } }
        ]
      }

      // 类型过滤
      if (type) {
        query.type = type
      }

      const skip = (page - 1) * limit
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

      const [trades, total] = await Promise.all([
        Trade.find(query)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        Trade.countDocuments(query)
      ])

      res.json({
        success: true,
        data: trades,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      logger.error('获取交易记录失败:', error)
      res.status(500).json({
        success: false,
        message: '获取交易记录失败',
        error: error.message
      })
    }
  }

  // 获取回测日志
  async getBacktestLogs(req, res) {
    try {
      const { id } = req.params
      const { level = '', limit = 100 } = req.query

      // 验证回测记录是否存在且属于当前用户
      const backtest = await Backtest.findOne({
        _id: id,
        userId: req.user.id
      })

      if (!backtest) {
        return res.status(404).json({
          success: false,
          message: '回测记录不存在'
        })
      }

      // 从缓存或数据库获取日志
      const cacheKey = `backtest:${id}:logs`
      let logs = await cache.get(cacheKey)

      if (!logs) {
        // 如果缓存中没有，返回空数组
        logs = []
      }

      // 按级别过滤
      if (level) {
        logs = logs.filter(log => log.level === level)
      }

      // 限制数量
      logs = logs.slice(-limit)

      res.json({
        success: true,
        data: { logs }
      })
    } catch (error) {
      logger.error('获取回测日志失败:', error)
      res.status(500).json({
        success: false,
        message: '获取回测日志失败',
        error: error.message
      })
    }
  }

  // 导出回测报告
  async exportBacktestReport(req, res) {
    try {
      const { id } = req.params

      const backtest = await Backtest.findOne({
        _id: id,
        userId: req.user.id
      })

      if (!backtest) {
        return res.status(404).json({
          success: false,
          message: '回测记录不存在'
        })
      }

      if (!backtest.results) {
        return res.status(400).json({
          success: false,
          message: '回测未完成，无法导出报告'
        })
      }

      // 生成PDF报告
      const pdfBuffer = await backtestService.generateBacktestReport(backtest)

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename=backtest_report_${id}.pdf`)
      res.send(pdfBuffer)
    } catch (error) {
      logger.error('导出回测报告失败:', error)
      res.status(500).json({
        success: false,
        message: '导出回测报告失败',
        error: error.message
      })
    }
  }

  // 导出交易记录
  async exportBacktestTrades(req, res) {
    try {
      const { id } = req.params

      const backtest = await Backtest.findOne({
        _id: id,
        userId: req.user.id
      })

      if (!backtest) {
        return res.status(404).json({
          success: false,
          message: '回测记录不存在'
        })
      }

      const trades = await Trade.find({ backtestId: id }).sort({ timestamp: 1 })

      // 生成CSV
      const csv = backtestService.generateTradesCSV(trades)

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename=backtest_trades_${id}.csv`)
      res.send(csv)
    } catch (error) {
      logger.error('导出交易记录失败:', error)
      res.status(500).json({
        success: false,
        message: '导出交易记录失败',
        error: error.message
      })
    }
  }

  // 获取回测统计
  async getBacktestStats(req, res) {
    try {
      const userId = req.user.id

      // 获取统计信息
      const stats = await Backtest.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: ['$status', 'completed', 1, 0] } },
            running: { $sum: { $cond: ['$status', 'running', 1, 0] } },
            failed: { $sum: { $cond: ['$status', 'failed', 1, 0] } },
            avgReturn: { $avg: '$results.totalReturn' },
            avgSharpe: { $avg: '$results.sharpeRatio' },
            avgDrawdown: { $avg: '$results.maxDrawdown' }
          }
        }
      ])

      const result = stats[0] || {
        total: 0,
        completed: 0,
        running: 0,
        failed: 0,
        avgReturn: 0,
        avgSharpe: 0,
        avgDrawdown: 0
      }

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      logger.error('获取回测统计失败:', error)
      res.status(500).json({
        success: false,
        message: '获取回测统计失败',
        error: error.message
      })
    }
  }

  // 对比回测结果
  async compareBacktests(req, res) {
    try {
      const { backtestIds } = req.body

      if (!backtestIds || !Array.isArray(backtestIds) || backtestIds.length < 2) {
        return res.status(400).json({
          success: false,
          message: '请提供至少两个回测ID进行对比'
        })
      }

      // 验证所有回测记录都属于当前用户
      const backtests = await Backtest.find({
        _id: { $in: backtestIds },
        userId: req.user.id,
        status: 'completed'
      })

      if (backtests.length !== backtestIds.length) {
        return res.status(404).json({
          success: false,
          message: '部分回测记录不存在或未完成'
        })
      }

      // 执行对比分析
      const comparison = await backtestService.compareBacktests(backtests)

      res.json({
        success: true,
        data: comparison
      })
    } catch (error) {
      logger.error('对比回测结果失败:', error)
      res.status(500).json({
        success: false,
        message: '对比回测结果失败',
        error: error.message
      })
    }
  }

  // 获取回测模板
  async getBacktestTemplates(req, res) {
    try {
      const templates = [
        {
          id: 'basic',
          name: '基础回测',
          description: '标准的回测配置',
          config: {
            initialCapital: 10000,
            commission: 0.001,
            slippage: 0.001,
            leverage: 1,
            dataFrequency: '1h',
            riskLimits: ['maxDrawdown'],
            outputOptions: ['trades', 'dailyReturns', 'drawdown']
          }
        },
        {
          id: 'conservative',
          name: '保守回测',
          description: '低风险回测配置',
          config: {
            initialCapital: 50000,
            commission: 0.001,
            slippage: 0.002,
            leverage: 1,
            dataFrequency: '1d',
            riskLimits: ['maxDrawdown', 'maxLoss'],
            outputOptions: ['trades', 'dailyReturns', 'drawdown']
          }
        },
        {
          id: 'aggressive',
          name: '激进回测',
          description: '高风险回测配置',
          config: {
            initialCapital: 5000,
            commission: 0.0005,
            slippage: 0.0005,
            leverage: 3,
            dataFrequency: '5m',
            riskLimits: ['maxPosition'],
            outputOptions: ['trades', 'dailyReturns', 'drawdown']
          }
        }
      ]

      res.json({
        success: true,
        data: templates
      })
    } catch (error) {
      logger.error('获取回测模板失败:', error)
      res.status(500).json({
        success: false,
        message: '获取回测模板失败',
        error: error.message
      })
    }
  }

  // 优化策略参数
  async optimizeStrategy(req, res) {
    try {
      const { id } = req.params
      const { parameters, generations, populationSize } = req.body

      const backtest = await Backtest.findOne({
        _id: id,
        userId: req.user.id
      })

      if (!backtest) {
        return res.status(404).json({
          success: false,
          message: '回测记录不存在'
        })
      }

      // 启动参数优化
      const optimizationId = await backtestService.startParameterOptimization(
        backtest,
        {
          parameters: parameters || [],
          generations: generations || 50,
          populationSize: populationSize || 20
        }
      )

      res.json({
        success: true,
        data: { optimizationId },
        message: '参数优化已启动'
      })
    } catch (error) {
      logger.error('优化策略参数失败:', error)
      res.status(500).json({
        success: false,
        message: '优化策略参数失败',
        error: error.message
      })
    }
  }

  // 获取回测分析
  async getBacktestAnalysis(req, res) {
    try {
      const { id } = req.params

      const backtest = await Backtest.findOne({
        _id: id,
        userId: req.user.id
      })

      if (!backtest) {
        return res.status(404).json({
          success: false,
          message: '回测记录不存在'
        })
      }

      if (!backtest.results) {
        return res.status(400).json({
          success: false,
          message: '回测未完成，无法进行分析'
        })
      }

      // 执行深度分析
      const analysis = await backtestService.analyzeBacktest(backtest)

      res.json({
        success: true,
        data: analysis
      })
    } catch (error) {
      logger.error('获取回测分析失败:', error)
      res.status(500).json({
        success: false,
        message: '获取回测分析失败',
        error: error.message
      })
    }
  }
}

module.exports = new BacktestController()