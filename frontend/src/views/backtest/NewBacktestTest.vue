<template>
  <div class="new-backtest-test">
    <div class="page-header">
      <h2>新回测引擎测试</h2>
      <div class="header-actions">
        <el-button type="primary" @click="startNewBacktest" :loading="isRunning">
          <el-icon><VideoPlay /></el-icon>
          {{ isRunning ? '回测中...' : '启动新回测' }}
        </el-button>
        <el-button @click="loadBacktests">
          <el-icon><Refresh /></el-icon>
          刷新列表
        </el-button>
      </div>
    </div>

    <!-- 回测配置 -->
    <el-card class="config-card" v-if="!selectedBacktest">
      <template #header>
        <span>回测配置</span>
      </template>
      
      <el-form :model="backtestForm" label-width="120px">
        <el-form-item label="策略">
          <el-select v-model="backtestForm.strategyId" placeholder="选择策略">
            <el-option
              v-for="strategy in strategies"
              :key="strategy.id"
              :label="strategy.name"
              :value="strategy.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="回测名称">
          <el-input v-model="backtestForm.name" placeholder="输入回测名称" />
        </el-form-item>

        <el-form-item label="交易标的">
          <el-select
            v-model="backtestForm.symbols"
            multiple
            placeholder="选择交易标的"
          >
            <el-option label="BTCUSDT" value="BTCUSDT" />
            <el-option label="ETHUSDT" value="ETHUSDT" />
            <el-option label="BNBUSDT" value="BNBUSDT" />
          </el-select>
        </el-form-item>

        <el-form-item label="时间框架">
          <el-select v-model="backtestForm.timeframe">
            <el-option label="1分钟" value="1m" />
            <el-option label="5分钟" value="5m" />
            <el-option label="15分钟" value="15m" />
            <el-option label="1小时" value="1h" />
            <el-option label="4小时" value="4h" />
            <el-option label="1天" value="1d" />
          </el-select>
        </el-form-item>

        <el-form-item label="时间范围">
          <div class="date-range">
            <el-date-picker
              v-model="backtestForm.startDate"
              type="datetime"
              placeholder="开始时间"
            />
            <span class="separator">至</span>
            <el-date-picker
              v-model="backtestForm.endDate"
              type="datetime"
              placeholder="结束时间"
            />
          </div>
        </el-form-item>

        <el-form-item label="初始资金">
          <el-input-number
            v-model="backtestForm.initialCapital"
            :min="1000"
            :step="1000"
          />
        </el-form-item>

        <el-form-item label="手续费率">
          <el-input-number
            v-model="backtestForm.commission"
            :min="0"
            :max="1"
            :step="0.001"
            :precision="3"
          />
        </el-form-item>

        <el-form-item label="滑点率">
          <el-input-number
            v-model="backtestForm.slippage"
            :min="0"
            :max="1"
            :step="0.001"
            :precision="3"
          />
        </el-form-item>

        <el-form-item label="杠杆倍数">
          <el-input-number
            v-model="backtestForm.leverage"
            :min="1"
            :max="125"
            :step="1"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 回测列表 -->
    <el-card class="backtest-list">
      <template #header>
        <span>回测记录</span>
      </template>
      
      <el-table :data="backtests" style="width: 100%">
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="strategy.name" label="策略" />
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="进度">
          <template #default="scope">
            <el-progress
              v-if="scope.row.status === 'running'"
              :percentage="scope.row.progress * 100"
              :status="scope.row.progress === 1 ? 'success' : ''"
            />
            <span v-else>{{ scope.row.progress * 100 }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="currentStep" label="当前步骤" />
        <el-table-column prop="totalReturn" label="收益率">
          <template #default="scope">
            <span v-if="scope.row.results" :class="scope.row.results.totalReturn > 0 ? 'positive' : 'negative'">
              {{ (scope.row.results.totalReturn * 100).toFixed(2) }}%
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间">
          <template #default="scope">
            {{ new Date(scope.row.createdAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button
              size="small"
              @click="viewBacktest(scope.row)"
            >
              查看
            </el-button>
            <el-button
              v-if="scope.row.status === 'running'"
              size="small"
              type="warning"
              @click="cancelBacktest(scope.row.id)"
            >
              取消
            </el-button>
            <el-button
              v-if="scope.row.status !== 'running'"
              size="small"
              type="danger"
              @click="deleteBacktest(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 回测详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="回测详情"
      width="80%"
    >
      <div v-if="selectedBacktest">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="策略名称">
            {{ selectedBacktest.strategy?.name }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedBacktest.status)">
              {{ selectedBacktest.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="初始资金">
            ${{ selectedBacktest.initialCapital.toLocaleString() }}
          </el-descriptions-item>
          <el-descriptions-item label="最终资金">
            <span v-if="selectedBacktest.finalCapital">
              ${{ selectedBacktest.finalCapital.toLocaleString() }}
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="总收益率">
            <span v-if="selectedBacktest.results" :class="selectedBacktest.results.totalReturn > 0 ? 'positive' : 'negative'">
              {{ (selectedBacktest.results.totalReturn * 100).toFixed(2) }}%
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="夏普比率">
            <span v-if="selectedBacktest.results">
              {{ selectedBacktest.results.sharpeRatio.toFixed(2) }}
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="最大回撤">
            <span v-if="selectedBacktest.results" class="negative">
              {{ (selectedBacktest.results.maxDrawdown * 100).toFixed(2) }}%
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="胜率">
            <span v-if="selectedBacktest.results">
              {{ (selectedBacktest.results.winRate * 100).toFixed(2) }}%
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 交易记录 -->
        <div class="trades-section">
          <h3>交易记录</h3>
          <el-table :data="selectedBacktest.trades" style="width: 100%">
            <el-table-column prop="timestamp" label="时间">
              <template #default="scope">
                {{ new Date(scope.row.timestamp).toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="symbol" label="标的" />
            <el-table-column prop="type" label="类型">
              <template #default="scope">
                <el-tag :type="scope.row.type === 'buy' ? 'success' : 'danger'">
                  {{ scope.row.type === 'buy' ? '买入' : '卖出' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" />
            <el-table-column prop="price" label="价格">
              <template #default="scope">
                ${{ scope.row.price.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="pnl" label="盈亏">
              <template #default="scope">
                <span :class="scope.row.pnl > 0 ? 'positive' : 'negative'">
                  {{ scope.row.pnl ? scope.row.pnl.toFixed(2) : '-' }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  startBacktest,
  getBacktestHistory,
  getBacktestResults,
  cancelBacktest,
  deleteBacktest as deleteBacktestAPI,
  getStrategies
} from '@/api/backtest'
import type { BacktestConfig, BacktestResult } from '@/types/backtest'

const isRunning = ref(false)
const backtests = ref<BacktestResult[]>([])
const strategies = ref<any[]>([])
const selectedBacktest = ref<BacktestResult | null>(null)
const detailDialogVisible = ref(false)

const backtestForm = reactive<BacktestConfig>({
  strategyId: '',
  name: '',
  description: '',
  symbols: ['BTCUSDT'],
  timeframe: '1h',
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天前
  endDate: new Date(),
  initialCapital: 10000,
  commission: 0.001,
  slippage: 0.001,
  leverage: 1,
  riskLimits: ['maxDrawdown'],
  outputOptions: ['trades', 'dailyReturns', 'drawdown']
})

const getStatusType = (status: string) => {
  switch (status) {
    case 'completed': return 'success'
    case 'running': return 'warning'
    case 'failed': return 'danger'
    case 'cancelled': return 'info'
    default: return 'info'
  }
}

const startNewBacktest = async () => {
  if (!backtestForm.strategyId) {
    ElMessage.warning('请选择策略')
    return
  }
  
  if (!backtestForm.name) {
    ElMessage.warning('请输入回测名称')
    return
  }

  try {
    isRunning.value = true
    await startBacktest(backtestForm)
    ElMessage.success('回测已启动')
    await loadBacktests()
  } catch (error: any) {
    ElMessage.error(`启动回测失败: ${error.message}`)
  } finally {
    isRunning.value = false
  }
}

const loadBacktests = async () => {
  try {
    const response = await getBacktestHistory()
    backtests.value = response.data.backtests || []
  } catch (error: any) {
    ElMessage.error(`加载回测列表失败: ${error.message}`)
  }
}

const loadStrategies = async () => {
  try {
    const response = await getStrategies()
    strategies.value = response.data.strategies || []
  } catch (error: any) {
    ElMessage.error(`加载策略列表失败: ${error.message}`)
  }
}

const viewBacktest = (backtest: BacktestResult) => {
  selectedBacktest.value = backtest
  detailDialogVisible.value = true
}

const cancelBacktest = async (id: string) => {
  try {
    await cancelBacktest(id)
    ElMessage.success('回测已取消')
    await loadBacktests()
  } catch (error: any) {
    ElMessage.error(`取消回测失败: ${error.message}`)
  }
}

const deleteBacktest = async (id: string) => {
  try {
    await deleteBacktestAPI(id)
    ElMessage.success('回测已删除')
    await loadBacktests()
  } catch (error: any) {
    ElMessage.error(`删除回测失败: ${error.message}`)
  }
}

onMounted(() => {
  loadBacktests()
  loadStrategies()
})
</script>

<style scoped>
.new-backtest-test {
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

.config-card {
  margin-bottom: 20px;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 10px;
}

.separator {
  color: #666;
}

.backtest-list {
  margin-bottom: 20px;
}

.positive {
  color: #67c23a;
  font-weight: bold;
}

.negative {
  color: #f56c6c;
  font-weight: bold;
}

.trades-section {
  margin-top: 20px;
}

.trades-section h3 {
  margin-bottom: 15px;
  color: #333;
}
</style>