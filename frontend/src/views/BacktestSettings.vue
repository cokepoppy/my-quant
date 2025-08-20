<template>
  <div class="backtest-settings">
    <div class="page-header">
      <h2>回测设置</h2>
      <div class="header-actions">
        <el-button type="primary" @click="runBacktest" :loading="isRunning">
          <el-icon><VideoPlay /></el-icon>
          {{ isRunning ? '回测中...' : '开始回测' }}
        </el-button>
        <el-button @click="saveConfig">
          <el-icon><Save /></el-icon>
          保存配置
        </el-button>
      </div>
    </div>

    <div class="backtest-content">
      <el-form :model="backtestForm" label-width="120px" class="backtest-form">
        <!-- 策略选择 -->
        <el-form-item label="选择策略" required>
          <el-select v-model="backtestForm.strategyId" placeholder="请选择策略" style="width: 300px">
            <el-option
              v-for="strategy in strategies"
              :key="strategy.id"
              :label="strategy.name"
              :value="strategy.id"
            />
          </el-select>
        </el-form-item>

        <!-- 回测时间范围 -->
        <el-form-item label="回测时间范围" required>
          <div class="date-range">
            <el-date-picker
              v-model="backtestForm.startDate"
              type="datetime"
              placeholder="开始时间"
              style="width: 200px"
            />
            <span class="date-separator">至</span>
            <el-date-picker
              v-model="backtestForm.endDate"
              type="datetime"
              placeholder="结束时间"
              style="width: 200px"
            />
          </div>
        </el-form-item>

        <!-- 初始资金 -->
        <el-form-item label="初始资金" required>
          <el-input-number
            v-model="backtestForm.initialCapital"
            :min="1000"
            :max="10000000"
            :step="1000"
            style="width: 200px"
          />
          <span class="unit-label">USD</span>
        </el-form-item>

        <!-- 交易品种 -->
        <el-form-item label="交易品种" required>
          <el-select
            v-model="backtestForm.symbols"
            multiple
            placeholder="选择交易品种"
            style="width: 400px"
          >
            <el-option
              v-for="symbol in availableSymbols"
              :key="symbol"
              :label="symbol"
              :value="symbol"
            />
          </el-select>
        </el-form-item>

        <!-- 手续费设置 -->
        <el-form-item label="手续费设置">
          <div class="fee-settings">
            <div class="fee-item">
              <label>手续费率</label>
              <el-input-number
                v-model="backtestForm.feeRate"
                :min="0"
                :max="1"
                :step="0.0001"
                :precision="4"
                style="width: 120px"
              />
              <span class="unit-label">%</span>
            </div>
            <div class="fee-item">
              <label>滑点设置</label>
              <el-input-number
                v-model="backtestForm.slippage"
                :min="0"
                :max="1"
                :step="0.0001"
                :precision="4"
                style="width: 120px"
              />
              <span class="unit-label">%</span>
            </div>
          </div>
        </el-form-item>

        <!-- 策略参数 -->
        <el-form-item label="策略参数">
          <div class="strategy-params">
            <div
              v-for="(param, index) in backtestForm.strategyParams"
              :key="index"
              class="param-item"
            >
              <el-input
                v-model="param.name"
                placeholder="参数名"
                style="width: 120px"
              />
              <el-input-number
                v-model="param.value"
                placeholder="值"
                style="width: 120px"
              />
              <el-button
                size="small"
                type="danger"
                @click="removeParam(index"
                :disabled="backtestForm.strategyParams.length === 1"
              >
                删除
              </el-button>
            </div>
            <el-button size="small" @click="addParam">
              <el-icon><Plus /></el-icon>
              添加参数
            </el-button>
          </div>
        </el-form-item>

        <!-- 高级设置 -->
        <el-form-item label="高级设置">
          <el-collapse v-model="advancedSettings">
            <el-collapse-item title="风险控制" name="risk">
              <div class="risk-settings">
                <div class="risk-item">
                  <label>最大仓位</label>
                  <el-input-number
                    v-model="backtestForm.maxPosition"
                    :min="0"
                    :max="1"
                    :step="0.1"
                    :precision="2"
                    style="width: 120px"
                  />
                  <span class="unit-label">%</span>
                </div>
                <div class="risk-item">
                  <label>止损比例</label>
                  <el-input-number
                    v-model="backtestForm.stopLoss"
                    :min="0"
                    :max="1"
                    :step="0.01"
                    :precision="2"
                    style="width: 120px"
                  />
                  <span class="unit-label">%</span>
                </div>
                <div class="risk-item">
                  <label>止盈比例</label>
                  <el-input-number
                    v-model="backtestForm.takeProfit"
                    :min="0"
                    :max="1"
                    :step="0.01"
                    :precision="2"
                    style="width: 120px"
                  />
                  <span class="unit-label">%</span>
                </div>
              </div>
            </el-collapse-item>
            
            <el-collapse-item title="输出设置" name="output">
              <div class="output-settings">
                <el-checkbox v-model="backtestForm.saveTrades">保存交易记录</el-checkbox>
                <el-checkbox v-model="backtestForm.saveChartData">保存图表数据</el-checkbox>
                <el-checkbox v-model="backtestForm.generateReport">生成详细报告</el-checkbox>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-form-item>
      </el-form>
    </div>

    <!-- 回测结果对话框 -->
    <el-dialog
      v-model="resultDialogVisible"
      title="回测结果"
      width="80%"
      :before-close="handleResultDialogClose"
    >
      <div v-if="backtestResult" class="backtest-result">
        <div class="result-summary">
          <div class="summary-item">
            <div class="summary-label">总收益率</div>
            <div class="summary-value" :class="backtestResult.totalReturn >= 0 ? 'positive' : 'negative'">
              {{ backtestResult.totalReturn >= 0 ? '+' : '' }}{{ backtestResult.totalReturn }}%
            </div>
          </div>
          <div class="summary-item">
            <div class="summary-label">年化收益率</div>
            <div class="summary-value" :class="backtestResult.annualReturn >= 0 ? 'positive' : 'negative'">
              {{ backtestResult.annualReturn >= 0 ? '+' : '' }}{{ backtestResult.annualReturn }}%
            </div>
          </div>
          <div class="summary-item">
            <div class="summary-label">夏普比率</div>
            <div class="summary-value">{{ backtestResult.sharpeRatio }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">最大回撤</div>
            <div class="summary-value negative">{{ backtestResult.maxDrawdown }}%</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">胜率</div>
            <div class="summary-value">{{ backtestResult.winRate }}%</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">总交易次数</div>
            <div class="summary-value">{{ backtestResult.totalTrades }}</div>
          </div>
        </div>
        
        <div class="result-actions">
          <el-button type="primary" @click="viewDetailedReport">查看详细报告</el-button>
          <el-button @click="exportResult">导出结果</el-button>
          <el-button @click="closeResultDialog">关闭</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import {
  VideoPlay,
  Save,
  Plus
} from '@element-plus/icons-vue'

interface Strategy {
  id: string
  name: string
}

interface StrategyParam {
  name: string
  value: number
}

interface BacktestForm {
  strategyId: string
  startDate: Date
  endDate: Date
  initialCapital: number
  symbols: string[]
  feeRate: number
  slippage: number
  strategyParams: StrategyParam[]
  maxPosition: number
  stopLoss: number
  takeProfit: number
  saveTrades: boolean
  saveChartData: boolean
  generateReport: boolean
}

interface BacktestResult {
  totalReturn: number
  annualReturn: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  totalTrades: number
}

const isRunning = ref(false)
const resultDialogVisible = ref(false)
const advancedSettings = ref(['risk'])

const strategies = ref<Strategy[]>([
  { id: '1', name: 'MA双均线策略' },
  { id: '2', name: '网格交易策略' },
  { id: '3', name: 'RSI超卖策略' }
])

const availableSymbols = ref([
  'BTC/USDT',
  'ETH/USDT',
  'BNB/USDT',
  'SOL/USDT',
  'XRP/USDT'
])

const backtestForm = reactive<BacktestForm>({
  strategyId: '',
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  endDate: new Date(),
  initialCapital: 10000,
  symbols: ['BTC/USDT'],
  feeRate: 0.001,
  slippage: 0.0005,
  strategyParams: [
    { name: 'period', value: 20 },
    { name: 'deviation', value: 2 }
  ],
  maxPosition: 0.8,
  stopLoss: 0.05,
  takeProfit: 0.1,
  saveTrades: true,
  saveChartData: true,
  generateReport: true
})

const backtestResult = ref<BacktestResult | null>(null)

const runBacktest = async () => {
  if (!backtestForm.strategyId) {
    ElMessage.warning('请选择策略')
    return
  }

  isRunning.value = true
  
  try {
    // 模拟回测过程
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // 模拟回测结果
    backtestResult.value = {
      totalReturn: 15.8,
      annualReturn: 18.5,
      sharpeRatio: 1.42,
      maxDrawdown: -8.2,
      winRate: 65.3,
      totalTrades: 156
    }
    
    resultDialogVisible.value = true
    ElMessage.success('回测完成')
  } catch (error) {
    ElMessage.error('回测失败')
  } finally {
    isRunning.value = false
  }
}

const saveConfig = () => {
  ElMessage.success('配置已保存')
}

const addParam = () => {
  backtestForm.strategyParams.push({ name: '', value: 0 })
}

const removeParam = (index: number) => {
  backtestForm.strategyParams.splice(index, 1)
}

const viewDetailedReport = () => {
  ElMessage.info('详细报告功能开发中')
}

const exportResult = () => {
  ElMessage.success('结果已导出')
}

const closeResultDialog = () => {
  resultDialogVisible.value = false
  backtestResult.value = null
}

const handleResultDialogClose = (done: Function) => {
  done()
}
</script>

<style scoped>
.backtest-settings {
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

.backtest-content {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 20px;
}

.backtest-form {
  max-width: 800px;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-separator {
  color: var(--secondary-text);
}

.unit-label {
  margin-left: 8px;
  color: var(--muted-text);
  font-size: 14px;
}

.fee-settings {
  display: flex;
  gap: 24px;
}

.fee-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fee-item label {
  min-width: 60px;
  color: var(--secondary-text);
}

.strategy-params {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.param-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.risk-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.risk-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.risk-item label {
  min-width: 80px;
  color: var(--secondary-text);
}

.output-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.backtest-result {
  padding: 20px;
}

.result-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-item {
  text-align: center;
  padding: 16px;
  background: var(--secondary-bg);
  border-radius: 8px;
}

.summary-label {
  font-size: 12px;
  color: var(--muted-text);
  margin-bottom: 8px;
}

.summary-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--secondary-text);
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.positive {
  color: var(--positive-color) !important;
}

.negative {
  color: var(--negative-color) !important;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-form-item__label) {
  color: var(--secondary-text);
}

:deep(.el-input__wrapper) {
  background: var(--card-bg);
  border-color: var(--border-color);
}

:deep(.el-input__inner) {
  color: var(--secondary-text);
}

:deep(.el-select .el-input__wrapper) {
  background: var(--card-bg);
  border-color: var(--border-color);
}

:deep(.el-date-editor.el-input__wrapper) {
  background: var(--card-bg);
  border-color: var(--border-color);
}

:deep(.el-collapse) {
  border: 1px solid var(--border-color);
}

:deep(.el-collapse-item__header) {
  background: var(--card-bg);
  color: var(--secondary-text);
  border-bottom: 1px solid var(--border-color);
}

:deep(.el-collapse-item__content) {
  background: var(--card-bg);
  color: var(--secondary-text);
}

:deep(.el-checkbox__label) {
  color: var(--secondary-text);
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

:deep(.el-button--primary) {
  background: var(--brand-secondary);
  border-color: var(--brand-secondary);
  color: var(--primary-bg);
}

:deep(.el-dialog) {
  background: var(--secondary-bg);
  border: 1px solid var(--border-color);
}

:deep(.el-dialog__header) {
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
}

:deep(.el-dialog__title) {
  color: var(--primary-text);
}

:deep(.el-dialog__body) {
  background: var(--secondary-bg);
  color: var(--secondary-text);
}
</style>