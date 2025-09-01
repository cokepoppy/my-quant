# 🧪 测试文件夹说明

本文件夹包含了量化交易系统的所有测试相关文件，按照类型进行了分类整理。

## 📁 文件夹结构

```
testing/
├── playwright/              # Playwright浏览器自动化测试
│   ├── test-login-page.js                  # 登录页面测试
│   ├── test-trading-panel-quick.js         # 交易面板快速交易测试
│   ├── test-trading-panel-improved.js      # 改进版交易面板测试
│   ├── test-trading-api.js                 # 交易API测试
│   ├── test-trading-api-headless.js        # 无头模式交易API测试
│   ├── test-trading-buy-*.js              # 各种交易买入测试
│   ├── test-trading-panel.js               # 交易面板基础测试
│   ├── test-trading-panel-functionality.js # 交易面板功能测试
│   └── test-trading-functions.js          # 交易功能测试
├── screenshots/             # 测试截图自动保存目录
├── reports/                # 测试报告目录
├── test-*.js               # 各种后端和功能测试
├── *.config.js             # 测试配置文件
├── run-tests.sh            # 测试脚本运行器
└── TEST_README.md          # 本说明文件
```

## 🚀 快速开始

### 1. 运行单个测试

```bash
# 登录测试
cd testing/playwright && node test-login-page.js

# 交易面板测试
cd testing/playwright && node test-trading-panel-improved.js

# 后端API测试
cd testing && node test-backend-simple.js
```

### 2. 使用测试运行器

```bash
# 启动交互式测试菜单
cd testing && ./run-tests.sh
```

### 3. 直接运行特定测试

```bash
# 风险管理测试
cd testing && node test-risk-management.js

# WebSocket测试
cd testing && node test-websocket.js

# 前端组件测试
cd testing && node test-frontend-components.js
```

## 📋 测试类型说明

### 🔐 登录测试
- **文件**: `test-login-page.js`
- **功能**: 测试用户登录流程
- **覆盖**: 表单填写、按钮点击、登录验证

### 🏠 交易面板测试
- **文件**: `test-trading-panel-*.js`
- **功能**: 测试交易面板的快速交易功能
- **覆盖**: 页面导航、表单操作、交易提交

### 📡 API测试
- **文件**: `test-trading-api.js`, `test-backend-*.js`
- **功能**: 测试后端API接口
- **覆盖**: REST API、WebSocket、数据验证

### 🛡️ 风险管理测试
- **文件**: `test-risk-management.js`
- **功能**: 测试风险管理系统
- **覆盖**: 订单验证、风险控制、预警机制

### 🎨 前端组件测试
- **文件**: `test-frontend-components.js`
- **功能**: 测试前端UI组件
- **覆盖**: 组件渲染、用户交互、响应式设计

### 🔌 WebSocket测试
- **文件**: `test-websocket.js`
- **功能**: 测试实时数据通信
- **覆盖**: 连接管理、消息传递、断线重连

## 📊 测试结果

### 截图文件
所有测试截图会自动保存到 `testing/screenshots/` 目录，包括：
- 登录页面状态
- 交易面板操作
- 表单填写过程
- 错误状态记录
- 最终测试结果

### 测试报告
详细的测试报告保存在 `testing/reports/` 目录，按时间戳组织。

## ⚙️ 配置说明

### Playwright配置
- `playwright-headless.config.js`: 无头模式配置
- 支持多浏览器测试
- 自动截图和录屏功能

### 测试环境
- 测试端口: localhost:3001
- 测试账户: admin@example.com / admin123
- 无头模式: 默认启用

## 🛠️ 维护说明

### 添加新测试
1. 在相应文件夹创建测试文件
2. 遵循现有命名规范
3. 更新测试运行器菜单
4. 添加相应的文档说明

### 清理测试文件
```bash
# 清理截图
rm -rf testing/screenshots/*.png

# 清理报告
rm -rf testing/reports/*

# 清理日志
find testing -name "*.log" -delete
```

### 更新依赖
```bash
# 更新Playwright
npx playwright install

# 更新测试依赖
npm install --save-dev @playwright/test
```

## 📝 注意事项

1. **端口冲突**: 确保测试端口3001未被占用
2. **依赖安装**: 运行前确保已安装所有依赖
3. **权限问题**: 确保测试脚本有执行权限
4. **网络环境**: 确保能访问测试服务器
5. **浏览器兼容**: Playwright支持Chrome、Firefox、Safari

## 🔍 故障排除

### 常见问题
1. **连接拒绝**: 检查服务器是否启动
2. **超时错误**: 增加等待时间或检查网络
3. **元素未找到**: 更新选择器或等待页面加载
4. **权限错误**: 检查文件权限和用户权限

### 调试技巧
1. 使用 `console.log` 输出调试信息
2. 启用详细日志模式
3. 检查截图文件定位问题
4. 使用浏览器开发者工具分析页面

## 📞 联系信息

如有测试相关问题，请联系开发团队或查看项目文档。