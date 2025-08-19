<template>
  <div class="dashboard">
    <!-- 头部 -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="welcome-section">
          <h1>欢迎回来，{{ authStore.userName }}！</h1>
          <p>今天是 {{ currentDate }}，祝您交易顺利</p>
        </div>
        <div class="user-section">
          <el-dropdown @command="handleUserCommand">
            <div class="user-info">
              <el-avatar :size="40" :src="userAvatar">
                {{ authStore.userName.charAt(0).toUpperCase() }}
              </el-avatar>
              <span class="username">{{ authStore.userName }}</span>
              <el-icon><arrow-down /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="settings">系统设置</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon><trend-charts /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ dashboardStats.totalStrategies }}</h3>
          <p>策略总数</p>
          <div class="stat-change positive">
            <el-icon><arrow-up /></el-icon>
            +12% 本月
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <el-icon><video-play /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ dashboardStats.activeStrategies }}</h3>
          <p>运行中策略</p>
          <div class="stat-change positive">
            <el-icon><arrow-up /></el-icon>
            +5% 本周
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <el-icon><money /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ formatCurrency(dashboardStats.totalPnL) }}</h3>
          <p>总收益</p>
          <div :class="['stat-change', dashboardStats.totalPnL >= 0 ? 'positive' : 'negative']">
            <el-icon><component :is="dashboardStats.totalPnL >= 0 ? 'arrow-up' : 'arrow-down'" /></el-icon>
            {{ Math.abs(dashboardStats.pnlChange) }}% 本月
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <el-icon><data-line /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ formatCurrency(dashboardStats.dailyVolume) }}</h3>
          <p>今日交易量</p>
          <div class="stat-change positive">
            <el-icon><arrow-up /></el-icon>
            +8% 今日
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="dashboard-content">
      <!-- 左侧列 -->
      <div class="dashboard-column">
        <!-- 策略状态 -->
        <div class="content-card">
          <div class="card-header">
            <h2>策略状态</h2>
            <el-button type="primary" size="small" @click="goToStrategies">
              查看全部
            </el-button>
          </div>
          <div class="strategy-list">
            <div v-for="strategy in recentStrategies" :key="strategy.id" class="strategy-item">
              <div class="strategy-info">
                <div class="strategy-name">{{ strategy.name }}</div>
                <div class="strategy-type">{{ strategy.type }}</div>
              </div>
              <div class="strategy-status">
                <el-tag :type="getStatusType(strategy.status)">
                  {{ getStatusText(strategy.status) }}
                </el-tag>
              </div>
              <div class="strategy-performance">
                <div class="performance-value" :class="strategy.performance >= 0 ? 'positive' : 'negative'">
                  {{ strategy.performance >= 0 ? '+' : '' }}{{ strategy.performance }}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 系统监控 -->
        <div class="content-card">
          <div class="card-header">
            <h2>系统监控</h2>
            <el-button type="primary" size="small" @click="goToMonitoring">
              查看详情
            </el-button>
          </div>
          <div class="system-stats">
            <div class="system-stat">
              <div class="stat-label">CPU使用率</div>
              <div class="stat-value">{{ systemMetrics.cpu }}%</div>
              <el-progress :percentage="systemMetrics.cpu" :color="getProgressColor(systemMetrics.cpu)" />
            </div>
            <div class="system-stat">
              <div class="stat-label">内存使用率</div>
              <div class="stat-value">{{ systemMetrics.memory }}%</div>
              <el-progress :percentage="systemMetrics.memory" :color="getProgressColor(systemMetrics.memory)" />
            </div>
            <div class="system-stat">
              <div class="stat-label">系统状态</div>
              <div class="stat-value">
                <el-tag :type="systemMetrics.status === 'healthy' ? 'success' : 'warning'">
                  {{ systemMetrics.status === 'healthy' ? '正常' : '警告' }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧列 -->
      <div class="dashboard-column">
        <!-- 最近活动 -->
        <div class="content-card">
          <div class="card-header">
            <h2>最近活动</h2>
          </div>
          <div class="activity-list">
            <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
              <div class="activity-icon">
                <el-icon :class="activity.type">
                  <component :is="getActivityIcon(activity.type)" />
                </el-icon>
              </div>
              <div class="activity-content">
                <div class="activity-title">{{ activity.title }}</div>
                <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 快速操作 -->
        <div class="content-card">
          <div class="card-header">
            <h2>快速操作</h2>
          </div>
          <div class="quick-actions">
            <el-button type="primary" @click="goToCreateStrategy">
              <el-icon><plus /></el-icon>
              创建策略
            </el-button>
            <el-button type="success" @click="goToBacktest">
              <el-icon><video-play /></el-icon>
              运行回测
            </el-button>
            <el-button type="warning" @click="goToTrading">
              <el-icon><money /></el-icon>
              交易管理
            </el-button>
            <el-button type="info" @click="goToMonitoring">
              <el-icon><monitor /></el-icon>
              系统监控
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { 
  ArrowUp, 
  ArrowDown, 
  TrendCharts, 
  VideoPlay, 
  Money, 
  DataLine,
  Plus,
  Monitor,
  Setting,
  User
} from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

// 仪表板统计数据
const dashboardStats = reactive({
  totalStrategies: 24,
  activeStrategies: 8,
  totalPnL: 12580.50,
  pnlChange: 8.5,
  dailyVolume: 45230.00
})

// 系统指标
const systemMetrics = reactive({
  cpu: 45,
  memory: 62,
  status: 'healthy'
})

// 最近策略
const recentStrategies = ref([
  {
    id: '1',
    name: 'MA双均线策略',
    type: '趋势跟踪',
    status: 'active',
    performance: 12.5
  },
  {
    id: '2',
    name: 'RSI超卖策略',
    type: '均值回归',
    status: 'paused',
    performance: -2.3
  },
  {
    id: '3',
    name: '网格交易策略',
    type: '套利',
    status: 'active',
    performance: 8.7
  },
  {
    id: '4',
    name: 'MACD策略',
    type: '趋势跟踪',
    status: 'error',
    performance: -5.2
  }
])

// 最近活动
const recentActivities = ref([
  {
    id: '1',
    type: 'strategy',
    title: 'MA双均线策略已启动',
    timestamp: new Date(Date.now() - 5 * 60 * 1000)
  },
  {
    id: '2',
    type: 'trade',
    title: '完成BTCUSDT买入交易',
    timestamp: new Date(Date.now() - 15 * 60 * 1000)
  },
  {
    id: '3',
    type: 'system',
    title: '系统自动备份完成',
    timestamp: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    id: '4',
    type: 'alert',
    title: '策略运行异常告警',
    timestamp: new Date(Date.now() - 45 * 60 * 1000)
  }
])

// 用户头像
const userAvatar = ref('')

// 当前日期
const currentDate = ref('')

// 初始化
onMounted(() => {
  // 设置当前日期
  currentDate.value = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
  
  // 模拟实时数据更新
  setInterval(() => {
    // 更新系统指标
    systemMetrics.cpu = Math.floor(Math.random() * 30) + 30
    systemMetrics.memory = Math.floor(Math.random() * 20) + 50
  }, 5000)
})

// 处理用户命令
const handleUserCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 处理退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '确认退出', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await authStore.logout()
  } catch (error) {
    // 用户取消操作
  }
}

