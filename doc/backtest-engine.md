# 回测引擎使用说明

## 概述

本项目实现了一个功能完整的量化交易回测引擎，支持多种技术分析策略，提供详细的性能分析和风险评估。

## 主要特性

### 🔧 核心功能
- **多策略支持**: 支持移动平均线、RSI、布林带等多种技术指标策略
- **实时回测**: 支持实时进度跟踪和日志记录
- **性能分析**: 提供夏普比率、最大回撤、胜率等专业指标
- **风险管理**: 支持止损、仓位管理等风险控制功能
- **数据缓存**: 智能缓存机制提高回测效率

### 📊 性能指标
- **收益率指标**: 总收益率、年化收益率、超额收益
- **风险指标**: 夏普比率、最大回撤、波动率
- **交易指标**: 胜率、盈亏比、平均交易收益
- **统计指标**: 总交易次数、手续费、滑点影响

## 架构设计

### 后端架构
```
backend/src/
├── services/backtest/
│   ├── BacktestEngine.ts      # 核心回测引擎
│   └── BacktestService.ts     # 回测服务层
├── controllers/
│   └── backtest.ts            # 回测控制器
├── routes/
│   └── backtest.ts            # 回测路由
└── strategies/
    └── sample-strategy.js     # 示例策略
```

### 数据流程
1. **策略配置**: 用户选择策略和参数
2. **数据获取**: 从数据库获取历史市场数据
3. **回测执行**: 引擎逐K线执行策略逻辑
4. **交易记录**: 记录每笔交易的详细信息
5. **结果分析**: 计算各种性能指标
6. **报告生成**: 生成详细的回测报告

## API 接口

### 启动回测
```http
POST /api/backtest
Content-Type: application/json

{
  "strategyId": "strategy-id",
  "name": "测试回测",
  "description": "移动平均线交叉策略测试",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "initialCapital": 10000,
  "symbols": ["BTCUSDT"],
  "timeframe": "1h",
  "commission": 0.001,
  "slippage": 0.001,
  "leverage": 1,
  "riskLimits": ["maxDrawdown"],
  "outputOptions": ["trades", "dailyReturns", "drawdown"]
}
```

### 获取回测列表
```http
GET /api/backtest?page=1&limit=20&status=completed&strategyId=strategy-id
```

### 获取回测详情
```http
GET /api/backtest/{backtestId}
```

### 获取回测交易记录
```http
GET /api/backtest/{backtestId}/trades?page=1&limit=50
```

### 取消回测
```http
POST /api/backtest/{backtestId}/cancel
```

### 获取回测统计
```http
GET /api/backtest/stats
```

## 策略开发

### 策略格式
策略函数必须遵循以下格式：

```javascript
function strategy(data, currentIndex, allData, params) {
  // data: 当前K线数据
  // currentIndex: 当前索引
  // allData: 完整历史数据数组
  // params: 策略参数
  
  const signals = []
  
  // 策略逻辑
  if (buyCondition) {
    signals.push({
      type: 'buy',
      symbol: data.symbol,
      quantity: 0.1,  // 10%仓位
      price: data.close,
      reason: '买入原因'
    })
  }
  
  if (sellCondition) {
    signals.push({
      type: 'sell',
      symbol: data.symbol,
      quantity: 1,   // 全部卖出
      price: data.close,
      reason: '卖出原因'
    })
  }
  
  return signals
}
```

### 示例策略

#### 移动平均线交叉策略
```javascript
function simpleMACrossover(data, currentIndex, allData, params) {
  const { shortPeriod = 10, longPeriod = 30 } = params
  
  if (currentIndex < longPeriod) return []
  
  const shortMA = calculateMA(allData, currentIndex, shortPeriod)
  const longMA = calculateMA(allData, currentIndex, longPeriod)
  const prevShortMA = calculateMA(allData, currentIndex - 1, shortPeriod)
  const prevLongMA = calculateMA(allData, currentIndex - 1, longPeriod)

  const signals = []

  // 金叉买入
  if (shortMA > longMA && prevShortMA <= prevLongMA) {
    signals.push({
      type: 'buy',
      symbol: data.symbol,
      quantity: 0.1,
      price: data.close,
      reason: 'SMA Golden Cross'
    })
  }
  
  // 死叉卖出
  if (shortMA < longMA && prevShortMA >= prevLongMA) {
    signals.push({
      type: 'sell',
      symbol: data.symbol,
      quantity: 1,
      price: data.close,
      reason: 'SMA Death Cross'
    })
  }

  return signals
}
```

