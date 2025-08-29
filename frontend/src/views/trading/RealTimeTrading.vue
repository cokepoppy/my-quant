<template>
  <div class="real-time-trading">
    <!-- 顶部状态栏 -->
    <div class="trading-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon class="title-icon"><Lightning /></el-icon>
          实时交易
        </h1>
        <div class="subtitle">多交易所统一交易界面</div>
      </div>
      <div class="header-right">
        <div class="market-status">
          <el-tag :type="marketStatus.type" size="large">
            {{ marketStatus.text }}
          </el-tag>
          <span class="market-time">{{ marketTime }}</span>
        </div>
      </div>
    </div>

    <el-row :gutter="20">
      <!-- 左侧面板 -->
      <el-col :span="6">
        <!-- 账户选择 -->
        <el-card class="account-card glass-effect">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Wallet /></el-icon>
                交易账户
              </span>
              <el-button type="primary" size="small" @click="showAddAccount = true" class="add-account-btn">
                <el-icon><Plus /></el-icon>
                添加账户
              </el-button>
            </div>
          </template>
          
          <el-select v-model="selectedAccountId" placeholder="选择账户" @change="onAccountChange" class="account-selector">
            <el-option
              v-for="account in accounts"
              :key="account.id"
              :label="account.name"
              :value="account.id"
            >
              <div class="account-option">
                <div class="account-info">
                  <span class="account-name">{{ account.name }}</span>
                  <span class="account-exchange">{{ getExchangeName(account.exchange) }}</span>
                </div>
                <el-tag size="small" :type="account.syncStatus === 'connected' ? 'success' : 'danger'" class="status-tag">
                  {{ getStatusText(account.syncStatus) }}
                </el-tag>
              </div>
            </el-option>
          </el-select>

          <div v-if="selectedAccount" class="account-details">
            <div class="detail-item">
              <span class="label">交易所:</span>
              <span class="value exchange-badge">
                <el-icon><component :is="getExchangeIcon(selectedAccount.exchange)" /></el-icon>
                {{ getExchangeName(selectedAccount.exchange) }}
              </span>
            </div>
            <div class="detail-item">
              <span class="label">状态:</span>
              <el-tag :type="selectedAccount.syncStatus === 'connected' ? 'success' : 'danger'" size="small">
                {{ getStatusText(selectedAccount.syncStatus) }}
              </el-tag>
            </div>
            <div class="detail-item">
              <span class="label">最后同步:</span>
              <span class="value">{{ formatTime(selectedAccount.lastSyncAt) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">网络:</span>
              <el-tag :type="selectedAccount.testnet ? 'warning' : 'primary'" size="small">
                {{ selectedAccount.testnet ? '测试网' : '主网' }}
              </el-tag>
            </div>
          </div>
        </el-card>

        <!-- 余额信息 -->
        <el-card class="balance-card glass-effect">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Money /></el-icon>
                账户余额
              </span>
              <el-button type="primary" size="small" @click="refreshBalance" class="refresh-btn">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          
          <div v-if="balances.length > 0" class="balance-list">
            <div v-for="balance in balances" :key="balance.asset" class="balance-item">
              <div class="balance-asset">{{ balance.asset }}</div>
              <div class="balance-amount">
                <div class="free">{{ balance.free.toFixed(4) }}</div>
                <div class="used">{{ balance.used.toFixed(4) }}</div>
              </div>
              <div class="balance-total">{{ balance.total.toFixed(4) }}</div>
            </div>
          </div>
          <div v-else class="empty-state">
            <el-icon><Wallet /></el-icon>
            <span>暂无余额信息</span>
          </div>
        </el-card>

        <!-- 持仓信息 -->
        <el-card class="position-card glass-effect">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><TrendCharts /></el-icon>
                当前持仓
              </span>
              <el-tag size="small" :type="positions.length > 0 ? 'success' : 'info'">
                {{ positions.length }} 个持仓
              </el-tag>
            </div>
          </template>
          
          <div v-if="positions.length > 0" class="position-list">
            <div v-for="position in positions" :key="position.symbol" class="position-item">
              <div class="position-symbol">{{ position.symbol }}</div>
              <div class="position-side" :class="position.side">
                {{ position.side === 'long' ? '做多' : '做空' }}
              </div>
              <div class="position-size">{{ position.size }}</div>
              <div class="position-pnl" :class="position.pnl >= 0 ? 'positive' : 'negative'">
                {{ position.pnl.toFixed(2) }}
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <el-icon><TrendCharts /></el-icon>
            <span>暂无持仓</span>
          </div>
        </el-card>
      </el-col>

      <!-- 中间面板 - 交易界面 -->
      <el-col :span="12">
        <!-- 交易对选择 -->
        <el-card class="trading-card glass-effect trading-main">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Monitor /></el-icon>
                实时交易
              </span>
              <div class="trading-controls">
                <el-input
                  v-model="searchSymbol"
                  placeholder="搜索交易对"
                  style="width: 200px"
                  clearable
                  class="symbol-search"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
                <el-button type="primary" @click="subscribeSymbol" class="subscribe-btn">
                  <el-icon><Connection /></el-icon>
                  订阅
                </el-button>
              </div>
            </div>
          </template>

          <!-- 交易对信息 -->
          <div v-if="currentSymbol" class="symbol-info">
            <div class="symbol-header">
              <h3>{{ currentSymbol }}</h3>
              <div class="price-info">
                <div class="current-price" :class="priceChange >= 0 ? 'positive' : 'negative'">
                  {{ currentPrice }}
                </div>
                <div class="price-change" :class="priceChange >= 0 ? 'positive' : 'negative'">
                  {{ priceChange >= 0 ? '+' : '' }}{{ priceChange.toFixed(2) }}%
                </div>
              </div>
            </div>

            <!-- 买卖盘 -->
            <div class="orderbook">
              <div class="orderbook-sells">
                <div v-for="order in sellOrders.slice(0, 5)" :key="order[0]" class="orderbook-row sell">
                  <span class="price">{{ order[0] }}</span>
                  <span class="amount">{{ order[1] }}</span>
                </div>
              </div>
              <div class="orderbook-buys">
                <div v-for="order in buyOrders.slice(0, 5)" :key="order[0]" class="orderbook-row buy">
                  <span class="price">{{ order[0] }}</span>
                  <span class="amount">{{ order[1] }}</span>
                </div>
              </div>
            </div>

            <!-- 交易表单 -->
            <div class="trading-form">
              <el-tabs v-model="activeTab">
                <el-tab-pane label="买入" name="buy">
                  <el-form :model="buyForm" label-width="80px">
                    <el-form-item label="价格">
                      <el-input-number
                        v-model="buyForm.price"
                        :precision="8"
                        :step="0.00000001"
                        :min="0"
                      />
                    </el-form-item>
                    <el-form-item label="数量">
                      <el-input-number
                        v-model="buyForm.amount"
                        :precision="8"
                        :step="0.00000001"
                        :min="0"
                      />
                    </el-form-item>
                    <el-form-item label="类型">
                      <el-select v-model="buyForm.type">
                        <el-option label="限价单" value="limit" />
                        <el-option label="市价单" value="market" />
                      </el-select>
                    </el-form-item>
                    <el-form-item>
                      <el-button type="success" @click="placeOrder('buy')">买入</el-button>
                    </el-form-item>
                  </el-form>
                </el-tab-pane>
                <el-tab-pane label="卖出" name="sell">
                  <el-form :model="sellForm" label-width="80px">
                    <el-form-item label="价格">
                      <el-input-number
                        v-model="sellForm.price"
                        :precision="8"
                        :step="0.00000001"
                        :min="0"
                      />
                    </el-form-item>
                    <el-form-item label="数量">
                      <el-input-number
                        v-model="sellForm.amount"
                        :precision="8"
                        :step="0.00000001"
                        :min="0"
                      />
                    </el-form-item>
                    <el-form-item label="类型">
                      <el-select v-model="sellForm.type">
                        <el-option label="限价单" value="limit" />
                        <el-option label="市价单" value="market" />
                      </el-select>
                    </el-form-item>
                    <el-form-item>
                      <el-button type="danger" @click="placeOrder('sell')">卖出</el-button>
                    </el-form-item>
                  </el-form>
                </el-tab-pane>
              </el-tabs>
            </div>
          </div>
          <div v-else class="empty-state">
            请选择交易对
          </div>
        </el-card>

        <!-- 订单列表 -->
        <el-card class="orders-card glass-effect">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><List /></el-icon>
                当前订单
              </span>
              <el-button type="primary" size="small" @click="refreshOrders" class="refresh-btn">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>

          <div v-if="orders.length > 0" class="orders-list">
            <div v-for="order in orders" :key="order.id" class="order-item">
              <div class="order-info">
                <div class="order-symbol">{{ order.symbol }}</div>
                <div class="order-side" :class="order.side">
                  {{ order.side === 'buy' ? '买入' : '卖出' }}
                </div>
                <div class="order-type">{{ order.type }}</div>
                <div class="order-price">{{ order.price }}</div>
                <div class="order-amount">{{ order.amount }}</div>
                <div class="order-status">
                  <el-tag size="small" :type="getOrderStatusType(order.status)">
                    {{ order.status }}
                  </el-tag>
                </div>
              </div>
              <div class="order-actions">
                <el-button
                  v-if="order.status === 'open'"
                  type="danger"
                  size="small"
                  @click="cancelOrder(order)"
                >
                  取消
                </el-button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            暂无订单
          </div>
        </el-card>
      </el-col>

      <!-- 右侧面板 - 图表和深度图 -->
      <el-col :span="6">
        <!-- 价格图表 -->
        <el-card class="chart-card glass-effect">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><DataLine /></el-icon>
                价格走势
              </span>
              <el-select v-model="chartTimeframe" size="small" style="width: 100px" class="timeframe-select">
                <el-option label="1分钟" value="1m" />
                <el-option label="5分钟" value="5m" />
                <el-option label="15分钟" value="15m" />
                <el-option label="1小时" value="1h" />
                <el-option label="4小时" value="4h" />
                <el-option label="1天" value="1d" />
              </el-select>
            </div>
          </template>
          
          <div class="chart-container">
            <canvas ref="priceChart"></canvas>
          </div>
        </el-card>

        <!-- 深度图 -->
        <el-card class="depth-card glass-effect">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Histogram /></el-icon>
                市场深度
              </span>
            </div>
          </template>
          
          <div class="depth-container">
            <canvas ref="depthChart"></canvas>
          </div>
        </el-card>

        <!-- 最近交易 -->
        <el-card class="trades-card glass-effect">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Timer /></el-icon>
                最近交易
              </span>
              <el-tag size="small" type="info">{{ recentTrades.length }} 条</el-tag>
            </div>
          </template>
          
          <div class="trades-list">
            <div v-for="trade in recentTrades" :key="trade.id" class="trade-item">
              <div class="trade-time">{{ formatTime(trade.timestamp) }}</div>
              <div class="trade-side" :class="trade.side">
                {{ trade.side === 'buy' ? '买' : '卖' }}
              </div>
              <div class="trade-price">{{ trade.price }}</div>
              <div class="trade-amount">{{ trade.amount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 添加账户对话框 -->
    <el-dialog v-model="showAddAccount" title="添加交易账户" width="500px">
      <el-form :model="newAccount" label-width="120px">
        <el-form-item label="账户名称">
          <el-input v-model="newAccount.name" />
        </el-form-item>
        <el-form-item label="交易所">
          <el-select v-model="newAccount.exchange">
            <el-option label="币安" value="binance" />
            <el-option label="OKX" value="okx" />
          </el-select>
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="newAccount.apiKey" show-password />
        </el-form-item>
        <el-form-item label="API Secret">
          <el-input v-model="newAccount.apiSecret" show-password />
        </el-form-item>
        <el-form-item v-if="newAccount.exchange === 'okx'" label="Passphrase">
          <el-input v-model="newAccount.passphrase" show-password />
        </el-form-item>
        <el-form-item label="测试网络">
          <el-switch v-model="newAccount.testnet" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddAccount = false">取消</el-button>
        <el-button type="primary" @click="addAccount">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { exchangeApi } from '@/api/exchange'
import { useAuthStore } from '@/stores/auth'
import io from 'socket.io-client'

const authStore = useAuthStore()

// 响应式数据
const selectedAccountId = ref('')
const accounts = ref([])
const selectedAccount = ref(null)
const balances = ref([])
const positions = ref([])
const orders = ref([])
const currentSymbol = ref('')
const currentPrice = ref(0)
const priceChange = ref(0)
const buyOrders = ref([])
const sellOrders = ref([])
const recentTrades = ref([])
const showAddAccount = ref(false)
const searchSymbol = ref('')
const activeTab = ref('buy')
const chartTimeframe = ref('1h')

// 表单数据
const buyForm = reactive({
  price: 0,
  amount: 0,
  type: 'limit'
})

const sellForm = reactive({
  price: 0,
  amount: 0,
  type: 'limit'
})

const newAccount = reactive({
  name: '',
  exchange: 'binance',
  apiKey: '',
  apiSecret: '',
  passphrase: '',
  testnet: false
})

// WebSocket 连接
let socket = null

// 初始化
onMounted(async () => {
  await loadAccounts()
  initializeWebSocket()
})

onUnmounted(() => {
  if (socket) {
    socket.disconnect()
  }
})

// 加载账户列表
const loadAccounts = async () => {
  try {
    const response = await exchangeApi.getAccounts()
    accounts.value = response.data
  } catch (error) {
    ElMessage.error('加载账户失败')
  }
}

// 账户变更处理
const onAccountChange = async (accountId) => {
  selectedAccountId.value = accountId
  selectedAccount.value = accounts.value.find(a => a.id === accountId)
  
  if (selectedAccount.value) {
    await loadAccountData()
    connectToAccount(accountId)
  }
}

// 加载账户数据
const loadAccountData = async () => {
  try {
    const [balanceRes, positionRes, orderRes] = await Promise.all([
      exchangeApi.getBalance(selectedAccountId.value),
      exchangeApi.getPositions(selectedAccountId.value),
      exchangeApi.getOrders(selectedAccountId.value)
    ])
    
    balances.value = balanceRes.data
    positions.value = positionRes.data
    orders.value = orderRes.data
  } catch (error) {
    ElMessage.error('加载账户数据失败')
  }
}

// 初始化 WebSocket
const initializeWebSocket = () => {
  socket = io(import.meta.env.VITE_WS_URL, {
    auth: {
      token: authStore.token
    }
  })

  socket.on('connect', () => {
    console.log('WebSocket connected')
  })

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected')
  })

  // 监听实时数据
  socket.on('balance:update', (data) => {
    if (data.accountId === selectedAccountId.value) {
      balances.value = data.balances
    }
  })

  socket.on('position:update', (data) => {
    if (data.accountId === selectedAccountId.value) {
      positions.value = data.positions
    }
  })

  socket.on('order:update', (data) => {
    if (data.accountId === selectedAccountId.value) {
      orders.value = data.orders
    }
  })

  socket.on('ticker:update', (data) => {
    if (data.symbol === currentSymbol.value) {
      currentPrice.value = data.ticker.last
      priceChange.value = data.ticker.changePercent
    }
  })

  socket.on('orderbook:update', (data) => {
    if (data.symbol === currentSymbol.value) {
      updateOrderbook(data.orderbook)
    }
  })

  socket.on('trade:update', (data) => {
    if (data.symbol === currentSymbol.value) {
      updateRecentTrades(data.trade)
    }
  })
}

// 连接到账户
const connectToAccount = (accountId) => {
  if (socket) {
    socket.emit('subscribe:account', { accountId })
  }
}

// 订阅交易对
const subscribeSymbol = () => {
  if (!searchSymbol.value || !selectedAccountId.value) {
    ElMessage.warning('请选择账户和输入交易对')
    return
  }
  
  currentSymbol.value = searchSymbol.value
  
  if (socket) {
    socket.emit('subscribe:symbol', {
      accountId: selectedAccountId.value,
      symbol: currentSymbol.value
    })
  }
  
  // 加载历史数据
  loadSymbolData()
}

// 加载交易对数据
const loadSymbolData = async () => {
  try {
    const [tickerRes, orderbookRes, tradesRes] = await Promise.all([
      exchangeApi.getTicker(selectedAccountId.value, currentSymbol.value),
      exchangeApi.getOrderBook(selectedAccountId.value, currentSymbol.value),
      exchangeApi.getTrades(selectedAccountId.value, currentSymbol.value)
    ])
    
    currentPrice.value = tickerRes.data.last
    priceChange.value = tickerRes.data.changePercent
    updateOrderbook(orderbookRes.data)
    recentTrades.value = tradesRes.data.slice(0, 20)
  } catch (error) {
    ElMessage.error('加载交易对数据失败')
  }
}

// 更新买卖盘
const updateOrderbook = (orderbook) => {
  buyOrders.value = orderbook.bids
  sellOrders.value = orderbook.asks
}

// 更新最近交易
const updateRecentTrades = (trade) => {
  recentTrades.value.unshift(trade)
  if (recentTrades.value.length > 50) {
    recentTrades.value = recentTrades.value.slice(0, 50)
  }
}

// 下单
const placeOrder = async (side) => {
  if (!selectedAccountId.value || !currentSymbol.value) {
    ElMessage.warning('请选择账户和交易对')
    return
  }

  const formData = side === 'buy' ? buyForm : sellForm
  
  try {
    const orderData = {
      symbol: currentSymbol.value,
      type: formData.type,
      side: side,
      amount: formData.amount.toString(),
      price: formData.type === 'limit' ? formData.price.toString() : undefined
    }

    if (socket) {
      socket.emit('place:order', {
        accountId: selectedAccountId.value,
        order: orderData
      })
    } else {
      await exchangeApi.placeOrder(selectedAccountId.value, orderData)
      await refreshOrders()
    }
    
    ElMessage.success('下单成功')
  } catch (error) {
    ElMessage.error('下单失败')
  }
}

// 取消订单
const cancelOrder = async (order) => {
  try {
    if (socket) {
      socket.emit('cancel:order', {
        accountId: selectedAccountId.value,
        orderId: order.id,
        symbol: order.symbol
      })
    } else {
      await exchangeApi.cancelOrder(selectedAccountId.value, order.id, order.symbol)
      await refreshOrders()
    }
    
    ElMessage.success('取消订单成功')
  } catch (error) {
    ElMessage.error('取消订单失败')
  }
}

// 刷新数据
const refreshBalance = async () => {
  await loadAccountData()
}

const refreshOrders = async () => {
  try {
    const response = await exchangeApi.getOrders(selectedAccountId.value)
    orders.value = response.data
  } catch (error) {
    ElMessage.error('刷新订单失败')
  }
}

// 添加账户
const addAccount = async () => {
  try {
    await exchangeApi.createAccount(newAccount)
    ElMessage.success('添加账户成功')
    showAddAccount.value = false
    await loadAccounts()
    
    // 重置表单
    Object.assign(newAccount, {
      name: '',
      exchange: 'binance',
      apiKey: '',
      apiSecret: '',
      passphrase: '',
      testnet: false
    })
  } catch (error) {
    ElMessage.error('添加账户失败')
  }
}

// 工具函数
const formatTime = (time) => {
  if (!time) return '从未'
  return new Date(time).toLocaleString()
}

const getOrderStatusType = (status) => {
  const statusMap = {
    'open': 'warning',
    'closed': 'success',
    'cancelled': 'info',
    'rejected': 'danger'
  }
  return statusMap[status] || 'info'
}

const getExchangeName = (exchange) => {
  const exchangeMap = {
    'binance': '币安',
    'okx': 'OKX'
  }
  return exchangeMap[exchange] || exchange
}

const getExchangeIcon = (exchange) => {
  const iconMap = {
    'binance': 'Coin',
    'okx': 'Wallet'
  }
  return iconMap[exchange] || 'Wallet'
}

const getStatusText = (status) => {
  const statusMap = {
    'connected': '已连接',
    'disconnected': '未连接',
    'connecting': '连接中',
    'error': '错误'
  }
  return statusMap[status] || status
}

// 市场状态
const marketStatus = ref({
  type: 'success',
  text: '市场开放'
})

const marketTime = ref(new Date().toLocaleTimeString())

// 更新市场时间
setInterval(() => {
  marketTime.value = new Date().toLocaleTimeString()
}, 1000)
</script>

<style scoped>
.real-time-trading {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  background: var(--bg-primary);
}

/* 顶部状态栏 */
.trading-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: var(--surface-elevated);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal) var(--ease-out);
}

