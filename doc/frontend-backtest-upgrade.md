# 前端回测系统升级指南

## 📋 升级概要

为了配合新的后端回测引擎，前端需要进行以下修改：

### ✅ **已完成修改**

1. **API接口更新** (`frontend/src/api/backtest.ts`)
2. **类型定义更新** (`frontend/src/types/backtest.ts`)
3. **新增测试组件** (`frontend/src/views/backtest/NewBacktestTest.vue`)
4. **路由配置更新** (`frontend/src/router/index.ts`)

### 🔧 **需要修改的文件**

#### 1. **API接口修改**
```typescript
// 文件: frontend/src/api/backtest.ts

// 主要修改点：
- POST /backtest/run → POST /backtest
- GET /backtest/history → GET /backtest  
- GET /backtest/${id}/results → GET /backtest/${id}
- POST /backtest/${id}/delete → POST /backtest/${id}/cancel

// 新增接口：
- GET /backtest/stats
- GET /backtest/${id}/trades
- GET /backtest/templates
```

#### 2. **类型定义修改**
```typescript
// 文件: frontend/src/types/backtest.ts

// BacktestConfig 接口变化：
interface BacktestConfig {
  symbols: string[]        // 从单个symbol改为数组
  riskLimits?: string[]   // 新增风险限制
  outputOptions?: string[] // 新增输出选项
  // 移除一些旧字段...
}
```

#### 3. **组件兼容性**

##### **现有组件需要修改**
- `BacktestSettings.vue` - 配置表单需要适配新的数据结构
- `Backtest.vue` - 主页面需要适配新的API响应格式
- `BacktestResult.vue` - 结果页面需要适配新的数据结构

##### **建议的修改方案**
1. **渐进式升级** - 保留原有功能，同时添加新功能支持
2. **版本兼容** - 检测后端版本，自动选择合适的API
3. **平滑过渡** - 提供数据转换层，确保现有功能正常工作

## 🚀 **使用新回测系统**

### 1. **访问测试页面**
```
http://localhost:3000/backtest/new
```

### 2. **配置回测参数**
- 选择策略
- 设置交易标的（支持多标的）
- 配置时间框架
- 设置初始资金和手续费等参数

### 3. **启动回测**
- 点击"启动新回测"按钮
- 实时查看进度和日志
- 回测完成后查看详细结果

## 📊 **新功能特性**

### 1. **多标的支持**
- 可以同时回测多个交易标的
- 支持组合策略回测

### 2. **实时进度跟踪**
- 显示回测进度百分比
- 实时更新当前执行步骤
- 支持日志查看

### 3. **详细性能分析**
- 专业的性能指标计算
- 详细的交易记录
- 权益曲线可视化

### 4. **风险控制**
- 支持风险限制设置
- 实时风险监控
- 止损止盈功能

## 🔍 **兼容性处理**

### **数据转换层**
```typescript
// 建议创建数据转换函数
function convertOldBacktestConfig(oldConfig) {
  return {
    ...oldConfig,
    symbols: oldConfig.symbol ? [oldConfig.symbol] : ['BTCUSDT'],
    riskLimits: oldConfig.riskManagement ? ['maxDrawdown'] : [],
    outputOptions: ['trades', 'dailyReturns']
  }
}

function convertNewBacktestResult(newResult) {
  return {
    ...newResult,
    // 转换数据格式以兼容现有组件
    metrics: newResult.results,
    trades: newResult.trades
  }
}
```

### **API版本检测**
```typescript
// 检测后端版本
async function getBackendVersion() {
  try {
    const response = await get('/system/version')
    return response.data.version
  } catch {
    return '1.0.0' // 默认旧版本
  }
}

// 根据版本选择API
async function startBacktest(config) {
  const version = await getBackendVersion()
  
  if (version >= '2.0.0') {
    return await post('/backtest', config)
  } else {
    return await post('/backtest/run', convertOldBacktestConfig(config))
  }
}
```

## 🛠️ **建议的升级步骤**

### **第一阶段：测试验证**
1. 部署新的后端回测引擎
2. 使用测试页面验证功能
3. 确保所有新功能正常工作

### **第二阶段：渐进升级**
1. 修改现有组件，添加新功能支持
2. 保持向后兼容性
3. 提供用户选择使用新旧系统

### **第三阶段：完全迁移**
1. 移除旧功能支持
2. 全面使用新回测系统
3. 优化用户体验

## 📝 **注意事项**

### **数据迁移**
- 现有的回测记录可能需要格式转换
- 新旧系统的数据结构有所不同
- 建议保留历史数据备份

### **用户体验**
- 提供清晰的功能说明
- 标注新功能和改进点
- 确保用户能够平滑过渡

### **性能优化**
- 新系统可能会有不同的性能表现
- 需要关注大数据量下的表现
- 优化前端渲染性能

## 🎯 **总结**

前端升级相对简单，主要集中在：
1. **API接口适配**
2. **数据格式转换**  
3. **新增功能集成**

通过渐进式升级，可以确保现有功能不受影响，同时逐步引入新的强大功能。建议先在测试环境验证，确保一切正常后再在生产环境部署。