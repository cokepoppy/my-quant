<template>
  <div class="strategy-detail-container">
    <div class="detail-header">
      <div class="header-left">
        <h1>{{ strategy.name || '策略详情' }}</h1>
        <div class="strategy-status">
          <el-tag :type="getStatusTagType(strategy.status)" effect="dark">
            {{ getStatusText(strategy.status) }}
          </el-tag>
          <span class="last-updated">最后更新: {{ formatDate(strategy.updatedAt) }}</span>
        </div>
      </div>
      <div class="header-actions">
        <el-button @click="emit('back-to-list')">返回列表</el-button>
        <el-button type="primary" @click="emit('edit-strategy', strategy)">编辑策略</el-button>
        <el-button 
          :type="strategy.status === 'active' ? 'danger' : 'success'"
          @click="toggleStrategyStatus"
        >
          {{ strategy.status === 'active' ? '停用策略' : '启用策略' }}
        </el-button>
        <el-dropdown trigger="click" @command="handleCommand">
          <el-button>
            更多操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="backtest">回测</el-dropdown-item>
              <el-dropdown-item command="duplicate">复制</el-dropdown-item>
              <el-dropdown-item command="export">导出</el-dropdown-item>
              <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <el-row :gutter="20" class="detail-content">
      <!-- 左侧信息面板 -->
      <el-col :span="8">
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <h3>策略信息</h3>
            </div>
          </template>
          
          <el-descriptions :column="1" border>
            <el-descriptions-item label="策略类型">
              {{ getStrategyTypeLabel(strategy.type) }}
            </el-descriptions-item>
            <el-descriptions-item label="交易品种">
              {{ getSymbolLabel(strategy.symbol) }}
            </el-descriptions-item>
            <el-descriptions-item label="时间周期">
              {{ getTimeframeLabel(strategy.timeframe) }}
            </el-descriptions-item>
            <el-descriptions-item label="初始资金">
              {{ formatMoney(strategy.initialCapital) }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ formatDate(strategy.createdAt) }}
            </el-descriptions-item>
          </el-descriptions>

          <div class="description-section">
            <h4>策略描述</h4>
            <p>{{ strategy.description || '暂无描述' }}</p>
          </div>

          <div class="risk-section">
            <h4>风险参数</h4>
            <el-row :gutter="10">
              <el-col :span="8">
                <div class="risk-item">
                  <div class="risk-label">最大仓位</div>
                  <div class="risk-value">{{ strategy.maxPosition }}%</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="risk-item">
                  <div class="risk-label">止损比例</div>
                  <div class="risk-value">{{ strategy.stopLossRatio }}%</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="risk-item">
                  <div class="risk-label">止盈比例</div>
                  <div class="risk-value">{{ strategy.takeProfitRatio }}%</div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>

        <el-card class="performance-card">
          <template #header>
            <div class="card-header">
              <h3>策略表现</h3>
              <el-select v-model="performancePeriod" size="small" placeholder="选择时间段">
                <el-option label="最近7天" value="7d" />
                <el-option label="最近30天" value="30d" />
                <el-option label="最近90天" value="90d" />
                <el-option label="全部" value="all" />
              </el-select>
            </div>
          </template>
          
          <div class="performance-metrics">
            <div class="metric-item">
              <div class="metric-label">总收益率</div>
              <div :class="['metric-value', (strategy.profitRate || 0) >= 0 ? 'profit-positive' : 'profit-negative']">
                {{ formatProfitRate(strategy.profitRate) }}
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">夏普比率</div>
              <div class="metric-value">{{ strategy.sharpeRatio ? strategy.sharpeRatio.toFixed(2) : '--' }}</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">最大回撤</div>
              <div class="metric-value negative">{{ strategy.maxDrawdown ? `-${strategy.maxDrawdown.toFixed(2)}%` : '--' }}</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">胜率</div>
              <div class="metric-value">{{ strategy.winRate ? `${strategy.winRate.toFixed(2)}%` : '--' }}</div>
            </div>
          </div>
          
          <div class="chart-container">
            <div class="chart-placeholder">
              <p>性能图表将在这里显示</p>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧代码和交易面板 -->
      <el-col :span="16">
        <el-card class="code-card">
          <template #header>
            <div class="card-header">
              <h3>策略代码</h3>
              <div class="code-actions">
                <el-button size="small" @click="copyCode">复制</el-button>
                <el-button size="small" @click="downloadCode">下载</el-button>
              </div>
            </div>
          </template>
          
          <div class="code-container">
            <pre class="code-display">{{ strategy.code || '// 策略代码将在这里显示' }}</pre>
          </div>
        </el-card>

        <el-card class="trades-card">
          <template #header>
            <div class="card-header">
              <h3>最近交易</h3>
              <el-button size="small" @click="viewAllTrades">查看全部</el-button>
            </div>
          </template>
          
          <el-table :data="recentTrades" style="width: 100%" v-loading="loadingTrades">
            <el-table-column prop="time" label="时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.time) }}
              </template>
            </el-table-column>
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="row.type === 'buy' ? 'success' : 'danger'" size="small">
                  {{ row.type === 'buy' ? '买入' : '卖出' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="price" label="价格" width="120">
              <template #default="{ row }">
                {{ formatMoney(row.price) }}
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="数量" width="120" />
            <el-table-column prop="profit" label="盈亏" width="120">
              <template #default="{ row }">
                <span :class="(row.profit || 0) >= 0 ? 'profit-positive' : 'profit-negative'">
                  {{ formatMoney(row.profit) }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="删除策略"
      width="400px"
      :close-on-click-modal="false"
    >
      <div class="delete-dialog-content">
        <el-icon class="warning-icon"><Warning /></el-icon>
        <p>确定要删除策略 <strong>{{ strategy.name }}</strong> 吗？</p>
        <p class="warning-text">此操作不可逆，策略相关的所有数据将被永久删除。</p>
      </div>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete" :loading="deleting">确认删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowDown, Warning } from '@element-plus/icons-vue'

// 定义props和emits
const props = defineProps({
  strategyId: {
    type: [String, Number],
    required: true
  },
  strategy: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['back-to-list', 'edit-strategy'])

const router = useRouter()
const performancePeriod = ref('30d')
const deleteDialogVisible = ref(false)
const deleting = ref(false)
const loadingTrades = ref(false)

// 策略数据 - 使用传入的 strategy prop 或默认值
const strategy = reactive({
  id: props.strategyId,
  name: '',
  description: '',
  type: '',
  symbol: '',
  timeframe: '',
  initialCapital: 10000,
  maxPosition: 10,
  stopLossRatio: 2.0,
  takeProfitRatio: 5.0,
  code: '',
  status: 'inactive',
  profitRate: 0,
  sharpeRatio: null,
  maxDrawdown: null,
  winRate: null,
  createdAt: null,
  updatedAt: null
})

// 最近交易
const recentTrades = ref([])

const strategyTypes = [
  { value: 'trend_following', label: '趋势跟踪' },
  { value: 'mean_reversion', label: '均值回归' },
  { value: 'breakout', label: '突破策略' },
  { value: 'statistical_arbitrage', label: '统计套利' },
  { value: 'machine_learning', label: '机器学习' },
  { value: 'custom', label: '自定义策略' }
]

const symbols = [
  { value: 'BTCUSDT', label: 'BTC/USDT - 比特币' },
  { value: 'ETHUSDT', label: 'ETH/USDT - 以太坊' },
  { value: 'BNBUSDT', label: 'BNB/USDT - 币安币' },
  { value: '000001.SH', label: '上证指数' },
  { value: '399001.SZ', label: '深证成指' },
  { value: '399006.SZ', label: '创业板指' }
]

const timeframes = [
  { value: '1m', label: '1分钟' },
  { value: '5m', label: '5分钟' },
  { value: '15m', label: '15分钟' },
  { value: '30m', label: '30分钟' },
  { value: '1h', label: '1小时' },
  { value: '4h', label: '4小时' },
  { value: '1d', label: '日线' },
  { value: '1w', label: '周线' }
]

// 加载策略数据
const loadStrategy = async () => {
  try {
    // 如果有传入的 strategy prop，直接使用
    if (props.strategy && Object.keys(props.strategy).length > 0) {
      Object.assign(strategy, props.strategy)
      console.log('🔥 StrategyDetail: 使用传入的策略数据', strategy)
    } else {
      // 否则使用模拟数据
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 模拟策略数据
      Object.assign(strategy, {
        name: 'BTC趋势跟踪策略',
        description: '基于移动平均线的趋势跟踪策略，当短期均线上穿长期均线时买入，下穿时卖出。',
        type: 'trend_following',
        symbol: 'BTCUSDT',
        timeframe: '1h',
        initialCapital: 10000,
        maxPosition: 20,
        stopLossRatio: 2.0,
        takeProfitRatio: 5.0,
        status: 'active',
        profitRate: 12.5,
        sharpeRatio: 1.8,
        maxDrawdown: 8.3,
        winRate: 65.2,
        createdAt: new Date(2023, 5, 15),
        updatedAt: new Date(2023, 6, 20),
        code: `# 策略名称: BTC趋势跟踪策略
# 交易品种: BTCUSDT
# 时间周期: 1h

import pandas as pd
import numpy as np
from strategy_base import StrategyBase

class MyStrategy(StrategyBase):
    """
    基于移动平均线的趋势跟踪策略
    当短期均线上穿长期均线时买入，下穿时卖出
    """
    
    def __init__(self):
        super().__init__()
        # 初始化策略参数
        self.short_window = 20  # 短期均线窗口
        self.long_window = 50   # 长期均线窗口
        
    def initialize(self):
        """策略初始化函数，在回测/实盘开始前调用"""
        self.log("策略初始化...")
        
    def on_bar(self, bar):
        """
        K线数据处理函数，每个新的K线数据到来时调用
        
        参数:
            bar: K线数据，包含open, high, low, close, volume等属性
        """
        # 获取历史数据
        if len(self.data.close) < self.long_window:
            return
            
        # 计算技术指标
        short_ma = np.mean(self.data.close[-self.short_window:])
        long_ma = np.mean(self.data.close[-self.long_window:])
        
        # 交易逻辑
        if short_ma > long_ma and not self.position:
            # 做多信号
            self.buy(bar.close, 1)
            self.log(f"买入信号: 价格={bar.close}")
        elif short_ma < long_ma and self.position > 0:
            # 平仓信号
            self.sell(bar.close, self.position)
            self.log(f"卖出信号: 价格={bar.close}")
            
    def on_order_filled(self, order):
        """订单成交回调函数"""
        self.log(f"订单成交: {order.direction} {order.filled_amount} @ {order.filled_price}")
        
    def on_stop(self):
        """策略结束时调用"""
        self.log("策略运行结束")
`
      })
    }
    
    // 加载最近交易
    loadRecentTrades()
  } catch (error) {
    ElMessage.error('加载策略失败: ' + error.message)
  }
}

// 加载最近交易
const loadRecentTrades = async () => {
  loadingTrades.value = true
  try {
    // 使用模拟数据
    await new Promise(resolve => setTimeout(resolve, 400))
    
    // 模拟交易数据
    recentTrades.value = [
      {
        id: '1',
        time: new Date(2023, 7, 20, 14, 30),
        type: 'buy',
        price: 29850.25,
        amount: 0.15,
        profit: 0
      },
      {
        id: '2',
        time: new Date(2023, 7, 19, 10, 15),
        type: 'sell',
        price: 30120.50,
        amount: 0.15,
        profit: 40.54
      },
      {
        id: '3',
        time: new Date(2023, 7, 18, 22, 45),
        type: 'buy',
        price: 29780.75,
        amount: 0.15,
        profit: 0
      },
      {
        id: '4',
        time: new Date(2023, 7, 17, 16, 20),
        type: 'sell',
        price: 29650.30,
        amount: 0.2,
        profit: -28.14
      },
      {
        id: '5',
        time: new Date(2023, 7, 16, 9, 5),
        type: 'buy',
        price: 29790.80,
        amount: 0.2,
        profit: 0
      }
    ]
  } catch (error) {
    ElMessage.error('加载交易数据失败: ' + error.message)
  } finally {
    loadingTrades.value = false
  }
}

// 切换策略状态
const toggleStrategyStatus = async () => {
  try {
    const newStatus = strategy.status === 'active' ? 'inactive' : 'active'
    const actionText = newStatus === 'active' ? '启用' : '停用'
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 更新本地状态
    strategy.status = newStatus
    
    ElMessage.success(`策略${actionText}成功`)
  } catch (error) {
    ElMessage.error('操作失败: ' + error.message)
  }
}

// 处理下拉菜单命令
const handleCommand = (command) => {
  switch (command) {
    case 'backtest':
      ElMessage.info('回测功能开发中')
      break
    case 'duplicate':
      duplicateStrategy()
      break
    case 'export':
      exportStrategy()
      break
    case 'delete':
      deleteDialogVisible.value = true
      break
  }
}

// 复制策略
const duplicateStrategy = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    ElMessage.success('策略复制成功')
  } catch (error) {
    ElMessage.error('复制失败: ' + error.message)
  }
}

// 导出策略
const exportStrategy = () => {
  try {
    // 创建要导出的策略数据
    const exportData = {
      name: strategy.name,
      description: strategy.description,
      type: strategy.type,
      symbol: strategy.symbol,
      timeframe: strategy.timeframe,
      initialCapital: strategy.initialCapital,
      maxPosition: strategy.maxPosition,
      stopLossRatio: strategy.stopLossRatio,
      takeProfitRatio: strategy.takeProfitRatio,
      code: strategy.code
    }
    
    // 转换为JSON字符串
    const jsonStr = JSON.stringify(exportData, null, 2)
    
    // 创建Blob对象
    const blob = new Blob([jsonStr], { type: 'application/json' })
    
    // 创建下载链接
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${strategy.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`
    
    // 触发下载
    document.body.appendChild(a)
    a.click()
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 0)
    
    ElMessage.success('策略导出成功')
  } catch (error) {
    ElMessage.error('导出失败: ' + error.message)
  }
}

// 确认删除策略
const confirmDelete = async () => {
  deleting.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800))
    
    ElMessage.success('策略删除成功')
    deleteDialogVisible.value = false
    emit('back-to-list')
  } catch (error) {
    ElMessage.error('删除失败: ' + error.message)
  } finally {
    deleting.value = false
  }
}

// 复制代码
const copyCode = () => {
  try {
    navigator.clipboard.writeText(strategy.code)
    ElMessage.success('代码已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败: ' + error.message)
  }
}

// 下载代码
const downloadCode = () => {
  try {
    // 创建Blob对象
    const blob = new Blob([strategy.code], { type: 'text/plain' })
    
    // 创建下载链接
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${strategy.name.replace(/\s+/g, '_')}.py`
    
    // 触发下载
    document.body.appendChild(a)
    a.click()
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 0)
    
    ElMessage.success('代码下载成功')
  } catch (error) {
    ElMessage.error('下载失败: ' + error.message)
  }
}

// 查看所有交易
const viewAllTrades = () => {
  ElMessage.info('查看全部交易功能开发中')
}

// 格式化收益率
const formatProfitRate = (rate) => {
  if (rate === undefined || rate === null) return '--'
  return `${rate >= 0 ? '+' : ''}${rate.toFixed(2)}%`
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return '--'
  try {
    const d = new Date(date)
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
  } catch (e) {
    return '--'
  }
}

// 格式化金额
const formatMoney = (amount) => {
  if (amount === undefined || amount === null) return '--'
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 获取策略类型标签
const getStrategyTypeLabel = (type) => {
  const found = strategyTypes.find(t => t.value === type)
  return found ? found.label : type
}

// 获取交易品种标签
const getSymbolLabel = (symbol) => {
  const found = symbols.find(s => s.value === symbol)
  return found ? found.label : symbol
}

// 获取时间周期标签
const getTimeframeLabel = (timeframe) => {
  const found = timeframes.find(t => t.value === timeframe)
  return found ? found.label : timeframe
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    active: '运行中',
    inactive: '已停用',
    error: '错误',
    pending: '等待中'
  }
  return statusMap[status] || status
}

// 获取状态标签类型
const getStatusTagType = (status) => {
  const typeMap = {
    active: 'success',
    inactive: 'info',
    error: 'danger',
    pending: 'warning'
  }
  return typeMap[status] || 'info'
}

onMounted(() => {
  loadStrategy()
})
</script>

<style scoped>
.strategy-detail-container {
  padding: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.header-left h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.strategy-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.last-updated {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.detail-content {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.info-card, .performance-card, .code-card, .trades-card {
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.description-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.description-section h4, .risk-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.description-section p {
  margin: 0;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

.risk-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.risk-item {
  text-align: center;
  padding: 12px 8px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 4px;
}

.risk-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.risk-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.performance-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.metric-item {
  flex: 1;
  min-width: 100px;
  padding: 12px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 4px;
  text-align: center;
}

.metric-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.metric-value {
  font-size: 18px;
  font-weight: 600;
}

.profit-positive {
  color: #67c23a;
}

.profit-negative {
  color: #f56c6c;
}

.negative {
  color: #f56c6c;
}

.chart-container {
  height: 200px;
  margin-top: 16px;
}

.chart-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--el-fill-color-lighter);
  border-radius: 4px;
  color: var(--el-text-color-secondary);
}

.code-container {
  height: 400px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: auto;
  background-color: #2d3748;
}

.code-display {
  height: 100%;
  margin: 0;
  padding: 16px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  color: #e2e8f0;
  background-color: #2d3748;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.code-actions {
  display: flex;
  gap: 8px;
}

.delete-dialog-content {
  text-align: center;
  padding: 20px 0;
}

.warning-icon {
  font-size: 48px;
  color: #e6a23c;
  margin-bottom: 16px;
}

.warning-text {
  color: #f56c6c;
  margin-top: 12px;
}
</style>
