import { Router } from 'express'
import { body, query, param, validationResult } from 'express-validator'
import { authenticate } from '../middleware/auth'
import prisma from '../config/database'

const router = Router()

// 获取交易日志
router.get('/logs', authenticate, [
  query('accountId').optional().notEmpty().withMessage('账户ID不能为空'),
  query('level').optional().isIn(['info', 'warning', 'error', 'debug']).withMessage('日志级别必须是info、warning、error或debug'),
  query('category').optional().isIn(['order', 'position', 'balance', 'connection', 'risk', 'execution']).withMessage('分类必须是order、position、balance、connection、risk或execution'),
  query('action').optional().isIn(['create', 'update', 'cancel', 'execute', 'sync', 'error']).withMessage('动作必须是create、update、cancel、execute、sync或error'),
  query('symbol').optional().notEmpty().withMessage('交易对不能为空'),
  query('startDate').optional().isISO8601().withMessage('开始日期格式不正确'),
  query('endDate').optional().isISO8601().withMessage('结束日期格式不正确'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('限制必须是1-1000的整数'),
  query('offset').optional().isInt({ min: 0 }).withMessage('偏移量必须是非负整数')
], async (req, res) => {
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
      accountId,
      level,
      category,
      action,
      symbol,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = req.query

    const where: any = {}
    
    if (accountId) where.accountId = accountId
    if (level) where.level = level
    if (category) where.category = category
    if (action) where.action = action
    if (symbol) where.symbol = symbol
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate as string)
      if (endDate) where.createdAt.lte = new Date(endDate as string)
    }

    const [logs, total] = await Promise.all([
      prisma.tradingLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        include: {
          account: {
            select: { id: true, name: true, exchange: true }
          },
          user: {
            select: { id: true, username: true }
          }
        }
      }),
      prisma.tradingLog.count({ where })
    ])

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: parseInt(offset as string) + parseInt(limit as string) < total
      },
      message: '获取交易日志成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取交易日志失败',
      error: error.message
    })
  }
})

// 创建交易日志
router.post('/logs', authenticate, [
  body('level').isIn(['info', 'warning', 'error', 'debug']).withMessage('日志级别必须是info、warning、error或debug'),
  body('category').isIn(['order', 'position', 'balance', 'connection', 'risk', 'execution']).withMessage('分类必须是order、position、balance、connection、risk或execution'),
  body('action').isIn(['create', 'update', 'cancel', 'execute', 'sync', 'error']).withMessage('动作必须是create、update、cancel、execute、sync或error'),
  body('message').notEmpty().withMessage('消息内容不能为空'),
  body('accountId').optional().notEmpty().withMessage('账户ID不能为空'),
  body('symbol').optional().notEmpty().withMessage('交易对不能为空'),
  body('metadata').optional().isObject().withMessage('元数据必须是对象')
], async (req, res) => {
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
      level,
      category,
      action,
      message,
      accountId,
      symbol,
      metadata
    } = req.body

    const log = await prisma.tradingLog.create({
      data: {
        level,
        category,
        action,
        message,
        accountId,
        userId: req.user.id,
        symbol,
        metadata,
        source: 'trading'
      },
      include: {
        account: {
          select: { id: true, name: true, exchange: true }
        },
        user: {
          select: { id: true, username: true }
        }
      }
    })

    res.json({
      success: true,
      data: log,
      message: '创建交易日志成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建交易日志失败',
      error: error.message
    })
  }
})

// 获取日志统计
router.get('/logs/stats', authenticate, [
  query('accountId').optional().notEmpty().withMessage('账户ID不能为空'),
  query('startDate').optional().isISO8601().withMessage('开始日期格式不正确'),
  query('endDate').optional().isISO8601().withMessage('结束日期格式不正确')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array()
      })
    }

    const { accountId, startDate, endDate } = req.query

    const where: any = {}
    
    if (accountId) where.accountId = accountId
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate as string)
      if (endDate) where.createdAt.lte = new Date(endDate as string)
    }

    const [levelStats, categoryStats, actionStats, recentErrors] = await Promise.all([
      prisma.tradingLog.groupBy({
        by: ['level'],
        where,
        _count: { level: true }
      }),
      prisma.tradingLog.groupBy({
        by: ['category'],
        where,
        _count: { category: true }
      }),
      prisma.tradingLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true }
      }),
      prisma.tradingLog.findMany({
        where: { ...where, level: 'error' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          level: true,
          category: true,
          action: true,
          message: true,
          symbol: true,
          createdAt: true
        }
      })
    ])

    res.json({
      success: true,
      data: {
        levelStats: levelStats.map(stat => ({
          level: stat.level,
          count: stat._count.level
        })),
        categoryStats: categoryStats.map(stat => ({
          category: stat.category,
          count: stat._count.category
        })),
        actionStats: actionStats.map(stat => ({
          action: stat.action,
          count: stat._count.action
        })),
        recentErrors
      },
      message: '获取日志统计成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取日志统计失败',
      error: error.message
    })
  }
})

