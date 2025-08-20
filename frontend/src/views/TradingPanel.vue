<template>
  <div class="trading-panel">
    <div class="page-header">
      <h2>实盘交易</h2>
      <div class="header-actions">
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <div class="trading-content">
      <!-- 账户信息卡片 -->
      <div class="account-section">
        <div class="section-header">
          <h3>账户信息</h3>
          <el-select v-model="selectedAccount" placeholder="选择账户" style="width: 200px">
            <el-option
              v-for="account in accounts"
              :key="account.id"
              :label="account.name"
              :value="account.id"
            />
          </el-select>
        </div>
        
        <div class="account-cards">
          <div class="account-card">
            <div class="card-title">总资产</div>
            <div class="card-value">{{ formatCurrency(currentAccount.totalAssets) }}</div>
            <div class="card-change" :class="currentAccount.dailyChange >= 0 ? 'positive' : 'negative'">
              {{ currentAccount.dailyChange >= 0 ? '+' : '' }}{{ currentAccount.dailyChange }}%
            </div>
          </div>
          
          <div class="account-card">
            <div class="card-title">可用余额</div>
            <div class="card-value">{{ formatCurrency(currentAccount.availableBalance) }}</div>
            <div class="card-subtitle">
              {{ ((currentAccount.availableBalance / currentAccount.totalAssets) * 100).toFixed(1) }}%
            </div>
          </div>
          
          <div class="account-card">
            <div class="card-title">浮动盈亏</div>
            <div class="card-value" :class="currentAccount.floatingPnL >= 0 ? 'positive' : 'negative'">
              {{ currentAccount.floatingPnL >= 0 ? '+' : '' }}{{ formatCurrency(currentAccount.floatingPnL) }}
            </div>
          </div>
          
          <div class="account-card">
            <div class="card-title">今日盈亏</div>
            <div class="card-value" :class="currentAccount.dailyPnL >= 0 ? 'positive' : 'negative'">
              {{ currentAccount.dailyPnL >= 0 ? '+' : '' }}{{ formatCurrency(currentAccount.dailyPnL) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 快速交易面板 -->
      <div class="trading-section">
        <div class="section-header">
          <h3>快速交易</h3>
        </div>
        
        <div class="trading-form">
          <div class="form-row">
            <div class="form-group">
              <label>交易品种</label>
              <el-select v-model="tradingForm.symbol" placeholder="选择品种" style="width: 100%">
                <el-option
                  v-for="symbol in availableSymbols"
                  :key="symbol"
                  :label="symbol"
                  :value="symbol"
                />
              </el-select>
            </div>
            
            <div class="form-group">
              <label>交易类型</label>
              <el-radio-group v-model="tradingForm.type" style="width: 100%">
                <el-radio-button label="buy">买入</el-radio-button>
                <el-radio-button label="sell">卖出</el-radio-button>
              </el-radio-group>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>订单类型</label>
              <el-select v-model="tradingForm.orderType" placeholder="订单类型" style="width: 100%">
                <el-option label="市价单" value="market" />
                <el-option label="限价单" value="limit" />
                <el-option label="止损单" value="stop" />
                <el-option label="止盈单" value="take_profit" />
              </el-select>
            </div>
            
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
          </div>
          
          <div class="form-row" v-if="tradingForm.orderType !== 'market'">
            <div class="form-group">
              <label>价格</label>
              <el-input-number
                v-model="tradingForm.price"
                :min="0"
                :step="0.01"
                style="width: 100%"
                placeholder="订单价格"
              />
            </div>
            
            <div class="form-group">
              <label>有效期</label>
              <el-select v-model="tradingForm.timeInForce" placeholder="有效期" style="width: 100%">
                <el-option label="当日有效" value="day" />
                <el-option label="撤单前有效" value="gtc" />
                <el-option label "立即或撤单" value="ioc" />
                <el-option label="全部或撤单" value="fok" />
              </el-select>
            </div>
          </div>
          
          <div class="trading-actions">
            <el-button
              type="success"
              size="large"
              @click="submitOrder"
              :disabled="!canSubmitOrder"
              :loading="submitting"
            >
              <el-icon><ShoppingCart /></el-icon>
              {{ tradingForm.type === 'buy' ? '买入' : '卖出' }}
            </el-button>
            
            <el-button size="large" @click="resetForm">
              重置
            </el-button>
          </div>
        </div>
      </div>

      <!-- 当前持仓 -->
      <div class="positions-section">
        <div class="section-header">
          <h3>当前持仓</h3>
          <el-button size="small" @click="refreshPositions">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
        
        <div class="positions-table">
          <el-table :data="positions" style="width: 100%">
            <el-table-column prop="symbol" label="品种" min-width="100" />
            <el-table-column prop="amount" label="数量" align="right" />
            <el-table-column prop="avgPrice" label="平均价格" align="right">
              <template #default="{ row }">
                {{ formatCurrency(row.avgPrice) }}
              </template>
            </el-table-column>
            <el-table-column prop="currentPrice" label="当前价格" align="right">
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
            <el-table-column prop="pnlPercent" label="盈亏比例" align="right">
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
      <div class="orders-section">
        <div class="section-header">
          <h3>最近订单</h3>
          <el-button size="small" @click="refreshOrders">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
        
        <div class="orders-table">
          <el-table :data="recentOrders" style="width: 100%">
            <el-table-column prop="symbol" label="品种" min-width="80" />
            <el-table-column prop="type" label="类型" width="60">
              <template #default="{ row }">
                <el-tag :type="row.type === 'buy' ? 'success' : 'danger'" size="small">
                  {{ row.type === 'buy' ? '买入' : '卖出' }}
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh,
  ShoppingCart
} from '@element-plus/icons-vue'

interface Account {
  id: string
  name: string
  totalAssets: number
  availableBalance: number
  floatingPnL: number
  dailyPnL: number
  dailyChange: number
}

interface Position {
  symbol: string
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
  amount: number
  price?: number
  status: string
  createdAt: Date
}

interface TradingForm {
  symbol: string
  type: 'buy' | 'sell'
  orderType: string
  amount: number
  price?: number
  timeInForce: string
}

const selectedAccount = ref('account1')
const submitting = ref(false)

const accounts = ref<Account[]>([
  {
    id: 'account1',
    name: '主账户',
    totalAssets: 125430.50,
    availableBalance: 45230.00,
    floatingPnL: 2150.50,
    dailyPnL: 580.25,
    dailyChange: 0.47
  },
  {
    id: 'account2',
    name: '测试账户',
    totalAssets: 10000.00,
    availableBalance: 8000.00,
    floatingPnL: 200.00,
    dailyPnL: 50.00,
    dailyChange: 0.50
  }
])

const currentAccount = computed(() => {
  return accounts.value.find(account => account.id === selectedAccount.value) || accounts.value[0]
})

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
  orderType: 'market',
  amount: 0.1,
  price: undefined,
  timeInForce: 'day'
})

