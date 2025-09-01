import { PrismaClient } from '@prisma/client'
import { exchangeService } from '../exchanges/ExchangeService'
import { EventEmitter } from 'events'

const prisma = new PrismaClient()

export interface RiskRule {
  id: string
  name: string
  type: 'position_size' | 'daily_loss' | 'drawdown' | 'leverage' | 'cooldown' | 'correlation'
  enabled: boolean
  parameters: Record<string, any>
  priority: number
  createdAt: Date
  updatedAt: Date
}

export interface RiskAssessment {
  passed: boolean
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  violations: RiskViolation[]
  recommendations: string[]
  adjustedParameters?: Record<string, any>
}

export interface RiskViolation {
  ruleId: string
  ruleName: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  currentValue: number
  limitValue: number
  recommendation: string
}

export interface RiskMetrics {
  totalExposure: number
  dailyPnL: number
  maxDrawdown: number
  currentDrawdown: number
  sharpeRatio: number
  winRate: number
  profitFactor: number
  correlationRisk: number
  leverageUsage: number
  riskScore: number
}

export class RiskManagementService extends EventEmitter {
  private rules: Map<string, RiskRule> = new Map()
  private riskMetrics: Map<string, RiskMetrics> = new Map()
  private violationHistory: Map<string, RiskViolation[]> = new Map()
  private riskAlerts: Map<string, any[]> = new Map()

  constructor() {
    super()
    this.initializeRiskRules()
    this.startRiskMonitoring()
  }

  private async initializeRiskRules(): Promise<void> {
    try {
      // 加载数据库中的风控规则
      const dbRules = await prisma.riskRule.findMany({
        where: { enabled: true },
        orderBy: { priority: 'desc' }
      })

      dbRules.forEach(rule => {
        this.rules.set(rule.id, {
          ...rule,
          parameters: rule.parameters as Record<string, any>
        })
      })

      // 如果没有规则，创建默认规则
      if (this.rules.size === 0) {
        await this.createDefaultRules()
      }

      console.log(`Initialized ${this.rules.size} risk rules`)
    } catch (error) {
      console.error('Error initializing risk rules:', error)
    }
  }

  private async createDefaultRules(): Promise<void> {
    const defaultRules = [
      {
        name: '最大仓位限制',
        type: 'position_size',
        parameters: {
          maxPositionSize: 10000,
          maxPositionPercentage: 10,
          maxSinglePosition: 5000
        },
        priority: 10
      },
      {
        name: '日亏损限制',
        type: 'daily_loss',
        parameters: {
          maxDailyLoss: 1000,
          maxDailyLossPercentage: 5,
          stopTradingOnLoss: true
        },
        priority: 9
      },
      {
        name: '最大回撤限制',
        type: 'drawdown',
        parameters: {
          maxDrawdown: 0.15,
          criticalDrawdown: 0.25,
          autoReducePositions: true
        },
        priority: 8
      },
      {
        name: '杠杆限制',
        type: 'leverage',
        parameters: {
          maxLeverage: 3,
          maxNotionalValue: 50000,
          marginCallLevel: 0.8
        },
        priority: 7
      },
      {
        name: '交易冷却期',
        type: 'cooldown',
        parameters: {
          cooldownPeriod: 300, // 5分钟
          maxTradesPerHour: 20,
          maxTradesPerDay: 100
        },
        priority: 6
      },
      {
        name: '相关性风险',
        type: 'correlation',
        parameters: {
          maxCorrelation: 0.8,
          maxConcurrentPositions: 5,
          diversificationRequired: true
        },
        priority: 5
      }
    ]

    for (const ruleData of defaultRules) {
      const rule = await prisma.riskRule.create({
        data: ruleData
      })
      
      this.rules.set(rule.id, {
        ...rule,
        parameters: rule.parameters as Record<string, any>
      })
    }
  }