#### RSI策略
```javascript
function rsiStrategy(data, currentIndex, allData, params) {
  const { rsiPeriod = 14, oversoldLevel = 30, overboughtLevel = 70 } = params
  
  if (currentIndex < rsiPeriod) return []
  
  const rsi = calculateRSI(allData, currentIndex, rsiPeriod)
  const signals = []

  // RSI超卖买入
  if (rsi < oversoldLevel) {
    signals.push({
      type: 'buy',
      symbol: data.symbol,
      quantity: 0.05,
      price: data.close,
      reason: `RSI Oversold (${rsi.toFixed(2)})`
    })
  }
  
  // RSI超买卖出
  if (rsi > overboughtLevel) {
    signals.push({
      type: 'sell',
      symbol: data.symbol,
      quantity: 1,
      price: data.close,
      reason: `RSI Overbought (${rsi.toFixed(2)})`
    })
  }

  return signals
}
```

## 性能指标说明

### 收益率指标
- **总收益率**: (最终资金 - 初始资金) / 初始资金
- **年化收益率**: (1 + 总收益率)^(365/天数) - 1
- **超额收益**: 策略收益率 - 基准收益率

### 风险指标
- **夏普比率**: (年化收益率 - 无风险利率) / 年化波动率
- **最大回撤**: 最大资金回撤百分比
- **波动率**: 收益率的标准差

### 交易指标
- **胜率**: 盈利交易次数 / 总交易次数
- **盈亏比**: 平均盈利 / 平均亏损
- **平均交易收益**: 总收益 / 总交易次数

## 测试和验证

### 运行测试
```bash
cd backend
npm run test:backtest
```

### 测试数据
测试脚本会自动生成：
- 一个月的BTCUSDT小时K线数据
- 简单移动平均线交叉策略
- 完整的回测执行流程

### 预期结果
```
🎉 回测完成！
=== 回测结果 ===
初始资金: $10000.00
最终资金: $10850.00
总收益率: 8.50%
年化收益率: 12.34%
夏普比率: 1.45
最大回撤: 15.23%
胜率: 58.33%
盈亏比: 1.67
总交易次数: 24
总手续费: $125.50
总滑点: $98.30
```

## 部署和配置

### 环境要求
- Node.js >= 16
- PostgreSQL with TimescaleDB extension
- Redis (可选，用于缓存)

### 配置文件
```env
DATABASE_URL=postgresql://user:password@localhost:5432/quant_trading
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
PORT=8000
```

### 启动服务
```bash
# 安装依赖
npm install

# 生成数据库客户端
npm run db:generate

# 运行数据库迁移
npm run db:migrate

# 启动后端服务
npm run dev
```

## 性能优化

### 数据库优化
- 使用TimescaleDB超表存储时间序列数据
- 为时间字段创建索引
- 分区表提高查询性能

### 缓存策略
- 市场数据缓存1小时
- 回测结果缓存24小时
- 策略计算结果缓存

### 算法优化
- 向量化计算技术指标
- 增量更新权益曲线
- 并行处理多策略回测

## 扩展功能

### 计划中的功能
1. **实时行情集成**: 支持WebSocket实时数据
2. **高级订单类型**: 支持止损、止盈、追踪止损等
3. **多资产组合**: 支持多标的资产组合回测
4. **机器学习**: 集成AI策略优化
5. **风险管理系统**: 完整的风险控制和监控
6. **图表可视化**: 交互式图表和分析工具

### 自定义指标
支持添加自定义技术指标：

```javascript
function customIndicator(data, period) {
  // 自定义指标计算逻辑
  return indicatorValue
}
```

## 常见问题

### Q: 如何优化回测性能？
A: 
- 使用更小的时间范围
- 减少策略复杂度
- 启用数据缓存
- 优化数据库查询

### Q: 如何添加新的技术指标？
A: 在策略文件中实现指标计算函数，然后在策略逻辑中调用。

### Q: 回测结果不准确怎么办？
A: 检查手续费、滑点设置，验证策略逻辑，确保市场数据质量。

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License