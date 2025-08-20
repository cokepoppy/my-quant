<template>
  <div class="sidebar-nav">
    <div class="nav-header">
      <div class="logo">
        <div class="logo-placeholder">Q</div>
        <span class="logo-text">量化交易系统</span>
      </div>
      <div class="nav-toggle" @click="toggleCollapse">
        <el-icon :size="20">
          <component :is="isCollapsed ? 'Expand' : 'Fold'" />
        </el-icon>
      </div>
    </div>

    <div class="nav-content" :class="{ collapsed: isCollapsed }">
      <div class="nav-section">
        <div class="section-title" v-if="!isCollapsed">仪表盘</div>
        <div class="nav-items">
          <div
            class="nav-item"
            :class="{ active: activeItem === 'dashboard' }"
            @click="selectNavItem('dashboard')"
          >
            <el-icon class="nav-icon"><Monitor /></el-icon>
            <span class="nav-text" v-if="!isCollapsed">总览</span>
          </div>
        </div>
      </div>

      <div class="nav-section">
        <div class="section-title" v-if="!isCollapsed">策略管理</div>
        <div class="nav-items">
          <div
            class="nav-item"
            :class="{ active: activeItem === 'strategies' }"
            @click="selectNavItem('strategies')"
          >
            <el-icon class="nav-icon"><TrendCharts /></el-icon>
            <span class="nav-text" v-if="!isCollapsed">策略列表</span>
          </div>
          <div
            class="nav-item"
            :class="{ active: activeItem === 'strategy-editor' }"
            @click="selectNavItem('strategy-editor')"
          >
            <el-icon class="nav-icon"><Edit /></el-icon>
            <span class="nav-text" v-if="!isCollapsed">策略编辑器</span>
          </div>
          <div
            class="nav-item"
            :class="{ active: activeItem === 'strategy-templates' }"
            @click="selectNavItem('strategy-templates')"
          >
            <el-icon class="nav-icon"><Files /></el-icon>
            <span class="nav-text" v-if="!isCollapsed">策略模板</span>
          </div>
        </div>
      </div>

      <div class="nav-section">
        <div class="section-title" v-if="!isCollapsed">回测分析</div>
        <div class="nav-items">
          <div
            class="nav-item"
            :class="{ active: activeItem === 'backtest' }"
            @click="selectNavItem('backtest')"
          >
            <el-icon class="nav-icon"><VideoPlay /></el-icon>
            <span class="nav-text" v-if="!isCollapsed">回测设置</span>
          </div>
          <div
            class="nav-item"
            :class="{ active: activeItem === 'backtest-results' }"
            @click="selectNavItem('backtest-results')"
          >
            <el-icon class="nav-icon"><DataLine /></el-icon>
            <span class="nav-text" v-if="!isCollapsed">回测结果</span>
          </div>
          <div
            class="nav-item"
            :class="{ active: activeItem === 'optimization' }"
            @click="selectNavItem('optimization')"
          >
            <el-icon class="nav-icon"><Aim /></el-icon>
            <span class="nav-text" v-if="!isCollapsed">参数优化</span>
          </div>
        </div>
      </div>

      <div class="nav-section">
        <div class="section-title" v-if="!isCollapsed">实盘交易</div>
        <div class="nav-items">
          <div
            class="nav-item"
            :class="{ active: activeItem === 'trading' }"
            @click="selectNavItem('trading')"
          >
            <el-icon class="nav-icon"><Money /></el-icon>
            <span class="nav-text" v-if="!isCollapsed">交易面板</span>
          </div>
          <div
            class="nav-item"
            :class="{ active: activeItem === 'orders' }"
            @click="selectNavItem('orders')"
          >
            <el-icon class="nav-icon"><List /></el-icon>
            <span class="nav-text" v-if="!isCollapsed">订单管理</span>
          </div>
          <div
            class="nav-item"
            :class="{ active: activeItem === 'positions' }"
            @click="selectNavItem('positions')"
          >
            <el-icon class="nav-icon"><PieChart /></el-icon>
            <span class="nav-text" v-if="!isCollapsed">持仓管理</span>
          </div>
          <div
            class="nav-item"
            :class="{ active: activeItem === 'accounts' }"
            @click="selectNavItem('accounts')"
          >
            <el-icon class="nav-icon"><Wallet /></el-icon>
            <span class="nav-text" v-if="!isCollapsed">账户管理</span>
          </div>
        </div>
      </div>

      <div class="nav-section">
        <div class="section-title" v-if="!isCollapsed">风控设置</div>
        <div class="nav-items">
          <div
            class="nav-item"
            :class="{ active: activeItem === 'risk-control' }"
            @click="selectNavItem('risk-control')"
          >
            <el-icon class="nav-icon"><Warning /></el-icon>
            <span class="nav-text" v-if="!isCollapsed">风控规则</span>
          </div>
          <div
            class="nav-item"
            :class="{ active: activeItem === 'alerts' }"
            @click="selectNavItem('alerts')"
          >
            <el-icon class="nav-icon"><Bell /></el-icon>
            <span class="nav-text" v-if="!isCollapsed">预警监控</span>
          </div>
        </div>
      </div>

      <div class="nav-section">
        <div class="section-title" v-if="!isCollapsed">数据管理</div>
        <div class="nav-items">
          <div
            class="nav-item"
            :class="{ active: activeItem === 'market-data' }"
            @click="selectNavItem('market-data')"
          >
            <el-icon class="nav-icon"><DataBoard /></el-icon>
            <span class="nav-text" v-if="!isCollapsed">市场数据</span>
          </div>
          <div
            class="nav-item"
            :class="{ active: activeItem === 'data-import' }"
            @click="selectNavItem('data-import')"
          >
            <el-icon class="nav-icon"><Upload /></el-icon>
            <span class="nav-text" v-if="!isCollapsed">数据导入</span>
          </div>
        </div>
      </div>

      <div class="nav-section">
        <div class="section-title" v-if="!isCollapsed">系统管理</div>
        <div class="nav-items">
          <div
            class="nav-item"
            :class="{ active: activeItem === 'users' }"
            @click="selectNavItem('users')"
          >
            <el-icon class="nav-icon"><User /></el-icon>
            <span class="nav-text" v-if="!isCollapsed">用户管理</span>
          </div>
          <div
            class="nav-item"
            :class="{ active: activeItem === 'settings' }"
            @click="selectNavItem('settings')"
          >
            <el-icon class="nav-icon"><Setting /></el-icon>
            <span class="nav-text" v-if="!isCollapsed">系统设置</span>
          </div>
          <div
            class="nav-item"
            :class="{ active: activeItem === 'logs' }"
            @click="selectNavItem('logs')"
          >
            <el-icon class="nav-icon"><Document /></el-icon>
            <span class="nav-text" v-if="!isCollapsed">系统日志</span>
          </div>
        </div>
      </div>
    </div>

    <div class="nav-footer" :class="{ collapsed: isCollapsed }">
      <div class="nav-item" @click="toggleTheme">
        <el-icon class="nav-icon"><Sunny v-if="isDarkTheme" /><Moon v-else /></el-icon>
        <span class="nav-text" v-if="!isCollapsed">{{ isDarkTheme ? '浅色主题' : '深色主题' }}</span>
      </div>
      <div class="nav-item" @click="showHelp">
        <el-icon class="nav-icon"><QuestionFilled /></el-icon>
        <span class="nav-text" v-if="!isCollapsed">帮助</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Monitor,
  TrendCharts,
  Edit,
  Files,
  VideoPlay,
  DataLine,
  Aim,
  Money,
  List,
  PieChart,
  Wallet,
  Warning,
  Bell,
  DataBoard,
  Upload,
  User,
  Setting,
  Document,
  Expand,
  Fold,
  Sunny,
  Moon,
  QuestionFilled
} from '@element-plus/icons-vue'