  async assessTradeRisk(accountId: string, tradeRequest: any): Promise<RiskAssessment> {
    const violations: RiskViolation[] = []
    const recommendations: string[] = []
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'

    try {
      // 获取账户当前状态
      const accountMetrics = await this.getAccountRiskMetrics(accountId)
      
      // 逐一检查风控规则
      for (const rule of this.rules.values()) {
        const result = await this.evaluateRule(rule, accountId, tradeRequest, accountMetrics)
        
        if (!result.passed) {
          violations.push(result.violation)
          recommendations.push(result.recommendation)
          
          // 更新风险等级
          if (result.violation.severity === 'critical') {
            riskLevel = 'critical'
          } else if (result.violation.severity === 'high' && riskLevel !== 'critical') {
            riskLevel = 'high'
          } else if (result.violation.severity === 'medium' && riskLevel === 'low') {
            riskLevel = 'medium'
          }
        }
      }

      // 计算风险分数
      const riskScore = this.calculateRiskScore(violations)
      
      // 生成调整建议
      const adjustedParameters = this.generateAdjustedParameters(tradeRequest, violations)

      const assessment: RiskAssessment = {
        passed: violations.length === 0,
        riskLevel,
        violations,
        recommendations,
        adjustedParameters
      }

      // 记录评估结果
      await this.recordRiskAssessment(accountId, tradeRequest, assessment)

      // 发送风险事件
      this.emit('risk_assessment', {
        accountId,
        tradeRequest,
        assessment,
        timestamp: Date.now()
      })

      return assessment
    } catch (error) {
      console.error('Error assessing trade risk:', error)
      return {
        passed: false,
        riskLevel: 'critical',
        violations: [{
          ruleId: 'system_error',
          ruleName: '系统错误',
          type: 'system',
          severity: 'critical',
          message: '风险评估系统错误',
          currentValue: 0,
          limitValue: 0,
          recommendation: '请联系技术支持'
        }],
        recommendations: ['风险评估失败，请稍后重试']
      }
    }
  }

  private async evaluateRule(rule: RiskRule, accountId: string, tradeRequest: any, metrics: RiskMetrics): Promise<{ passed: boolean; violation: RiskViolation; recommendation: string }> {
    switch (rule.type) {
      case 'position_size':
        return this.evaluatePositionSizeRule(rule, accountId, tradeRequest, metrics)
      case 'daily_loss':
        return this.evaluateDailyLossRule(rule, accountId, tradeRequest, metrics)
      case 'drawdown':
        return this.evaluateDrawdownRule(rule, accountId, tradeRequest, metrics)
      case 'leverage':
        return this.evaluateLeverageRule(rule, accountId, tradeRequest, metrics)
      case 'cooldown':
        return this.evaluateCooldownRule(rule, accountId, tradeRequest, metrics)
      case 'correlation':
        return this.evaluateCorrelationRule(rule, accountId, tradeRequest, metrics)
      default:
        return { passed: true, violation: null, recommendation: '' }
    }
  }

  private async evaluatePositionSizeRule(rule: RiskRule, accountId: string, tradeRequest: any, metrics: RiskMetrics): Promise<{ passed: boolean; violation: RiskViolation; recommendation: string }> {
    const tradeValue = parseFloat(tradeRequest.amount) * (parseFloat(tradeRequest.price) || 1)
    const maxPositionSize = rule.parameters.maxPositionSize
    const maxSinglePosition = rule.parameters.maxSinglePosition

    if (tradeValue > maxSinglePosition) {
      return {
        passed: false,
        violation: {
          ruleId: rule.id,
          ruleName: rule.name,
          type: rule.type,
          severity: 'high',
          message: `交易金额 ${tradeValue} 超过单笔交易限制 ${maxSinglePosition}`,
          currentValue: tradeValue,
          limitValue: maxSinglePosition,
          recommendation: `减少交易金额至 ${maxSinglePosition} 以下`
        },
        recommendation: `建议减少交易金额至 ${maxSinglePosition} 以下`
      }
    }

    if (metrics.totalExposure + tradeValue > maxPositionSize) {
      return {
        passed: false,
        violation: {
          ruleId: rule.id,
          ruleName: rule.name,
          type: rule.type,
          severity: 'medium',
          message: `总仓位将达到 ${metrics.totalExposure + tradeValue}，超过最大仓位限制 ${maxPositionSize}`,
          currentValue: metrics.totalExposure + tradeValue,
          limitValue: maxPositionSize,
          recommendation: `减少仓位或平仓现有仓位`
        },
        recommendation: `建议减少交易金额或平仓部分现有仓位`
      }
    }

    return { passed: true, violation: null, recommendation: '' }
  }

  private async evaluateDailyLossRule(rule: RiskRule, accountId: string, tradeRequest: any, metrics: RiskMetrics): Promise<{ passed: boolean; violation: RiskViolation; recommendation: string }> {
    const maxDailyLoss = rule.parameters.maxDailyLoss
    const currentLoss = Math.abs(Math.min(0, metrics.dailyPnL))

    if (currentLoss >= maxDailyLoss) {
      return {
        passed: false,
        violation: {
          ruleId: rule.id,
          ruleName: rule.name,
          type: rule.type,
          severity: 'critical',
          message: `今日亏损 ${currentLoss} 已达到最大亏损限制 ${maxDailyLoss}`,
          currentValue: currentLoss,
          limitValue: maxDailyLoss,
          recommendation: '停止今日交易，等待明日重置'
        },
        recommendation: '建议停止今日交易，等待亏损限制重置'
      }
    }

    return { passed: true, violation: null, recommendation: '' }
  }

