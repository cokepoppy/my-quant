<template>
  <div class="strategy-list-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1>策略管理</h1>
          <p>管理和配置您的交易策略</p>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="createStrategy">
            <el-icon><plus /></el-icon>
            创建策略
          </el-button>
          <el-button @click="fetchTemplates">
            <el-icon><document /></el-icon>
            使用模板
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon total">
                <el-icon><collection /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ strategyStats.total }}</div>
                <div class="stat-label">总策略数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon active">
                <el-icon><video-play /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ strategyStats.active }}</div>
                <div class="stat-label">运行中</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon draft">
                <el-icon><edit /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ strategyStats.draft }}</div>
                <div class="stat-label">草稿</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon stopped">
                <el-icon><video-pause /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ strategyStats.stopped }}</div>
                <div class="stat-label">已停止</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和过滤器 -->
    <div class="filter-section">
      <el-card>
        <el-form :inline="true" :model="filters" class="filter-form">
          <el-form-item label="搜索">
            <el-input
              v-model="filters.search"
              placeholder="搜索策略名称或描述"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filters.status" placeholder="选择状态" clearable>
              <el-option label="全部" value="" />
              <el-option label="运行中" value="active" />
              <el-option label="草稿" value="draft" />
              <el-option label="已停止" value="stopped" />
              <el-option label="错误" value="error" />
            </el-select>
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="filters.type" placeholder="选择类型" clearable>
              <el-option label="全部" value="" />
              <el-option label="趋势" value="trend" />
              <el-option label="动量" value="momentum" />
              <el-option label="均值回归" value="mean_reversion" />
              <el-option label="套利" value="arbitrage" />
              <el-option label="自定义" value="custom" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 策略列表 -->
    <div class="strategy-list">
      <el-card>
        <div v-if="isLoading" class="loading-container">
          <el-skeleton :rows="5" animated />
        </div>
        
        <div v-else-if="strategies.length === 0" class="empty-container">
          <el-empty description="暂无策略">
            <el-button type="primary" @click="createStrategy">
              创建第一个策略
            </el-button>
          </el-empty>
        </div>

        <div v-else>
          <div v-for="strategy in strategies" :key="strategy.id" class="strategy-item">
            <div class="strategy-content">
              <div class="strategy-info">
                <div class="strategy-header">
                  <h3>{{ strategy.name }}</h3>
                  <el-tag :type="getStatusType(strategy.status)">
                    {{ getStatusText(strategy.status) }}
                  </el-tag>
                </div>
                <p class="strategy-description">{{ strategy.description }}</p>
                <div class="strategy-meta">
                  <span class="meta-item">
                    <el-icon><cpu /></el-icon>
                    {{ getTypeText(strategy.type) }}
                  </span>
                  <span class="meta-item">
                    <el-icon><document /></el-icon>
                    {{ strategy.language }}
                  </span>
                  <span class="meta-item">
                    <el-icon><calendar /></el-icon>
                    {{ formatDate(strategy.createdAt) }}
                  </span>
                  <span v-if="strategy.lastRunAt" class="meta-item">
                    <el-icon><timer /></el-icon>
                    最后运行: {{ formatDate(strategy.lastRunAt) }}
                  </span>
                </div>
                <div class="strategy-tags">
                  <el-tag
                    v-for="tag in strategy.tags"
                    :key="tag"
                    size="small"
                    class="strategy-tag"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
              
              <div class="strategy-actions">
                <el-button-group>
                  <el-button
                    size="small"
                    @click="viewStrategy(strategy.id)"
                  >
                    查看
                  </el-button>
                  <el-button
                    size="small"
                    @click="editStrategy(strategy.id)"
                  >
                    编辑
                  </el-button>
                  <el-button
                    v-if="strategy.status === 'active'"
                    size="small"
                    type="warning"
                    @click="stopStrategy(strategy.id)"
                  >
                    停止
                  </el-button>
                  <el-button
                    v-else-if="strategy.status === 'stopped' || strategy.status === 'draft'"
                    size="small"
                    type="success"
                    @click="startStrategy(strategy.id)"
                  >
                    启动
                  </el-button>
                </el-button-group>
                <el-dropdown @command="(command) => handleAction(command, strategy.id)">
                  <el-button size="small" text>
                    <el-icon><more /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="performance">性能分析</el-dropdown-item>
                      <el-dropdown-item command="logs">查看日志</el-dropdown-item>
                      <el-dropdown-item command="duplicate">复制策略</el-dropdown-item>
                      <el-dropdown-item command="export">导出策略</el-dropdown-item>
                      <el-dropdown-item divided command="delete" class="text-danger">
                        删除策略
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="strategies.length > 0" class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.limit"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 创建策略对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="创建策略"
      width="80%"
      :before-close="handleCloseCreateDialog"
    >
      <strategy-form
        v-if="showCreateDialog"
        :templates="templates"
        @submit="handleCreateSubmit"
        @cancel="handleCloseCreateDialog"
      />
    </el-dialog>

    <!-- 模板选择对话框 -->
    <el-dialog
      v-model="showTemplateDialog"
      title="选择策略模板"
      width="60%"
      :before-close="handleCloseTemplateDialog"
    >
      <template-list
        v-if="showTemplateDialog"
        :templates="templates"
        @select="handleTemplateSelect"
        @cancel="handleCloseTemplateDialog"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Document,
  Collection,
  VideoPlay,
  VideoPause,
  Edit,
  More,
  Cpu,
  Calendar,
  Timer
} from '@element-plus/icons-vue'
import { useStrategyStore } from '@/stores/strategy'
import { useAppStore } from '@/stores/app'
import type { Strategy, StrategyTemplate } from '@/types/strategy'
import StrategyForm from '@/components/forms/StrategyForm.vue'
import TemplateList from '@/components/strategy/TemplateList.vue'

