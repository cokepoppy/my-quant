<template>
  <div class="dashboard-layout">
    <!-- 顶部状态栏 -->
    <div class="top-status-bar">
      <div class="status-left">
        <div class="system-status">
          <el-icon
            class="status-icon"
            :class="systemStatus.connected ? 'connected' : 'disconnected'"
          >
            <Connection />
          </el-icon>
          <span class="status-text">{{
            systemStatus.connected ? "已连接" : "未连接"
          }}</span>
          <span class="latency">延迟: {{ systemStatus.latency }}ms</span>
        </div>
        <div class="market-time">
          <el-icon><Clock /></el-icon>
          <span>{{ currentTime }}</span>
        </div>
      </div>
      <div class="status-center">
        <div class="system-info">
          <span class="cpu-usage">CPU: {{ systemMetrics.cpu }}%</span>
          <span class="memory-usage">内存: {{ systemMetrics.memory }}%</span>
          <span class="active-strategies"
            >运行策略: {{ dashboardStats.activeStrategies }}</span
          >
        </div>
      </div>
      <div class="status-right">
        <div class="user-controls">
          <el-tooltip content="快捷键帮助 (F1)" placement="bottom">
            <el-button size="small" text @click="showHelp">
              <el-icon><QuestionFilled /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="全屏模式 (F12)" placement="bottom">
            <el-button size="small" text @click="toggleFullscreen">
              <el-icon><FullScreen /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="设置" placement="bottom">
            <el-button size="small" text @click="goToSettings">
              <el-icon><Setting /></el-icon>
            </el-button>
          </el-tooltip>
          <el-dropdown @command="handleUserCommand">
            <div class="user-info">
              <el-avatar :size="32" :src="userAvatar">
                {{ authStore.userName.charAt(0).toUpperCase() }}
              </el-avatar>
              <span class="username">{{ authStore.userName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="settings">系统设置</el-dropdown-item>
                <el-dropdown-item divided command="logout"
                  >退出登录</el-dropdown-item
                >
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧导航菜单 -->
      <SidebarNav
        v-model="activeNavItem"
        v-model:collapsed="navCollapsed"
        @item-click="handleNavItemClick"
      />

      <!-- 页签系统区域 -->
      <div class="tab-area">
        <TabSystem
          ref="tabSystemRef"
          v-model="activeTab"
          :tabs="tabs"
          @tab-change="handleTabChange"
          @tab-close="handleTabClose"
          @tabs-update="handleTabsUpdate"
          @view-strategy="handleViewStrategy"
          @edit-strategy="handleEditStrategy"
          @create-strategy="handleCreateStrategy"
        />
      </div>
    </div>

    <!-- 底部信息栏 -->
    <div class="bottom-status-bar">
      <div class="status-section">
        <div class="connection-status">
          <span
            class="status-indicator"
            :class="systemStatus.connected ? 'connected' : 'disconnected'"
          ></span>
          <span>{{ systemStatus.connected ? "连接正常" : "连接断开" }}</span>
        </div>
        <div class="system-status">
          <span>系统状态: </span>
          <el-tag
            :type="systemMetrics.status === 'healthy' ? 'success' : 'warning'"
            size="small"
          >
            {{ systemMetrics.status === "healthy" ? "正常" : "警告" }}
          </el-tag>
        </div>
      </div>
      <div class="log-section">
        <div class="log-entries">
          <div
            v-for="log in recentLogs"
            :key="log.id"
            class="log-entry"
            :class="log.type"
          >
            <span class="log-time">{{ formatLogTime(log.timestamp) }}</span>
            <span class="log-type">[{{ log.type }}]</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
      <div class="quick-actions">
        <el-button size="small" text @click="goToStrategies">
          <el-icon><TrendCharts /></el-icon>
          策略
        </el-button>
        <el-button size="small" text @click="goToBacktest">
          <el-icon><VideoPlay /></el-icon>
          回测
        </el-button>
        <el-button size="small" text @click="goToTrading">
          <el-icon><Money /></el-icon>
          交易
        </el-button>
        <el-button size="small" text @click="goToMonitoring">
          <el-icon><Monitor /></el-icon>
          监控
        </el-button>
        <el-button size="small" text @click="goToSettings">
          <el-icon><Setting /></el-icon>
          设置
        </el-button>
      </div>
    </div>

    <!-- 快捷键帮助对话框 -->
    <el-dialog v-model="helpDialogVisible" title="快捷键帮助" width="600px">
      <div class="shortcut-help">
        <div class="shortcut-section">
          <h4>基础快捷键</h4>
          <div class="shortcut-item">
            <span class="key">F1</span>
            <span class="desc">显示帮助</span>
          </div>
          <div class="shortcut-item">
            <span class="key">F2</span>
            <span class="desc">新建策略</span>
          </div>
          <div class="shortcut-item">
            <span class="key">F3</span>
            <span class="desc">运行回测</span>
          </div>
          <div class="shortcut-item">
            <span class="key">F4</span>
            <span class="desc">交易面板</span>
          </div>
          <div class="shortcut-item">
            <span class="key">F5</span>
            <span class="desc">刷新数据</span>
          </div>
          <div class="shortcut-item">
            <span class="key">F9</span>
            <span class="desc">快速买入</span>
          </div>
          <div class="shortcut-item">
            <span class="key">F10</span>
            <span class="desc">快速卖出</span>
          </div>
          <div class="shortcut-item">
            <span class="key">F12</span>
            <span class="desc">全屏模式</span>
          </div>
        </div>
        <div class="shortcut-section">
          <h4>时间周期快捷键</h4>
          <div class="shortcut-item">
            <span class="key">Alt+1</span>
            <span class="desc">1分钟K线</span>
          </div>
          <div class="shortcut-item">
            <span class="key">Alt+2</span>
            <span class="desc">5分钟K线</span>
          </div>
          <div class="shortcut-item">
            <span class="key">Alt+3</span>
            <span class="desc">15分钟K线</span>
          </div>
          <div class="shortcut-item">
            <span class="key">Alt+4</span>
            <span class="desc">1小时K线</span>
          </div>
          <div class="shortcut-item">
            <span class="key">Alt+5</span>
            <span class="desc">4小时K线</span>
          </div>
          <div class="shortcut-item">
            <span class="key">Alt+6</span>
            <span class="desc">日线</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { useAuthStore } from "@/stores/auth";
import SidebarNav from "@/components/layout/SidebarNav.vue";
import TabSystem from "@/components/layout/TabSystem.vue";
import DashboardOverview from "@/views/DashboardOverview.vue";
import StrategyList from "@/views/strategy/StrategyList.vue";
import BacktestSettings from "@/views/BacktestSettings.vue";
import TradingPanel from "@/views/TradingPanel.vue";
import {
  ArrowDown,
  TrendCharts,
  VideoPlay,
  Money,
  DataLine,
  Plus,
  Monitor,
  Setting,
  User,
  QuestionFilled,
  Connection,
  Clock,
  Refresh,
  Operation,
  FullScreen,
  VideoCamera,
  Warning,
  CircleCheck,
  CircleClose,
  InfoFilled,
} from "@element-plus/icons-vue";

const router = useRouter();
const authStore = useAuthStore();
const tabSystemRef = ref<InstanceType<typeof TabSystem>>();

// 导航状态
const activeNavItem = ref("dashboard");
const navCollapsed = ref(false);
const activeTab = ref("dashboard-overview");

// 系统状态
const systemStatus = reactive({
  connected: true,
  latency: 12,
});

// 当前时间
const currentTime = ref("");

// 仪表板统计数据
const dashboardStats = reactive({
  totalStrategies: 24,
  activeStrategies: 8,
  totalAssets: 125430.5,
  availableBalance: 45230.0,
  floatingPnL: 2150.5,
  dailyPnL: 580.25,
  totalPnL: 12580.5,
  pnlChange: 8.5,
  dailyVolume: 45230.0,
});

// 系统指标
const systemMetrics = reactive({
  cpu: 45,
  memory: 62,
  status: "healthy",
});

// 系统日志
const recentLogs = ref([
  {
    id: "1",
    type: "system",
    message: "数据同步完成",
    timestamp: new Date(),
  },
  {
    id: "2",
    type: "trade",
    message: "BTC买入订单已成交",
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
  },
  {
    id: "3",
    type: "strategy",
    message: "MA策略已启动",
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
  },
]);

// 帮助对话框
const helpDialogVisible = ref(false);

// 用户头像
const userAvatar = ref("");

// 页签配置
const tabs = ref([
  {
    id: "dashboard-overview",
    title: "总览",
    icon: Monitor,
    component: DashboardOverview,
    pinned: true,
  },
]);

// 导航项到页签的映射
const navItemToTab = {
  "dashboard": {
    id: "dashboard-overview",
    title: "总览",
    icon: Monitor,
    component: DashboardOverview,
    pinned: true,
  },
  "strategies": {
    id: "strategy-list",
    title: "策略列表",
    icon: TrendCharts,
    component: StrategyList,
  },
  "strategy-editor": {
    id: "strategy-editor",
    title: "策略编辑器",
    icon: Operation,
    component: () => import("@/views/StrategyEditor.vue"),
  },
  "strategy-templates": {
    id: "strategy-templates",
    title: "策略模板",
    icon: DataLine,
    component: () => import("@/views/StrategyTemplates.vue"),
  },
  "backtest": {
    id: "backtest-settings",
    title: "回测设置",
    icon: VideoPlay,
    component: BacktestSettings,
  },
  "backtest-results": {
    id: "backtest-results",
    title: "回测结果",
    icon: DataLine,
    component: () => import("@/views/BacktestResults.vue"),
  },
  "optimization": {
    id: "optimization",
    title: "参数优化",
    icon: Plus,
    component: () => import("@/views/Optimization.vue"),
  },
  "trading": {
    id: "trading-panel",
    title: "交易面板",
    icon: Money,
    component: TradingPanel,
  },
  "orders": {
    id: "orders",
    title: "订单管理",
    component: () => import("@/views/Orders.vue"),
  },
  "positions": {
    id: "positions",
    title: "持仓管理",
    component: () => import("@/views/Positions.vue"),
  },
  "accounts": {
    id: "accounts",
    title: "账户管理",
    component: () => import("@/views/Accounts.vue"),
  },
  "risk-control": {
    id: "risk-control",
    title: "风控规则",
    icon: Warning,
    component: () => import("@/views/RiskControl.vue"),
  },
  "alerts": {
    id: "alerts",
    title: "预警监控",
    component: () => import("@/views/Alerts.vue"),
  },
  "market-data": {
    id: "market-data",
    title: "市场数据",
    component: () => import("@/views/MarketData.vue"),
  },
  "data-import": {
    id: "data-import",
    title: "数据导入",
    component: () => import("@/views/DataImport.vue"),
  },
  "users": {
    id: "users",
    title: "用户管理",
    icon: User,
    component: () => import("@/views/Users.vue"),
  },
  "settings": {
    id: "settings",
    title: "系统设置",
    icon: Setting,
    component: () => import("@/views/Settings.vue"),
  },
  "logs": {
    id: "logs",
    title: "系统日志",
    component: () => import("@/views/Logs.vue"),
  },
};

// 初始化
onMounted(() => {
  // 更新当前时间
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);

  // 添加键盘快捷键监听
  window.addEventListener("keydown", handleKeyDown);

  // 模拟实时数据更新
  setInterval(() => {
    updateSystemMetrics();
    addRandomLog();
  }, 3000);
  
  // 调试信息
  console.log('🔥 DashboardLayout mounted');
  console.log('🔥 TabSystem ref:', tabSystemRef.value);
  
  // 延迟检查 TabSystem 引用
  setTimeout(() => {
    console.log('🔥 TabSystem ref after timeout:', tabSystemRef.value);
  }, 1000);
});

// 组件卸载时清理事件监听器
onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});

