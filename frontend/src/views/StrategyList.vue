<template>
  <div class="strategy-list">
    <div class="page-header">
      <h2>策略管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="createStrategy">
          <el-icon><Plus /></el-icon>
          新建策略
        </el-button>
        <el-button @click="refreshStrategies">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="strategy-content">
      <div class="strategy-controls">
        <el-input
          v-model="searchQuery"
          placeholder="搜索策略..."
          style="width: 300px"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select v-model="statusFilter" placeholder="状态筛选" style="width: 120px">
          <el-option label="全部" value="" />
          <el-option label="运行中" value="active" />
          <el-option label="已暂停" value="paused" />
          <el-option label="已停止" value="stopped" />
        </el-select>
        
        <el-select v-model="typeFilter" placeholder="类型筛选" style="width: 120px">
          <el-option label="全部" value="" />
          <el-option label="趋势跟踪" value="trend" />
          <el-option label="均值回归" value="mean_reversion" />
          <el-option label="套利" value="arbitrage" />
        </el-select>
      </div>

      <div class="strategy-table">
        <el-table :data="filteredStrategies" style="width: 100%">
          <el-table-column prop="name" label="策略名称" min-width="150">
            <template #default="{ row }">
              <div class="strategy-name-cell">
                <el-icon class="strategy-icon"><TrendCharts /></el-icon>
                <span>{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ row.type }}</el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="return" label="收益率" width="100" align="right">
            <template #default="{ row }">
              <span :class="row.return >= 0 ? 'positive' : 'negative'">
                {{ row.return >= 0 ? '+' : '' }}{{ row.return }}%
              </span>
            </template>
          </el-table-column>
          
          <el-table-column prop="sharpe" label="夏普比率" width="100" align="right">
            <template #default="{ row }">
              {{ row.sharpe }}
            </template>
          </el-table-column>
          
          <el-table-column prop="maxDrawdown" label="最大回撤" width="100" align="right">
            <template #default="{ row }">
              <span class="negative">{{ row.maxDrawdown }}%</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="updatedAt" label="更新时间" width="120">
            <template #default="{ row }">
              {{ formatDate(row.updatedAt) }}
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="editStrategy(row)">编辑</el-button>
              <el-button size="small" @click="duplicateStrategy(row)">克隆</el-button>
              <el-button size="small" type="danger" @click="deleteStrategy(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Refresh,
  Search,
  TrendCharts
} from '@element-plus/icons-vue'

interface Strategy {
  id: string
  name: string
  type: string
  status: string
  return: number
  sharpe: number
  maxDrawdown: number
  updatedAt: Date
}

const searchQuery = ref('')
const statusFilter = ref('')
const typeFilter = ref('')

const strategies = ref<Strategy[]>([
  {
    id: '1',
    name: 'MA双均线策略',
    type: '趋势跟踪',
    status: 'active',
    return: 12.5,
    sharpe: 1.85,
    maxDrawdown: -3.2,
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: '2',
    name: '网格交易策略',
    type: '套利',
    status: 'active',
    return: 8.7,
    sharpe: 2.12,
    maxDrawdown: -1.8,
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
  },
  {
    id: '3',
    name: 'RSI超卖策略',
    type: '均值回归',
    status: 'paused',
    return: -2.3,
    sharpe: 0.68,
    maxDrawdown: -5.1,
    updatedAt: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    id: '4',
    name: 'MACD策略',
    type: '趋势跟踪',
    status: 'stopped',
    return: -5.2,
    sharpe: 0.45,
    maxDrawdown: -8.7,
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  }
])

const filteredStrategies = computed(() => {
  return strategies.value.filter(strategy => {
    const matchesSearch = strategy.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = !statusFilter.value || strategy.status === statusFilter.value
    const matchesType = !typeFilter.value || strategy.type === typeFilter.value
    
    return matchesSearch && matchesStatus && matchesType
  })
})

const createStrategy = () => {
  ElMessage.info('新建策略功能开发中')
}

const refreshStrategies = () => {
  ElMessage.success('策略列表已刷新')
}

const editStrategy = (strategy: Strategy) => {
  ElMessage.info(`编辑策略: ${strategy.name}`)
}

const duplicateStrategy = (strategy: Strategy) => {
  ElMessage.success(`已复制策略: ${strategy.name}`)
}

const deleteStrategy = async (strategy: Strategy) => {
  try {
    await ElMessageBox.confirm(`确定要删除策略 "${strategy.name}" 吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    strategies.value = strategies.value.filter(s => s.id !== strategy.id)
    ElMessage.success('策略已删除')
  } catch {
    // 用户取消操作
  }
}

const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    active: 'success',
    paused: 'warning',
    stopped: 'info',
    error: 'danger'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    active: '运行中',
    paused: '已暂停',
    stopped: '已停止',
    error: '错误'
  }
  return statusMap[status] || '未知'
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
</script>

<style scoped>
.strategy-list {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: var(--primary-text);
  font-size: 20px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.strategy-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.strategy-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.strategy-table {
  background: var(--card-bg);
  border-radius: 8px;
  overflow: hidden;
}

.strategy-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.strategy-icon {
  color: var(--primary-text);
}

.positive {
  color: var(--positive-color) !important;
}

.negative {
  color: var(--negative-color) !important;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-table) {
  background: var(--card-bg);
  color: var(--secondary-text);
}

:deep(.el-table th) {
  background: var(--secondary-bg);
  color: var(--primary-text);
  border-bottom: 1px solid var(--border-color);
}

:deep(.el-table td) {
  border-bottom: 1px solid var(--border-color);
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
  background: var(--hover-bg);
}

:deep(.el-input__wrapper) {
  background: var(--card-bg);
  border-color: var(--border-color);
}

:deep(.el-input__inner) {
  color: var(--secondary-text);
}

:deep(.el-select .el-input__wrapper) {
  background: var(--card-bg);
  border-color: var(--border-color);
}

:deep(.el-button) {
  background: var(--card-bg);
  border-color: var(--border-color);
  color: var(--secondary-text);
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

:deep(.el-button--danger) {
  background: var(--negative-color);
  border-color: var(--negative-color);
  color: white;
}
</style>