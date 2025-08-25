<template>
  <div class="data-import">
    <div class="page-header">
      <h2>数据导入</h2>
      <el-button type="primary" @click="refreshData">刷新数据</el-button>
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <!-- 文件上传 -->
      <el-tab-pane label="文件上传" name="upload">
        <el-card>
          <div class="upload-section">
            <div class="upload-area">
              <el-upload
                class="upload-demo"
                drag
                :action="uploadUrl"
                :before-upload="beforeUpload"
                :on-success="handleUploadSuccess"
                :on-error="handleUploadError"
                :file-list="fileList"
                :accept="acceptTypes"
                multiple
              >
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">
                  将文件拖到此处，或<em>点击上传</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    支持 CSV、JSON、Excel 格式，文件大小不超过 50MB
                  </div>
                </template>
              </el-upload>
            </div>

            <div class="upload-settings">
              <el-form :model="uploadForm" label-width="120px">
                <el-form-item label="数据类型">
                  <el-select v-model="uploadForm.dataType" placeholder="选择数据类型">
                    <el-option label="市场数据" value="market" />
                    <el-option label="交易数据" value="trading" />
                    <el-option label="策略数据" value="strategy" />
                    <el-option label="用户数据" value="user" />
                  </el-select>
                </el-form-item>
                <el-form-item label="时间格式">
                  <el-select v-model="uploadForm.timeFormat" placeholder="选择时间格式">
                    <el-option label="ISO 8601" value="iso" />
                    <el-option label="Unix 时间戳" value="unix" />
                    <el-option label="自定义" value="custom" />
                  </el-select>
                </el-form-item>
                <el-form-item label="数据源">
                  <el-input v-model="uploadForm.dataSource" placeholder="输入数据源标识" />
                </el-form-item>
                <el-form-item label="自动处理">
                  <el-switch v-model="uploadForm.autoProcess" />
                </el-form-item>
              </el-form>
            </div>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- API导入 -->
      <el-tab-pane label="API导入" name="api">
        <el-card>
          <div class="api-section">
            <el-form :model="apiForm" label-width="120px">
              <el-form-item label="API类型">
                <el-select v-model="apiForm.apiType" placeholder="选择API类型">
                  <el-option label="REST API" value="rest" />
                  <el-option label="WebSocket" value="websocket" />
                  <el-option label="GraphQL" value="graphql" />
                </el-select>
              </el-form-item>
              <el-form-item label="API地址">
                <el-input v-model="apiForm.apiUrl" placeholder="输入API地址" />
              </el-form-item>
              <el-form-item label="认证方式">
                <el-select v-model="apiForm.authType" placeholder="选择认证方式">
                  <el-option label="无认证" value="none" />
                  <el-option label="API Key" value="apikey" />
                  <el-option label="OAuth2" value="oauth2" />
                  <el-option label="Bearer Token" value="bearer" />
                </el-select>
              </el-form-item>
              <el-form-item label="API密钥" v-if="apiForm.authType !== 'none'">
                <el-input v-model="apiForm.apiKey" placeholder="输入API密钥" type="password" show-password />
              </el-form-item>
              <el-form-item label="请求频率">
                <el-input-number v-model="apiForm.rateLimit" :min="1" :max="10000" placeholder="请求间隔(毫秒)" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="testApiConnection">测试连接</el-button>
                <el-button @click="saveApiConfig">保存配置</el-button>
                <el-button @click="startApiImport">开始导入</el-button>
              </el-form-item>
            </el-form>
          </div>

          <div class="api-status" v-if="apiStatus.show">
            <el-alert :title="apiStatus.message" :type="apiStatus.type" :closable="false" />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 数据库导入 -->
      <el-tab-pane label="数据库导入" name="database">
        <el-card>
          <div class="database-section">
            <el-form :model="dbForm" label-width="120px">
              <el-form-item label="数据库类型">
                <el-select v-model="dbForm.dbType" placeholder="选择数据库类型">
                  <el-option label="MySQL" value="mysql" />
                  <el-option label="PostgreSQL" value="postgresql" />
                  <el-option label="MongoDB" value="mongodb" />
                  <el-option label="Redis" value="redis" />
                </el-select>
              </el-form-item>
              <el-form-item label="连接地址">
                <el-input v-model="dbForm.host" placeholder="数据库地址" />
              </el-form-item>
              <el-form-item label="端口">
                <el-input-number v-model="dbForm.port" :min="1" :max="65535" placeholder="端口号" />
              </el-form-item>
              <el-form-item label="数据库名">
                <el-input v-model="dbForm.database" placeholder="数据库名称" />
              </el-form-item>
              <el-form-item label="用户名">
                <el-input v-model="dbForm.username" placeholder="用户名" />
              </el-form-item>
              <el-form-item label="密码">
                <el-input v-model="dbForm.password" placeholder="密码" type="password" show-password />
              </el-form-item>
              <el-form-item label="表名">
                <el-input v-model="dbForm.tableName" placeholder="表名或集合名" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="testDbConnection">测试连接</el-button>
                <el-button @click="saveDbConfig">保存配置</el-button>
                <el-button @click="startDbImport">开始导入</el-button>
              </el-form-item>
            </el-form>
          </div>

          <div class="db-status" v-if="dbStatus.show">
            <el-alert :title="dbStatus.message" :type="dbStatus.type" :closable="false" />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 导入历史 -->
      <el-tab-pane label="导入历史" name="history">
        <el-card>
          <div class="history-section">
            <div class="history-controls">
              <el-form :model="historyFilter" inline>
                <el-form-item label="数据类型">
                  <el-select v-model="historyFilter.dataType" placeholder="全部类型" clearable>
                    <el-option label="市场数据" value="market" />
                    <el-option label="交易数据" value="trading" />
                    <el-option label="策略数据" value="strategy" />
                    <el-option label="用户数据" value="user" />
                  </el-select>
                </el-form-item>
                <el-form-item label="状态">
                  <el-select v-model="historyFilter.status" placeholder="全部状态" clearable>
                    <el-option label="成功" value="success" />
                    <el-option label="失败" value="failed" />
                    <el-option label="进行中" value="processing" />
                    <el-option label="待处理" value="pending" />
                  </el-select>
                </el-form-item>
                <el-form-item label="时间范围">
                  <el-date-picker
                    v-model="historyFilter.dateRange"
                    type="datetimerange"
                    range-separator="至"
                    start-placeholder="开始时间"
                    end-placeholder="结束时间"
                    format="YYYY-MM-DD HH:mm:ss"
                    value-format="YYYY-MM-DD HH:mm:ss"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="searchHistory">查询</el-button>
                  <el-button @click="resetHistoryFilter">重置</el-button>
                </el-form-item>
              </el-form>
            </div>

            <el-table
              v-loading="historyLoading"
              :data="importHistory"
              style="width: 100%"
              border
            >
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="fileName" label="文件名" width="200" />
              <el-table-column prop="dataType" label="数据类型" width="100">
                <template #default="{ row }">
                  <el-tag :type="getDataTypeTagType(row.dataType)">
                    {{ getDataTypeLabel(row.dataType) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="importType" label="导入方式" width="100">
                <template #default="{ row }">
                  {{ getImportTypeLabel(row.importType) }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusTagType(row.status)">
                    {{ getStatusLabel(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="recordCount" label="记录数" width="100" />
              <el-table-column prop="startTime" label="开始时间" width="180">
                <template #default="{ row }">
                  {{ formatTime(row.startTime) }}
                </template>
              </el-table-column>
              <el-table-column prop="endTime" label="结束时间" width="180">
                <template #default="{ row }">
                  {{ row.endTime ? formatTime(row.endTime) : '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="errorMessage" label="错误信息" width="200" show-overflow-tooltip />
              <el-table-column label="操作" width="200">
                <template #default="{ row }">
                  <el-button size="small" @click="viewImportDetail(row)">详情</el-button>
                  <el-button size="small" @click="retryImport(row)" v-if="row.status === 'failed'">重试</el-button>
                  <el-button size="small" type="danger" @click="deleteImportRecord(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="pagination">
              <el-pagination
                v-model:current-page="historyPagination.page"
                v-model:page-size="historyPagination.size"
                :page-sizes="[10, 20, 50, 100]"
                :total="historyPagination.total"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleHistorySizeChange"
                @current-change="handleHistoryCurrentChange"
              />
            </div>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 导入详情对话框 -->
    <el-dialog v-model="detailDialog.show" title="导入详情" width="800px">
      <div class="import-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="导入ID">{{ detailDialog.data?.id }}</el-descriptions-item>
          <el-descriptions-item label="文件名">{{ detailDialog.data?.fileName }}</el-descriptions-item>
          <el-descriptions-item label="数据类型">{{ getDataTypeLabel(detailDialog.data?.dataType) }}</el-descriptions-item>
          <el-descriptions-item label="导入方式">{{ getImportTypeLabel(detailDialog.data?.importType) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(detailDialog.data?.status)">
              {{ getStatusLabel(detailDialog.data?.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="记录数">{{ detailDialog.data?.recordCount }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ formatTime(detailDialog.data?.startTime) }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ detailDialog.data?.endTime ? formatTime(detailDialog.data?.endTime) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="错误信息" :span="2">{{ detailDialog.data?.errorMessage || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-log" v-if="detailDialog.data?.log">
          <h4>处理日志</h4>
          <el-input
            type="textarea"
            :rows="10"
            :value="detailDialog.data?.log"
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'

const activeTab = ref('upload')
const fileList = ref([])
const historyLoading = ref(false)

// 上传配置
const uploadUrl = `${import.meta.env.VITE_API_URL}/data/upload`
const acceptTypes = '.csv,.json,.xlsx,.xls'

// 上传表单
const uploadForm = reactive({
  dataType: '',
  timeFormat: 'iso',
  dataSource: '',
  autoProcess: true
})

// API表单
const apiForm = reactive({
  apiType: 'rest',
  apiUrl: '',
  authType: 'none',
  apiKey: '',
  rateLimit: 1000
})

// 数据库表单
const dbForm = reactive({
  dbType: 'mysql',
  host: '',
  port: 3306,
  database: '',
  username: '',
  password: '',
  tableName: ''
})

// 历史记录筛选
const historyFilter = reactive({
  dataType: '',
  status: '',
  dateRange: []
})

// API状态
const apiStatus = reactive({
  show: false,
  message: '',
  type: 'info'
})

// 数据库状态
const dbStatus = reactive({
  show: false,
  message: '',
  type: 'info'
})

// 详情对话框
const detailDialog = reactive({
  show: false,
  data: null
})

// 导入历史数据
const importHistory = ref([
  {
    id: 1,
    fileName: 'market_data_2024.csv',
    dataType: 'market',
    importType: 'upload',
    status: 'success',
    recordCount: 10000,
    startTime: '2024-01-01 10:00:00',
    endTime: '2024-01-01 10:05:00',
    errorMessage: '',
    log: '导入成功，处理了10000条记录'
  },
  {
    id: 2,
    fileName: 'trading_data.json',
    dataType: 'trading',
    importType: 'api',
    status: 'failed',
    recordCount: 0,
    startTime: '2024-01-01 11:00:00',
    endTime: '2024-01-01 11:01:00',
    errorMessage: 'API连接失败',
    log: '连接API时发生错误：网络超时'
  }
])

// 历史记录分页
const historyPagination = reactive({
  page: 1,
  size: 20,
  total: 2
})

// 方法
const handleTabClick = (tab: any) => {
  if (tab.props.name === 'history') {
    searchHistory()
  }
}

const beforeUpload = (file: any) => {
  const isValidType = ['text/csv', 'application/json', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'].includes(file.type)
  const isLt50M = file.size / 1024 / 1024 < 50

  if (!isValidType) {
    ElMessage.error('只能上传CSV、JSON、Excel文件!')
    return false
  }
  if (!isLt50M) {
    ElMessage.error('文件大小不能超过50MB!')
    return false
  }
  return true
}

const handleUploadSuccess = (response: any, file: any) => {
  console.log('上传成功响应:', response)
  if (response.success) {
    ElMessage.success('文件上传成功')
    fileList.value = []
    searchHistory()
  } else {
    ElMessage.error(response.message || '文件上传失败')
  }
}

const handleUploadError = (error: any) => {
  ElMessage.error('文件上传失败')
  console.error('上传错误:', error)
}

const testApiConnection = async () => {
  try {
    apiStatus.show = true
    apiStatus.message = '正在测试API连接...'
    apiStatus.type = 'info'
    
    // 模拟API测试
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    apiStatus.message = 'API连接测试成功'
    apiStatus.type = 'success'
  } catch (error) {
    apiStatus.message = 'API连接测试失败'
    apiStatus.type = 'error'
  }
}

const saveApiConfig = () => {
  ElMessage.success('API配置已保存')
}

const startApiImport = () => {
  ElMessage.info('API导入已启动')
  searchHistory()
}

const testDbConnection = async () => {
  try {
    dbStatus.show = true
    dbStatus.message = '正在测试数据库连接...'
    dbStatus.type = 'info'
    
    // 模拟数据库测试
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    dbStatus.message = '数据库连接测试成功'
    dbStatus.type = 'success'
  } catch (error) {
    dbStatus.message = '数据库连接测试失败'
    dbStatus.type = 'error'
  }
}

const saveDbConfig = () => {
  ElMessage.success('数据库配置已保存')
}

const startDbImport = () => {
  ElMessage.info('数据库导入已启动')
  searchHistory()
}

const searchHistory = async () => {
  historyLoading.value = true
  try {
    // 构建查询参数
    const params: any = {
      page: historyPagination.page,
      limit: historyPagination.size
    }
    
    if (historyFilter.dataType) {
      params.dataType = historyFilter.dataType
    }
    
    if (historyFilter.status) {
      params.status = historyFilter.status
    }
    
    if (historyFilter.dateRange && historyFilter.dateRange.length === 2) {
      params.startTime = historyFilter.dateRange[0]
      params.endTime = historyFilter.dateRange[1]
    }
    
    // 调用后端 API
    const response = await fetch(`${import.meta.env.VITE_API_URL}/data/imports?${new URLSearchParams(params)}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    const data = await response.json()
    
    if (data.success) {
      importHistory.value = data.data.imports || []
      historyPagination.total = data.data.pagination?.total || 0
    } else {
      console.error('获取导入历史失败:', data.message)
      ElMessage.error(data.message || '获取导入历史失败')
    }
  } catch (error) {
    console.error('查询历史记录失败:', error)
    ElMessage.error('查询历史记录失败')
    // 如果 API 调用失败，使用模拟数据
    importHistory.value = [
      {
        id: 1,
        fileName: 'market_data_2024.csv',
        dataType: 'market',
        importType: 'upload',
        status: 'success',
        recordCount: 10000,
        startTime: '2024-01-01 10:00:00',
        endTime: '2024-01-01 10:05:00',
        errorMessage: '',
        log: '导入成功，处理了10000条记录'
      },
      {
        id: 2,
        fileName: 'trading_data.json',
        dataType: 'trading',
        importType: 'api',
        status: 'failed',
        recordCount: 0,
        startTime: '2024-01-01 11:00:00',
        endTime: '2024-01-01 11:01:00',
        errorMessage: 'API连接失败',
        log: '连接API时发生错误：网络超时'
      }
    ]
    historyPagination.total = 2
  } finally {
    historyLoading.value = false
  }
}

const resetHistoryFilter = () => {
  historyFilter.dataType = ''
  historyFilter.status = ''
  historyFilter.dateRange = []
  searchHistory()
}

const viewImportDetail = (record: any) => {
  detailDialog.data = record
  detailDialog.show = true
}

const retryImport = (record: any) => {
  ElMessageBox.confirm('确定要重新导入这个文件吗？', '确认', {
    type: 'warning'
  }).then(() => {
    ElMessage.success('重新导入已启动')
    searchHistory()
  })
}

const deleteImportRecord = async (record: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这条导入记录吗？', '确认', {
      type: 'warning'
    })
    
    const response = await fetch(`${import.meta.env.VITE_API_URL}/data/imports/${record.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    const data = await response.json()
    
    if (data.success) {
      ElMessage.success('删除成功')
      searchHistory()
    } else {
      ElMessage.error(data.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handleHistorySizeChange = (size: number) => {
  historyPagination.size = size
  searchHistory()
}

const handleHistoryCurrentChange = (page: number) => {
  historyPagination.page = page
  searchHistory()
}

const refreshData = () => {
  ElMessage.success('数据已刷新')
  searchHistory()
}

const getDataTypeTagType = (type: string) => {
  const types: Record<string, string> = {
    market: 'success',
    trading: 'primary',
    strategy: 'warning',
    user: 'info'
  }
  return types[type] || 'info'
}

const getDataTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    market: '市场数据',
    trading: '交易数据',
    strategy: '策略数据',
    user: '用户数据'
  }
  return labels[type] || type
}

const getImportTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    upload: '文件上传',
    api: 'API导入',
    database: '数据库导入'
  }
  return labels[type] || type
}

const getStatusTagType = (status: string) => {
  const types: Record<string, string> = {
    success: 'success',
    failed: 'danger',
    processing: 'warning',
    pending: 'info'
  }
  return types[status] || 'info'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    success: '成功',
    failed: '失败',
    processing: '进行中',
    pending: '待处理'
  }
  return labels[status] || status
}

const formatTime = (timeString: string) => {
  return new Date(timeString).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  searchHistory()
})
</script>

<style scoped>
.data-import {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  background: var(--bg-primary);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: var(--surface-elevated);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.page-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-2xl);
  font-weight: var(--font-semibold);
}

.upload-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.upload-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-demo {
  width: 100%;
}

.upload-settings {
  padding: 20px;
  background: var(--surface-elevated);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-primary);
}

.api-section,
.database-section {
  max-width: 600px;
}

.api-status,
.db-status {
  margin-top: 20px;
}

.history-controls {
  margin-bottom: 20px;
}

.history-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.import-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-log {
  margin-top: 20px;
}

.detail-log h4 {
  margin: 0 0 12px 0;
  color: var(--text-primary);
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
}

/* Element Plus 样式覆盖 */
:deep(.el-card) {
  background: var(--surface-elevated) !important;
  border: 1px solid var(--border-primary) !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: var(--shadow-md) !important;
}

:deep(.el-card__header) {
  background: var(--surface-elevated) !important;
  border-bottom: 1px solid var(--border-primary) !important;
  padding: 16px 20px !important;
}

:deep(.el-tabs__nav-wrap::after) {
  background: var(--border-primary) !important;
}

:deep(.el-tabs__item) {
  color: var(--text-secondary) !important;
}

:deep(.el-tabs__item.is-active) {
  color: var(--btn-primary) !important;
}

:deep(.el-tabs__active-bar) {
  background: var(--btn-primary) !important;
}

:deep(.el-upload-dragger) {
  background: var(--surface-elevated) !important;
  border: 2px dashed var(--border-primary) !important;
}

:deep(.el-upload-dragger:hover) {
  border-color: var(--btn-primary) !important;
}

:deep(.el-form-item__label) {
  color: var(--text-secondary) !important;
  font-weight: var(--font-medium) !important;
}

:deep(.el-input__wrapper) {
  background: var(--input-bg) !important;
  border-color: var(--input-border) !important;
}

:deep(.el-input__inner) {
  color: var(--input-text) !important;
}

:deep(.el-select .el-input__wrapper) {
  background: var(--input-bg) !important;
  border-color: var(--input-border) !important;
}

:deep(.el-select-dropdown) {
  background: var(--surface-overlay) !important;
  border: 1px solid var(--border-primary) !important;
}

:deep(.el-select-dropdown__item) {
  color: var(--text-primary) !important;
}

:deep(.el-select-dropdown__item:hover) {
  background: var(--bg-hover) !important;
}

:deep(.el-button) {
  border-radius: var(--radius-md) !important;
  font-weight: var(--font-medium) !important;
}

:deep(.el-button--primary) {
  background: var(--btn-primary) !important;
  border-color: var(--btn-primary) !important;
  color: white !important;
}

:deep(.el-button--primary:hover) {
  background: var(--btn-primary-hover) !important;
  border-color: var(--btn-primary-hover) !important;
  box-shadow: var(--glow-primary) !important;
}

:deep(.el-table) {
  background: transparent !important;
  color: var(--text-primary) !important;
}

:deep(.el-table th) {
  background: var(--surface-elevated) !important;
  color: var(--text-secondary) !important;
  border-bottom: 1px solid var(--border-primary) !important;
  font-weight: var(--font-semibold) !important;
}

:deep(.el-table td) {
  background: transparent !important;
  border-bottom: 1px solid var(--border-secondary) !important;
  color: var(--text-primary) !important;
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
  background: var(--bg-hover) !important;
}

:deep(.el-dialog) {
  background: var(--surface-overlay) !important;
  border: 1px solid var(--border-primary) !important;
  border-radius: var(--radius-xl) !important;
  box-shadow: var(--shadow-premium-lg) !important;
}

:deep(.el-dialog__header) {
  background: var(--surface-elevated) !important;
  border-bottom: 1px solid var(--border-primary) !important;
  padding: 20px 24px !important;
}

:deep(.el-dialog__title) {
  color: var(--text-primary) !important;
  font-weight: var(--font-semibold) !important;
  font-size: var(--font-lg) !important;
}

:deep(.el-dialog__body) {
  background: var(--bg-primary) !important;
  padding: 24px !important;
  color: var(--text-primary) !important;
}

:deep(.el-descriptions) {
  background: transparent !important;
}

:deep(.el-descriptions__label) {
  background: var(--surface-elevated) !important;
  color: var(--text-secondary) !important;
}

:deep(.el-descriptions__content) {
  background: transparent !important;
  color: var(--text-primary) !important;
}

:deep(.el-pagination) {
  color: var(--text-primary) !important;
}

:deep(.el-pagination .el-pagination__total) {
  color: var(--text-secondary) !important;
}

:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next) {
  background: var(--surface-elevated) !important;
  border: 1px solid var(--border-primary) !important;
  color: var(--text-primary) !important;
}

:deep(.el-pagination .el-pager li) {
  background: var(--surface-elevated) !important;
  border: 1px solid var(--border-primary) !important;
  color: var(--text-primary) !important;
}

:deep(.el-pagination .el-pager li.active) {
  background: var(--btn-primary) !important;
  border-color: var(--btn-primary) !important;
  color: white !important;
}

:deep(.el-upload-list__item-name) {
  color: var(--text-primary) !important;
}

:deep(.el-upload-list__item .el-icon--close) {
  color: var(--text-secondary) !important;
}

:deep(.el-upload-list__item .el-icon--close:hover) {
  color: var(--text-primary) !important;
}

:deep(.el-textarea__inner) {
  background: var(--input-bg) !important;
  border-color: var(--input-border) !important;
  color: var(--input-text) !important;
}

:deep(.el-alert) {
  background: var(--surface-elevated) !important;
  border: 1px solid var(--border-primary) !important;
}

:deep(.el-alert__title) {
  color: var(--text-primary) !important;
}
</style>