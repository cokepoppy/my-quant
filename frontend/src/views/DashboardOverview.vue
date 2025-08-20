<template>
  <div class="dashboard-overview">
    <div class="stats-grid">
      <!-- 总资产卡片 -->
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-title">总资产</div>
          <el-icon class="stat-icon"><Wallet /></el-icon>
        </div>
        <div class="stat-value">{{ formatCurrency(stats.totalAssets) }}</div>
        <div class="stat-change positive">
          <el-icon><ArrowUp /></el-icon>
          {{ stats.dailyChange }}% 今日
        </div>
      </div>

      <!-- 可用余额卡片 -->
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-title">可用余额</div>
          <el-icon class="stat-icon"><Money /></el-icon>
        </div>
        <div class="stat-value">{{ formatCurrency(stats.availableBalance) }}</div>
        <div class="stat-subtitle">
          占总资产 {{ ((stats.availableBalance / stats.totalAssets) * 100).toFixed(1) }}%
        </div>
      </div>

      <!-- 今日盈亏卡片 -->
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-title">今日盈亏</div>
          <el-icon class="stat-icon"><TrendCharts /></el-icon>
        </div>
        <div class="stat-value" :class="stats.dailyPnL >= 0 ? 'positive' : 'negative'">
          {{ stats.dailyPnL >= 0 ? '+' : '' }}{{ formatCurrency(stats.dailyPnL) }}
        </div>
        <div class="stat-change" :class="stats.dailyPnL >= 0 ? 'positive' : 'negative'">
          {{ stats.dailyPnLPercent }}% 收益率
        </div>
      </div>

      <!-- 累计盈亏卡片 -->
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-title">累计盈亏</div>
          <el-icon class="stat-icon"><DataLine /></el-icon>
        </div>
        <div class="stat-value" :class="stats.totalPnL >= 0 ? 'positive' : 'negative'">
          {{ stats.totalPnL >= 0 ? '+' : '' }}{{ formatCurrency(stats.totalPnL) }}
        </div>
        <div class="stat-change" :class="stats.totalPnL >= 0 ? 'positive' : 'negative'">
          {{ stats.totalPnLPercent }}% 收益率
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <!-- 资产曲线图 -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>资产曲线</h3>
          <div class="chart-controls">
            <el-radio-group v-model="assetChartPeriod" size="small">
              <el-radio-button label="1d">1日</el-radio-button>
              <el-radio-button label="1w">1周</el-radio-button>
              <el-radio-button label="1m">1月</el-radio-button>
              <el-radio-button label="3m">3月</el-radio-button>
              <el-radio-button label="1y">1年</el-radio-button>
            </el-radio-group>
          </div>
        </div>
        <div class="chart-container">
          <AssetCurveChart :period="assetChartPeriod" />
        </div>
      </div>

      <!-- 收益分布图 -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>收益分布</h3>
          <el-tooltip content="各策略收益贡献" placement="top">
            <el-icon class="help-icon"><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
        <div class="chart-container">
          <ProfitDistributionChart />
        </div>
      </div>
    </div>

    <div class="bottom-grid">
      <!-- 策略表现 -->
      <div class="performance-card">
        <div class="card-header">
          <h3>策略表现</h3>
          <el-button size="small" text @click="goToStrategies">
            查看全部 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        <div class="strategy-list">
          <div
            v-for="strategy in topStrategies"
            :key="strategy.id"
            class="strategy-item"
          >
            <div class="strategy-info">
              <div class="strategy-name">{{ strategy.name }}</div>
              <div class="strategy-type">{{ strategy.type }}</div>
            </div>
            <div class="strategy-metrics">
              <div class="metric-item">
                <span class="metric-label">收益率</span>
                <span
                  class="metric-value"
                  :class="strategy.return >= 0 ? 'positive' : 'negative'"
                >
                  {{ strategy.return >= 0 ? '+' : '' }}{{ strategy.return }}%
                </span>
              </div>
              <div class="metric-item">
                <span class="metric-label">夏普比率</span>
                <span class="metric-value">{{ strategy.sharpe }}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">最大回撤</span>
                <span class="metric-value negative">{{ strategy.maxDrawdown }}%</span>
              </div>
            </div>
            <div class="strategy-status">
              <el-tag
                :type="getStrategyStatusType(strategy.status)"
                size="small"
              >
                {{ getStrategyStatusText(strategy.status) }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近活动 -->
      <div class="activity-card">
        <div class="card-header">
          <h3>最近活动</h3>
          <el-button size="small" text @click="refreshActivities">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
        <div class="activity-list">
          <div
            v-for="activity in recentActivities"
            :key="activity.id"
            class="activity-item"
          >
            <div class="activity-icon">
              <el-icon :class="activity.type">
                <component :is="getActivityIcon(activity.type)" />
              </el-icon>
            </div>
            <div class="activity-content">
              <div class="activity-title">{{ activity.title }}</div>
              <div class="activity-description">{{ activity.description }}</div>
              <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Wallet,
  Money,
  TrendCharts,
  DataLine,
  ArrowUp,
  ArrowRight,
  Refresh,
  QuestionFilled,
  VideoPlay,
  Monitor,
  Setting,
  TrendCharts as TrendIcon,
  Warning
} from '@element-plus/icons-vue'
import AssetCurveChart from '@/components/charts/AssetCurveChart.vue'
import ProfitDistributionChart from '@/components/charts/ProfitDistributionChart.vue'

