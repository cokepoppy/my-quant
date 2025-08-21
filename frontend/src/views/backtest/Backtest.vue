<template>
  <div class="backtest-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1>回测分析</h1>
          <p>测试策略在历史数据上的表现</p>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="startBacktest">
            <el-icon><video-play /></el-icon>
            开始回测
          </el-button>
          <el-button @click="fetchBacktests">
            <el-icon><refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
    </div>

    <!-- 回测配置 -->
    <div class="config-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>回测配置</h3>
            <el-button @click="toggleAdvanced">
              {{ showAdvanced ? "收起" : "高级设置" }}
            </el-button>
          </div>
        </template>

        <el-form :model="backtestConfig" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="选择策略" prop="strategyId">
                <el-select
                  v-model="backtestConfig.strategyId"
                  placeholder="请选择策略"
                  filterable
                  @change="onStrategyChange"
                >
                  <el-option
                    v-for="strategy in strategies"
                    :key="strategy.id"
                    :label="strategy.name"
                    :value="strategy.id"
                  >
                    <div class="strategy-option">
                      <span>{{ strategy.name }}</span>
                      <el-tag
                        size="small"
                        :type="getStatusType(strategy.status)"
                      >
                        {{ getStatusText(strategy.status) }}
                      </el-tag>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="开始日期" prop="startDate">
                <el-date-picker
                  v-model="backtestConfig.startDate"
                  type="date"
                  placeholder="选择开始日期"
                  :disabled-date="disabledStartDate"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="结束日期" prop="endDate">
                <el-date-picker
                  v-model="backtestConfig.endDate"
                  type="date"
                  placeholder="选择结束日期"
                  :disabled-date="disabledEndDate"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="初始资金" prop="initialCapital">
                <el-input-number
                  v-model="backtestConfig.initialCapital"
                  :min="1000"
                  :max="10000000"
                  :step="1000"
                  placeholder="初始资金"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="基准" prop="benchmark">
                <el-select
                  v-model="backtestConfig.benchmark"
                  placeholder="选择基准"
                >
                  <el-option label="BTC/USDT" value="BTC/USDT" />
                  <el-option label="ETH/USDT" value="ETH/USDT" />
                  <el-option label="BNB/USDT" value="BNB/USDT" />
                  <el-option label="无基准" value="none" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="数据频率" prop="dataFrequency">
                <el-select
                  v-model="backtestConfig.dataFrequency"
                  placeholder="选择频率"
                >
                  <el-option label="1分钟" value="1m" />
                  <el-option label="5分钟" value="5m" />
                  <el-option label="15分钟" value="15m" />
                  <el-option label="30分钟" value="30m" />
                  <el-option label="1小时" value="1h" />
                  <el-option label="4小时" value="4h" />
                  <el-option label="1天" value="1d" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 高级设置 -->
          <div v-show="showAdvanced" class="advanced-settings">
            <el-divider content-position="left">高级设置</el-divider>
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="手续费率" prop="commission">
                  <el-input-number
                    v-model="backtestConfig.commission"
                    :min="0"
                    :max="1"
                    :step="0.001"
                    :precision="3"
                    placeholder="手续费率"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="滑点" prop="slippage">
                  <el-input-number
                    v-model="backtestConfig.slippage"
                    :min="0"
                    :max="1"
                    :step="0.001"
                    :precision="3"
                    placeholder="滑点"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="杠杆倍数" prop="leverage">
                  <el-input-number
                    v-model="backtestConfig.leverage"
                    :min="1"
                    :max="125"
                    :step="1"
                    placeholder="杠杆倍数"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="风险限制" prop="riskLimits">
                  <el-checkbox-group v-model="backtestConfig.riskLimits">
                    <el-checkbox label="maxDrawdown">最大回撤限制</el-checkbox>
                    <el-checkbox label="maxLoss">最大亏损限制</el-checkbox>
                    <el-checkbox label="maxPosition">最大持仓限制</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="输出选项" prop="outputOptions">
                  <el-checkbox-group v-model="backtestConfig.outputOptions">
                    <el-checkbox label="trades">交易记录</el-checkbox>
                    <el-checkbox label="positions">持仓记录</el-checkbox>
                    <el-checkbox label="dailyReturns">日收益</el-checkbox>
                    <el-checkbox label="drawdown">回撤分析</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-form>
      </el-card>
    </div>

    <!-- 回测历史 -->
    <div class="history-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>回测历史</h3>
            <el-input
              v-model="searchQuery"
              placeholder="搜索回测记录..."
              style="width: 200px"
              clearable
            />
          </div>
        </template>

        <div v-if="isLoading" class="loading-container">
          <el-skeleton :rows="5" animated />
        </div>

        <div v-else-if="filteredBacktests.length === 0" class="empty-container">
          <el-empty description="暂无回测记录">
            <el-button type="primary" @click="startBacktest">
              开始第一次回测
            </el-button>
          </el-empty>
        </div>

        <div v-else>
          <div
            v-for="backtest in filteredBacktests"
            :key="backtest.id"
            class="backtest-item"
          >
            <div class="backtest-content">
              <div class="backtest-info">
                <div class="backtest-header">
                  <h3>{{ backtest.strategyName }}</h3>
                  <el-tag :type="getStatusType(backtest.status)">
                    {{ getStatusText(backtest.status) }}
                  </el-tag>
                </div>
                <div class="backtest-meta">
                  <span class="meta-item">
                    <el-icon><calendar /></el-icon>
                    {{ formatDate(backtest.startDate) }} -
                    {{ formatDate(backtest.endDate) }}
                  </span>
                  <span class="meta-item">
                    <el-icon><timer /></el-icon>
                    创建时间: {{ formatDate(backtest.createdAt) }}
                  </span>
                  <span class="meta-item">
                    <el-icon><money /></el-icon>
                    初始资金: {{ formatCurrency(backtest.initialCapital) }}
                  </span>
                </div>

                <div v-if="backtest.results" class="backtest-results">
                  <div class="result-grid">
                    <div class="result-item">
                      <div class="result-label">总收益</div>
                      <div
                        class="result-value"
                        :class="
                          getPerformanceClass(backtest.results.totalReturn)
                        "
                      >
                        {{ formatPercent(backtest.results.totalReturn) }}
                      </div>
                    </div>
                    <div class="result-item">
                      <div class="result-label">年化收益</div>
                      <div
                        class="result-value"
                        :class="
                          getPerformanceClass(backtest.results.annualizedReturn)
                        "
                      >
                        {{ formatPercent(backtest.results.annualizedReturn) }}
                      </div>
                    </div>
                    <div class="result-item">
                      <div class="result-label">夏普比率</div>
                      <div class="result-value">
                        {{ backtest.results.sharpeRatio.toFixed(2) }}
                      </div>
                    </div>
                    <div class="result-item">
                      <div class="result-label">最大回撤</div>
                      <div class="result-value negative">
                        {{ formatPercent(backtest.results.maxDrawdown) }}
                      </div>
                    </div>
                    <div class="result-item">
                      <div class="result-label">胜率</div>
                      <div class="result-value">
                        {{ formatPercent(backtest.results.winRate) }}
                      </div>
                    </div>
                    <div class="result-item">
                      <div class="result-label">交易次数</div>
                      <div class="result-value">
                        {{ backtest.results.totalTrades }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="backtest-actions">
                <el-button-group>
                  <el-button size="small" @click="viewBacktest(backtest.id)">
                    查看详情
                  </el-button>
                  <el-button size="small" @click="duplicateBacktest(backtest)">
                    复制配置
                  </el-button>
                  <el-button size="small" @click="exportBacktest(backtest)">
                    导出报告
                  </el-button>
                </el-button-group>
                <el-dropdown
                  @command="(command) => handleAction(command, backtest)"
                >
                  <el-button size="small" text>
                    <el-icon><more /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="delete" class="text-danger">
                        删除记录
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="filteredBacktests.length > 0" class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.limit"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  VideoPlay,
  Refresh,
  Calendar,
  Timer,
  Money,
  More,
} from "@element-plus/icons-vue";
import { useStrategyStore } from "@/stores/strategy";
import { useBacktestStore } from "@/stores/backtest";
import type {
  Strategy,
  BacktestConfig,
  BacktestRecord,
} from "@/types/strategy";

