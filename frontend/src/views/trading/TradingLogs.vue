<template>
  <div class="trading-logs-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1>交易日志</h1>
          <p>实时监控交易活动和系统状态</p>
        </div>
        <div class="header-right">
          <el-button @click="refreshData">
            <el-icon><refresh /></el-icon>
            刷新数据
          </el-button>
          <el-button type="primary" @click="exportLogs">
            <el-icon><download /></el-icon>
            导出日志
          </el-button>
        </div>
      </div>
    </div>

    <!-- 监控概览 -->
    <div class="overview-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon orders">
                <el-icon><document /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-title">24小时订单</div>
                <div class="metric-value">{{ monitoringOverview.activity?.totalOrders24h || 0 }}</div>
                <div class="metric-subtitle">今日交易活跃度</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon trades">
                <el-icon><trophy /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-title">24小时成交</div>
                <div class="metric-value">{{ monitoringOverview.activity?.totalTrades24h || 0 }}</div>
                <div class="metric-subtitle">成交笔数</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon errors">
                <el-icon><warning /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-title">错误日志</div>
                <div class="metric-value" :class="{ 'error-value': monitoringOverview.activity?.errorLogs24h > 0 }">
                  {{ monitoringOverview.activity?.errorLogs24h || 0 }}
                </div>
                <div class="metric-subtitle">24小时内错误</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon positions">
                <el-icon><trend-charts /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-title">当前持仓</div>
                <div class="metric-value">{{ monitoringOverview.positions?.activePositions || 0 }}</div>
                <div class="metric-subtitle" :class="{ 'positive': monitoringOverview.positions?.totalPnL > 0, 'negative': monitoringOverview.positions?.totalPnL < 0 }">
                  {{ monitoringOverview.positions?.totalPnL?.toFixed(2) || 0 }} USDT
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 筛选器和日志列表 -->
    <div class="logs-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>交易日志</h3>
            <div class="header-actions">
              <el-select v-model="selectedAccountId" placeholder="选择账户" clearable @change="handleFilterChange">
                <el-option
                  v-for="account in accounts"
                  :key="account.id"
                  :label="account.name"
                  :value="account.id"
                />
              </el-select>
              <el-select v-model="filters.level" placeholder="日志级别" clearable @change="handleFilterChange">
                <el-option label="信息" value="info" />
                <el-option label="警告" value="warning" />
                <el-option label="错误" value="error" />
                <el-option label="调试" value="debug" />
              </el-select>
              <el-select v-model="filters.category" placeholder="分类" clearable @change="handleFilterChange">
                <el-option label="订单" value="order" />
                <el-option label="持仓" value="position" />
                <el-option label="余额" value="balance" />
                <el-option label="连接" value="connection" />
                <el-option label="风险" value="risk" />
                <el-option label="执行" value="execution" />
              </el-select>
              <el-date-picker
                v-model="dateRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                @change="handleDateChange"
              />
            </div>
          </div>
        </template>

        <!-- 日志统计 -->
        <div class="stats-section">
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-label">按级别统计</div>
                <div class="stat-chart">
                  <div v-for="stat in logStats.levelStats" :key="stat.level" class="stat-bar">
                    <span class="stat-name">{{ stat.level }}</span>
                    <div class="stat-progress">
                      <div 
                        class="stat-fill" 
                        :class="`stat-${stat.level}`"
                        :style="{ width: `${(stat.count / maxLevelCount) * 100}%` }"
                      ></div>
                    </div>
                    <span class="stat-count">{{ stat.count }}</span>
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-label">按分类统计</div>
                <div class="stat-chart">
                  <div v-for="stat in logStats.categoryStats" :key="stat.category" class="stat-bar">
                    <span class="stat-name">{{ stat.category }}</span>
                    <div class="stat-progress">
                      <div 
                        class="stat-fill" 
                        :class="`stat-${stat.category}`"
                        :style="{ width: `${(stat.count / maxCategoryCount) * 100}%` }"
                      ></div>
                    </div>
                    <span class="stat-count">{{ stat.count }}</span>
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-label">最近错误</div>
                <div class="recent-errors">
                  <div 
                    v-for="error in logStats.recentErrors" 
                    :key="error.id" 
                    class="error-item"
                  >
                    <div class="error-time">{{ formatTime(error.createdAt) }}</div>
                    <div class="error-message">{{ error.message }}</div>
                  </div>
                  <div v-if="logStats.recentErrors.length === 0" class="no-errors">
                    暂无错误
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 日志列表 -->
        <div class="logs-container">
          <div v-if="loading" class="loading-container">
            <el-icon class="loading-icon"><loading /></el-icon>
            <span>加载中...</span>
          </div>
          
          <div v-else-if="logs.length === 0" class="empty-logs">
            <el-empty description="暂无日志记录" :image-size="100" />
          </div>
          
          <div v-else class="logs-list">
            <div 
              v-for="log in logs" 
              :key="log.id" 
              class="log-item"
              :class="`log-${log.level}`"
            >
              <div class="log-header">
                <div class="log-meta">
                  <el-tag :type="getLogType(log.level)" size="small">
                    {{ log.level.toUpperCase() }}
                  </el-tag>
                  <el-tag :type="getCategoryType(log.category)" size="small">
                    {{ log.category }}
                  </el-tag>
                  <span class="log-action">{{ log.action }}</span>
                  <span v-if="log.symbol" class="log-symbol">{{ log.symbol }}</span>
                </div>
                <div class="log-time">{{ formatTime(log.createdAt) }}</div>
              </div>
              <div class="log-message">{{ log.message }}</div>
              <div v-if="log.account" class="log-account">
                <el-icon><wallet /></el-icon>
                {{ log.account.name }} ({{ log.account.exchange }})
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <div v-if="logs.length > 0" class="pagination">
            <el-pagination
              v-model:current-page="pagination.currentPage"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[20, 50, 100, 200]"
              :total="pagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handlePageSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </div>
      </el-card>
    </div>

    <!-- 风险警报 -->
    <div class="alerts-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>风险警报</h3>
            <el-badge :value="riskAlerts.length" type="danger" />
          </div>
        </template>

        <div v-if="riskAlerts.length === 0" class="empty-alerts">
          <el-empty description="暂无风险警报" :image-size="80" />
        </div>

        <div v-else class="alerts-list">
          <div 
            v-for="alert in riskAlerts" 
            :key="alert.id" 
            class="alert-item"
            :class="`alert-${alert.level}`"
          >
            <div class="alert-header">
              <div class="alert-title">
                <el-icon :class="getAlertIcon(alert.level)">
                  <warning />
                </el-icon>
                {{ alert.rule.name }}
              </div>
              <div class="alert-time">{{ formatTime(alert.createdAt) }}</div>
            </div>
            <div class="alert-details">
              <div class="alert-level">
                风险级别: 
                <el-tag :type="getAlertType(alert.level)" size="small">
                  {{ alert.level.toUpperCase() }}
                </el-tag>
              </div>
              <div class="alert-score">风险评分: {{ alert.score }}/100</div>
            </div>
            <div v-if="alert.account" class="alert-account">
              账户: {{ alert.account.name }} ({{ alert.account.exchange }})
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 实时活动 -->
    <div class="activity-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>实时活动</h3>
            <el-switch
              v-model="realtimeEnabled"
              active-text="实时更新"
              @change="toggleRealtime"
            />
          </div>
        </template>

        <div class="activity-list">
          <div 
            v-for="activity in monitoringOverview.recentActivities" 
            :key="activity.id" 
            class="activity-item"
            :class="`activity-${activity.level}`"
          >
            <div class="activity-time">{{ formatTime(activity.createdAt) }}</div>
            <div class="activity-content">
              <el-tag :type="getActivityType(activity.category)" size="small">
                {{ activity.category }}
              </el-tag>
              <span class="activity-action">{{ activity.action }}</span>
              <span v-if="activity.symbol" class="activity-symbol">{{ activity.symbol }}</span>
            </div>
            <div class="activity-message">{{ activity.message }}</div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh,
  Download,
  Document,
  Trophy,
  Warning,
  TrendCharts,
  Loading,
  Wallet
} from '@element-plus/icons-vue'
import { tradingLogsApi } from '@/api/tradingLogs'
import { exchangeApi } from '@/api/exchange'

