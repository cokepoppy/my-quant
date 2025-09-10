# 量化交易系统

基于Vue3 + Express构建的现代化量化交易平台，集成数据获取、策略开发、回测分析、实时监控等核心功能。

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 7.0
- Docker & Docker Compose (可选)

### 1. 克隆项目
```bash
git clone <repository-url>
cd my-quant
```

### 2. 环境变量配置
```bash
# 复制环境变量模板文件
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 根据需要修改环境变量（可选，默认配置可以正常运行）
nano .env
nano backend/.env
nano frontend/.env
```

### 3. 安装依赖
```bash
# 一键安装所有依赖（推荐）
npm run install:all

# 或分别安装
npm install              # 根目录依赖
cd backend && npm install # 后端依赖
cd ../frontend && npm install # 前端依赖
```

### 4. 数据库初始化
```bash
# 初始化数据库
cd backend
npm run db:generate      # 生成Prisma客户端
npm run db:migrate       # 运行数据库迁移
npm run db:seed          # 填充初始数据（如果存在）
```

### 5. 启动服务

#### 方式一：同时启动前后端（推荐）
```bash
# 回到根目录
cd ..
npm run dev              # 前端: http://localhost:3000, 后端: http://localhost:8000
```

#### 方式二：分别启动
```bash
# 启动后端
npm run dev:backend     # 后端: http://localhost:8000

# 启动前端（新终端）
npm run dev:frontend    # 前端: http://localhost:3000
```

### 6. 验证安装
1. 打开浏览器访问: http://localhost:3000
2. 检查后端API: http://localhost:8000/health
3. 查看日志确认服务正常运行

### 7. Docker 部署（可选）
```bash
# 使用Docker一键部署
npm run docker:up

# 查看服务状态
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

### 环境变量配置

项目已经提供了完整的环境变量模板文件，用户只需要复制并根据需要修改：

#### 根目录配置 (.env)
```bash
# 主要用于Docker部署和全局配置
POSTGRES_PASSWORD=quant123        # PostgreSQL密码
REDIS_PASSWORD=redis123          # Redis密码
JWT_SECRET=your-jwt-secret       # JWT密钥（生产环境请修改）
NODE_ENV=development             # 运行环境
PORT=8000                        # 后端端口
```

#### 后端配置 (backend/.env)
```bash
# 数据库连接
DATABASE_URL=postgresql://quant:quant123@localhost:5432/quant_trading

# Redis连接
REDIS_URL=redis://localhost:6379

# JWT配置
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# 服务器配置
PORT=8000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Bybit API配置（测试网）
BYBIT_API_BASE_URL=https://api-testnet.bybit.com
BYBIT_API_KEY=<YOUR_API_KEY>
BYBIT_API_SECRET=<YOUR_API_SECRET>
BYBIT_TESTNET=true
```

#### 前端配置 (frontend/.env)
```bash
# API配置
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=http://localhost:8000/socket.io

# 生产环境配置示例
# VITE_API_URL=https://your-domain.com/api
# VITE_WS_URL=https://your-domain.com/socket.io
```

### 数据库配置

```bash
# 进入后端目录
cd backend

# 生成Prisma客户端
npm run db:generate

# 运行数据库迁移
npm run db:migrate

# 查看数据库管理界面
npm run db:studio

# 推送schema更改（开发时）
npm run db:push
```

### 服务依赖

确保以下服务在启动前已经运行：

#### PostgreSQL
```bash
# 使用Docker启动PostgreSQL
docker run -d --name postgres \
  -e POSTGRES_USER=quant \
  -e POSTGRES_PASSWORD=quant123 \
  -e POSTGRES_DB=quant_trading \
  -p 5432:5432 \
  postgres:14

# 或使用系统安装的PostgreSQL
sudo systemctl start postgresql
```

#### Redis
```bash
# 使用Docker启动Redis
docker run -d --name redis \
  -p 6379:6379 \
  redis:7-alpine

# 或使用系统安装的Redis
sudo systemctl start redis
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

## 🛠️ 故障排除

### 常见问题

#### 1. 依赖安装失败
```bash
# 清除缓存重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm run install:all
```

#### 2. 数据库连接失败
```bash
# 检查PostgreSQL服务状态
sudo systemctl status postgresql

# 检查端口占用
netstat -tuln | grep 5432

# 测试数据库连接
cd backend && npm run test:connection
```

#### 3. Redis连接失败
```bash
# 检查Redis服务状态
sudo systemctl status redis

# 测试Redis连接
redis-cli ping
```

#### 4. 端口占用问题
```bash
# 查看端口占用
netstat -tuln | grep :3000
netstat -tuln | grep :8000

# 修改端口（在.env文件中）
PORT=8001          # 后端端口
CORS_ORIGIN=http://localhost:3001  # 前端端口
```

#### 5. 权限问题
```bash
# 给予脚本执行权限
chmod +x deploy.sh
chmod +x docker-compose.yml

# 修复文件权限
sudo chown -R $USER:$USER /path/to/project
```

### 日志查看

#### 后端日志
```bash
# 查看后端运行日志
npm run dev:backend

# 或查看应用日志
tail -f logs/app.log
```

#### 前端日志
```bash
# 查看前端构建日志
npm run dev:frontend

# 查看浏览器控制台
# 按 F12 打开开发者工具
```

### 性能优化

#### 开发环境优化
```bash
# 使用软链接加快构建
ln -s /path/to/node_modules ./node_modules

# 增加内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
```

#### 生产环境优化
```bash
# 构建优化版本
npm run build:optimized

# 使用PM2管理进程
npm run pm2:start
```

## 🙋‍♂️ 支持

### 获取帮助
- 📧 **邮箱**: support@example.com
- 🐛 **问题反馈**: [GitHub Issues](https://github.com/your-repo/issues)
- 📖 **文档**: [Wiki](https://github.com/your-repo/wiki)
- 💬 **讨论**: [GitHub Discussions](https://github.com/your-repo/discussions)

### 贡献指南
1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

---

**系统特点**: 本系统采用微服务架构，支持高并发处理，具备完善的权限管理和数据安全保障。适合个人投资者和小型机构使用。

**快速开始**: 按照上面的步骤，从克隆项目到成功运行大约需要 5-10 分钟。