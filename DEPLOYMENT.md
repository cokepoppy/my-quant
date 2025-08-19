# 量化交易系统部署指南

## 系统概述

这是一个完整的量化交易系统，包含前端应用、后端API、数据库、缓存、监控等组件。

## 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端应用      │    │   Nginx 代理     │    │   后端 API      │
│   (Vue 3)       │────│   (负载均衡)     │────│   (Node.js)     │
│   Port: 3000    │    │   Port: 80/443  │    │   Port: 8000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   监控服务       │              │
         │              │   (Prometheus)   │              │
         │              │   Port: 9090    │              │
         │              └─────────────────┘              │
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Grafana       │    │   日志收集       │    │   数据备份       │
│   Port: 3001    │    │   (Fluentd)      │    │   (定时任务)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                    ┌─────────────────┐
                    │   数据存储       │
                    │   (PostgreSQL +  │
                    │    Redis)        │
                    │   Port: 5432/    │
                    │   6379           │
                    └─────────────────┘
```

## 环境要求

### 系统要求
- Linux/macOS/Windows (推荐 Linux)
- Docker 20.0+
- Docker Compose 2.0+
- Git 2.0+
- 至少 4GB RAM
- 至少 20GB 磁盘空间

### 软件依赖
- Docker Engine
- Docker Compose
- Git (可选，用于代码管理)

## 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/your-username/my-quant.git
cd my-quant
```

### 2. 配置环境变量
```bash
# 开发环境
cp .env.example .env

# 生产环境
cp .env.production .env
# 编辑 .env 文件，填入实际配置值
```

### 3. 运行部署脚本
```bash
# 开发环境部署
./deploy.sh dev

# 生产环境部署
./deploy.sh prod
```

### 4. 验证部署
访问以下地址验证服务是否正常运行：

- 前端应用: http://localhost:3000
- 后端API: http://localhost:8000/health
- Grafana监控: http://localhost:3001
- Prometheus: http://localhost:9090

## 详细配置

### 环境变量配置

创建 `.env` 文件并配置以下变量：

```bash
# 数据库配置
POSTGRES_PASSWORD=your_strong_password
REDIS_PASSWORD=your_strong_password

# 应用安全
JWT_SECRET=your_very_long_random_secret
SESSION_SECRET=your_very_long_random_secret

# 监控配置
GRAFANA_PASSWORD=your_strong_password

# API 配置
NODE_ENV=production
PORT=8000
CORS_ORIGIN=https://your-domain.com

# 数据库连接
DATABASE_URL=postgresql://quant:${POSTGRES_PASSWORD}@postgres:5432/quant_trading
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
```

### SSL 证书配置

生产环境需要配置 SSL 证书：

1. 将证书文件放置在 `./docker/ssl/` 目录下
2. 确保 `cert.pem` 和 `key.pem` 文件存在
3. 或者使用 Let's Encrypt 自动获取证书

### 数据库配置

系统使用 TimescaleDB (基于 PostgreSQL) 作为主数据库，支持时间序列数据。

#### 连接字符串
```
postgresql://quant:password@postgres:5432/quant_trading
```

#### 主要配置
- 最大连接数: 100
- 连接池: 最小2，最大10
- 缓存: Redis 512MB

## 服务管理

### 启动服务
```bash
docker-compose up -d
```

### 停止服务
```bash
docker-compose down
```

### 重启服务
```bash
docker-compose restart
```

### 查看服务状态
```bash
docker-compose ps
```

### 查看日志
```bash
# 所有服务日志
docker-compose logs -f

# 特定服务日志
docker-compose logs -f backend
```

### 更新服务
```bash
# 重新构建并启动
docker-compose build --no-cache
docker-compose up -d
```

## 监控和告警

### Prometheus 监控
- 访问地址: http://localhost:9090
- 默认用户名: admin
- 默认密码: 配置在环境变量中

### Grafana 仪表板
- 访问地址: http://localhost:3001
- 预配置仪表板:
  - 系统资源监控
  - 应用性能监控
  - 数据库监控
  - API 监控

