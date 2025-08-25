import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import * as monitoringApi from "@/api/monitoring";

interface MonitoringState {
  systemStatus: {
    overall: string;
    lastUpdate: string;
    services: Record<string, any>;
  };
  systemMetrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: {
      incoming: number;
      outgoing: number;
    };
    load: {
      "1m": number;
      "5m": number;
      "15m": number;
    };
  };
  serviceStatus: Array<{
    name: string;
    status: string;
    responseTime: number;
    uptime: number;
    lastCheck: string;
    error: string;
    checking: boolean;
  }>;
  alerts: Array<{
    id: string;
    title: string;
    message: string;
    severity: string;
    timestamp: string;
    acknowledged: boolean;
    dismissed: boolean;
  }>;
  logs: Array<{
    id: string;
    timestamp: string;
    level: string;
    service: string;
    message: string;
  }>;
  performanceMetrics: {
    apiResponseTime: number;
    dbQueryTime: number;
    cacheHitRate: number;
    activeConnections: number;
    queueLength: number;
    errorRate: number;
    requestsPerSecond: number;
    memoryUsage: number;
    diskUsage: number;
  };
  metricsHistory: {
    cpu: Array<{ timestamp: string; value: number }>;
    memory: Array<{ timestamp: string; value: number }>;
    disk: Array<{ timestamp: string; value: number }>;
  };
  isLoading: boolean;
  error: string | null;
}

