<template>
  <div class="data-source-test">
    <div class="page-header">
      <h2>数据源测试</h2>
      <el-button type="primary" @click="refreshAll">刷新所有</el-button>
    </div>

    <!-- 数据源状态概览 -->
    <el-row :gutter="20" style="margin-bottom: 24px">
      <el-col :span="6" v-for="source in dataSources" :key="source.name">
        <el-card class="source-card" :class="{ 'connected': source.connected, 'error': source.error }">
          <div class="source-header">
            <el-icon class="source-icon" :class="source.connected ? 'success' : 'error'">
              <component :is="source.connected ? 'Connection' : 'ConnectionFailed'" />
            </el-icon>
            <div class="source-info">
              <h3>{{ source.name }}</h3>
              <span class="source-type">{{ source.type }}</span>
            </div>
          </div>
          <div class="source-status">
            <div class="status-item">
              <span class="label">状态:</span>
              <span class="value" :class="source.connected ? 'success' : 'error'">
                {{ source.connected ? '已连接' : '未连接' }}
              </span>
            </div>
            <div class="status-item">
              <span class="label">延迟:</span>
              <span class="value">{{ source.latency }}ms</span>
            </div>
            <div class="status-item">
              <span class="label">错误:</span>
              <span class="value error">{{ source.errorCount }}</span>
            </div>
          </div>
          <div class="source-actions">
            <el-button size="small" @click="testConnection(source)">测试连接</el-button>
            <el-button size="small" type="primary" @click="fetchSampleData(source)">获取样例</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 测试配置区域 -->
    <el-tabs v-model="activeTab">
      <!-- API数据源测试 -->
      <el-tab-pane label="API数据源" name="api">
        <el-card>
          <div class="test-section">
            <h3>API数据源测试</h3>
            <el-form :model="apiTestForm" label-width="120px">
              <el-form-item label="数据源">
                <el-select v-model="apiTestForm.source" placeholder="选择数据源">
                  <el-option label="Binance" value="binance" />
                  <el-option label="OKX" value="okx" />
                  <el-option label="Huobi" value="huobi" />
                  <el-option label="Yahoo Finance" value="yahoo" />
                </el-select>
              </el-form-item>
              <el-form-item label="API类型">
                <el-select v-model="apiTestForm.apiType">
                  <el-option label="市场数据" value="market" />
                  <el-option label="历史数据" value="historical" />
                  <el-option label="实时数据" value="realtime" />
                </el-select>
              </el-form-item>
              <el-form-item label="交易对">
                <el-input v-model="apiTestForm.symbol" placeholder="例如: BTCUSDT" />
              </el-form-item>
              <el-form-item label="时间周期">
                <el-select v-model="apiTestForm.interval">
                  <el-option label="1分钟" value="1m" />
                  <el-option label="5分钟" value="5m" />
                  <el-option label="15分钟" value="15m" />
                  <el-option label="1小时" value="1h" />
                  <el-option label="1天" value="1d" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="testApiSource">测试API</el-button>
                <el-button @click="resetApiForm">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- WebSocket数据源测试 -->
      <el-tab-pane label="WebSocket数据源" name="websocket">
        <el-card>
          <div class="test-section">
            <h3>WebSocket实时数据测试</h3>
            <el-form :model="wsTestForm" label-width="120px">
              <el-form-item label="数据源">
                <el-select v-model="wsTestForm.source">
                  <el-option label="Binance WebSocket" value="binance-ws" />
                  <el-option label="OKX WebSocket" value="okx-ws" />
                </el-select>
              </el-form-item>
              <el-form-item label="订阅交易对">
                <el-input v-model="wsTestForm.symbols" placeholder="多个交易对用逗号分隔，例如: BTCUSDT,ETHUSDT" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="startWebSocketTest" :disabled="wsConnected">
                  开始测试
                </el-button>
                <el-button type="danger" @click="stopWebSocketTest" :disabled="!wsConnected">
                  停止测试
                </el-button>
              </el-form-item>
            </el-form>

            <!-- WebSocket实时数据显示 -->
            <div v-if="wsConnected" class="ws-data-display">
              <h4>实时数据流</h4>
              <div class="ws-messages" ref="wsMessages">
                <div v-for="(msg, index) in wsMessages" :key="index" class="ws-message">
                  <span class="timestamp">{{ formatTime(msg.timestamp) }}</span>
                  <span class="symbol">{{ msg.symbol }}</span>
                  <span class="price" :class="msg.change >= 0 ? 'positive' : 'negative'">
                    ${{ msg.price }}
                  </span>
                  <span class="change" :class="msg.change >= 0 ? 'positive' : 'negative'">
                    {{ msg.change >= 0 ? '+' : '' }}{{ msg.change }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 数据样例展示 -->
      <el-tab-pane label="数据样例" name="samples">
        <el-card>
          <div class="samples-section">
            <h3>数据样例展示</h3>
            <div class="samples-controls">
              <el-select v-model="selectedSample" @change="loadSample">
                <el-option label="市场数据样例" value="market" />
                <el-option label="历史数据样例" value="historical" />
                <el-option label="实时数据样例" value="realtime" />
                <el-option label="K线数据样例" value="kline" />
              </el-select>
              <el-button @click="copySample">复制数据</el-button>
              <el-button @click="downloadSample">下载JSON</el-button>
            </div>
            
            <div class="sample-display">
              <pre>{{ sampleData }}</pre>
            </div>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 测试结果对话框 -->
    <el-dialog v-model="testResult.show" title="测试结果" width="80%">
      <div class="test-result">
        <div class="result-header">
          <el-tag :type="testResult.success ? 'success' : 'danger'">
            {{ testResult.success ? '测试成功' : '测试失败' }}
          </el-tag>
          <span class="test-duration">耗时: {{ testResult.duration }}ms</span>
        </div>
        
        <div class="result-content">
          <div v-if="testResult.success" class="success-result">
            <h4>返回数据样例:</h4>
            <pre class="data-sample">{{ testResult.sampleData }}</pre>
            
            <div class="data-stats">
              <el-descriptions :column="3" border>
                <el-descriptions-item label="数据点数量">{{ testResult.dataCount }}</el-descriptions-item>
                <el-descriptions-item label="更新时间">{{ testResult.updateTime }}</el-descriptions-item>
                <el-descriptions-item label="数据源">{{ testResult.source }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
          
          <div v-else class="error-result">
            <h4>错误信息:</h4>
            <el-alert :title="testResult.error" type="error" :closable="false" />
            <div class="error-details">
              <h5>错误详情:</h5>
              <pre>{{ testResult.errorDetails }}</pre>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="testResult.show = false">关闭</el-button>
        <el-button v-if="testResult.success" type="primary" @click="exportTestData">导出数据</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Connection, ConnectionFailed } from '@element-plus/icons-vue'

const activeTab = ref('api')
const wsConnected = ref(false)
const wsMessages = ref([])
const selectedSample = ref('market')

// 数据源状态
const dataSources = ref([
  {
    name: 'Binance',
    type: 'REST API',
    connected: false,
    latency: 0,
    errorCount: 0
  },
  {
    name: 'OKX',
    type: 'REST API',
    connected: false,
    latency: 0,
    errorCount: 0
  },
  {
    name: 'Yahoo Finance',
    type: 'REST API',
    connected: true,
    latency: 150,
    errorCount: 0
  },
  {
    name: 'Binance WebSocket',
    type: 'WebSocket',
    connected: false,
    latency: 0,
    errorCount: 0
  }
])

// API测试表单
const apiTestForm = reactive({
  source: 'yahoo',
  apiType: 'market',
  symbol: 'BTCUSDT',
  interval: '1h'
})

// WebSocket测试表单
const wsTestForm = reactive({
  source: 'binance-ws',
  symbols: 'BTCUSDT,ETHUSDT'
})

// 测试结果
const testResult = reactive({
  show: false,
  success: false,
  duration: 0,
  sampleData: '',
  dataCount: 0,
  updateTime: '',
  source: '',
  error: '',
  errorDetails: ''
})

// 样例数据
const sampleData = ref('')

// 测试数据源连接
const testConnection = async (source: any) => {
  try {
    const startTime = Date.now()
    
    // 模拟API调用
    const response = await fetch(`${import.meta.env.VITE_API_URL}/data-test/test-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        source: source.name.toLowerCase(),
        type: source.type
      })
    })
    
    const latency = Date.now() - startTime
    
    if (response.ok) {
      source.connected = true
      source.latency = latency
      source.errorCount = 0
      ElMessage.success(`${source.name} 连接测试成功，延迟: ${latency}ms`)
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  } catch (error) {
    source.connected = false
    source.errorCount++
    ElMessage.error(`${source.name} 连接测试失败`)
  }
}

// 获取样例数据
const fetchSampleData = async (source: any) => {
  try {
    const startTime = Date.now()
    
    const response = await fetch(`${import.meta.env.VITE_API_URL}/data-test/sample`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        source: source.name.toLowerCase(),
        symbol: 'BTCUSDT',
        limit: 5
      })
    })
    
    const duration = Date.now() - startTime
    const data = await response.json()
    
    if (data.success) {
      testResult.show = true
      testResult.success = true
      testResult.duration = duration
      testResult.sampleData = JSON.stringify(data.data, null, 2)
      testResult.dataCount = data.data.length || 1
      testResult.updateTime = new Date().toLocaleString()
      testResult.source = source.name
    } else {
      throw new Error(data.message || '获取数据失败')
    }
  } catch (error) {
    testResult.show = true
    testResult.success = false
    testResult.error = error.message
    testResult.errorDetails = JSON.stringify(error, null, 2)
  }
}

// 测试API数据源
const testApiSource = async () => {
  try {
    const startTime = Date.now()
    
    const response = await fetch(`${import.meta.env.VITE_API_URL}/data-test/test-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(apiTestForm)
    })
    
    const duration = Date.now() - startTime
    const data = await response.json()
    
    if (data.success) {
      testResult.show = true
      testResult.success = true
      testResult.duration = duration
      testResult.sampleData = JSON.stringify(data.data, null, 2)
      testResult.dataCount = data.data.length || 1
      testResult.updateTime = new Date().toLocaleString()
      testResult.source = apiTestForm.source
    } else {
      throw new Error(data.message || 'API测试失败')
    }
  } catch (error) {
    testResult.show = true
    testResult.success = false
    testResult.error = error.message
    testResult.errorDetails = JSON.stringify(error, null, 2)
  }
}