const router = useRouter()

// 统计数据
const stats = reactive({
  totalAssets: 125430.50,
  availableBalance: 45230.00,
  dailyPnL: 580.25,
  dailyPnLPercent: 0.47,
  totalPnL: 12580.50,
  totalPnLPercent: 11.2,
  dailyChange: 0.47
})

// 图表周期
const assetChartPeriod = ref('1m')

// 顶级策略
const topStrategies = ref([
  {
    id: '1',
    name: 'MA双均线策略',
    type: '趋势跟踪',
    return: 12.5,
    sharpe: 1.85,
    maxDrawdown: -3.2,
    status: 'active'
  },
  {
    id: '2',
    name: '网格交易策略',
    type: '套利',
    return: 8.7,
    sharpe: 2.12,
    maxDrawdown: -1.8,
    status: 'active'
  },
  {
    id: '3',
    name: 'RSI超卖策略',
    type: '均值回归',
    return: -2.3,
    sharpe: 0.68,
    maxDrawdown: -5.1,
    status: 'paused'
  }
])

// 最近活动
const recentActivities = ref([
  {
    id: '1',
    type: 'strategy',
    title: 'MA策略已启动',
    description: 'BTC/USDT 1小时线',
    timestamp: new Date(Date.now() - 5 * 60 * 1000)
  },
  {
    id: '2',
    type: 'trade',
    title: '买入订单已成交',
    description: 'BTC/USDT 0.1 @ $45,230',
    timestamp: new Date(Date.now() - 15 * 60 * 1000)
  },
  {
    id: '3',
    type: 'system',
    title: '数据同步完成',
    description: '市场数据已更新',
    timestamp: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    id: '4',
    type: 'alert',
    title: '风险预警',
    description: '账户回撤达到警戒线',
    timestamp: new Date(Date.now() - 45 * 60 * 1000)
  }
])

// 初始化
onMounted(() => {
  // 模拟数据更新
  setInterval(() => {
    updateStats()
  }, 5000)
})

// 更新统计数据
const updateStats = () => {
  // 模拟数据变化
  const change = (Math.random() - 0.5) * 100
  stats.dailyPnL += change
  stats.totalAssets += change
  stats.dailyPnLPercent = ((stats.dailyPnL / (stats.totalAssets - stats.dailyPnL)) * 100).toFixed(2)
  stats.dailyChange = stats.dailyPnLPercent
}

// 导航方法
const goToStrategies = () => {
  router.push('/strategies')
}

const refreshActivities = () => {
  ElMessage.success('活动列表已刷新')
}

// 格式化货币
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount)
}