.header-left .page-title {
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 24px;
  color: var(--text-secondary);
}

.subtitle {
  color: var(--text-muted);
  margin-top: 5px;
  font-size: 14px;
}

.header-right .market-status {
  display: flex;
  align-items: center;
  gap: 15px;
}

.market-time {
  color: var(--text-secondary);
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: 500;
}

/* 玻璃效果 */
.glass-effect {
  background: var(--surface-elevated);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

/* 卡片通用样式 */
.account-card,
.balance-card,
.position-card,
.trading-card,
.orders-card,
.chart-card,
.depth-card,
.trades-card {
  margin-bottom: 20px;
  border: none;
  border-radius: 20px;
  overflow: hidden;
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #2c3e50;
  font-size: 16px;
}

/* 按钮样式 */
.add-account-btn,
.refresh-btn,
.subscribe-btn {
  background: var(--btn-primary);
  border: none;
  border-radius: var(--radius-md);
  padding: 8px 16px;
  font-weight: 500;
  transition: all var(--transition-normal) var(--ease-out);
  color: white;
}

.add-account-btn:hover,
.refresh-btn:hover,
.subscribe-btn:hover {
  background: var(--btn-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

/* 账户选择器 */
.account-selector {
  width: 100%;
  margin-bottom: 20px;
}

.account-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.account-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.account-name {
  font-weight: 600;
  color: #2c3e50;
}

.account-exchange {
  font-size: 12px;
  color: #7f8c8d;
}

.status-tag {
  font-weight: 500;
}

/* 账户详情 */
.account-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-item .label {
  color: #7f8c8d;
  font-size: 14px;
}

.detail-item .value {
  color: #2c3e50;
  font-weight: 500;
}

.exchange-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(102, 126, 234, 0.1);
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
}

/* 余额列表 */
.balance-list {
  max-height: 200px;
  overflow-y: auto;
}

.balance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.balance-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px 8px;
}

.balance-asset {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
  min-width: 60px;
}

.balance-amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex: 1;
  gap: 4px;
}