// 导航方法
const goToStrategies = () => {
  router.push('/strategies')
}

const goToMonitoring = () => {
  router.push('/monitoring')
}

const goToCreateStrategy = () => {
  router.push('/strategies/create')
}

const goToBacktest = () => {
  router.push('/backtest')
}

const goToTrading = () => {
  router.push('/trading')
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

// 获取状态类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    active: 'success',
    paused: 'warning',
    stopped: 'info',
    error: 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    active: '运行中',
    paused: '已暂停',
    stopped: '已停止',
    error: '错误'
  }
  return statusMap[status] || '未知'
}

// 获取进度条颜色
const getProgressColor = (percentage: number) => {
  if (percentage < 50) {
    return '#67c23a'
  } else if (percentage < 80) {
    return '#e6a23c'
  } else {
    return '#f56c6c'
  }
}

// 获取活动图标
const getActivityIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    strategy: VideoPlay,
    trade: Money,
    system: Setting,
    alert: TrendCharts
  }
  return iconMap[type] || TrendCharts
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.dashboard-header {
  margin-bottom: 30px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 20px 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.welcome-section h1 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.welcome-section p {
  margin: 5px 0 0 0;
  color: #666;
  font-size: 14px;
}

.user-section {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.username {
  font-weight: 500;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.stat-content h3 {
  margin: 0;
  font-size: 24px;
  color: #333;
  font-weight: 600;
}

.stat-content p {
  margin: 5px 0;
  color: #666;
  font-size: 14px;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
}

.stat-change.positive {
  color: #67c23a;
}

.stat-change.negative {
  color: #f56c6c;
}

.dashboard-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.content-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.strategy-list {
  padding: 20px;
}

.strategy-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.strategy-item:last-child {
  border-bottom: none;
}

.strategy-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
}

.strategy-type {
  font-size: 12px;
  color: #666;
}

.performance-value {
  font-weight: 600;
}

.performance-value.positive {
  color: #67c23a;
}

.performance-value.negative {
  color: #f56c6c;
}

.system-stats {
  padding: 20px;
}

.system-stat {
  margin-bottom: 20px;
}

.system-stat:last-child {
  margin-bottom: 0;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.activity-list {
  padding: 20px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.activity-icon.strategy {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.activity-icon.trade {
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.activity-icon.system {
  background: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

.activity-icon.alert {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.activity-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
}

.activity-time {
  font-size: 12px;
  color: #666;
}

.quick-actions {
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.quick-actions .el-button {
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard {
    padding: 10px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .dashboard-content {
    grid-template-columns: 1fr;
  }
  
  .quick-actions {
    grid-template-columns: 1fr;
  }
}
</style>