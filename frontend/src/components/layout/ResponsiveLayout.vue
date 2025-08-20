<template>
  <div class="responsive-layout">
    <!-- 顶部导航栏（移动端） -->
    <div class="mobile-nav" v-if="isMobile">
      <div class="nav-header">
        <div class="logo">
          <el-icon><trend-charts /></el-icon>
          <span>量化交易</span>
        </div>
        <el-button type="text" @click="toggleMobileMenu" class="menu-toggle">
          <el-icon><menu /></el-icon>
        </el-button>
      </div>

      <!-- 移动端菜单 -->
      <div class="mobile-menu" v-show="mobileMenuOpen">
        <el-menu
          :default-active="activeMenu"
          mode="vertical"
          @select="handleMenuSelect"
          background-color="rgba(26, 26, 46, 0.95)"
          text-color="#e0e0e0"
          active-text-color="#00d4aa"
        >
          <el-menu-item index="/dashboard">
            <el-icon><monitor /></el-icon>
            <span>仪表板</span>
          </el-menu-item>
          <el-menu-item index="/strategies">
            <el-icon><setting /></el-icon>
            <span>策略管理</span>
          </el-menu-item>
          <el-menu-item index="/trading">
            <el-icon><money /></el-icon>
            <span>交易管理</span>
          </el-menu-item>
          <el-menu-item index="/backtest">
            <el-icon><video-play /></el-icon>
            <span>回测分析</span>
          </el-menu-item>
          <el-menu-item index="/monitoring">
            <el-icon><data-line /></el-icon>
            <span>系统监控</span>
          </el-menu-item>
        </el-menu>
      </div>
    </div>

    <!-- 桌面端侧边栏 -->
    <div class="desktop-sidebar" v-if="!isMobile">
      <div class="sidebar-header">
        <div class="logo">
          <el-icon><trend-charts /></el-icon>
          <span>量化交易系统</span>
        </div>
      </div>

      <el-menu
        :default-active="activeMenu"
        mode="vertical"
        @select="handleMenuSelect"
        background-color="rgba(26, 26, 46, 0.95)"
        text-color="#e0e0e0"
        active-text-color="#00d4aa"
        class="sidebar-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><monitor /></el-icon>
          <span>仪表板</span>
        </el-menu-item>
        <el-menu-item index="/strategies">
          <el-icon><setting /></el-icon>
          <span>策略管理</span>
        </el-menu-item>
        <el-menu-item index="/trading">
          <el-icon><money /></el-icon>
          <span>交易管理</span>
        </el-menu-item>
        <el-menu-item index="/accounts">
          <el-icon><wallet /></el-icon>
          <span>账户管理</span>
        </el-menu-item>
        <el-menu-item index="/market">
          <el-icon><data-line /></el-icon>
          <span>市场数据</span>
        </el-menu-item>
        <el-menu-item index="/backtest">
          <el-icon><video-play /></el-icon>
          <span>回测分析</span>
        </el-menu-item>
        <el-menu-item index="/monitoring">
          <el-icon><data-line /></el-icon>
          <span>系统监控</span>
        </el-menu-item>
        <el-menu-item index="/settings">
          <el-icon><operation /></el-icon>
          <span>系统设置</span>
        </el-menu-item>
      </el-menu>

      <!-- 用户信息 -->
      <div class="user-info">
        <div class="user-avatar">
          <el-avatar :size="40" :src="userAvatar">
            {{ userName.charAt(0).toUpperCase() }}
          </el-avatar>
        </div>
        <div class="user-details">
          <div class="user-name">{{ userName }}</div>
          <div class="user-role">{{ userRole }}</div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 顶部工具栏 -->
      <div class="top-toolbar">
        <div class="toolbar-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }"
              >首页</el-breadcrumb-item
            >
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.name }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="toolbar-right">
          <!-- 搜索框 -->
          <el-input
            v-model="searchQuery"
            placeholder="搜索..."
            size="small"
            class="search-input"
            clearable
          >
            <template #prefix>
              <el-icon><search /></el-icon>
            </template>
          </el-input>

          <!-- 通知 -->
          <el-badge :value="notificationCount" class="notification-badge">
            <el-button type="text" @click="toggleNotifications">
              <el-icon><bell /></el-icon>
            </el-button>
          </el-badge>

          <!-- 主题切换 -->
          <el-button type="text" @click="toggleTheme">
            <el-icon
              ><component :is="isDarkTheme ? 'sunny' : 'moon'"
            /></el-icon>
          </el-button>

          <!-- 全屏 -->
          <el-button type="text" @click="toggleFullscreen">
            <el-icon><full-screen /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 页面内容 -->
      <div class="page-content">
        <slot></slot>
      </div>
    </div>

    <!-- 通知面板 -->
    <div class="notification-panel" v-show="notificationsOpen">
      <div class="panel-header">
        <h3>通知中心</h3>
        <el-button type="text" @click="clearNotifications">
          清除全部
        </el-button>
      </div>
      <div class="notification-list">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="{ unread: !notification.read }"
        >
          <div class="notification-icon">
            <el-icon :class="notification.type">
              <component :is="getNotificationIcon(notification.type)" />
            </el-icon>
          </div>
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-time">
              {{ formatTime(notification.timestamp) }}
            </div>
          </div>
          <div class="notification-actions">
            <el-button
              type="text"
              size="small"
              @click="markAsRead(notification)"
            >
              <el-icon><check /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  TrendCharts,
  Monitor,
  Setting,
  Money,
  Wallet,
  VideoPlay,
  DataLine,
  Operation,
  Menu,
  Search,
  Bell,
  Sunny,
  Moon,
  FullScreen,
  Check,
} from "@element-plus/icons-vue";

