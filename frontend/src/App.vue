<template>
  <div id="app">
    <!-- 路由视图 -->
    <router-view />

    <!-- 全局加载动画 -->
    <div v-if="appStore.isLoading" class="global-loading">
      <el-icon class="loading-icon"><loading /></el-icon>
      <span>加载中...</span>
    </div>

    <!-- 全局消息提示 -->
    <div class="global-notifications">
      <transition-group name="notification" tag="div">
        <div
          v-for="notification in appStore.notifications"
          :key="notification.id"
          :class="['notification-item', notification.type]"
        >
          <el-icon
            ><component :is="getNotificationIcon(notification.type)"
          /></el-icon>
          <span>{{ notification.message }}</span>
          <el-icon
            class="close-icon"
            @click="appStore.removeNotification(notification.id)"
          >
            <close />
          </el-icon>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useAppStore } from "@/stores/app";
import {
  Loading,
  SuccessFilled,
  WarningFilled,
  CircleCloseFilled,
  InfoFilled,
  Close,
} from "@element-plus/icons-vue";

// Import Bloomberg theme
import "./styles/bloomberg-theme.css";
import "./styles/bright-theme.css";
import "./styles/premium.css";
import "./styles/premium-enhanced.css";

const authStore = useAuthStore();
const appStore = useAppStore();

// 获取通知图标
const getNotificationIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    success: SuccessFilled,
    warning: WarningFilled,
    error: CircleCloseFilled,
    info: InfoFilled,
  };
  return iconMap[type] || InfoFilled;
};

// 初始化应用
onMounted(async () => {
  console.log("=== App.vue onMounted 开始 ===");
  try {
    console.log("开始初始化认证状态...");
    // 初始化认证状态
    await authStore.initializeAuth();
    console.log("认证状态初始化完成");

    // 初始化应用配置
    await appStore.initializeApp();
    console.log("应用配置初始化完成");

    // 设置主题
    appStore.applyTheme();
    console.log("主题设置完成");
  } catch (error) {
    console.error("App initialization failed:", error);
  }
});
</script>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
    Cantarell, sans-serif;
  font-size: var(--font-base);
  line-height: var(--leading-normal);
  color: var(--text-primary);
  background-color: var(--bg-primary);
}

#app {
  min-height: 100vh;
}

/* 应用明亮主题 */
body {
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a3e 50%, #26334e 100%);
  min-height: 100vh;
}

/* 全局卡片增强 */
.stat-card,
.chart-card,
.performance-card,
.activity-card {
  background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.stat-card:hover,
.chart-card:hover,
.performance-card:hover,
.activity-card:hover {
  border-color: rgba(0, 136, 255, 0.5);
  box-shadow: 0 0 25px rgba(0, 136, 255, 0.4), 0 0 50px rgba(0, 136, 255, 0.15);
  transform: translateY(-2px);
}

/* 文字增强 */
.stat-value {
  color: #ffffff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.positive {
  color: #00e6b8 !important;
  text-shadow: 0 0 8px rgba(0, 230, 184, 0.3);
}

.negative {
  color: #ff4757 !important;
  text-shadow: 0 0 8px rgba(255, 71, 87, 0.3);
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

::-webkit-scrollbar-thumb {
  background: var(--border-secondary);
  border-radius: var(--radius-sm);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--border-tertiary);
}

/* 全局加载动画 */
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  color: white;
}

.loading-icon {
  font-size: 48px;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 全局通知样式 */
.global-notifications {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  max-width: 400px;
}

.notification-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 10px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  color: white;
  font-size: 14px;
  gap: 10px;
}

