import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { get, post, put, del } from "@/api";
import type {
  BacktestConfig,
  BacktestRecord,
  BacktestResults,
  BacktestTrade,
  Pagination,
} from "@/types/strategy";

interface BacktestState {
  backtests: BacktestRecord[];
  currentBacktest: BacktestRecord | null;
  trades: BacktestTrade[];
  backtestConfig: BacktestConfig;
  pagination: Pagination;
  tradePagination: Pagination;
  isLoading: boolean;
  error: string | null;
}

export const useBacktestStore = defineStore("backtest", {
  state: (): BacktestState => ({
    backtests: [],
    currentBacktest: null,
    trades: [],
    backtestConfig: {
      strategyId: "",
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90天前
      endDate: new Date(),
      initialCapital: 10000,
      benchmark: "BTC/USDT",
      dataFrequency: "1h",
      commission: 0.001,
      slippage: 0.001,
      leverage: 1,
      symbols: [],
      timeframe: "1h",
      riskLimits: ["maxDrawdown"],
      outputOptions: ["trades", "dailyReturns", "drawdown"],
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
    },
    tradePagination: {
      page: 1,
      limit: 20,
      total: 0,
    },
    isLoading: false,
    error: null,
  }),

  getters: {
    // 获取回测记录总数
    totalBacktests: (state) => state.pagination.total,

    // 获取交易记录总数
    totalTrades: (state) => state.tradePagination.total,

    // 获取正在运行的回测
    runningBacktests: (state) =>
      state.backtests.filter((b) => b.status === "running"),

    // 获取已完成的回测
    completedBacktests: (state) =>
      state.backtests.filter((b) => b.status === "completed"),

    // 获取失败的回测
    failedBacktests: (state) =>
      state.backtests.filter((b) => b.status === "failed"),

    // 获取最近的回测
    recentBacktests: (state) => {
      return [...state.backtests]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5);
    },

    // 获取最佳表现的回测
    bestPerformingBacktests: (state) => {
      return state.backtests
        .filter((b) => b.results && b.results.totalReturn > 0)
        .sort(
          (a, b) =>
            (b.results?.totalReturn || 0) - (a.results?.totalReturn || 0),
        )
        .slice(0, 5);
    },

    // 检查配置是否有效
    isConfigValid: (state) => {
      return !!(
        state.backtestConfig.strategyId &&
        state.backtestConfig.startDate &&
        state.backtestConfig.endDate &&
        state.backtestConfig.initialCapital > 0
      );
    },
  },

  actions: {
    // 设置加载状态
    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    // 设置错误
    setError(error: string | null) {
      this.error = error;
      if (error) {
        ElMessage.error(error);
      }
    },

    // 设置分页
    setPagination(pagination: Partial<Pagination>) {
      this.pagination = { ...this.pagination, ...pagination };
    },

    // 设置交易分页
    setTradePagination(pagination: Partial<Pagination>) {
      this.tradePagination = { ...this.tradePagination, ...pagination };
    },

    // 更新回测配置
    updateBacktestConfig(config: Partial<BacktestConfig>) {
      this.backtestConfig = { ...this.backtestConfig, ...config };
    },

    // 重置回测配置
    resetBacktestConfig() {
      this.backtestConfig = {
        strategyId: "",
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        initialCapital: 10000,
        benchmark: "BTC/USDT",
        dataFrequency: "1h",
        commission: 0.001,
        slippage: 0.001,
        leverage: 1,
        symbols: [],
        timeframe: "1h",
        riskLimits: ["maxDrawdown"],
        outputOptions: ["trades", "dailyReturns", "drawdown"],
      };
    },

    // 获取回测记录列表
    async fetchBacktests() {
      try {
        this.setLoading(true);

        const params = {
          page: this.pagination.page,
          limit: this.pagination.limit,
          search: this.pagination.search || "",
          status: this.pagination.status || "",
          strategyId: this.pagination.strategyId || "",
        };

        const response = await get("/backtest", { params });

        this.backtests = response.data.backtests || [];
        this.pagination.total = response.data.total || 0;
        this.setError(null);
      } catch (error: any) {
        console.error("获取回测记录失败:", error);
        this.setError(error.response?.data?.message || "获取回测记录失败");
      } finally {
        this.setLoading(false);
      }
    },

    // 获取单个回测记录
    async fetchBacktestById(id: string) {
      try {
        this.setLoading(true);

        const response = await get(`/backtest/${id}`);
        this.currentBacktest = response.data;
        this.setError(null);

        return response.data;
      } catch (error: any) {
        console.error("获取回测记录失败:", error);
        this.setError(error.response?.data?.message || "获取回测记录失败");
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    // 开始回测
    async startBacktest() {
      try {
        this.setLoading(true);

        const config = {
          ...this.backtestConfig,
          startDate: this.backtestConfig.startDate.toISOString().split("T")[0],
          endDate: this.backtestConfig.endDate.toISOString().split("T")[0],
        };

        const response = await post("/backtest/start", config);

        // 添加到列表
        this.backtests.unshift(response.data);
        this.pagination.total += 1;

        ElMessage.success("回测任务已启动");
        this.setError(null);

        return response.data;
      } catch (error: any) {
        console.error("启动回测失败:", error);
        this.setError(error.response?.data?.message || "启动回测失败");
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    // 取消回测
    async cancelBacktest(id: string) {
      try {
        this.setLoading(true);

        await post(`/backtest/${id}/cancel`);

        // 更新本地状态
        const backtest = this.backtests.find((b) => b.id === id);
        if (backtest) {
          backtest.status = "cancelled";
        }

        if (this.currentBacktest?.id === id) {
          this.currentBacktest.status = "cancelled";
        }

        ElMessage.success("回测已取消");
        this.setError(null);
      } catch (error: any) {
        console.error("取消回测失败:", error);
        this.setError(error.response?.data?.message || "取消回测失败");
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    // 删除回测记录
    async deleteBacktest(id: string) {
      try {
        this.setLoading(true);

        await delete `/backtest/${id}`;

        // 从列表中移除
        this.backtests = this.backtests.filter((b) => b.id !== id);
        this.pagination.total -= 1;

        // 如果是当前查看的记录，清空
        if (this.currentBacktest?.id === id) {
          this.currentBacktest = null;
        }

        ElMessage.success("删除成功");
        this.setError(null);
      } catch (error: any) {
        console.error("删除回测记录失败:", error);
        this.setError(error.response?.data?.message || "删除回测记录失败");
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    // 获取回测交易记录
    async fetchBacktestTrades(id: string) {
      try {
        this.setLoading(true);

        const params = {
          page: this.tradePagination.page,
          limit: this.tradePagination.limit,
          search: this.tradePagination.search || "",
        };

        const response = await get(`/backtest/${id}/trades`, { params });

        this.trades = response.data.trades || [];
        this.tradePagination.total = response.data.total || 0;
        this.setError(null);
      } catch (error: any) {
        console.error("获取交易记录失败:", error);
        this.setError(error.response?.data?.message || "获取交易记录失败");
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    // 获取回测日志
    async fetchBacktestLogs(
      id: string,
      options?: { level?: string; limit?: number },
    ) {
      try {
        this.setLoading(true);

        const params = {
          level: options?.level || "",
          limit: options?.limit || 100,
        };

        const response = await get(`/backtest/${id}/logs`, { params });
        this.setError(null);

        return response.data;
      } catch (error: any) {
        console.error("获取回测日志失败:", error);
        this.setError(error.response?.data?.message || "获取回测日志失败");
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    // 导出回测报告
    async exportBacktestReport(id: string) {
      try {
        this.setLoading(true);

        const response = await get(`/backtest/${id}/export`, {
          responseType: "blob",
        });

        // 创建下载链接
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `backtest_report_${id}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        ElMessage.success("报告导出成功");
        this.setError(null);
      } catch (error: any) {
        console.error("导出报告失败:", error);
        this.setError(error.response?.data?.message || "导出报告失败");
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    // 导出交易记录
    async exportBacktestTrades(id: string) {
      try {
        this.setLoading(true);

        const response = await get(`/backtest/${id}/trades/export`, {
          responseType: "blob",
        });

        // 创建下载链接
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `backtest_trades_${id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        ElMessage.success("交易记录导出成功");
        this.setError(null);
      } catch (error: any) {
        console.error("导出交易记录失败:", error);
        this.setError(error.response?.data?.message || "导出交易记录失败");
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    // 获取回测统计
    async fetchBacktestStats() {
      try {
        this.setLoading(true);

        const response = await get("/backtest/stats");
        this.setError(null);

        return response.data;
      } catch (error: any) {
        console.error("获取回测统计失败:", error);
        this.setError(error.response?.data?.message || "获取回测统计失败");
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    // 对比回测结果
    async compareBacktests(backtestIds: string[]) {
      try {
        this.setLoading(true);

        const response = await post("/backtest/compare", { backtestIds });
        this.setError(null);

        return response.data;
      } catch (error: any) {
        console.error("对比回测结果失败:", error);
        this.setError(error.response?.data?.message || "对比回测结果失败");
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    // 获取回测模板
    async fetchBacktestTemplates() {
      try {
        this.setLoading(true);

        const response = await get("/backtest/templates");
        this.setError(null);

        return response.data;
      } catch (error: any) {
        console.error("获取回测模板失败:", error);
        this.setError(error.response?.data?.message || "获取回测模板失败");
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    // 优化策略参数
    async optimizeStrategy(id: string, options: any) {
      try {
        this.setLoading(true);

        const response = await post(`/backtest/${id}/optimize`, options);
        this.setError(null);

        return response.data;
      } catch (error: any) {
        console.error("优化策略参数失败:", error);
        this.setError(error.response?.data?.message || "优化策略参数失败");
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    // 获取回测进度
    async fetchBacktestProgress(id: string) {
      try {
        const response = await get(`/backtest/${id}/progress`);
        this.setError(null);

        return response.data;
      } catch (error: any) {
        console.error("获取回测进度失败:", error);
        this.setError(error.response?.data?.message || "获取回测进度失败");
        throw error;
      }
    },

    // 清理资源
    clearResources() {
      this.backtests = [];
      this.currentBacktest = null;
      this.trades = [];
      this.error = null;
    },
  },
});
