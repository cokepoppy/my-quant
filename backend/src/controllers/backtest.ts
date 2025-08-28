import { Request, Response } from 'express'
import { body, query, validationResult } from 'express-validator'
import { asyncHandler, createError } from '../middleware/errorHandler'
import { authenticate, AuthRequest } from '../middleware/auth'
import BacktestService, { BacktestRequest } from '../services/backtest/BacktestService'
import { logger } from '../utils/logger'

const backtestService = new BacktestService()

export class BacktestController {
  // 启动回测
  startBacktest = [
    authenticate,
    body('strategyId').isUUID().withMessage('策略ID格式不正确'),
    body('name').isLength({ min: 1, max: 100 }).withMessage('回测名称长度必须在1-100字符之间'),
    body('description').optional().isLength({ max: 500 }).withMessage('描述长度不能超过500字符'),
    body('startDate').isISO8601().withMessage('开始日期格式不正确'),
    body('endDate').isISO8601().withMessage('结束日期格式不正确'),
    body('initialCapital').isFloat({ min: 0 }).withMessage('初始资金必须大于0'),
    body('symbols').isArray({ min: 1 }).withMessage('至少需要一个交易标的'),
    body('symbols.*').isString().withMessage('交易标的必须是字符串'),
    body('timeframe').isIn(['1m', '5m', '15m', '30m', '1h', '4h', '1d']).withMessage('时间框架不正确'),
    body('commission').optional().isFloat({ min: 0, max: 1 }).withMessage('手续费率必须在0-1之间'),
    body('slippage').optional().isFloat({ min: 0, max: 1 }).withMessage('滑点率必须在0-1之间'),
    body('leverage').optional().isFloat({ min: 1, max: 125 }).withMessage('杠杆倍数必须在1-125之间'),
    body('riskLimits').optional().isArray().withMessage('风险限制必须是数组'),
    body('outputOptions').optional().isArray().withMessage('输出选项必须是数组'),
    asyncHandler(async (req: AuthRequest, res: Response) => {
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
        name,
        description,
        startDate,
        endDate,
        initialCapital,
        symbols,
        timeframe,
        commission,
        slippage,
        leverage,
        riskLimits,
        outputOptions
      } = req.body

      // 验证日期范围
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: '开始日期必须早于结束日期'
        })
      }

      // 验证日期范围不能超过2年
      const maxDays = 365 * 2
      const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      if (daysDiff > maxDays) {
        return res.status(400).json({
          success: false,
          message: '回测时间范围不能超过2年'
        })
      }

      const request: BacktestRequest = {
        strategyId,
        userId: req.user!.id,
        name,
        description,
        startDate: start,
        endDate: end,
        initialCapital,
        symbols,
        timeframe,
        commission,
        slippage,
        leverage,
        riskLimits,
        outputOptions
      }

      try {
        const backtestId = await backtestService.startBacktest(request)
        
        res.status(201).json({
          success: true,
          message: '回测任务已启动',
          data: {
            backtestId,
            status: 'pending'
          }
        })
      } catch (error) {
        logger.error('启动回测失败:', error)
        res.status(500).json({
          success: false,
          message: '启动回测失败',
          error: error.message
        })
      }
    })
  ]

  // 获取回测详情
  getBacktest = [
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { id } = req.params

      try {
        const backtest = await backtestService.getBacktest(id, req.user!.id)
        
        res.json({
          success: true,
          data: { backtest }
        })
      } catch (error) {
        if (error.message === '回测不存在或无权限访问') {
          return res.status(404).json({
            success: false,
            message: error.message
          })
        }
        
        logger.error('获取回测详情失败:', error)
        res.status(500).json({
          success: false,
          message: '获取回测详情失败',
          error: error.message
        })
      }
    })
  ]

  // 获取回测列表
  getBacktests = [
    authenticate,
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('status').optional().isIn(['pending', 'running', 'completed', 'failed', 'cancelled']).withMessage('状态不正确'),
    query('strategyId').optional().isUUID().withMessage('策略ID格式不正确'),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '参数验证失败',
          errors: errors.array()
        })
      }

      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const status = req.query.status as string
      const strategyId = req.query.strategyId as string

      try {
        const result = await backtestService.getBacktests(req.user!.id, {
          page,
          limit,
          status,
          strategyId
        })
        
        res.json({
          success: true,
          data: result
        })
      } catch (error) {
        logger.error('获取回测列表失败:', error)
        res.status(500).json({
          success: false,
          message: '获取回测列表失败',
          error: error.message
        })
      }
    })
  ]

  // 获取回测交易记录
  getBacktestTrades = [
    authenticate,
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '参数验证失败',
          errors: errors.array()
        })
      }

      const { id } = req.params
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 50

      try {
        const result = await backtestService.getBacktestTrades(id, req.user!.id, {
          page,
          limit
        })
        
        res.json({
          success: true,
          data: result
        })
      } catch (error) {
        if (error.message === '回测不存在或无权限访问') {
          return res.status(404).json({
            success: false,
            message: error.message
          })
        }
        
        logger.error('获取回测交易记录失败:', error)
        res.status(500).json({
          success: false,
          message: '获取回测交易记录失败',
          error: error.message
        })
      }
    })
  ]

  // 取消回测
  cancelBacktest = [
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { id } = req.params

      try {
        await backtestService.cancelBacktest(id, req.user!.id)
        
        res.json({
          success: true,
          message: '回测已取消'
        })
      } catch (error) {
        if (error.message === '回测不存在或无权限访问' || error.message === '只能取消正在运行的回测') {
          return res.status(400).json({
            success: false,
            message: error.message
          })
        }
        
        logger.error('取消回测失败:', error)
        res.status(500).json({
          success: false,
          message: '取消回测失败',
          error: error.message
        })
      }
    })
  ]

  // 删除回测
  deleteBacktest = [
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { id } = req.params

      try {
        await backtestService.deleteBacktest(id, req.user!.id)
        
        res.json({
          success: true,
          message: '回测已删除'
        })
      } catch (error) {
        if (error.message === '回测不存在或无权限访问') {
          return res.status(404).json({
            success: false,
            message: error.message
          })
        }
        
        logger.error('删除回测失败:', error)
        res.status(500).json({
          success: false,
          message: '删除回测失败',
          error: error.message
        })
      }
    })
  ]

  // 获取回测统计
  getBacktestStats = [
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
      try {
        const stats = await backtestService.getBacktestStats(req.user!.id)
        
        res.json({
          success: true,
          data: { stats }
        })
      } catch (error) {
        logger.error('获取回测统计失败:', error)
        res.status(500).json({
          success: false,
          message: '获取回测统计失败',
          error: error.message
        })
      }
    })
  ]

  // 获取回测模板
  getBacktestTemplates = [
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
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
              riskLimits: ['maxPosition'],
              outputOptions: ['trades', 'dailyReturns', 'drawdown']
            }
          }
        ]

        res.json({
          success: true,
          data: { templates }
        })
      } catch (error) {
        logger.error('获取回测模板失败:', error)
        res.status(500).json({
          success: false,
          message: '获取回测模板失败',
          error: error.message
        })
      }
    })
  ]
}

export default new BacktestController()