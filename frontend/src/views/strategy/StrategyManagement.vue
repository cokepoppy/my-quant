<template>
  <div class="strategy-management-container">
    <!-- Debug info -->
    <div style="position: fixed; top: 10px; right: 10px; background: yellow; padding: 10px; z-index: 9999; font-size: 12px;">
      Debug: activeTabId = {{ activeTabId }}<br>
      Debug: currentStrategyId = {{ currentStrategyId }}<br>
      Debug: tabs length = {{ tabs.length }}<br>
      Debug: tabSystemRef exists = {{ !!tabSystemRef }}<br>
      <button @click="testEvent" style="margin-top: 10px;">测试事件</button>
    </div>
    
    <TabSystem
      ref="tabSystemRef"
      :tabs="tabs"
      v-model="activeTabId"
      @tab-change="handleTabChange"
      @tab-close="handleTabClose"
      @view-strategy="handleViewStrategy"
      @edit-strategy="handleEditStrategy"
      @create-strategy="handleCreateStrategy"
      @back-to-list="handleBackToList"
      @back-to-detail="handleBackToDetail"
      @save-success="handleSaveSuccess"
      @create-success="handleCreateSuccess"
      :onViewStrategy="handleViewStrategy"
      :onEditStrategy="handleEditStrategy"
      :onCreateStrategy="handleCreateStrategy"
      :onBackToList="handleBackToList"
      :onBackToDetail="handleBackToDetail"
      :onSaveSuccess="handleSaveSuccess"
      :onCreateSuccess="handleCreateSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Document, View, Edit, Plus } from '@element-plus/icons-vue'
import TabSystem from '@/components/layout/TabSystem.vue'

const route = useRoute()
const tabSystemRef = ref()
const strategyListRef = ref()

// 状态管理
const currentStrategyId = ref(null)
const activeTabId = ref('strategy-list')

// 页签配置
const tabs = computed(() => {
  const baseTabs = [
    { 
      id: 'strategy-list', 
      title: '策略列表', 
      icon: Document,
      component: 'StrategyList',
      pinned: true
    }
  ]
  
  return baseTabs
})

// 查看策略详情
const handleViewStrategy = (strategy) => {
  console.log('🔥 StrategyManagement handleViewStrategy called with:', strategy)
  console.log('🔥 Current tabSystemRef:', tabSystemRef.value)
  
  currentStrategyId.value = strategy.id
  const detailTabId = `strategy-detail-${strategy.id}`
  
  console.log('🔥 Setting currentStrategyId to:', currentStrategyId.value)
  console.log('🔥 Detail tab ID:', detailTabId)
  
  // 添加详情页签
  setTimeout(() => {
    console.log('🔥 Timeout callback - tabSystemRef:', tabSystemRef.value)
    if (tabSystemRef.value) {
      console.log('🔥 Adding tab with ID:', detailTabId)
      const newTab = {
        id: detailTabId,
        title: `策略详情: ${strategy.name}`,
        icon: View,
        component: 'StrategyDetail',
        props: {
          strategyId: strategy.id,
          onBackToList: handleBackToList,
          onEditStrategy: handleEditStrategy
        }
      }
      console.log('🔥 New tab object:', newTab)
      
      const result = tabSystemRef.value.addTab(newTab)
      console.log('🔥 addTab result:', result)
      
      console.log('🔥 Selecting tab:', detailTabId)
      tabSystemRef.value.selectTab(detailTabId)
      
      console.log('🔥 Current tabs after add:', tabSystemRef.value.tabs)
    } else {
      console.error('🔥 tabSystemRef is null in timeout!')
    }
  }, 100)
}

// 编辑策略
const handleEditStrategy = (strategy) => {
  currentStrategyId.value = strategy.id
  const editTabId = `strategy-edit-${strategy.id}`
  
  // 添加编辑页签
  if (tabSystemRef.value) {
    tabSystemRef.value.addTab({
      id: editTabId,
      title: `编辑策略: ${strategy.name}`,
      icon: Edit,
      component: 'EditStrategy',
      props: {
        strategyId: strategy.id,
        onBackToDetail: handleBackToDetail,
        onSaveSuccess: handleSaveSuccess
      }
    })
    tabSystemRef.value.selectTab(editTabId)
  }
}

