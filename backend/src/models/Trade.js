const mongoose = require('mongoose')

const tradeSchema = new mongoose.Schema({
  // 关联信息
  backtestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Backtest',
    required: true
  },
  strategyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Strategy',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 交易基本信息
  timestamp: {
    type: Date,
    required: true
  },
  symbol: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['buy', 'sell'],
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // 费用和滑点
  fee: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  slippage: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  // 盈亏信息
  pnl: {
    type: Number,
    required: true,
    default: 0
  },
  pnlPercent: {
    type: Number,
    required: true,
    default: 0
  },
  
  // 账户状态
  balance: {
    type: Number,
    required: true
  },
  position: {
    type: Number,
    required: true,
    default: 0
  },
  
  // 交易详情
  orderType: {
    type: String,
    enum: ['market', 'limit', 'stop', 'stop_limit'],
    default: 'market'
  },
  orderId: {
    type: String,
    default: ''
  },
  tradeId: {
    type: String,
    default: ''
  },
  
  // 策略信号
  signal: {
    type: String,
    enum: ['entry_long', 'entry_short', 'exit_long', 'exit_short', 'stop_loss', 'take_profit', 'trailing_stop'],
    default: ''
  },
  signalStrength: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  
  // 风险管理
  stopLoss: {
    type: Number,
    min: 0
  },
  takeProfit: {
    type: Number,
    min: 0
  },
  trailingStop: {
    type: Number,
    min: 0
  },
  
  // 市场条件
  marketConditions: {
    trend: {
      type: String,
      enum: ['bullish', 'bearish', 'sideways'],
      default: 'sideways'
    },
    volatility: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    liquidity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    volume: {
      type: Number,
      min: 0,
      default: 0
    },
    spread: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  
  // 技术指标
  indicators: {
    sma: Number,
    ema: Number,
    rsi: Number,
    macd: {
      macd: Number,
      signal: Number,
      histogram: Number
    },
    bollinger: {
      upper: Number,
      middle: Number,
      lower: Number
    },
    atr: Number,
    volume_sma: Number
  },
  
  // 交易评估
  evaluation: {
    isWinning: {
      type: Boolean,
      default: false
    },
    holdingPeriod: {
      type: Number, // 分钟
      default: 0
    },
    riskRewardRatio: {
      type: Number,
      default: 0
    },
    maxFavorableExcursion: {
      type: Number,
      default: 0
    },
    maxAdverseExcursion: {
      type: Number,
      default: 0
    },
    efficiency: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    }
  },
  
  // 标签和分类
  tags: [String],
  category: {
    type: String,
    enum: ['trend_following', 'mean_reversion', 'breakout', 'arbitrage', 'other'],
    default: 'other'
  },
  
  // 备注
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.__v
      return ret
    }
  }
})

// 索引
tradeSchema.index({ backtestId: 1, timestamp: 1 })
tradeSchema.index({ userId: 1, timestamp: -1 })
tradeSchema.index({ symbol: 1, timestamp: -1 })
tradeSchema.index({ type: 1, timestamp: -1 })
tradeSchema.index({ 'evaluation.isWinning': 1 })
tradeSchema.index({ tags: 1 })
tradeSchema.index({ category: 1 })

// 复合索引
tradeSchema.index({ backtestId: 1, symbol: 1, timestamp: 1 })
tradeSchema.index({ userId: 1, symbol: 1, timestamp: -1 })

// 虚拟字段
tradeSchema.virtual('isBuy').get(function() {
  return this.type === 'buy'
})

tradeSchema.virtual('isSell').get(function() {
  return this.type === 'sell'
})

tradeSchema.virtual('isWinning').get(function() {
  return this.pnl > 0
})

tradeSchema.virtual('isLosing').get(function() {
  return this.pnl < 0
})

tradeSchema.virtual('totalCost').get(function() {
  return this.amount + this.fee + this.slippage
})

tradeSchema.virtual('netAmount').get(function() {
  return this.amount - this.fee - this.slippage
})

tradeSchema.virtual('holdingPeriodFormatted').get(function() {
  if (!this.evaluation.holdingPeriod) return '0分钟'
  
  const hours = Math.floor(this.evaluation.holdingPeriod / 60)
  const minutes = this.evaluation.holdingPeriod % 60
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  } else {
    return `${minutes}分钟`
  }
})

// 中间件
tradeSchema.pre('save', function(next) {
  // 自动计算一些字段
  if (this.pnl > 0) {
    this.evaluation.isWinning = true
  } else {
    this.evaluation.isWinning = false
  }
  
  // 计算风险回报比
  if (this.stopLoss && this.takeProfit) {
    const risk = Math.abs(this.price - this.stopLoss)
    const reward = Math.abs(this.takeProfit - this.price)
    this.evaluation.riskRewardRatio = risk > 0 ? reward / risk : 0
  }
  
  next()
})

