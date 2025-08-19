<template>
  <div class="backtest-result-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1>{{ backtest?.strategyName || '回测结果' }}</h1>
          <p>{{ backtest?.startDate }} - {{ backtest?.endDate }}</p>
        </div>
        <div class="header-right">
          <el-button @click="backToList">
            <el-icon><arrow-left /></el-icon>
            返回列表
          </el-button>
          <el-button type="primary" @click="exportReport">
            <el-icon><download /></el-icon>
            导出报告
          </el-button>
          <el-dropdown @command="handleAction">
            <el-button>
              操作
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="duplicate">复制配置</el-dropdown-item>
                <el-dropdown-item command="compare">对比分析</el-dropdown-item>
                <el-dropdown-item divided command="delete" class="text-danger">
                  删除记录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 回测状态 -->
    <div v-if="backtest" class="status-section">
      <el-card>
        <div class="status-content">
          <div class="status-info">
            <div class="status-indicator">
              <el-tag :type="getStatusType(backtest.status)" size="large">
                {{ getStatusText(backtest.status) }}
              </el-tag>
            </div>
            <div class="status-meta">
              <span class="meta-item">
                <el-icon><timer /></el-icon>
                创建时间: {{ formatDate(backtest.createdAt) }}
              </span>
              <span v-if="backtest.completedAt" class="meta-item">
                <el-icon><timer /></el-icon>
                完成时间: {{ formatDate(backtest.completedAt) }}
              </span>
              <span v-if="backtest.duration" class="meta-item">
                <el-icon><clock /></el-icon>
                耗时: {{ formatDuration(backtest.duration) }}
              </span>
            </div>
          </div>
          
          <div v-if="backtest.status === 'running'" class="progress-section">
            <div class="progress-info">
              <span>进度: {{ formatPercent(backtest.progress || 0) }}</span>
              <span>{{ backtest.currentStep || '初始化中...' }}</span>
            </div>
            <el-progress 
              :percentage="Math.round((backtest.progress || 0) * 100)" 
              :status="backtest.status === 'failed' ? 'exception' : ''"
            />
            <div class="progress-actions">
              <el-button 
                size="small" 
                type="warning" 
                @click="cancelBacktest"
                :loading="loading"
              >
                取消回测
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 回测配置 -->
    <div v-if="backtest" class="config-section">
      <el-card>
        <template #header>
          <h3>回测配置</h3>
        </template>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="策略名称">
            {{ backtest.strategyName }}
          </el-descriptions-item>
          <el-descriptions-item label="回测期间">
            {{ formatDate(backtest.startDate) }} - {{ formatDate(backtest.endDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="初始资金">
            {{ formatCurrency(backtest.initialCapital) }}
          </el-descriptions-item>
          <el-descriptions-item label="基准">
            {{ backtest.benchmark || '无' }}
          </el-descriptions-item>
          <el-descriptions-item label="数据频率">
            {{ backtest.dataFrequency }}
          </el-descriptions-item>
          <el-descriptions-item label="杠杆倍数">
            {{ backtest.leverage }}x
          </el-descriptions-item>
          <el-descriptions-item label="手续费率">
            {{ formatPercent(backtest.commission) }}
          </el-descriptions-item>
          <el-descriptions-item label="滑点">
            {{ formatPercent(backtest.slippage) }}
          </el-descriptions-item>
          <el-descriptions-item label="交易标的">
            <el-tag
              v-for="symbol in backtest.symbols"
              :key="symbol"
              size="small"
              class="config-tag"
            >
              {{ symbol }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>

    <!-- 性能指标 -->
    <div v-if="backtest?.results" class="performance-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>性能指标</h3>
            <el-button @click="refreshResults" :loading="loading">
              <el-icon><refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </template>
        
        <div class="performance-grid">
          <div class="performance-metrics">
            <h4>收益指标</h4>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-title">总收益</div>
                <div class="metric-value" :class="getPerformanceClass(backtest.results.totalReturn)">
                  {{ formatPercent(backtest.results.totalReturn) }}
                </div>
                <div class="metric-subtitle">
                  {{ formatCurrency(backtest.results.totalReturn * backtest.initialCapital) }}
                </div>
              </div>
              <div class="metric-card">
                <div class="metric-title">年化收益</div>
                <div class="metric-value" :class="getPerformanceClass(backtest.results.annualizedReturn)">
                  {{ formatPercent(backtest.results.annualizedReturn) }}
                </div>
              </div>
              <div class="metric-card">
                <div class="metric-title">基准收益</div>
                <div class="metric-value" :class="getPerformanceClass(backtest.results.benchmarkReturn)">
                  {{ formatPercent(backtest.results.benchmarkReturn) }}
                </div>
              </div>
              <div class="metric-card">
                <div class="metric-title">超额收益</div>
                <div class="metric-value" :class="getPerformanceClass(backtest.results.excessReturn)">
                  {{ formatPercent(backtest.results.excessReturn) }}
                </div>
              </div>
            </div>
          </div>
          
          <div class="performance-metrics">
            <h4>风险指标</h4>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-title">夏普比率</div>
                <div class="metric-value">{{ backtest.results.sharpeRatio.toFixed(2) }}</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">最大回撤</div>
                <div class="metric-value negative">
                  {{ formatPercent(backtest.results.maxDrawdown) }}
                </div>
              </div>
              <div class="metric-card">
                <div class="metric-title">波动率</div>
                <div class="metric-value">{{ formatPercent(backtest.results.volatility) }}</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">信息比率</div>
                <div class="metric-value">{{ backtest.results.informationRatio.toFixed(2) }}</div>
              </div>
            </div>
          </div>
          
          <div class="performance-metrics">
            <h4>交易指标</h4>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-title">总交易次数</div>
                <div class="metric-value">{{ backtest.results.totalTrades }}</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">胜率</div>
                <div class="metric-value">{{ formatPercent(backtest.results.winRate) }}</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">盈亏比</div>
                <div class="metric-value">{{ backtest.results.profitFactor.toFixed(2) }}</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">平均交易收益</div>
                <div class="metric-value" :class="getPerformanceClass(backtest.results.averageTrade)">
                  {{ formatPercent(backtest.results.averageTrade) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 标签页 -->
    <div v-if="backtest?.results" class="tabs-section">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <el-tab-pane label="收益曲线" name="equity">
          <el-card>
            <div class="chart-container">
              <div class="chart-header">
                <h3>收益曲线</h3>
                <div class="chart-controls">
                  <el-select v-model="chartType" size="small">
                    <el-option label="线性" value="line" />
                    <el-option label="阶梯" value="step" />
                  </el-select>
                  <el-checkbox v-model="showBenchmark" size="small">显示基准</el-checkbox>
                </div>
              </div>
              <div class="chart-placeholder">
                <el-empty description="图表开发中" :image-size="100" />
              </div>
            </div>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="回撤分析" name="drawdown">
          <el-card>
            <div class="chart-container">
              <div class="chart-header">
                <h3>回撤分析</h3>
              </div>
              <div class="chart-placeholder">
                <el-empty description="图表开发中" :image-size="100" />
              </div>
            </div>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="交易记录" name="trades">
          <el-card>
            <div class="trades-container">
              <div class="trades-header">
                <h3>交易记录</h3>
                <div class="trades-actions">
                  <el-input
                    v-model="tradeSearch"
                    placeholder="搜索交易..."
                    style="width: 200px"
                    size="small"
                    clearable
                  />
                  <el-button size="small" @click="exportTrades">
                    导出交易记录
                  </el-button>
                </div>
              </div>
              
              <el-table :data="filteredTrades" stripe>
                <el-table-column prop="timestamp" label="时间" width="180">
                  <template #default="{ row }">
                    {{ formatDate(row.timestamp) }}
                  </template>
                </el-table-column>
                <el-table-column prop="symbol" label="标的" width="100" />
                <el-table-column prop="type" label="类型" width="80">
                  <template #default="{ row }">
                    <el-tag :type="row.type === 'buy' ? 'success' : 'danger'" size="small">
                      {{ row.type === 'buy' ? '买入' : '卖出' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="price" label="价格" width="120">
                  <template #default="{ row }">
                    {{ formatCurrency(row.price) }}
                  </template>
                </el-table-column>
                <el-table-column prop="quantity" label="数量" width="100" />
                <el-table-column prop="amount" label="金额" width="120">
                  <template #default="{ row }">
                    {{ formatCurrency(row.amount) }}
                  </template>
                </el-table-column>
                <el-table-column prop="fee" label="手续费" width="100">
                  <template #default="{ row }">
                    {{ formatCurrency(row.fee) }}
                  </template>
                </el-table-column>
                <el-table-column prop="pnl" label="盈亏" width="120">
                  <template #default="{ row }">
                    <span :class="getPerformanceClass(row.pnl)">
                      {{ formatCurrency(row.pnl) }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="pnlPercent" label="盈亏比例" width="120">
                  <template #default="{ row }">
                    <span :class="getPerformanceClass(row.pnlPercent)">
                      {{ formatPercent(row.pnlPercent) }}
                    </span>
                  </template>
                </el-table-column>
              </el-table>
              
              <!-- 分页 -->
              <div class="pagination-container">
                <el-pagination
                  v-model:current-page="tradePagination.page"
                  v-model:page-size="tradePagination.limit"
                  :page-sizes="[10, 20, 50, 100]"
                  :total="tradePagination.total"
                  layout="total, sizes, prev, pager, next, jumper"
                  @size-change="handleTradeSizeChange"
                  @current-change="handleTradeCurrentChange"
                />
              </div>
            </div>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="持仓记录" name="positions">
          <el-card>
            <div class="positions-container">
              <div class="positions-header">
                <h3>持仓记录</h3>
              </div>
              <div class="chart-placeholder">
                <el-empty description="持仓记录开发中" :image-size="100" />
              </div>
            </div>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="风险分析" name="risk">
          <el-card>
            <div class="risk-container">
              <div class="risk-header">
                <h3>风险分析</h3>
              </div>
              <div class="chart-placeholder">
                <el-empty description="风险分析开发中" :image-size="100" />
              </div>
            </div>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 日志 -->
    <div v-if="backtest?.logs" class="logs-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>回测日志</h3>
            <el-button @click="refreshLogs" :loading="logsLoading">
              <el-icon><refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </template>
        
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
                <span class="log-time">{{ formatDate(log.timestamp) }}</span>
                <el-tag :type="getLogType(log.level)" size="small">
                  {{ log.level.toUpperCase() }}
                </el-tag>
              </div>
              <div class="log-message">{{ log.message }}</div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  ArrowDown,
  Download,
  Timer,
  Clock,
  Refresh
} from '@element-plus/icons-vue'
import { useBacktestStore } from '@/stores/backtest'
import type { BacktestRecord, BacktestTrade } from '@/types/strategy'

const route = useRoute()
const router = useRouter()
const backtestStore = useBacktestStore()

// 响应式数据
const activeTab = ref('equity')
const chartType = ref('line')
const showBenchmark = ref(true)
const tradeSearch = ref('')
const logs = ref<any[]>([])
const loading = ref(false)
const logsLoading = ref(false)
let refreshInterval: any = null

// 计算属性
const backtest = computed(() => backtestStore.currentBacktest)
const tradePagination = computed(() => backtestStore.tradePagination)

const filteredTrades = computed(() => {
  let filtered = backtestStore.trades
  
  if (tradeSearch.value) {
    const query = tradeSearch.value.toLowerCase()
    filtered = filtered.filter(trade => 
      trade.symbol.toLowerCase().includes(query) ||
      trade.type.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

// 方法
const backToList = () => {
  router.push('/backtest')
}

const exportReport = async () => {
  try {
    await backtestStore.exportBacktestReport(route.params.id as string)
    ElMessage.success('报告导出成功')
  } catch (error) {
    console.error('导出报告失败:', error)
    ElMessage.error('导出报告失败')
  }
}

const handleAction = (command: string) => {
  switch (command) {
    case 'duplicate':
      duplicateBacktest()
      break
    case 'compare':
      compareBacktest()
      break
    case 'delete':
      deleteBacktest()
      break
  }
}

const duplicateBacktest = () => {
  if (backtest.value) {
    backtestStore.updateBacktestConfig({
      strategyId: backtest.value.strategyId,
      startDate: new Date(backtest.value.startDate),
      endDate: new Date(backtest.value.endDate),
      initialCapital: backtest.value.initialCapital,
      benchmark: backtest.value.benchmark,
      dataFrequency: backtest.value.dataFrequency,
      commission: backtest.value.commission,
      slippage: backtest.value.slippage,
      leverage: backtest.value.leverage
    })
    ElMessage.success('配置已复制，可以开始新的回测')
    router.push('/backtest')
  }
}

const compareBacktest = () => {
  ElMessage.info('对比分析功能开发中')
}

const deleteBacktest = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个回测记录吗？此操作不可撤销。',
      '删除回测记录',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await backtestStore.deleteBacktest(route.params.id as string)
    ElMessage.success('删除成功')
    router.push('/backtest')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除回测记录失败:', error)
    }
  }
}

const cancelBacktest = async () => {
  try {
    await backtestStore.cancelBacktest(route.params.id as string)
    ElMessage.success('回测已取消')
  } catch (error) {
    console.error('取消回测失败:', error)
    ElMessage.error('取消回测失败')
  }
}

const refreshResults = async () => {
  try {
    loading.value = true
    await backtestStore.fetchBacktestById(route.params.id as string)
  } catch (error) {
    console.error('刷新结果失败:', error)
  } finally {
    loading.value = false
  }
}

const handleTabClick = (tab: any) => {
  if (tab.props.name === 'trades') {
    loadTrades()
  }
}

const loadTrades = async () => {
  try {
    await backtestStore.fetchBacktestTrades(route.params.id as string)
  } catch (error) {
    console.error('加载交易记录失败:', error)
  }
}

const exportTrades = async () => {
  try {
    await backtestStore.exportBacktestTrades(route.params.id as string)
    ElMessage.success('交易记录导出成功')
  } catch (error) {
    console.error('导出交易记录失败:', error)
    ElMessage.error('导出交易记录失败')
  }
}

const handleTradeSizeChange = (size: number) => {
  backtestStore.setTradePagination({ limit: size })
  loadTrades()
}

const handleTradeCurrentChange = (page: number) => {
  backtestStore.setTradePagination({ page })
  loadTrades()
}

const refreshLogs = async () => {
  try {
    logsLoading.value = true
    const result = await backtestStore.fetchBacktestLogs(route.params.id as string)
    logs.value = result.logs || []
  } catch (error) {
    console.error('获取日志失败:', error)
  } finally {
    logsLoading.value = false
  }
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    pending: 'info',
    running: 'warning',
    completed: 'success',
    failed: 'danger',
    cancelled: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '等待中',
    running: '运行中',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消'
  }
  return texts[status] || status
}

const getPerformanceClass = (value: number) => {
  return value > 0 ? 'positive' : value < 0 ? 'negative' : ''
}

const getLogType = (level: string) => {
  const types: Record<string, string> = {
    error: 'danger',
    warning: 'warning',
    info: 'info',
    debug: 'info'
  }
  return types[level] || 'info'
}

const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(2)}%`
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟${secs}秒`
  } else if (minutes > 0) {
    return `${minutes}分钟${secs}秒`
  } else {
    return `${secs}秒`
  }
}

// 自动刷新
const startAutoRefresh = () => {
  if (backtest.value?.status === 'running') {
    refreshInterval = setInterval(async () => {
      await refreshResults()
      if (backtest.value?.status !== 'running') {
        stopAutoRefresh()
      }
    }, 5000)
  }
}

const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

// 生命周期
onMounted(async () => {
  try {
    await backtestStore.fetchBacktestById(route.params.id as string)
    startAutoRefresh()
    await refreshLogs()
  } catch (error) {
    console.error('获取回测结果失败:', error)
    ElMessage.error('获取回测结果失败')
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.backtest-result-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.status-section,
.config-section,
.performance-section,
.tabs-section,
.logs-section {
  margin-bottom: 30px;
}

.status-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.status-indicator {
  margin-right: 16px;
}

.status-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
  font-size: 14px;
}

.progress-section {
  min-width: 400px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.progress-actions {
  margin-top: 12px;
  text-align: right;
}

.performance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.performance-metrics h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.metric-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.metric-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.metric-subtitle {
  font-size: 12px;
  color: #888;
}

.chart-container {
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.chart-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.chart-placeholder {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.trades-container,
.positions-container,
.risk-container {
  margin-bottom: 20px;
}

.trades-header,
.positions-header,
.risk-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.trades-header h3,
.positions-header h3,
.risk-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.trades-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pagination-container {
  padding: 20px 0 0 0;
  text-align: center;
}

.logs-content {
  max-height: 400px;
  overflow-y: auto;
}

.no-logs {
  padding: 40px;
  text-align: center;
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

.positive {
  color: #67c23a;
}

.negative {
  color: #f56c6c;
}

.text-danger {
  color: #f56c6c;
}

.config-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .backtest-result-container {
    padding: 10px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .status-content {
    flex-direction: column;
    gap: 16px;
  }
  
  .progress-section {
    min-width: 100%;
  }
  
  .performance-grid {
    grid-template-columns: 1fr;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-header,
  .trades-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .status-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>