// 更新当前时间
const updateCurrentTime = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString("zh-CN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// 更新系统指标
const updateSystemMetrics = () => {
  systemMetrics.cpu = Math.floor(Math.random() * 30) + 30;
  systemMetrics.memory = Math.floor(Math.random() * 20) + 50;

  // 更新连接状态和延迟
  systemStatus.latency = Math.floor(Math.random() * 20) + 5;
};

// 添加随机日志
const addRandomLog = () => {
  const logTypes = ["system", "trade", "strategy", "alert"];
  const messages = [
    "数据同步完成",
    "价格更新完成",
    "策略运行正常",
    "系统性能良好",
    "网络连接稳定",
  ];

  if (recentLogs.value.length > 10) {
    recentLogs.value.shift();
  }

  recentLogs.value.push({
    id: Date.now().toString(),
    type: logTypes[Math.floor(Math.random() * logTypes.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
    timestamp: new Date(),
  });
};

// 处理用户命令
const handleUserCommand = (command: string) => {
  switch (command) {
    case "profile":
      router.push("/profile");
      break;
    case "settings":
      router.push("/settings");
      break;
    case "logout":
      handleLogout();
      break;
  }
};

// 处理退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm("确定要退出登录吗？", "确认退出", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    await authStore.logout();
  } catch (error) {
    // 用户取消操作
  }
};

// 处理导航项点击
const handleNavItemClick = (item: string) => {
  const tabConfig = navItemToTab[item];
  if (tabConfig) {
    if (tabSystemRef.value) {
      const existingTab = tabSystemRef.value.hasTab(tabConfig.id);
      if (existingTab) {
        tabSystemRef.value.selectTab(tabConfig.id);
      } else {
        tabSystemRef.value.addTab(tabConfig);
      }
    }
  }
};

// 处理页签变化
const handleTabChange = (tab: any) => {
  console.log("页签变化:", tab);
};

// 处理页签关闭
const handleTabClose = (tabId: string) => {
  console.log("页签关闭:", tabId);
};

// 处理页签更新
const handleTabsUpdate = (newTabs: any[]) => {
  tabs.value = newTabs;
};

// 处理策略查看
const handleViewStrategy = (strategy: any) => {
  console.log('🔥 DashboardLayout handleViewStrategy called with:', strategy);
  
  const tabConfig = {
    id: `strategy-detail-${strategy.id}`,
    title: `策略详情 - ${strategy.name}`,
    icon: TrendCharts,
    component: () => import('@/views/strategy/StrategyDetail.vue'),
    props: {
      strategyId: strategy.id,
      strategy: strategy
    }
  };
  
  if (tabSystemRef.value) {
    tabSystemRef.value.addTab(tabConfig);
  }
};

// 添加调试日志
console.log('🔥 DashboardLayout: handleViewStrategy function defined:', !!handleViewStrategy);

// 处理策略编辑
const handleEditStrategy = (strategy: any) => {
  console.log('🔥 DashboardLayout handleEditStrategy called with:', strategy);
  
  const tabConfig = {
    id: `strategy-edit-${strategy.id}`,
    title: `编辑策略 - ${strategy.name}`,
    icon: Operation,
    component: () => import('@/views/strategy/EditStrategy.vue'),
    props: {
      strategyId: strategy.id,
      strategy: strategy
    }
  };
  
  if (tabSystemRef.value) {
    tabSystemRef.value.addTab(tabConfig);
  }
};

// 处理创建策略
const handleCreateStrategy = () => {
  console.log('🔥 DashboardLayout handleCreateStrategy called');
  
  const tabConfig = {
    id: 'strategy-create',
    title: '创建策略',
    icon: Plus,
    component: () => import('@/views/strategy/CreateStrategy.vue')
  };
  
  if (tabSystemRef.value) {
    tabSystemRef.value.addTab(tabConfig);
  }
};

// 导航方法
const goToStrategies = () => {
  handleNavItemClick("strategies");
};

const goToBacktest = () => {
  handleNavItemClick("backtest");
};

const goToTrading = () => {
  handleNavItemClick("trading");
};

const goToMonitoring = () => {
  handleNavItemClick("alerts");
};

const goToSettings = () => {
  handleNavItemClick("settings");
};

// 系统相关方法
const showHelp = () => {
  helpDialogVisible.value = true;
};

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};

