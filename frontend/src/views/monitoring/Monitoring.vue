<template>
  <div class="monitoring-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1>系统监控</h1>
          <p>实时监控系统状态和性能指标</p>
        </div>
        <div class="header-right">
          <el-button @click="refreshData">
            <el-icon><refresh /></el-icon>
            刷新数据
          </el-button>
          <el-button type="primary" @click="exportReport">
            <el-icon><download /></el-icon>
            导出报告
          </el-button>
        </div>
      </div>
    </div>

    <!-- 系统状态概览 -->
    <div class="overview-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="status-card">
            <div class="status-content">
              <div class="status-indicator" :class="systemStatus.overall">
                <el-icon><video-play /></el-icon>
              </div>
              <div class="status-info">
                <div class="status-title">系统状态</div>
                <div class="status-value">
                  {{ getStatusText(systemStatus.overall) }}
                </div>
                <div class="status-time">
                  更新于: {{ formatTime(systemStatus.lastUpdate) }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon cpu">
                <el-icon><cpu /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-title">CPU使用率</div>
                <div class="metric-value">{{ systemMetrics.cpu }}%</div>
                <div class="metric-chart">
                  <el-progress
                    :percentage="systemMetrics.cpu"
                    :color="getProgressColor(systemMetrics.cpu)"
                    :show-text="false"
                  />
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon memory">
                <el-icon><coin /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-title">内存使用</div>
                <div class="metric-value">{{ systemMetrics.memory }}%</div>
                <div class="metric-chart">
                  <el-progress
                    :percentage="systemMetrics.memory"
                    :color="getProgressColor(systemMetrics.memory)"
                    :show-text="false"
                  />
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon disk">
                <el-icon><document /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-title">磁盘使用</div>
                <div class="metric-value">{{ systemMetrics.disk }}%</div>
                <div class="metric-chart">
                  <el-progress
                    :percentage="systemMetrics.disk"
                    :color="getProgressColor(systemMetrics.disk)"
                    :show-text="false"
                  />
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 实时图表 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <h3>CPU使用率趋势</h3>
                <el-select
                  v-model="cpuTimeRange"
                  size="small"
                  @change="updateCpuChart"
                >
                  <el-option label="1小时" value="1h" />
                  <el-option label="6小时" value="6h" />
                  <el-option label="24小时" value="24h" />
                  <el-option label="7天" value="7d" />
                </el-select>
              </div>
            </template>
            <div class="chart-container">
              <div class="chart-placeholder">
                <el-empty description="图表开发中" :image-size="100" />
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <h3>内存使用趋势</h3>
                <el-select
                  v-model="memoryTimeRange"
                  size="small"
                  @change="updateMemoryChart"
                >
                  <el-option label="1小时" value="1h" />
                  <el-option label="6小时" value="6h" />
                  <el-option label="24小时" value="24h" />
                  <el-option label="7天" value="7d" />
                </el-select>
              </div>
            </template>
            <div class="chart-container">
              <div class="chart-placeholder">
                <el-empty description="图表开发中" :image-size="100" />
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 应用状态 -->
    <div class="app-status-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>应用状态</h3>
            <el-button @click="checkAllServices" size="small">
              检查所有服务
            </el-button>
          </div>
        </template>

        <el-table :data="serviceStatus" stripe>
          <el-table-column prop="name" label="服务名称" width="150" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getServiceStatusType(row.status)" size="small">
                {{ getServiceStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="responseTime" label="响应时间" width="120">
            <template #default="{ row }">
              <span v-if="row.responseTime">{{ row.responseTime }}ms</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="uptime" label="运行时间" width="150">
            <template #default="{ row }">
              <span v-if="row.uptime">{{ formatDuration(row.uptime) }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="lastCheck" label="最后检查" width="180">
            <template #default="{ row }">
              {{ formatTime(row.lastCheck) }}
            </template>
          </el-table-column>
          <el-table-column prop="error" label="错误信息">
            <template #default="{ row }">
              <span v-if="row.error" class="error-message">{{
                row.error
              }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button
                size="small"
                @click="checkService(row.name)"
                :loading="row.checking"
              >
                检查
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 警报和通知 -->
    <div class="alerts-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="alerts-card">
            <template #header>
              <div class="card-header">
                <h3>系统警报</h3>
                <el-badge :value="alerts.length" type="danger" />
              </div>
            </template>

            <div v-if="alerts.length === 0" class="empty-alerts">
              <el-empty description="暂无警报" :image-size="60" />
            </div>

            <div v-else class="alerts-list">
              <div
                v-for="alert in alerts"
                :key="alert.id"
                class="alert-item"
                :class="`alert-${alert.severity}`"
              >
                <div class="alert-header">
                  <div class="alert-title">
                    <el-icon :class="getAlertIcon(alert.severity)">
                      <warning />
                    </el-icon>
                    {{ alert.title }}
                  </div>
                  <div class="alert-time">
                    {{ formatTime(alert.timestamp) }}
                  </div>
                </div>
                <div class="alert-message">{{ alert.message }}</div>
                <div class="alert-actions">
                  <el-button size="small" @click="acknowledgeAlert(alert.id)">
                    确认
                  </el-button>
                  <el-button size="small" @click="dismissAlert(alert.id)">
                    忽略
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card class="logs-card">
            <template #header>
              <div class="card-header">
                <h3>系统日志</h3>
                <div class="header-actions">
                  <el-select
                    v-model="logLevel"
                    size="small"
                    @change="updateLogs"
                  >
                    <el-option label="全部" value="" />
                    <el-option label="错误" value="error" />
                    <el-option label="警告" value="warning" />
                    <el-option label="信息" value="info" />
                  </el-select>
                  <el-button @click="clearLogs" size="small">清空</el-button>
                </div>
              </div>
            </template>

            <div class="logs-container">
              <div v-if="logs.length === 0" class="no-logs">
                <el-empty description="暂无日志" :image-size="60" />
              </div>

              <div v-else class="logs-list">
                <div
                  v-for="log in logs"
                  :key="log.id"
                  class="log-item"
                  :class="`log-${log.level}`"
                >
                  <div class="log-meta">
                    <span class="log-time">{{
                      formatTime(log.timestamp)
                    }}</span>
                    <el-tag :type="getLogType(log.level)" size="small">
                      {{ log.level.toUpperCase() }}
                    </el-tag>
                    <span class="log-service">{{ log.service }}</span>
                  </div>
                  <div class="log-message">{{ log.message }}</div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 性能指标详情 -->
    <div class="metrics-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>性能指标详情</h3>
            <el-button @click="exportMetrics" size="small">
              导出指标
            </el-button>
          </div>
        </template>

        <el-descriptions :column="3" border>
          <el-descriptions-item label="API响应时间">
            {{ performanceMetrics.apiResponseTime }}ms
          </el-descriptions-item>
          <el-descriptions-item label="数据库查询时间">
            {{ performanceMetrics.dbQueryTime }}ms
          </el-descriptions-item>
          <el-descriptions-item label="缓存命中率">
            {{ performanceMetrics.cacheHitRate }}%
          </el-descriptions-item>
          <el-descriptions-item label="活跃连接数">
            {{ performanceMetrics.activeConnections }}
          </el-descriptions-item>
          <el-descriptions-item label="队列长度">
            {{ performanceMetrics.queueLength }}
          </el-descriptions-item>
          <el-descriptions-item label="错误率">
            {{ performanceMetrics.errorRate }}%
          </el-descriptions-item>
          <el-descriptions-item label="每秒请求数">
            {{ performanceMetrics.requestsPerSecond }}
          </el-descriptions-item>
          <el-descriptions-item label="内存使用量">
            {{ formatBytes(performanceMetrics.memoryUsage) }}
          </el-descriptions-item>
          <el-descriptions-item label="磁盘使用量">
            {{ formatBytes(performanceMetrics.diskUsage) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import {
  Refresh,
  Download,
  VideoPlay,
  Cpu,
  Coin,
  Document,
  Warning,
} from "@element-plus/icons-vue";
import { useMonitoringStore } from "@/stores/monitoring";

const monitoringStore = useMonitoringStore();

// 响应式数据
const cpuTimeRange = ref("1h");
const memoryTimeRange = ref("1h");
const logLevel = ref("");
let refreshInterval: any = null;

// 计算属性
const systemStatus = computed(() => monitoringStore.systemStatus);
const systemMetrics = computed(() => monitoringStore.systemMetrics);
const serviceStatus = computed(() => monitoringStore.serviceStatus);
const alerts = computed(() => monitoringStore.alerts);
const logs = computed(() => monitoringStore.logs);
const performanceMetrics = computed(() => monitoringStore.performanceMetrics);

// 方法
const refreshData = async () => {
  try {
    await monitoringStore.fetchSystemStatus();
    await monitoringStore.fetchSystemMetrics();
    await monitoringStore.fetchServiceStatus();
    await monitoringStore.fetchAlerts();
    await monitoringStore.fetchLogs();
    ElMessage.success("数据刷新成功");
  } catch (error) {
    console.error("刷新数据失败:", error);
    ElMessage.error("刷新数据失败");
  }
};

const updateCpuChart = () => {
  // 更新CPU图表
  monitoringStore.fetchMetricsHistory("cpu", cpuTimeRange.value);
};

const updateMemoryChart = () => {
  // 更新内存图表
  monitoringStore.fetchMetricsHistory("memory", memoryTimeRange.value);
};

const checkAllServices = async () => {
  try {
    await monitoringStore.checkAllServices();
    ElMessage.success("服务检查完成");
  } catch (error) {
    console.error("检查服务失败:", error);
    ElMessage.error("检查服务失败");
  }
};

const checkService = async (serviceName: string) => {
  try {
    await monitoringStore.checkService(serviceName);
  } catch (error) {
    console.error("检查服务失败:", error);
  }
};

const acknowledgeAlert = async (alertId: string) => {
  try {
    await monitoringStore.acknowledgeAlert(alertId);
    ElMessage.success("警报已确认");
  } catch (error) {
    console.error("确认警报失败:", error);
  }
};

const dismissAlert = async (alertId: string) => {
  try {
    await monitoringStore.dismissAlert(alertId);
    ElMessage.success("警报已忽略");
  } catch (error) {
    console.error("忽略警报失败:", error);
  }
};

const updateLogs = () => {
  monitoringStore.fetchLogs(logLevel.value);
};

const clearLogs = () => {
  monitoringStore.clearLogs();
};

const exportReport = async () => {
  try {
    await monitoringStore.exportMonitoringReport();
    ElMessage.success("报告导出成功");
  } catch (error) {
    console.error("导出报告失败:", error);
    ElMessage.error("导出报告失败");
  }
};

const exportMetrics = async () => {
  try {
    await monitoringStore.exportMetrics();
    ElMessage.success("指标导出成功");
  } catch (error) {
    console.error("导出指标失败:", error);
    ElMessage.error("导出指标失败");
  }
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    healthy: "健康",
    warning: "警告",
    error: "错误",
    unknown: "未知",
  };
  return texts[status] || status;
};

const getProgressColor = (percentage: number) => {
  if (percentage < 50) return "#67c23a";
  if (percentage < 80) return "#e6a23c";
  return "#f56c6c";
};

const getServiceStatusType = (status: string) => {
  const types: Record<string, string> = {
    healthy: "success",
    warning: "warning",
    error: "danger",
    unknown: "info",
  };
  return types[status] || "info";
};

const getServiceStatusText = (status: string) => {
  const texts: Record<string, string> = {
    healthy: "正常",
    warning: "警告",
    error: "错误",
    unknown: "未知",
  };
  return texts[status] || status;
};

const getAlertIcon = (severity: string) => {
  return severity === "critical" ? "error" : "warning";
};

const getLogType = (level: string) => {
  const types: Record<string, string> = {
    error: "danger",
    warning: "warning",
    info: "info",
    debug: "info",
  };
  return types[level] || "info";
};

const formatTime = (timeString: string) => {
  return new Date(timeString).toLocaleString("zh-CN");
};

const formatDuration = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}天${hours}小时`;
  } else if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  } else {
    return `${minutes}分钟`;
  }
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 自动刷新
const startAutoRefresh = () => {
  refreshInterval = setInterval(async () => {
    await monitoringStore.fetchSystemMetrics();
    await monitoringStore.fetchLogs();
  }, 30000); // 30秒刷新一次
};

const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

// 生命周期
onMounted(async () => {
  try {
    await refreshData();
    startAutoRefresh();
  } catch (error) {
    console.error("初始化监控数据失败:", error);
  }
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style scoped>
.monitoring-container {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  background: var(--bg-primary);
}

.page-header {
  margin-bottom: 24px;
  padding: 16px 20px;
  background: var(--surface-elevated);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal) var(--ease-out);
}

.page-header:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left h1 {
  margin: 0 0 8px 0;
  font-size: var(--font-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.header-left p {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-base);
}

.header-right {
  display: flex;
  gap: 12px;
}

.overview-section,
.charts-section,
.app-status-section,
.alerts-section,
.metrics-section {
  margin-bottom: 24px;
}

.status-card,
.metric-card {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  background: var(--surface-elevated);
  border: 1px solid var(--border-primary);
  transition: all var(--transition-normal) var(--ease-out);
}

.status-card:hover,
.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.status-content,
.metric-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-indicator {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.status-indicator.healthy {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.status-indicator.warning {
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
}

.status-indicator.error {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
}

.status-indicator.unknown {
  background: linear-gradient(135deg, #909399 0%, #a6a9ad 100%);
}

.status-info,
.metric-info {
  flex: 1;
}

.status-title,
.metric-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.status-value,
.metric-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.status-time {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

.metric-chart {
  margin-top: 8px;
}

.metric-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.metric-icon.cpu {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.metric-icon.memory {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.metric-icon.disk {
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
}

.chart-card {
  height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.chart-container {
  height: 320px;
}

.chart-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.logs-container {
  max-height: 400px;
  overflow-y: auto;
}

.empty-alerts,
.no-logs {
  padding: 40px;
  text-align: center;
}

.alerts-list,
.logs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-item {
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid;
}

.alert-critical {
  border-left-color: #f56c6c;
  background-color: #fef2f2;
}

.alert-warning {
  border-left-color: #e6a23c;
  background-color: #fffbeb;
}

.alert-info {
  border-left-color: #409eff;
  background-color: #eff6ff;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.alert-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #333;
}

.alert-time {
  font-size: 12px;
  color: #666;
}

.alert-message {
  color: #666;
  margin-bottom: 8px;
}

.alert-actions {
  display: flex;
  gap: 8px;
}

.log-item {
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 3px solid;
  margin-bottom: 4px;
}

.log-error {
  border-left-color: #f56c6c;
  background-color: #fef2f2;
}

.log-warning {
  border-left-color: #e6a23c;
  background-color: #fffbeb;
}

.log-info {
  border-left-color: #409eff;
  background-color: #eff6ff;
}

.log-debug {
  border-left-color: #909399;
  background-color: #f3f4f6;
}

.log-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.log-time {
  font-size: 12px;
  color: #666;
}

.log-service {
  font-size: 12px;
  color: #888;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
}

.log-message {
  color: #333;
  font-size: 14px;
}

.error-message {
  color: #f56c6c;
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .monitoring-container {
    padding: 10px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .overview-section .el-col {
    margin-bottom: 16px;
  }

  .charts-section .el-col {
    margin-bottom: 16px;
  }

  .alerts-section .el-col {
    margin-bottom: 16px;
  }

  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
