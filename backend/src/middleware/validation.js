const { body, validationResult } = require('express-validator')
const { ValidationError } = require('../utils/errors')

// 回测配置验证规则
const validateBacktestConfig = [
  // 基本验证
  body('strategyId')
    .notEmpty()
    .withMessage('策略ID不能为空')
    .isMongoId()
    .withMessage('策略ID格式不正确'),
  
  body('startDate')
    .notEmpty()
    .withMessage('开始日期不能为空')
    .isISO8601()
    .withMessage('开始日期格式不正确'),
  
  body('endDate')
    .notEmpty()
    .withMessage('结束日期不能为空')
    .isISO8601()
    .withMessage('结束日期格式不正确')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('结束日期必须晚于开始日期')
      }
      return true
    }),
  
  body('initialCapital')
    .notEmpty()
    .withMessage('初始资金不能为空')
    .isFloat({ min: 100 })
    .withMessage('初始资金必须大于等于100'),
  
  body('benchmark')
    .optional()
    .isIn(['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'none'])
    .withMessage('基准选择不正确'),
  
  body('dataFrequency')
    .notEmpty()
    .withMessage('数据频率不能为空')
    .isIn(['1m', '5m', '15m', '30m', '1h', '4h', '1d'])
    .withMessage('数据频率选择不正确'),
  
  // 费用和滑点验证
  body('commission')
    .notEmpty()
    .withMessage('手续费率不能为空')
    .isFloat({ min: 0, max: 1 })
    .withMessage('手续费率必须在0-1之间'),
  
  body('slippage')
    .notEmpty()
    .withMessage('滑点不能为空')
    .isFloat({ min: 0, max: 1 })
    .withMessage('滑点必须在0-1之间'),
  
  body('leverage')
    .notEmpty()
    .withMessage('杠杆倍数不能为空')
    .isInt({ min: 1, max: 125 })
    .withMessage('杠杆倍数必须在1-125之间'),
  
  // 交易标的验证
  body('symbols')
    .notEmpty()
    .withMessage('交易标的不能为空')
    .isArray({ min: 1 })
    .withMessage('至少需要一个交易标的')
    .custom((symbols) => {
      const validSymbols = /^([A-Z]{2,10}\/[A-Z]{3,10})$/
      for (const symbol of symbols) {
        if (!validSymbols.test(symbol)) {
          throw new Error('交易标的格式不正确，例如：BTC/USDT')
        }
      }
      return true
    }),
  
  body('timeframe')
    .notEmpty()
    .withMessage('时间周期不能为空')
    .isIn(['1m', '5m', '15m', '30m', '1h', '4h', '1d'])
    .withMessage('时间周期选择不正确'),
  
  // 风险限制验证
  body('riskLimits')
    .optional()
    .isArray()
    .withMessage('风险限制必须是数组')
    .custom((limits) => {
      const validLimits = ['maxDrawdown', 'maxLoss', 'maxPosition']
      for (const limit of limits) {
        if (!validLimits.includes(limit)) {
          throw new Error('风险限制选择不正确')
        }
      }
      return true
    }),
  
  // 输出选项验证
  body('outputOptions')
    .optional()
    .isArray()
    .withMessage('输出选项必须是数组')
    .custom((options) => {
      const validOptions = ['trades', 'positions', 'dailyReturns', 'drawdown']
      for (const option of options) {
        if (!validOptions.includes(option)) {
          throw new Error('输出选项选择不正确')
        }
      }
      return true
    }),
  
  // 中间件：处理验证结果
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }))
      
      throw new ValidationError('参数验证失败', errorMessages)
    }
    
    // 额外的业务逻辑验证
    const { startDate, endDate } = req.body
    const start = new Date(startDate)
    const end = new Date(endDate)
    const now = new Date()
    
    // 检查日期范围是否合理
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    if (daysDiff < 1) {
      return res.status(400).json({
        success: false,
        message: '回测期间至少需要1天'
      })
    }
    
    if (daysDiff > 365 * 5) {
      return res.status(400).json({
        success: false,
        message: '回测期间不能超过5年'
      })
    }
    
    // 检查结束日期是否在未来
    if (end > now) {
      return res.status(400).json({
        success: false,
        message: '结束日期不能在未来'
      })
    }
    
    // 检查杠杆倍数与风险限制的匹配性
    const { leverage, riskLimits } = req.body
    if (leverage > 10 && !riskLimits.includes('maxPosition')) {
      return res.status(400).json({
        success: false,
        message: '高杠杆交易必须设置最大持仓限制'
      })
    }
    
    // 检查数据频率与回测期间的匹配性
    const { dataFrequency } = req.body
    const frequencyToMinutes = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '30m': 30,
      '1h': 60,
      '4h': 240,
      '1d': 1440
    }
    
    const minutesPerDataPoint = frequencyToMinutes[dataFrequency]
    const totalDataPoints = daysDiff * 24 * 60 / minutesPerDataPoint
    
    if (totalDataPoints > 1000000) {
      return res.status(400).json({
        success: false,
        message: '数据点过多，请调整回测期间或数据频率'
      })
    }
    
    next()
  }
]

// 参数优化验证规则
const validateOptimizationParams = [
  body('parameters')
    .notEmpty()
    .withMessage('优化参数不能为空')
    .isArray()
    .withMessage('优化参数必须是数组')
    .custom((parameters) => {
      for (const param of parameters) {
        if (!param.name || !param.min || !param.max || !param.step) {
          throw new Error('每个参数必须包含name、min、max、step字段')
        }
        if (param.min >= param.max) {
          throw new Error(`参数${param.name}的最小值必须小于最大值`)
        }
        if (param.step <= 0) {
          throw new Error(`参数${param.name}的步长必须大于0`)
        }
      }
      return true
    }),
  
  body('generations')
    .optional()
    .isInt({ min: 10, max: 200 })
    .withMessage('迭代次数必须在10-200之间'),
  
  body('populationSize')
    .optional()
    .isInt({ min: 10, max: 100 })
    .withMessage('种群大小必须在10-100之间'),
  
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }))
      
      throw new ValidationError('参数验证失败', errorMessages)
    }
    next()
  }
]

// 回测对比验证规则
const validateComparisonParams = [
  body('backtestIds')
    .notEmpty()
    .withMessage('回测ID列表不能为空')
    .isArray({ min: 2, max: 10 })
    .withMessage('至少需要2个，最多10个回测ID进行对比')
    .custom((backtestIds) => {
      for (const id of backtestIds) {
        if (!/^[0-9a-fA-F]{24}$/.test(id)) {
          throw new Error('回测ID格式不正确')
        }
      }
      return true
    }),
  
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }))
      
      throw new ValidationError('参数验证失败', errorMessages)
    }
    next()
  }
]

// 导出验证规则
const validateExportParams = [
  body('format')
    .optional()
    .isIn(['pdf', 'csv', 'json'])
    .withMessage('导出格式必须是pdf、csv或json'),
  
  body('includeCharts')
    .optional()
    .isBoolean()
    .withMessage('includeCharts必须是布尔值'),
  
  body('includeTrades')
    .optional()
    .isBoolean()
    .withMessage('includeTrades必须是布尔值'),
  
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }))
      
      throw new ValidationError('参数验证失败', errorMessages)
    }
    next()
  }
]

module.exports = {
  validateBacktestConfig,
  validateOptimizationParams,
  validateComparisonParams,
  validateExportParams
}