.balance-amount .free {
  color: #27ae60;
  font-weight: 500;
  font-size: 13px;
}

.balance-amount .used {
  color: #e74c3c;
  font-size: 11px;
  opacity: 0.8;
}

.balance-total {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
  min-width: 80px;
  text-align: right;
}

/* 持仓列表 */
.position-list {
  max-height: 200px;
  overflow-y: auto;
}

.position-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.position-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px 8px;
}

.position-symbol {
  font-weight: 600;
  color: #2c3e50;
  font-size: 13px;
  min-width: 80px;
}

.position-side {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  min-width: 50px;
  text-align: center;
}

.position-side.long {
  background: linear-gradient(45deg, #27ae60, #2ecc71);
  color: white;
}

.position-side.short {
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  color: white;
}

.position-size {
  color: #2c3e50;
  font-size: 13px;
  min-width: 60px;
  text-align: right;
}

.position-pnl {
  font-weight: 600;
  font-size: 13px;
  min-width: 70px;
  text-align: right;
}

.position-pnl.positive {
  color: #27ae60;
}

.position-pnl.negative {
  color: #e74c3c;
}

/* 主交易区域 */
.trading-main {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.trading-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.symbol-search {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
}

/* 交易对信息 */
.symbol-info {
  margin-bottom: 25px;
}

.symbol-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
}

.symbol-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 20px;
  font-weight: 700;
}

