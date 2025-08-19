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