// 响应式数据
const logs = ref([])
const accounts = ref([])
const riskAlerts = ref([])
const monitoringOverview = ref({})
const logStats = ref({})
const loading = ref(false)
const realtimeEnabled = ref(false)
const selectedAccountId = ref('')
const dateRange = ref([])

// 筛选器
const filters = reactive({
  level: '',
  category: '',
  action: '',
  symbol: ''
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 50,
  total: 0
})

// 计算属性
const maxLevelCount = computed(() => {
  return Math.max(...logStats.value.levelStats?.map(stat => stat.count) || [1])
})

const maxCategoryCount = computed(() => {
  return Math.max(...logStats.value.categoryStats?.map(stat => stat.count) || [1])
})

// 方法
const loadData = async () => {
  loading.value = true
  try {
    const [logsRes, accountsRes, overviewRes, statsRes, alertsRes] = await Promise.all([
      tradingLogsApi.getLogs({
        accountId: selectedAccountId.value,
        level: filters.level,
        category: filters.category,
        startDate: dateRange.value?.[0],
        endDate: dateRange.value?.[1],
        limit: pagination.pageSize,
        offset: (pagination.currentPage - 1) * pagination.pageSize
      }),
      exchangeApi.getAccounts(),
      tradingLogsApi.getMonitoringOverview(selectedAccountId.value),
      tradingLogsApi.getLogStats({
        accountId: selectedAccountId.value,
        startDate: dateRange.value?.[0],
        endDate: dateRange.value?.[1]
      }),
      tradingLogsApi.getRiskAlerts({
        accountId: selectedAccountId.value,
        limit: 10
      })
    ])

    logs.value = logsRes.data
    accounts.value = accountsRes.data
    monitoringOverview.value = overviewRes.data
    logStats.value = statsRes.data
    riskAlerts.value = alertsRes.data
    pagination.total = logsRes.pagination.total
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await loadData()
  ElMessage.success('数据刷新成功')
}

const handleFilterChange = () => {
  pagination.currentPage = 1
  loadData()
}

const handleDateChange = () => {
  pagination.currentPage = 1
  loadData()
}

const handlePageChange = (page: number) => {
  pagination.currentPage = page
  loadData()
}

const handlePageSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  loadData()
}