### 日志收集
- 使用 Fluentd 收集所有服务日志
- 日志存储在 `./logs/` 目录
- 支持 Elasticsearch 和 Kibana 集成

### 告警配置
- Prometheus Alertmanager
- 邮件告警
- Webhook 告警
- Slack 集成

## 数据备份

### 自动备份
- 每天凌晨2点自动备份数据库
- 备份文件存储在 `./backups/` 目录
- 保留30天的备份

### 手动备份
```bash
# 备份数据库
docker-compose exec postgres pg_dump -U quant quant_trading > backup.sql

# 备份 Redis
docker-compose exec redis redis-cli --rdb /data/dump.rdb
```

### 恢复数据
```bash
# 恢复数据库
docker-compose exec -i postgres psql -U quant quant_trading < backup.sql

# 恢复 Redis
docker-compose exec redis redis-cli --rdb /data/dump.rdb
```

## 安全配置

### 网络安全
- 使用 Docker 网络隔离
- 配置防火墙规则
- 仅开放必要端口

### 应用安全
- JWT 身份验证
- CORS 配置
- 请求限流
- 输入验证
- SQL 注入防护

### 数据安全
- 数据库访问控制
- Redis 密码认证
- SSL/TLS 加密
- 敏感数据加密

## 性能优化

### 应用优化
- 启用 Gzip 压缩
- 配置 HTTP/2
- 启用浏览器缓存
- 使用 CDN 加速

### 数据库优化
- 配置连接池
- 创建适当索引
- 使用 TimescaleDB 超表
- 定期清理过期数据

### 系统优化
- 限制容器资源使用
- 配置健康检查
- 使用负载均衡
- 启用 HTTP 缓存

## 故障排除

### 常见问题

#### 1. 服务启动失败
```bash
# 检查日志
docker-compose logs backend

# 检查端口占用
netstat -tulpn | grep :8000

# 检查磁盘空间
df -h
```

#### 2. 数据库连接失败
```bash
# 检查数据库状态
docker-compose exec postgres pg_isready

# 检查网络连接
docker-compose exec backend ping postgres
```

#### 3. 前端无法访问后端
```bash
# 检查 CORS 配置
curl -I http://localhost:8000/health

# 检查代理配置
docker-compose logs nginx
```

#### 4. 监控数据不显示
```bash
# 检查 Prometheus 配置
curl http://localhost:9090/targets

# 检查 Grafana 数据源
curl -u admin:password http://localhost:3001/api/datasources
```

### 日志分析
```bash
# 查看错误日志
docker-compose logs --tail=100 backend | grep ERROR

# 实时监控日志
docker-compose logs -f backend | grep -i error
```

### 性能分析
```bash
# 查看容器资源使用
docker stats

# 查看应用性能
curl http://localhost:8000/monitoring/metrics
```

## 扩展配置

### 添加新服务
1. 在 `docker-compose.yml` 中添加服务定义
2. 配置网络和依赖关系
3. 更新 Nginx 配置
4. 重启服务

### 水平扩展
```bash
# 扩展后端服务
docker-compose up -d --scale backend=3

# 扩展前端服务
docker-compose up -d --scale frontend=2
```

### 数据库扩展
- 配置 PostgreSQL 主从复制
- 使用 Redis 集群
- 添加读写分离

## 生产环境最佳实践

### 1. 安全建议
- 使用强密码和密钥
- 定期更新依赖
- 配置防火墙
- 启用审计日志

### 2. 性能建议
- 监控资源使用
- 定期优化数据库
- 配置自动扩缩容
- 使用 CDN 加速

### 3. 可靠性建议
- 配置健康检查
- 实现自动重启
- 设置备份策略
- 准备灾难恢复

### 4. 维护建议
- 定期更新系统
- 监控错误日志
- 性能基准测试
- 容量规划

## 支持

如果遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查 GitHub Issues
3. 查看服务日志
4. 联系技术支持

## 贡献

欢迎贡献代码和建议！

## 许可证

MIT License