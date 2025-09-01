import { Router } from 'express';
import { MultiExchangeController } from '../controllers/MultiExchangeController';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new MultiExchangeController();

// 获取支持的交易所列表（公开接口）
router.get('/supported', controller.getSupportedExchanges);

// 其他路由需要身份验证
router.use(authenticate);

// 获取用户的交易所账户列表
router.get('/accounts', controller.getUserExchanges);

// 获取多交易所汇总数据
router.get('/summary', controller.getMultiExchangeSummary);

// 添加交易所账户
router.post('/accounts', controller.addExchangeAccount);

// 获取交易所账户详情
router.get('/accounts/:accountId', controller.getExchangeAccount);

// 连接交易所
router.post('/accounts/:accountId/connect', controller.connectExchange);

// 断开交易所连接
router.post('/accounts/:accountId/disconnect', controller.disconnectExchange);

// 同步交易所数据
router.post('/accounts/:accountId/sync', controller.syncExchangeData);

// 删除交易所账户
router.delete('/accounts/:accountId', controller.deleteExchangeAccount);

export default router;