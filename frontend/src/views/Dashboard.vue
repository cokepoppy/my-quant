<template>
  <div class="professional-dashboard">
    <!-- 顶部状态栏 -->
    <div class="top-status-bar">
      <div class="status-left">
        <div class="system-status">
          <el-icon
            class="status-icon"
            :class="systemStatus.connected ? 'connected' : 'disconnected'"
          >
            <connection />
          </el-icon>
          <span class="status-text">{{
            systemStatus.connected ? "已连接" : "未连接"
          }}</span>
          <span class="latency">延迟: {{ systemStatus.latency }}ms</span>
        </div>
        <div class="market-time">
          <el-icon><clock /></el-icon>
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
              <el-icon><question-filled /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="全屏模式 (F12)" placement="bottom">
            <el-button size="small" text @click="toggleFullscreen">
              <el-icon><full-screen /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="设置" placement="bottom">
            <el-button size="small" text @click="goToSettings">
              <el-icon><setting /></el-icon>
            </el-button>
          </el-tooltip>
          <el-dropdown @command="handleUserCommand">
            <div class="user-info">
              <el-avatar :size="32" :src="userAvatar">
                {{ authStore.userName.charAt(0).toUpperCase() }}
              </el-avatar>
              <span class="username">{{ authStore.userName }}</span>
              <el-icon><arrow-down /></el-icon>
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

    <!-- 主要内容区域 - 四窗口布局 -->
    <div class="main-content-area">
      <!-- 左侧导航面板 -->
      <div class="left-panel">
        <!-- 市场观察 -->
        <div class="panel-section">
          <div class="panel-header">
            <h3>市场观察</h3>
            <div class="panel-controls">
              <el-button size="small" text @click="refreshMarketData">
                <el-icon><refresh /></el-icon>
              </el-button>
              <el-button size="small" text @click="openMarketSettings">
                <el-icon><setting /></el-icon>
              </el-button>
            </div>
          </div>
          <div class="market-watch">
            <div
              v-for="market in marketData"
              :key="market.symbol"
              class="market-item"
              :class="{ selected: selectedMarket === market.symbol }"
              @click="selectMarket(market.symbol)"
            >
              <div class="market-symbol">{{ market.symbol }}</div>
              <div
                class="market-price"
                :class="market.change >= 0 ? 'positive' : 'negative'"
              >
                {{ market.price }}
              </div>
              <div
                class="market-change"
                :class="market.change >= 0 ? 'positive' : 'negative'"
              >
                {{ market.change >= 0 ? "+" : "" }}{{ market.changePercent }}%
              </div>
            </div>
          </div>
        </div>

        <!-- 策略管理 -->
        <div class="panel-section">
          <div class="panel-header">
            <h3>策略管理</h3>
            <el-button size="small" type="primary" @click="goToCreateStrategy">
              <el-icon><plus /></el-icon>
            </el-button>
          </div>
          <div class="strategy-list">
            <div
              v-for="strategy in recentStrategies"
              :key="strategy.id"
              class="strategy-item"
            >
              <div class="strategy-status-icon">
                <el-icon :class="strategy.status">
                  <component :is="getStrategyStatusIcon(strategy.status)" />
                </el-icon>
              </div>
              <div class="strategy-info">
                <div class="strategy-name">{{ strategy.name }}</div>
                <div class="strategy-type">{{ strategy.type }}</div>
              </div>
              <div
                class="strategy-performance"
                :class="strategy.performance >= 0 ? 'positive' : 'negative'"
              >
                {{ strategy.performance >= 0 ? "+" : ""
                }}{{ strategy.performance }}%
              </div>
            </div>
          </div>
        </div>

        <!-- 工具箱 -->
        <div class="panel-section">
          <div class="panel-header">
            <h3>工具箱</h3>
          </div>
          <div class="toolbox">
            <el-button size="small" class="tool-btn" @click="openChartTools">
              <el-icon><operation /></el-icon>
              图表工具
            </el-button>
            <el-button size="small" class="tool-btn" @click="openIndicators">
              <el-icon><data-line /></el-icon>
              技术指标
            </el-button>
            <el-button size="small" class="tool-btn" @click="openTradingTools">
              <el-icon><money /></el-icon>
              交易操作
            </el-button>
          </div>
        </div>
      </div>

      <!-- 主图表区域 -->
      <div class="main-chart-area">
        <TradingChart
          :symbol="selectedMarket"
          :height="chartHeight"
          :realtime="true"
          @symbol-change="handleSymbolChange"
        />
      </div>

      <!-- 右侧信息面板 -->
      <div class="right-panel">
        <!-- 账户信息 -->
        <div class="panel-section">
          <div class="panel-header">
            <h3>账户信息</h3>
            <el-button size="small" text @click="refreshAccountData">
              <el-icon><refresh /></el-icon>
            </el-button>
          </div>
          <div class="account-info">
            <div class="account-item">
              <span class="label">总资产</span>
              <span class="value main-value">{{
                formatCurrency(dashboardStats.totalAssets)
              }}</span>
            </div>
            <div class="account-item">
              <span class="label">可用余额</span>
              <span class="value">{{
                formatCurrency(dashboardStats.availableBalance)
              }}</span>
            </div>
            <div class="account-item">
              <span class="label">浮动盈亏</span>
              <span
                class="value"
                :class="
                  dashboardStats.floatingPnL >= 0 ? 'positive' : 'negative'
                "
              >
                {{ dashboardStats.floatingPnL >= 0 ? "+" : ""
                }}{{ formatCurrency(dashboardStats.floatingPnL) }}
              </span>
            </div>
            <div class="account-item">
              <span class="label">今日盈亏</span>
              <span
                class="value"
                :class="dashboardStats.dailyPnL >= 0 ? 'positive' : 'negative'"
              >
                {{ dashboardStats.dailyPnL >= 0 ? "+" : ""
                }}{{ formatCurrency(dashboardStats.dailyPnL) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 快速交易 -->
        <div class="panel-section">
          <div class="panel-header">
            <h3>快速交易</h3>
            <el-tooltip content="快捷键: F9" placement="bottom">
              <el-icon class="help-icon"><question-filled /></el-icon>
            </el-tooltip>
          </div>
          <div class="quick-trading">
            <div class="trading-form">
              <div class="form-row">
                <label>品种</label>
                <el-select
                  v-model="tradingForm.symbol"
                  size="small"
                  style="width: 100%"
                >
                  <el-option
                    v-for="market in marketData"
                    :key="market.symbol"
                    :label="market.symbol"
                    :value="market.symbol"
                  />
                </el-select>
              </div>
              <div class="form-row">
                <label>数量</label>
                <el-input-number
                  v-model="tradingForm.amount"
                  size="small"
                  :min="0.001"
                  :step="0.001"
                  style="width: 100%"
                />
              </div>
              <div class="form-row">
                <label>类型</label>
                <el-radio-group v-model="tradingForm.type" size="small">
                  <el-radio-button label="buy">买入</el-radio-button>
                  <el-radio-button label="sell">卖出</el-radio-button>
                </el-radio-group>
              </div>
              <div class="form-row">
                <label>价格</label>
                <el-radio-group v-model="tradingForm.priceType" size="small">
                  <el-radio-button label="market">市价</el-radio-button>
                  <el-radio-button label="limit">限价</el-radio-button>
                </el-radio-group>
              </div>
              <div class="form-row" v-if="tradingForm.priceType === 'limit'">
                <label>限价</label>
                <el-input-number
                  v-model="tradingForm.limitPrice"
                  size="small"
                  :min="0"
                  :step="0.01"
                  style="width: 100%"
                />
              </div>
            </div>
            <div class="trading-actions">
              <el-button
                type="success"
                @click="executeTrade('buy')"
                :disabled="!canTrade"
              >
                买入 (F9)
              </el-button>
              <el-button
                type="danger"
                @click="executeTrade('sell')"
                :disabled="!canTrade"
              >
                卖出 (F10)
              </el-button>
              <el-button @click="closeAllPositions" :disabled="!hasPositions">
                清仓
              </el-button>
            </div>
          </div>
        </div>

        <!-- 当前持仓 -->
        <div class="panel-section">
          <div class="panel-header">
            <h3>当前持仓</h3>
            <el-button size="small" text @click="refreshPositions">
              <el-icon><refresh /></el-icon>
            </el-button>
          </div>
          <div class="positions-list">
            <div v-if="positions.length === 0" class="no-positions">
              暂无持仓
            </div>
            <div
              v-for="position in positions"
              :key="position.symbol"
              class="position-item"
            >
              <div class="position-symbol">{{ position.symbol }}</div>
              <div class="position-amount">{{ position.amount }}</div>
              <div
                class="position-pnl"
                :class="position.pnl >= 0 ? 'positive' : 'negative'"
              >
                {{ position.pnl >= 0 ? "+" : ""
                }}{{ formatCurrency(position.pnl) }}
              </div>
              <div
                class="position-change"
                :class="position.changePercent >= 0 ? 'positive' : 'negative'"
              >
                {{ position.changePercent >= 0 ? "+" : ""
                }}{{ position.changePercent }}%
              </div>
            </div>
          </div>
        </div>
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
          <el-icon><trend-charts /></el-icon>
          策略
        </el-button>
        <el-button size="small" text @click="goToBacktest">
          <el-icon><video-play /></el-icon>
          回测
        </el-button>
        <el-button size="small" text @click="goToTrading">
          <el-icon><money /></el-icon>
          交易
        </el-button>
        <el-button size="small" text @click="goToMonitoring">
          <el-icon><monitor /></el-icon>
          监控
        </el-button>
        <el-button size="small" text @click="goToSettings">
          <el-icon><setting /></el-icon>
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
import TradingChart from "@/components/charts/TradingChart.vue";
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

// 市场数据
const marketData = ref([
  {
    symbol: "BTC/USDT",
    price: "45230.00",
    change: 150.0,
    changePercent: 0.33,
  },
  {
    symbol: "ETH/USDT",
    price: "3145.00",
    change: -25.0,
    changePercent: -0.79,
  },
  {
    symbol: "BNB/USDT",
    price: "422.00",
    change: 2.0,
    changePercent: 0.48,
  },
  {
    symbol: "SOL/USDT",
    price: "98.50",
    change: 1.5,
    changePercent: 1.54,
  },
  {
    symbol: "XRP/USDT",
    price: "0.6234",
    change: -0.0023,
    changePercent: -0.37,
  },
]);

// 选中的市场
const selectedMarket = ref("BTC/USDT");

// 图表高度
const chartHeight = ref(600);

// 最近策略
const recentStrategies = ref([
  {
    id: "1",
    name: "MA双均线策略",
    type: "趋势跟踪",
    status: "active",
    performance: 12.5,
  },
  {
    id: "2",
    name: "RSI超卖策略",
    type: "均值回归",
    status: "paused",
    performance: -2.3,
  },
  {
    id: "3",
    name: "网格交易策略",
    type: "套利",
    status: "active",
    performance: 8.7,
  },
  {
    id: "4",
    name: "MACD策略",
    type: "趋势跟踪",
    status: "error",
    performance: -5.2,
  },
]);

// 交易表单
const tradingForm = reactive({
  symbol: "BTC/USDT",
  amount: 0.1,
  type: "buy",
  priceType: "market",
  limitPrice: 0,
});

// 持仓数据
const positions = ref([
  {
    symbol: "BTC/USDT",
    amount: "0.5",
    pnl: 1250.0,
    changePercent: 2.1,
  },
  {
    symbol: "ETH/USDT",
    amount: "2.0",
    pnl: -350.0,
    changePercent: -1.2,
  },
]);

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

// 计算属性
const canTrade = computed(() => {
  return tradingForm.amount > 0 && tradingForm.symbol;
});

const hasPositions = computed(() => {
  return positions.value.length > 0;
});

// 初始化
onMounted(() => {
  // 更新当前时间
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);

  // 添加键盘快捷键监听
  window.addEventListener("keydown", handleKeyDown);

  // 模拟实时数据更新
  setInterval(() => {
    updateMarketData();
    updateSystemMetrics();
    addRandomLog();
  }, 3000);
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

// 更新市场数据
const updateMarketData = () => {
  marketData.value = marketData.value.map((market) => {
    const change = (Math.random() - 0.5) * 10;
    const currentPrice = parseFloat(market.price);
    const newPrice = currentPrice + change;

    return {
      ...market,
      price: newPrice.toFixed(2),
      change: change,
      changePercent: ((change / currentPrice) * 100).toFixed(2),
    };
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

// 导航方法
const goToStrategies = () => {
  router.push("/strategies");
};

const goToMonitoring = () => {
  router.push("/monitoring");
};

const goToCreateStrategy = () => {
  router.push("/strategies/create");
};

const goToBacktest = () => {
  router.push("/backtest");
};

const goToTrading = () => {
  router.push("/trading");
};

const goToSettings = () => {
  router.push("/settings");
};

// 市场相关方法
const selectMarket = (symbol: string) => {
  selectedMarket.value = symbol;
  tradingForm.symbol = symbol;
};

const refreshMarketData = () => {
  updateMarketData();
  ElMessage.success("市场数据已刷新");
};

const openMarketSettings = () => {
  ElMessage.info("市场设置功能开发中");
};

// 图表相关方法
const handleSymbolChange = (symbol: string) => {
  selectedMarket.value = symbol;
};

const openChartTools = () => {
  ElMessage.info("图表工具功能开发中");
};

const openIndicators = () => {
  ElMessage.info("技术指标功能开发中");
};

const openTradingTools = () => {
  ElMessage.info("交易工具功能开发中");
};

// 交易相关方法
const executeTrade = (type: "buy" | "sell") => {
  const action = type === "buy" ? "买入" : "卖出";
  ElMessage.success(`${action}订单已提交`);

  // 添加交易日志
  recentLogs.value.push({
    id: Date.now().toString(),
    type: "trade",
    message: `${tradingForm.symbol} ${action}订单已提交`,
    timestamp: new Date(),
  });
};

const closeAllPositions = () => {
  ElMessageBox.confirm("确定要平仓所有持仓吗？", "确认平仓", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    positions.value = [];
    ElMessage.success("所有持仓已平仓");

    // 添加系统日志
    recentLogs.value.push({
      id: Date.now().toString(),
      type: "system",
      message: "所有持仓已平仓",
      timestamp: new Date(),
    });
  });
};

// 账户相关方法
const refreshAccountData = () => {
  ElMessage.success("账户数据已刷新");
};

const refreshPositions = () => {
  ElMessage.success("持仓数据已刷新");
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

// 格式化货币
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
};

// 格式化时间
const formatTime = (timestamp: Date) => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}天前`;
  } else if (hours > 0) {
    return `${hours}小时前`;
  } else if (minutes > 0) {
    return `${minutes}分钟前`;
  } else {
    return "刚刚";
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

// 获取状态类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    active: "success",
    paused: "warning",
    stopped: "info",
    error: "danger",
  };
  return statusMap[status] || "info";
};

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    active: "运行中",
    paused: "已暂停",
    stopped: "已停止",
    error: "错误",
  };
  return statusMap[status] || "未知";
};

// 获取进度条颜色
const getProgressColor = (percentage: number) => {
  if (percentage < 50) {
    return "#67c23a";
  } else if (percentage < 80) {
    return "#e6a23c";
  } else {
    return "#f56c6c";
  }
};

// 获取活动图标
const getActivityIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    strategy: VideoPlay,
    trade: Money,
    system: Setting,
    alert: TrendCharts,
  };
  return iconMap[type] || TrendCharts;
};

// 获取策略状态图标
const getStrategyStatusIcon = (status: string) => {
  const iconMap: Record<string, any> = {
    active: CircleCheck,
    paused: VideoCamera,
    stopped: CircleClose,
    error: Warning,
  };
  return iconMap[status] || CircleCheck;
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
      goToCreateStrategy();
      break;
    case "F3":
      event.preventDefault();
      goToBacktest();
      break;
    case "F4":
      event.preventDefault();
      goToTrading();
      break;
    case "F5":
      event.preventDefault();
      refreshMarketData();
      break;
    case "F9":
      event.preventDefault();
      executeTrade("buy");
      break;
    case "F10":
      event.preventDefault();
      executeTrade("sell");
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
/* Bloomberg风格专业色彩体系 */
:root {
  --primary-bg: #0a0a0a;
  --secondary-bg: #1a1a1a;
  --card-bg: #252525;
  --primary-text: #00ff88;
  --secondary-text: #ffffff;
  --muted-text: #888888;
  --positive-color: #00ff88;
  --negative-color: #ff3333;
  --warning-color: #ffaa00;
  --info-color: #00aaff;
  --brand-primary: #ff6600;
  --brand-secondary: #00d4aa;
  --border-color: rgba(255, 255, 255, 0.1);
  --hover-bg: rgba(255, 255, 255, 0.05);
}

.professional-dashboard {
  background: var(--primary-bg);
  color: var(--secondary-text);
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  height: 100vh;
  display: flex;
  flex-direction: column;
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
.main-content-area {
  flex: 1;
  display: grid;
  grid-template-columns: 250px 1fr 300px;
  gap: 1px;
  background: var(--border-color);
  overflow: hidden;
}

/* 左侧面板 */
.left-panel {
  background: var(--secondary-bg);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.left-panel::-webkit-scrollbar {
  width: 6px;
}

.left-panel::-webkit-scrollbar-track {
  background: var(--primary-bg);
}

.left-panel::-webkit-scrollbar-thumb {
  background: var(--brand-secondary);
  border-radius: 3px;
}

/* 面板通用样式 */
.panel-section {
  border-bottom: 1px solid var(--border-color);
  padding: 15px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.panel-header h3 {
  margin: 0;
  color: var(--primary-text);
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.panel-controls {
  display: flex;
  gap: 5px;
}

/* 市场观察 */
.market-watch {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.market-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 12px;
}

.market-item:hover {
  background: var(--hover-bg);
}

.market-item.selected {
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid var(--primary-text);
}

.market-symbol {
  color: var(--secondary-text);
  font-weight: 500;
  min-width: 80px;
}

.market-price {
  font-weight: 600;
  min-width: 60px;
  text-align: right;
}

.market-change {
  font-size: 11px;
  min-width: 45px;
  text-align: right;
}

/* 策略管理 */
.strategy-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.strategy-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background 0.2s;
  font-size: 12px;
}

.strategy-item:hover {
  background: var(--hover-bg);
}

.strategy-status-icon {
  font-size: 14px;
}

.strategy-status-icon.active {
  color: var(--positive-color);
}

.strategy-status-icon.paused {
  color: var(--warning-color);
}

.strategy-status-icon.error {
  color: var(--negative-color);
}

.strategy-info {
  flex: 1;
}

.strategy-name {
  color: var(--secondary-text);
  font-weight: 500;
  margin-bottom: 2px;
}

.strategy-type {
  color: var(--muted-text);
  font-size: 11px;
}

.strategy-performance {
  font-weight: 600;
  font-size: 11px;
  min-width: 40px;
  text-align: right;
}

/* 工具箱 */
.toolbox {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tool-btn {
  width: 100%;
  justify-content: flex-start;
  gap: 8px;
  font-size: 12px;
  height: 32px;
}

/* 主图表区域 */
.main-chart-area {
  background: var(--secondary-bg);
  padding: 10px;
  overflow: hidden;
}

/* 右侧面板 */
.right-panel {
  background: var(--secondary-bg);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.right-panel::-webkit-scrollbar {
  width: 6px;
}

.right-panel::-webkit-scrollbar-track {
  background: var(--primary-bg);
}

.right-panel::-webkit-scrollbar-thumb {
  background: var(--brand-secondary);
  border-radius: 3px;
}

/* 账户信息 */
.account-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.account-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
}

.account-item:last-child {
  border-bottom: none;
}

.account-item .label {
  color: var(--muted-text);
  font-size: 12px;
}

.account-item .value {
  color: var(--secondary-text);
  font-weight: 600;
  font-size: 13px;
}

.account-item .main-value {
  color: var(--primary-text);
  font-size: 16px;
  font-weight: 700;
}

/* 快速交易 */
.quick-trading {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trading-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-row label {
  color: var(--muted-text);
  font-size: 11px;
  font-weight: 500;
}

.trading-actions {
  display: flex;
  gap: 8px;
}

.trading-actions .el-button {
  flex: 1;
  font-size: 12px;
  height: 32px;
}

/* 持仓列表 */
.positions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.no-positions {
  text-align: center;
  color: var(--muted-text);
  font-size: 12px;
  padding: 20px;
}

.position-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: 4px;
  background: var(--hover-bg);
  font-size: 12px;
}

.position-symbol {
  color: var(--secondary-text);
  font-weight: 500;
  min-width: 80px;
}

.position-amount {
  color: var(--muted-text);
  min-width: 50px;
  text-align: center;
}

.position-pnl {
  font-weight: 600;
  min-width: 60px;
  text-align: right;
}

.position-change {
  font-size: 11px;
  min-width: 45px;
  text-align: right;
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

/* 通用颜色类 */
.positive {
  color: var(--positive-color) !important;
}

.negative {
  color: var(--negative-color) !important;
}

.help-icon {
  color: var(--muted-text);
  cursor: pointer;
  transition: color 0.2s;
}

.help-icon:hover {
  color: var(--primary-text);
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

:deep(.el-button--primary:hover) {
  background: var(--primary-text);
  border-color: var(--primary-text);
  color: var(--primary-bg);
}

:deep(.el-button--success) {
  background: var(--positive-color);
  border-color: var(--positive-color);
  color: var(--primary-bg);
}

:deep(.el-button--danger) {
  background: var(--negative-color);
  border-color: var(--negative-color);
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
@media (max-width: 1200px) {
  .main-content-area {
    grid-template-columns: 200px 1fr 250px;
  }
}

@media (max-width: 768px) {
  .main-content-area {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
  }

  .left-panel,
  .right-panel {
    display: none;
  }

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
.professional-dashboard {
  transition: all 0.3s ease;
}

.market-item,
.strategy-item,
.position-item {
  transition: all 0.2s ease;
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
