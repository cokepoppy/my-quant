<template>
  <div class="v3-layout">
    <!-- 顶部状态栏 -->
    <div class="top-status-bar">
      <div class="status-left">
        <div class="system-status">
          <el-icon class="status-icon" :class="systemStatus">
            <component :is="statusIcon" />
          </el-icon>
          <span class="status-text">{{ statusText }}</span>
        </div>
        <div class="market-time">
          市场时间: {{ marketTime }}
        </div>
      </div>
      
      <div class="status-center">
        <div class="quick-stats">
          <div class="stat-item">
            <span class="stat-label">总资产</span>
            <div class="stat-content">
              <span class="stat-value">${{ totalAssets.toLocaleString() }}</span>
              <span class="stat-change" :class="totalChange >= 0 ? 'positive' : 'negative'">
                {{ totalChange >= 0 ? '+' : '' }}{{ totalChange.toFixed(2) }}%
              </span>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-label">今日盈亏</span>
            <div class="stat-content">
              <span class="stat-value" :class="todayPnL >= 0 ? 'positive' : 'negative'">
                {{ todayPnL >= 0 ? '+' : '' }}${{ todayPnL.toFixed(2) }}
              </span>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-label">运行策略</span>
            <div class="stat-content">
              <span class="stat-value">{{ runningStrategies }}/{{ totalStrategies }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="status-right">
        <div class="user-info">
          <el-avatar :size="32" :src="userAvatar">{{ userInitials }}</el-avatar>
          <div class="user-details">
            <div class="user-name">{{ userName }}</div>
            <div class="user-role">{{ userRole }}</div>
          </div>
        </div>
        <div class="quick-actions">
          <el-button size="small" text @click="toggleFullscreen">
            <el-icon><full-screen /></el-icon>
          </el-button>
          <el-button size="small" text @click="showNotifications">
            <el-badge :value="notificationCount" :hidden="notificationCount === 0">
              <el-icon><bell /></el-icon>
            </el-badge>
          </el-button>
          <el-button size="small" text @click="showSettings">
            <el-icon><setting /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧导航菜单 -->
      <SidebarNav
        v-model="activeNav"
        v-model:collapsed="sidebarCollapsed"
        @item-click="handleNavClick"
      />
      
      <!-- 页签系统区域 -->
      <div class="tab-area">
        <TabSystem
          v-model="activeTab"
          :tabs="tabs"
          @tab-change="handleTabChange"
          @tab-close="handleTabClose"
          @tabs-update="handleTabsUpdate"
          @view-strategy="handleViewStrategy"
          @edit-strategy="handleEditStrategy"
          @create-strategy="handleCreateStrategy"
          ref="tabSystemRef"
        />
      </div>
      
      <!-- 右侧信息面板 -->
      <div class="right-panel" v-if="showRightPanel">
        <div class="panel-header">
          <h3>信息面板</h3>
          <el-button size="small" text @click="showRightPanel = false">
            <el-icon><close /></el-icon>
          </el-button>
        </div>
        <div class="panel-content">
          <!-- 系统信息 -->
          <div class="info-section">
            <h4>系统状态</h4>
            <div class="info-item">
              <span class="info-label">CPU使用率</span>
              <div class="info-value">
                <el-progress :percentage="cpuUsage" :color="getCpuColor(cpuUsage)" />
              </div>
            </div>
            <div class="info-item">
              <span class="info-label">内存使用率</span>
              <div class="info-value">
                <el-progress :percentage="memoryUsage" :color="getMemoryColor(memoryUsage)" />
              </div>
            </div>
            <div class="info-item">
              <span class="info-label">数据库连接</span>
              <el-tag :type="dbConnected ? 'success' : 'danger'" size="small">
                {{ dbConnected ? '正常' : '断开' }}
              </el-tag>
            </div>
          </div>
          
          <!-- 快速操作 -->
          <div class="info-section">
            <h4>快速操作</h4>
            <div class="quick-actions-grid">
              <el-button size="small" @click="quickOrder">
                <el-icon><plus /></el-icon>
                快速下单
              </el-button>
              <el-button size="small" @click="pauseAllStrategies">
                <el-icon><video-pause /></el-icon>
                暂停策略
              </el-button>
              <el-button size="small" @click="refreshData">
                <el-icon><refresh /></el-icon>
                刷新数据
              </el-button>
              <el-button size="small" @click="exportReport">
                <el-icon><download /></el-icon>
                导出报告
              </el-button>
            </div>
          </div>
          
          <!-- 最近活动 -->
          <div class="info-section">
            <h4>最近活动</h4>
            <div class="activity-list">
              <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
                <el-icon class="activity-icon" :class="activity.type">
                  <component :is="activity.icon" />
                </el-icon>
                <div class="activity-content">
                  <div class="activity-text">{{ activity.text }}</div>
                  <div class="activity-time">{{ activity.time }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部信息栏 -->
    <div class="bottom-status-bar">
      <div class="bottom-left">
        <div class="connection-status">
          <el-icon class="connection-icon" :class="connectionStatus">
            <component :is="connectionIcon" />
          </el-icon>
          <span>{{ connectionText }}</span>
        </div>
        <div class="data-sync">
          数据同步: {{ lastSync }}
        </div>
      </div>
      
      <div class="bottom-center">
        <div class="system-messages">
          <span v-for="message in systemMessages" :key="message.id" class="message-item">
            {{ message.text }}
          </span>
        </div>
      </div>
      
      <div class="bottom-right">
        <div class="quick-shortcuts">
          <el-tooltip content="切换侧边栏 (Ctrl+B)" placement="top">
            <el-button size="small" text @click="toggleSidebar">
              <el-icon><fold /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="切换右侧面板 (Ctrl+R)" placement="top">
            <el-button size="small" text @click="showRightPanel = !showRightPanel">
              <el-icon><expand /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="帮助 (F1)" placement="top">
            <el-button size="small" text @click="showHelp">
              <el-icon><question-filled /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </div>

    <!-- 通知中心 -->
    <el-drawer
      v-model="notificationsOpen"
      title="通知中心"
      direction="rtl"
      size="400px"
    >
      <div class="notifications-list">
        <div v-for="notification in notifications" :key="notification.id" class="notification-item">
          <div class="notification-header">
            <el-icon class="notification-icon" :class="notification.type">
              <component :is="notification.icon" />
            </el-icon>
            <span class="notification-time">{{ notification.time }}</span>
          </div>
          <div class="notification-content">{{ notification.content }}</div>
        </div>
      </div>
    </el-drawer>

    <!-- 设置对话框 -->
    <el-dialog v-model="settingsOpen" title="系统设置" width="600px">
      <el-tabs v-model="activeSettingsTab">
        <el-tab-pane label="显示设置" name="display">
          <el-form :model="displaySettings" label-width="120px">
            <el-form-item label="主题模式">
              <el-radio-group v-model="displaySettings.theme">
                <el-radio label="dark">深色主题</el-radio>
                <el-radio label="light">浅色主题</el-radio>
                <el-radio label="auto">跟随系统</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="语言">
              <el-select v-model="displaySettings.language" style="width: 100%">
                <el-option label="简体中文" value="zh-CN" />
                <el-option label="English" value="en-US" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="交易设置" name="trading">
          <el-form :model="tradingSettings" label-width="120px">
            <el-form-item label="默认交易对">
              <el-select v-model="tradingSettings.defaultSymbol" style="width: 100%">
                <el-option label="BTC/USDT" value="BTC/USDT" />
                <el-option label="ETH/USDT" value="ETH/USDT" />
                <el-option label="BNB/USDT" value="BNB/USDT" />
              </el-select>
            </el-form-item>
            <el-form-item label="下单确认">
              <el-switch v-model="tradingSettings.confirmOrder" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import SidebarNav from './SidebarNav.vue'
import TabSystem from './TabSystem.vue'
import {
  FullScreen,
  Bell,
  Setting,
  Close,
  Plus,
  VideoPause,
  Refresh,
  Download,
  Fold,
  Expand,
  QuestionFilled,
  SuccessFilled,
  WarningFilled,
  InfoFilled,
  CircleCloseFilled
} from '@element-plus/icons-vue'

interface Tab {
  id: string
  title: string
  icon?: any
  component: any
  props?: Record<string, any>
  pinned?: boolean
  path?: string
}

interface Activity {
  id: string
  type: string
  icon: any
  text: string
  time: string
}

interface Notification {
  id: string
  type: string
  icon: any
  content: string
  time: string
}

interface SystemMessage {
  id: string
  text: string
}

const router = useRouter()

// 导航状态
const activeNav = ref('dashboard')
const sidebarCollapsed = ref(false)
const activeTab = ref('')
const showRightPanel = ref(false)

// 页签管理
const tabSystemRef = ref()
const tabs = ref<Tab[]>([])

// 系统状态
const systemStatus = ref('success')
const statusText = ref('系统运行正常')
const marketTime = ref('--:--:--')
const totalAssets = ref(125430)
const totalChange = ref(2.5)
const todayPnL = ref(580.50)
const runningStrategies = ref(3)
const totalStrategies = ref(5)

// 用户信息
const userAvatar = ref('')
const userName = ref('量化交易员')
const userRole = ref('管理员')
const userInitials = computed(() => {
  return userName.value.split(' ').map(n => n[0]).join('').toUpperCase()
})

// 系统监控
const cpuUsage = ref(45)
const memoryUsage = ref(62)
const dbConnected = ref(true)
const connectionStatus = ref('success')
const connectionText = ref('连接正常')
const lastSync = ref('刚刚')

// 通知和消息
const notificationCount = ref(3)
const notificationsOpen = ref(false)
const settingsOpen = ref(false)
const activeSettingsTab = ref('display')

// 设置表单
const displaySettings = reactive({
  theme: 'dark',
  language: 'zh-CN'
})

const tradingSettings = reactive({
  defaultSymbol: 'BTC/USDT',
  confirmOrder: true
})

// 模拟数据
const recentActivities = ref<Activity[]>([
  {
    id: '1',
    type: 'success',
    icon: SuccessFilled,
    text: 'MA策略已启动',
    time: '5分钟前'
  },
  {
    id: '2',
    type: 'info',
    icon: InfoFilled,
    text: '买入订单已成交',
    time: '15分钟前'
  },
  {
    id: '3',
    type: 'warning',
    icon: WarningFilled,
    text: '数据同步延迟',
    time: '30分钟前'
  }
])

const notifications = ref<Notification[]>([
  {
    id: '1',
    type: 'success',
    icon: SuccessFilled,
    content: '您的策略已成功启动并开始运行',
    time: '10分钟前'
  },
  {
    id: '2',
    type: 'warning',
    icon: WarningFilled,
    content: '检测到异常市场波动，请注意风险控制',
    time: '25分钟前'
  },
  {
    id: '3',
    type: 'info',
    icon: InfoFilled,
    content: '系统将在今晚进行例行维护',
    time: '1小时前'
  }
])

const systemMessages = ref<SystemMessage[]>([
  {
    id: '1',
    text: '所有策略运行正常'
  },
  {
    id: '2',
    text: '市场数据实时同步'
  }
])

// 计算属性
const statusIcon = computed(() => {
  switch (systemStatus.value) {
    case 'success':
      return SuccessFilled
    case 'warning':
      return WarningFilled
    case 'error':
      return CircleCloseFilled
    default:
      return InfoFilled
  }
})

const connectionIcon = computed(() => {
  switch (connectionStatus.value) {
    case 'success':
      return SuccessFilled
    case 'warning':
      return WarningFilled
    case 'error':
      return CircleCloseFilled
    default:
      return InfoFilled
  }
})

// 方法
const handleNavClick = (item: string) => {
  // 如果点击已存在的标签，切换到该标签
  const existingTab = tabs.value.find(tab => tab.id === item)
  if (existingTab) {
    activeTab.value = item
    return
  }

  // 根据导航项创建对应的页签
  const tabComponents: Record<string, any> = {
    'dashboard': 'DashboardOverview',
    'strategies': 'StrategyList',
    'strategy-editor': 'CreateStrategy',
    'strategy-templates': 'StrategyTemplates',
    'optimization': 'ParameterOptimization',
    'backtest': 'BacktestSettings',
    'backtest-results': 'BacktestResult',
    'trading': 'TradingPanel',
    'orders': 'OrdersManagement',
    'positions': 'PositionsManagement',
    'accounts': 'Accounts',
    'risk-control': 'Monitoring',
    'alerts': 'Monitoring',
    'market-data': () => import('@/views/market/MarketData.vue'),
    'data-import': () => import('@/views/market/DataImport.vue'),
    'users': () => import('@/views/user/Users.vue'),
    'settings': () => import('@/views/settings/Settings.vue'),
    'logs': () => import('@/views/logs/SystemLogs.vue')
  }

  const tabTitles: Record<string, string> = {
    'dashboard': '总览',
    'strategies': '策略列表',
    'strategy-editor': '策略编辑器',
    'strategy-templates': '策略模板',
    'optimization': '参数优化',
    'backtest': '回测设置',
    'backtest-results': '回测结果',
    'trading': '交易面板',
    'orders': '订单管理',
    'positions': '持仓管理',
    'accounts': '账户管理',
    'risk-control': '风控设置',
    'alerts': '预警监控',
    'market-data': '市场数据',
    'data-import': '数据导入',
    'users': '用户管理',
    'settings': '系统设置',
    'logs': '系统日志'
  }

  const tabIcons: Record<string, any> = {
    'dashboard': 'Monitor',
    'strategies': 'TrendCharts',
    'strategy-editor': 'Edit',
    'strategy-templates': 'Files',
    'optimization': 'Aim',
    'backtest': 'VideoPlay',
    'backtest-results': 'DataLine',
    'trading': 'Money',
    'orders': 'List',
    'positions': 'PieChart',
    'accounts': 'Wallet',
    'risk-control': 'Warning',
    'alerts': 'Bell',
    'market-data': 'DataBoard',
    'data-import': 'Upload',
    'users': 'User',
    'settings': 'Setting',
    'logs': 'Document'
  }

  if (tabComponents[item]) {
    console.log('🔥 Creating tab for item:', item)
    console.log('🔥 Component type:', typeof tabComponents[item])
    console.log('🔥 Component:', tabComponents[item])
    
    const newTab: Tab = {
      id: item,
      title: tabTitles[item],
      icon: tabIcons[item],
      component: tabComponents[item],
      props: {}
    }

    console.log('🔥 New tab object:', newTab)
    console.log('🔥 tabSystemRef.value:', tabSystemRef.value)

    if (tabSystemRef.value) {
      console.log('🔥 Adding tab to TabSystem')
      tabSystemRef.value.addTab(newTab)
    } else {
      console.error('🔥 tabSystemRef.value is null')
    }
  } else {
    console.error('🔥 No component found for item:', item)
    console.error('🔥 Available components:', Object.keys(tabComponents))
  }
}

const handleTabChange = (tab: Tab) => {
  activeTab.value = tab.id
}

const handleTabClose = (tabId: string) => {
  tabs.value = tabs.value.filter(tab => tab.id !== tabId)
}

const handleTabsUpdate = (updatedTabs: Tab[]) => {
  tabs.value = updatedTabs
}

// 处理策略查看
const handleViewStrategy = (strategy: any) => {
  console.log('🔥 V3Layout handleViewStrategy called with:', strategy)
  
  const tabConfig: Tab = {
    id: `strategy-detail-${strategy.id}`,
    title: `策略详情 - ${strategy.name}`,
    icon: 'TrendCharts',
    component: () => import('@/views/strategy/StrategyDetail.vue'),
    props: {
      strategyId: strategy.id,
      strategy: strategy
    }
  }
  
  if (tabSystemRef.value) {
    tabSystemRef.value.addTab(tabConfig)
  }
}

// 处理策略编辑
const handleEditStrategy = (strategy: any) => {
  console.log('🔥 V3Layout handleEditStrategy called with:', strategy)
  
  const tabConfig: Tab = {
    id: `strategy-edit-${strategy.id}`,
    title: `编辑策略 - ${strategy.name}`,
    icon: 'Edit',
    component: () => import('@/views/strategy/EditStrategy.vue'),
    props: {
      strategyId: strategy.id,
      strategy: strategy
    }
  }
  
  if (tabSystemRef.value) {
    tabSystemRef.value.addTab(tabConfig)
  }
}

// 处理创建策略
const handleCreateStrategy = () => {
  console.log('🔥 V3Layout handleCreateStrategy called')
  
  const tabConfig: Tab = {
    id: 'strategy-create',
    title: '创建策略',
    icon: 'Plus',
    component: () => import('@/views/strategy/CreateStrategy.vue')
  }
  
  if (tabSystemRef.value) {
    tabSystemRef.value.addTab(tabConfig)
  }
}

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

const showNotifications = () => {
  notificationsOpen.value = true
}

const showSettings = () => {
  settingsOpen.value = true
}

const showHelp = () => {
  ElMessage.info('帮助文档功能开发中')
}

const quickOrder = () => {
  ElMessage.info('快速下单功能开发中')
}

const pauseAllStrategies = () => {
  ElMessage.success('所有策略已暂停')
}

const refreshData = () => {
  ElMessage.success('数据已刷新')
}

const exportReport = () => {
  ElMessage.success('报告导出中...')
}

const getCpuColor = (percentage: number) => {
  if (percentage < 50) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
}

const getMemoryColor = (percentage: number) => {
  if (percentage < 60) return '#67c23a'
  if (percentage < 85) return '#e6a23c'
  return '#f56c6c'
}

// 更新市场时间
const updateMarketTime = () => {
  const now = new Date()
  marketTime.value = now.toLocaleTimeString('zh-CN')
}

// 键盘快捷键
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.ctrlKey && event.key === 'b') {
    event.preventDefault()
    toggleSidebar()
  } else if (event.ctrlKey && event.key === 'r') {
    event.preventDefault()
    showRightPanel.value = !showRightPanel.value
  } else if (event.key === 'F1') {
    event.preventDefault()
    showHelp()
  }
}

