# 开发待办事项 (TODO)

## 📋 项目完成状态概览

### ✅ 已完成功能
- **前端架构**: Vue3 + TypeScript + Element Plus 完整搭建
- **后端架构**: Express + TypeScript + Prisma 完整搭建
- **数据库设计**: PostgreSQL/TimescaleDB 架构设计完成
- **用户认证**: JWT 认证系统完整实现
- **策略管理**: 前后端基础架构完整 (CRUD 操作)
- **UI界面**: Bloomberg 风格界面完整实现
- **响应式设计**: 适配多种设备尺寸
- **基础组件**: 通用组件库完整实现

### 🚧 进行中功能
- **标签页系统**: 策略管理标签页导航已实现
- **事件处理**: 组件间事件传递机制已实现

### ❌ 待完成功能

## 🔥 高优先级 (核心交易功能)

### 1. 后端 API 实现
- **交易 API** (`backend/src/routes/trading.ts`)
  - `GET /trading/accounts` - 获取账户列表
  - `POST /trading/order` - 下单接口
  - `GET /trading/positions` - 获取持仓
  - `POST /trading/close` - 平仓接口

- **回测 API** (`backend/src/routes/backtest.ts`)
  - `POST /backtest/run` - 运行回测
  - `GET /backtest/results/:id` - 获取回测结果
  - `GET /backtest/history` - 获取回测历史

- **数据 API** (`backend/src/routes/data.ts`)
  - `GET /data/market/:symbol` - 获取实时行情
  - `GET /data/historical/:symbol` - 获取历史数据
  - `GET /data/indicators/:symbol` - 获取技术指标

- **监控 API** (`backend/src/routes/monitoring.ts`)
  - `GET /monitoring/metrics` - 获取系统指标
  - `GET /monitoring/alerts` - 获取告警信息

### 2. 实时数据集成
- **WebSocket 连接**: 实现市场数据实时推送
- **数据源集成**: 连接外部数据源 (如 Binance、OKX 等)
- **数据缓存**: Redis 缓存机制实现

### 3. 回测引擎
- **历史数据管理**: 历史数据存储和查询
- **回测算法**: 实现策略回测逻辑
- **性能分析**: 计算收益、夏普比率、最大回撤等指标

## 📊 中优先级 (支持功能)

### 4. 图表组件
- **资产曲线图** (`AssetCurveChart.vue`)
- **性能指标图** (`PerformanceChart.vue`)
- **交易信号图** (`SignalChart.vue`)
- **技术指标图** (`IndicatorChart.vue`)

### 5. 前后端集成
- **策略详情页**: 替换 TODO 注释为真实 API 调用
- **策略列表页**: 连接后端策略 API
- **创建/编辑策略**: 集成代码验证和保存功能
- **交易页面**: 实现真实的交易操作
- **市场数据页面**: 连接实时数据源
- **账户管理**: 实现账户同步和管理

### 6. 数据导出功能
- **策略代码导出**: 支持多种格式
- **回测报告导出**: PDF/Excel 格式
- **交易记录导出**: CSV 格式
- **市场数据导出**: 多种格式支持

## 🎨 低优先级 (UI/UX 改进)

### 7. 实时更新
- **策略状态实时更新**: WebSocket 推送状态变化
- **交易数据实时更新**: 实时显示成交和持仓变化
- **系统指标实时更新**: 监控面板实时数据

### 8. 错误处理优化
- **网络错误处理**: 友好的错误提示
- **数据验证错误**: 详细的错误信息
- **API 错误处理**: 统一的错误处理机制

### 9. 性能优化
- **数据分页**: 大数据量分页加载
- **虚拟滚动**: 长列表性能优化
- **图片懒加载**: 界面加载优化

## 🔧 技术债务

### 10. 代码优化
- **TypeScript 类型完善**: 添加更严格的类型检查
- **单元测试**: 增加测试覆盖率
- **代码规范**: 统一代码风格

### 11. 文档完善
- **API 文档**: 完整的 API 接口文档
- **部署文档**: 详细的部署指南
- **开发文档**: 组件使用说明

## 📝 具体页面待办清单

### 策略管理相关
- [ ] `StrategyDetail.vue` - 集成真实 API (4处 TODO)
- [ ] `StrategyList.vue` - 集成真实 API (2处 TODO)
- [ ] `CreateStrategy.vue` - 集成真实 API (2处 TODO)
- [ ] `EditStrategy.vue` - 集成真实 API (2处 TODO)
- [ ] `StrategyLogs.vue` - 集成真实 API (2处 TODO)
- [ ] `StrategyPerformance.vue` - 集成真实 API (2处 TODO)

### 回测相关
- [ ] `Backtest.vue` - 集成真实 API (2处 TODO)
- [ ] `BacktestResult.vue` - 集成真实 API (2处 TODO)
- [ ] 后端回测引擎实现

### 交易相关
- [ ] `Trading.vue` - 集成真实 API (4处 TODO)
- [ ] 后端交易 API 实现
- [ ] 实时交易数据推送

### 市场数据相关
- [ ] `MarketData.vue` - 集成真实 API (6处 TODO)
- [ ] 后端数据 API 实现
- [ ] 外部数据源集成

### 账户管理相关
- [ ] `Accounts.vue` - 集成真实 API (9处 TODO)
- [ ] 后端账户 API 实现
- [ ] 券商 API 集成

### 监控相关
- [ ] `Monitoring.vue` - 图表组件实现
- [ ] 后端监控 API 实现
- [ ] 系统指标收集

## 🎯 开发建议

### 第一阶段: 核心功能 (1-2周)
1. 实现后端核心 API (交易、回测、数据)
2. 连接前端页面到后端 API
3. 实现基础的实时数据推送

### 第二阶段: 完善功能 (2-3周)
1. 实现图表组件
2. 添加数据导出功能
3. 优化错误处理

### 第三阶段: 优化体验 (1-2周)
1. 性能优化
2. UI/UX 改进
3. 文档完善

## 📊 进度跟踪

- **总体进度**: 约 60% 完成
- **前端进度**: 约 80% 完成
- **后端进度**: 约 40% 完成
- **测试进度**: 约 10% 完成

---

*最后更新: 2025-08-25*