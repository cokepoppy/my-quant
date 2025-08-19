const mongoose = require('mongoose')

const backtestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  strategyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Strategy',
    required: true
  },
  strategyName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  
  // 回测配置
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  initialCapital: {
    type: Number,
    required: true,
    min: 0
  },
  benchmark: {
    type: String,
    default: 'none'
  },
  dataFrequency: {
    type: String,
    required: true,
    enum: ['1m', '5m', '15m', '30m', '1h', '4h', '1d']
  },
  commission: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 0.001
  },
  slippage: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 0.001
  },
  leverage: {
    type: Number,
    required: true,
    min: 1,
    max: 125,
    default: 1
  },
  symbols: [{
    type: String,
    required: true
  }],
  timeframe: {
    type: String,
    required: true,
    enum: ['1m', '5m', '15m', '30m', '1h', '4h', '1d']
  },
  riskLimits: [{
    type: String,
    enum: ['maxDrawdown', 'maxLoss', 'maxPosition']
  }],
  outputOptions: [{
    type: String,
    enum: ['trades', 'positions', 'dailyReturns', 'drawdown']
  }],
  
  // 回测状态
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  progress: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  currentStep: {
    type: String,
    default: '等待中'
  },
  error: {
    type: String,
    default: ''
  },
  
  // 时间信息
  createdAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  duration: {
    type: Number, // 秒
    default: 0
  },
  
  // 回测结果
  results: {
    // 收益指标
    totalReturn: {
      type: Number,
      default: 0
    },
    annualizedReturn: {
      type: Number,
      default: 0
    },
    benchmarkReturn: {
      type: Number,
      default: 0
    },
    excessReturn: {
      type: Number,
      default: 0
    },
    
    // 风险指标
    sharpeRatio: {
      type: Number,
      default: 0
    },
    maxDrawdown: {
      type: Number,
      default: 0
    },
    volatility: {
      type: Number,
      default: 0
    },
    informationRatio: {
      type: Number,
      default: 0
    },
    
    // 交易指标
    totalTrades: {
      type: Number,
      default: 0
    },
    winRate: {
      type: Number,
      default: 0
    },
    profitFactor: {
      type: Number,
      default: 0
    },
    averageTrade: {
      type: Number,
      default: 0
    },
    
    // 统计信息
    totalCommission: {
      type: Number,
      default: 0
    },
    totalSlippage: {
      type: Number,
      default: 0
    },
    
    // 权益曲线数据
    equityCurve: [{
      timestamp: Date,
      value: Number
    }],
    
    // 详细分析
    riskAnalysis: {
      varCoefficient: Number,
      riskAdjustedReturn: Number,
      worstMonth: Number,
      bestMonth: Number,
      recoveryTime: Number
    },
    
    performanceAnalysis: {
      consistency: Number,
      stability: Number,
      efficiency: Number,
      marketConditions: {
        trend: String,
        volatility: String,
        liquidity: String
      }
    },
    
    tradeAnalysis: {
      avgWinningTrade: Number,
      avgLosingTrade: Number,
      largestWin: Number,
      largestLoss: Number,
      consecutiveWins: Number,
      consecutiveLosses: Number
    },
    
    recommendations: [{
      type: {
        type: String,
        enum: ['risk', 'strategy', 'performance']
      },
      message: String
    }]
  },
  
  // 优化信息
  optimization: {
    isOptimized: {
      type: Boolean,
      default: false
    },
    optimizationId: String,
    optimizedParameters: mongoose.Schema.Types.Mixed,
    improvement: {
      type: Number,
      default: 0
    }
  },
  
  // 对比信息
  comparisons: [{
    comparisonId: String,
    backtestIds: [String],
    results: mongoose.Schema.Types.Mixed,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 标签
  tags: [String],
  
  // 共享设置
  isShared: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // 版本控制
  version: {
    type: Number,
    default: 1
  },
  parentBacktest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Backtest'
  },
  childBacktests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Backtest'
  }]
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
backtestSchema.index({ userId: 1, createdAt: -1 })
backtestSchema.index({ strategyId: 1, createdAt: -1 })
backtestSchema.index({ status: 1, createdAt: -1 })
backtestSchema.index({ 'results.totalReturn': -1 })
backtestSchema.index({ 'results.sharpeRatio': -1 })
backtestSchema.index({ tags: 1 })

