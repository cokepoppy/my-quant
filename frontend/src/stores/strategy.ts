import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useAuthStore } from "./auth";
import { useAppStore } from "./app";
import type {
  Strategy,
  StrategyTemplate,
  StrategyValidation,
  StrategyPerformance,
  StrategyListResponse,
} from "@/types/strategy";
import {
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
} from "@/api/strategy";

export const useStrategyStore = defineStore("strategy", () => {
  const authStore = useAuthStore();
  const appStore = useAppStore();

  // 状态
  const strategies = ref<Strategy[]>([]);
  const templates = ref<StrategyTemplate[]>([]);
  const currentStrategy = ref<Strategy | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const filters = ref({
    search: "",
    status: "",
    type: "",
  });

  // 计算属性
  const activeStrategies = computed(() =>
    strategies.value.filter((s) => s.status === "active"),
  );

  const draftStrategies = computed(() =>
    strategies.value.filter((s) => s.status === "draft"),
  );

  const stoppedStrategies = computed(() =>
    strategies.value.filter((s) => s.status === "stopped"),
  );

  const strategyStats = computed(() => ({
    total: strategies.value.length,
    active: activeStrategies.value.length,
    draft: draftStrategies.value.length,
    stopped: stoppedStrategies.value.length,
  }));

  // 获取策略列表
  const fetchStrategies = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
  }) => {
    try {
      isLoading.value = true;
      error.value = null;

      const mergedParams = {
        page: params?.page || pagination.value.page,
        limit: params?.limit || pagination.value.limit,
        search: params?.search || filters.value.search,
        status: params?.status || filters.value.status,
        type: params?.type || filters.value.type,
      };

      const response = await getStrategies(mergedParams);

      strategies.value = response.strategies;
      pagination.value = {
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: Math.ceil(response.total / response.limit),
      };

      return response;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "获取策略列表失败";
      appStore.handleError(err, "获取策略列表失败");
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 获取策略详情
  const fetchStrategyById = async (id: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      const strategy = await getStrategyById(id);
      currentStrategy.value = strategy;
      return strategy;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "获取策略详情失败";
      appStore.handleError(err, "获取策略详情失败");
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 创建策略
  const createNewStrategy = async (data: Partial<Strategy>) => {
    try {
      isLoading.value = true;
      error.value = null;

      if (!authStore.user) {
        throw new Error("用户未登录");
      }

      const strategy = await createStrategy({
        ...data,
        createdBy: authStore.user.id,
        status: "draft",
        version: 1,
        isTemplate: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 添加到列表开头
      strategies.value.unshift(strategy);

      appStore.showSuccess("策略创建成功");
      return strategy;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "创建策略失败";
      appStore.handleError(err, "创建策略失败");
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 更新策略
  const updateStrategyById = async (id: string, data: Partial<Strategy>) => {
    try {
      isLoading.value = true;
      error.value = null;

      const updatedStrategy = await updateStrategy(id, {
        ...data,
        updatedAt: new Date().toISOString(),
      });

      // 更新列表中的策略
      const index = strategies.value.findIndex((s) => s.id === id);
      if (index !== -1) {
        strategies.value[index] = updatedStrategy;
      }

      // 更新当前策略
      if (currentStrategy.value?.id === id) {
        currentStrategy.value = updatedStrategy;
      }

      appStore.showSuccess("策略更新成功");
      return updatedStrategy;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "更新策略失败";
      appStore.handleError(err, "更新策略失败");
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 删除策略
  const deleteStrategyById = async (id: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      await deleteStrategy(id);

      // 从列表中移除
      strategies.value = strategies.value.filter((s) => s.id !== id);

      // 清除当前策略
      if (currentStrategy.value?.id === id) {
        currentStrategy.value = null;
      }

      appStore.showSuccess("策略删除成功");
    } catch (err) {
      error.value = err instanceof Error ? err.message : "删除策略失败";
      appStore.handleError(err, "删除策略失败");
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 获取策略模板
  const fetchTemplates = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const templateList = await getStrategyTemplates();
      templates.value = templateList;
      return templateList;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "获取策略模板失败";
      appStore.handleError(err, "获取策略模板失败");
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 验证策略代码
  const validateStrategyCode = async (data: {
    code: string;
    language: string;
    type: string;
  }) => {
    try {
      isLoading.value = true;
      error.value = null;

      const validation = await validateStrategy(data);
      return validation;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "验证策略代码失败";
      appStore.handleError(err, "验证策略代码失败");
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 启动策略
  const startStrategyById = async (id: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      await startStrategy(id);

      // 更新本地状态
      const index = strategies.value.findIndex((s) => s.id === id);
      if (index !== -1) {
        strategies.value[index].status = "active";
        strategies.value[index].lastRunAt = new Date().toISOString();
      }

      if (currentStrategy.value?.id === id) {
        currentStrategy.value.status = "active";
        currentStrategy.value.lastRunAt = new Date().toISOString();
      }

      appStore.showSuccess("策略启动成功");
    } catch (err) {
      error.value = err instanceof Error ? err.message : "启动策略失败";
      appStore.handleError(err, "启动策略失败");
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 停止策略
  const stopStrategyById = async (id: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      await stopStrategy(id);

      // 更新本地状态
      const index = strategies.value.findIndex((s) => s.id === id);
      if (index !== -1) {
        strategies.value[index].status = "stopped";
      }

      if (currentStrategy.value?.id === id) {
        currentStrategy.value.status = "stopped";
      }

      appStore.showSuccess("策略停止成功");
    } catch (err) {
      error.value = err instanceof Error ? err.message : "停止策略失败";
      appStore.handleError(err, "停止策略失败");
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 获取策略性能
  const fetchStrategyPerformance = async (id: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      const performance = await getStrategyPerformance(id);

      // 更新当前策略的性能数据
      if (currentStrategy.value?.id === id) {
        currentStrategy.value.performance = performance;
      }

      return performance;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "获取策略性能失败";
      appStore.handleError(err, "获取策略性能失败");
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 获取策略日志
  const fetchStrategyLogs = async (
    id: string,
    params?: {
      page?: number;
      limit?: number;
      level?: string;
    },
  ) => {
    try {
      isLoading.value = true;
      error.value = null;

      const logs = await getStrategyLogs(id, params);
      return logs;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "获取策略日志失败";
      appStore.handleError(err, "获取策略日志失败");
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 设置过滤器
  const setFilters = (newFilters: {
    search?: string;
    status?: string;
    type?: string;
  }) => {
    filters.value = { ...filters.value, ...newFilters };
    pagination.value.page = 1; // 重置页码
  };

  // 设置分页
  const setPagination = (newPagination: { page?: number; limit?: number }) => {
    pagination.value = { ...pagination.value, ...newPagination };
  };

  // 清除当前策略
  const clearCurrentStrategy = () => {
    currentStrategy.value = null;
  };

  // 清除错误
  const clearError = () => {
    error.value = null;
  };

  return {
    // 状态
    strategies,
    templates,
    currentStrategy,
    isLoading,
    error,
    pagination,
    filters,

    // 计算属性
    activeStrategies,
    draftStrategies,
    stoppedStrategies,
    strategyStats,

    // 方法
    fetchStrategies,
    fetchStrategyById,
    createNewStrategy,
    updateStrategyById,
    deleteStrategyById,
    fetchTemplates,
    validateStrategyCode,
    startStrategyById,
    stopStrategyById,
    fetchStrategyPerformance,
    fetchStrategyLogs,
    setFilters,
    setPagination,
    clearCurrentStrategy,
    clearError,
  };
});
