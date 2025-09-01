# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a quantitative trading system built with Vue3 + Express + TypeScript, featuring real-time data processing, strategy development, backtesting, and automated trading capabilities. The system uses a microservices architecture with Docker containerization.

## Development Commands

### Root Commands
```bash
# Install all dependencies
npm run install:all

# Development - run both frontend and backend
npm run dev

# Build both applications
npm run build

# Run tests
npm run test

# Docker operations
npm run docker:up      # Start all services
npm run docker:down    # Stop all services
npm run docker:logs    # View logs
```

### Backend Commands
```bash
cd backend

# Development
npm run dev            # Start with tsx watch

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:push        # Push schema changes
npm run db:studio      # Open Prisma Studio
npm run db:init        # Initialize database

# Testing and linting
npm run test           # Run tests with Vitest
npm run lint           # ESLint check and fix
npm run format         # Prettier formatting
```

### Frontend Commands
```bash
cd frontend

# Development
npm run dev            # Vite dev server
npm run build          # Build for production
npm run preview        # Preview production build

# Testing and linting
npm run test           # Run tests with Vitest
npm run lint           # ESLint check and fix
npm run format         # Prettier formatting
```

## Architecture Overview

### Backend (Express + TypeScript)
- **Entry Point**: `backend/src/app.ts` - Express server with Socket.IO
- **Configuration**: `backend/src/config/index.ts` - Centralized config management
- **Database**: Prisma ORM with PostgreSQL/TimescaleDB
- **Authentication**: JWT-based with middleware
- **Real-time**: Socket.IO for WebSocket connections
- **Task Queue**: BullMQ for background jobs

### Frontend (Vue3 + TypeScript)
- **Entry Point**: `frontend/src/main.ts` - Vue app with Pinia and Element Plus
- **State Management**: Pinia stores in `frontend/src/stores/`
- **API Layer**: Axios-based in `frontend/src/api/` with interceptors
- **Routing**: Vue Router in `frontend/src/router/`
- **UI Components**: Element Plus with custom components

### Database Schema
- **Prisma Schema**: `backend/prisma/schema.prisma`
- **Core Models**: User, Strategy, MarketData, Backtest, Trade, Account
- **TimescaleDB**: Time-series market data with hypertables
- **Relations**: User owns strategies, strategies generate trades and backtests

## Key Configuration

### Environment Variables
- **Backend**: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `PORT=8000`
- **Frontend**: `VITE_API_URL`, `VITE_WS_URL`
- **Required**: Database and Redis connections for full functionality

### Docker Services
- **PostgreSQL**: TimescaleDB for time-series data (port 5432)
- **Redis**: Caching and session storage (port 6379)
- **Backend**: Express API server (port 8000)
- **Frontend**: Vue3 application (port 3000)
- **Nginx**: Reverse proxy and load balancer (ports 80/443)
- **Monitoring**: Prometheus (9090) and Grafana (3001)

## Code Conventions

### Backend
- Use TypeScript strict mode
- Prisma for database operations
- Winston for logging
- Express-validator for request validation
- Custom middleware for authentication and rate limiting

### Frontend
- Vue3 Composition API with `<script setup>`
- Pinia for state management
- Element Plus for UI components
- Chart.js/ECharts for data visualization
- Axios with interceptors for API calls

### API Patterns
- RESTful endpoints with `/api` prefix
- Consistent response format: `{ success: boolean, data?: any, message?: string }`
- JWT authentication via Authorization header
- Error handling with HTTP status codes

## Database Operations

### Schema Changes
1. Modify `backend/prisma/schema.prisma`
2. Run `npm run db:generate` to update client
3. Run `npm run db:migrate` to apply changes
4. Test changes with `npm run db:studio`

### Data Models
- **User**: Authentication and authorization
- **Strategy**: Trading strategy definitions
- **MarketData**: Time-series price data
- **Backtest**: Historical test results
- **Trade**: Individual trade records
- **Account**: Broker account connections

## Development Workflow

### Adding New Features
1. **Backend**: Add routes, controllers, services
2. **Frontend**: Create views, components, API calls
3. **Database**: Update Prisma schema if needed
4. **Testing**: Write unit and integration tests
5. **Documentation**: Update relevant docs