interface Props {
  modelValue?: string
  collapsed?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'update:collapsed', value: boolean): void
  (e: 'item-click', item: string): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 'dashboard',
  collapsed: false
})

const emit = defineEmits<Emits>()

const activeItem = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isCollapsed = computed({
  get: () => props.collapsed,
  set: (value) => emit('update:collapsed', value)
})

const isDarkTheme = ref(true)

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const selectNavItem = (item: string) => {
  activeItem.value = item
  emit('item-click', item)
}

const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value
  document.documentElement.classList.toggle('light-theme')
  ElMessage.success(`已切换到${isDarkTheme.value ? '深色' : '浅色'}主题`)
}

const showHelp = () => {
  ElMessage.info('帮助文档功能开发中')
}
</script>

<style scoped>
.sidebar-nav {
  width: 240px;
  height: 100vh;
  background: var(--secondary-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.sidebar-nav.collapsed {
  width: 64px;
}

.nav-header {
  height: 60px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: linear-gradient(135deg, #00d4ff, #00ff88);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 16px;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--primary-text);
  white-space: nowrap;
}

.nav-toggle {
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background 0.2s;
  color: var(--muted-text);
}

.nav-toggle:hover {
  background: var(--hover-bg);
  color: var(--primary-text);
}

.nav-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

.nav-content.collapsed {
  padding: 8px 0;
}

.nav-section {
  margin-bottom: 24px;
}

.section-title {
  padding: 0 16px 8px 16px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted-text);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nav-items {
  display: flex;
  flex-direction: column;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--secondary-text);
  border-radius: 0;
  margin: 0 8px;
}

.nav-item:hover {
  background: var(--hover-bg);
  color: var(--primary-text);
}

.nav-item.active {
  background: rgba(0, 255, 136, 0.1);
  color: var(--primary-text);
  border-left: 3px solid var(--primary-text);
  margin-left: 8px;
  padding-left: 13px;
}

.nav-icon {
  font-size: 18px;
  min-width: 18px;
  text-align: center;
}

.nav-text {
  font-size: 14px;
  white-space: nowrap;
}

.nav-footer {
  border-top: 1px solid var(--border-color);
  padding: 12px 0;
}

.nav-footer.collapsed {
  padding: 8px 0;
}

.nav-footer .nav-item {
  margin: 0 8px;
  padding: 8px 16px;
  border-radius: 4px;
}

.nav-footer .nav-item:hover {
  background: var(--hover-bg);
}

/* 滚动条样式 */
.nav-content::-webkit-scrollbar {
  width: 6px;
}

.nav-content::-webkit-scrollbar-track {
  background: var(--primary-bg);
}

.nav-content::-webkit-scrollbar-thumb {
  background: var(--brand-secondary);
  border-radius: 3px;
}

.nav-content::-webkit-scrollbar-thumb:hover {
  background: var(--primary-text);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar-nav {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .sidebar-nav.mobile-open {
    transform: translateX(0);
  }

  .sidebar-nav.collapsed {
    width: 240px;
  }
}

/* 动画效果 */
.nav-item {
  position: relative;
  overflow: hidden;
}

.nav-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 136, 0.2), transparent);
  transition: left 0.5s ease;
}

.nav-item:hover::before {
  left: 100%;
}
</style>