  private async evaluateDrawdownRule(rule: RiskRule, accountId: string, tradeRequest: any, metrics: RiskMetrics): Promise<{ passed: boolean; violation: RiskViolation; recommendation: string }> {
    const maxDrawdown = rule.parameters.maxDrawdown
    const criticalDrawdown = rule.parameters.criticalDrawdown

    if (metrics.currentDrawdown >= criticalDrawdown) {
      return {
        passed: false,
        violation: {
          ruleId: rule.id,
          ruleName: rule.name,
          type: rule.type,
          severity: 'critical',
          message: `当前回撤 ${(metrics.currentDrawdown * 100).toFixed(2)}% 已达到临界回撤 ${(criticalDrawdown * 100).toFixed(2)}%`,
          currentValue: metrics.currentDrawdown,
          limitValue: criticalDrawdown,
          recommendation: '立即平仓所有仓位，停止交易'
        },
        recommendation: '建议立即平仓所有仓位，停止交易并分析原因'
      }
    }

    if (metrics.currentDrawdown >= maxDrawdown) {
      return {
        passed: false,
        violation: {
          ruleId: rule.id,
          ruleName: rule.name,
          type: rule.type,
          severity: 'high',
          message: `当前回撤 ${(metrics.currentDrawdown * 100).toFixed(2)}% 已超过最大回撤 ${(maxDrawdown * 100).toFixed(2)}%`,
          currentValue: metrics.currentDrawdown,
          limitValue: maxDrawdown,
          recommendation: '减少仓位或暂停交易'
        },
        recommendation: '建议减少仓位或暂停交易，等待回撤恢复'
      }
    }

    return { passed: true, violation: null, recommendation: '' }
  }

  private async evaluateLeverageRule(rule: RiskRule, accountId: string, tradeRequest: any, metrics: RiskMetrics): Promise<{ passed: boolean; violation: RiskViolation; recommendation: string }> {
    const maxLeverage = rule.parameters.maxLeverage

    if (metrics.leverageUsage > maxLeverage) {
      return {
        passed: false,
        violation: {
          ruleId: rule.id,
          ruleName: rule.name,
          type: rule.type,
          severity: 'high',
          message: `当前杠杆使用率 ${metrics.leverageUsage.toFixed(2)}x 超过最大杠杆限制 ${maxLeverage}x`,
          currentValue: metrics.leverageUsage,
          limitValue: maxLeverage,
          recommendation: '减少杠杆使用，平仓部分仓位'
        },
        recommendation: '建议减少杠杆使用，平仓部分高风险仓位'
      }
    }

    return { passed: true, violation: null, recommendation: '' }
  }

  private async evaluateCooldownRule(rule: RiskRule, accountId: string, tradeRequest: any, metrics: RiskMetrics): Promise<{ passed: boolean; violation: RiskViolation; recommendation: string }> {
    const cooldownPeriod = rule.parameters.cooldownPeriod
    const now = Date.now()

    // 检查最近交易时间
    const recentTrades = await prisma.trade.findMany({
      where: {
        accountId,
        timestamp: { gte: new Date(now - cooldownPeriod * 1000) }
      },
      orderBy: { timestamp: 'desc' }
    })

    if (recentTrades.length > 0) {
      const timeSinceLastTrade = now - recentTrades[0].createdAt.getTime()
      
      if (timeSinceLastTrade < cooldownPeriod * 1000) {
        return {
          passed: false,
          violation: {
            ruleId: rule.id,
            ruleName: rule.name,
            type: rule.type,
            severity: 'low',
            message: `距离上次交易仅 ${(timeSinceLastTrade / 1000).toFixed(0)} 秒，未达到冷却期 ${cooldownPeriod} 秒`,
            currentValue: timeSinceLastTrade / 1000,
            limitValue: cooldownPeriod,
            recommendation: '等待冷却期结束后再交易'
          },
          recommendation: `建议等待 ${cooldownPeriod - Math.floor(timeSinceLastTrade / 1000)} 秒后再进行交易`
        }
      }
    }

    return { passed: true, violation: null, recommendation: '' }
  }

  private async evaluateCorrelationRule(rule: RiskRule, accountId: string, tradeRequest: any, metrics: RiskMetrics): Promise<{ passed: boolean; violation: RiskViolation; recommendation: string }> {
    // 简化的相关性检查
    const maxConcurrentPositions = rule.parameters.maxConcurrentPositions
    
    const currentPositions = await prisma.position.count({
      where: {
        accountId,
        status: 'open'
      }
    })

    if (currentPositions >= maxConcurrentPositions) {
      return {
        passed: false,
        violation: {
          ruleId: rule.id,
          ruleName: rule.name,
          type: rule.type,
          severity: 'medium',
          message: `当前持仓数 ${currentPositions} 已达到最大并发持仓限制 ${maxConcurrentPositions}`,
          currentValue: currentPositions,
          limitValue: maxConcurrentPositions,
          recommendation: '分散投资，减少相关性高的持仓'
        },
        recommendation: '建议分散投资，避免过度集中在相关性高的资产上'
      }
    }

    return { passed: true, violation: null, recommendation: '' }
  }

