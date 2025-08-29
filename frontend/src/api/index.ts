// 导出所有API服务

// 基础API配置
export { default as api, get, post, put, del, patch, upload } from "./base";

// 认证相关API
export {
  login,
  register,
  getCurrentUser,
  changePassword,
  refreshToken,
  logout,
} from "./auth";
export { default as authApi } from "./auth";

// 用户管理API
export {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
  toggleUserStatus,
  resetUserPassword,
} from "./user";
export { default as userApi } from "./user";

// 策略管理API
export {
  getStrategies,
  getStrategyById,
  createStrategy,
  updateStrategy,
  deleteStrategy,
  getStrategyTemplates,
  validateStrategy,
  startStrategy,
  stopStrategy,
  getStrategyPerformance,
  getStrategyLogs,
} from "./strategy";
export { default as strategyApi } from "./strategy";

// 回测API
export {
  startBacktest,
  getBacktestResults,
  getBacktestStatus,
  cancelBacktest,
  getBacktestHistory,
  deleteBacktest,
  exportBacktestReport,
  getAvailableDataSources,
  getSupportedTimeframes,
  validateDataAvailability,
  getBacktestStats,
  startBatchBacktest,
  getOptimizationResults,
  createBacktestWebSocket,
} from "./backtest";
export { default as backtestApi } from "./backtest";

// 交易API
export {
  getTradingAccounts,
  getAccountById,
  addTradingAccount,
  updateTradingAccount,
  deleteTradingAccount,
  getAccountBalance,
  placeOrder,
  getOrders,
  getOrderById,
  cancelOrder,
  getPositions,
  getPositionById,
  closePosition,
  getTradeHistory,
  getMarketData,
  getHistoricalData,
} from "./trading";
export { default as tradingApi } from "./trading";

// 监控API
export {
  getSystemMetrics,
  getAlerts,
  getAlertById,
  acknowledgeAlert,
  resolveAlert,
  getSystemLogs,
  getDashboardData,
  getRealtimeData,
  getPerformanceReport,
  exportMonitoringData,
  getHealthStatus,
  getServiceStatus,
  restartService,
  getResourceUsage,
} from "./monitoring";
export { default as monitoringApi } from "./monitoring";

// 交易所相关API
export { default as exchangeApi } from "./exchange";

// 交易日志和监控API
export { default as tradingLogsApi } from "./tradingLogs";

// 通用API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

// API配置选项
export interface ApiConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

// 文件上传进度回调
export interface UploadProgress {
  loaded: number;
  total: number;
  progress: number;
}

// 请求拦截器配置
export interface RequestInterceptor {
  onFulfilled?: (config: any) => any;
  onRejected?: (error: any) => any;
}

// 响应拦截器配置
export interface ResponseInterceptor {
  onFulfilled?: (response: any) => any;
  onRejected?: (error: any) => any;
}