// 创建策略
const handleCreateStrategy = () => {
  // 添加创建策略页签
  if (tabSystemRef.value) {
    tabSystemRef.value.addTab({
      id: 'strategy-create',
      title: '创建策略',
      icon: Plus,
      component: 'CreateStrategy',
      props: {
        onBackToList: handleBackToList,
        onCreateSuccess: handleCreateSuccess
      }
    })
    tabSystemRef.value.selectTab('strategy-create')
  }
}

// 返回列表
const handleBackToList = () => {
  currentStrategyId.value = null
  if (tabSystemRef.value) {
    tabSystemRef.value.selectTab('strategy-list')
  }
}

// 返回详情
const handleBackToDetail = () => {
  const detailTabId = `strategy-detail-${currentStrategyId.value}`
  if (tabSystemRef.value && tabSystemRef.value.hasTab(detailTabId)) {
    tabSystemRef.value.selectTab(detailTabId)
  }
}

// 保存成功
const handleSaveSuccess = () => {
  // 刷新列表数据
  if (strategyListRef.value) {
    strategyListRef.value.loadStrategies()
  }
  handleBackToDetail()
}

// 创建成功
const handleCreateSuccess = () => {
  // 刷新列表数据
  if (strategyListRef.value) {
    strategyListRef.value.loadStrategies()
  }
  handleBackToList()
}

// 页签变化处理
const handleTabChange = (tab) => {
  console.log('🔥 StrategyManagement handleTabChange called with:', tab)
  
  activeTabId.value = tab.id
  console.log('🔥 Set activeTabId to:', activeTabId.value)
  
  // 根据页签更新状态
  if (tab.id === 'strategy-list') {
    console.log('🔥 Switching to list tab, clearing currentStrategyId')
    currentStrategyId.value = null
  } else if (tab.id.startsWith('strategy-detail-')) {
    const strategyId = tab.id.replace('strategy-detail-', '')
    console.log('🔥 Switching to detail tab, setting currentStrategyId to:', strategyId)
    currentStrategyId.value = strategyId
  } else if (tab.id.startsWith('strategy-edit-')) {
    const strategyId = tab.id.replace('strategy-edit-', '')
    console.log('🔥 Switching to edit tab, setting currentStrategyId to:', strategyId)
    currentStrategyId.value = strategyId
  }
  
  console.log('🔥 Final state - activeTabId:', activeTabId.value, 'currentStrategyId:', currentStrategyId.value)
}

// 页签关闭处理
const handleTabClose = (tabId) => {
  if (tabId.startsWith('strategy-detail-')) {
    const strategyId = tabId.replace('strategy-detail-', '')
    if (currentStrategyId.value === strategyId) {
      currentStrategyId.value = null
    }
  } else if (tabId.startsWith('strategy-edit-')) {
    const strategyId = tabId.replace('strategy-edit-', '')
    if (currentStrategyId.value === strategyId) {
      handleBackToDetail()
    }
  }
}

// 处理路由参数
const handleRouteParams = () => {
  const { id, action } = route.query
  
  if (id) {
    currentStrategyId.value = id
    if (action === 'edit') {
      // 延迟处理，确保组件已加载
      setTimeout(() => {
        handleEditStrategy({ id, name: '策略' })
      }, 100)
    } else {
      setTimeout(() => {
        handleViewStrategy({ id, name: '策略' })
      }, 100)
    }
  } else if (action === 'create') {
    setTimeout(() => {
      handleCreateStrategy()
    }, 100)
  }
}

// 测试事件函数
const testEvent = () => {
  console.log('🔥 Test event button clicked')
  if (tabSystemRef.value) {
    console.log('🔥 tabSystemRef exists, testing direct call')
    const testStrategy = { id: 'test', name: '测试策略' }
    handleViewStrategy(testStrategy)
  } else {
    console.error('🔥 tabSystemRef is null!')
  }
}

// 监听路由变化
watch(() => route.query, handleRouteParams, { immediate: true })
</script>

<style scoped>
.strategy-management-container {
  height: 100vh;
  background: var(--bg-secondary);
}
</style>