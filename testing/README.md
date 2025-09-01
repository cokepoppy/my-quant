# 量化交易系统

基于Vue3 + Express构建的现代化量化交易平台，集成数据获取、策略开发、回测分析、实时监控等核心功能。

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 7.0
- Docker & Docker Compose (可选)

### 安装依赖
```bash
# 安装所有依赖
npm run install:all
```

### 开发环境启动
```bash
# 同时启动前端和后端
npm run dev

# 或者分别启动
npm run dev:frontend  # 前端 http://localhost:3000
npm run dev:backend   # 后端 http://localhost:8000
```

### Docker部署
```bash
# 构建并启动所有服务
npm run docker:up

# 查看日志
npm run docker:logs

# 停止服务
npm run docker:down
```

## 📋 功能特性

### 🔧 核心模块
- **数据管理**: 多数据源集成，实时行情数据获取
- **策略开发**: 在线策略编辑器，支持多种策略类型
- **回测引擎**: 历史数据回测，性能分析报告
- **实盘交易**: 连接券商API，自动交易执行
- **监控告警**: 实时监控，多渠道告警通知

### 🎯 技术特色
- **现代化技术栈**: Vue3 + TypeScript + Express
- **响应式设计**: 适配多种设备
- **实时数据推送**: WebSocket实时数据
- **高性能**: 异步处理，缓存优化
- **容器化部署**: Docker一键部署

## 🖼️ 界面展示

### 首页仪表板
![首页](images/readme/首页.png)

### 策略管理
![策略列表](images/readme/策略列表.png)
![策略详情](images/readme/策略详情.png)

### 交易功能
![交易面板](images/readme/交易面板.png)
![订单管理](images/readme/订单管理.png)
![持仓管理](images/readme/持仓管理.png)
![账户管理](images/readme/账户管理.png)

### 数据与分析
![市场数据](images/readme/市场数据.png)
![数据导入](images/readme/数据导入.png)

### 回测系统
![回测设置](images/readme/回测设置.png)
![回测结果](images/readme/回测结果.png)

### 参数优化
![参数优化](images/readme/参数优化.png)

### 系统管理
![用户管理](images/readme/用户管理.png)

## 📁 项目结构

```
quant-trading-system/
├── doc/                    # 文档目录
│   ├── 需求.md            # 需求文档
│   └── 架构设计.md        # 架构设计
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── views/         # 页面
│   │   ├── stores/        # 状态管理
│   │   └── api/           # API接口
│   └── package.json
├── backend/                # 后端应用
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── services/      # 业务逻辑
│   │   ├── models/        # 数据模型
│   │   └── routes/        # 路由
│   └── package.json
├── images/                 # 图片资源
│   └── readme/           # README图片
├── docker/                 # Docker配置
├── docker-compose.yml      # 容器编排
└── package.json           # 根目录配置
```

## 🔧 配置说明

### 环境变量
```bash
# 后端配置
DATABASE_URL=postgresql://user:password@localhost:5432/quant_trading
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
PORT=8000

# 前端配置
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

### 数据库配置
```bash
# 生成Prisma客户端
cd backend && npm run db:generate

# 运行数据库迁移
cd backend && npm run db:migrate

# 打开数据库管理界面
cd backend && npm run db:studio
```

## 📊 API文档

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/profile` - 获取用户信息

### 策略管理
- `GET /api/strategies` - 获取策略列表
- `POST /api/strategies` - 创建策略
- `PUT /api/strategies/:id` - 更新策略
- `DELETE /api/strategies/:id` - 删除策略

### 数据接口
- `GET /api/data/market/:symbol` - 获取实时行情
- `GET /api/data/history/:symbol` - 获取历史数据
- `GET /api/data/indicators/:symbol` - 获取技术指标

### 回测接口
- `POST /api/backtest/run` - 运行回测
- `GET /api/backtest/results/:id` - 获取回测结果

### 系统管理
- `GET /api/system/logs` - 获取系统日志
- `GET /api/users` - 用户管理 (管理员)
- `GET /api/monitoring` - 系统监控

## 🚀 部署指南

### 生产环境部署
1. 配置环境变量
2. 构建应用: `npm run build`
3. 启动服务: `npm run docker:up`

### 监控配置
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin123)

## 🤝 开发指南

### 代码规范
- 使用TypeScript编写类型安全的代码
- 遵循ESLint和Prettier规范
- 编写单元测试和集成测试

### 提交规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式化
- refactor: 代码重构
- test: 测试相关
- chore: 构建工具或辅助工具的变动

## 🛠️ 开发命令

### 根目录命令
```bash
npm run install:all        # 安装所有依赖
npm run dev                # 同时启动前端和后端
npm run build              # 构建所有应用
npm run test               # 运行测试
npm run docker:up          # 启动所有服务
npm run docker:down        # 停止所有服务
npm run docker:logs        # 查看服务日志
```

### 后端命令
```bash
cd backend
npm run dev                # 启动后端开发服务器
npm run build              # 构建后端应用
npm run test               # 运行后端测试
npm run db:generate        # 生成Prisma客户端
npm run db:migrate         # 运行数据库迁移
npm run db:push            # 推送schema更改
npm run db:studio          # 打开数据库管理界面
npm run lint               # ESLint检查和修复
npm run format             # Prettier格式化
```

### 前端命令
```bash
cd frontend
npm run dev                # 启动前端开发服务器
npm run build              # 构建前端应用
npm run preview            # 预览生产构建
npm run test               # 运行前端测试
npm run lint               # ESLint检查和修复
npm run format             # Prettier格式化
```

## 📝 许可证

MIT License

## 🙋‍♂️ 支持

如有问题请提交Issue或联系开发团队。

---

**系统特点**: 本系统采用微服务架构，支持高并发处理，具备完善的权限管理和数据安全保障。适合个人投资者和小型机构使用。