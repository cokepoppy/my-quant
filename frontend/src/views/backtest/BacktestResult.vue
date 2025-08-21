<template>
  <div class="backtest-result">
    <div class="page-header">
      <h2>{{ backtest.strategyName }} - 回测结果</h2>
      <el-button @click="$router.go(-1)">返回</el-button>
    </div>

    <!-- 回测状态 -->
    <el-card class="mb-20">
      <template #header>
        <div class="card-header">
          <h3>回测状态</h3>
          <el-button
            v-if="backtest.status === 'running'"
            @click="stopBacktest"
            type="danger"
            >停止回测</el-button
          >
          <el-button
            v-else-if="backtest.status === 'completed'"
            @click="rerunBacktest"
            >重新运行</el-button
          >
        </div>
      </template>
      <div class="status-content">
        <div class="status-info">
          <el-tag :type="getStatusType(backtest.status)" size="large">
            {{ getStatusText(backtest.status) }}
          </el-tag>
          <div class="status-meta">
            <span>创建时间: {{ formatTime(backtest.createdAt) }}</span>
            <span v-if="backtest.completedAt"
              >完成时间: {{ formatTime(backtest.completedAt) }}</span
            >
            <span v-if="backtest.duration"
              >耗时: {{ formatDuration(backtest.duration) }}</span
            >
          </div>
        </div>
        <div v-if="backtest.status === 'running'" class="progress-section">
          <el-progress
            :percentage="backtest.progress || 0"
            :status="backtest.progress === 100 ? 'success' : 'active'"
          />
          <div class="progress-info">
            <span>进度: {{ backtest.progress || 0 }}%</span>
            <span>剩余时间: {{ backtest.remainingTime || "计算中..." }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 回测配置 -->
    <el-card class="mb-20">
      <template #header>
        <h3>回测配置</h3>
      </template>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="策略">{{
          backtest.strategyName
        }}</el-descriptions-item>
        <el-descriptions-item label="时间范围"
          >{{ formatDate(backtest.startDate) }} -
          {{ formatDate(backtest.endDate) }}</el-descriptions-item
        >
        <el-descriptions-item label="初始资金"
          >${{ backtest.initialCapital.toLocaleString() }}</el-descriptions-item
        >
        <el-descriptions-item label="数据频率">{{
          backtest.dataFrequency
        }}</el-descriptions-item>
        <el-descriptions-item label="基准">{{
          backtest.benchmark || "无"
        }}</el-descriptions-item>
        <el-descriptions-item label="杠杆倍数"
          >{{ backtest.leverage }}x</el-descriptions-item
        >
        <el-descriptions-item label="手续费率"
          >{{ (backtest.commission * 100).toFixed(3) }}%</el-descriptions-item
        >
        <el-descriptions-item label="滑点"
          >{{ (backtest.slippage * 100).toFixed(3) }}%</el-descriptions-item
        >
        <el-descriptions-item label="风险限制">{{
          backtest.riskLimits?.join(", ") || "无"
        }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 性能指标 -->
    <el-card v-if="backtest.results" class="mb-20">
      <template #header>
        <div class="card-header">
          <h3>性能指标</h3>
          <el-button @click="exportReport">导出报告</el-button>
        </div>
      </template>
      <div class="performance-grid">
        <div class="performance-section">
          <h4>收益指标</h4>
          <div class="metrics-grid">
            <div class="metric-item">
              <div class="metric-label">总收益率</div>
              <div
                class="metric-value"
                :class="
                  backtest.results.totalReturn >= 0 ? 'positive' : 'negative'
                "
              >
                {{ formatPercent(backtest.results.totalReturn) }}
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">年化收益率</div>
              <div
                class="metric-value"
                :class="
                  backtest.results.annualizedReturn >= 0
                    ? 'positive'
                    : 'negative'
                "
              >
                {{ formatPercent(backtest.results.annualizedReturn) }}
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">基准收益</div>
              <div
                class="metric-value"
                :class="
                  backtest.results.benchmarkReturn >= 0
                    ? 'positive'
                    : 'negative'
                "
              >
                {{ formatPercent(backtest.results.benchmarkReturn) }}
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">超额收益</div>
              <div
                class="metric-value"
                :class="
                  backtest.results.excessReturn >= 0 ? 'positive' : 'negative'
                "
              >
                {{ formatPercent(backtest.results.excessReturn) }}
              </div>
            </div>
          </div>
        </div>

        <div class="performance-section">
          <h4>风险指标</h4>
          <div class="metrics-grid">
            <div class="metric-item">
              <div class="metric-label">夏普比率</div>
              <div class="metric-value">
                {{ backtest.results.sharpeRatio.toFixed(2) }}
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">最大回撤</div>
              <div class="metric-value negative">
                {{ formatPercent(backtest.results.maxDrawdown) }}
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">波动率</div>
              <div class="metric-value">
                {{ formatPercent(backtest.results.volatility) }}
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">信息比率</div>
              <div class="metric-value">
                {{ backtest.results.informationRatio.toFixed(2) }}
              </div>
            </div>
          </div>
        </div>

        <div class="performance-section">
          <h4>交易指标</h4>
          <div class="metrics-grid">
            <div class="metric-item">
              <div class="metric-label">总交易次数</div>
              <div class="metric-value">{{ backtest.results.totalTrades }}</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">胜率</div>
              <div class="metric-value">
                {{ formatPercent(backtest.results.winRate) }}
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">平均收益</div>
              <div
                class="metric-value"
                :class="backtest.results.avgWin >= 0 ? 'positive' : 'negative'"
              >
                {{ formatCurrency(backtest.results.avgWin) }}
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">平均亏损</div>
              <div class="metric-value negative">
                {{ formatCurrency(backtest.results.avgLoss) }}
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">盈亏比</div>
              <div class="metric-value">
                {{ backtest.results.profitFactor.toFixed(2) }}
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">最大连续亏损</div>
              <div class="metric-value negative">
                {{ formatCurrency(backtest.results.maxConsecutiveLoss) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <!-- 收益曲线 -->
      <el-tab-pane label="收益曲线" name="equity">
        <el-card>
          <div class="chart-controls">
            <el-select v-model="chartType" placeholder="图表类型">
              <el-option label="收益曲线" value="equity" />
              <el-option label="回撤图" value="drawdown" />
              <el-option label="滚动夏普" value="rolling_sharpe" />
            </el-select>
            <el-button @click="refreshChart">刷新图表</el-button>
          </div>
          <div class="chart-container">
            <div class="chart-placeholder">
              <el-empty description="图表开发中" :image-size="100" />
            </div>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 交易记录 -->
      <el-tab-pane label="交易记录" name="trades">
        <el-card>
          <div class="trades-controls">
            <el-form :model="tradesFilter" inline>
              <el-form-item label="交易类型">
                <el-select
                  v-model="tradesFilter.type"
                  placeholder="选择类型"
                  clearable
                >
                  <el-option label="买入" value="buy" />
                  <el-option label="卖出" value="sell" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="filterTrades">筛选</el-button>
                <el-button @click="exportTrades">导出</el-button>
              </el-form-item>
            </el-form>
          </div>
          <el-table
            v-loading="tradesLoading"
            :data="filteredTrades"
            style="width: 100%"
            border
            height="400"
          >
            <el-table-column prop="timestamp" label="时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.timestamp) }}
              </template>
            </el-table-column>
            <el-table-column prop="symbol" label="交易对" width="100" />
            <el-table-column prop="type" label="类型" width="80">
              <template #default="{ row }">
                <el-tag
                  :type="row.type === 'buy' ? 'success' : 'danger'"
                  size="small"
                >
                  {{ row.type === "buy" ? "买入" : "卖出" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="price" label="价格" width="120" />
            <el-table-column prop="amount" label="数量" width="100" />
            <el-table-column prop="total" label="总额" width="120" />
            <el-table-column prop="fee" label="手续费" width="100" />
            <el-table-column prop="pnl" label="盈亏" width="120">
              <template #default="{ row }">
                <span :class="row.pnl >= 0 ? 'positive' : 'negative'">
                  {{ formatCurrency(row.pnl) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="cumulativePnl" label="累计盈亏" width="120">
              <template #default="{ row }">
                <span :class="row.cumulativePnl >= 0 ? 'positive' : 'negative'">
                  {{ formatCurrency(row.cumulativePnl) }}
                </span>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination">
            <el-pagination
              v-model:current-page="tradesPagination.page"
              v-model:page-size="tradesPagination.size"
              :page-sizes="[50, 100, 200, 500]"
              :total="tradesPagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleTradesSizeChange"
              @current-change="handleTradesCurrentChange"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 持仓记录 -->
      <el-tab-pane label="持仓记录" name="positions">
        <el-card>
          <div class="positions-controls">
            <el-button @click="refreshPositions">刷新</el-button>
            <el-button @click="exportPositions">导出</el-button>
          </div>
          <el-table
            v-loading="positionsLoading"
            :data="positions"
            style="width: 100%"
            border
            height="400"
          >
            <el-table-column prop="symbol" label="交易对" width="100" />
            <el-table-column prop="side" label="方向" width="80">
              <template #default="{ row }">
                <el-tag
                  :type="row.side === 'long' ? 'success' : 'danger'"
                  size="small"
                >
                  {{ row.side === "long" ? "多头" : "空头" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="entryTime" label="开仓时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.entryTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="exitTime" label="平仓时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.exitTime) || "持仓中" }}
              </template>
            </el-table-column>
            <el-table-column prop="entryPrice" label="开仓价" width="120" />
            <el-table-column prop="exitPrice" label="平仓价" width="120" />
            <el-table-column prop="size" label="数量" width="100" />
            <el-table-column prop="pnl" label="盈亏" width="120">
              <template #default="{ row }">
                <span :class="row.pnl >= 0 ? 'positive' : 'negative'">
                  {{ formatCurrency(row.pnl) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="return" label="收益率" width="120">
              <template #default="{ row }">
                <span :class="row.return >= 0 ? 'positive' : 'negative'">
                  {{ formatPercent(row.return) }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 日志记录 -->
      <el-tab-pane label="日志记录" name="logs">
        <el-card>
          <div class="logs-controls">
            <el-select v-model="logLevel" placeholder="日志级别">
              <el-option label="全部" value="" />
              <el-option label="错误" value="error" />
              <el-option label="警告" value="warning" />
              <el-option label="信息" value="info" />
              <el-option label="调试" value="debug" />
            </el-select>
            <el-button @click="refreshLogs">刷新</el-button>
            <el-button @click="exportLogs">导出</el-button>
          </div>
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
                  <span class="log-time">{{ formatTime(log.timestamp) }}</span>
                  <el-tag :type="getLogType(log.level)" size="small">
                    {{ log.level.toUpperCase() }}
                  </el-tag>
                </div>
                <div class="log-message">{{ log.message }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";

const router = useRouter();
const route = useRoute();

// 响应式数据
const activeTab = ref("equity");
const chartType = ref("equity");
const logLevel = ref("");
const tradesLoading = ref(false);
const positionsLoading = ref(false);
let statusUpdateInterval: any = null;

// 回测数据
const backtest = reactive({
  id: "1",
  strategyName: "BTC趋势跟踪策略",
  status: "completed",
  createdAt: "2024-01-15T10:00:00Z",
  completedAt: "2024-01-15T10:30:00Z",
  duration: 1800,
  progress: 100,
  remainingTime: "",
  startDate: "2024-01-01T00:00:00Z",
  endDate: "2024-01-15T00:00:00Z",
  initialCapital: 10000,
  dataFrequency: "1h",
  benchmark: "BTC/USDT",
  leverage: 1,
  commission: 0.001,
  slippage: 0.0005,
  riskLimits: ["maxDrawdown", "maxLoss"],
  results: {
    totalReturn: 0.1567,
    annualizedReturn: 0.2341,
    benchmarkReturn: 0.1234,
    excessReturn: 0.0333,
    sharpeRatio: 1.23,
    maxDrawdown: 0.0892,
    volatility: 0.1456,
    informationRatio: 0.89,
    totalTrades: 45,
    winRate: 0.6234,
    avgWin: 234.56,
    avgLoss: -123.45,
    profitFactor: 1.89,
    maxConsecutiveLoss: -567.89,
  },
});

// 交易记录
const trades = ref([
  {
    id: "1",
    timestamp: "2024-01-15T10:30:00Z",
    symbol: "BTC/USDT",
    type: "buy",
    price: "45000",
    amount: "0.1",
    total: "4500",
    fee: "4.5",
    pnl: "0",
    cumulativePnl: "0",
  },
  {
    id: "2",
    timestamp: "2024-01-15T11:00:00Z",
    symbol: "BTC/USDT",
    type: "sell",
    price: "45200",
    amount: "0.1",
    total: "4520",
    fee: "4.52",
    pnl: "15.48",
    cumulativePnl: "15.48",
  },
]);

const tradesFilter = reactive({
  type: "",
});

const tradesPagination = reactive({
  page: 1,
  size: 50,
  total: 2,
});

// 持仓记录
const positions = ref([
  {
    symbol: "BTC/USDT",
    side: "long",
    entryTime: "2024-01-15T10:30:00Z",
    exitTime: "2024-01-15T11:00:00Z",
    entryPrice: "45000",
    exitPrice: "45200",
    size: "0.1",
    pnl: "15.48",
    return: 0.0034,
  },
]);

// 日志记录
const logs = ref([
  {
    id: "1",
    timestamp: "2024-01-15T10:00:00Z",
    level: "info",
    message: "回测任务开始执行",
  },
  {
    id: "2",
    timestamp: "2024-01-15T10:30:00Z",
    level: "info",
    message: "数据加载完成",
  },
]);

// 计算属性
const filteredTrades = computed(() => {
  let filtered = trades.value;
  if (tradesFilter.type) {
    filtered = filtered.filter((trade) => trade.type === tradesFilter.type);
  }
  return filtered;
});

// 方法
const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    pending: "info",
    running: "warning",
    completed: "success",
    failed: "danger",
    cancelled: "info",
  };
  return types[status] || "info";
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: "等待中",
    running: "运行中",
    completed: "已完成",
    failed: "失败",
    cancelled: "已取消",
  };
  return texts[status] || status;
};

const formatTime = (timeString: string) => {
  return new Date(timeString).toLocaleString("zh-CN");
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("zh-CN");
};

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}分${remainingSeconds}秒`;
};

const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(2)}%`;
};

const formatCurrency = (value: number) => {
  return `$${value.toFixed(2)}`;
};

const stopBacktest = async () => {
  try {
    // TODO: 调用API停止回测
    await new Promise((resolve) => setTimeout(resolve, 1000));
    backtest.status = "cancelled";
    ElMessage.success("回测已停止");
  } catch (error) {
    ElMessage.error("停止回测失败");
  }
};

const rerunBacktest = () => {
  router.push(`/backtest?strategy=${backtest.strategyId}&rerun=${backtest.id}`);
};

const exportReport = async () => {
  try {
    // TODO: 导出回测报告
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ElMessage.success("报告导出成功");
  } catch (error) {
    ElMessage.error("导出失败");
  }
};

const handleTabClick = (tab: any) => {
  if (tab.props.name === "trades") {
    filterTrades();
  } else if (tab.props.name === "positions") {
    refreshPositions();
  } else if (tab.props.name === "logs") {
    refreshLogs();
  }
};

const refreshChart = () => {
  ElMessage.success("图表已刷新");
};

const filterTrades = () => {
  // 交易记录已通过计算属性过滤
  ElMessage.success("交易记录已筛选");
};

const exportTrades = async () => {
  try {
    // TODO: 导出交易记录
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ElMessage.success("交易记录导出成功");
  } catch (error) {
    ElMessage.error("导出失败");
  }
};

const handleTradesSizeChange = (size: number) => {
  tradesPagination.size = size;
  filterTrades();
};

const handleTradesCurrentChange = (page: number) => {
  tradesPagination.page = page;
  filterTrades();
};

const refreshPositions = async () => {
  positionsLoading.value = true;
  try {
    // TODO: 获取持仓记录
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ElMessage.success("持仓记录已刷新");
  } catch (error) {
    ElMessage.error("刷新失败");
  } finally {
    positionsLoading.value = false;
  }
};

const exportPositions = async () => {
  try {
    // TODO: 导出持仓记录
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ElMessage.success("持仓记录导出成功");
  } catch (error) {
    ElMessage.error("导出失败");
  }
};

const refreshLogs = async () => {
  try {
    // TODO: 获取日志记录
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ElMessage.success("日志记录已刷新");
  } catch (error) {
    ElMessage.error("刷新失败");
  }
};

const exportLogs = async () => {
  try {
    // TODO: 导出日志记录
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ElMessage.success("日志记录导出成功");
  } catch (error) {
    ElMessage.error("导出失败");
  }
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

// 自动更新状态
const startStatusUpdate = () => {
  statusUpdateInterval = setInterval(async () => {
    if (backtest.status === "running") {
      // TODO: 获取最新状态
      // await fetchBacktestStatus()
    }
  }, 5000);
};

const stopStatusUpdate = () => {
  if (statusUpdateInterval) {
    clearInterval(statusUpdateInterval);
    statusUpdateInterval = null;
  }
};

// 生命周期
onMounted(async () => {
  try {
    const backtestId = route.params.id as string;
    // TODO: 根据ID获取回测详情
    // await fetchBacktestDetails(backtestId)

    if (backtest.status === "running") {
      startStatusUpdate();
    }
  } catch (error) {
    ElMessage.error("获取回测详情失败");
  }
});

onUnmounted(() => {
  stopStatusUpdate();
});
</script>

<style scoped>
.backtest-result {
  padding: 20px;
  background: var(--gradient-primary);
  min-height: 100vh;
  position: relative;
}

.backtest-result::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 10% 20%, rgba(0, 122, 255, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 90% 80%, rgba(0, 212, 170, 0.05) 0%, transparent 50%);
  pointer-events: none;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  box-shadow: var(--shadow-glass);
  transition: all var(--transition-smooth) var(--transition-spring);
}

.page-header:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-premium-lg);
}

.page-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 28px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.mb-20 {
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}

/* 卡片样式 */
.el-card {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--radius-xl) !important;
  box-shadow: var(--shadow-glass) !important;
  transition: all var(--transition-smooth) var(--transition-spring) !important;
  position: relative;
  overflow: hidden !important;
}

.el-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.el-card:hover::before {
  left: 100%;
}

.el-card:hover {
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-premium-lg) !important;
  border-color: var(--border-glow-primary) !important;
}

.el-card__header {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(10px) !important;
  border-bottom: 1px solid var(--glass-border) !important;
  padding: var(--space-lg) !important;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-weight: var(--font-semibold);
  font-size: var(--font-xl);
}

.status-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.status-meta span {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

.progress-section {
  flex: 1;
  margin-left: 40px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

.performance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.performance-section h4 {
  margin: 0 0 20px 0;
  color: var(--text-primary);
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.metric-item {
  text-align: center;
  padding: 16px;
  background: var(--surface-elevated);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  transition: all var(--transition-smooth) var(--transition-spring);
  position: relative;
  overflow: hidden;
}

.metric-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
  transition: left 0.5s ease;
}

.metric-item:hover::before {
  left: 100%;
}

.metric-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--border-glow-primary);
}

.metric-label {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  margin-bottom: 8px;
  font-weight: var(--font-medium);
}

.metric-value {
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.positive {
  color: var(--market-up) !important;
  text-shadow: 0 0 8px rgba(0, 212, 170, 0.3);
}

.negative {
  color: var(--market-down) !important;
  text-shadow: 0 0 8px rgba(255, 59, 48, 0.3);
}

.chart-controls,
.trades-controls,
.positions-controls,
.logs-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
}

.chart-container {
  height: 400px;
  background: var(--surface-elevated);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: 20px;
}

.chart-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 表格样式 */
.el-table {
  background: transparent !important;
  color: var(--text-primary) !important;
  border-radius: var(--radius-lg) !important;
  overflow: hidden !important;
}

.el-table th {
  background: var(--surface-elevated) !important;
  backdrop-filter: blur(10px) !important;
  color: var(--text-secondary) !important;
  border-bottom: 1px solid var(--glass-border) !important;
  font-weight: var(--font-semibold) !important;
  font-size: var(--font-sm) !important;
  text-transform: uppercase !important;
  letter-spacing: 0.5px !important;
}

.el-table td {
  background: transparent !important;
  border-bottom: 1px solid var(--glass-border) !important;
  color: var(--text-primary) !important;
  font-weight: var(--font-normal) !important;
}

.el-table--enable-row-hover .el-table__body tr:hover > td {
  background: rgba(255, 255, 255, 0.05) !important;
  border-radius: var(--radius-sm) !important;
}

.el-table tr:last-child td {
  border-bottom: none !important;
}

/* 分页样式 */
.pagination {
  margin-top: 20px;
  text-align: right;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  box-shadow: var(--shadow-glass);
  transition: all var(--transition-smooth) var(--transition-spring);
}

.pagination:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-premium-lg);
}