// 静态方法
tradeSchema.statics.findByBacktest = function(backtestId, options = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'timestamp',
    sortOrder = 'asc',
    type,
    symbol
  } = options

  const query = { backtestId }
  if (type) {
    query.type = type
  }
  if (symbol) {
    query.symbol = symbol
  }

  const skip = (page - 1) * limit
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

  return this.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
}

tradeSchema.statics.findByUser = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    startDate,
    endDate,
    symbol,
    type
  } = options

  const query = { userId }
  
  if (startDate || endDate) {
    query.timestamp = {}
    if (startDate) query.timestamp.$gte = new Date(startDate)
    if (endDate) query.timestamp.$lte = new Date(endDate)
  }
  
  if (symbol) {
    query.symbol = symbol
  }
  
  if (type) {
    query.type = type
  }

  const skip = (page - 1) * limit

  return this.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
}

tradeSchema.statics.getTradeStats = function(backtestId) {
  return this.aggregate([
    { $match: { backtestId } },
    {
      $group: {
        _id: null,
        totalTrades: { $sum: 1 },
        totalVolume: { $sum: '$quantity' },
        totalAmount: { $sum: '$amount' },
        totalFees: { $sum: '$fee' },
        totalSlippage: { $sum: '$slippage' },
        totalPnL: { $sum: '$pnl' },
        winningTrades: {
          $sum: { $cond: ['$pnl', 1, 0] }
        },
        losingTrades: {
          $sum: { $cond: ['$pnl', 0, 1] }
        },
        avgTradeSize: { $avg: '$amount' },
        avgFee: { $avg: '$fee' },
        avgSlippage: { $avg: '$slippage' },
        avgPnL: { $avg: '$pnl' },
        maxWin: { $max: '$pnl' },
        maxLoss: { $min: '$pnl' },
        buyTrades: {
          $sum: { $cond: [{ $eq: ['$type', 'buy'] }, 1, 0] }
        },
        sellTrades: {
          $sum: { $cond: [{ $eq: ['$type', 'sell'] }, 1, 0] }
        }
      }
    }
  ])
}

tradeSchema.statics.getSymbolStats = function(backtestId) {
  return this.aggregate([
    { $match: { backtestId } },
    {
      $group: {
        _id: '$symbol',
        totalTrades: { $sum: 1 },
        totalVolume: { $sum: '$quantity' },
        totalAmount: { $sum: '$amount' },
        totalPnL: { $sum: '$pnl' },
        avgPrice: { $avg: '$price' },
        avgPnL: { $avg: '$pnl' },
        winRate: {
          $avg: { $cond: ['$pnl', 1, 0] }
        }
      }
    }
  ])
}

tradeSchema.statics.getDailyStats = function(backtestId) {
  return this.aggregate([
    { $match: { backtestId } },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        },
        totalTrades: { $sum: 1 },
        totalVolume: { $sum: '$quantity' },
        totalAmount: { $sum: '$amount' },
        totalPnL: { $sum: '$pnl' },
        avgPrice: { $avg: '$price' },
        fees: { $sum: '$fee' },
        slippage: { $sum: '$slippage' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ])
}

// 实例方法
tradeSchema.methods.getHoldingPeriod = function() {
  if (!this.evaluation.holdingPeriod) {
    // 计算持仓时间（需要找到对应的平仓交易）
    return 0
  }
  return this.evaluation.holdingPeriod
}

tradeSchema.methods.getEfficiency = function() {
  if (!this.evaluation.efficiency) {
    // 计算交易效率
    return 0
  }
  return this.evaluation.efficiency
}

tradeSchema.methods.getRiskAdjustedReturn = function() {
  if (this.evaluation.riskRewardRatio && this.evaluation.isWinning) {
    return this.pnl / Math.abs(this.price - this.stopLoss)
  }
  return 0
}

tradeSchema.methods.getMaxFavorableExcursion = function() {
  if (!this.evaluation.maxFavorableExcursion) {
    // 计算最大有利偏移
    return 0
  }
  return this.evaluation.maxFavorableExcursion
}

tradeSchema.methods.getMaxAdverseExcursion = function() {
  if (!this.evaluation.maxAdverseExcursion) {
    // 计算最大不利偏移
    return 0
  }
  return this.evaluation.maxAdverseExcursion
}

tradeSchema.methods.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag)
    return this.save()
  }
  return Promise.resolve(this)
}

tradeSchema.methods.removeTag = function(tag) {
  this.tags = this.tags.filter(t => t !== tag)
  return this.save()
}

tradeSchema.methods.addNote = function(note) {
  this.notes = note
  return this.save()
}

tradeSchema.methods.toCSV = function() {
  return [
    this.timestamp,
    this.symbol,
    this.type,
    this.price,
    this.quantity,
    this.amount,
    this.fee,
    this.slippage,
    this.pnl,
    this.pnlPercent,
    this.balance,
    this.position,
    this.orderType,
    this.signal,
    this.category,
    this.notes
  ]
}

module.exports = mongoose.model('Trade', tradeSchema)