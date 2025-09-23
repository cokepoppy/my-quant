<template>
  <div class="system-logs">
    <div class="page-header">
      <h2>系统日志</h2>
      <div class="header-actions">
        <el-button @click="refreshLogs">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="exportLogs">
          <el-icon><Download /></el-icon>
          导出日志
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="日志级别">
          <el-select v-model="filterForm.level" placeholder="选择日志级别" clearable>
            <el-option label="错误" value="error" />
            <el-option label="警告" value="warn" />
            <el-option label="信息" value="info" />
            <el-option label="调试" value="debug" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="filterForm.source" placeholder="选择来源" clearable>
            <el-option label="系统" value="system" />
            <el-option label="API" value="api" />
            <el-option label="数据库" value="database" />
            <el-option label="策略" value="strategy" />
            <el-option label="交易" value="trading" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="搜索日志内容"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchLogs">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 日志列表 -->
    <el-card class="logs-card">
      <el-table
        :data="logs"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="level" label="级别" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelTagType(row.level)">
              {{ getLevelLabel(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="info">
              {{ getSourceLabel(row.source) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="日志信息" min-width="300" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" @click="viewLogDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          :current-page="pagination.page"
          :page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 日志详情对话框 -->
    <el-dialog v-model="detailDialog.show" title="日志详情" width="800px">
      <div class="log-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="日志ID">{{ detailDialog.data?.id }}</el-descriptions-item>
          <el-descriptions-item label="级别">
            <el-tag :type="getLevelTagType(detailDialog.data?.level)">
              {{ getLevelLabel(detailDialog.data?.level) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="来源">
            <el-tag size="small" type="info">
              {{ getSourceLabel(detailDialog.data?.source) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="时间">{{ formatTime(detailDialog.data?.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="日志信息" :span="2">{{ detailDialog.data?.message }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-metadata" v-if="detailDialog.data?.metadata">
          <h4>元数据</h4>
          <el-input
            type="textarea"
            :rows="8"
            :value="JSON.stringify(detailDialog.data?.metadata, null, 2)"
            readonly
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialog.show = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Download } from '@element-plus/icons-vue'

interface Log {
  id: string
  level: string
  message: string
  source: string
  metadata?: any
  createdAt: string
}

const loading = ref(false)
const logs = ref<Log[]>([])

// 筛选表单
const filterForm = reactive({
  level: '',
  source: '',
  keyword: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 详情对话框
const detailDialog = reactive({
  show: false,
  data: null
})

// 方法
const refreshLogs = () => {
  searchLogs()
}

const searchLogs = async () => {
  loading.value = true
  try {
    // 构建查询参数
    const params = {
      page: pagination.page,
      limit: pagination.size,
      level: filterForm.level,
      source: filterForm.source,
      keyword: filterForm.keyword
    }

    // 调用后端 API
    const response = await fetch(`${import.meta.env.VITE_API_URL}/system/logs?${new URLSearchParams(params)}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    const data = await response.json()
    
    if (data.success) {
      logs.value = data.data.logs || []
      pagination.total = data.data.pagination?.total || 0
    } else {
      console.error('获取日志失败:', data.message)
      ElMessage.error(data.message || '获取日志失败')
      // 使用模拟数据
      useMockData()
    }
  } catch (error) {
    console.error('查询日志失败:', error)
    ElMessage.error('查询日志失败')
    // 使用模拟数据
    useMockData()
  } finally {
    loading.value = false
  }
}

const useMockData = () => {
  logs.value = [
    {
      id: '1',
      level: 'error',
      message: '数据库连接失败',
      source: 'database',
      createdAt: '2024-01-01 10:00:00',
      metadata: { error: 'Connection timeout', stack: '...' }
    },
    {
      id: '2',
      level: 'warn',
      message: 'API响应时间过长',
      source: 'api',
      createdAt: '2024-01-01 10:05:00',
      metadata: { responseTime: 5000, endpoint: '/api/data' }
    },
    {
      id: '3',
      level: 'info',
      message: '用户登录成功',
      source: 'system',
      createdAt: '2024-01-01 10:10:00',
      metadata: { userId: '123', ip: '192.168.1.1' }
    },
    {
      id: '4',
      level: 'debug',
      message: '策略执行开始',
      source: 'strategy',
      createdAt: '2024-01-01 10:15:00',
      metadata: { strategyId: '456', symbol: 'BTCUSDT' }
    }
  ]
  pagination.total = 4
}

const resetFilter = () => {
  filterForm.level = ''
  filterForm.source = ''
  filterForm.keyword = ''
  searchLogs()
}

const handleSizeChange = (size: number) => {
  pagination.size = size
  searchLogs()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  searchLogs()
}

const viewLogDetail = (log: Log) => {
  detailDialog.data = log
  detailDialog.show = true
}

const exportLogs = () => {
  ElMessage.info('日志导出功能开发中')
}

const getLevelTagType = (level: string) => {
  switch (level) {
    case 'error': return 'danger'
    case 'warn': return 'warning'
    case 'info': return 'success'
    case 'debug': return 'info'
    default: return 'info'
  }
}

const getLevelLabel = (level: string) => {
  switch (level) {
    case 'error': return '错误'
    case 'warn': return '警告'
    case 'info': return '信息'
    case 'debug': return '调试'
    default: return '未知'
  }
}

const getSourceLabel = (source: string) => {
  switch (source) {
    case 'system': return '系统'
    case 'api': return 'API'
    case 'database': return '数据库'
    case 'strategy': return '策略'
    case 'trading': return '交易'
    default: return source
  }
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN')
}

onMounted(() => {
  searchLogs()
})
</script>

<style scoped>
.system-logs {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-card {
  margin-bottom: 20px;
}

.logs-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.log-detail {
  padding: 20px 0;
}

.detail-metadata {
  margin-top: 20px;
}

.detail-metadata h4 {
  margin-bottom: 10px;
  color: var(--el-text-color-primary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .system-logs {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .filter-card :deep(.el-form--inline .el-form-item) {
    margin-right: 0;
    margin-bottom: 10px;
  }
}
</style>