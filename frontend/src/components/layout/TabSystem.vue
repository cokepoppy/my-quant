<template>
  <div class="tab-system">
    <div class="tab-header">
      <div class="tab-list">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-item"
          :class="{ active: activeTabId === tab.id }"
          @click="selectTab(tab.id)"
        >
          <el-icon class="tab-icon" v-if="tab.icon">
            <component :is="tab.icon" />
          </el-icon>
          <span class="tab-title">{{ tab.title }}</span>
          <span
            class="tab-close"
            @click.stop="closeTab(tab.id)"
            v-if="!tab.pinned"
          >
            <el-icon><Close /></el-icon>
          </span>
        </div>
      </div>
      
      <div class="tab-actions">
        <el-dropdown @command="handleDropdownCommand" trigger="click">
          <el-button size="small" text>
            <el-icon><MoreFilled /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="close-all">关闭所有</el-dropdown-item>
              <el-dropdown-item command="close-others">关闭其他</el-dropdown-item>
              <el-dropdown-item command="close-left">关闭左侧</el-dropdown-item>
              <el-dropdown-item command="close-right">关闭右侧</el-dropdown-item>
              <el-dropdown-item divided command="refresh">刷新当前</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <div class="tab-content">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-pane"
        :class="{ active: activeTabId === tab.id }"
      >
        <Suspense>
          <template #default>
            <component 
              :is="getComponent(tab.component)" 
              v-bind="tab.props"
              @view-strategy="handleViewStrategy"
              @edit-strategy="handleEditStrategy"
              @create-strategy="handleCreateStrategy"
              @back-to-list="handleBackToList"
              @back-to-detail="handleBackToDetail"
              @save-success="handleSaveSuccess"
              @create-success="handleCreateSuccess"
            />
          </template>
          <template #fallback>
            <div class="loading-placeholder">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <span>加载中...</span>
            </div>
          </template>
        </Suspense>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, markRaw, defineAsyncComponent, getCurrentInstance } from 'vue'
import { ElMessage } from 'element-plus'
import { Close, MoreFilled, Loading } from '@element-plus/icons-vue'

// 组件映射
const componentMap = {
  'DashboardOverview': defineAsyncComponent(() => import('@/views/dashboard/DashboardOverview.vue')),
  'StrategyList': defineAsyncComponent(() => import('@/views/strategy/StrategyList.vue')),
  'CreateStrategy': defineAsyncComponent(() => import('@/views/strategy/CreateStrategy.vue')),
  'StrategyTemplates': defineAsyncComponent(() => import('@/components/strategy/TemplateList.vue')),
  'ParameterOptimization': defineAsyncComponent(() => import('@/views/optimization/ParameterOptimization.vue')),
  'BacktestSettings': defineAsyncComponent(() => import('@/views/backtest/BacktestSettings.vue')),
  'BacktestResult': defineAsyncComponent(() => import('@/views/backtest/BacktestResult.vue')),
  'TradingPanel': defineAsyncComponent(() => import('@/views/trading/TradingPanel.vue')),
  'OrdersManagement': defineAsyncComponent(() => import('@/views/trading/OrdersManagement.vue')),
  'Monitoring': defineAsyncComponent(() => import('@/views/monitoring/Monitoring.vue'))
}

interface Tab {
  id: string
  title: string
  icon?: any
  component: any
  props?: Record<string, any>
  pinned?: boolean
  path?: string
}

interface Props {
  modelValue?: string
  tabs?: Tab[]
  onViewStrategy?: (strategy: any) => void
  onEditStrategy?: (strategy: any) => void
  onCreateStrategy?: () => void
  onBackToList?: () => void
  onBackToDetail?: () => void
  onSaveSuccess?: () => void
  onCreateSuccess?: () => void
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'tab-change', tab: Tab): void
  (e: 'tab-close', tabId: string): void
  (e: 'tabs-update', tabs: Tab[]): void
  (e: 'view-strategy', strategy: any): void
  (e: 'edit-strategy', strategy: any): void
  (e: 'create-strategy'): void
  (e: 'back-to-list'): void
  (e: 'back-to-detail'): void
  (e: 'save-success'): void
  (e: 'create-success'): void
}

const instance = getCurrentInstance()
const getContext = () => instance

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  tabs: () => []
})

// 调试props
console.log('🔥 TabSystem props:', props)
console.log('🔥 TabSystem props keys:', Object.keys(props))
console.log('🔥 TabSystem onViewStrategy:', props.onViewStrategy)
console.log('🔥 TabSystem attrs:', getContext()?.attrs || {})

const emit = defineEmits<Emits>()

const internalTabs = ref<Tab[]>([...props.tabs])
const activeTabId = ref(props.modelValue || props.tabs[0]?.id || '')