// WebSocket测试
let wsInstance: WebSocket = null

const startWebSocketTest = () => {
  try {
    const wsUrl = 'wss://stream.binance.com:9443/ws'
    const symbols = wsTestForm.symbols.split(',').map(s => s.trim().toLowerCase())
    
    const streams = symbols.map(s => `${s}@ticker`).join('/')
    wsInstance = new WebSocket(`${wsUrl}/${streams}`)
    
    wsInstance.onopen = () => {
      wsConnected.value = true
      ElMessage.success('WebSocket连接成功')
      wsMessages.value = []
    }
    
    wsInstance.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.e === '24hrTicker') {
        wsMessages.value.unshift({
          timestamp: new Date(),
          symbol: data.s,
          price: parseFloat(data.c).toFixed(2),
          change: parseFloat(data.P).toFixed(2)
        })
        
        // 限制消息数量
        if (wsMessages.value.length > 50) {
          wsMessages.value = wsMessages.value.slice(0, 50)
        }
      }
    }
    
    wsInstance.onerror = (error) => {
      console.error('WebSocket错误:', error)
      ElMessage.error('WebSocket连接错误')
    }
    
    wsInstance.onclose = () => {
      wsConnected.value = false
      ElMessage.info('WebSocket连接已关闭')
    }
  } catch (error) {
    ElMessage.error('WebSocket连接失败')
  }
}

