#!/bin/bash

# 测试脚本运行器
# 用于执行各种测试脚本

echo "🧪 量化交易系统测试脚本运行器"
echo "=================================="

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示菜单
show_menu() {
    echo -e "${BLUE}请选择要执行的测试:${NC}"
    echo "1) 登录页面测试"
    echo "2) 交易面板快速交易测试"
    echo "3) 改进版交易面板测试"
    echo "4) 交易API测试"
    echo "5) 后端API测试"
    echo "6) 风险管理测试"
    echo "7) 前端组件测试"
    echo "8) WebSocket测试"
    echo "9) 运行所有测试"
    echo "0) 退出"
    echo -n "请输入选项 (0-9): "
}

# 执行登录测试
run_login_test() {
    echo -e "${YELLOW}🔐 执行登录页面测试...${NC}"
    cd testing/playwright
    node test-login-page.js
    echo -e "${GREEN}✅ 登录测试完成${NC}"
    cd ../..
}

# 执行交易面板测试
run_trading_panel_test() {
    echo -e "${YELLOW}🏠 执行交易面板快速交易测试...${NC}"
    cd testing/playwright
    node test-trading-panel-quick.js
    echo -e "${GREEN}✅ 交易面板测试完成${NC}"
    cd ../..
}

# 执行改进版交易面板测试
run_improved_trading_test() {
    echo -e "${YELLOW}🚀 执行改进版交易面板测试...${NC}"
    cd testing/playwright
    node test-trading-panel-improved.js
    echo -e "${GREEN}✅ 改进版交易面板测试完成${NC}"
    cd ../..
}

# 执行交易API测试
run_trading_api_test() {
    echo -e "${YELLOW}📡 执行交易API测试...${NC}"
    cd testing/playwright
    node test-trading-api.js
    echo -e "${GREEN}✅ 交易API测试完成${NC}"
    cd ../..
}

# 执行后端API测试
run_backend_test() {
    echo -e "${YELLOW}⚙️ 执行后端API测试...${NC}"
    cd testing
    node test-backend-simple.js
    echo -e "${GREEN}✅ 后端API测试完成${NC}"
    cd ..
}

# 执行风险管理测试
run_risk_test() {
    echo -e "${YELLOW}🛡️ 执行风险管理测试...${NC}"
    cd testing
    node test-risk-management.js
    echo -e "${GREEN}✅ 风险管理测试完成${NC}"
    cd ..
}

# 执行前端组件测试
run_frontend_test() {
    echo -e "${YELLOW}🎨 执行前端组件测试...${NC}"
    cd testing
    node test-frontend-components.js
    echo -e "${GREEN}✅ 前端组件测试完成${NC}"
    cd ..
}

# 执行WebSocket测试
run_websocket_test() {
    echo -e "${YELLOW}🔌 执行WebSocket测试...${NC}"
    cd testing
    node test-websocket.js
    echo -e "${GREEN}✅ WebSocket测试完成${NC}"
    cd ..
}

# 运行所有测试
run_all_tests() {
    echo -e "${YELLOW}🔄 运行所有测试...${NC}"
    echo "这需要一些时间，请耐心等待..."
    
    # 创建测试报告目录
    mkdir -p testing/reports/$(date +%Y%m%d_%H%M%S)
    
    # 依次执行所有测试
    run_login_test
    sleep 2
    run_trading_panel_test
    sleep 2
    run_improved_trading_test
    sleep 2
    run_trading_api_test
    sleep 2
    run_backend_test
    sleep 2
    run_risk_test
    sleep 2
    run_frontend_test
    sleep 2
    run_websocket_test
    
    echo -e "${GREEN}🎉 所有测试完成！${NC}"
    echo -e "${BLUE}📊 测试报告保存在 testing/reports/ 目录${NC}"
    echo -e "${BLUE}📸 截图保存在 testing/screenshots/ 目录${NC}"
}

# 主循环
while true; do
    show_menu
    read -r choice
    
    case $choice in
        1)
            run_login_test
            ;;
        2)
            run_trading_panel_test
            ;;
        3)
            run_improved_trading_test
            ;;
        4)
            run_trading_api_test
            ;;
        5)
            run_backend_test
            ;;
        6)
            run_risk_test
            ;;
        7)
            run_frontend_test
            ;;
        8)
            run_websocket_test
            ;;
        9)
            run_all_tests
            ;;
        0)
            echo -e "${GREEN}👋 再见！${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ 无效选项，请重新选择${NC}"
            ;;
    esac
    
    echo ""
    echo -e "${YELLOW}按 Enter 键继续...${NC}"
    read -r
done