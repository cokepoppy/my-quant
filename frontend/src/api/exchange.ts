import { api } from './index'

export const exchangeApi = {
  // 账户管理
  getAccounts: () => api.get('/exchange'),
  getAccount: (id: string) => api.get(`/exchange/${id}`),
  createAccount: (data: any) => api.post('/exchange', data),
  updateAccount: (id: string, data: any) => api.put(`/exchange/${id}`, data),
  deleteAccount: (id: string) => api.delete(`/exchange/${id}`),
  
  // 连接管理
  connectAccount: (id: string) => api.post(`/exchange/${id}/connect`),
  disconnectAccount: (id: string) => api.post(`/exchange/${id}/disconnect`),
  testConnection: (id: string) => api.post(`/exchange/${id}/test`),
  
  // 数据同步
  syncAccount: (id: string) => api.post(`/exchange/${id}/sync`),
  getSyncStatus: (id: string) => api.get(`/exchange/${id}/sync/status`),
  
  // 交易操作
  placeOrder: (accountId: string, orderData: any) => 
    api.post(`/exchange/${accountId}/orders`, orderData),
  cancelOrder: (accountId: string, orderId: string, symbol?: string) => 
    api.delete(`/exchange/${accountId}/orders/${orderId}`, { params: { symbol } }),
  cancelAllOrders: (accountId: string, symbol?: string) => 
    api.delete(`/exchange/${accountId}/orders`, { params: { symbol } }),
  
  // 订单查询
  getOrders: (accountId: string, symbol?: string) => 
    api.get(`/exchange/${accountId}/orders`, { params: { symbol } }),
  getOpenOrders: (accountId: string, symbol?: string) => 
    api.get(`/exchange/${accountId}/orders/open`, { params: { symbol } }),
  getClosedOrders: (accountId: string, symbol?: string, limit?: number) => 
    api.get(`/exchange/${accountId}/orders/closed`, { params: { symbol, limit } }),
  getOrder: (accountId: string, orderId: string) => 
    api.get(`/exchange/${accountId}/orders/${orderId}`),
  
  // 账户数据
  getBalance: (accountId: string) => api.get(`/exchange/${accountId}/balance`),
  getPositions: (accountId: string) => api.get(`/exchange/${accountId}/positions`),
  getTrades: (accountId: string, symbol?: string, limit?: number) => 
    api.get(`/exchange/${accountId}/trades`, { params: { symbol, limit } }),
  
  // 市场数据
  getTicker: (accountId: string, symbol: string) => 
    api.get(`/exchange/${accountId}/ticker/${symbol}`),
  getTickers: (accountId: string, symbols?: string[]) => 
    api.get(`/exchange/${accountId}/tickers`, { params: { symbols } }),
  getOrderBook: (accountId: string, symbol: string, limit?: number) => 
    api.get(`/exchange/${accountId}/orderbook/${symbol}`, { params: { limit } }),
  getOHLCV: (accountId: string, symbol: string, timeframe?: string, limit?: number) => 
    api.get(`/exchange/${accountId}/ohlcv/${symbol}`, { params: { timeframe, limit } }),
  
  // 交易对信息
  getMarkets: (accountId: string) => api.get(`/exchange/${accountId}/markets`),
  getExchangeInfo: (accountId: string) => api.get(`/exchange/${accountId}/info`),
  
  // 批量操作
  getAllBalances: () => api.get('/exchange/balances'),
  getAllPositions: () => api.get('/exchange/positions'),
  getAllOpenOrders: () => api.get('/exchange/orders/open'),
  
  // 系统状态
  getStatus: (accountId?: string) => 
    api.get('/exchange/status', { params: { accountId } }),
  getConnectedExchanges: () => api.get('/exchange/connected')
}

export default exchangeApi