  private async getAccountRiskMetrics(accountId: string): Promise<RiskMetrics> {
    try {
      // 获取账户基本信息
      const account = await prisma.account.findUnique({
        where: { id: accountId }
      })

      if (!account) {
        throw new Error('Account not found')
      }

      // 计算各种风险指标
      const [totalExposure, dailyPnL, positions, trades] = await Promise.all([
        this.calculateTotalExposure(accountId),
        this.calculateDailyPnL(accountId),
        this.getCurrentPositions(accountId),
        this.getRecentTrades(accountId)
      ])

      const maxDrawdown = await this.calculateMaxDrawdown(accountId)
      const currentDrawdown = await this.calculateCurrentDrawdown(accountId)
      const sharpeRatio = await this.calculateSharpeRatio(accountId)
      const winRate = await this.calculateWinRate(accountId)
      const profitFactor = await this.calculateProfitFactor(accountId)
      const leverageUsage = await this.calculateLeverageUsage(accountId)

      const riskScore = this.calculateOverallRiskScore({
        totalExposure,
        dailyPnL,
        maxDrawdown,
        currentDrawdown,
        sharpeRatio,
        winRate,
        profitFactor,
        correlationRisk: 0,
        leverageUsage
      })

      const metrics: RiskMetrics = {
        totalExposure,
        dailyPnL,
        maxDrawdown,
        currentDrawdown,
        sharpeRatio,
        winRate,
        profitFactor,
        correlationRisk: 0,
        leverageUsage,
        riskScore
      }

      // 缓存风险指标
      this.riskMetrics.set(accountId, metrics)

      return metrics
    } catch (error) {
      console.error('Error getting account risk metrics:', error)
      throw error
    }
  }

  private async calculateTotalExposure(accountId: string): Promise<number> {
    const positions = await prisma.position.findMany({
      where: {
        accountId,
        status: 'open'
      }
    })

    return positions.reduce((total, position) => {
      return total + (parseFloat(position.size) * parseFloat(position.markPrice))
    }, 0)
  }

  private async calculateDailyPnL(accountId: string): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const trades = await prisma.trade.findMany({
      where: {
        accountId,
        timestamp: { gte: today },
        status: 'completed'
      }
    })

