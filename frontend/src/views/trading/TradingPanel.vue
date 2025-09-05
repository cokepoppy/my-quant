<template>
  <div class="trading-panel">
    <div class="page-header">
      <h2>交易管理</h2>
      <div class="header-actions">
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-button @click="openSettings">
          <el-icon><Setting /></el-icon>
          设置
        </el-button>
      </div>
    </div>

    <div class="trading-content">
      <!-- 交易所选项卡 -->
      <div class="exchange-tabs">
        <div class="exchange-tabs-container">
          <div 
            v-for="exchange in exchanges"
            :key="exchange.id"
            class="exchange-tab"
            :class="{ active: activeExchange === exchange.id }"
            @click="switchExchange(exchange.id)"
          >
            <div class="exchange-info">
              <span class="exchange-name">{{ exchange.name }}</span>
              <div class="exchange-status">
                <span class="status-indicator" :class="exchange.status">
                  {{ getStatusIndicator(exchange.status) }}
                </span>
                <span class="balance">{{ formatCurrency(exchange.totalAssets) }}</span>
              </div>
            </div>
            <div class="exchange-actions">
              <el-button
                v-if="!exchange.connected"
                size="small"
                type="primary"
                @click.stop="showConnectDialog(exchange)"
              >
                连接
              </el-button>
              <el-button
                v-else-if="exchange.status === 'error'"
                size="small"
                type="warning"
                @click.stop="reconnectExchange(exchange)"
              >
                重新连接
              </el-button>
              <el-button
                v-else
                size="small"
                type="danger"
                @click.stop="disconnectExchange(exchange)"
              >
                断开连接
              </el-button>
            </div>
          </div>
          <div class="exchange-tab add-exchange" @click="showAddExchangeDialog">
            <el-icon><Plus /></el-icon>
            <span>添加交易所</span>
          </div>
        </div>
      </div>

      <!-- 账户余额信息 -->
      <div class="account-section" v-if="currentExchange.connected">
        <div class="section-header">
          <h3>账户余额 ({{ currentExchange.name }})</h3>
          <div class="header-actions">
            <el-tag 
              :type="getConnectionStatusType(currentExchange.status)"
              size="small"
            >
              连接状态: {{ getConnectionStatusText(currentExchange.status) }}
            </el-tag>
            <el-button size="small" @click="refreshAccountData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
        
        <div class="account-cards">
          <div class="account-card">
            <div class="card-title">总资产</div>
            <div class="card-value">{{ formatCurrency(currentExchange.totalAssets) }}</div>
            <div class="card-change" :class="currentExchange.dailyChange >= 0 ? 'positive' : 'negative'">
              {{ currentExchange.dailyChange >= 0 ? '+' : '' }}{{ currentExchange.dailyChange }}%
            </div>
          </div>
          
          <div class="account-card">
            <div class="card-title">可用余额</div>
            <div class="card-value">{{ formatCurrency(currentExchange.availableBalance) }}</div>
            <div class="card-subtitle">{{ currentExchange.availableBalancePercent }}%</div>
          </div>
          
          <div class="account-card">
            <div class="card-title">冻结资金</div>
            <div class="card-value">{{ formatCurrency(currentExchange.frozenBalance) }}</div>
          </div>
          
          <div class="account-card">
            <div class="card-title">今日盈亏</div>
            <div class="card-value" :class="currentExchange.dailyPnL >= 0 ? 'positive' : 'negative'">
              {{ currentExchange.dailyPnL >= 0 ? '+' : '' }}{{ formatCurrency(currentExchange.dailyPnL) }}
            </div>
          </div>
        </div>

        <!-- 资产明细 -->
        <div class="asset-details" v-if="currentExchange.balances && currentExchange.balances.length > 0">
          <div class="detail-item">
            <span class="label">USDT:</span>
            <span class="value">{{ formatCurrency(currentExchange.getBalanceByAsset('USDT')) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">BTC:</span>
            <span class="value">{{ currentExchange.getBalanceByAsset('BTC') || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- 快速交易面板 -->
      <div class="trading-section" v-if="currentExchange.connected">
        <div class="section-header">
          <h3>快速交易</h3>
        </div>
        
        
        <div class="trading-form">
          <div class="form-row">
            <div class="form-group">
              <label>交易对</label>
              <el-select v-model="tradingForm.symbol" placeholder="选择交易对" style="width: 100%">
                <el-option
                  v-for="symbol in availableSymbols"
                  :key="symbol"
                  :label="symbol"
                  :value="symbol"
                />
              </el-select>
            </div>
            
            <div class="form-group">
              <label>方向</label>
              <el-radio-group v-model="tradingForm.type" style="width: 100%">
                <el-radio-button label="buy">买入</el-radio-button>
                <el-radio-button label="sell">卖出</el-radio-button>
              </el-radio-group>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>类型</label>
              <el-radio-group v-model="tradingForm.orderType" style="width: 100%">
                <el-radio-button label="market">市价</el-radio-button>
                <el-radio-button label="limit">限价</el-radio-button>
              </el-radio-group>
            </div>
            
            <div class="form-group">
              <label>价格</label>
              <el-input-number
                v-model="tradingForm.price"
                :min="0"
                :step="0.01"
                style="width: 100%"
                placeholder="价格"
                :disabled="tradingForm.orderType === 'market'"
              />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>数量</label>
              <el-input-number
                v-model="tradingForm.amount"
                :min="0.001"
                :step="0.001"
                style="width: 100%"
                placeholder="交易数量"
              />
            </div>
            
            <div class="form-group">
              <label>&nbsp;</label>
              <div class="trading-actions">
                <el-button
                  type="success"
                  size="large"
                  @click="submitOrder"
                  :disabled="!canSubmitOrder"
                  :loading="submitting"
                  style="width: 100%"
                >
                  <el-icon><ShoppingCart /></el-icon>
                  立即下单
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 当前持仓 -->
      <div class="positions-section" v-if="currentExchange.connected">
        <div class="section-header">
          <h3>当前持仓 ({{ currentExchange.positions.length }})</h3>
          <div class="header-actions">
            <el-button size="small" @click="refreshPositions">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button size="small" @click="exportPositions">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
          </div>
        </div>
        
        <div class="positions-table">
          <el-table :data="positions" style="width: 100%">
            <el-table-column prop="symbol" label="品种" min-width="100" />
            <el-table-column prop="side" label="方向" width="80">
              <template #default="{ row }">
                <el-tag :type="row.side === 'long' ? 'success' : 'danger'" size="small">
                  {{ row.side === 'long' ? '多' : '空' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="数量" align="right" />
            <el-table-column prop="avgPrice" label="开仓价" align="right">
              <template #default="{ row }">
                {{ formatCurrency(row.avgPrice) }}
              </template>
            </el-table-column>
            <el-table-column prop="currentPrice" label="当前价" align="right">
              <template #default="{ row }">
                {{ formatCurrency(row.currentPrice) }}
              </template>
            </el-table-column>
            <el-table-column prop="pnl" label="浮动盈亏" align="right">
              <template #default="{ row }">
                <span :class="row.pnl >= 0 ? 'positive' : 'negative'">
                  {{ row.pnl >= 0 ? '+' : '' }}{{ formatCurrency(row.pnl) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="pnlPercent" label="盈亏%" align="right">
              <template #default="{ row }">
                <span :class="row.pnlPercent >= 0 ? 'positive' : 'negative'">
                  {{ row.pnlPercent >= 0 ? '+' : '' }}{{ row.pnlPercent }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="closePosition(row)">平仓</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 最近订单 -->
      <div class="orders-section" v-if="currentExchange.connected">
        <div class="section-header">
          <h3>最近订单 ({{ currentExchange.orders.length }})</h3>
          <div class="header-actions">
            <el-button size="small" @click="refreshOrders">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button size="small" @click="viewAllOrders">
              查看全部
            </el-button>
          </div>
        </div>
        
        <div class="orders-table">
          <el-table :data="recentOrders" style="width: 100%">
            <el-table-column prop="symbol" label="品种" min-width="80" />
            <el-table-column prop="type" label="方向" width="60">
              <template #default="{ row }">
                <el-tag :type="row.type === 'buy' ? 'success' : 'danger'" size="small">
                  {{ row.type === 'buy' ? '买入' : '卖出' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="orderType" label="类型" width="60">
              <template #default="{ row }">
                <el-tag :type="getOrderTypeType(row.orderType)" size="small">
                  {{ getOrderTypeText(row.orderType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="数量" align="right" />
            <el-table-column prop="price" label="价格" align="right">
              <template #default="{ row }">
                {{ row.price ? formatCurrency(row.price) : '市价' }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="getOrderStatusType(row.status)" size="small">
                  {{ getOrderStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="时间" width="120">
              <template #default="{ row }">
                {{ formatTime(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button
                  size="small"
                  @click="cancelOrder(row)"
                  v-if="row.status === 'pending'"
                >
                  撤销
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <!-- 交易所配置对话框 -->
    <el-dialog
      v-model="exchangeDialogVisible"
      :title="dialogTitle"
      width="600px"
      :before-close="handleDialogClose"
    >
      <el-form
        ref="exchangeFormRef"
        :model="exchangeForm"
        :rules="exchangeRules"
        label-width="120px"
      >
        <el-form-item label="交易所类型" prop="exchange">
          <el-select v-model="exchangeForm.exchange" placeholder="请选择交易所" style="width: 100%">
            <el-option label="币安 (Binance)" value="binance" />
            <el-option label="OKX" value="okx" />
            <el-option label="火币 (Huobi)" value="huobi" />
            <el-option label="Bybit" value="bybit" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="账户名称" prop="name">
          <el-input v-model="exchangeForm.name" placeholder="请输入账户名称" />
        </el-form-item>
        
        <el-form-item label="API Key" prop="apiKey">
          <el-input
            v-model="exchangeForm.apiKey"
            type="password"
            placeholder="请输入API Key"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="API Secret" prop="apiSecret">
          <el-input
            v-model="exchangeForm.apiSecret"
            type="password"
            placeholder="请输入API Secret"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="Passphrase" prop="passphrase" v-if="exchangeForm.exchange === 'okx'">
          <el-input
            v-model="exchangeForm.passphrase"
            type="password"
            placeholder="请输入Passphrase (仅OKX需要)"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="环境" prop="testnet">
          <el-radio-group v-model="exchangeForm.testnet">
            <el-radio :label="true">测试网</el-radio>
            <el-radio :label="false">实盘</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="连接状态" v-if="testingConnection || connectionStatus">
          <div class="connection-test-status">
            <el-tag 
              :type="getConnectionTestType(connectionStatus)"
              size="small"
            >
              {{ getConnectionTestText(connectionStatus) }}
            </el-tag>
            <div v-if="connectionError" class="connection-error">
              {{ connectionError }}
            </div>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="exchangeDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="testConnection"
            :loading="testingConnection"
            :disabled="!canTestConnection"
          >
            测试连接
          </el-button>
          <el-button 
            type="success" 
            @click="saveExchange"
            :loading="savingExchange"
            :disabled="!canSaveExchange"
          >
            保存并连接
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import {
  Refresh,
  ShoppingCart,
  Setting,
  Plus,
  CircleCheck,
  CircleClose,
  Download
} from '@element-plus/icons-vue'
import { exchangeApi } from '@/api/exchange'
import { placeOrder } from '@/api/trading'

interface ExchangeBalance {
  asset: string
  free: number
  locked: number
  total: number
}

interface Exchange {
  id: string
  name: string
  connected: boolean
  status: 'connected' | 'disconnected' | 'error'
  totalAssets: number
  availableBalance: number
  frozenBalance: number
  dailyPnL: number
  dailyChange: number
  availableBalancePercent: number
  balances: ExchangeBalance[]
  positions: Position[]
  orders: Order[]
  getBalanceByAsset: (asset: string) => number
}

interface Position {
  symbol: string
  side: 'long' | 'short'
  amount: number
  avgPrice: number
  currentPrice: number
  pnl: number
  pnlPercent: number
}

interface Order {
  id: string
  symbol: string
  type: 'buy' | 'sell'
  orderType: 'market' | 'limit' | 'stop' | 'take_profit'
  amount: number
  price?: number
  status: string
  createdAt: Date
}

interface TradingForm {
  symbol: string
  type: 'buy' | 'sell'
  orderType: 'market' | 'limit'
  amount: number
  price?: number
}

interface ExchangeForm {
  id?: string
  exchange: string
  name: string
  apiKey: string
  apiSecret: string
  passphrase?: string
  testnet: boolean
}

const activeExchange = ref('binance')
const submitting = ref(false)
const exchangeDialogVisible = ref(false)
const testingConnection = ref(false)
const savingExchange = ref(false)
const connectionStatus = ref<'idle' | 'testing' | 'success' | 'error'>('idle')
const connectionError = ref('')
const exchangeFormRef = ref<FormInstance>()
const dialogMode = ref<'add' | 'edit' | 'connect'>('add')
const editingExchange = ref<Exchange | null>(null)

const exchangeForm = reactive<ExchangeForm>({
  exchange: 'bybit',
  name: '',
  apiKey: '',
  apiSecret: '',
  passphrase: '',
  testnet: true
})

const exchanges = ref<Exchange[]>([])

const currentExchange = computed(() => {
  return exchanges.value.find(exchange => exchange.id === activeExchange.value) || {
    id: '',
    name: '',
    connected: false,
    status: 'disconnected',
    totalAssets: 0,
    availableBalance: 0,
    frozenBalance: 0,
    dailyPnL: 0,
    dailyChange: 0,
    availableBalancePercent: 0,
    balances: [],
    positions: [],
    orders: [],
    getBalanceByAsset: () => 0
  }
})

const exchangeRules: FormRules = {
  exchange: [
    { required: true, message: '请选择交易所', trigger: 'change' }
  ],
  name: [
    { required: true, message: '请输入账户名称', trigger: 'blur' }
  ],
  apiKey: [
    { required: true, message: '请输入API Key', trigger: 'blur' }
  ],
  apiSecret: [
    { required: true, message: '请输入API Secret', trigger: 'blur' }
  ],
  passphrase: [
    { required: true, message: '请输入Passphrase', trigger: 'blur', when: () => exchangeForm.exchange === 'okx' }
  ]
}

const availableSymbols = ref([
  'BTC/USDT',
  'ETH/USDT',
  'BNB/USDT',
  'SOL/USDT',
  'XRP/USDT'
])

const tradingForm = reactive<TradingForm>({
  symbol: 'BTC/USDT',
  type: 'buy',
  orderType: 'limit', // 改为限价单
  amount: 0.001,
  price: 109612.95 // 设置默认限价
})

const positions = computed(() => currentExchange.value.positions)
const recentOrders = computed(() => currentExchange.value.orders.slice(0, 10)) // 只显示最近10个订单

const canSubmitOrder = computed(() => {
  return currentExchange.value.id && tradingForm.symbol && tradingForm.amount > 0 && 
         (tradingForm.orderType === 'market' || (tradingForm.price && tradingForm.price > 0))
})

const dialogTitle = computed(() => {
  switch (dialogMode.value) {
    case 'add':
      return '添加交易所'
    case 'edit':
      return '编辑交易所'
    case 'connect':
      return '连接交易所'
    default:
      return '交易所配置'
  }
})

const canTestConnection = computed(() => {
  return exchangeForm.exchange && exchangeForm.apiKey && exchangeForm.apiSecret &&
         (exchangeForm.exchange !== 'okx' || exchangeForm.passphrase)
})

const canSaveExchange = computed(() => {
  return canTestConnection.value && connectionStatus.value === 'success' && exchangeForm.name
})

// 生命周期钩子
onMounted(async () => {
  await loadExchanges()
})

// 加载交易所列表
const loadExchanges = async () => {
  try {
    const response = await exchangeApi.getAccounts()
    exchanges.value = response.data.map((account: any) => ({
      id: account.id, // 使用数据库记录ID
      accountId: account.accountId, // 交易所实例ID
      name: account.name,
      exchange: account.exchange,
      connected: account.syncStatus === 'connected',
      status: account.syncStatus === 'connected' ? 'connected' : 'disconnected',
      totalAssets: account.balance || 0,
      availableBalance: account.balance || 0,
      frozenBalance: 0,
      dailyPnL: 0,
      dailyChange: 0,
      availableBalancePercent: 100,
      balances: [],
      positions: [],
      orders: [],
      getBalanceByAsset: function(asset: string) {
        return 0 // 暂时返回0，后续从API获取真实数据
      }
    }))
    
    // 如果有交易所，选择第一个
    if (exchanges.value.length > 0) {
      activeExchange.value = exchanges.value[0].id
    }
  } catch (error) {
    console.error('加载交易所列表失败:', error)
    ElMessage.error('加载交易所列表失败')
  }
}

// 切换交易所
const switchExchange = (exchangeId: string) => {
  activeExchange.value = exchangeId
}

// 显示添加交易所对话框
const showAddExchangeDialog = () => {
  dialogMode.value = 'add'
  resetExchangeForm()
  exchangeDialogVisible.value = true
}

// 显示连接对话框
const showConnectDialog = (exchange: Exchange) => {
  dialogMode.value = 'connect'
  editingExchange.value = exchange
  resetExchangeForm()
  exchangeDialogVisible.value = true
}

// 重新连接交易所
const reconnectExchange = async (exchange: Exchange) => {
  try {
    await exchangeApi.connectAccount(exchange.id)
    updateExchangeStatus(exchange.id, 'connected')
    ElMessage.success('交易所重新连接成功')
  } catch (error) {
    updateExchangeStatus(exchange.id, 'error')
    ElMessage.error('重新连接失败: ' + error.message)
  }
}

// 断开交易所连接
const disconnectExchange = async (exchange: Exchange) => {
  try {
    await ElMessageBox.confirm(
      `确定要断开 ${exchange.name} 的连接吗？`,
      '确认断开连接',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await exchangeApi.disconnectAccount(exchange.id)
    updateExchangeStatus(exchange.id, 'disconnected')
    ElMessage.success('已断开连接')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('断开连接失败: ' + error.message)
    }
  }
}

// 测试连接
const testConnection = async () => {
  if (!exchangeFormRef.value) return
  
  try {
    await exchangeFormRef.value.validate()
    testingConnection.value = true
    connectionStatus.value = 'testing'
    connectionError.value = ''
    
    const testData = {
      exchange: exchangeForm.exchange,
      apiKey: exchangeForm.apiKey,
      apiSecret: exchangeForm.apiSecret,
      passphrase: exchangeForm.passphrase,
      testnet: exchangeForm.testnet
    }
    
    await exchangeApi.testConnectionConfig(testData)
    connectionStatus.value = 'success'
    ElMessage.success('连接测试成功')
  } catch (error) {
    connectionStatus.value = 'error'
    connectionError.value = error.message || '连接测试失败'
    ElMessage.error('连接测试失败: ' + connectionError.value)
  } finally {
    testingConnection.value = false
  }
}

// 保存交易所
const saveExchange = async () => {
  if (!exchangeFormRef.value) return
  
  try {
    await exchangeFormRef.value.validate()
    savingExchange.value = true
    
    const saveData = {
      name: exchangeForm.name,
      exchange: exchangeForm.exchange,
      type: exchangeForm.testnet ? 'demo' : 'live',
      apiKey: exchangeForm.apiKey,
      apiSecret: exchangeForm.apiSecret,
      passphrase: exchangeForm.passphrase,
      testnet: exchangeForm.testnet
    }
    
    if (dialogMode.value === 'add') {
      const response = await exchangeApi.createAccount(saveData)
      const newExchange = {
        id: response.data.id,
        name: saveData.name,
        exchange: saveData.exchange,
        connected: false,
        status: 'disconnected',
        totalAssets: 0,
        availableBalance: 0,
        frozenBalance: 0,
        dailyPnL: 0,
        dailyChange: 0,
        availableBalancePercent: 100,
        balances: [],
        positions: [],
        orders: [],
        getBalanceByAsset: function(asset: string) {
          return 0
        }
      }
      exchanges.value.push(newExchange)
      ElMessage.success('交易所添加成功')
    }
    
    exchangeDialogVisible.value = false
    resetExchangeForm()
  } catch (error) {
    ElMessage.error('保存失败: ' + error.message)
  } finally {
    savingExchange.value = false
  }
}

// 重置表单
const resetExchangeForm = () => {
  Object.assign(exchangeForm, {
    exchange: 'bybit',
    name: '',
    apiKey: '',
    apiSecret: '',
    passphrase: '',
    testnet: true
  })
  connectionStatus.value = 'idle'
  connectionError.value = ''
  editingExchange.value = null
}

// 更新交易所状态
const updateExchangeStatus = (exchangeId: string, status: 'connected' | 'disconnected' | 'error') => {
  const exchange = exchanges.value.find(ex => ex.id === exchangeId)
  if (exchange) {
    exchange.status = status
    exchange.connected = status === 'connected'
  }
}

// 获取状态指示器
const getStatusIndicator = (status: string) => {
  switch (status) {
    case 'connected':
      return '🟢'
    case 'error':
      return '🔴'
    default:
      return '⚪'
  }
}

// 获取连接状态类型
const getConnectionStatusType = (status: string) => {
  switch (status) {
    case 'connected':
      return 'success'
    case 'error':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取连接测试状态类型
const getConnectionTestType = (status: string) => {
  switch (status) {
    case 'success':
      return 'success'
    case 'error':
      return 'danger'
    case 'testing':
      return 'warning'
    default:
      return 'info'
  }
}

// 获取连接测试状态文本
const getConnectionTestText = (status: string) => {
  switch (status) {
    case 'success':
      return '连接成功'
    case 'error':
      return '连接失败'
    case 'testing':
      return '测试中...'
    default:
      return '未测试'
  }
}

// 关闭对话框
const handleDialogClose = () => {
  exchangeDialogVisible.value = false
  resetExchangeForm()
}

// 刷新账户数据
const refreshAccountData = async () => {
  try {
    if (!currentExchange.value.id) {
      ElMessage.warning('请先选择交易所')
      return
    }
    
    // 调用余额API
    const response = await exchangeApi.getBalance(currentExchange.value.id)
    
    if (response.success && response.data) {
      // 更新当前交易所的余额信息
      const currentExchangeIndex = exchanges.value.findIndex(ex => ex.id === activeExchange.value)
      if (currentExchangeIndex !== -1) {
        const exchange = exchanges.value[currentExchangeIndex]
        
        // 计算总资产和可用余额
        const totalAssets = response.data.reduce((sum, balance) => sum + (balance.valueInUSD || 0), 0)
        const availableBalance = response.data.reduce((sum, balance) => sum + (balance.free || 0), 0)
        
        // 更新交易所数据
        exchange.totalAssets = totalAssets
        exchange.availableBalance = availableBalance
        exchange.balances = response.data
        
        console.log('✅ 余额刷新成功:', {
          totalAssets,
          availableBalance,
          balances: response.data
        })
      }
      
      ElMessage.success('账户余额已刷新')
    } else {
      throw new Error(response.message || '获取余额失败')
    }
  } catch (error) {
    console.error('刷新账户数据失败:', error)
    ElMessage.error('刷新失败: ' + error.message)
  }
}

const handleExchangeChange = (tab: any) => {
  console.log('交易所切换到:', tab.props.name)
  // 这里可以添加切换交易所时的数据加载逻辑
}

const addExchange = () => {
  ElMessage.info('添加交易所功能开发中')
}

const openSettings = () => {
  ElMessage.info('设置功能开发中')
}

const getConnectionStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    connected: '已连接',
    disconnected: '未连接',
    error: '连接错误'
  }
  return statusMap[status] || '未知'
}

const refreshData = () => {
  ElMessage.success('数据已刷新')
}

const refreshPositions = async () => {
  try {
    if (!currentExchange.value.id) {
      ElMessage.warning('请先选择交易所')
      return
    }
    
    // 这里可以调用获取持仓的API
    // const response = await getPositions(currentExchange.value.id)
    ElMessage.success('持仓数据已刷新')
  } catch (error) {
    ElMessage.error('刷新持仓失败')
  }
}

const refreshOrders = async () => {
  try {
    if (!currentExchange.value.id) {
      ElMessage.warning('请先选择交易所')
      return
    }
    
    // 这里可以调用获取订单的API
    // const response = await getOrders({ accountId: currentExchange.value.id })
    ElMessage.success('订单数据已刷新')
  } catch (error) {
    ElMessage.error('刷新订单失败')
  }
}

const exportPositions = () => {
  ElMessage.info('导出持仓功能开发中')
}

const viewAllOrders = () => {
  ElMessage.info('查看全部订单功能开发中')
}

const submitOrder = async () => {
  if (!currentExchange.value.id) {
    ElMessage.warning('请先选择交易所')
    return
  }
  
  if (!currentExchange.value.connected) {
    ElMessage.warning('交易所未连接，请先连接交易所')
    return
  }
  
  submitting.value = true
  
  try {
    // 构建订单数据
    const orderData = {
      accountId: currentExchange.value.id, // 使用数据库记录ID
      symbol: tradingForm.symbol,
      type: tradingForm.orderType,
      side: tradingForm.type,
      quantity: tradingForm.amount,
      price: tradingForm.orderType === 'limit' ? tradingForm.price : undefined,
      timeInForce: 'gtc' // Good Till Cancel
    }
    
    console.log('提交订单数据:', orderData)
    
    // 显示确认对话框
    const orderTypeText = tradingForm.orderType === 'market' ? '市价' : `限价 ${tradingForm.price}`
    const totalValue = tradingForm.orderType === 'limit' ? (tradingForm.amount * tradingForm.price).toFixed(2) : '市价'
    
    await ElMessageBox.confirm(
      `确认要${tradingForm.type === 'buy' ? '买入' : '卖出'} ${tradingForm.amount} ${tradingForm.symbol} 吗？\n\n` +
      `订单类型: ${orderTypeText}\n` +
      `数量: ${tradingForm.amount} BTC\n` +
      `价格: ${tradingForm.orderType === 'limit' ? tradingForm.price + ' USDT' : '市价'}\n` +
      `预估价值: ${totalValue} USDT`,
      '确认下单',
      {
        confirmButtonText: '确认下单',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: false
      }
    )
    
    // 调用真实API下单
    const response = await placeOrder(orderData)
    console.log('下单响应:', response)
    
    // 根据API拦截器的逻辑，response可能已经解包了
    const orderResponse = response.data || response
    
    // 创建新订单对象
    const newOrder: Order = {
      id: orderResponse.orderId || Date.now().toString(),
      symbol: tradingForm.symbol,
      type: tradingForm.type,
      orderType: tradingForm.orderType,
      amount: tradingForm.amount,
      price: tradingForm.price,
      status: orderResponse.status || 'pending',
      createdAt: new Date()
    }
    
    // 添加到当前交易所的订单列表
    const currentExchangeIndex = exchanges.value.findIndex(ex => ex.id === activeExchange.value)
    if (currentExchangeIndex !== -1) {
      exchanges.value[currentExchangeIndex].orders.unshift(newOrder)
    }
    
    ElMessage.success(`${currentExchange.value.name} ${tradingForm.type === 'buy' ? '买入' : '卖出'}订单已提交`)
    resetForm()
    
    // 自动刷新订单列表
    setTimeout(() => {
      refreshOrders()
    }, 1000)
    
  } catch (error: any) {
    if (error === 'cancel') {
      // 用户取消操作
      console.log('用户取消下单')
    } else {
      console.error('订单提交失败:', error)
      ElMessage.error(`订单提交失败: ${error.message || '网络错误'}`)
    }
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  tradingForm.symbol = 'BTC/USDT'
  tradingForm.type = 'buy'
  tradingForm.orderType = 'limit' // 改为限价单
  tradingForm.amount = 0.001
  tradingForm.price = 109612.95 // 设置默认限价
}

const closePosition = async (position: Position) => {
  try {
    await ElMessageBox.confirm(
      `确定要平仓 ${position.symbol} 吗？`,
      '确认平仓',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 从当前交易所的持仓中移除
    const currentExchangeIndex = exchanges.value.findIndex(ex => ex.id === activeExchange.value)
    if (currentExchangeIndex !== -1) {
      exchanges.value[currentExchangeIndex].positions = 
        exchanges.value[currentExchangeIndex].positions.filter(p => p.symbol !== position.symbol)
    }
    
    ElMessage.success(`${currentExchange.value.name} ${position.symbol} 已平仓`)
  } catch {
    // 用户取消操作
  }
}

const cancelOrder = async (order: Order) => {
  try {
    await ElMessageBox.confirm(
      `确定要撤销这个订单吗？\n订单: ${order.symbol} ${order.type === 'buy' ? '买入' : '卖出'} ${order.amount}`,
      '确认撤销',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 检查订单是否可以撤销
    if (order.status !== 'pending') {
      ElMessage.warning('只有待成交的订单才能撤销')
      return
    }
    
    try {
      // 调用撤销订单API
      // const response = await cancelOrder(order.id)
      
      // 从当前交易所的订单中更新状态
      const currentExchangeIndex = exchanges.value.findIndex(ex => ex.id === activeExchange.value)
      if (currentExchangeIndex !== -1) {
        const orderIndex = exchanges.value[currentExchangeIndex].orders.findIndex(o => o.id === order.id)
        if (orderIndex !== -1) {
          exchanges.value[currentExchangeIndex].orders[orderIndex].status = 'cancelled'
        }
      }
      
      ElMessage.success(`${currentExchange.value.name} 订单已撤销`)
      
      // 自动刷新订单列表
      setTimeout(() => {
        refreshOrders()
      }, 500)
      
    } catch (error: any) {
      ElMessage.error(`撤销订单失败: ${error.message || '网络错误'}`)
    }
    
  } catch (error) {
    // 用户取消操作
    if (error !== 'cancel') {
      console.error('撤销订单失败:', error)
    }
  }
}

const getOrderTypeType = (orderType: string) => {
  const typeMap: Record<string, string> = {
    market: 'success',
    limit: 'primary',
    stop: 'warning',
    take_profit: 'info'
  }
  return typeMap[orderType] || 'info'
}

const getOrderTypeText = (orderType: string) => {
  const typeMap: Record<string, string> = {
    market: '市价',
    limit: '限价',
    stop: '止损',
    take_profit: '止盈'
  }
  return typeMap[orderType] || '未知'
}

const getOrderStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: 'warning',
    filled: 'success',
    executed: 'success',
    cancelled: 'info',
    rejected: 'danger',
    failed: 'danger',
    partially_filled: 'primary'
  }
  return statusMap[status] || 'info'
}

const getOrderStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待成交',
    filled: '已成交',
    executed: '已执行',
    cancelled: '已撤销',
    rejected: '已拒绝',
    failed: '失败',
    partially_filled: '部分成交'
  }
  return statusMap[status] || '未知'
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount)
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
</script>

<style scoped>
.trading-panel {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-header h2 {
  margin: 0;
  color: var(--primary-text);
  font-size: 18px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.trading-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .trading-panel {
    padding: 12px;
  }
  
  .page-header {
    margin-bottom: 12px;
  }
  
  .trading-content {
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .trading-panel {
    padding: 8px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 8px;
  }
  
  .page-header h2 {
    font-size: 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .trading-content {
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .trading-panel {
    padding: 4px;
  }
  
  .page-header h2 {
    font-size: 14px;
  }
  
  .header-actions .el-button {
    padding: 6px 12px;
    font-size: 12px;
  }
}

/* 交易所选项卡 */
.exchange-tabs {
  margin-bottom: 16px;
}

.exchange-tabs-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.exchange-tab {
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  min-width: 180px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 响应式交易所选项卡 */
@media (max-width: 768px) {
  .exchange-tabs {
    margin-bottom: 12px;
  }
  
  .exchange-tabs-container {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 8px;
  }
  
  .exchange-tab {
    min-width: 140px;
    padding: 12px;
  }
  
  .exchange-name {
    font-size: 14px;
  }
  
  .balance {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .exchange-tabs-container {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  
  .exchange-tab {
    min-width: auto;
    padding: 10px;
  }
  
  .exchange-tab.add-exchange {
    min-height: 60px;
  }
}

.exchange-tab:hover {
  border-color: var(--brand-secondary);
  background: var(--hover-bg);
}

.exchange-tab.active {
  border-color: var(--brand-secondary);
  background: var(--brand-secondary);
  color: var(--primary-bg);
}

.exchange-tab.add-exchange {
  border: 2px dashed var(--border-color);
  background: transparent;
  justify-content: center;
  align-items: center;
  color: var(--muted-text);
}

.exchange-tab.add-exchange:hover {
  border-color: var(--brand-secondary);
  color: var(--brand-secondary);
}

.exchange-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.exchange-name {
  font-weight: 600;
  font-size: 16px;
}

.exchange-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  font-size: 12px;
  font-weight: bold;
}

.status-indicator.connected {
  color: var(--positive-color);
}

.status-indicator.error {
  color: var(--negative-color);
}

.status-indicator.disconnected {
  color: var(--muted-text);
}

.balance {
  font-size: 14px;
  font-weight: 500;
  opacity: 0.8;
}

.exchange-actions {
  display: flex;
  justify-content: flex-end;
}

/* 连接测试状态 */
.connection-test-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.connection-error {
  color: var(--negative-color);
  font-size: 12px;
  padding: 8px;
  background: rgba(255, 51, 51, 0.1);
  border-radius: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 资产明细 */
.asset-details {
  margin-top: 16px;
  padding: 12px;
  background: var(--secondary-bg);
  border-radius: 6px;
  display: flex;
  gap: 20px;
}

/* 响应式资产明细 */
@media (max-width: 768px) {
  .asset-details {
    flex-direction: column;
    gap: 12px;
    padding: 10px;
  }
  
  .detail-item {
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .asset-details {
    gap: 8px;
    padding: 8px;
  }
  
  .detail-item .label,
  .detail-item .value {
    font-size: 12px;
  }
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-item .label {
  font-size: 14px;
  color: var(--muted-text);
}

.detail-item .value {
  font-size: 14px;
  font-weight: 500;
  color: var(--secondary-text);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

/* 响应式区域头部 */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .section-header .header-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .section-header {
    margin-bottom: 8px;
  }
  
  .section-header h3 {
    font-size: 14px;
  }
  
  .section-header .header-actions {
    gap: 4px;
  }
}

.section-header h3 {
  margin: 0;
  color: var(--primary-text);
  font-size: 16px;
  font-weight: 600;
}

/* 账户信息 */
.account-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

/* 响应式账户卡片 */
@media (max-width: 768px) {
  .account-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .account-cards {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}

.account-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.card-title {
  font-size: 12px;
  color: var(--muted-text);
  margin-bottom: 8px;
}

.card-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--secondary-text);
  margin-bottom: 4px;
}

.card-change {
  font-size: 12px;
}

.card-subtitle {
  font-size: 12px;
  color: var(--muted-text);
}

/* 交易表单 */
.trading-form {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

/* 响应式交易表单 */
@media (max-width: 768px) {
  .trading-form {
    padding: 16px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 12px;
  }
}

@media (max-width: 480px) {
  .trading-form {
    padding: 12px;
  }
  
  .form-row {
    gap: 8px;
    margin-bottom: 8px;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  color: var(--secondary-text);
  font-weight: 500;
}

.trading-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

/* 表格样式 */
.positions-table,
.orders-table {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

/* 响应式表格 */
@media (max-width: 768px) {
  .positions-table,
  .orders-table {
    font-size: 12px;
  }
  
  :deep(.el-table) {
    font-size: 12px;
  }
  
  :deep(.el-table th) {
    font-size: 11px;
    padding: 8px 4px;
  }
  
  :deep(.el-table td) {
    padding: 6px 4px;
  }
  
  :deep(.el-button--small) {
    padding: 4px 8px;
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .positions-table,
  .orders-table {
    font-size: 11px;
  }
  
  :deep(.el-table) {
    font-size: 11px;
  }
  
  :deep(.el-table th) {
    font-size: 10px;
    padding: 6px 2px;
  }
  
  :deep(.el-table td) {
    padding: 4px 2px;
  }
  
  :deep(.el-button--small) {
    padding: 3px 6px;
    font-size: 10px;
  }
  
  /* 隐藏次要列 */
  :deep(.el-table .operation-column) {
    display: none;
  }
}

/* 通用样式 */
.positive {
  color: var(--positive-color) !important;
}

.negative {
  color: var(--negative-color) !important;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-select .el-input__wrapper) {
  background: var(--card-bg);
  border-color: var(--border-color);
}

/* 响应式对话框 */
@media (max-width: 768px) {
  :deep(.el-dialog) {
    width: 90% !important;
    margin: 5vh auto !important;
  }
  
  :deep(.el-dialog__body) {
    padding: 16px;
  }
  
  :deep(.el-form-item) {
    margin-bottom: 16px;
  }
  
  :deep(.el-form-item__label) {
    font-size: 12px;
    padding-bottom: 4px;
  }
}

@media (max-width: 480px) {
  :deep(.el-dialog) {
    width: 95% !important;
    margin: 2vh auto !important;
  }
  
  :deep(.el-dialog__body) {
    padding: 12px;
  }
  
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
  
  :deep(.el-form-item__label) {
    font-size: 11px;
  }
  
  :deep(.el-dialog__footer) {
    padding: 12px 16px;
  }
  
  :deep(.dialog-footer) {
    flex-direction: column;
    gap: 8px;
  }
  
  :deep(.dialog-footer .el-button) {
    width: 100%;
  }
}

:deep(.el-input__wrapper) {
  background: var(--card-bg);
  border-color: var(--border-color);
}

:deep(.el-input__inner) {
  color: var(--secondary-text);
}

:deep(.el-radio-group) {
  background: var(--card-bg);
}

:deep(.el-radio-button__inner) {
  background: var(--card-bg);
  border-color: var(--border-color);
  color: var(--secondary-text);
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: var(--brand-secondary);
  border-color: var(--brand-secondary);
  color: var(--primary-bg);
}

:deep(.el-tabs) {
  background: var(--card-bg);
  border-radius: 8px;
}

:deep(.el-tabs__header) {
  margin: 0;
  border-bottom: 1px solid var(--border-color);
}

:deep(.el-tabs__nav-wrap::after) {
  background-color: var(--border-color);
}

:deep(.el-tabs__item) {
  color: var(--secondary-text);
  border-bottom: 2px solid transparent;
}

:deep(.el-tabs__item:hover) {
  color: var(--primary-text);
}

:deep(.el-tabs__item.is-active) {
  color: var(--brand-secondary);
  border-bottom-color: var(--brand-secondary);
}

:deep(.el-tabs__content) {
  padding: 0;
}

:deep(.el-tab-pane) {
  padding: 0;
}

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

:deep(.el-button) {
  background: var(--card-bg);
  border-color: var(--border-color);
  color: var(--secondary-text);
  transition: all 0.2s ease;
}

:deep(.el-button:hover) {
  background: var(--hover-bg);
  border-color: var(--primary-text);
  color: var(--primary-text);
}

/* 移动端按钮优化 */
@media (max-width: 768px) {
  :deep(.el-button) {
    padding: 8px 16px;
    font-size: 13px;
  }
  
  :deep(.el-button--small) {
    padding: 6px 12px;
    font-size: 12px;
  }
  
  :deep(.el-button--large) {
    padding: 12px 20px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  :deep(.el-button) {
    padding: 10px 14px;
    font-size: 12px;
    min-height: 40px;
  }
  
  :deep(.el-button--small) {
    padding: 6px 10px;
    font-size: 11px;
    min-height: 32px;
  }
  
  :deep(.el-button--large) {
    padding: 14px 18px;
    font-size: 13px;
    min-height: 48px;
  }
  
  /* 触摸友好的最小点击区域 */
  :deep(.el-button),
  :deep(.el-radio-button__inner),
  :deep(.el-select .el-input__wrapper) {
    min-height: 44px;
  }
}

:deep(.el-button--success) {
  background: var(--positive-color);
  border-color: var(--positive-color);
  color: var(--primary-bg);
}

:deep(.el-button--success:hover) {
  background: var(--brand-secondary);
  border-color: var(--brand-secondary);
  color: var(--primary-bg);
}

:deep(.el-tag) {
  border: none;
}

:deep(.el-tag--success) {
  background: rgba(0, 255, 136, 0.1);
  color: var(--positive-color);
}

:deep(.el-tag--danger) {
  background: rgba(255, 51, 51, 0.1);
  color: var(--negative-color);
}

:deep(.el-tag--warning) {
  background: rgba(255, 170, 0, 0.1);
  color: var(--warning-color);
}

:deep(.el-tag--info) {
  background: rgba(0, 170, 255, 0.1);
  color: var(--info-color);
}
</style>