const express = require('express')
const router = express.Router()
const backtestController = require('../controllers/backtestController')
const { authenticate, authorize } = require('../middleware/auth')
const { validateBacktestConfig } = require('../middleware/validation')

// 所有路由都需要认证
router.use(authenticate)

// 获取回测记录列表
router.get('/', backtestController.getBacktests)

// 获取回测统计
router.get('/stats', backtestController.getBacktestStats)

// 获取回测模板
router.get('/templates', backtestController.getBacktestTemplates)

// 开始回测
router.post('/start', validateBacktestConfig, backtestController.startBacktest)

// 对比回测结果
router.post('/compare', backtestController.compareBacktests)

// 获取单个回测记录
router.get('/:id', backtestController.getBacktestById)

// 获取回测进度
router.get('/:id/progress', backtestController.getBacktestProgress)

// 取消回测
router.post('/:id/cancel', backtestController.cancelBacktest)

// 删除回测记录
router.delete('/:id', backtestController.deleteBacktest)

// 获取回测交易记录
router.get('/:id/trades', backtestController.getBacktestTrades)

// 导出交易记录
router.get('/:id/trades/export', backtestController.exportBacktestTrades)

// 获取回测日志
router.get('/:id/logs', backtestController.getBacktestLogs)

// 导出回测报告
router.get('/:id/export', backtestController.exportBacktestReport)

// 优化策略参数
router.post('/:id/optimize', backtestController.optimizeStrategy)

// 获取回测分析
router.get('/:id/analysis', backtestController.getBacktestAnalysis)

module.exports = router