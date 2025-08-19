<template>
  <div class="interactive-dashboard" @keydown="handleKeyDown" tabindex="0">
    <!-- 快捷键帮助面板 -->
    <el-drawer
      v-model="shortcutsHelpOpen"
      title="键盘快捷键"
      direction="rtl"
      size="400px"
    >
      <div class="shortcuts-list">
        <div class="shortcut-group">
          <h4>导航</h4>
          <div class="shortcut-item">
            <kbd>Alt</kbd> + <kbd>D</kbd>
            <span>仪表板</span>
          </div>
          <div class="shortcut-item">
            <kbd>Alt</kbd> + <kbd>S</kbd>
            <span>策略管理</span>
          </div>
          <div class="shortcut-item">
            <kbd>Alt</kbd> + <kbd>T</kbd>
            <span>交易管理</span>
          </div>
          <div class="shortcut-item">
            <kbd>Alt</kbd> + <kbd>B</kbd>
            <span>回测分析</span>
          </div>
        </div>

        <div class="shortcut-group">
          <h4>交易操作</h4>
          <div class="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
            <span>快速下单</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>C</kbd>
            <span>平仓所有</span>
          </div>
          <div class="shortcut-item">
            <kbd>Space</kbd>
            <span>暂停/继续策略</span>
          </div>
        </div>

        <div class="shortcut-group">
          <h4>界面操作</h4>
          <div class="shortcut-item">
            <kbd>F11</kbd>
            <span>全屏模式</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>F</kbd>
            <span>搜索</span>
          </div>
          <div class="shortcut-item">
            <kbd>Esc</kbd>
            <span>关闭弹窗</span>
          </div>
          <div class="shortcut-item">
            <kbd>?</kbd>
            <span>显示帮助</span>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 快速下单对话框 -->
    <el-dialog
      v-model="quickOrderOpen"
      title="快速下单"
      width="500px"
      @keydown.enter="submitQuickOrder"
    >
      <el-form :model="quickOrderForm" label-width="80px">
        <el-form-item label="交易品种">
          <el-select v-model="quickOrderForm.symbol" placeholder="选择交易品种">
            <el-option label="BTC/USDT" value="BTC/USDT" />
            <el-option label="ETH/USDT" value="ETH/USDT" />
            <el-option label="BNB/USDT" value="BNB/USDT" />
          </el-select>
        </el-form-item>
        <el-form-item label="方向">
          <el-radio-group v-model="quickOrderForm.side">
            <el-radio label="buy">买入</el-radio>
            <el-radio label="sell">卖出</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number
            v-model="quickOrderForm.size"
            :min="0"
            :step="0.001"
            :precision="3"
            placeholder="输入数量"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="quickOrderOpen = false">取消</el-button>
        <el-button type="primary" @click="submitQuickOrder">
          确认下单 (Enter)
        </el-button>
      </template>
    </el-dialog>

    <!-- 拖拽排序提示 -->
    <el-alert
      v-if="dragModeActive"
      title="拖拽模式已激活"
      type="info"
      description="拖拽卡片可以重新排列布局，按 Esc 键退出拖拽模式"
      show-icon
      closable
      @close="exitDragMode"
      style="margin-bottom: 20px"
    />

    <!-- 主要内容区域 -->
    <div class="dashboard-grid" ref="dashboardGrid">
      <!-- 可拖拽的卡片组件 -->
      <div
        v-for="(card, index) in dashboardCards"
        :key="card.id"
        class="dashboard-card"
        :class="{ dragging: card.isDragging }"
        :style="{
          gridArea: card.gridArea,
          order: card.order,
          opacity: card.isDragging ? 0.5 : 1,
        }"
        draggable="dragModeActive"
        @dragstart="handleDragStart($event, index)"
        @dragover="handleDragOver($event, index)"
        @dragend="handleDragEnd(index)"
        @dragleave="handleDragLeave(index)"
      >
        <div class="card-header">
          <div class="card-title">
            <el-icon><component :is="card.icon" /></el-icon>
            <span>{{ card.title }}</span>
          </div>
          <div class="card-actions">
            <el-button
              v-if="dragModeActive"
              type="text"
              size="small"
              @click="toggleCardVisibility(index)"
            >
              <el-icon><view /></el-icon>
            </el-button>
            <el-button type="text" size="small" @click="refreshCard(index)">
              <el-icon><refresh /></el-icon>
            </el-button>
            <el-button type="text" size="small" @click="toggleCardSize(index)">
              <el-icon
                ><component :is="card.isExpanded ? 'remove' : 'plus'"
              /></el-icon>
            </el-button>
          </div>
        </div>

        <div class="card-content" :class="{ expanded: card.isExpanded }">
          <component :is="card.component" v-bind="card.props" />
        </div>

        <div class="card-footer" v-if="card.showFooter">
          <el-button type="text" size="small" @click="viewDetails(card)">
            查看详情
          </el-button>
        </div>
      </div>
    </div>

    <!-- 浮动操作按钮 -->
    <div class="floating-actions">
      <el-button
        type="primary"
        circle
        size="large"
        @click="toggleDragMode"
        :class="{ active: dragModeActive }"
      >
        <el-icon><operation /></el-icon>
      </el-button>

      <el-button type="success" circle size="large" @click="openQuickOrder">
        <el-icon><plus /></el-icon>
      </el-button>

      <el-button
        type="info"
        circle
        size="large"
        @click="shortcutsHelpOpen = true"
      >
        <el-icon><question-filled /></el-icon>
      </el-button>
    </div>

    <!-- 实时通知 Toast -->
    <div class="notification-toast" v-if="showToast">
      <div class="toast-content" :class="toastType">
        <el-icon><component :is="toastIcon" /></el-icon>
        <span>{{ toastMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  Operation,
  Plus,
  QuestionFilled,
  View,
  Refresh,
  Remove,
  TrendCharts,
  Money,
  VideoPlay,
  DataLine,
  Setting,
  Monitor,
  Success,
  Warning,
  Info,
  Close,
} from "@element-plus/icons-vue";

interface DashboardCard {
  id: string;
  title: string;
  icon: string;
  component: string;
  props: any;
  gridArea: string;
  order: number;
  isDragging: boolean;
  isExpanded: boolean;
  isVisible: boolean;
  showFooter: boolean;
}

const router = useRouter();

// 状态管理
const shortcutsHelpOpen = ref(false);
const quickOrderOpen = ref(false);
const dragModeActive = ref(false);
const dashboardGrid = ref<HTMLElement>();

// 快速下单表单
const quickOrderForm = reactive({
  symbol: "BTC/USDT",
  side: "buy",
  size: 0.1,
});

// 仪表板卡片配置
const dashboardCards = ref<DashboardCard[]>([
  {
    id: "overview",
    title: "账户概览",
    icon: "Monitor",
    component: "AccountOverview",
    props: {},
    gridArea: "overview",
    order: 1,
    isDragging: false,
    isExpanded: false,
    isVisible: true,
    showFooter: true,
  },
  {
    id: "chart",
    title: "价格图表",
    icon: "TrendCharts",
    component: "TradingChart",
    props: { height: 300 },
    gridArea: "chart",
    order: 2,
    isDragging: false,
    isExpanded: false,
    isVisible: true,
    showFooter: false,
  },
  {
    id: "positions",
    title: "持仓管理",
    icon: "Money",
    component: "PositionsTable",
    props: {},
    gridArea: "positions",
    order: 3,
    isDragging: false,
    isExpanded: false,
    isVisible: true,
    showFooter: true,
  },
  {
    id: "strategies",
    title: "策略状态",
    icon: "Setting",
    component: "StrategyList",
    props: {},
    gridArea: "strategies",
    order: 4,
    isDragging: false,
    isExpanded: false,
    isVisible: true,
    showFooter: true,
  },
  {
    id: "performance",
    title: "性能分析",
    icon: "DataLine",
    component: "PerformanceChart",
    props: {},
    gridArea: "performance",
    order: 5,
    isDragging: false,
    isExpanded: false,
    isVisible: true,
    showFooter: true,
  },
  {
    id: "activity",
    title: "最近活动",
    icon: "VideoPlay",
    component: "ActivityFeed",
    props: {},
    gridArea: "activity",
    order: 6,
    isDragging: false,
    isExpanded: false,
    isVisible: true,
    showFooter: false,
  },
]);

// Toast 通知
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("info");
const toastIcon = ref("Info");

// 键盘快捷键处理
const handleKeyDown = (event: KeyboardEvent) => {
  // 防止在输入框中触发快捷键
  if (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement
  ) {
    return;
  }

  switch (event.key) {
    case "?":
      event.preventDefault();
      shortcutsHelpOpen.value = true;
      break;

    case "Escape":
      event.preventDefault();
      if (shortcutsHelpOpen.value) {
        shortcutsHelpOpen.value = false;
      } else if (quickOrderOpen.value) {
        quickOrderOpen.value = false;
      } else if (dragModeActive.value) {
        exitDragMode();
      }
      break;

    case "F11":
      event.preventDefault();
      toggleFullscreen();
      break;

    case " ":
      event.preventDefault();
      toggleStrategiesPause();
      break;

    case "d":
      if (event.altKey) {
        event.preventDefault();
        router.push("/dashboard");
      }
      break;

    case "s":
      if (event.altKey) {
        event.preventDefault();
        router.push("/strategies");
      }
      break;

    case "t":
      if (event.altKey) {
        event.preventDefault();
        router.push("/trading");
      }
      break;

    case "b":
      if (event.altKey) {
        event.preventDefault();
        router.push("/backtest");
      }
      break;

    case "Enter":
      if (event.ctrlKey) {
        event.preventDefault();
        openQuickOrder();
      }
      break;

    case "f":
      if (event.ctrlKey) {
        event.preventDefault();
        // 聚焦搜索框
        const searchInput = document.querySelector(
          ".search-input input",
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
      break;
  }
};

// 拖拽功能
const handleDragStart = (event: DragEvent, index: number) => {
  if (!dragModeActive.value) return;

  dashboardCards.value[index].isDragging = true;
  event.dataTransfer?.setData("text/plain", index.toString());
  event.dataTransfer?.effectAllowed = "move";
};

const handleDragOver = (event: DragEvent, index: number) => {
  if (!dragModeActive.value) return;

  event.preventDefault();
  event.dataTransfer!.dropEffect = "move";
};

const handleDragEnd = (index: number) => {
  dashboardCards.value[index].isDragging = false;
};

const handleDragLeave = (index: number) => {
  // 处理拖拽离开逻辑
};

// 拖拽模式切换
const toggleDragMode = () => {
  dragModeActive.value = !dragModeActive.value;
  if (dragModeActive.value) {
    showToastNotification("拖拽模式已激活", "info");
  }
};

const exitDragMode = () => {
  dragModeActive.value = false;
};

// 快速下单
const openQuickOrder = () => {
  quickOrderOpen.value = true;
};

const submitQuickOrder = () => {
  ElMessage.success("订单提交成功");
  quickOrderOpen.value = false;
  showToastNotification("订单已提交", "success");
};

// 策略暂停/继续
const toggleStrategiesPause = () => {
  showToastNotification("策略状态已切换", "info");
};

// 全屏切换
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};

// 卡片操作
const refreshCard = (index: number) => {
  showToastNotification(
    `${dashboardCards.value[index].title} 已刷新`,
    "success",
  );
};

const toggleCardSize = (index: number) => {
  dashboardCards.value[index].isExpanded =
    !dashboardCards.value[index].isExpanded;
};

const toggleCardVisibility = (index: number) => {
  dashboardCards.value[index].isVisible =
    !dashboardCards.value[index].isVisible;
};

const viewDetails = (card: DashboardCard) => {
  router.push(`/${card.id}`);
};

// Toast 通知
const showToastNotification = (message: string, type: string) => {
  toastMessage.value = message;
  toastType.value = type;

  const iconMap: Record<string, any> = {
    success: "Success",
    warning: "Warning",
    info: "Info",
    error: "Close",
  };
  toastIcon.value = iconMap[type] || "Info";

  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

// 生命周期
onMounted(() => {
  // 聚焦到容器以启用键盘快捷键
  document.querySelector(".interactive-dashboard")?.focus();

  // 保存用户布局偏好
  const savedLayout = localStorage.getItem("dashboardLayout");
  if (savedLayout) {
    try {
      const layout = JSON.parse(savedLayout);
      dashboardCards.value = layout;
    } catch (error) {
      console.error("Failed to load saved layout:", error);
    }
  }
});

onUnmounted(() => {
  // 保存布局
  localStorage.setItem("dashboardLayout", JSON.stringify(dashboardCards.value));
});
</script>

<style scoped>
.interactive-dashboard {
  outline: none;
  position: relative;
  min-height: 100vh;
}

.dashboard-grid {
  display: grid;
  grid-template-areas:
    "overview chart chart"
    "positions strategies performance"
    "activity activity activity";
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: auto auto auto;
  gap: 20px;
  padding: 20px;
  transition: all 0.3s ease;
}

.dashboard-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.dashboard-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.dashboard-card.dragging {
  cursor: move;
  transform: rotate(2deg);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ffffff;
  font-weight: 600;
  font-size: 16px;
}

.card-actions {
  display: flex;
  gap: 5px;
}

.card-content {
  flex: 1;
  padding: 20px;
  overflow: hidden;
}

.card-content.expanded {
  min-height: 400px;
}

.card-footer {
  padding: 15px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.floating-actions {
  position: fixed;
  bottom: 30px;
  right: 30px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  z-index: 1000;
}

.floating-actions .el-button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.floating-actions .el-button:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.floating-actions .el-button.active {
  background: #00d4aa;
  border-color: #00d4aa;
}

.shortcuts-list {
  padding: 20px;
}

.shortcut-group {
  margin-bottom: 30px;
}

.shortcut-group h4 {
  color: #ffffff;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 600;
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.shortcut-item:last-child {
  border-bottom: none;
}

kbd {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 2px 6px;
  font-family: monospace;
  font-size: 12px;
  color: #ffffff;
  margin: 0 2px;
}

.shortcut-item span {
  color: #e0e0e0;
  font-size: 14px;
}

.notification-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 20px;
  border-radius: 8px;
  color: #ffffff;
  font-weight: 500;
  min-width: 250px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.toast-content.success {
  background: rgba(0, 212, 170, 0.2);
  border: 1px solid #00d4aa;
}

.toast-content.warning {
  background: rgba(255, 193, 7, 0.2);
  border: 1px solid #ffc107;
}

.toast-content.info {
  background: rgba(64, 158, 255, 0.2);
  border: 1px solid #409eff;
}

.toast-content.error {
  background: rgba(255, 71, 87, 0.2);
  border: 1px solid #ff4757;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-areas:
      "overview chart"
      "positions strategies"
      "performance activity";
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-areas:
      "overview"
      "chart"
      "positions"
      "strategies"
      "performance"
      "activity";
    grid-template-columns: 1fr;
  }

  .floating-actions {
    bottom: 20px;
    right: 20px;
  }

  .floating-actions .el-button {
    width: 48px;
    height: 48px;
  }
}

/* Element Plus 样式覆盖 */
:deep(.el-drawer) {
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(20px);
}

:deep(.el-drawer__header) {
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

:deep(.el-drawer__body) {
  background: rgba(255, 255, 255, 0.02);
}

:deep(.el-dialog) {
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.el-dialog__header) {
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.el-dialog__title) {
  color: #ffffff;
}

:deep(.el-dialog__body) {
  background: rgba(255, 255, 255, 0.02);
  color: #e0e0e0;
}

:deep(.el-button--text) {
  color: #e0e0e0;
}

:deep(.el-button--text:hover) {
  color: #ffffff;
}
</style>