interface Props {
  breadcrumbs?: Array<{ name: string; path: string }>;
}

const props = withDefaults(defineProps<Props>(), {
  breadcrumbs: () => [],
});

const router = useRouter();
const route = useRoute();

// 响应式状态
const isMobile = ref(false);
const mobileMenuOpen = ref(false);
const notificationsOpen = ref(false);
const isDarkTheme = ref(true);
const searchQuery = ref("");

// 用户信息
const userName = ref("交易员");
const userRole = ref("专业版用户");
const userAvatar = ref("");

// 菜单状态
const activeMenu = computed(() => route.path);

// 通知系统
const notificationCount = ref(3);
const notifications = ref([
  {
    id: 1,
    type: "success",
    title: "策略运行成功",
    message: "MA双均线策略已启动，当前运行正常",
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
  },
  {
    id: 2,
    type: "warning",
    title: "风险提醒",
    message: "当前账户风险度达到80%，请注意控制仓位",
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
  },
  {
    id: 3,
    type: "info",
    title: "系统更新",
    message: "系统将在今晚22:00进行例行维护",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: true,
  },
]);

// 检查屏幕尺寸
const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 768;
  if (!isMobile.value) {
    mobileMenuOpen.value = false;
  }
};

// 切换移动端菜单
const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
};

// 菜单选择
const handleMenuSelect = (index: string) => {
  router.push(index);
  mobileMenuOpen.value = false;
};

// 切换通知面板
const toggleNotifications = () => {
  notificationsOpen.value = !notificationsOpen.value;
};

// 切换主题
const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value;
  document.documentElement.setAttribute(
    "data-theme",
    isDarkTheme.value ? "dark" : "light",
  );
};

// 切换全屏
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};

// 标记通知为已读
const markAsRead = (notification: any) => {
  notification.read = true;
  notificationCount.value = notifications.value.filter((n) => !n.read).length;
};

// 清除所有通知
const clearNotifications = () => {
  notifications.value = [];
  notificationCount.value = 0;
  notificationsOpen.value = false;
};

// 获取通知图标
const getNotificationIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    success: "check",
    warning: "warning",
    info: "info",
    error: "close",
  };
  return iconMap[type] || "info";
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

// 生命周期
onMounted(() => {
  checkScreenSize();
  window.addEventListener("resize", checkScreenSize);

  // 设置默认主题
  document.documentElement.setAttribute("data-theme", "dark");
});

onUnmounted(() => {
  window.removeEventListener("resize", checkScreenSize);
});
</script>

<style scoped>
.responsive-layout {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

/* 移动端导航 */
.mobile-nav {
  display: block;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ffffff;
  font-weight: 600;
  font-size: 18px;
}

.menu-toggle {
  color: #ffffff;
  font-size: 20px;
}

.mobile-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  max-height: 400px;
  overflow-y: auto;
}

/* 桌面端侧边栏 */
.desktop-sidebar {
  display: none;
  width: 250px;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-menu {
  flex: 1;
  border: none;
}

.user-info {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-details {
  flex: 1;
}

.user-name {
  color: #ffffff;
  font-weight: 500;
  margin-bottom: 5px;
}

.user-role {
  color: #b0b0b0;
  font-size: 12px;
}

/* 主要内容区域 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-top: 60px;
}

.top-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.search-input {
  width: 200px;
}

.search-input :deep(.el-input__inner) {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.search-input :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.5);
}

.notification-badge :deep(.el-badge__content) {
  background: #ff4757;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* 通知面板 */
.notification-panel {
  position: fixed;
  top: 60px;
  right: 20px;
  width: 350px;
  max-height: 500px;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header h3 {
  margin: 0;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: background 0.3s ease;
}

.notification-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.notification-item.unread {
  background: rgba(0, 212, 170, 0.1);
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-icon.success {
  background: rgba(0, 212, 170, 0.2);
  color: #00d4aa;
}

.notification-icon.warning {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.notification-icon.info {
  background: rgba(64, 158, 255, 0.2);
  color: #409eff;
}

.notification-icon.error {
  background: rgba(255, 71, 87, 0.2);
  color: #ff4757;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 5px;
}

.notification-message {
  color: #b0b0b0;
  font-size: 14px;
  margin-bottom: 5px;
}

.notification-time {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.notification-actions {
  flex-shrink: 0;
}

/* 响应式设计 */
@media (min-width: 769px) {
  .mobile-nav {
    display: none;
  }

  .desktop-sidebar {
    display: flex;
  }

  .main-content {
    margin-top: 0;
  }
}

@media (max-width: 768px) {
  .top-toolbar {
    padding: 10px 15px;
  }

  .toolbar-left {
    display: none;
  }

  .search-input {
    width: 120px;
  }

  .notification-panel {
    width: calc(100vw - 40px);
    right: 20px;
    left: 20px;
  }

  .page-content {
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .search-input {
    display: none;
  }

  .toolbar-right {
    gap: 10px;
  }

  .page-content {
    padding: 10px;
  }
}

/* Element Plus 样式覆盖 */
:deep(.el-menu) {
  border: none;
}

:deep(.el-menu-item) {
  border-radius: 8px;
  margin: 5px 10px;
  transition: all 0.3s ease;
}

:deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.1) !important;
}

:deep(.el-menu-item.is-active) {
  background: rgba(0, 212, 170, 0.2) !important;
  border-radius: 8px;
}

:deep(.el-breadcrumb__item) {
  color: #b0b0b0;
}

:deep(.el-breadcrumb__item:last-child) {
  color: #ffffff;
}

:deep(.el-button--text) {
  color: #e0e0e0;
}

:deep(.el-button--text:hover) {
  color: #ffffff;
}
</style>