    return trades.reduce((pnl, trade) => {
      const tradePnl = parseFloat(trade.metadata?.pnl || '0')
      return pnl + tradePnl
    }, 0)
  }

  private async getCurrentPositions(accountId: string): Promise<any[]> {
    return await prisma.position.findMany({
      where: {
        accountId,
        status: 'open'
      }
    })
  }

  private async getRecentTrades(accountId: string): Promise<any[]> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    return await prisma.trade.findMany({
      where: {
        accountId,
        timestamp: { gte: thirtyDaysAgo },
        status: 'completed'
      },
      orderBy: { timestamp: 'desc' }
    })
  }

  private async calculateMaxDrawdown(accountId: string): Promise<number> {
    // 简化实现，实际应该基于历史净值曲线
    return 0.1 // 10%
  }

  private async calculateCurrentDrawdown(accountId: string): Promise<number> {
    // 简化实现
    return 0.05 // 5%
  }

  private async calculateSharpeRatio(accountId: string): Promise<number> {
    // 简化实现
    return 1.2
  }

  private async calculateWinRate(accountId: string): Promise<number> {
    const trades = await this.getRecentTrades(accountId)
    if (trades.length === 0) return 0

    const winningTrades = trades.filter(trade => {
      const pnl = parseFloat(trade.metadata?.pnl || '0')
      return pnl > 0
    })

    return winningTrades.length / trades.length
  }

  private async calculateProfitFactor(accountId: string): Promise<number> {
    const trades = await this.getRecentTrades(accountId)
    if (trades.length === 0) return 0

    const grossProfit = trades.reduce((sum, trade) => {
      const pnl = parseFloat(trade.metadata?.pnl || '0')
      return sum + Math.max(0, pnl)
    }, 0)

    const grossLoss = trades.reduce((sum, trade) => {
      const pnl = parseFloat(trade.metadata?.pnl || '0')
      return sum + Math.abs(Math.min(0, pnl))
    }, 0)

    return grossLoss > 0 ? grossProfit / grossLoss : 0
  }

  private async calculateLeverageUsage(accountId: string): Promise<number> {
    // 简化实现
    return 1.5
  }

  private calculateRiskScore(violations: RiskViolation[]): number {
    const severityWeights = {
      low: 1,
      medium: 3,
      high: 5,
      critical: 10
    }

    return violations.reduce((score, violation) => {
      return score + severityWeights[violation.severity]
    }, 0)
  }

  private calculateOverallRiskScore(metrics: RiskMetrics): number {
    // 综合风险评分算法
    const drawdownScore = metrics.currentDrawdown * 100
    const leverageScore = metrics.leverageUsage > 1 ? (metrics.leverageUsage - 1) * 20 : 0
    const dailyLossScore = metrics.dailyPnL < 0 ? Math.abs(metrics.dailyPnL) / 100 : 0

    return Math.min(100, drawdownScore + leverageScore + dailyLossScore)
  }

  private generateAdjustedParameters(tradeRequest: any, violations: RiskViolation[]): Record<string, any> {
    const adjusted = { ...tradeRequest }

    violations.forEach(violation => {
      switch (violation.type) {
        case 'position_size':
          if (violation.currentValue > violation.limitValue) {
            const reductionRatio = violation.limitValue / violation.currentValue
            adjusted.amount = (parseFloat(adjusted.amount) * reductionRatio).toString()
          }
          break
        case 'leverage':
          // 调整杠杆相关参数
          break
      }
    })

    return adjusted
  }

  private async recordRiskAssessment(accountId: string, tradeRequest: any, assessment: RiskAssessment): Promise<void> {
    try {
      await prisma.riskAssessment.create({
        data: {
          accountId,
          tradeRequest,
          assessment,
          riskLevel: assessment.riskLevel,
          violationsCount: assessment.violations.length,
          timestamp: new Date()
        }
      })

      // 记录违规历史
      if (assessment.violations.length > 0) {
        const history = this.violationHistory.get(accountId) || []
        history.push(...assessment.violations)
        this.violationHistory.set(accountId, history)
      }
    } catch (error) {
      console.error('Error recording risk assessment:', error)
    }
  }

  private startRiskMonitoring(): void {
    // 定期风险监控
    setInterval(() => {
      this.monitorAllAccounts()
    }, 60000) // 每分钟检查一次

    // 实时风险监控
    setInterval(() => {
      this.checkRealTimeRisk()
    }, 5000) // 每5秒检查一次
  }

  private async monitorAllAccounts(): Promise<void> {
    try {
      const accounts = await prisma.account.findMany({
        where: { isActive: true }
      })

      for (const account of accounts) {
        await this.monitorAccountRisk(account.id)
      }
    } catch (error) {
      console.error('Error monitoring accounts:', error)
    }
  }

  private async monitorAccountRisk(accountId: string): Promise<void> {
    try {
      const metrics = await this.getAccountRiskMetrics(accountId)
      
      // 检查风险指标是否超过阈值
      if (metrics.riskScore > 70) {
        await this.createRiskAlert(accountId, 'HIGH_RISK_SCORE', {
          riskScore: metrics.riskScore,
          metrics
        })
      }

      if (metrics.currentDrawdown > 0.2) {
        await this.createRiskAlert(accountId, 'HIGH_DRAWDOWN', {
          drawdown: metrics.currentDrawdown,
          metrics
        })
      }

      if (metrics.dailyPnL < -1000) {
        await this.createRiskAlert(accountId, 'DAILY_LOSS_LIMIT', {
          dailyPnL: metrics.dailyPnL,
          metrics
        })
      }

      // 更新风险指标
      this.riskMetrics.set(accountId, metrics)
    } catch (error) {
      console.error(`Error monitoring account ${accountId}:`, error)
    }
  }

  private async checkRealTimeRisk(): Promise<void> {
    // 实时风险检查逻辑
    // 可以包括市场异常波动、流动性风险等
  }

  private async createRiskAlert(accountId: string, type: string, data: any): Promise<void> {
    try {
      const alert = await prisma.riskAlert.create({
        data: {
          accountId,
          type,
          severity: this.getAlertSeverity(type, data),
          message: this.generateAlertMessage(type, data),
          data,
          timestamp: new Date(),
          status: 'active'
        }
      })

      // 添加到内存缓存
      const alerts = this.riskAlerts.get(accountId) || []
      alerts.push(alert)
      this.riskAlerts.set(accountId, alerts)

      // 发送风险事件
      this.emit('risk_alert', {
        accountId,
        alert,
        timestamp: Date.now()
      })
    } catch (error) {
      console.error('Error creating risk alert:', error)
    }
  }

  private getAlertSeverity(type: string, data: any): 'low' | 'medium' | 'high' | 'critical' {
    switch (type) {
      case 'HIGH_RISK_SCORE':
        return data.riskScore > 90 ? 'critical' : 'high'
      case 'HIGH_DRAWDOWN':
        return data.drawdown > 0.3 ? 'critical' : 'high'
      case 'DAILY_LOSS_LIMIT':
        return 'high'
      default:
        return 'medium'
    }
  }

  private generateAlertMessage(type: string, data: any): string {
    switch (type) {
      case 'HIGH_RISK_SCORE':
        return `风险分数过高: ${data.riskScore.toFixed(1)}`
      case 'HIGH_DRAWDOWN':
        return `回撤过大: ${(data.drawdown * 100).toFixed(2)}%`
      case 'DAILY_LOSS_LIMIT':
        return `日亏损超限: ${data.dailyPnL.toFixed(2)}`
      default:
        return '风险警告'
    }
  }

  // 订单验证功能
  async validateOrder(orderData: any): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
    adjustedOrder?: any
  }> {
    const errors: string[] = []
    const warnings: string[] = []
    let adjustedOrder = { ...orderData }

    try {
      // 基础参数验证
      const validationErrors = this.validateOrderParameters(orderData)
      errors.push(...validationErrors)

      if (errors.length > 0) {
        return { valid: false, errors, warnings }
      }

      // 获取账户信息
      const account = await prisma.account.findUnique({
        where: { id: orderData.accountId }
      })

      if (!account) {
        errors.push('账户不存在')
        return { valid: false, errors, warnings }
      }

      // 余额验证
      const balanceValidation = await this.validateAccountBalance(account, orderData)
      if (!balanceValidation.valid) {
        errors.push(...balanceValidation.errors)
      }
      warnings.push(...balanceValidation.warnings)

      // 市场数据验证
      const marketValidation = await this.validateMarketData(orderData)
      if (!marketValidation.valid) {
        errors.push(...marketValidation.errors)
      }
      warnings.push(...marketValidation.warnings)

      // 风险评估
      const riskAssessment = await this.assessTradeRisk(orderData.accountId, orderData)
      if (!riskAssessment.passed) {
        errors.push(...riskAssessment.violations.map(v => v.message))
        
        // 生成调整建议
        if (riskAssessment.adjustedParameters) {
          adjustedOrder = { ...adjustedOrder, ...riskAssessment.adjustedParameters }
          warnings.push('订单参数已根据风险规则调整')
        }
      }

      // 订单类型特定验证
      const typeValidation = await this.validateOrderTypeSpecific(orderData)
      if (!typeValidation.valid) {
        errors.push(...typeValidation.errors)
      }
      warnings.push(...typeValidation.warnings)

      // 流动性验证
      const liquidityValidation = await this.validateLiquidity(orderData)
      if (!liquidityValidation.valid) {
        errors.push(...liquidityValidation.errors)
      }
      warnings.push(...liquidityValidation.warnings)

      // 时间验证
      const timeValidation = this.validateTradingTime(orderData)
      if (!timeValidation.valid) {
        errors.push(...timeValidation.errors)
      }
      warnings.push(...timeValidation.warnings)

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        adjustedOrder: errors.length === 0 ? adjustedOrder : undefined
      }

    } catch (error) {
      console.error('Error validating order:', error)
      return {
        valid: false,
        errors: ['订单验证失败，请稍后重试'],
        warnings: []
      }
    }
  }

  private validateOrderParameters(orderData: any): string[] {
    const errors: string[] = []

    // 必填字段验证
    const requiredFields = ['accountId', 'symbol', 'type', 'side', 'amount']
    for (const field of requiredFields) {
      if (!orderData[field]) {
        errors.push(`${field} 是必填字段`)
      }
    }

    // 订单类型验证
    const validOrderTypes = ['market', 'limit', 'stop', 'stop_limit']
    if (orderData.type && !validOrderTypes.includes(orderData.type)) {
      errors.push(`无效的订单类型: ${orderData.type}`)
    }

    // 买卖方向验证
    if (orderData.side && !['buy', 'sell'].includes(orderData.side)) {
      errors.push(`无效的买卖方向: ${orderData.side}`)
    }

    // 数量验证
    if (orderData.amount) {
      const amount = parseFloat(orderData.amount)
      if (isNaN(amount) || amount <= 0) {
        errors.push('订单数量必须大于0')
      }
      if (amount > 1000000) {
        errors.push('订单数量过大')
      }
    }

    // 价格验证（限价单）
    if (['limit', 'stop_limit'].includes(orderData.type)) {
      if (!orderData.price) {
        errors.push('限价单必须指定价格')
      } else {
        const price = parseFloat(orderData.price)
        if (isNaN(price) || price <= 0) {
          errors.push('价格必须大于0')
        }
      }
    }

    // 止损价格验证
    if (['stop', 'stop_limit'].includes(orderData.type)) {
      if (!orderData.stopPrice) {
        errors.push('止损单必须指定止损价格')
      } else {
        const stopPrice = parseFloat(orderData.stopPrice)
        if (isNaN(stopPrice) || stopPrice <= 0) {
          errors.push('止损价格必须大于0')
        }
      }
    }

    return errors
  }

  private async validateAccountBalance(account: any, orderData: any): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      const orderValue = parseFloat(orderData.amount) * (parseFloat(orderData.price) || 0)
      
      if (orderData.side === 'buy') {
        // 买入订单验证可用余额
        if (account.balance < orderValue) {
          errors.push('账户余额不足')
        }
        
        // 预留保证金验证
        const marginRequirement = orderValue * 0.1 // 10% 保证金
        if (account.balance - orderValue < marginRequirement) {
          warnings.push('交易后可用余额将低于保证金要求')
        }
      }

      // 检查账户状态
      if (!account.isActive) {
        errors.push('账户已禁用')
      }

      // 检查账户限制
      if (account.dailyLimit && orderValue > account.dailyLimit) {
        errors.push(`超过每日交易限额 ${account.dailyLimit}`)
      }

    } catch (error) {
      errors.push('余额验证失败')
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  private async validateMarketData(orderData: any): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // 获取当前市场价格
      const marketData = await exchangeService.getMarketData(orderData.symbol)
      
      if (!marketData) {
        errors.push('无法获取市场数据')
        return { valid: false, errors, warnings }
      }

      const currentPrice = marketData.price

      // 价格合理性检查
      if (orderData.price) {
        const price = parseFloat(orderData.price)
        const priceDeviation = Math.abs(price - currentPrice) / currentPrice
        
        if (priceDeviation > 0.1) { // 10% 偏差
          warnings.push(`订单价格与市场价格偏差较大: ${(priceDeviation * 100).toFixed(2)}%`)
        }
        
        if (priceDeviation > 0.3) { // 30% 偏差
          errors.push('订单价格偏离市场价格过大')
        }
      }

      // 市场流动性检查
      if (marketData.volume24h < 10000) {
        warnings.push('交易对流动性较低')
      }

      // 价格波动性检查
      if (marketData.change24h && Math.abs(marketData.change24h) > 20) {
        warnings.push('市场价格波动较大，请谨慎交易')
      }

    } catch (error) {
      warnings.push('无法获取实时市场数据')
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  private async validateOrderTypeSpecific(orderData: any): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    switch (orderData.type) {
      case 'market':
        // 市价单验证
        if (parseFloat(orderData.amount) > 10000) {
          warnings.push('大额市价单可能存在滑点风险')
        }
        break

      case 'limit':
        // 限价单验证
        const marketData = await exchangeService.getMarketData(orderData.symbol)
        if (marketData && orderData.price) {
          const price = parseFloat(orderData.price)
          const currentPrice = marketData.price
          
          if (orderData.side === 'buy' && price > currentPrice * 1.05) {
            warnings.push('买入限价高于当前市场价格5%')
          }
          if (orderData.side === 'sell' && price < currentPrice * 0.95) {
            warnings.push('卖出限价低于当前市场价格5%')
          }
        }
        break

      case 'stop':
        // 止损单验证
        if (orderData.stopPrice && orderData.price) {
          const stopPrice = parseFloat(orderData.stopPrice)
          const price = parseFloat(orderData.price)
          
          if (orderData.side === 'buy' && stopPrice >= price) {
            errors.push('买入止损单的止损价格必须低于触发价格')
          }
          if (orderData.side === 'sell' && stopPrice <= price) {
            errors.push('卖出止损单的止损价格必须高于触发价格')
          }
        }
        break

      case 'stop_limit':
        // 止损限价单验证
        if (orderData.stopPrice && orderData.price) {
          const stopPrice = parseFloat(orderData.stopPrice)
          const price = parseFloat(orderData.price)
          
          if (orderData.side === 'buy' && stopPrice >= price) {
            errors.push('买入止损限价单的止损价格必须低于限价')
          }
          if (orderData.side === 'sell' && stopPrice <= price) {
            errors.push('卖出止损限价单的止损价格必须高于限价')
          }
        }
        break
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  private async validateLiquidity(orderData: any): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      const orderValue = parseFloat(orderData.amount) * (parseFloat(orderData.price) || 0)
      
      // 获取市场深度数据
      const orderBook = await exchangeService.getOrderBook(orderData.symbol)
      
      if (orderBook) {
        const marketDepth = this.calculateMarketDepth(orderBook)
        
        // 检查订单大小相对于市场深度
        const depthRatio = orderValue / marketDepth
        
        if (depthRatio > 0.1) { // 订单大小超过市场深度的10%
          warnings.push('订单大小较大，可能影响市场价格')
        }
        
        if (depthRatio > 0.3) { // 订单大小超过市场深度的30%
          errors.push('订单大小过大，市场流动性不足')
        }
      }

    } catch (error) {
      warnings.push('无法验证市场流动性')
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  private validateTradingTime(orderData: any): {
    valid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    const now = new Date()
    const dayOfWeek = now.getDay()
    const hour = now.getHours()

    // 周末检查
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      warnings.push('当前为周末，市场流动性可能较低')
    }

    // 非交易时间检查
    if (hour < 9 || hour > 16) {
      warnings.push('当前为非交易时间，请注意风险')
    }

    return { valid: true, errors, warnings }
  }

  private calculateMarketDepth(orderBook: any): number {
    // 计算订单簿深度（简化实现）
    const bids = orderBook.bids || []
    const asks = orderBook.asks || []
    
    const bidDepth = bids.reduce((sum: number, bid: any) => sum + parseFloat(bid[0]) * parseFloat(bid[1]), 0)
    const askDepth = asks.reduce((sum: number, ask: any) => sum + parseFloat(ask[0]) * parseFloat(ask[1]), 0)
    
    return (bidDepth + askDepth) / 2
  }

  // 公共方法
  async getRiskRules(): Promise<RiskRule[]> {
    return Array.from(this.rules.values())
  }

  async updateRiskRule(ruleId: string, updates: Partial<RiskRule>): Promise<RiskRule> {
    const existingRule = this.rules.get(ruleId)
    if (!existingRule) {
      throw new Error('Rule not found')
    }

    const updatedRule = await prisma.riskRule.update({
      where: { id: ruleId },
      data: updates
    })

    this.rules.set(ruleId, {
      ...updatedRule,
      parameters: updatedRule.parameters as Record<string, any>
    })

    return this.rules.get(ruleId)!
  }

  async getAccountRiskStatus(accountId: string): Promise<any> {
    const metrics = this.riskMetrics.get(accountId)
    const alerts = this.riskAlerts.get(accountId) || []
    const violations = this.violationHistory.get(accountId) || []

    return {
      accountId,
      metrics,
      alerts: alerts.filter(alert => alert.status === 'active'),
      recentViolations: violations.slice(-10),
      riskLevel: this.calculateOverallRiskLevel(metrics)
    }
  }

  private calculateOverallRiskLevel(metrics?: RiskMetrics): 'low' | 'medium' | 'high' | 'critical' {
    if (!metrics) return 'low'
    
    if (metrics.riskScore > 80) return 'critical'
    if (metrics.riskScore > 60) return 'high'
    if (metrics.riskScore > 40) return 'medium'
    return 'low'
  }

  async getRiskReport(accountId: string, period: 'day' | 'week' | 'month' = 'week'): Promise<any> {
    const startDate = this.getPeriodStartDate(period)
    
    const [assessments, alerts, trades] = await Promise.all([
      prisma.riskAssessment.findMany({
        where: {
          accountId,
          timestamp: { gte: startDate }
        }
      }),
      prisma.riskAlert.findMany({
        where: {
          accountId,
          timestamp: { gte: startDate }
        }
      }),
      prisma.trade.findMany({
        where: {
          accountId,
          timestamp: { gte: startDate }
        }
      })
    ])

    return {
      period,
      startDate,
      totalAssessments: assessments.length,
      failedAssessments: assessments.filter(a => !a.passed).length,
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      totalTrades: trades.length,
      riskTrend: this.calculateRiskTrend(assessments),
      topViolations: this.getTopViolations(assessments)
    }
  }

  private getPeriodStartDate(period: 'day' | 'week' | 'month'): Date {
    const now = new Date()
    switch (period) {
      case 'day':
        now.setHours(0, 0, 0, 0)
        return now
      case 'week':
        now.setDate(now.getDate() - 7)
        return now
      case 'month':
        now.setMonth(now.getMonth() - 1)
        return now
      default:
        return now
    }
  }

  private calculateRiskTrend(assessments: any[]): 'improving' | 'stable' | 'deteriorating' {
    if (assessments.length < 2) return 'stable'
    
    const recent = assessments.slice(-10)
    const earlier = assessments.slice(-20, -10)
    
    const recentRiskScore = recent.reduce((sum, a) => sum + (a.riskLevel === 'critical' ? 4 : a.riskLevel === 'high' ? 3 : a.riskLevel === 'medium' ? 2 : 1), 0) / recent.length
    const earlierRiskScore = earlier.reduce((sum, a) => sum + (a.riskLevel === 'critical' ? 4 : a.riskLevel === 'high' ? 3 : a.riskLevel === 'medium' ? 2 : 1), 0) / earlier.length
    
    if (recentRiskScore < earlierRiskScore * 0.8) return 'improving'
    if (recentRiskScore > earlierRiskScore * 1.2) return 'deteriorating'
    return 'stable'
  }

  private getTopViolations(assessments: any[]): any[] {
    const violationCounts = new Map<string, number>()
    
    assessments.forEach(assessment => {
      assessment.violations.forEach((violation: any) => {
        const key = violation.ruleName
        violationCounts.set(key, (violationCounts.get(key) || 0) + 1)
      })
    })
    
    return Array.from(violationCounts.entries())
      .map(([ruleName, count]) => ({ ruleName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }
}

export const riskManagementService = new RiskManagementService()