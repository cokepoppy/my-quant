import { Router } from 'express'
import { body, query, param, validationResult } from 'express-validator'
import { authenticate } from '../middleware/auth'
import { riskManagementService } from '../services/RiskManagementService'

const router = Router()

// 获取风控规则
router.get('/rules', authenticate, async (req, res) => {
  try {
    const rules = await riskManagementService.getRiskRules()
    res.json({
      success: true,
      data: rules
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取风控规则失败',
      error: error.message
    })
  }
})

// 更新风控规则
router.put('/rules/:id', authenticate, [
  param('id').notEmpty().withMessage('规则ID不能为空'),
  body('name').optional().notEmpty().withMessage('规则名称不能为空'),
  body('enabled').optional().isBoolean().withMessage('启用状态必须是布尔值'),
  body('parameters').optional().isObject().withMessage('参数必须是对象'),
  body('priority').optional().isInt({ min: 1, max: 10 }).withMessage('优先级必须是1-10的整数')
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

    const { id } = req.params
    const updates = req.body

    const rule = await riskManagementService.updateRiskRule(id, updates)
    
    res.json({
      success: true,
      data: rule,
      message: '风控规则更新成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新风控规则失败',
      error: error.message
    })
  }
})

// 交易风险评估
router.post('/assess', authenticate, [
  body('accountId').notEmpty().withMessage('账户ID不能为空'),
  body('symbol').notEmpty().withMessage('交易对不能为空'),
  body('type').isIn(['buy', 'sell']).withMessage('交易类型必须是buy或sell'),
  body('amount').isFloat({ min: 0 }).withMessage('交易金额必须是正数'),
  body('price').optional().isFloat({ min: 0 }).withMessage('价格必须是正数')
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

    const { accountId, ...tradeRequest } = req.body

    const assessment = await riskManagementService.assessTradeRisk(accountId, tradeRequest)
    
    res.json({
      success: true,
      data: assessment,
      message: '风险评估完成'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '风险评估失败',
      error: error.message
    })
  }
})

// 获取账户风险状态
router.get('/account/:accountId/status', authenticate, [
  param('accountId').notEmpty().withMessage('账户ID不能为空')
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

    const { accountId } = req.params

    const status = await riskManagementService.getAccountRiskStatus(accountId)
    
    res.json({
      success: true,
      data: status,
      message: '获取账户风险状态成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取账户风险状态失败',
      error: error.message
    })
  }
})

// 获取风险报告
router.get('/account/:accountId/report', authenticate, [
  param('accountId').notEmpty().withMessage('账户ID不能为空'),
  query('period').optional().isIn(['day', 'week', 'month']).withMessage('期间必须是day、week或month')
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

    const { accountId } = req.params
    const { period = 'week' } = req.query

    const report = await riskManagementService.getRiskReport(accountId, period)
    
    res.json({
      success: true,
      data: report,
      message: '获取风险报告成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取风险报告失败',
      error: error.message
    })
  }
})

// 获取所有账户的风险概览
router.get('/overview', authenticate, async (req, res) => {
  try {
    // 这里需要实现获取所有账户的风险概览
    res.json({
      success: true,
      data: {
        totalAccounts: 0,
        highRiskAccounts: 0,
        mediumRiskAccounts: 0,
        lowRiskAccounts: 0,
        totalViolations: 0,
        activeAlerts: 0
      },
      message: '获取风险概览成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取风险概览失败',
      error: error.message
    })
  }
})

// 获取风险警报历史
router.get('/alerts', authenticate, [
  query('accountId').optional().notEmpty().withMessage('账户ID不能为空'),
  query('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('严重程度必须是low、medium、high或critical'),
  query('status').optional().isIn(['active', 'resolved']).withMessage('状态必须是active或resolved'),
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

    const { accountId, severity, status, limit = 50 } = req.query

    // 这里需要实现获取风险警报历史的逻辑
    const alerts = []
    
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

// 处理风险警报
router.put('/alerts/:alertId/resolve', authenticate, [
  param('alertId').notEmpty().withMessage('警报ID不能为空'),
  body('resolution').optional().notEmpty().withMessage('处理说明不能为空')
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

    const { alertId } = req.params
    const { resolution } = req.body

    // 这里需要实现处理风险警报的逻辑
    
    res.json({
      success: true,
      message: '风险警报处理成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '处理风险警报失败',
      error: error.message
    })
  }
})

// 获取风险配置
router.get('/config', authenticate, async (req, res) => {
  try {
    // 这里需要实现获取风险配置的逻辑
    const config = {
      riskAssessment: {
        enabled: true,
        autoReject: true,
        strictMode: false
      },
      monitoring: {
        enabled: true,
        interval: 60,
        alerts: true
      },
      reporting: {
        enabled: true,
        autoGenerate: true,
        schedule: 'daily'
      }
    }
    
    res.json({
      success: true,
      data: config,
      message: '获取风险配置成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取风险配置失败',
      error: error.message
    })
  }
})

// 更新风险配置
router.put('/config', authenticate, [
  body('riskAssessment.enabled').optional().isBoolean(),
  body('riskAssessment.autoReject').optional().isBoolean(),
  body('monitoring.enabled').optional().isBoolean(),
  body('monitoring.interval').optional().isInt({ min: 1, max: 3600 }),
  body('reporting.enabled').optional().isBoolean(),
  body('reporting.autoGenerate').optional().isBoolean(),
  body('reporting.schedule').optional().isIn(['daily', 'weekly', 'monthly'])
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

    // 这里需要实现更新风险配置的逻辑
    
    res.json({
      success: true,
      message: '风险配置更新成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新风险配置失败',
      error: error.message
    })
  }
})

export default router