const router = useRouter();
const strategyStore = useStrategyStore();
const backtestStore = useBacktestStore();

// 响应式数据
const showAdvanced = ref(false);
const searchQuery = ref("");
const selectedStrategy = ref<Strategy | null>(null);

// 计算属性
const strategies = computed(() =>
  strategyStore.strategies.filter((s) => s.status !== "draft"),
);
const backtests = computed(() => backtestStore.backtests);
const isLoading = computed(() => backtestStore.isLoading);
const pagination = computed(() => backtestStore.pagination);
const backtestConfig = computed(() => backtestStore.backtestConfig);

const filteredBacktests = computed(() => {
  let filtered = backtests.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter((backtest) =>
      backtest.strategyName.toLowerCase().includes(query),
    );
  }

  return filtered;
});

// 方法
const toggleAdvanced = () => {
  showAdvanced.value = !showAdvanced.value;
};

const onStrategyChange = (strategyId: string) => {
  selectedStrategy.value =
    strategies.value.find((s) => s.id === strategyId) || null;
  if (selectedStrategy.value) {
    // 自动填充策略相关的配置
    backtestStore.updateBacktestConfig({
      symbols: selectedStrategy.value.config.symbols,
      timeframe: selectedStrategy.value.config.timeframe,
    });
  }
};