const positions = ref<Position[]>([
  {
    symbol: 'BTC/USDT',
    amount: 0.5,
    avgPrice: 44000.00,
    currentPrice: 45230.00,
    pnl: 615.00,
    pnlPercent: 2.80
  },
  {
    symbol: 'ETH/USDT',
    amount: 2.0,
    avgPrice: 3100.00,
    currentPrice: 3145.00,
    pnl: 90.00,
    pnlPercent: 1.45
  }
])

const recentOrders = ref<Order[]>([
  {
    id: '1',
    symbol: 'BTC/USDT',
    type: 'buy',
    amount: 0.1,
    price: 45200.00,
    status: 'filled',
    createdAt: new Date(Date.now() - 5 * 60 * 1000)
  },
  {
    id: '2',
    symbol: 'ETH/USDT',
    type: 'sell',
    amount: 1.0,
    price: 3150.00,
    status: 'pending',
    createdAt: new Date(Date.now() - 15 * 60 * 1000)
  }
])

const canSubmitOrder = computed(() => {
  return tradingForm.symbol && tradingForm.amount > 0 && 
         (tradingForm.orderType === 'market' || (tradingForm.price && tradingForm.price > 0))
})

const refreshData = () => {
  ElMessage.success('数据已刷新')
}

const refreshPositions = () => {
  ElMessage.success('持仓数据已刷新')
}

const refreshOrders = () => {
  ElMessage.success('订单数据已刷新')
}

const submitOrder = async () => {
  submitting.value = true
  
  try {
    // 模拟提交订单
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newOrder: Order = {
      id: Date.now().toString(),
      symbol: tradingForm.symbol,
      type: tradingForm.type,
      amount: tradingForm.amount,
      price: tradingForm.price,
      status: 'pending',
      createdAt: new Date()
    }
    
    recentOrders.value.unshift(newOrder)
    
    ElMessage.success(`${tradingForm.type === 'buy' ? '买入' : '卖出'}订单已提交`)
    resetForm()
  } catch (error) {
    ElMessage.error('订单提交失败')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  tradingForm.symbol = 'BTC/USDT'
  tradingForm.type = 'buy'
  tradingForm.orderType = 'market'
  tradingForm.amount = 0.1
  tradingForm.price = undefined
  tradingForm.timeInForce = 'day'
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
    
    positions.value = positions.value.filter(p => p.symbol !== position.symbol)
    ElMessage.success(`${position.symbol} 已平仓`)
  } catch {
    // 用户取消操作
  }
}

const cancelOrder = async (order: Order) => {
  try {
    await ElMessageBox.confirm(
      `确定要撤销这个订单吗？`,
      '确认撤销',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const index = recentOrders.value.findIndex(o => o.id === order.id)
    if (index !== -1) {
      recentOrders.value[index].status = 'cancelled'
    }
    
    ElMessage.success('订单已撤销')
  } catch {
    // 用户取消操作
  }
}

const getOrderStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: 'warning',
    filled: 'success',
    cancelled: 'info',
    rejected: 'danger'
  }
  return statusMap[status] || 'info'
}

const getOrderStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待成交',
    filled: '已成交',
    cancelled: '已撤销',
    rejected: '已拒绝'
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

.trading-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
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
}

:deep(.el-button:hover) {
  background: var(--hover-bg);
  border-color: var(--primary-text);
  color: var(--primary-text);
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