// 获取交易监控概览
router.get('/monitoring/overview', authenticate, [
  query('accountId').optional().notEmpty().withMessage('账户ID不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array()
      })
    }

    const { accountId } = req.query

    const where = accountId ? { accountId: accountId as string } : {}

    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalOrders24h,
      totalTrades24h,
      errorLogs24h,
      riskAlerts24h,
      activePositions,
      openOrders,
      totalPnL,
      recentActivities
    ] = await Promise.all([
      prisma.order.count({
        where: {
          ...where,
          createdAt: { gte: last24h }
        }
      }),
      prisma.trade.count({
        where: {
          ...where,
          timestamp: { gte: last24h }
        }
      }),
      prisma.tradingLog.count({
        where: {
          ...where,
          level: 'error',
          createdAt: { gte: last24h }
        }
      }),
      prisma.riskAssessment.count({
        where: {
          ...where,
          level: { in: ['high', 'critical'] },
          createdAt: { gte: last24h }
        }
      }),
      prisma.position.count({
        where: {
          ...where,
          status: 'open'
        }
      }),
      prisma.order.count({
        where: {
          ...where,
          status: { in: ['pending', 'open'] }
        }
      }),
      prisma.position.aggregate({
        where: {
          ...where,
          status: 'open'
        },
        _sum: { pnl: true }
      }),
      prisma.tradingLog.findMany({
        where: {
          ...where,
          createdAt: { gte: last24h }
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          level: true,
          category: true,
          action: true,
          message: true,
          symbol: true,
          createdAt: true
        }
      })
    ])

    res.json({
      success: true,
      data: {
        activity: {
          totalOrders24h,
          totalTrades24h,
          errorLogs24h,
          riskAlerts24h
        },
        positions: {
          activePositions,
          openOrders,
          totalPnL: totalPnL._sum.pnl || 0
        },
        recentActivities
      },
      message: '获取监控概览成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取监控概览失败',
      error: error.message
    })
  }
})

// 获取风险警报
router.get('/risk/alerts', authenticate, [
  query('accountId').optional().notEmpty().withMessage('账户ID不能为空'),
  query('level').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('风险级别必须是low、medium、high或critical'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('限制必须是1-100的整数')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array()
      })
    }

    const { accountId, level, limit = 50 } = req.query

    const where: any = {}
    
    if (accountId) where.accountId = accountId
    if (level) where.level = level

    const alerts = await prisma.riskAssessment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      include: {
        account: {
          select: { id: true, name: true, exchange: true }
        },
        rule: {
          select: { id: true, name: true, type: true }
        }
      }
    })

    res.json({
      success: true,
      data: alerts,
      message: '获取风险警报成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取风险警报失败',
      error: error.message
    })
  }
})

// 导出交易日志
router.get('/logs/export', authenticate, [
  query('accountId').optional().notEmpty().withMessage('账户ID不能为空'),
  query('format').optional().isIn(['csv', 'json']).withMessage('格式必须是csv或json'),
  query('startDate').optional().isISO8601().withMessage('开始日期格式不正确'),
  query('endDate').optional().isISO8601().withMessage('结束日期格式不正确')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array()
      })
    }

    const { accountId, format = 'csv', startDate, endDate } = req.query

    const where: any = {}
    
    if (accountId) where.accountId = accountId
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate as string)
      if (endDate) where.createdAt.lte = new Date(endDate as string)
    }

    const logs = await prisma.tradingLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        account: {
          select: { id: true, name: true, exchange: true }
        },
        user: {
          select: { id: true, username: true }
        }
      }
    })

    if (format === 'csv') {
      const csvHeader = 'ID,Level,Category,Action,Symbol,Message,Account,Exchange,User,Created At\n'
      const csvContent = logs.map(log => 
        `${log.id},${log.level},${log.category},${log.action},${log.symbol || ''},${log.message},${log.account?.name || ''},${log.account?.exchange || ''},${log.user?.username || ''},${log.createdAt}`
      ).join('\n')
      
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="trading_logs_${new Date().toISOString().split('T')[0]}.csv"`)
      res.send(csvHeader + csvContent)
    } else {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename="trading_logs_${new Date().toISOString().split('T')[0]}.json"`)
      res.json(logs)
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '导出交易日志失败',
      error: error.message
    })
  }
})

export default router