export const useMonitoringStore = defineStore("monitoring", {
  state: (): MonitoringState => ({
    systemStatus: {
      overall: "unknown",
      lastUpdate: new Date().toISOString(),
      services: {},
    },
    systemMetrics: {
      cpu: 0,
      memory: 0,
      disk: 0,
      network: {
        incoming: 0,
        outgoing: 0,
      },
      load: {
        "1m": 0,
        "5m": 0,
        "15m": 0,
      },
    },
    serviceStatus: [
      {
        name: "API Server",
        status: "unknown",
        responseTime: 0,
        uptime: 0,
        lastCheck: new Date().toISOString(),
        error: "",
        checking: false,
      },
      {
        name: "Database",
        status: "unknown",
        responseTime: 0,
        uptime: 0,
        lastCheck: new Date().toISOString(),
        error: "",
        checking: false,
      },
      {
        name: "Redis Cache",
        status: "unknown",
        responseTime: 0,
        uptime: 0,
        lastCheck: new Date().toISOString(),
        error: "",
        checking: false,
      },
      {
        name: "WebSocket",
        status: "unknown",
        responseTime: 0,
        uptime: 0,
        lastCheck: new Date().toISOString(),
        error: "",
        checking: false,
      },
    ],
    alerts: [],
    logs: [],
    performanceMetrics: {
      apiResponseTime: 0,
      dbQueryTime: 0,
      cacheHitRate: 0,
      activeConnections: 0,
      queueLength: 0,
      errorRate: 0,
      requestsPerSecond: 0,
      memoryUsage: 0,
      diskUsage: 0,
    },
    metricsHistory: {
      cpu: [],
      memory: [],
      disk: [],
    },
    isLoading: false,
    error: null,
  }),

  getters: {
    // 获取系统健康状态
    systemHealth: (state) => {
      const healthyServices = state.serviceStatus.filter(
        (s) => s.status === "healthy",
      ).length;
      const totalServices = state.serviceStatus.length;
      return {
        score: totalServices > 0 ? (healthyServices / totalServices) * 100 : 0,
        status:
          healthyServices === totalServices
            ? "healthy"
            : healthyServices > 0
              ? "warning"
              : "error",
      };
    },

    // 获取活跃警报数量
    activeAlertsCount: (state) => {
      return state.alerts.filter((a) => !a.acknowledged && !a.dismissed).length;
    },

    // 获取严重警报数量
    criticalAlertsCount: (state) => {
      return state.alerts.filter(
        (a) => a.severity === "critical" && !a.acknowledged && !a.dismissed,
      ).length;
    },

    // 获取最近的系统事件
    recentEvents: (state) => {
      return [...state.alerts, ...state.logs]
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        .slice(0, 10);
    },

    // 检查是否有性能问题
    hasPerformanceIssues: (state) => {
      return (
        state.systemMetrics.cpu > 80 ||
        state.systemMetrics.memory > 80 ||
        state.systemMetrics.disk > 80 ||
        state.performanceMetrics.errorRate > 5 ||
        state.performanceMetrics.apiResponseTime > 1000
      );
    },

    // 获取系统负载状态
    loadStatus: (state) => {
      const load = state.systemMetrics.load;
      const cpuCores = 4; // 假设4核CPU

      return {
        "1m": load["1m"] / cpuCores,
        "5m": load["5m"] / cpuCores,
        "15m": load["15m"] / cpuCores,
        status:
          load["15m"] / cpuCores > 1
            ? "high"
            : load["5m"] / cpuCores > 0.8
              ? "medium"
              : "low",
      };
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

    // 获取系统状态
    async fetchSystemStatus() {
      try {
        this.setLoading(true);

        const response = await monitoringApi.getServiceStatus();
        this.systemStatus = {
          overall: "healthy",
          lastUpdate: new Date().toISOString(),
          services: response.data || {},
        };

        this.setError(null);
      } catch (error: any) {
        console.error("获取系统状态失败:", error);
        this.setError(error.message || "获取系统状态失败");
      } finally {
        this.setLoading(false);
      }
    },

    // 获取系统指标
    async fetchSystemMetrics() {
      try {
        const response = await monitoringApi.getResourceUsage();
        this.systemMetrics = response.data;

        // 更新历史数据
        this.updateMetricsHistory("cpu", response.data.cpu);
        this.updateMetricsHistory("memory", response.data.memory);
        this.updateMetricsHistory("disk", response.data.disk);

        this.setError(null);
      } catch (error: any) {
        console.error("获取系统指标失败:", error);
        this.setError(error.message || "获取系统指标失败");
      }
    },

    // 获取服务状态
    async fetchServiceStatus() {
      try {
        const response = await monitoringApi.getServiceStatus();
        this.serviceStatus = response.data.map((service) => ({
          ...service,
          checking: false,
        }));

        this.setError(null);
      } catch (error: any) {
        console.error("获取服务状态失败:", error);
        this.setError(error.message || "获取服务状态失败");
      }
    },

    // 获取警报
    async fetchAlerts() {
      try {
        const response = await monitoringApi.getAlerts();
        this.alerts = response.data.alerts || [];

        this.setError(null);
      } catch (error: any) {
        console.error("获取警报失败:", error);
        this.setError(error.message || "获取警报失败");
      }
    },

    // 获取日志
    async fetchLogs(level = "") {
      try {
        const params = level ? { level } : {};
        const response = await monitoringApi.getSystemLogs(params);
        this.logs = response.data.logs || [];

        this.setError(null);
      } catch (error: any) {
        console.error("获取日志失败:", error);
        this.setError(error.message || "获取日志失败");
      }
    },

    // 获取性能指标
    async fetchPerformanceMetrics() {
      try {
        const response = await get("/monitoring/performance");
        this.performanceMetrics = response.data;

        this.setError(null);
      } catch (error: any) {
        console.error("获取性能指标失败:", error);
        this.setError(error.response?.data?.message || "获取性能指标失败");
      }
    },

    // 获取指标历史
    async fetchMetricsHistory(metric: string, timeRange: string) {
      try {
        const response = await get(`/monitoring/metrics/${metric}/history`, {
          params: { timeRange },
        });

        this.metricsHistory[metric] = response.data;

        this.setError(null);
      } catch (error: any) {
        console.error("获取指标历史失败:", error);
        this.setError(error.response?.data?.message || "获取指标历史失败");
      }
    },

    // 检查所有服务
    async checkAllServices() {
      try {
        const promises = this.serviceStatus.map((service) =>
          this.checkService(service.name),
        );

        await Promise.all(promises);

        ElMessage.success("所有服务检查完成");
      } catch (error) {
        console.error("检查所有服务失败:", error);
        ElMessage.error("检查所有服务失败");
      }
    },

    // 检查单个服务
    async checkService(serviceName: string) {
      try {
        const service = this.serviceStatus.find((s) => s.name === serviceName);
        if (service) {
          service.checking = true;
        }

        const response = await post(
          `/monitoring/services/${serviceName}/check`,
        );

        // 更新服务状态
        const index = this.serviceStatus.findIndex(
          (s) => s.name === serviceName,
        );
        if (index !== -1) {
          this.serviceStatus[index] = {
            ...response.data,
            checking: false,
          };
        }

        this.setError(null);
      } catch (error: any) {
        console.error(`检查服务失败: ${serviceName}`, error);

        const index = this.serviceStatus.findIndex(
          (s) => s.name === serviceName,
        );
        if (index !== -1) {
          this.serviceStatus[index] = {
            ...this.serviceStatus[index],
            status: "error",
            error: error.response?.data?.message || "检查失败",
            checking: false,
          };
        }
      }
    },

    // 确认警报
    async acknowledgeAlert(alertId: string) {
      try {
        await post(`/monitoring/alerts/${alertId}/acknowledge`);

        const alert = this.alerts.find((a) => a.id === alertId);
        if (alert) {
          alert.acknowledged = true;
        }

        this.setError(null);
      } catch (error: any) {
        console.error("确认警报失败:", error);
        this.setError(error.response?.data?.message || "确认警报失败");
      }
    },

    // 忽略警报
    async dismissAlert(alertId: string) {
      try {
        await post(`/monitoring/alerts/${alertId}/dismiss`);

        const alert = this.alerts.find((a) => a.id === alertId);
        if (alert) {
          alert.dismissed = true;
        }

        this.setError(null);
      } catch (error: any) {
        console.error("忽略警报失败:", error);
        this.setError(error.response?.data?.message || "忽略警报失败");
      }
    },

    // 清空日志
    clearLogs() {
      this.logs = [];
      ElMessage.success("日志已清空");
    },

    // 导出监控报告
    async exportMonitoringReport() {
      try {
        const response = await monitoringApi.exportMonitoringData({
          type: "metrics",
          format: "csv",
          timeRange: "24h"
        });

        // 创建下载链接
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `monitoring_report_${new Date().toISOString().split("T")[0]}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        ElMessage.success("监控报告导出成功");
        this.setError(null);
      } catch (error: any) {
        console.error("导出监控报告失败:", error);
        this.setError(error.message || "导出监控报告失败");
      }
    },

    // 导出指标数据
    async exportMetrics() {
      try {
        const response = await get("/monitoring/export/metrics", {
          responseType: "blob",
        });

        // 创建下载链接
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `metrics_${new Date().toISOString().split("T")[0]}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        ElMessage.success("指标数据导出成功");
        this.setError(null);
      } catch (error: any) {
        console.error("导出指标数据失败:", error);
        this.setError(error.response?.data?.message || "导出指标数据失败");
      }
    },

    // 更新指标历史
    updateMetricsHistory(metric: string, value: number) {
      const history = this.metricsHistory[metric];
      const now = new Date().toISOString();

      // 添加新数据点
      history.push({ timestamp: now, value });

      // 保持最近1000个数据点
      if (history.length > 1000) {
        history.splice(0, history.length - 1000);
      }
    },

    // 重启服务
    async restartService(serviceName: string) {
      try {
        await post(`/monitoring/services/${serviceName}/restart`);
        ElMessage.success(`服务 ${serviceName} 重启成功`);

        // 重新检查服务状态
        await this.checkService(serviceName);
      } catch (error: any) {
        console.error(`重启服务失败: ${serviceName}`, error);
        this.setError(error.response?.data?.message || "重启服务失败");
      }
    },

    // 获取系统信息
    async getSystemInfo() {
      try {
        const response = await get("/monitoring/system-info");
        this.setError(null);

        return response.data;
      } catch (error: any) {
        console.error("获取系统信息失败:", error);
        this.setError(error.response?.data?.message || "获取系统信息失败");
      }
    },

    // 获取网络状态
    async getNetworkStatus() {
      try {
        const response = await get("/monitoring/network");
        this.setError(null);

        return response.data;
      } catch (error: any) {
        console.error("获取网络状态失败:", error);
        this.setError(error.response?.data?.message || "获取网络状态失败");
      }
    },

    // 获取存储状态
    async getStorageStatus() {
      try {
        const response = await get("/monitoring/storage");
        this.setError(null);

        return response.data;
      } catch (error: any) {
        console.error("获取存储状态失败:", error);
        this.setError(error.response?.data?.message || "获取存储状态失败");
      }
    },

    // 清理资源
    clearResources() {
      this.alerts = [];
      this.logs = [];
      this.metricsHistory = {
        cpu: [],
        memory: [],
        disk: [],
      };
      this.error = null;
    },
  },
});