const stopWebSocketTest = () => {
  if (wsInstance) {
    wsInstance.close()
    wsInstance = null
  }
}

// 重置表单
const resetApiForm = () => {
  apiTestForm.source = 'yahoo'
  apiTestForm.apiType = 'market'
  apiTestForm.symbol = 'BTCUSDT'
  apiTestForm.interval = '1h'
}

// 加载样例数据
const loadSample = () => {
  const samples = {
    market: {
      symbol: 'BTCUSDT',
      price: 45000.00,
      change24h: 2.5,
      volume24h: 2500000000,
      high24h: 45500,
      low24h: 44200,
      timestamp: new Date().toISOString()
    },
    historical: [
      {
        timestamp: '2024-01-01T00:00:00Z',
        open: 44000,
        high: 44500,
        low: 43800,
        close: 44200,
        volume: 1500000
      },
      {
        timestamp: '2024-01-01T01:00:00Z',
        open: 44200,
        high: 44800,
        low: 44100,
        close: 44700,
        volume: 1200000
      }
    ],
    realtime: {
      symbol: 'BTCUSDT',
      price: 45000.00,
      bid: 44999.50,
      ask: 45000.50,
      volume: 1500000,
      timestamp: new Date().toISOString()
    },
    kline: {
      symbol: 'BTCUSDT',
      interval: '1h',
      open: 44000,
      high: 45500,
      low: 43800,
      close: 45000,
      volume: 2500000,
      openTime: new Date(Date.now() - 3600000).toISOString(),
      closeTime: new Date().toISOString()
    }
  }
  
  sampleData.value = JSON.stringify(samples[selectedSample.value], null, 2)
}