const router = useRouter()
const strategyStore = useStrategyStore()
const appStore = useAppStore()

// 响应式数据
const showCreateDialog = ref(false)
const showTemplateDialog = ref(false)

// 计算属性
const strategies = computed(() => strategyStore.strategies)
const templates = computed(() => strategyStore.templates)
const isLoading = computed(() => strategyStore.isLoading)
const strategyStats = computed(() => strategyStore.strategyStats)
const pagination = computed(() => strategyStore.pagination)
const filters = computed(() => strategyStore.filters)

// 方法
const createStrategy = () => {
  showCreateDialog.value = true
}

const fetchTemplates = async () => {
  try {
    await strategyStore.fetchTemplates()
    showTemplateDialog.value = true
  } catch (error) {
    console.error('获取模板失败:', error)
  }
}

const viewStrategy = (id: string) => {
  router.push(`/strategy/${id}`)
}

const editStrategy = (id: string) => {
  router.push(`/strategy/${id}/edit`)
}

const startStrategy = async (id: string) => {
  try {
    await strategyStore.startStrategyById(id)
  } catch (error) {
    console.error('启动策略失败:', error)
  }
}

const stopStrategy = async (id: string) => {
  try {
    await strategyStore.stopStrategyById(id)
  } catch (error) {
    console.error('停止策略失败:', error)
  }
}

const handleAction = (command: string, id: string) => {
  switch (command) {
    case 'performance':
      router.push(`/strategy/${id}/performance`)
      break
    case 'logs':
      router.push(`/strategy/${id}/logs`)
      break
    case 'duplicate':
      duplicateStrategy(id)
      break
    case 'export':
      exportStrategy(id)
      break
    case 'delete':
      deleteStrategyAction(id)
      break
  }
}

const duplicateStrategy = async (id: string) => {
  try {
    const strategy = await strategyStore.fetchStrategyById(id)
    const newStrategy = {
      ...strategy,
      name: `${strategy.name} (复制)`,
      status: 'draft' as const,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      lastRunAt: undefined
    }
    await strategyStore.createNewStrategy(newStrategy)
  } catch (error) {
    console.error('复制策略失败:', error)
  }
}