const disabledStartDate = (time: Date) => {
  if (backtestConfig.value.endDate) {
    return time.getTime() > backtestConfig.value.endDate.getTime();
  }
  return false;
};

const disabledEndDate = (time: Date) => {
  if (backtestConfig.value.startDate) {
    return time.getTime() < backtestConfig.value.startDate.getTime();
  }
  return false;
};

const startBacktest = async () => {
  if (!backtestConfig.value.strategyId) {
    ElMessage.warning("请先选择策略");
    return;
  }

  if (!backtestConfig.value.startDate || !backtestConfig.value.endDate) {
    ElMessage.warning("请选择回测时间范围");
    return;
  }

  try {
    await backtestStore.startBacktest();
    ElMessage.success("回测任务已启动");
    router.push(`/backtest/${backtestStore.backtests[0].id}`);
  } catch (error) {
    console.error("启动回测失败:", error);
    ElMessage.error("启动回测失败");
  }
};

const fetchBacktests = async () => {
  try {
    await backtestStore.fetchBacktests();
  } catch (error) {
    console.error("获取回测记录失败:", error);
  }
};

const viewBacktest = (id: string) => {
  router.push(`/backtest/${id}`);
};

const duplicateBacktest = (backtest: BacktestRecord) => {
  backtestStore.updateBacktestConfig({
    strategyId: backtest.strategyId,
    startDate: new Date(backtest.startDate),
    endDate: new Date(backtest.endDate),
    initialCapital: backtest.initialCapital,
    benchmark: backtest.benchmark,
    dataFrequency: backtest.dataFrequency,
    commission: backtest.commission,
    slippage: backtest.slippage,
    leverage: backtest.leverage,
  });
  ElMessage.success("配置已复制");
};

const exportBacktest = async (backtest: BacktestRecord) => {
  try {
    await backtestStore.exportBacktestReport(backtest.id);
    ElMessage.success("报告导出成功");
  } catch (error) {
    console.error("导出报告失败:", error);
    ElMessage.error("导出报告失败");
  }
};

const handleAction = (command: string, backtest: BacktestRecord) => {
  switch (command) {
    case "delete":
      deleteBacktest(backtest);
      break;
  }
};

const deleteBacktest = async (backtest: BacktestRecord) => {
  try {
    await ElMessageBox.confirm(
      "确定要删除这个回测记录吗？此操作不可撤销。",
      "删除回测记录",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    await backtestStore.deleteBacktest(backtest.id);
    ElMessage.success("删除成功");
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除回测记录失败:", error);
    }
  }
};

const handleSizeChange = (size: number) => {
  backtestStore.setPagination({ limit: size });
  backtestStore.fetchBacktests();
};

const handleCurrentChange = (page: number) => {
  backtestStore.setPagination({ page });
  backtestStore.fetchBacktests();
};

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

const getPerformanceClass = (value: number) => {
  return value > 0 ? "positive" : value < 0 ? "negative" : "";
};