// 计算属性
const tabs = computed({
  get: () => internalTabs.value,
  set: (value) => {
    internalTabs.value = value
    emit('tabs-update', value)
  }
})

const activeTab = computed(() => {
  return tabs.value.find(tab => tab.id === activeTabId.value)
})

// 监听props变化
watch(() => props.tabs, (newTabs) => {
  internalTabs.value = [...newTabs]
}, { deep: true })

watch(() => props.modelValue, (newValue) => {
  if (newValue && newValue !== activeTabId.value) {
    activeTabId.value = newValue
  }
})

// 方法
const selectTab = (tabId: string) => {
  console.log('🔥 TabSystem selectTab called with:', tabId)
  console.log('🔥 Current activeTabId before:', activeTabId.value)
  
  activeTabId.value = tabId
  console.log('🔥 Set activeTabId to:', activeTabId.value)
  
  emit('update:modelValue', tabId)
  
  const tab = tabs.value.find(t => t.id === tabId)
  if (tab) {
    console.log('🔥 Found tab, emitting tab-change:', tab)
    emit('tab-change', tab)
  } else {
    console.error('🔥 Tab not found for id:', tabId)
  }
}

const closeTab = (tabId: string) => {
  const tab = tabs.value.find(t => t.id === tabId)
  if (!tab || tab.pinned) return

  const index = tabs.value.findIndex(t => t.id === tabId)
  const newTabs = tabs.value.filter(t => t.id !== tabId)
  
  // 如果关闭的是当前活动标签页，需要选择新的活动标签页
  if (tabId === activeTabId.value) {
    if (newTabs.length > 0) {
      // 优先选择关闭标签页右侧的标签页，如果没有则选择左侧的
      const newIndex = Math.min(index, newTabs.length - 1)
      selectTab(newTabs[newIndex].id)
    } else {
      activeTabId.value = ''
    }
  }
  
  tabs.value = newTabs
  emit('tab-close', tabId)
}

const closeAllTabs = () => {
  const pinnedTabs = tabs.value.filter(tab => tab.pinned)
  tabs.value = pinnedTabs
  
  if (pinnedTabs.length > 0) {
    selectTab(pinnedTabs[0].id)
  } else {
    activeTabId.value = ''
  }
  
  ElMessage.success('已关闭所有标签页')
}

const closeOtherTabs = () => {
  const currentTab = tabs.value.find(tab => tab.id === activeTabId.value)
  const pinnedTabs = tabs.value.filter(tab => tab.pinned)
  
  const newTabs = [...new Set([...pinnedTabs, currentTab])].filter(Boolean)
  tabs.value = newTabs
  
  ElMessage.success('已关闭其他标签页')
}

const closeLeftTabs = () => {
  const currentIndex = tabs.value.findIndex(tab => tab.id === activeTabId.value)
  if (currentIndex === -1) return
  
  const pinnedTabs = tabs.value.filter(tab => tab.pinned)
  const leftTabs = tabs.value.slice(0, currentIndex)
  const keepTabs = leftTabs.filter(tab => tab.pinned)
  
  tabs.value = [...keepTabs, ...tabs.value.slice(currentIndex)]
  ElMessage.success('已关闭左侧标签页')
}

const closeRightTabs = () => {
  const currentIndex = tabs.value.findIndex(tab => tab.id === activeTabId.value)
  if (currentIndex === -1) return
  
  tabs.value = tabs.value.slice(0, currentIndex + 1)
  ElMessage.success('已关闭右侧标签页')
}

const refreshCurrentTab = () => {
  const currentTab = activeTab.value
  if (currentTab) {
    ElMessage.success(`已刷新: ${currentTab.title}`)
    // 这里可以触发组件的刷新逻辑
  }
}

const handleDropdownCommand = (command: string) => {
  switch (command) {
    case 'close-all':
      closeAllTabs()
      break
    case 'close-others':
      closeOtherTabs()
      break
    case 'close-left':
      closeLeftTabs()
      break
    case 'close-right':
      closeRightTabs()
      break
    case 'refresh':
      refreshCurrentTab()
      break
  }
}

// 添加标签页的方法
const addTab = (tab: Tab) => {
  console.log('🔥 TabSystem addTab called with:', tab)
  console.log('🔥 Current tabs before add:', tabs.value)
  
  const existingTab = tabs.value.find(t => t.id === tab.id)
  if (existingTab) {
    console.log('🔥 Tab already exists, selecting it:', existingTab)
    selectTab(tab.id)
    return existingTab
  }
  
  console.log('🔥 Adding new tab to tabs array')
  tabs.value.push(tab)
  console.log('🔥 Tabs after add:', tabs.value)
  
  console.log('🔥 Selecting new tab:', tab.id)
  selectTab(tab.id)
  return tab
}

