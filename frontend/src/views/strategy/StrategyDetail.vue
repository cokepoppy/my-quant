<template>
  <div class="strategy-detail-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1>{{ strategy?.name || "策略详情" }}</h1>
          <p>{{ strategy?.description || "加载中..." }}</p>
        </div>
        <div class="header-right">
          <el-button @click="backToList">
            <el-icon><arrow-left /></el-icon>
            返回列表
          </el-button>
          <el-button type="primary" @click="editStrategy">
            <el-icon><edit /></el-icon>
            编辑策略
          </el-button>
          <el-dropdown @command="handleAction">
            <el-button>
              操作
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="duplicate"
                  >复制策略</el-dropdown-item
                >
                <el-dropdown-item command="export">导出策略</el-dropdown-item>
                <el-dropdown-item command="logs">查看日志</el-dropdown-item>
                <el-dropdown-item divided command="delete" class="text-danger">
                  删除策略
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 策略基本信息 -->
    <div v-if="strategy" class="strategy-info-section">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card>
            <template #header>
              <span>基本信息</span>
            </template>
            <div class="info-item">
              <label>策略类型</label>
              <span>{{ getTypeText(strategy.type) }}</span>
            </div>
            <div class="info-item">
              <label>编程语言</label>
              <span>{{ strategy.language }}</span>
            </div>
            <div class="info-item">
              <label>创建时间</label>
              <span>{{ formatDate(strategy.createdAt) }}</span>
            </div>
            <div class="info-item">
              <label>最后更新</label>
              <span>{{ formatDate(strategy.updatedAt) }}</span>
            </div>
            <div class="info-item" v-if="strategy.lastRunAt">
              <label>最后运行</label>
              <span>{{ formatDate(strategy.lastRunAt) }}</span>
            </div>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card>
            <template #header>
              <span>状态控制</span>
            </template>
            <div class="status-control">
              <div class="status-indicator">
                <el-tag :type="getStatusType(strategy.status)" size="large">
                  {{ getStatusText(strategy.status) }}
                </el-tag>
              </div>
              <div class="control-buttons">
                <el-button
                  v-if="strategy.status === 'active'"
                  type="warning"
                  @click="stopStrategy"
                  :loading="loading"
                >
                  <el-icon><video-pause /></el-icon>
                  停止策略
                </el-button>
                <el-button
                  v-else-if="
                    strategy.status === 'stopped' || strategy.status === 'draft'
                  "
                  type="success"
                  @click="startStrategy"
                  :loading="loading"
                >
                  <el-icon><video-play /></el-icon>
                  启动策略
                </el-button>
                <el-button
                  v-else-if="strategy.status === 'error'"
                  type="primary"
                  @click="startStrategy"
                  :loading="loading"
                >
                  <el-icon><refresh-right /></el-icon>
                  重启策略
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card>
            <template #header>
              <span>性能概览</span>
            </template>
            <div v-if="strategy.performance" class="performance-overview">
              <div class="performance-item">
                <label>总收益</label>
                <span
                  :class="getPerformanceClass(strategy.performance.totalReturn)"
                >
                  {{ formatPercent(strategy.performance.totalReturn) }}
                </span>
              </div>
              <div class="performance-item">
                <label>年化收益</label>
                <span
                  :class="
                    getPerformanceClass(strategy.performance.annualizedReturn)
                  "
                >
                  {{ formatPercent(strategy.performance.annualizedReturn) }}
                </span>
              </div>
              <div class="performance-item">
                <label>夏普比率</label>
                <span>{{ strategy.performance.sharpeRatio.toFixed(2) }}</span>
              </div>
              <div class="performance-item">
                <label>最大回撤</label>
                <span class="negative">
                  {{ formatPercent(strategy.performance.maxDrawdown) }}
                </span>
              </div>
            </div>
            <div v-else class="no-performance">
              <el-empty description="暂无性能数据" :image-size="60" />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 标签页 -->
    <div class="tabs-section">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <el-tab-pane label="策略代码" name="code">
          <el-card>
            <div class="code-container">
              <div class="code-header">
                <h3>策略代码</h3>
                <div class="code-actions">
                  <el-button @click="copyCode">
                    <el-icon><document-copy /></el-icon>
                    复制代码
                  </el-button>
                  <el-button @click="validateCode">
                    <el-icon><check /></el-icon>
                    验证代码
                  </el-button>
                </div>
              </div>
              <el-input
                v-model="strategy.code"
                type="textarea"
                :rows="25"
                readonly
                class="code-editor"
              />
            </div>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="策略参数" name="parameters">
          <el-card>
            <div class="parameters-container">
              <h3>策略参数</h3>
              <el-table :data="strategy.parameters" stripe>
                <el-table-column prop="name" label="参数名" width="150" />
                <el-table-column prop="type" label="类型" width="100">
                  <template #default="{ row }">
                    <el-tag size="small">{{ row.type }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="value" label="当前值" width="120" />
                <el-table-column prop="description" label="描述" />
                <el-table-column prop="required" label="必填" width="80">
                  <template #default="{ row }">
                    <el-tag
                      :type="row.required ? 'success' : 'info'"
                      size="small"
                    >
                      {{ row.required ? "是" : "否" }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="范围" width="120">
                  <template #default="{ row }">
                    <span
                      v-if="
                        row.type === 'number' &&
                        row.min !== undefined &&
                        row.max !== undefined
                      "
                    >
                      {{ row.min }} - {{ row.max }}
                    </span>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="交易配置" name="config">
          <el-card>
            <div class="config-container">
              <h3>交易配置</h3>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="交易标的">
                  <el-tag
                    v-for="symbol in strategy.config.symbols"
                    :key="symbol"
                    size="small"
                    class="config-tag"
                  >
                    {{ symbol }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="时间周期">
                  {{ strategy.config.timeframe }}
                </el-descriptions-item>
                <el-descriptions-item label="交易所">
                  {{ strategy.config.execution.exchange }}
                </el-descriptions-item>
                <el-descriptions-item label="账户类型">
                  {{ strategy.config.execution.accountType }}
                </el-descriptions-item>
                <el-descriptions-item label="杠杆倍数">
                  {{ strategy.config.execution.leverage }}x
                </el-descriptions-item>
                <el-descriptions-item label="滑点">
                  {{ strategy.config.execution.slippage }}%
                </el-descriptions-item>
              </el-descriptions>

              <h4>风险管理</h4>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="最大持仓">
                  {{ strategy.config.riskManagement.maxPositionSize }}%
                </el-descriptions-item>
                <el-descriptions-item label="最大回撤">
                  {{ strategy.config.riskManagement.maxDrawdown }}%
                </el-descriptions-item>
                <el-descriptions-item label="止损比例">
                  {{ strategy.config.riskManagement.stopLoss }}%
                </el-descriptions-item>
                <el-descriptions-item label="止盈比例">
                  {{ strategy.config.riskManagement.takeProfit }}%
                </el-descriptions-item>
                <el-descriptions-item label="单笔风险">
                  {{ strategy.config.riskManagement.riskPerTrade }}%
                </el-descriptions-item>
                <el-descriptions-item label="最大相关性">
                  {{ strategy.config.riskManagement.maxCorrelation }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="性能分析" name="performance">
          <el-card>
            <div class="performance-container">
              <div class="performance-header">
                <h3>性能分析</h3>
                <el-button
                  @click="refreshPerformance"
                  :loading="performanceLoading"
                >
                  <el-icon><refresh /></el-icon>
                  刷新数据
                </el-button>
              </div>

              <div v-if="strategy.performance" class="performance-content">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <div class="metric-card">
                      <div class="metric-title">总收益</div>
                      <div
                        class="metric-value"
                        :class="
                          getPerformanceClass(strategy.performance.totalReturn)
                        "
                      >
                        {{ formatPercent(strategy.performance.totalReturn) }}
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="metric-card">
                      <div class="metric-title">年化收益</div>
                      <div
                        class="metric-value"
                        :class="
                          getPerformanceClass(
                            strategy.performance.annualizedReturn,
                          )
                        "
                      >
                        {{
                          formatPercent(strategy.performance.annualizedReturn)
                        }}
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="metric-card">
                      <div class="metric-title">夏普比率</div>
                      <div class="metric-value">
                        {{ strategy.performance.sharpeRatio.toFixed(2) }}
                      </div>
                    </div>
                  </el-col>
                </el-row>

                <el-row :gutter="20" class="metrics-row">
                  <el-col :span="6">
                    <div class="metric-card">
                      <div class="metric-title">胜率</div>
                      <div class="metric-value">
                        {{ formatPercent(strategy.performance.winRate) }}
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="metric-card">
                      <div class="metric-title">盈亏比</div>
                      <div class="metric-value">
                        {{ strategy.performance.profitFactor.toFixed(2) }}
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="metric-card">
                      <div class="metric-title">总交易次数</div>
                      <div class="metric-value">
                        {{ strategy.performance.totalTrades }}
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="metric-card">
                      <div class="metric-title">平均交易收益</div>
                      <div
                        class="metric-value"
                        :class="
                          getPerformanceClass(strategy.performance.averageTrade)
                        "
                      >
                        {{ formatPercent(strategy.performance.averageTrade) }}
                      </div>
                    </div>
                  </el-col>
                </el-row>

                <div class="charts-section">
                  <h4>收益曲线</h4>
                  <div class="chart-placeholder">
                    <el-empty description="图表开发中" :image-size="100" />
                  </div>
                </div>
              </div>
              <div v-else class="no-performance">
                <el-empty description="暂无性能数据" :image-size="80">
                  <el-button type="primary" @click="startStrategy">
                    启动策略开始交易
                  </el-button>
                </el-empty>
              </div>
            </div>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="运行日志" name="logs">
          <el-card>
            <div class="logs-container">
              <div class="logs-header">
                <h3>运行日志</h3>
                <div class="logs-actions">
                  <el-select
                    v-model="logLevel"
                    placeholder="日志级别"
                    size="small"
                  >
                    <el-option label="全部" value="" />
                    <el-option label="错误" value="error" />
                    <el-option label="警告" value="warning" />
                    <el-option label="信息" value="info" />
                    <el-option label="调试" value="debug" />
                  </el-select>
                  <el-button @click="refreshLogs" :loading="logsLoading">
                    <el-icon><refresh /></el-icon>
                    刷新
                  </el-button>
                </div>
              </div>

              <div class="logs-content">
                <div v-if="logs.length === 0" class="no-logs">
                  <el-empty description="暂无日志" :image-size="60" />
                </div>
                <div v-else class="log-list">
                  <div
                    v-for="log in logs"
                    :key="log.id"
                    class="log-item"
                    :class="`log-${log.level}`"
                  >
                    <div class="log-meta">
                      <span class="log-time">{{
                        formatDate(log.timestamp)
                      }}</span>
                      <el-tag :type="getLogType(log.level)" size="small">
                        {{ log.level.toUpperCase() }}
                      </el-tag>
                    </div>
                    <div class="log-message">{{ log.message }}</div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowLeft,
  Edit,
  ArrowDown,
  VideoPlay,
  VideoPause,
  RefreshRight,
  DocumentCopy,
  Check,
  Refresh,
} from "@element-plus/icons-vue";
import { useStrategyStore } from "@/stores/strategy";
import type { Strategy } from "@/types/strategy";

const route = useRoute();
const router = useRouter();
const strategyStore = useStrategyStore();

// 响应式数据
const strategy = computed(() => strategyStore.currentStrategy);
const isLoading = computed(() => strategyStore.isLoading);
const activeTab = ref("code");
const performanceLoading = ref(false);
const logsLoading = ref(false);
const logLevel = ref("");
const logs = ref<any[]>([]);

// 方法
const backToList = () => {
  router.push("/strategies");
};

const editStrategy = () => {
  router.push(`/strategies/${route.params.id}/edit`);
};

const startStrategy = async () => {
  try {
    await strategyStore.startStrategyById(route.params.id as string);
  } catch (error) {
    console.error("启动策略失败:", error);
  }
};

const stopStrategy = async () => {
  try {
    await strategyStore.stopStrategyById(route.params.id as string);
  } catch (error) {
    console.error("停止策略失败:", error);
  }
};

const handleAction = (command: string) => {
  switch (command) {
    case "duplicate":
      duplicateStrategy();
      break;
    case "export":
      exportStrategy();
      break;
    case "logs":
      activeTab.value = "logs";
      break;
    case "delete":
      deleteStrategy();
      break;
  }
};

const duplicateStrategy = async () => {
  try {
    const newStrategy = {
      ...strategy.value,
      name: `${strategy.value.name} (复制)`,
      status: "draft" as const,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      lastRunAt: undefined,
    };
    await strategyStore.createNewStrategy(newStrategy);
    ElMessage.success("策略复制成功");
  } catch (error) {
    console.error("复制策略失败:", error);
  }
};

const exportStrategy = () => {
  const dataStr = JSON.stringify(strategy.value, null, 2);
  const dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

  const exportFileDefaultName = `${strategy.value.name}.json`;

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", exportFileDefaultName);
  linkElement.click();
};

const deleteStrategy = async () => {
  try {
    await ElMessageBox.confirm(
      "确定要删除这个策略吗？此操作不可撤销。",
      "删除策略",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    await strategyStore.deleteStrategyById(route.params.id as string);
    ElMessage.success("策略删除成功");
    router.push("/strategies");
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除策略失败:", error);
    }
  }
};

const copyCode = () => {
  navigator.clipboard
    .writeText(strategy.value.code)
    .then(() => {
      ElMessage.success("代码已复制到剪贴板");
    })
    .catch(() => {
      ElMessage.error("复制失败");
    });
};

const validateCode = async () => {
  try {
    const result = await strategyStore.validateStrategyCode({
      code: strategy.value.code,
      language: strategy.value.language,
      type: strategy.value.type,
    });

    if (result.isValid) {
      ElMessage.success("代码验证通过");
    } else {
      ElMessage.error("代码验证失败: " + result.errors.join(", "));
    }
  } catch (error) {
    console.error("验证代码失败:", error);
    ElMessage.error("验证代码失败");
  }
};

const handleTabClick = (tab: any) => {
  if (tab.props.name === "logs") {
    refreshLogs();
  } else if (tab.props.name === "performance") {
    refreshPerformance();
  }
};

const refreshPerformance = async () => {
  try {
    performanceLoading.value = true;
    await strategyStore.fetchStrategyPerformance(route.params.id as string);
  } catch (error) {
    console.error("获取性能数据失败:", error);
  } finally {
    performanceLoading.value = false;
  }
};

const refreshLogs = async () => {
  try {
    logsLoading.value = true;
    const result = await strategyStore.fetchStrategyLogs(
      route.params.id as string,
      {
        level: logLevel.value,
      },
    );
    logs.value = result.logs || [];
  } catch (error) {
    console.error("获取日志失败:", error);
  } finally {
    logsLoading.value = false;
  }
};

const getTypeText = (type: string) => {
  const types: Record<string, string> = {
    trend: "趋势策略",
    momentum: "动量策略",
    mean_reversion: "均值回归策略",
    arbitrage: "套利策略",
    custom: "自定义策略",
  };
  return types[type] || type;
};

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    active: "success",
    draft: "info",
    stopped: "warning",
    error: "danger",
  };
  return types[status] || "info";
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    active: "运行中",
    draft: "草稿",
    stopped: "已停止",
    error: "错误",
  };
  return texts[status] || status;
};

