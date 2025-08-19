import { get, post, put, del } from "./base";
import { TradingAccount, Order, Position, Balance } from "@/types/trading";

// 获取交易账户列表
export const getTradingAccounts = async () => {
  const response = await get<TradingAccount[]>("/trading/accounts");
  return response;
};

// 获取账户详情
export const getAccountById = async (id: string) => {
  const response = await get<TradingAccount>(`/trading/accounts/${id}`);
  return response;
};

// 添加交易账户
export const addTradingAccount = async (data: Partial<TradingAccount>) => {
  const response = await post<TradingAccount>("/trading/accounts", data);
  return response;
};

// 更新交易账户
export const updateTradingAccount = async (
  id: string,
  data: Partial<TradingAccount>,
) => {
  const response = await put<TradingAccount>(`/trading/accounts/${id}`, data);
  return response;
};

// 删除交易账户
export const deleteTradingAccount = async (id: string) => {
  const response = await del(`/trading/accounts/${id}`);
  return response;
};

// 获取账户余额
export const getAccountBalance = async (accountId: string) => {
  const response = await get<Balance>(`/trading/accounts/${accountId}/balance`);
  return response;
};

// 下单
export const placeOrder = async (data: {
  accountId: string;
  symbol: string;
  type: "market" | "limit" | "stop" | "stop_limit";
  side: "buy" | "sell";
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: "day" | "gtc" | "ioc" | "fok";
}) => {
  const response = await post<Order>("/trading/order", data);
  return response;
};

// 获取订单列表
export const getOrders = async (params?: {
  accountId?: string;
  symbol?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await get<{
    orders: Order[];
    total: number;
    page: number;
    limit: number;
  }>("/trading/orders", { params });
  return response;
};

// 获取订单详情
export const getOrderById = async (id: string) => {
  const response = await get<Order>(`/trading/orders/${id}`);
  return response;
};

// 取消订单
export const cancelOrder = async (id: string) => {
  const response = await post(`/trading/orders/${id}/cancel`);
  return response;
};

// 获取持仓列表
export const getPositions = async (accountId?: string) => {
  const response = await get<Position[]>("/trading/positions", {
    params: { accountId },
  });
  return response;
};

// 获取持仓详情
export const getPositionById = async (id: string) => {
  const response = await get<Position>(`/trading/positions/${id}`);
  return response;
};

// 平仓
export const closePosition = async (id: string, quantity?: number) => {
  const response = await post(`/trading/positions/${id}/close`, { quantity });
  return response;
};

// 获取交易历史
export const getTradeHistory = async (params?: {
  accountId?: string;
  symbol?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await get("/trading/trades", { params });
  return response;
};

// 获取市场数据
export const getMarketData = async (symbol: string, interval?: string) => {
  const response = await get(`/data/market/${symbol}`, {
    params: { interval },
  });
  return response;
};

// 获取历史数据
export const getHistoricalData = async (
  symbol: string,
  params: {
    startTime: string;
    endTime: string;
    interval: string;
  },
) => {
  const response = await get(`/data/historical/${symbol}`, { params });
  return response;
};

export default {
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
};
