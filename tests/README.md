# Playwright 自动化测试

本目录包含量化交易系统的端到端自动化测试，使用 Playwright 框架。

## 快速开始

### 安装依赖
```bash
npm install
```

### 安装浏览器
```bash
npx playwright install
```

### 运行测试
```bash
# 运行所有测试
npm run test:e2e

# 带界面的测试模式
npm run test:e2e:ui

# 调试模式
npm run test:e2e:debug

# 有头模式（可见浏览器）
npm run test:e2e:headed
```

## 测试结构

```
tests/
├── e2e/                    # 端到端测试
│   ├── auth/              # 认证相关测试
│   ├── exchange/          # 交易所管理测试
│   ├── trading/           # 交易功能测试
│   ├── validation/        # 表单验证测试
│   ├── responsive/        # 响应式设计测试
│   └── utils/             # 测试工具函数
├── components/            # 组件测试
├── fixtures/              # 测试数据
├── pages/                 # Page Object Model
└── config/               # 配置文件
```

## 核心测试场景

1. **用户认证流程**: 登录、注册、权限验证
2. **交易所管理**: 添加/连接/断开交易所账户
3. **交易功能**: 下单、撤单、查询订单和持仓
4. **表单验证**: 各种输入校验和错误提示
5. **响应式设计**: 不同屏幕尺寸的适配

## 环境配置

测试环境变量在 `.env.test` 文件中配置：

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
BYBIT_API_KEY=test_api_key
BYBIT_API_SECRET=test_api_secret
# ... 其他配置
```

## Page Object Model

使用 Page Object Model 模式组织测试代码：

- `LoginPage`: 登录页面操作
- `TradingPage`: 交易页面操作

## 最佳实践

1. 每个测试用例应该是独立的
2. 使用有意义的测试名称
3. 添加适当的等待和断言
4. 使用测试数据而不是硬编码值
5. 保持测试代码的简洁和可维护性

## 调试技巧

1. 使用 `--debug` 模式进行调试
2. 使用 `page.pause()` 暂停测试
3. 检查生成的截图和视频
4. 使用 Playwright Trace Viewer 分析测试执行过程

## 故障排除

### 常见问题

1. **测试超时**: 增加等待时间或检查网络连接
2. **元素未找到**: 检查选择器是否正确
3. **认证失败**: 确认测试用户凭据
4. **API连接失败**: 确认后端服务正在运行

### 运行特定测试

```bash
# 运行特定测试文件
npx playwright test tests/e2e/auth/login.spec.ts

# 运行特定测试用例
npx playwright test --grep "should login successfully"
```

## CI/CD 集成

测试配置为在 CI/CD 环境中自动运行，支持：

- 多浏览器测试（Chromium、Firefox、WebKit）
- 并行执行
- 失败重试
- 报告生成
- 截图和视频记录