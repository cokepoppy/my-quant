<template>
  <div class="enhanced-dashboard">
    <!-- Market Overview Header -->
    <div class="market-header glass-enhanced animate-fade-in">
      <div class="header-content">
        <div class="market-title">
          <h1 class="gradient-text">量化交易控制台</h1>
          <p class="market-subtitle">Quantitative Trading Console</p>
        </div>
        <div class="market-status">
          <div class="status-indicator online">
            <span class="status-dot"></span>
            <span>系统运行正常</span>
          </div>
          <div class="current-time">
            {{ currentTime }}
          </div>
        </div>
      </div>
      
      <!-- Quick Stats -->
      <div class="quick-stats">
        <div class="stat-item">
          <div class="stat-icon profit">
            <el-icon><trend-charts /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value gradient-success">+12.5%</div>
            <div class="stat-label">今日收益率</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon active">
            <el-icon><cpu /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ activeStrategies }}</div>
            <div class="stat-label">运行策略</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon volume">
            <el-icon><money /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">${{ dailyVolume.toLocaleString() }}</div>
            <div class="stat-label">日成交额</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Grid Layout -->
    <div class="dashboard-grid">
      <!-- Left Column -->
      <div class="dashboard-column left">
        <!-- Strategy Performance Card -->
        <div class="performance-card glass-enhanced animate-slide-in-up delay-1">
          <div class="card-header">
            <h3>策略表现</h3>
            <div class="header-actions">
              <el-button size="small" @click="refreshPerformance" class="icon-button">
                <el-icon><refresh /></el-icon>
              </el-button>
              <el-dropdown @command="handlePeriodChange">
                <el-button size="small">
                  {{ selectedPeriod }}
                  <el-icon><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="1d">1天</el-dropdown-item>
                    <el-dropdown-item command="1w">1周</el-dropdown-item>
                    <el-dropdown-item command="1m">1月</el-dropdown-item>
                    <el-dropdown-item command="3m">3月</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          
          <div class="performance-chart">
            <StrategyPerformanceChart 
              :data="performanceData"
              :height="300"
              :realtime="true"
            />
          </div>
          
          <div class="performance-metrics">
            <div class="metric-grid">
              <div class="metric-item">
                <span class="metric-label">夏普比率</span>
                <span class="metric-value">{{ sharpeRatio }}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">最大回撤</span>
                <span class="metric-value negative">{{ maxDrawdown }}%</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">胜率</span>
                <span class="metric-value positive">{{ winRate }}%</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">盈亏比</span>
                <span class="metric-value">{{ profitFactor }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Active Strategies Card -->
        <div class="strategies-card glass-enhanced animate-slide-in-up delay-2">
          <div class="card-header">
            <h3>运行中策略</h3>
            <el-button size="small" @click="showStrategyDialog" class="primary-button">
              <el-icon><plus /></el-icon>
              新建策略
            </el-button>
          </div>
          
          <div class="strategies-list">
            <div 
              v-for="strategy in activeStrategiesList" 
              :key="strategy.id"
              class="strategy-item"
              :class="{ 'strategy-running': strategy.status === 'running' }"
            >
              <div class="strategy-info">
                <div class="strategy-name">{{ strategy.name }}</div>
                <div class="strategy-details">
                  <span class="strategy-symbol">{{ strategy.symbol }}</span>
                  <span class="strategy-timeframe">{{ strategy.timeframe }}</span>
                </div>
              </div>
              <div class="strategy-stats">
                <div class="stat-row">
                  <span class="stat-label">P&L:</span>
                  <span class="stat-value" :class="strategy.pnl >= 0 ? 'positive' : 'negative'">
                    {{ strategy.pnl >= 0 ? '+' : '' }}${{ strategy.pnl.toFixed(2) }}
                  </span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">胜率:</span>
                  <span class="stat-value">{{ strategy.winRate }}%</span>
                </div>
              </div>
              <div class="strategy-actions">
                <el-button size="small" @click="editStrategy(strategy)" class="icon-button">
                  <el-icon><setting /></el-icon>
                </el-button>
                <el-button 
                  size="small" 
                  @click="toggleStrategy(strategy)"
                  :class="strategy.status === 'running' ? 'danger' : 'success'"
                >
                  <el-icon>
                    <component :is="strategy.status === 'running' ? 'video-pause' : 'video-play'" />
                  </el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Center Column -->
      <div class="dashboard-column center">
        <!-- Trading Chart Card -->
        <div class="chart-card glass-enhanced animate-slide-in-up delay-1">
          <div class="card-header">
            <h3>实时行情</h3>
            <div class="chart-controls">
              <el-select v-model="selectedSymbol" size="small" @change="updateChart">
                <el-option v-for="symbol in availableSymbols" :key="symbol" :label="symbol" :value="symbol" />
              </el-select>
              <el-select v-model="selectedTimeframe" size="small" @change="updateChart">
                <el-option label="1分钟" value="1m" />
                <el-option label="5分钟" value="5m" />
                <el-option label="15分钟" value="15m" />
                <el-option label="1小时" value="1h" />
                <el-option label="4小时" value="4h" />
                <el-option label="1天" value="1d" />
              </el-select>
              <el-button-group size="small">
                <el-button @click="chartType = 'candlestick'" :class="{ active: chartType === 'candlestick' }">
                  K线
                </el-button>
                <el-button @click="chartType = 'line'" :class="{ active: chartType === 'line' }">
                  分时
                </el-button>
              </el-button-group>
            </div>
          </div>
          
          <div class="main-chart">
            <TradingChart
              :symbol="selectedSymbol"
              :timeframe="selectedTimeframe"
              :type="chartType"
              :height="500"
              :realtime="true"
              :show-volume="true"
              :show-indicators="true"
            />
          </div>
          
          <div class="chart-indicators">
            <div class="indicator-tabs">
              <div 
                v-for="indicator in availableIndicators"
                :key="indicator.id"
                class="indicator-tab"
                :class="{ active: selectedIndicators.includes(indicator.id) }"
                @click="toggleIndicator(indicator.id)"
              >
                {{ indicator.name }}
              </div>
            </div>
          </div>
        </div>

        <!-- Order Book Card -->
        <div class="orderbook-card glass-enhanced animate-slide-in-up delay-2">
          <div class="card-header">
            <h3>订单簿</h3>
            <div class="orderbook-summary">
              <div class="summary-item">
                <span class="label">买量:</span>
                <span class="value positive">{{ totalBuyVolume }}</span>
              </div>
              <div class="summary-item">
                <span class="label">卖量:</span>
                <span class="value negative">{{ totalSellVolume }}</span>
              </div>
              <div class="summary-item">
                <span class="label">差价:</span>
                <span class="value">{{ spread }}</span>
              </div>
            </div>
          </div>
          
          <div class="orderbook-content">
            <div class="orderbook-side sell">
              <div v-for="order in sellOrders" :key="order.price" class="orderbook-row">
                <div class="order-size">{{ order.size }}</div>
                <div class="order-price negative">{{ order.price }}</div>
                <div class="order-bar" :style="{ width: order.barWidth + '%', background: 'rgba(255, 71, 87, 0.3)' }"></div>
              </div>
            </div>
            
            <div class="current-price">
              <div class="price-value">{{ currentPrice }}</div>
              <div class="price-change" :class="priceChange >= 0 ? 'positive' : 'negative'">
                {{ priceChange >= 0 ? '+' : '' }}{{ priceChange }}%
              </div>
            </div>
            
            <div class="orderbook-side buy">
              <div v-for="order in buyOrders" :key="order.price" class="orderbook-row">
                <div class="order-size">{{ order.size }}</div>
                <div class="order-price positive">{{ order.price }}</div>
                <div class="order-bar" :style="{ width: order.barWidth + '%', background: 'rgba(0, 212, 170, 0.3)' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="dashboard-column right">
        <!-- Quick Trade Card -->
        <div class="quick-trade-card glass-enhanced animate-slide-in-up delay-1">
          <div class="card-header">
            <h3>快速交易</h3>
          </div>
          
          <div class="trade-form">
            <div class="form-group">
              <label>交易对</label>
              <el-select v-model="tradeForm.symbol" size="small" class="full-width">
                <el-option v-for="symbol in availableSymbols" :key="symbol" :label="symbol" :value="symbol" />
              </el-select>
            </div>
            
            <div class="form-group">
              <label>方向</label>
              <div class="direction-buttons">
                <el-button 
                  size="large" 
                  :class="{ active: tradeForm.direction === 'buy' }"
                  @click="tradeForm.direction = 'buy'"
                  class="buy-button"
                >
                  买入
                </el-button>
                <el-button 
                  size="large" 
                  :class="{ active: tradeForm.direction === 'sell' }"
                  @click="tradeForm.direction = 'sell'"
                  class="sell-button"
                >
                  卖出
                </el-button>
              </div>
            </div>
            
            <div class="form-group">
              <label>数量</label>
              <el-input-number 
                v-model="tradeForm.amount" 
                size="small" 
                :min="0.001"
                :step="0.001"
                class="full-width"
              />
            </div>
            
            <div class="form-group">
              <label>订单类型</label>
              <el-select v-model="tradeForm.orderType" size="small" class="full-width">
                <el-option label="市价单" value="market" />
                <el-option label="限价单" value="limit" />
                <el-option label="止损单" value="stop" />
              </el-select>
            </div>
            
            <div v-if="tradeForm.orderType === 'limit'" class="form-group">
              <label>价格</label>
              <el-input-number 
                v-model="tradeForm.price" 
                size="small" 
                :min="0"
                :step="0.01"
                class="full-width"
              />
            </div>
            
            <div class="trade-summary">
              <div class="summary-row">
                <span>预估成本:</span>
                <span>${{ estimatedCost.toFixed(2) }}</span>
              </div>
              <div class="summary-row">
                <span>手续费:</span>
                <span>${{ estimatedFee.toFixed(2) }}</span>
              </div>
            </div>
            
            <el-button 
              size="large" 
              type="primary" 
              @click="executeTrade"
              :class="tradeForm.direction"
              class="full-width trade-button"
            >
              {{ tradeForm.direction === 'buy' ? '买入' : '卖出' }}
            </el-button>
          </div>
        </div>

        <!-- Recent Trades Card -->
        <div class="recent-trades-card glass-enhanced animate-slide-in-up delay-2">
          <div class="card-header">
            <h3>最近成交</h3>
          </div>
          
          <div class="trades-list">
            <div v-for="trade in recentTrades" :key="trade.id" class="trade-item">
              <div class="trade-time">{{ formatTime(trade.time) }}</div>
              <div class="trade-info">
                <div class="trade-pair">{{ trade.symbol }}</div>
                <div class="trade-amount">{{ trade.amount }}</div>
              </div>
              <div class="trade-price" :class="trade.side === 'buy' ? 'positive' : 'negative'">
                {{ trade.price }}
              </div>
            </div>
          </div>
        </div>

        <!-- Market News Card -->
        <div class="news-card glass-enhanced animate-slide-in-up delay-3">
          <div class="card-header">
            <h3>市场动态</h3>
          </div>
          
          <div class="news-list">
            <div v-for="news in marketNews" :key="news.id" class="news-item">
              <div class="news-time">{{ formatNewsTime(news.time) }}</div>
              <div class="news-title">{{ news.title }}</div>
              <div class="news-impact" :class="getImpactClass(news.impact)">
                {{ getImpactText(news.impact) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Strategy Dialog -->
    <el-dialog v-model="strategyDialogVisible" title="新建策略" width="600px">
      <StrategyForm @submit="handleStrategySubmit" @cancel="strategyDialogVisible = false" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  TrendCharts,
  Cpu,
  Money,
  Refresh,
  ArrowDown,
  Plus,
  Setting,
  VideoPause,
  VideoPlay
} from '@element-plus/icons-vue'
import StrategyPerformanceChart from '@/components/charts/StrategyPerformanceChart.vue'
import TradingChart from '@/components/charts/TradingChart.vue'
import StrategyForm from '@/components/forms/StrategyForm.vue'

// Reactive data
const currentTime = ref('')
const selectedPeriod = ref('1d')
const activeStrategies = ref(5)
const dailyVolume = ref(2847500)
const performanceData = ref([])
const selectedSymbol = ref('BTC/USDT')
const selectedTimeframe = ref('1h')
const chartType = ref('candlestick')
const currentPrice = ref('45250.50')
const priceChange = ref(2.35)
const strategyDialogVisible = ref(false)

// Available data
const availableSymbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT', 'DOT/USDT', 'SOL/USDT']
const availableIndicators = [
  { id: 'ma', name: 'MA' },
  { id: 'ema', name: 'EMA' },
  { id: 'macd', name: 'MACD' },
  { id: 'rsi', name: 'RSI' },
  { id: 'bollinger', name: '布林带' },
  { id: 'volume', name: '成交量' }
]
const selectedIndicators = ref(['ma', 'volume'])

// Strategy data
const activeStrategiesList = ref([
  {
    id: 1,
    name: 'BTC趋势跟踪',
    symbol: 'BTC/USDT',
    timeframe: '1h',
    status: 'running',
    pnl: 1250.50,
    winRate: 68.5
  },
  {
    id: 2,
    name: 'ETH套利策略',
    symbol: 'ETH/USDT',
    timeframe: '5m',
    status: 'running',
    pnl: -320.25,
    winRate: 55.2
  },
  {
    id: 3,
    name: '多币种网格',
    symbol: '多币种',
    timeframe: '15m',
    status: 'paused',
    pnl: 890.75,
    winRate: 72.1
  }
])

// Order book data
const sellOrders = ref([
  { price: '45255.00', size: '0.5234', barWidth: 85 },
  { price: '45254.50', size: '0.3421', barWidth: 65 },
  { price: '45254.00', size: '0.7892', barWidth: 95 },
  { price: '45253.50', size: '0.4567', barWidth: 75 },
  { price: '45253.00', size: '0.2345', barWidth: 45 }
])

const buyOrders = ref([
  { price: '45250.00', size: '0.6789', barWidth: 80 },
  { price: '45249.50', size: '0.4567', barWidth: 60 },
  { price: '45249.00', size: '0.8901', barWidth: 90 },
  { price: '45248.50', size: '0.3456', barWidth: 50 },
  { price: '45248.00', size: '0.5678', barWidth: 70 }
])

// Trade form
const tradeForm = reactive({
  symbol: 'BTC/USDT',
  direction: 'buy',
  amount: 0.1,
  orderType: 'market',
  price: 45250
})

// Recent trades
const recentTrades = ref([
  { id: 1, time: new Date(), symbol: 'BTC/USDT', side: 'buy', amount: '0.1234', price: '45250.50' },
  { id: 2, time: new Date(Date.now() - 30000), symbol: 'ETH/USDT', side: 'sell', amount: '2.5678', price: '2980.25' },
  { id: 3, time: new Date(Date.now() - 60000), symbol: 'BTC/USDT', side: 'buy', amount: '0.0567', price: '45248.75' },
  { id: 4, time: new Date(Date.now() - 90000), symbol: 'BNB/USDT', side: 'buy', amount: '5.2345', price: '395.50' }
])

// Market news
const marketNews = ref([
  { id: 1, time: new Date(), title: '比特币突破45000美元关口', impact: 'high' },
  { id: 2, time: new Date(Date.now() - 1800000), title: '美联储维持利率不变', impact: 'medium' },
  { id: 3, time: new Date(Date.now() - 3600000), title: '以太坊2.0质押数量创新高', impact: 'low' }
])

// Computed properties
const sharpeRatio = computed(() => '1.85')
const maxDrawdown = computed(() => '-8.2')
const winRate = computed(() => '68.5')
const profitFactor = computed(() => '1.76')

const totalBuyVolume = computed(() => '2.8901')
const totalSellVolume = computed(() => '3.2456')
const spread = computed(() => '0.50')

const estimatedCost = computed(() => {
  return tradeForm.amount * parseFloat(currentPrice.value.replace(',', ''))
})

const estimatedFee = computed(() => estimatedCost.value * 0.001)

// Methods
const updateTime = () => {
  currentTime.value = new Date().toLocaleString('zh-CN')
}

const refreshPerformance = () => {
  ElMessage.success('性能数据已刷新')
}

const handlePeriodChange = (period: string) => {
  selectedPeriod.value = period
  // TODO: Fetch performance data for selected period
}

const updateChart = () => {
  // TODO: Update chart with new symbol/timeframe
}

const toggleIndicator = (indicatorId: string) => {
  const index = selectedIndicators.value.indexOf(indicatorId)
  if (index > -1) {
    selectedIndicators.value.splice(index, 1)
  } else {
    selectedIndicators.value.push(indicatorId)
  }
}

const showStrategyDialog = () => {
  strategyDialogVisible.value = true
}

const editStrategy = (strategy: any) => {
  ElMessage.info(`编辑策略: ${strategy.name}`)
}

const toggleStrategy = (strategy: any) => {
  strategy.status = strategy.status === 'running' ? 'paused' : 'running'
  ElMessage.success(`策略已${strategy.status === 'running' ? '启动' : '暂停'}`)
}

const handleStrategySubmit = (strategy: any) => {
  strategyDialogVisible.value = false
  ElMessage.success('策略创建成功')
}

const executeTrade = () => {
  ElMessage.success(`${tradeForm.direction === 'buy' ? '买入' : '卖出'}订单已提交`)
  // Reset form
  tradeForm.amount = 0.1
  tradeForm.price = 45250
}

const formatTime = (time: Date) => {
  return time.toLocaleTimeString('zh-CN')
}

const formatNewsTime = (time: Date) => {
  const now = new Date()
  const diff = now.getTime() - time.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  return time.toLocaleDateString('zh-CN')
}

const getImpactClass = (impact: string) => {
  const classes = {
    high: 'high-impact',
    medium: 'medium-impact',
    low: 'low-impact'
  }
  return classes[impact] || 'low-impact'
}

const getImpactText = (impact: string) => {
  const texts = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return texts[impact] || '低'
}

// Lifecycle
let timeInterval: any

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.enhanced-dashboard {
  padding: 20px;
  background: linear-gradient(135deg, #0a0e27 0%, #151932 100%);
  min-height: 100vh;
  color: #ffffff;
  font-family: var(--font-display);
}

/* Market Header */
.market-header {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.1) 0%, 
    rgba(255, 255, 255, 0.02) 100%);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.market-title h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #00d4ff, #00ff88);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.market-subtitle {
  margin: 5px 0 0 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.market-status {
  display: flex;
  align-items: center;
  gap: 30px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00ff88;
  animation: pulse 2s infinite;
}

.status-indicator.online .status-dot {
  background: #00ff88;
}

.current-time {
  font-family: var(--font-mono);
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.quick-stats {
  display: flex;
  gap: 30px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.profit {
  background: linear-gradient(135deg, #00ff88, #00cc6a);
  color: white;
}

.stat-icon.active {
  background: linear-gradient(135deg, #00d4ff, #0099cc);
  color: white;
}

.stat-icon.volume {
  background: linear-gradient(135deg, #ffa502, #ff8800);
  color: white;
}

.stat-content .stat-value {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 2px;
}

.stat-content .stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: 350px 1fr 320px;
  gap: 20px;
  height: calc(100vh - 200px);
}

.dashboard-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Glass Enhanced Effect */
.glass-enhanced {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.1) 0%, 
    rgba(255, 255, 255, 0.02) 100%);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 20px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.glass-enhanced:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

/* Card Headers */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 0;
  margin-bottom: 10px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Buttons */
.icon-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 6px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.icon-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.primary-button {
  background: linear-gradient(135deg, #00d4ff, #0099cc);
  border: none;
  color: white;
  font-weight: 500;
  transition: all 0.2s ease;
}

.primary-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
}

/* Performance Card */
.performance-chart {
  height: 300px;
  margin: 20px;
}

.performance-metrics {
  padding: 0 20px 20px;
}

.metric-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.metric-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.metric-value {
  font-size: 16px;
  font-weight: 600;
  font-family: var(--font-mono);
}

.metric-value.positive {
  color: #00ff88;
}

.metric-value.negative {
  color: #ff4757;
}

/* Strategies List */
.strategies-list {
  padding: 0 20px 20px;
  max-height: 300px;
  overflow-y: auto;
}

.strategy-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  margin-bottom: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.strategy-item:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateX(5px);
}

.strategy-running {
  border-left: 3px solid #00ff88;
}

.strategy-info {
  flex: 1;
}

.strategy-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.strategy-details {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.strategy-stats {
  text-align: right;
  margin-right: 15px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  margin-bottom: 2px;
}

.stat-label {
  color: rgba(255, 255, 255, 0.7);
}

.stat-value {
  font-family: var(--font-mono);
  font-weight: 500;
}

.strategy-actions {
  display: flex;
  gap: 5px;
}

/* Trading Chart */
.chart-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.main-chart {
  height: 500px;
  margin: 20px;
}

.chart-indicators {
  padding: 0 20px 20px;
}

.indicator-tabs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.indicator-tab {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.indicator-tab:hover {
  background: rgba(255, 255, 255, 0.1);
}

.indicator-tab.active {
  background: linear-gradient(135deg, #00d4ff, #0099cc);
  border-color: transparent;
  color: white;
}

/* Order Book */
.orderbook-summary {
  display: flex;
  gap: 20px;
  font-size: 12px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.summary-item .label {
  color: rgba(255, 255, 255, 0.7);
}

.summary-item .value {
  font-family: var(--font-mono);
  font-weight: 500;
}

.orderbook-content {
  padding: 20px;
  font-family: var(--font-mono);
  font-size: 12px;
}

.orderbook-side {
  margin-bottom: 15px;
}

.orderbook-row {
  display: flex;
  align-items: center;
  padding: 4px 0;
  position: relative;
}

.order-size {
  width: 80px;
  text-align: left;
  color: rgba(255, 255, 255, 0.8);
}

.order-price {
  width: 80px;
  text-align: right;
  font-weight: 500;
}

.order-price.positive {
  color: #00ff88;
}

.order-price.negative {
  color: #ff4757;
}

.order-bar {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  pointer-events: none;
}

.current-price {
  text-align: center;
  padding: 15px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  margin: 10px 0;
}

.price-value {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 5px;
}

.price-change {
  font-size: 14px;
  font-weight: 500;
}

.price-change.positive {
  color: #00ff88;
}

.price-change.negative {
  color: #ff4757;
}

/* Quick Trade */
.trade-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.full-width {
  width: 100%;
}

.direction-buttons {
  display: flex;
  gap: 10px;
}

.direction-buttons .el-button {
  flex: 1;
  height: 40px;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.buy-button {
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
  color: #00ff88;
}

.buy-button:hover,
.buy-button.active {
  background: rgba(0, 255, 136, 0.2);
  border-color: #00ff88;
  transform: translateY(-1px);
}

.sell-button {
  background: rgba(255, 71, 87, 0.1);
  border: 1px solid rgba(255, 71, 87, 0.3);
  color: #ff4757;
}

.sell-button:hover,
.sell-button.active {
  background: rgba(255, 71, 87, 0.2);
  border-color: #ff4757;
  transform: translateY(-1px);
}

.trade-summary {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.summary-row:last-child {
  margin-bottom: 0;
}

.trade-button {
  height: 45px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.trade-button.buy {
  background: linear-gradient(135deg, #00ff88, #00cc6a);
  border: none;
}

.trade-button.sell {
  background: linear-gradient(135deg, #ff4757, #cc0000);
  border: none;
}

.trade-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

/* Recent Trades */
.trades-list {
  padding: 20px;
  max-height: 200px;
  overflow-y: auto;
}

.trade-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.trade-item:last-child {
  border-bottom: none;
}

.trade-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  font-family: var(--font-mono);
  width: 50px;
}

.trade-info {
  flex: 1;
  margin: 0 15px;
}

.trade-pair {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 2px;
}

.trade-amount {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  font-family: var(--font-mono);
}

.trade-price {
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font-mono);
}

/* Market News */
.news-list {
  padding: 20px;
  max-height: 200px;
  overflow-y: auto;
}

.news-item {
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.news-item:last-child {
  border-bottom: none;
}

.news-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
}

.news-title {
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.news-impact {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.high-impact {
  background: rgba(255, 71, 87, 0.2);
  color: #ff4757;
}

.medium-impact {
  background: rgba(255, 165, 2, 0.2);
  color: #ffa502;
}

.low-impact {
  background: rgba(0, 212, 255, 0.2);
  color: #00d4ff;
}

/* Animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

.animate-slide-in-up {
  animation: slideInUp 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInUp {
  from { 
    opacity: 0; 
    transform: translateY(30px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }
.delay-3 { animation-delay: 0.3s; }

/* Utility Classes */
.gradient-text {
  background: linear-gradient(135deg, #00d4ff, #00ff88);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.gradient-success {
  background: linear-gradient(135deg, #00ff88, #00cc6a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Responsive Design */
@media (max-width: 1400px) {
  .dashboard-grid {
    grid-template-columns: 300px 1fr 280px;
  }
}

@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    height: auto;
  }
  
  .dashboard-column {
    max-width: 100%;
  }
  
  .quick-stats {
    flex-wrap: wrap;
    gap: 15px;
  }
}

@media (max-width: 768px) {
  .enhanced-dashboard {
    padding: 10px;
  }
  
  .market-header {
    padding: 20px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .market-title h1 {
    font-size: 24px;
  }
  
  .quick-stats {
    justify-content: center;
  }
  
  .card-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .performance-chart,
  .main-chart {
    height: 300px;
    margin: 10px;
  }
}
</style>