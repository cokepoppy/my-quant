import { get, post } from "./base";
import { BacktestConfig, BacktestResult, BacktestJob } from "@/types/backtest";

// 运行回测
export const runBacktest = async (config: BacktestConfig) => {
  const response = await post<{
    jobId: string;
    status: string;
    message: string;
  }>("/backtest/run", config);
  return response;
};

// 获取回测结果
export const getBacktestResult = async (id: string) => {
  const response = await get<BacktestResult>(`/backtest/results/${id}`);
  return response;
};

// 获取回测任务列表
export const getBacktestJobs = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  strategyId?: string;
}) => {
  const response = await get<{
    jobs: BacktestJob[];
    total: number;
    page: number;
    limit: number;
  }>("/backtest/jobs", { params });
  return response;
};

// 获取回测任务详情
export const getBacktestJob = async (id: string) => {
  const response = await get<BacktestJob>(`/backtest/jobs/${id}`);
  return response;
};

// 停止回测任务
export const stopBacktestJob = async (id: string) => {
  const response = await post(`/backtest/jobs/${id}/stop`);
  return response;
};

// 删除回测任务
export const deleteBacktestJob = async (id: string) => {
  const response = await post(`/backtest/jobs/${id}/delete`);
  return response;
};

// 获取回测统计
export const getBacktestStats = async () => {
  const response = await get("/backtest/stats");
  return response;
};

// 导出回测报告
export const exportBacktestReport = async (
  id: string,
  format: "pdf" | "excel" | "json",
) => {
  const response = await get(`/backtest/results/${id}/export`, {
    params: { format },
    responseType: "blob",
  });
  return response;
};

// 获取回测配置模板
export const getBacktestTemplates = async () => {
  const response = await get("/backtest/templates");
  return response;
};

// 保存回测配置
export const saveBacktestConfig = async (config: BacktestConfig) => {
  const response = await post("/backtest/configs", config);
  return response;
};

// 获取保存的回测配置
export const getBacktestConfigs = async () => {
  const response = await get("/backtest/configs");
  return response;
};

// 删除回测配置
export const deleteBacktestConfig = async (id: string) => {
  const response = await del(`/backtest/configs/${id}`);
  return response;
};

export default {
  runBacktest,
  getBacktestResult,
  getBacktestJobs,
  getBacktestJob,
  stopBacktestJob,
  deleteBacktestJob,
  getBacktestStats,
  exportBacktestReport,
  getBacktestTemplates,
  saveBacktestConfig,
  getBacktestConfigs,
  deleteBacktestConfig,
};