const exportLogs = async () => {
  try {
    const response = await tradingLogsApi.exportLogs({
      accountId: selectedAccountId.value,
      format: 'csv',
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1]
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = `trading_logs_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('日志导出成功')
  } catch (error) {
    console.error('导出日志失败:', error)
    ElMessage.error('导出日志失败')
  }
}

const toggleRealtime = (enabled: boolean) => {
  if (enabled) {
    startRealtimeUpdates()
  } else {
    stopRealtimeUpdates()
  }
}

const startRealtimeUpdates = () => {
  // 实现实时更新逻辑
  console.log('开始实时更新')
}

const stopRealtimeUpdates = () => {
  // 停止实时更新逻辑
  console.log('停止实时更新')
}

// 工具函数
const getLogType = (level: string) => {
  const types: Record<string, string> = {
    error: 'danger',
    warning: 'warning',
    info: 'info',
    debug: 'info'
  }
  return types[level] || 'info'
}

const getCategoryType = (category: string) => {
  const types: Record<string, string> = {
    order: 'primary',
    position: 'success',
    balance: 'warning',
    connection: 'danger',
    risk: 'danger',
    execution: 'info'
  }
  return types[category] || 'info'
}

const getAlertType = (level: string) => {
  const types: Record<string, string> = {
    critical: 'danger',
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return types[level] || 'info'
}

const getAlertIcon = (level: string) => {
  return level === 'critical' ? 'error' : 'warning'
}

const getActivityType = (category: string) => {
  return getCategoryType(category)
}

const formatTime = (timeString: string) => {
  return new Date(timeString).toLocaleString('zh-CN')
}

// 生命周期
onMounted(async () => {
  await loadData()
})

onUnmounted(() => {
  if (realtimeEnabled.value) {
    stopRealtimeUpdates()
  }
})
</script>

<style scoped>
.trading-logs-container {
  padding: 20px;
  background: var(--bg-primary);
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
  padding: 16px 20px;
  background: var(--surface-elevated);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
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
.logs-section,
.alerts-section,
.activity-section {
  margin-bottom: 24px;
}

.metric-card {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  background: var(--surface-elevated);
  border: 1px solid var(--border-primary);
  transition: all var(--transition-normal) var(--ease-out);
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.metric-content {
  display: flex;
  align-items: center;
  gap: 16px;
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

.metric-icon.orders {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.metric-icon.trades {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.metric-icon.errors {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
}

.metric-icon.positions {
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
}

.metric-info {
  flex: 1;
}

.metric-title {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.metric-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.metric-value.error-value {
  color: #f56c6c;
}

.metric-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.metric-subtitle.positive {
  color: #67c23a;
}

.metric-subtitle.negative {
  color: #f56c6c;
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
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.stats-section {
  margin-bottom: 24px;
  padding: 16px;
  background: var(--surface);
  border-radius: var(--radius-md);
}

.stat-item {
  margin-bottom: 16px;
}

.stat-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.stat-chart {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-name {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 60px;
}

.stat-progress {
  flex: 1;
  height: 20px;
  background: var(--surface-elevated);
  border-radius: 10px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.stat-fill.stat-info {
  background: linear-gradient(90deg, #409eff, #66b1ff);
}

.stat-fill.stat-warning {
  background: linear-gradient(90deg, #e6a23c, #ebb563);
}

.stat-fill.stat-error {
  background: linear-gradient(90deg, #f56c6c, #f78989);
}

.stat-fill.stat-debug {
  background: linear-gradient(90deg, #909399, #a6a9ad);
}

.stat-fill.stat-order {
  background: linear-gradient(90deg, #409eff, #66b1ff);
}

.stat-fill.stat-position {
  background: linear-gradient(90deg, #67c23a, #85ce61);
}

.stat-fill.stat-balance {
  background: linear-gradient(90deg, #e6a23c, #ebb563);
}

.stat-fill.stat-connection {
  background: linear-gradient(90deg, #f56c6c, #f78989);
}

.stat-fill.stat-risk {
  background: linear-gradient(90deg, #f56c6c, #f78989);
}

.stat-fill.stat-execution {
  background: linear-gradient(90deg, #909399, #a6a9ad);
}

.stat-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 30px;
  text-align: right;
}

.recent-errors {
  max-height: 120px;
  overflow-y: auto;
}

.error-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
}

.error-time {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.error-message {
  font-size: 12px;
  color: var(--text-primary);
  line-height: 1.4;
}

.no-errors {
  text-align: center;
  color: var(--text-secondary);
  font-size: 12px;
  padding: 20px 0;
}

.logs-container {
  position: relative;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 12px;
  color: var(--text-secondary);
}

.loading-icon {
  font-size: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-logs {
  padding: 40px;
  text-align: center;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-item {
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid;
  background: var(--surface);
  transition: all var(--transition-normal) var(--ease-out);
}

.log-item:hover {
  transform: translateX(4px);
  box-shadow: var(--shadow-sm);
}

.log-item.log-error {
  border-left-color: #f56c6c;
  background: rgba(245, 108, 108, 0.05);
}

.log-item.log-warning {
  border-left-color: #e6a23c;
  background: rgba(230, 162, 60, 0.05);
}

.log-item.log-info {
  border-left-color: #409eff;
  background: rgba(64, 158, 255, 0.05);
}

.log-item.log-debug {
  border-left-color: #909399;
  background: rgba(144, 147, 153, 0.05);
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.log-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.log-action {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--surface-elevated);
  padding: 2px 6px;
  border-radius: 4px;
}

.log-symbol {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--surface-elevated);
  padding: 2px 6px;
  border-radius: 4px;
}

.log-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.log-message {
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 8px;
}

.log-account {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.empty-alerts {
  padding: 40px;
  text-align: center;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid;
  background: var(--surface);
  transition: all var(--transition-normal) var(--ease-out);
}

.alert-item:hover {
  transform: translateX(4px);
  box-shadow: var(--shadow-sm);
}

.alert-item.alert-critical {
  border-left-color: #f56c6c;
  background: rgba(245, 108, 108, 0.05);
}

.alert-item.alert-high {
  border-left-color: #e6a23c;
  background: rgba(230, 162, 60, 0.05);
}

.alert-item.alert-medium {
  border-left-color: #409eff;
  background: rgba(64, 158, 255, 0.05);
}

.alert-item.alert-low {
  border-left-color: #67c23a;
  background: rgba(103, 194, 58, 0.05);
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.alert-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--text-primary);
}

.alert-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.alert-details {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}

.alert-level,
.alert-score {
  font-size: 12px;
  color: var(--text-secondary);
}

.alert-account {
  font-size: 12px;
  color: var(--text-secondary);
}

.activity-list {
  max-height: 300px;
  overflow-y: auto;
}

.activity-item {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  transition: all var(--transition-normal) var(--ease-out);
}

.activity-item:hover {
  background: var(--surface-elevated);
}

.activity-time {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.activity-content {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.activity-action {
  font-size: 12px;
  color: var(--text-secondary);
}

.activity-symbol {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--surface-elevated);
  padding: 2px 6px;
  border-radius: 4px;
}

.activity-message {
  font-size: 12px;
  color: var(--text-primary);
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .trading-logs-container {
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

  .header-actions {
    flex-direction: column;
    width: 100%;
    gap: 8px;
  }

  .header-actions .el-select,
  .header-actions .el-date-picker {
    width: 100%;
  }

  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .stats-section .el-col {
    margin-bottom: 16px;
  }
}
</style>