// 复制样例数据
const copySample = () => {
  navigator.clipboard.writeText(sampleData.value).then(() => {
    ElMessage.success('数据已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

// 下载样例数据
const downloadSample = () => {
  const blob = new Blob([sampleData.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${selectedSample.value}_sample.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 导出测试数据
const exportTestData = () => {
  const blob = new Blob([testResult.sampleData], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${testResult.source}_test_data.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 刷新所有数据源
const refreshAll = async () => {
  for (const source of dataSources.value) {
    await testConnection(source)
  }
}

// 格式化时间
const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString()
}

// 生命周期
onMounted(() => {
  loadSample()
  // 初始化数据源状态
  setTimeout(() => {
    testConnection(dataSources.value[2]) // Yahoo Finance
  }, 1000)
})

onUnmounted(() => {
  stopWebSocketTest()
})
</script>

<style scoped>
.data-source-test {
  padding: 20px;
  background: var(--bg-primary);
  min-height: 100vh;
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

.source-card {
  height: 100%;
  transition: all var(--transition-normal) var(--ease-out);
}

.source-card.connected {
  border-color: var(--market-up);
}

.source-card.error {
  border-color: var(--market-down);
}

.source-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.source-icon {
  font-size: 24px;
}

.source-icon.success {
  color: var(--market-up);
}

.source-icon.error {
  color: var(--market-down);
}

.source-info h3 {
  margin: 0;
  font-size: var(--font-lg);
  color: var(--text-primary);
}

.source-type {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

.source-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-item .label {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

.status-item .value {
  font-weight: var(--font-semibold);
}

.status-item .value.success {
  color: var(--market-up);
}

.status-item .value.error {
  color: var(--market-down);
}

.source-actions {
  display: flex;
  gap: 8px;
}

.test-section {
  padding: 20px;
}

.ws-data-display {
  margin-top: 20px;
}

.ws-messages {
  height: 300px;
  overflow-y: auto;
  background: var(--surface-elevated);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: 12px;
}

.ws-message {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  font-family: monospace;
  font-size: var(--font-sm);
}

.ws-message .timestamp {
  color: var(--text-secondary);
}

.ws-message .symbol {
  color: var(--text-primary);
  font-weight: var(--font-semibold);
}

.ws-message .price {
  font-weight: var(--font-semibold);
}

.ws-message .change {
  font-weight: var(--font-semibold);
}

.samples-section {
  padding: 20px;
}

.samples-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
}

.sample-display {
  background: var(--surface-elevated);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: 20px;
  max-height: 500px;
  overflow-y: auto;
}

.sample-display pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: var(--font-sm);
  color: var(--text-primary);
}

.test-result {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.test-duration {
  color: var(--text-secondary);
  font-size: var(--font-sm);
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.success-result h4,
.error-result h4 {
  margin: 0 0 12px 0;
  color: var(--text-primary);
}

.data-sample {
  background: var(--surface-elevated);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: 16px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: var(--font-sm);
  color: var(--text-primary);
}

.data-stats {
  margin-top: 16px;
}

.error-details {
  margin-top: 16px;
}

.error-details pre {
  background: var(--surface-elevated);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: 16px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: var(--font-sm);
  color: var(--text-primary);
}

/* Element Plus 样式覆盖 */
:deep(.el-card) {
  background: var(--surface-elevated) !important;
  border: 1px solid var(--border-primary) !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: var(--shadow-md) !important;
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

:deep(.el-dialog) {
  background: var(--surface-overlay) !important;
  border: 1px solid var(--border-primary) !important;
  border-radius: var(--radius-xl) !important;
}

:deep(.el-dialog__header) {
  background: var(--surface-elevated) !important;
  border-bottom: 1px solid var(--border-primary) !important;
}

:deep(.el-dialog__title) {
  color: var(--text-primary) !important;
  font-weight: var(--font-semibold) !important;
}

:deep(.el-dialog__body) {
  background: var(--bg-primary) !important;
  color: var(--text-primary) !important;
}
</style>