// 更新标签页的方法
const updateTab = (tabId: string, updates: Partial<Tab>) => {
  const index = tabs.value.findIndex(t => t.id === tabId)
  if (index !== -1) {
    tabs.value[index] = { ...tabs.value[index], ...updates }
  }
}

// 检查标签页是否存在
const hasTab = (tabId: string) => {
  return tabs.value.some(t => t.id === tabId)
}

// 解析组件
const getComponent = (component: any) => {
  if (typeof component === 'string') {
    return componentMap[component] || component
  }
  // 如果是函数（动态导入），需要用 defineAsyncComponent 包装
  if (typeof component === 'function') {
    return defineAsyncComponent(component)
  }
  return component
}

// 事件处理函数
const handleViewStrategy = (strategy) => {
  console.log('🔥 TabSystem handleViewStrategy called with:', strategy)
  console.log('🔥 Props onViewStrategy exists:', !!props.onViewStrategy)
  
  if (props.onViewStrategy) {
    console.log('🔥 Calling props.onViewStrategy')
    props.onViewStrategy(strategy)
  } else {
    console.log('🔥 No onViewStrategy prop, emitting event')
    console.log('🔥 About to emit view-strategy event with:', strategy)
    emit('view-strategy', strategy)
    console.log('🔥 view-strategy event emitted')
  }
}

const handleEditStrategy = (strategy) => {
  if (props.onEditStrategy) {
    props.onEditStrategy(strategy)
  } else {
    emit('edit-strategy', strategy)
  }
}

const handleCreateStrategy = () => {
  if (props.onCreateStrategy) {
    props.onCreateStrategy()
  } else {
    emit('create-strategy')
  }
}

const handleBackToList = () => {
  if (props.onBackToList) {
    props.onBackToList()
  } else {
    emit('back-to-list')
  }
}

const handleBackToDetail = () => {
  if (props.onBackToDetail) {
    props.onBackToDetail()
  } else {
    emit('back-to-detail')
  }
}

const handleSaveSuccess = () => {
  if (props.onSaveSuccess) {
    props.onSaveSuccess()
  } else {
    emit('save-success')
  }
}

const handleCreateSuccess = () => {
  if (props.onCreateSuccess) {
    props.onCreateSuccess()
  } else {
    emit('create-success')
  }
}

// 暴露方法给父组件
defineExpose({
  addTab,
  updateTab,
  hasTab,
  closeTab,
  selectTab,
  tabs: tabs.value,
  activeTab: activeTab.value
})
</script>

<style scoped>
.tab-system {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary);
}

.tab-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-primary);
  background: var(--surface-elevated);
  min-height: 40px;
}

.tab-list {
  display: flex;
  align-items: center;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
}

.tab-list::-webkit-scrollbar {
  height: 2px;
}

.tab-list::-webkit-scrollbar-track {
  background: var(--bg-primary);
}

.tab-list::-webkit-scrollbar-thumb {
  background: var(--btn-primary);
  border-radius: 1px;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s;
  border-right: 1px solid var(--border-primary);
  white-space: nowrap;
  user-select: none;
  min-width: 80px;
  max-width: 200px;
}

.tab-item:hover {
  background: var(--bg-hover);
}

.tab-item.active {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-bottom: 2px solid var(--text-primary);
}

.tab-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.tab-title {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 2px;
  opacity: 0;
  transition: all 0.2s;
  flex-shrink: 0;
}

.tab-item:hover .tab-close {
  opacity: 1;
}

.tab-close:hover {
  background: var(--market-down);
  color: white;
}

.tab-close .el-icon {
  font-size: 12px;
}

.tab-actions {
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-left: 1px solid var(--border-primary);
}

.tab-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.tab-pane {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
}

.tab-pane.active {
  opacity: 1;
  visibility: visible;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tab-item {
    padding: 8px 8px;
    min-width: 60px;
  }
  
  .tab-title {
    font-size: 12px;
  }
  
  .tab-icon {
    font-size: 12px;
  }
}

/* 动画效果 */
.tab-item {
  position: relative;
}

.tab-item::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--text-primary);
  transform: scaleX(0);
  transition: transform 0.2s ease;
}

.tab-item.active::after {
  transform: scaleX(1);
}

/* 加载占位符 */
.loading-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  gap: 12px;
}

.loading-icon {
  font-size: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 自定义滚动条样式 */
.tab-list {
  scrollbar-width: thin;
  scrollbar-color: var(--btn-primary) var(--bg-primary);
}

/* Element Plus 组件样式覆盖 */
:deep(.el-button) {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 4px 8px;
  height: 24px;
}

:deep(.el-button:hover) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

:deep(.el-dropdown-menu) {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
}

:deep(.el-dropdown-menu__item) {
  color: var(--text-secondary);
  font-size: 12px;
}

:deep(.el-dropdown-menu__item:hover) {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>