const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(2)}%`;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("zh-CN");
};

// 生命周期
onMounted(async () => {
  try {
    await strategyStore.fetchStrategies();
    await backtestStore.fetchBacktests();
  } catch (error) {
    console.error("初始化失败:", error);
  }
});
</script>

<style scoped>
.backtest-container {
  padding: 20px;
  background: var(--gradient-primary);
  min-height: 100vh;
  position: relative;
}

.backtest-container::before {
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
  margin-bottom: 32px;
  position: relative;
  z-index: 1;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  box-shadow: var(--shadow-glass);
  transition: all var(--transition-smooth) var(--transition-spring);
}

.header-content:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-premium-lg);
}

.header-left h1 {
  margin: 0 0 12px 0;
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.header-left p {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-lg);
}

.header-right {
  display: flex;
  gap: 12px;
}

.config-section,
.history-section {
  margin-bottom: 32px;
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
  font-size: var(--font-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.advanced-settings {
  margin-top: 24px;
}

.strategy-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.loading-container {
  padding: var(--space-xl);
}

.empty-container {
  padding: 60px 20px;
  text-align: center;
}

.backtest-item {
  padding: 24px 0;
  border-bottom: 1px solid var(--glass-border);
  transition: all var(--transition-smooth) var(--transition-spring);
}

.backtest-item:hover {
  background: rgba(255, 255, 255, 0.02);
  margin: 0 -24px;
  padding-left: 24px;
  padding-right: 24px;
  border-radius: var(--radius-lg);
}

.backtest-item:last-child {
  border-bottom: none;
}

.backtest-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.backtest-info {
  flex: 1;
}

.backtest-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.backtest-header h3 {
  margin: 0;
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.backtest-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: var(--font-sm);
}

.backtest-results {
  margin-top: 16px;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}

.result-item {
  text-align: center;
  padding: 16px;
  background: var(--surface-elevated);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  transition: all var(--transition-smooth) var(--transition-spring);
  position: relative;
  overflow: hidden;
}

.result-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
  transition: left 0.5s ease;
}

.result-item:hover::before {
  left: 100%;
}

.result-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--border-glow-primary);
}

.result-label {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  margin-bottom: 8px;
  font-weight: var(--font-medium);
}

.result-value {
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

.backtest-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-container {
  padding: 24px 0 0 0;
  text-align: center;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-glass);
  transition: all var(--transition-smooth) var(--transition-spring);
}

.pagination-container:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-premium-lg);
}

.text-danger {
  color: var(--market-down) !important;
}

/* 表单样式 */
.el-form-item__label {
  color: var(--text-secondary) !important;
  font-weight: var(--font-medium) !important;
  font-size: var(--font-sm) !important;
}

.el-input__wrapper {
  background: var(--input-bg) !important;
  border-color: var(--input-border) !important;
  border-radius: var(--radius-md) !important;
  transition: all var(--transition-smooth) var(--transition-spring) !important;
}

.el-input__wrapper:hover {
  border-color: var(--input-hover) !important;
}

.el-input__wrapper.is-focus {
  border-color: var(--input-focus) !important;
  box-shadow: 0 0 0 2px var(--glow-primary) !important;
}

.el-input__inner {
  color: var(--input-text) !important;
  font-size: var(--font-base) !important;
}

.el-select .el-input__wrapper {
  background: var(--input-bg) !important;
  border-color: var(--input-border) !important;
}

.el-date-editor.el-input__wrapper {
  background: var(--input-bg) !important;
  border-color: var(--input-border) !important;
}

.el-input-number .el-input__wrapper {
  background: var(--input-bg) !important;
  border-color: var(--input-border) !important;
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

/* 分割线样式 */
.el-divider {
  border-color: var(--glass-border) !important;
}

.el-divider__text {
  color: var(--text-secondary) !important;
  background: transparent !important;
}

/* 复选框样式 */
.el-checkbox__label {
  color: var(--text-secondary) !important;
  font-size: var(--font-base) !important;
}

.el-checkbox__input.is-checked .el-checkbox__inner {
  background-color: var(--btn-primary) !important;
  border-color: var(--btn-primary) !important;
}

.el-checkbox__inner:hover {
  border-color: var(--btn-primary) !important;
}

.el-checkbox__inner {
  background: var(--input-bg) !important;
  border-color: var(--input-border) !important;
  border-radius: var(--radius-sm) !important;
}

/* 分页样式 */
.el-pagination {
  color: var(--text-primary) !important;
}

.el-pagination .el-pagination__total {
  color: var(--text-secondary) !important;
}

.el-pagination .el-pager li {
  background: var(--input-bg) !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--input-border) !important;
  border-radius: var(--radius-sm) !important;
}

.el-pagination .el-pager li.active {
  background: var(--btn-primary) !important;
  color: white !important;
  border-color: var(--btn-primary) !important;
}

.el-pagination .el-pager li:hover {
  border-color: var(--btn-primary) !important;
  color: var(--btn-primary) !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .backtest-container {
    padding: 12px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
    padding: var(--space-lg);
  }

  .header-left h1 {
    font-size: var(--font-xl);
  }

  .backtest-content {
    flex-direction: column;
    gap: 16px;
  }

  .backtest-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .result-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .backtest-meta {
    flex-direction: column;
    gap: 8px;
  }

  .result-item {
    padding: 12px;
  }

  .el-form-item__label {
    float: none;
    display: block;
    text-align: left;
    margin-bottom: 8px;
  }

  .el-form-item__content {
    margin-left: 0 !important;
  }
}
</style>