.logs-container {
  max-height: 400px;
  overflow-y: auto;
}

.no-logs {
  padding: 40px;
  text-align: center;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.log-item {
  padding: 12px 16px;
  border-radius: var(--radius-md);
  border-left: 3px solid;
  background: var(--surface-elevated);
  transition: all var(--transition-smooth) var(--transition-spring);
}

.log-item:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.log-error {
  border-left-color: var(--market-down);
  background: rgba(255, 59, 48, 0.05);
}

.log-warning {
  border-left-color: var(--market-volatile);
  background: rgba(255, 149, 0, 0.05);
}

.log-info {
  border-left-color: var(--btn-primary);
  background: rgba(0, 122, 255, 0.05);
}

.log-debug {
  border-left-color: var(--text-secondary);
  background: rgba(144, 147, 153, 0.05);
}

.log-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.log-time {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

.log-message {
  color: var(--text-primary);
  font-size: var(--font-base);
}

/* 标签样式 */
.el-tag {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--radius-lg) !important;
  color: var(--text-primary) !important;
  font-weight: var(--font-semibold) !important;
  transition: all var(--transition-smooth) var(--transition-spring) !important;
}

.el-tag:hover {
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-md) !important;
}

.el-tag--success {
  background: rgba(0, 212, 170, 0.2) !important;
  border-color: var(--market-up) !important;
  color: var(--market-up) !important;
}