.price-info {
  text-align: right;
}

.current-price {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}

.current-price.positive {
  color: #27ae60;
}

.current-price.negative {
  color: #e74c3c;
}

.price-change {
  font-size: 14px;
  font-weight: 500;
}

.price-change.positive {
  color: #27ae60;
}

.price-change.negative {
  color: #e74c3c;
}

/* 买卖盘 */
.orderbook {
  display: flex;
  margin-bottom: 25px;
  gap: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 15px;
}

.orderbook-sells,
.orderbook-buys {
  flex: 1;
}

.orderbook-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.orderbook-row:hover {
  transform: translateX(4px);
}

.orderbook-row.sell {
  background: linear-gradient(45deg, rgba(231, 76, 60, 0.1), rgba(192, 57, 43, 0.1));
  color: #e74c3c;
}

.orderbook-row.buy {
  background: linear-gradient(45deg, rgba(52, 152, 219, 0.1), rgba(41, 128, 185, 0.1));
  color: #3498db;
}

/* 交易表单 */
.trading-form {
  margin-top: 25px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
}

/* 订单列表 */
.orders-list {
  max-height: 300px;
  overflow-y: auto;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.order-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.order-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.order-symbol {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
  min-width: 80px;
}

.order-side {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  min-width: 50px;
  text-align: center;
}

.order-side.buy {
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
}

.order-side.sell {
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  color: white;
}

.order-type {
  color: #7f8c8d;
  font-size: 12px;
  min-width: 60px;
}

.order-price {
  color: #2c3e50;
  font-weight: 500;
  font-size: 13px;
  min-width: 80px;
  text-align: right;
}

.order-amount {
  color: #2c3e50;
  font-size: 13px;
  min-width: 60px;
  text-align: right;
}

.order-status {
  min-width: 80px;
}

/* 图表容器 */
.chart-container,
.depth-container {
  height: 200px;
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 10px;
}

.timeframe-select {
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
}

/* 最近交易 */
.trades-list {
  max-height: 200px;
  overflow-y: auto;
}

.trade-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-size: 12px;
  transition: all 0.3s ease;
}

.trade-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.trade-time {
  color: #7f8c8d;
  font-size: 11px;
  min-width: 60px;
}

.trade-side {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  min-width: 30px;
  text-align: center;
}

.trade-side.buy {
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
}

.trade-side.sell {
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  color: white;
}

.trade-price {
  color: #2c3e50;
  font-weight: 500;
  font-size: 11px;
  min-width: 60px;
  text-align: right;
}

.trade-amount {
  color: #7f8c8d;
  font-size: 11px;
  min-width: 50px;
  text-align: right;
}

/* 空状态 */
.empty-state {
  text-align: center;
  color: #7f8c8d;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.empty-state .el-icon {
  font-size: 48px;
  color: #bdc3c7;
}

/* 通用样式 */
.positive {
  color: #27ae60;
}

.negative {
  color: #e74c3c;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .real-time-trading {
    padding: 15px;
  }
  
  .trading-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .el-col {
    margin-bottom: 20px;
  }
  
  .trading-controls {
    flex-direction: column;
    gap: 8px;
  }
  
  .symbol-search {
    width: 100%;
  }
}

/* 动画效果 */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.pulse {
  animation: pulse 2s infinite;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-in {
  animation: slideIn 0.5s ease-out;
}
</style>