// 生命周期
onMounted(() => {
  // 初始化默认页签
  handleNavClick('dashboard')
  
  // 启动定时器
  const timer = setInterval(updateMarketTime, 1000)
  updateMarketTime()
  
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeyDown)
  
  // 清理函数
  onUnmounted(() => {
    clearInterval(timer)
    document.removeEventListener('keydown', handleKeyDown)
  })
})
</script>

<style scoped>
.v3-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  color: var(--text-primary);
}

/* 顶部状态栏 */
.top-status-bar {
  height: 60px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.status-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.system-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-icon {
  font-size: 16px;
}

.status-icon.success {
  color: #67c23a;
}

.status-icon.warning {
  color: #e6a23c;
}

.status-icon.error {
  color: #f56c6c;
}

.status-text {
  font-size: 14px;
  color: var(--text-secondary);
}

.market-time {
  font-size: 13px;
  color: var(--text-muted);
}

.status-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.quick-stats {
  display: flex;
  gap: 60px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 140px;
}

.stat-content {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-change {
  font-size: 10px;
  font-weight: 500;
}

.stat-change.positive {
  color: #67c23a;
}

.stat-change.negative {
  color: #f56c6c;
}

.status-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.user-role {
  font-size: 12px;
  color: var(--text-muted);
}

.quick-actions {
  display: flex;
  gap: 8px;
}

/* 主要内容区域 */
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.tab-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.right-panel {
  width: 300px;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-primary);
  display: flex;
  flex-direction: column;
}

.panel-header {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  border-bottom: 1px solid var(--border-primary);
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
}

.info-section {
  margin-bottom: 25px;
}

.info-section h4 {
  margin: 0 0 15px 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.info-item {
  margin-bottom: 12px;
}

.info-label {
  display: block;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.quick-actions-grid .el-button {
  height: 32px;
  font-size: 12px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.activity-item {
  display: flex;
  gap: 10px;
  padding: 8px;
  background: var(--surface-elevated);
  border-radius: 6px;
}

.activity-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.activity-icon.success {
  color: #67c23a;
}

.activity-icon.info {
  color: #409eff;
}

.activity-icon.warning {
  color: #e6a23c;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-text {
  font-size: 12px;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.activity-time {
  font-size: 11px;
  color: var(--text-muted);
}

/* 底部信息栏 */
.bottom-status-bar {
  height: 35px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  font-size: 12px;
}

.bottom-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.connection-icon {
  font-size: 12px;
}

.connection-icon.success {
  color: #67c23a;
}

.connection-icon.warning {
  color: #e6a23c;
}

.connection-icon.error {
  color: #f56c6c;
}

.bottom-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.system-messages {
  display: flex;
  gap: 15px;
}

.message-item {
  color: var(--text-muted);
}

.bottom-right {
  display: flex;
  align-items: center;
}

.quick-shortcuts {
  display: flex;
  gap: 4px;
}

/* 通知中心 */
.notifications-list {
  padding: 15px;
}

.notification-item {
  margin-bottom: 15px;
  padding: 12px;
  background: var(--card-bg);
  border-radius: 6px;
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.notification-icon {
  font-size: 14px;
}

.notification-icon.success {
  color: #67c23a;
}

.notification-icon.warning {
  color: #e6a23c;
}

.notification-icon.info {
  color: #409eff;
}

.notification-time {
  font-size: 11px;
  color: var(--text-muted);
}

.notification-content {
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .right-panel {
    width: 250px;
  }
  
  .quick-stats {
    gap: 40px;
  }
}

@media (max-width: 768px) {
  .top-status-bar {
    padding: 0 10px;
  }
  
  .status-center {
    display: none;
  }
  
  .user-details {
    display: none;
  }
  
  .right-panel {
    position: fixed;
    right: 0;
    top: 60px;
    bottom: 35px;
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  }
  
  .right-panel.show {
    transform: translateX(0);
  }
  
  .bottom-status-bar {
    padding: 0 10px;
  }
  
  .system-messages {
    display: none;
  }
}

/* Element Plus 样式覆盖 */
:deep(.el-button) {
  background: transparent;
  border: none;
  color: var(--text-secondary);
}

:deep(.el-button:hover) {
  color: var(--text-primary);
  background: var(--bg-hover);
}

:deep(.el-progress-bar__outer) {
  background-color: var(--border-primary);
}

:deep(.el-drawer) {
  background: var(--bg-secondary);
}

:deep(.el-drawer__header) {
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-primary);
}

:deep(.el-drawer__body) {
  background: var(--bg-primary);
}

:deep(.el-dialog) {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
}

:deep(.el-dialog__header) {
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-primary);
}

:deep(.el-dialog__body) {
  background: var(--bg-primary);
  color: var(--text-primary);
}

:deep(.el-tabs__nav-wrap::after) {
  background-color: var(--border-primary);
}

:deep(.el-tabs__item) {
  color: var(--text-secondary);
}

:deep(.el-tabs__item.is-active) {
  color: var(--text-primary);
}

:deep(.el-form-item__label) {
  color: var(--text-primary);
}

:deep(.el-input__inner) {
  background: var(--surface-elevated);
  border-color: var(--border-primary);
  color: var(--text-primary);
}
</style>