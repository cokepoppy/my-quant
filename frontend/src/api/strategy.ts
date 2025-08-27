import { get, post, put, del } from "./base";
import {
  Strategy,
  StrategyTemplate,
  StrategyValidation,
} from "@/types/strategy";

// 获取策略列表
export const getStrategies = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
}) => {
  console.log('🔥 getStrategies API called with params:', params);
  
  const response = await get<{
    strategies: Strategy[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }>("/strategies", { params });
  
  console.log('🔥 getStrategies API response:', response);
  console.log('🔥 getStrategies response structure:', {
    hasStrategies: 'strategies' in response,
    hasPagination: 'pagination' in response,
    hasData: 'data' in response,
    hasSuccess: 'success' in response,
    strategies: response.strategies,
    pagination: response.pagination,
    data: response.data,
    success: response.success
  });
  
  // 处理不同的响应结构
  if (response.success !== undefined && response.data) {
    // 新结构：{ success: true, data: { strategies: [...], pagination: {...} } }
    console.log('🔥 getStrategies: 使用新响应结构');
    return {
      strategies: response.data.strategies || [],
      pagination: response.data.pagination || { total: 0, page: 1, limit: 10, pages: 1 }
    };
  } else if (response.strategies && response.pagination) {
    // 旧结构：{ strategies: [...], pagination: {...} }
    console.log('🔥 getStrategies: 使用旧响应结构');
    return response;
  } else {
    console.error('🔥 getStrategies: 未知的响应结构:', response);
    // 返回默认结构
    return {
      strategies: [],
      pagination: { total: 0, page: 1, limit: 10, pages: 1 }
    };
  }
};

// 获取策略详情
export const getStrategyById = async (id: string) => {
  console.log('🔥 getStrategyById API called with id:', id);
  
  const response = await get<Strategy>(`/strategies/${id}`);
  
  console.log('🔥 getStrategyById API response:', response);
  console.log('🔥 getStrategyById response structure:', {
    hasStrategy: 'strategy' in response,
    hasData: 'data' in response,
    hasSuccess: 'success' in response,
    strategy: response.strategy,
    data: response.data,
    success: response.success
  });
  
  // 处理不同的响应结构
  if (response.success !== undefined && response.data) {
    // 新结构：{ success: true, data: { strategy: {...} } }
    console.log('🔥 getStrategyById: 使用新响应结构');
    return response.data.strategy || response.data;
  } else if (response.strategy) {
    // 旧结构：{ strategy: {...} }
    console.log('🔥 getStrategyById: 使用旧响应结构');
    return response.strategy;
  } else {
    // 直接返回策略对象
    console.log('🔥 getStrategyById: 直接返回策略对象');
    return response;
  }
};

// 创建策略
export const createStrategy = async (data: Partial<Strategy>) => {
  const response = await post<Strategy>("/strategies", data);
  return response;
};

// 更新策略
export const updateStrategy = async (id: string, data: Partial<Strategy>) => {
  const response = await put<Strategy>(`/strategies/${id}`, data);
  return response;
};

// 删除策略
export const deleteStrategy = async (id: string) => {
  const response = await del(`/strategies/${id}`);
  return response;
};

// 获取策略模板
export const getStrategyTemplates = async () => {
  const response = await get<StrategyTemplate[]>("/strategies/templates/list");
  return response;
};

// 验证策略代码
export const validateStrategy = async (data: {
  code: string;
  language: string;
  type: string;
}) => {
  const response = await post<StrategyValidation>("/strategies/validate", data);
  return response;
};

// 启动策略
export const startStrategy = async (id: string) => {
  const response = await post(`/strategies/${id}/start`);
  return response;
};

// 停止策略
export const stopStrategy = async (id: string) => {
  const response = await post(`/strategies/${id}/stop`);
  return response;
};

// 更新策略状态
export const updateStrategyStatus = async (id: string, status: string) => {
  console.log('🔥 updateStrategyStatus API called with:', { id, status });
  
  const response = await put(`/strategies/${id}/status`, { status });
  
  console.log('🔥 updateStrategyStatus API response:', response);
  console.log('🔥 updateStrategyStatus response structure:', {
    hasStrategy: 'strategy' in response,
    hasData: 'data' in response,
    hasSuccess: 'success' in response,
    strategy: response.strategy,
    data: response.data,
    success: response.success
  });
  
  // 处理不同的响应结构
  if (response.success !== undefined && response.data) {
    // 新结构：{ success: true, data: { strategy: {...} } }
    console.log('🔥 updateStrategyStatus: 使用新响应结构');
    return response;
  } else if (response.strategy) {
    // 旧结构：{ strategy: {...} }
    console.log('🔥 updateStrategyStatus: 使用旧响应结构');
    return {
      success: true,
      message: 'Strategy status updated successfully',
      data: { strategy: response.strategy }
    };
  } else {
    // 直接返回响应
    console.log('🔥 updateStrategyStatus: 直接返回响应');
    return response;
  }
};

// 获取策略性能
export const getStrategyPerformance = async (id: string) => {
  const response = await get(`/strategies/${id}/performance`);
  return response;
};

// 获取策略日志
export const getStrategyLogs = async (
  id: string,
  params?: {
    page?: number;
    limit?: number;
    level?: string;
  },
) => {
  const response = await get(`/strategies/${id}/logs`, { params });
  return response;
};

// 获取策略交易记录
export const getStrategyTrades = async (
  id: string,
  params?: {
    page?: number;
    limit?: number;
  },
) => {
  const response = await get(`/strategies/${id}/trades`, { params });
  return response;
};

// 复制策略
export const duplicateStrategy = async (id: string) => {
  const response = await post(`/strategies/${id}/duplicate`);
  return response;
};

export default {
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
  getStrategyTrades,
  updateStrategyStatus,
  duplicateStrategy,
};
