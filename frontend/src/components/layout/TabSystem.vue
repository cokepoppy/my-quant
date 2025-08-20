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
        <component :is="getComponent(tab.component)" v-bind="tab.props" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, markRaw } from 'vue'
import { ElMessage } from 'element-plus'
import { Close, MoreFilled } from '@element-plus/icons-vue'

// 组件映射
const componentMap = {
  'DashboardOverview': markRaw(() => import('@/views/DashboardOverview.vue')),
  'StrategyList': markRaw(() => import('@/views/strategy/StrategyList.vue')),
  'CreateStrategy': markRaw(() => import('@/views/strategy/CreateStrategy.vue')),
  'BacktestSettings': markRaw(() => import('@/views/BacktestSettings.vue')),
  'TradingPanel': markRaw(() => import('@/views/TradingPanel.vue')),
  'Monitoring': markRaw(() => import('@/views/monitoring/Monitoring.vue'))
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
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'tab-change', tab: Tab): void
  (e: 'tab-close', tabId: string): void
  (e: 'tabs-update', tabs: Tab[]): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  tabs: () => []
})

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
  activeTabId.value = tabId
  emit('update:modelValue', tabId)
  
  const tab = tabs.value.find(t => t.id === tabId)
  if (tab) {
    emit('tab-change', tab)
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
  const existingTab = tabs.value.find(t => t.id === tab.id)
  if (existingTab) {
    selectTab(tab.id)
    return existingTab
  }
  
  tabs.value.push(tab)
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
  return component
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
  background: var(--secondary-bg);
}

.tab-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
  background: var(--card-bg);
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
  background: var(--primary-bg);
}

.tab-list::-webkit-scrollbar-thumb {
  background: var(--brand-secondary);
  border-radius: 1px;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s;
  border-right: 1px solid var(--border-color);
  white-space: nowrap;
  user-select: none;
  min-width: 80px;
  max-width: 200px;
}

.tab-item:hover {
  background: var(--hover-bg);
}

.tab-item.active {
  background: var(--secondary-bg);
  color: var(--primary-text);
  border-bottom: 2px solid var(--primary-text);
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
  background: var(--negative-color);
  color: white;
}

.tab-close .el-icon {
  font-size: 12px;
}

.tab-actions {
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-left: 1px solid var(--border-color);
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
  background: var(--primary-text);
  transform: scaleX(0);
  transition: transform 0.2s ease;
}

.tab-item.active::after {
  transform: scaleX(1);
}

/* 自定义滚动条样式 */
.tab-list {
  scrollbar-width: thin;
  scrollbar-color: var(--brand-secondary) var(--primary-bg);
}

/* Element Plus 组件样式覆盖 */
:deep(.el-button) {
  background: transparent;
  border: none;
  color: var(--secondary-text);
  padding: 4px 8px;
  height: 24px;
}

:deep(.el-button:hover) {
  background: var(--hover-bg);
  color: var(--primary-text);
}

:deep(.el-dropdown-menu) {
  background: var(--secondary-bg);
  border: 1px solid var(--border-color);
}

:deep(.el-dropdown-menu__item) {
  color: var(--secondary-text);
  font-size: 12px;
}

:deep(.el-dropdown-menu__item:hover) {
  background: var(--hover-bg);
  color: var(--primary-text);
}
</style>