// 格式化日志时间
const formatLogTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString("zh-CN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// 键盘快捷键处理
const handleKeyDown = (event: KeyboardEvent) => {
  // 防止在输入框中触发快捷键
  if (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement
  ) {
    return;
  }

  // F键功能
  switch (event.key) {
    case "F1":
      event.preventDefault();
      showHelp();
      break;
    case "F2":
      event.preventDefault();
      handleNavItemClick("strategy-editor");
      break;
    case "F3":
      event.preventDefault();
      handleNavItemClick("backtest");
      break;
    case "F4":
      event.preventDefault();
      handleNavItemClick("trading");
      break;
    case "F5":
      event.preventDefault();
      updateSystemMetrics();
      ElMessage.success("数据已刷新");
      break;
    case "F9":
      event.preventDefault();
      handleNavItemClick("trading");
      break;
    case "F10":
      event.preventDefault();
      handleNavItemClick("trading");
      break;
    case "F12":
      event.preventDefault();
      toggleFullscreen();
      break;
  }

  // Alt键组合
  if (event.altKey) {
    switch (event.key) {
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
        event.preventDefault();
        // 时间周期切换 (1m, 5m, 15m, 1h, 4h, 1d)
        const timeframes = ["1m", "5m", "15m", "1h", "4h", "1d"];
        const index = parseInt(event.key) - 1;
        if (index < timeframes.length) {
          ElMessage.info(`切换到${timeframes[index]}时间周期`);
        }
        break;
    }
  }
};
</script>

<style scoped>
.dashboard-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--primary-bg);
  color: var(--secondary-text);
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  overflow: hidden;
}