const getPerformanceClass = (value: number) => {
  return value > 0 ? "positive" : value < 0 ? "negative" : "";
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

const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(2)}%`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("zh-CN");
};

// 生命周期
onMounted(async () => {
  try {
    await strategyStore.fetchStrategyById(route.params.id as string);
  } catch (error) {
    console.error("获取策略详情失败:", error);
    ElMessage.error("获取策略详情失败");
  }
});
</script>

<style scoped>
.strategy-detail-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

.header-left p {
  margin: 0;
  color: #666;
  font-size: 16px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.strategy-info-section {
  margin-bottom: 30px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item label {
  font-weight: 500;
  color: #666;
}

.info-item span {
  color: #333;
}

.status-control {
  text-align: center;
}

.status-indicator {
  margin-bottom: 16px;
}

.control-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.performance-overview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.performance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.performance-item:last-child {
  border-bottom: none;
}

.performance-item label {
  font-weight: 500;
  color: #666;
}

.performance-item span {
  font-weight: 600;
}

.positive {
  color: #67c23a;
}

.negative {
  color: #f56c6c;
}

.no-performance {
  text-align: center;
  padding: 20px;
}

.tabs-section {
  margin-bottom: 30px;
}

.code-container {
  margin-bottom: 20px;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.code-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.code-actions {
  display: flex;
  gap: 8px;
}

.code-editor {
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 14px;
}

.parameters-container,
.config-container {
  margin-bottom: 20px;
}

.parameters-container h3,
.config-container h3,
.config-container h4 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.config-container h4 {
  font-size: 16px;
  margin-top: 24px;
}

.config-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

.performance-container {
  margin-bottom: 20px;
}

.performance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.performance-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.performance-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.metric-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.metric-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.metrics-row {
  margin-top: 16px;
}

.charts-section {
  margin-top: 24px;
}

.charts-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.chart-placeholder {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
}

.logs-container {
  margin-bottom: 20px;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.logs-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.logs-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.logs-content {
  max-height: 400px;
  overflow-y: auto;
}

.no-logs {
  text-align: center;
  padding: 40px;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-item {
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #e9ecef;
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

.log-message {
  color: #333;
  font-size: 14px;
  line-height: 1.4;
}

.text-danger {
  color: #f56c6c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .strategy-detail-container {
    padding: 10px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
    justify-content: flex-start;
  }

  .performance-overview,
  .metrics-row {
    flex-direction: column;
  }

  .performance-header,
  .logs-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .code-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style>
