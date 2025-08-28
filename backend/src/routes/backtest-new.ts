import { Router } from 'express'
import BacktestController from '../controllers/backtest'

const router = Router()

// 启动回测
router.post('/', BacktestController.startBacktest)

// 获取回测列表
router.get('/', BacktestController.getBacktests)

// 获取回测统计
router.get('/stats', BacktestController.getBacktestStats)

// 获取回测模板
router.get('/templates', BacktestController.getBacktestTemplates)

// 获取回测详情
router.get('/:id', BacktestController.getBacktest)

// 获取回测交易记录
router.get('/:id/trades', BacktestController.getBacktestTrades)

// 取消回测
router.post('/:id/cancel', BacktestController.cancelBacktest)

// 删除回测
router.delete('/:id', BacktestController.deleteBacktest)

export default router