### Real-time Features
- Use Socket.IO for WebSocket connections
- Frontend: `frontend/src/utils/websocket.ts`
- Backend: `backend/src/socket/index.ts`
- Events: market data, strategy updates, trade notifications

### Testing
- **Backend**: Vitest with test files in `backend/test/`
- **Frontend**: Vitest with test files in `frontend/test/`
- **Integration**: Test API endpoints and database operations

## File Structure

```
/backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── routes/          # Route definitions
│   ├── services/        # Business logic
│   ├── socket/          # WebSocket handlers
│   └── utils/           # Utility functions
├── prisma/              # Database schema
└── scripts/             # Database scripts

/frontend/
├── src/
│   ├── api/             # API clients
│   ├── components/      # Vue components
│   ├── stores/          # Pinia stores
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── views/           # Page components
└── public/              # Static assets
```

## Common Issues

### Database Connection
- Ensure PostgreSQL and Redis are running: `npm run docker:up`
- Check connection strings in `.env` files
- Verify Prisma client is generated: `npm run db:generate`

### CORS Issues
- Frontend must use backend URL from environment variables
- Backend CORS configured for frontend origin
- In production, use Nginx for proper routing

### WebSocket Connection
- Check WebSocket URL configuration
- Verify Socket.IO server is running
- Test connection with browser dev tools

## Implementation Requirements

### Quality Assurance
- **Make sure your implementation will not break existing features**
- **All changes must be tested before committing**
- **Run full test suite**: `npm run test` (both frontend and backend)
- **Run linting**: `npm run lint` (both frontend and backend)
- **Run type checking**: `npm run build` to verify TypeScript compilation
- **Test API endpoints**: Use curl or Postman to verify API functionality
- **Test frontend components**: Manual testing in browser for UI changes

### Backward Compatibility
- **Database schema changes**: Must include migration scripts
- **API changes**: Maintain existing endpoint signatures when possible
- **Breaking changes**: Require explicit justification and documentation
- **Fallback mechanisms**: Always provide fallback for external dependencies

### Testing Requirements
- **Unit tests**: For new utility functions and services
- **Integration tests**: For API endpoints and database operations
- **Component tests**: For new Vue components
- **Manual testing**: Verify user workflow completion
- **Error handling**: Test both success and error scenarios

### Code Quality
- **TypeScript strict mode**: No `any` types without explicit reason
- **Error handling**: Comprehensive try-catch blocks with user-friendly messages
- **Logging**: Structured logging for debugging and monitoring
- **Documentation**: Update relevant documentation for all changes
- **Performance**: Consider impact on application performance

## Documentation Requirements

### Change Tracking
- **每次修改后，修改点保存到 `doc/修改记录.md`**
- **格式要求**：
  - 日期标记 (## YYYY-MM-DD)
  - 问题描述 (清晰说明要解决的问题)
  - 根本原因分析 (分析问题的根本原因)
  - 解决方案 (详细的解决步骤)
  - 技术实现细节 (关键代码片段)
  - 文件修改清单 (所有修改的文件列表)
  - 验证结果 (测试结果和功能验证)
  - 后续建议 (可能的改进方向)

### Documentation Updates
- **CLAUDE.md**: 更新项目配置和规则
- **修改记录.md**: 记录所有技术修改
- **API文档**: 更新API端点变更
- **用户文档**: 更新功能使用说明

### Commit Requirements
- **提交信息格式**：
  ```
  类型: 具体描述
  
  详细说明修改内容和原因
  
  🤖 Generated with [Claude Code](https://claude.ai/code)
  
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```
- **提交前检查**：
  - 所有测试通过
  - 代码检查通过
  - 文档已更新
  - 修改记录已更新

### Development Environment Rules
- **不要去启动服务端和测试端，我会在另外一个终端里启动**
- **Do not start backend or test services, I will start them in a separate terminal**
- Focus on code implementation, testing, and documentation
- Assume services are running when testing API endpoints
- Use curl or existing test scripts for API verification
- Never use `npm run dev`, `npm start`, or similar service启动命令