.el-tag--danger {
  background: rgba(255, 59, 48, 0.2) !important;
  border-color: var(--market-down) !important;
  color: var(--market-down) !important;
}

.el-tag--warning {
  background: rgba(255, 149, 0, 0.2) !important;
  border-color: var(--market-volatile) !important;
  color: var(--market-volatile) !important;
}

.el-tag--info {
  background: rgba(0, 122, 255, 0.2) !important;
  border-color: var(--btn-primary) !important;
  color: var(--btn-primary) !important;
}

/* 按钮样式 */
.el-button {
  background: var(--gradient-glass) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--radius-lg) !important;
  font-weight: var(--font-semibold) !important;
  color: var(--text-primary) !important;
  transition: all var(--transition-smooth) var(--transition-spring) !important;
  position: relative !important;
  overflow: hidden !important;
}

.el-button::before {
  content: '' !important;
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  width: 0 !important;
  height: 0 !important;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%) !important;
  transition: all 0.5s ease !important;
  transform: translate(-50%, -50%) !important;
}

.el-button:hover::before {
  width: 300px !important;
  height: 300px !important;
}

.el-button:hover {
  transform: translateY(-2px) !important;
  box-shadow: var(--glow-primary) !important;
  border-color: var(--border-glow-primary) !important;
}