// 格式化时间
const formatTime = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}天前`
  } else if (hours > 0) {
    return `${hours}小时前`
  } else if (minutes > 0) {
    return `${minutes}分钟前`
  } else {
    return '刚刚'
  }
}

// 获取策略状态类型
const getStrategyStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    active: 'success',
    paused: 'warning',
    stopped: 'info',
    error: 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取策略状态文本
const getStrategyStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    active: '运行中',
    paused: '已暂停',
    stopped: '已停止',
    error: '错误'
  }
  return statusMap[status] || '未知'
}

// 获取活动图标
const getActivityIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    strategy: VideoPlay,
    trade: TrendIcon,
    system: Setting,
    alert: Warning
  }
  return iconMap[type] || Monitor
}
</script>

<style scoped>
.dashboard-overview {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  transition: all 0.2s;
}

.stat-card:hover {
  border-color: var(--primary-text);
  box-shadow: 0 4px 12px rgba(0, 255, 136, 0.1);
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.stat-title {
  font-size: 14px;
  color: var(--muted-text);
  font-weight: 500;
}

.stat-icon {
  font-size: 16px;
  color: var(--primary-text);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--secondary-text);
  margin-bottom: 8px;
}

.stat-change {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-change.positive {
  color: var(--positive-color);
}

.stat-change.negative {
  color: var(--negative-color);
}

.stat-subtitle {
  font-size: 12px;
  color: var(--muted-text);
}

/* 图表网格 */
.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  min-height: 300px;
}

.chart-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--primary-text);
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.help-icon {
  color: var(--muted-text);
  cursor: pointer;
  font-size: 14px;
}

.help-icon:hover {
  color: var(--primary-text);
}

.chart-container {
  flex: 1;
  padding: 20px;
  min-height: 250px;
}

/* 底部网格 */
.bottom-grid {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 16px;
  flex: 1;
  min-height: 300px;
}

/* 表现卡片 */
.performance-card,
.activity-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--primary-text);
}

/* 策略列表 */
.strategy-list {
  flex: 1;
  padding: 16px 20px;
  overflow-y: auto;
}

.strategy-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.strategy-item:last-child {
  border-bottom: none;
}

.strategy-info {
  flex: 1;
}

.strategy-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--secondary-text);
  margin-bottom: 4px;
}

.strategy-type {
  font-size: 12px;
  color: var(--muted-text);
}

.strategy-metrics {
  display: flex;
  gap: 16px;
  margin: 0 16px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.metric-label {
  font-size: 11px;
  color: var(--muted-text);
}

.metric-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--secondary-text);
}

.metric-value.positive {
  color: var(--positive-color);
}

.metric-value.negative {
  color: var(--negative-color);
}

/* 活动列表 */
.activity-list {
  flex: 1;
  padding: 16px 20px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--hover-bg);
  flex-shrink: 0;
}

.activity-icon .el-icon {
  font-size: 16px;
  color: var(--primary-text);
}

.activity-icon.strategy .el-icon {
  color: var(--warning-color);
}

.activity-icon.trade .el-icon {
  color: var(--positive-color);
}

.activity-icon.system .el-icon {
  color: var(--info-color);
}

.activity-icon.alert .el-icon {
  color: var(--negative-color);
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--secondary-text);
  margin-bottom: 4px;
}

.activity-description {
  font-size: 12px;
  color: var(--muted-text);
  margin-bottom: 4px;
}

.activity-time {
  font-size: 11px;
  color: var(--muted-text);
}

/* 通用样式 */
.positive {
  color: var(--positive-color) !important;
}

.negative {
  color: var(--negative-color) !important;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .bottom-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .strategy-metrics {
    flex-direction: column;
    gap: 8px;
    margin: 8px 0;
  }
  
  .strategy-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

/* 滚动条样式 */
.strategy-list::-webkit-scrollbar,
.activity-list::-webkit-scrollbar {
  width: 6px;
}

.strategy-list::-webkit-scrollbar-track,
.activity-list::-webkit-scrollbar-track {
  background: var(--primary-bg);
}

.strategy-list::-webkit-scrollbar-thumb,
.activity-list::-webkit-scrollbar-thumb {
  background: var(--brand-secondary);
  border-radius: 3px;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-radio-group) {
  background: var(--card-bg);
}

:deep(.el-radio-button__inner) {
  background: var(--card-bg);
  border-color: var(--border-color);
  color: var(--secondary-text);
  font-size: 12px;
  padding: 4px 8px;
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: var(--brand-secondary);
  border-color: var(--brand-secondary);
  color: var(--primary-bg);
}

:deep(.el-tag) {
  border: none;
}

:deep(.el-button) {
  font-size: 12px;
  height: 24px;
  padding: 0 8px;
}
</style>