.notification-item.success {
  background: linear-gradient(135deg, var(--market-up), #00a885);
  box-shadow: var(--glow-success);
}

.notification-item.warning {
  background: linear-gradient(135deg, var(--market-volatile), #e07f00);
}

.notification-item.error {
  background: linear-gradient(135deg, var(--market-down), #e02e24);
  box-shadow: var(--glow-danger);
}

.notification-item.info {
  background: linear-gradient(135deg, var(--status-info), #0056b3);
}

.notification-item .close-icon {
  margin-left: auto;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.3s;
}

.notification-item .close-icon:hover {
  opacity: 1;
}

/* 通知动画 */
.notification-enter-active {
  transition: all 0.3s ease;
}

.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* 通用样式类 */
.text-center {
  text-align: center;
}

.text-left {
  text-align: left;
}

.text-right {
  text-align: right;
}

.mt-1 {
  margin-top: 0.25rem;
}
.mt-2 {
  margin-top: 0.5rem;
}
.mt-3 {
  margin-top: 1rem;
}
.mt-4 {
  margin-top: 1.5rem;
}
.mt-5 {
  margin-top: 3rem;
}

.mb-1 {
  margin-bottom: 0.25rem;
}
.mb-2 {
  margin-bottom: 0.5rem;
}
.mb-3 {
  margin-bottom: 1rem;
}
.mb-4 {
  margin-bottom: 1.5rem;
}
.mb-5 {
  margin-bottom: 3rem;
}

.ml-1 {
  margin-left: 0.25rem;
}
.ml-2 {
  margin-left: 0.5rem;
}
.ml-3 {
  margin-left: 1rem;
}
.ml-4 {
  margin-left: 1.5rem;
}
.ml-5 {
  margin-left: 3rem;
}

.mr-1 {
  margin-right: 0.25rem;
}
.mr-2 {
  margin-right: 0.5rem;
}
.mr-3 {
  margin-right: 1rem;
}
.mr-4 {
  margin-right: 1.5rem;
}
.mr-5 {
  margin-right: 3rem;
}

.p-1 {
  padding: 0.25rem;
}
.p-2 {
  padding: 0.5rem;
}
.p-3 {
  padding: 1rem;
}
.p-4 {
  padding: 1.5rem;
}
.p-5 {
  padding: 3rem;
}

.flex {
  display: flex;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flex-column {
  display: flex;
  flex-direction: column;
}

.w-full {
  width: 100%;
}

.h-full {
  height: 100%;
}

.hidden {
  display: none;
}

.block {
  display: block;
}

.inline-block {
  display: inline-block;
}

.text-primary {
  color: var(--btn-primary);
}

.text-success {
  color: var(--market-up);
}

.text-warning {
  color: var(--market-volatile);
}

.text-danger {
  color: var(--market-down);
}

.text-info {
  color: var(--status-info);
}

.text-muted {
  color: var(--text-muted);
}

.bg-primary {
  background-color: var(--btn-primary);
}

.bg-success {
  background-color: var(--market-up);
}

.bg-warning {
  background-color: var(--market-volatile);
}

.bg-danger {
  background-color: var(--market-down);
}

.bg-info {
  background-color: var(--status-info);
}

.border {
  border: 1px solid var(--border-primary);
}

.border-top {
  border-top: 1px solid var(--border-primary);
}

.border-bottom {
  border-bottom: 1px solid var(--border-primary);
}

.border-left {
  border-left: 1px solid var(--border-primary);
}

.border-right {
  border-right: 1px solid var(--border-primary);
}

.rounded {
  border-radius: 4px;
}

.rounded-lg {
  border-radius: 8px;
}

.rounded-full {
  border-radius: 9999px;
}

.shadow {
  box-shadow: var(--shadow-md);
}

.shadow-lg {
  box-shadow: var(--shadow-lg);
}

.transition {
  transition: all var(--transition-normal) var(--ease-out);
}

.cursor-pointer {
  cursor: pointer;
}

.select-none {
  user-select: none;
}

.overflow-hidden {
  overflow: hidden;
}

.text-ellipsis {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

/* 响应式工具类 */
@media (max-width: 640px) {
  .sm\:hidden {
    display: none;
  }
  .sm\:flex {
    display: flex;
  }
  .sm\:text-center {
    text-align: center;
  }
}

@media (max-width: 768px) {
  .md\:hidden {
    display: none;
  }
  .md\:flex {
    display: flex;
  }
  .md\:text-center {
    text-align: center;
  }
}

@media (max-width: 1024px) {
  .lg\:hidden {
    display: none;
  }
  .lg\:flex {
    display: flex;
  }
  .lg\:text-center {
    text-align: center;
  }
}
</style>