.el-button--primary {
  background: var(--btn-primary) !important;
  border-color: var(--btn-primary) !important;
  color: white !important;
}

.el-button--primary:hover {
  background: var(--btn-primary-hover) !important;
  box-shadow: var(--glow-primary) !important;
}

.el-button--danger {
  background: var(--market-down) !important;
  border-color: var(--market-down) !important;
  color: white !important;
}

.el-button--danger:hover {
  background: #e02e24 !important;
  box-shadow: var(--glow-danger) !important;
}

/* 进度条样式 */
.el-progress {
  background: var(--input-bg) !important;
  border: 1px solid var(--input-border) !important;
  border-radius: var(--radius-md) !important;
}

.el-progress-bar__inner {
  background: var(--btn-primary) !important;
  border-radius: var(--radius-md) !important;
}

/* 描述列表样式 */
.el-descriptions {
  background: transparent !important;
}

.el-descriptions__header {
  background: transparent !important;
  color: var(--text-primary) !important;
}

.el-descriptions__label {
  color: var(--text-secondary) !important;
  font-weight: var(--font-medium) !important;
}

.el-descriptions__content {
  color: var(--text-primary) !important;
}

.el-descriptions__body {
  background: transparent !important;
  color: var(--text-primary) !important;
}

.el-descriptions__table {
  background: transparent !important;
}

.el-descriptions__cell {
  background: transparent !important;
  border-color: var(--glass-border) !important;
}

/* 选择框样式 */
.el-select .el-input__wrapper {
  background: var(--input-bg) !important;
  border-color: var(--input-border) !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .backtest-result {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
    padding: var(--space-lg);
  }

  .page-header h2 {
    font-size: var(--font-xl);
  }

  .status-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .progress-section {
    margin-left: 0;
    width: 100%;
  }

  .performance-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .metric-item {
    padding: 12px;
  }

  .chart-controls,
  .trades-controls,
  .positions-controls,
  .logs-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .chart-container {
    height: 300px;
    padding: 12px;
  }

  .el-descriptions__label {
    float: none;
    display: block;
    text-align: left;
    margin-bottom: 4px;
  }

  .el-descriptions__content {
    margin-left: 0 !important;
  }
}
</style>
