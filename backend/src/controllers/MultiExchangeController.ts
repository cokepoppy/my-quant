import { Request, Response } from 'express';
import prisma from '../config/database';
import { exchangeService } from '../exchanges/ExchangeService';
import { ExchangeConfig } from '../exchanges/types';

// 扩展Request类型以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        username: string;
        email: string;
        role: string;
      };
    }
  }
}

// 支持的交易所列表
const SUPPORTED_EXCHANGES = [
  {
    id: 'binance',
    name: 'Binance',
    features: ['spot', 'future', 'margin'],
    requiredCredentials: ['apiKey', 'apiSecret']
  },
  {
    id: 'okx',
    name: 'OKX',
    features: ['spot', 'future', 'margin'],
    requiredCredentials: ['apiKey', 'apiSecret', 'passphrase']
  },
  {
    id: 'huobi',
    name: 'Huobi',
    features: ['spot', 'future', 'margin'],
    requiredCredentials: ['apiKey', 'apiSecret']
  },
  {
    id: 'bybit',
    name: 'Bybit',
    features: ['spot', 'future', 'derivatives'],
    requiredCredentials: ['apiKey', 'apiSecret']
  }
];

export class MultiExchangeController {
  // 获取支持的交易所列表
  async getSupportedExchanges(req: Request, res: Response): Promise<Response> {
    try {
      return res.json({
        success: true,
        data: SUPPORTED_EXCHANGES
      });
    } catch (error) {
      console.error('获取支持的交易所失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取支持的交易所失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 获取用户的交易所账户列表
  async getUserExchanges(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user.id;
      
      const accounts = await prisma.account.findMany({
        where: {
          userId,
          isActive: true
        },
        include: {
          balances: true,
          positions: true,
          orders: {
            where: {
              status: {
                in: ['pending', 'open']
              }
            },
            orderBy: {
              createTime: 'desc'
            },
            take: 10
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // 获取每个交易所的连接状态
      const exchangesWithStatus = await Promise.all(
        accounts.map(async (account) => {
          let connectionStatus = 'disconnected';
          try {
            const status = exchangeService.getExchangeStatus(account.id);
            connectionStatus = status.status;
          } catch (error) {
            // 如果交易所未连接，状态为disconnected
          }

          return {
            ...account,
            connectionStatus,
            // 计算总余额（USD）
            totalBalanceInUSD: account.balances.reduce((total, balance) => {
              return total + (balance.valueInUSD || 0);
            }, 0),
            // 计算今日盈亏
            todayPnL: account.positions.reduce((total, position) => {
              return total + (position.pnl || 0);
            }, 0)
          };
        })
      );

      return res.json({
        success: true,
        data: exchangesWithStatus
      });
    } catch (error) {
      console.error('获取用户交易所账户失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取用户交易所账户失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 添加交易所账户
  async addExchangeAccount(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user.id;
      const {
        name,
        exchange,
        apiKey,
        apiSecret,
        passphrase,
        testnet = false
      } = req.body;

      // 验证输入
      if (!name || !exchange || !apiKey || !apiSecret) {
        return res.status(400).json({
          success: false,
          message: '请填写完整的交易所信息'
        });
      }

      // 检查交易所是否支持
      const supportedExchange = SUPPORTED_EXCHANGES.find(e => e.id === exchange);
      if (!supportedExchange) {
        return res.status(400).json({
          success: false,
          message: `不支持的交易所: ${exchange}`
        });
      }

      // 检查是否已存在相同配置的账户
      const existingAccount = await prisma.account.findFirst({
        where: {
          userId,
          exchange,
          apiKey
        }
      });

      if (existingAccount) {
        return res.status(400).json({
          success: false,
          message: '该API Key已存在'
        });
      }

      // 创建账户记录
      const account = await prisma.account.create({
        data: {
          userId,
          name,
          exchange,
          apiKey,
          apiSecret,
          passphrase: passphrase || null,
          testnet,
          type: testnet ? 'demo' : 'live',
          balance: 0,
          currency: 'USD',
          syncStatus: 'disconnected'
        }
      });

      // 创建交易所配置
      const exchangeConfig: ExchangeConfig = {
        id: account.id,
        name: account.name,
        apiKey: account.apiKey!,
        apiSecret: account.apiSecret!,
        passphrase: account.passphrase || undefined,
        testnet: account.testnet,
        enableRateLimit: true
      };

      // 添加到交易所服务
      const added = await exchangeService.addExchange(exchangeConfig);
      if (!added) {
        // 如果添加失败，删除账户记录
        await prisma.account.delete({
          where: { id: account.id }
        });
        return res.status(400).json({
          success: false,
          message: '添加交易所失败，请检查API配置'
        });
      }

      return res.json({
        success: true,
        message: '交易所账户添加成功',
        data: {
          id: account.id,
          name: account.name,
          exchange: account.exchange,
          testnet: account.testnet,
          syncStatus: 'disconnected'
        }
      });
    } catch (error) {
      console.error('添加交易所账户失败:', error);
      return res.status(500).json({
        success: false,
        message: '添加交易所账户失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 连接交易所
  async connectExchange(req: Request, res: Response): Promise<Response> {
    try {
      const { accountId } = req.params;
      const userId = req.user.id;

      // 验证账户所有权
      const account = await prisma.account.findFirst({
        where: {
          id: accountId,
          userId,
          isActive: true
        }
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          message: '交易所账户不存在'
        });
      }

      // 连接交易所
      const connected = await exchangeService.connectExchange(accountId);
      if (!connected) {
        return res.status(400).json({
          success: false,
          message: '连接交易所失败'
        });
      }

      // 更新账户状态
      await prisma.account.update({
        where: { id: accountId },
        data: {
          syncStatus: 'connected',
          lastSyncAt: new Date()
        }
      });

      return res.json({
        success: true,
        message: '交易所连接成功'
      });
    } catch (error) {
      console.error('连接交易所失败:', error);
      return res.status(500).json({
        success: false,
        message: '连接交易所失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 断开交易所连接
  async disconnectExchange(req: Request, res: Response): Promise<Response> {
    try {
      const { accountId } = req.params;
      const userId = req.user.id;

      // 验证账户所有权
      const account = await prisma.account.findFirst({
        where: {
          id: accountId,
          userId,
          isActive: true
        }
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          message: '交易所账户不存在'
        });
      }

      // 断开连接
      await exchangeService.disconnectExchange(accountId);

      // 更新账户状态
      await prisma.account.update({
        where: { id: accountId },
        data: {
          syncStatus: 'disconnected'
        }
      });

      return res.json({
        success: true,
        message: '交易所连接已断开'
      });
    } catch (error) {
      console.error('断开交易所连接失败:', error);
      return res.status(500).json({
        success: false,
        message: '断开交易所连接失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 删除交易所账户
  async deleteExchangeAccount(req: Request, res: Response): Promise<Response> {
    try {
      const { accountId } = req.params;
      const userId = req.user.id;

      // 验证账户所有权
      const account = await prisma.account.findFirst({
        where: {
          id: accountId,
          userId,
          isActive: true
        }
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          message: '交易所账户不存在'
        });
      }

      // 从交易所服务中移除
      await exchangeService.removeExchange(accountId);

      // 删除账户（软删除）
      await prisma.account.update({
        where: { id: accountId },
        data: {
          isActive: false,
          syncStatus: 'disconnected'
        }
      });

      return res.json({
        success: true,
        message: '交易所账户已删除'
      });
    } catch (error) {
      console.error('删除交易所账户失败:', error);
      return res.status(500).json({
        success: false,
        message: '删除交易所账户失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 获取交易所账户详情
  async getExchangeAccount(req: Request, res: Response): Promise<Response> {
    try {
      const { accountId } = req.params;
      const userId = req.user.id;

      const account = await prisma.account.findFirst({
        where: {
          id: accountId,
          userId,
          isActive: true
        },
        include: {
          balances: true,
          positions: {
            where: {
              status: 'open'
            }
          },
          orders: {
            orderBy: {
              createTime: 'desc'
            },
            take: 20
          }
        }
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          message: '交易所账户不存在'
        });
      }

      // 获取连接状态
      let connectionStatus = 'disconnected';
      try {
        const status = exchangeService.getExchangeStatus(accountId);
        connectionStatus = status.status;
      } catch (error) {
        // 如果交易所未连接，状态为disconnected
      }

      return res.json({
        success: true,
        data: {
          ...account,
          connectionStatus,
          totalBalanceInUSD: account.balances.reduce((total, balance) => {
            return total + (balance.valueInUSD || 0);
          }, 0),
          totalPnL: account.positions.reduce((total, position) => {
            return total + (position.pnl || 0);
          }, 0)
        }
      });
    } catch (error) {
      console.error('获取交易所账户详情失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取交易所账户详情失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 同步交易所数据
  async syncExchangeData(req: Request, res: Response): Promise<Response> {
    try {
      const { accountId } = req.params;
      const userId = req.user.id;

      // 验证账户所有权
      const account = await prisma.account.findFirst({
        where: {
          id: accountId,
          userId,
          isActive: true
        }
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          message: '交易所账户不存在'
        });
      }

      // 同步数据
      const result = await exchangeService.syncExchangeData(accountId);

      // 更新同步状态
      await prisma.account.update({
        where: { id: accountId },
        data: {
          lastSyncAt: new Date(),
          syncStatus: result.success ? 'connected' : 'error',
          errorLog: result.error ? { message: result.error, timestamp: new Date() } : undefined
        }
      });

      return res.json({
        success: result.success,
        message: result.success ? '数据同步成功' : '数据同步失败',
        data: result
      });
    } catch (error) {
      console.error('同步交易所数据失败:', error);
      return res.status(500).json({
        success: false,
        message: '同步交易所数据失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 获取多交易所汇总数据
  async getMultiExchangeSummary(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user.id;

      const accounts = await prisma.account.findMany({
        where: {
          userId,
          isActive: true
        },
        include: {
          balances: true,
          positions: {
            where: {
              status: 'open'
            }
          }
        }
      });

      // 计算汇总数据
      const summary = {
        totalAccounts: accounts.length,
        connectedAccounts: 0,
        totalBalanceInUSD: 0,
        totalPnL: 0,
        totalPositions: 0,
        profitablePositions: 0,
        losingPositions: 0,
        exchanges: [] as any[]
      };

      for (const account of accounts) {
        // 检查连接状态
        let connectionStatus = 'disconnected';
        try {
          const status = exchangeService.getExchangeStatus(account.id);
          connectionStatus = status.status;
          if (connectionStatus === 'connected') {
            summary.connectedAccounts++;
          }
        } catch (error) {
          // 如果交易所未连接，状态为disconnected
        }

        const accountBalance = account.balances.reduce((total, balance) => {
          return total + (balance.valueInUSD || 0);
        }, 0);

        const accountPnL = account.positions.reduce((total, position) => {
          return total + (position.pnl || 0);
        }, 0);

        summary.totalBalanceInUSD += accountBalance;
        summary.totalPnL += accountPnL;
        summary.totalPositions += account.positions.length;

        const profitableCount = account.positions.filter(p => (p.pnl || 0) > 0).length;
        const losingCount = account.positions.filter(p => (p.pnl || 0) < 0).length;

        summary.profitablePositions += profitableCount;
        summary.losingPositions += losingCount;

        summary.exchanges.push({
          id: account.id,
          name: account.name,
          exchange: account.exchange,
          connectionStatus,
          balance: accountBalance,
          pnl: accountPnL,
          positions: account.positions.length,
          testnet: account.testnet
        });
      }

      return res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('获取多交易所汇总数据失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取多交易所汇总数据失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }
}