/* 顶部状态栏 */
.top-status-bar {
  height: 40px;
  background: var(--secondary-bg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  font-size: 12px;
  z-index: 100;
}

.status-left,
.status-center,
.status-right {
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
  font-size: 14px;
}

.status-icon.connected {
  color: var(--positive-color);
}

.status-icon.disconnected {
  color: var(--negative-color);
}

.status-text {
  color: var(--secondary-text);
}

.latency {
  color: var(--muted-text);
}

.market-time {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--muted-text);
}

.system-info {
  display: flex;
  gap: 15px;
}

.cpu-usage,
.memory-usage,
.active-strategies {
  color: var(--muted-text);
}

.user-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.user-info:hover {
  background: var(--hover-bg);
}

.username {
  color: var(--secondary-text);
  font-size: 12px;
  font-weight: 500;
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

/* 底部信息栏 */
.bottom-status-bar {
  height: 35px;
  background: var(--secondary-bg);
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  font-size: 11px;
  z-index: 100;
}

.status-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--negative-color);
}

.status-indicator.connected {
  background: var(--positive-color);
}

.system-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.log-section {
  flex: 1;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.log-entries {
  display: flex;
  gap: 15px;
  overflow-x: auto;
  white-space: nowrap;
}

.log-entries::-webkit-scrollbar {
  height: 4px;
}

.log-entries::-webkit-scrollbar-track {
  background: var(--primary-bg);
}

.log-entries::-webkit-scrollbar-thumb {
  background: var(--brand-secondary);
  border-radius: 2px;
}

.log-entry {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
}

.log-time {
  color: var(--muted-text);
}

.log-type {
  color: var(--info-color);
  font-weight: 500;
}

.log-message {
  color: var(--secondary-text);
}

.log-entry.system {
  color: var(--info-color);
}

.log-entry.trade {
  color: var(--positive-color);
}

.log-entry.strategy {
  color: var(--warning-color);
}

.log-entry.alert {
  color: var(--negative-color);
}

.quick-actions {
  display: flex;
  gap: 8px;
}

.quick-actions .el-button {
  font-size: 10px;
  height: 24px;
  padding: 0 8px;
}

/* 帮助对话框样式 */
.shortcut-help {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.shortcut-section h4 {
  color: var(--primary-text);
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 600;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
}

.shortcut-item:last-child {
  border-bottom: none;
}

.key {
  background: var(--card-bg);
  color: var(--primary-text);
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  font-weight: 600;
  min-width: 40px;
  text-align: center;
  border: 1px solid var(--border-color);
}

.desc {
  color: var(--secondary-text);
  font-size: 12px;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-button) {
  background: var(--card-bg);
  border-color: var(--border-color);
  color: var(--secondary-text);
  transition: all 0.2s;
}

:deep(.el-button:hover) {
  background: var(--hover-bg);
  border-color: var(--primary-text);
  color: var(--primary-text);
}

:deep(.el-button--primary) {
  background: var(--brand-secondary);
  border-color: var(--brand-secondary);
  color: var(--primary-bg);
}

:deep(.el-select) {
  background: var(--card-bg);
}

:deep(.el-select .el-input__wrapper) {
  background: var(--card-bg);
  border-color: var(--border-color);
}

:deep(.el-input__wrapper) {
  background: var(--card-bg);
  border-color: var(--border-color);
}

:deep(.el-input__inner) {
  color: var(--secondary-text);
}

:deep(.el-radio-group) {
  background: var(--card-bg);
}

:deep(.el-radio-button__inner) {
  background: var(--card-bg);
  border-color: var(--border-color);
  color: var(--secondary-text);
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: var(--brand-secondary);
  border-color: var(--brand-secondary);
  color: var(--primary-bg);
}

:deep(.el-dialog) {
  background: var(--secondary-bg);
  border: 1px solid var(--border-color);
}

:deep(.el-dialog__header) {
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
}

:deep(.el-dialog__title) {
  color: var(--primary-text);
}

:deep(.el-dialog__body) {
  background: var(--secondary-bg);
  color: var(--secondary-text);
}

:deep(.el-tag) {
  background: var(--card-bg);
  border-color: var(--border-color);
  color: var(--secondary-text);
}

:deep(.el-tag--success) {
  background: rgba(0, 255, 136, 0.1);
  border-color: var(--positive-color);
  color: var(--positive-color);
}

:deep(.el-tag--warning) {
  background: rgba(255, 170, 0, 0.1);
  border-color: var(--warning-color);
  color: var(--warning-color);
}

:deep(.el-tag--danger) {
  background: rgba(255, 51, 51, 0.1);
  border-color: var(--negative-color);
  color: var(--negative-color);
}

:deep(.el-dropdown-menu) {
  background: var(--secondary-bg);
  border: 1px solid var(--border-color);
}

:deep(.el-dropdown-menu__item) {
  color: var(--secondary-text);
}

:deep(.el-dropdown-menu__item:hover) {
  background: var(--hover-bg);
  color: var(--primary-text);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .top-status-bar {
    height: 60px;
    flex-direction: column;
    gap: 10px;
    padding: 10px;
  }

  .status-left,
  .status-center,
  .status-right {
    gap: 10px;
  }

  .bottom-status-bar {
    height: 60px;
    flex-direction: column;
    gap: 10px;
    padding: 10px;
  }
}

/* 动画效果 */
.dashboard-layout {
  transition: all 0.3s ease;
}

.el-button {
  transition: all 0.2s ease;
}

/* 加载动画 */
@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.status-icon.connected {
  animation: pulse 2s infinite;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--primary-bg);
}

::-webkit-scrollbar-thumb {
  background: var(--brand-secondary);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--primary-text);
}
</style>