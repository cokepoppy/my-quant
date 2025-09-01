#!/bin/bash

# 快速测试启动脚本
echo "🚀 快速启动交易面板测试..."

# 确保在正确的目录
cd "$(dirname "$0")"

# 检查依赖
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

echo "✅ 环境检查通过"

# 运行改进版交易面板测试
echo "🎯 启动改进版交易面板测试..."
cd playwright
node test-trading-panel-improved.js

echo "🎉 测试完成！"
echo "📸 截图保存在 ../screenshots/ 目录"
echo "📊 查看测试结果以确认功能正常"