// 虚拟字段
backtestSchema.virtual('isRunning').get(function() {
  return this.status === 'running'
})

backtestSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed'
})

backtestSchema.virtual('isFailed').get(function() {
  return this.status === 'failed'
})

backtestSchema.virtual('durationFormatted').get(function() {
  if (!this.duration) return '0秒'
  
  const hours = Math.floor(this.duration / 3600)
  const minutes = Math.floor((this.duration % 3600) / 60)
  const seconds = this.duration % 60
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟${seconds}秒`
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds}秒`
  } else {
    return `${seconds}秒`
  }
})

// 中间件
backtestSchema.pre('save', function(next) {
  if (this.isNew) {
    this.version = 1
  } else {
    this.version += 1
  }
  next()
})

// 静态方法
backtestSchema.statics.findByUser = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options

  const query = { userId }
  if (status) {
    query.status = status
  }

  const skip = (page - 1) * limit
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

  return this.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('strategyId', 'name type language')
}

backtestSchema.statics.getStats = function(userId) {
  return this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: { $sum: { $cond: ['$status', 'completed', 1, 0] } },
        running: { $sum: { $cond: ['$status', 'running', 1, 0] } },
        failed: { $sum: { $cond: ['$status', 'failed', 1, 0] } },
        avgReturn: { $avg: '$results.totalReturn' },
        avgSharpe: { $avg: '$results.sharpeRatio' },
        avgDrawdown: { $avg: '$results.maxDrawdown' },
        bestReturn: { $max: '$results.totalReturn' },
        worstReturn: { $min: '$results.totalReturn' }
      }
    }
  ])
}

// 实例方法
backtestSchema.methods.start = function() {
  this.status = 'running'
  this.startedAt = new Date()
  this.currentStep = '开始回测...'
  return this.save()
}

backtestSchema.methods.complete = function(results) {
  this.status = 'completed'
  this.results = results
  this.completedAt = new Date()
  this.duration = Math.floor((new Date().getTime() - this.startedAt.getTime()) / 1000)
  this.currentStep = '回测完成'
  return this.save()
}

backtestSchema.methods.fail = function(error) {
  this.status = 'failed'
  this.error = error.message
  this.completedAt = new Date()
  this.duration = Math.floor((new Date().getTime() - this.startedAt.getTime()) / 1000)
  this.currentStep = '回测失败'
  return this.save()
}

backtestSchema.methods.cancel = function() {
  this.status = 'cancelled'
  this.completedAt = new Date()
  if (this.startedAt) {
    this.duration = Math.floor((new Date().getTime() - this.startedAt.getTime()) / 1000)
  }
  this.currentStep = '回测已取消'
  return this.save()
}

backtestSchema.methods.updateProgress = function(progress, step) {
  this.progress = progress
  this.currentStep = step
  return this.save()
}

backtestSchema.methods.canBeModified = function() {
  return ['pending', 'failed', 'cancelled'].includes(this.status)
}

backtestSchema.methods.canBeCancelled = function() {
  return this.status === 'running'
}

backtestSchema.methods.canBeDeleted = function() {
  return !this.isShared || this.sharedWith.length === 0
}

backtestSchema.methods.shareWith = function(userId) {
  if (!this.sharedWith.includes(userId)) {
    this.sharedWith.push(userId)
    this.isShared = true
    return this.save()
  }
  return Promise.resolve(this)
}

backtestSchema.methods.unshareWith = function(userId) {
  this.sharedWith = this.sharedWith.filter(id => id.toString() !== userId.toString())
  if (this.sharedWith.length === 0) {
    this.isShared = false
  }
  return this.save()
}

backtestSchema.methods.clone = function(newUserId) {
  const cloned = this.toObject()
  delete cloned._id
  delete cloned.createdAt
  delete cloned.updatedAt
  delete completedAt
  delete startedAt
  delete duration
  
  cloned.userId = newUserId
  cloned.status = 'pending'
  cloned.progress = 0
  cloned.currentStep = '等待中'
  cloned.error = ''
  cloned.results = undefined
  cloned.optimization = undefined
  cloned.comparisons = []
  cloned.version = 1
  cloned.parentBacktest = this._id
  
  return new Backtest(cloned)
}

module.exports = mongoose.model('Backtest', backtestSchema)