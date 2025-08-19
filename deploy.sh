#!/bin/bash

# 量化交易系统部署脚本
# 使用方法: ./deploy.sh [dev|prod]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 检查必要工具
check_prerequisites() {
    log_step "检查必要工具..."
    
    command -v docker >/dev/null 2>&1 || { log_error "Docker 未安装"; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { log_error "Docker Compose 未安装"; exit 1; }
    command -v git >/dev/null 2>&1 || { log_error "Git 未安装"; exit 1; }
    
    log_info "所有必要工具已安装"
}

# 设置环境
setup_environment() {
    local env=$1
    
    log_step "设置环境: $env"
    
    if [ "$env" = "prod" ]; then
        if [ ! -f .env ]; then
            if [ -f .env.production ]; then
                cp .env.production .env
                log_warn "已复制生产环境配置模板，请编辑 .env 文件"
            else
                log_error "生产环境配置文件 .env.production 不存在"
                exit 1
            fi
        fi
    else
        # 开发环境
        if [ ! -f .env ]; then
            cat > .env << EOF
# 开发环境配置
NODE_ENV=development
PORT=8000
DATABASE_URL=postgresql://quant:quant123@localhost:5432/quant_trading
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-key
CORS_ORIGIN=http://localhost:3000
EOF
            log_info "已创建开发环境配置文件"
        fi
    fi
}

# 创建必要目录
create_directories() {
    log_step "创建必要目录..."
    
    mkdir -p logs/{nginx,backend,frontend}
    mkdir -p backups
    mkdir -p data/{postgres,redis}
    mkdir -p ssl
    mkdir -p monitoring/{prometheus,grafana}
    
    log_info "目录创建完成"
}

# 生成 SSL 证书 (开发环境)
generate_ssl_cert() {
    if [ ! -f ssl/cert.pem ] || [ ! -f ssl/key.pem ]; then
        log_step "生成 SSL 证书..."
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/key.pem \
            -out ssl/cert.pem \
            -subj "/C=CN/ST=Beijing/L=Beijing/O=MyQuant/CN=localhost"
        
        log_info "SSL 证书生成完成"
    fi
}

# 构建和启动服务
deploy_services() {
    local env=$1
    
    log_step "构建和启动服务..."
    
    # 停止现有服务
    docker-compose down --remove-orphans
    
    # 构建镜像
    log_info "构建 Docker 镜像..."
    docker-compose build --no-cache
    
    # 启动服务
    log_info "启动服务..."
    docker-compose up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    check_services_status
}

# 检查服务状态
check_services_status() {
    log_step "检查服务状态..."
    
    # 等待所有服务健康检查通过
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        local healthy=$(docker-compose ps --format "table {{.Service}}\t{{.Status}}" | grep -E "(postgres|redis|backend|frontend)" | grep -c "healthy\|running")
        
        if [ $healthy -ge 4 ]; then
            log_info "所有核心服务运行正常"
            break
        fi
        
        log_warn "等待服务启动... ($attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        log_error "部分服务启动失败，请检查日志"
        docker-compose logs
        exit 1
    fi
    
    # 显示服务访问信息
    show_access_info
}

# 显示访问信息
show_access_info() {
    log_step "部署完成！"
    
    echo ""
    echo "=========================================="
    echo "    量化交易系统访问信息"
    echo "=========================================="
    echo ""
    echo "🌐 前端应用: http://localhost:3000"
    echo "🔧 后端API: http://localhost:8000"
    echo "📊 Grafana监控: http://localhost:3001"
    echo "📈 Prometheus: http://localhost:9090"
    echo ""
    echo "🗄️  数据库: localhost:5432"
    echo "📦 Redis: localhost:6379"
    echo ""
    echo "📋 查看服务状态:"
    echo "   docker-compose ps"
    echo ""
    echo "📝 查看日志:"
    echo "   docker-compose logs -f [service_name]"
    echo ""
    echo "🛑 停止服务:"
    echo "   docker-compose down"
    echo ""
}

# 运行健康检查
run_health_checks() {
    log_step "运行健康检查..."
    
    # 检查前端
    if curl -s http://localhost:3000 > /dev/null; then
        log_info "✓ 前端应用健康"
    else
        log_error "✗ 前端应用不健康"
    fi
    
    # 检查后端
    if curl -s http://localhost:8000/health > /dev/null; then
        log_info "✓ 后端API健康"
    else
        log_error "✗ 后端API不健康"
    fi
    
    # 检查数据库
    if docker-compose exec postgres pg_isready -U quant > /dev/null 2>&1; then
        log_info "✓ 数据库健康"
    else
        log_error "✗ 数据库不健康"
    fi
    
    # 检查Redis
    if docker-compose exec redis redis-cli ping > /dev/null 2>&1; then
        log_info "✓ Redis健康"
    else
        log_error "✗ Redis不健康"
    fi
}

# 备份数据库
backup_database() {
    log_step "备份数据库..."
    
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    docker-compose exec postgres pg_dump -U quant quant_trading > "$backup_dir/backup.sql"
    
    log_info "数据库备份完成: $backup_dir/backup.sql"
}

# 主函数
main() {
    local env=${1:-dev}
    
    echo ""
    echo "=========================================="
    echo "    量化交易系统部署脚本"
    echo "=========================================="
    echo ""
    echo "环境: $env"
    echo ""
    
    # 检查参数
    if [ "$env" != "dev" ] && [ "$env" != "prod" ]; then
        log_error "无效的环境参数: $env"
        echo "用法: $0 [dev|prod]"
        exit 1
    fi
    
    # 执行部署步骤
    check_prerequisites
    setup_environment "$env"
    create_directories
    
    if [ "$env" = "dev" ]; then
        generate_ssl_cert
    fi
    
    deploy_services "$env"
    run_health_checks
    
    if [ "$env" = "prod" ]; then
        backup_database
    fi
    
    log_info "部署脚本执行完成！"
}

# 捕获中断信号
trap 'log_error "部署脚本被中断"; exit 1' INT TERM

# 运行主函数
main "$@"