const exportStrategy = async (id: string) => {
  try {
    const strategy = await strategyStore.fetchStrategyById(id)
    const dataStr = JSON.stringify(strategy, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `${strategy.name}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  } catch (error) {
    console.error('导出策略失败:', error)
  }
}

const deleteStrategyAction = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个策略吗？此操作不可撤销。',
      '删除策略',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await strategyStore.deleteStrategyById(id)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除策略失败:', error)
    }
  }
}

const handleSearch = () => {
  strategyStore.setFilters(filters.value)
  strategyStore.fetchStrategies()
}

const resetFilters = () => {
  strategyStore.setFilters({
    search: '',
    status: '',
    type: ''
  })
  strategyStore.fetchStrategies()
}

const handleSizeChange = (size: number) => {
  strategyStore.setPagination({ limit: size })
  strategyStore.fetchStrategies()
}

const handleCurrentChange = (page: number) => {
  strategyStore.setPagination({ page })
  strategyStore.fetchStrategies()
}

const handleCreateSubmit = async (data: Partial<Strategy>) => {
  try {
    await strategyStore.createNewStrategy(data)
    showCreateDialog.value = false
    router.push(`/strategy/${strategyStore.strategies[0].id}`)
  } catch (error) {
    console.error('创建策略失败:', error)
  }
}

const handleCloseCreateDialog = () => {
  showCreateDialog.value = false
}

const handleTemplateSelect = async (template: StrategyTemplate) => {
  try {
    showTemplateDialog.value = false
    router.push(`/strategy/create?template=${template.id}`)
  } catch (error) {
    console.error('选择模板失败:', error)
  }
}

const handleCloseTemplateDialog = () => {
  showTemplateDialog.value = false
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    active: 'success',
    draft: 'info',
    stopped: 'warning',
    error: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    active: '运行中',
    draft: '草稿',
    stopped: '已停止',
    error: '错误'
  }
  return texts[status] || status
}

const getTypeText = (type: string) => {
  const types: Record<string, string> = {
    trend: '趋势',
    momentum: '动量',
    mean_reversion: '均值回归',
    arbitrage: '套利',
    custom: '自定义'
  }
  return types[type] || type
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 生命周期
onMounted(async () => {
  try {
    await strategyStore.fetchStrategies()
    await strategyStore.fetchTemplates()
  } catch (error) {
    console.error('获取策略列表失败:', error)
  }
})
</script>

<style scoped>
.strategy-list-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

.header-left p {
  margin: 0;
  color: #666;
  font-size: 16px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.stats-section {
  margin-bottom: 30px;
}

.stat-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.active {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.draft {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-icon.stopped {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #333;
  line-height: 1;
}

.stat-label {
  color: #666;
  font-size: 14px;
  margin-top: 4px;
}

.filter-section {
  margin-bottom: 30px;
}

.filter-form {
  margin: 0;
}

.strategy-list {
  margin-bottom: 30px;
}

.loading-container {
  padding: 20px;
}

.empty-container {
  padding: 60px 20px;
  text-align: center;
}

.strategy-item {
  padding: 20px 0;
  border-bottom: 1px solid #f0f0f0;
}

.strategy-item:last-child {
  border-bottom: none;
}

.strategy-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.strategy-info {
  flex: 1;
}

.strategy-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.strategy-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.strategy-description {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.strategy-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
  font-size: 12px;
}

.strategy-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.strategy-tag {
  margin-right: 0;
}

.strategy-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-container {
  padding: 20px 0 0 0;
  text-align: center;
}

.text-danger {
  color: #f56c6c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .strategy-list-container {
    padding: 10px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .stats-section .el-col {
    margin-bottom: 16px;
  }
  
  .strategy-content {
    flex-direction: column;
    gap: 16px;
  }
  
  .strategy-actions {
    justify-content: flex-start;
  }
  
  .filter-form {
    flex-direction: column;
    gap: 16px;
  }
}
</style>