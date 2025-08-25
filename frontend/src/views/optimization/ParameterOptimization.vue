<template>
  <div class="parameter-optimization">
    <div class="page-header">
      <h2>参数优化</h2>
      <div class="header-actions">
        <el-button type="primary" @click="runOptimization" :loading="isOptimizing">
          <el-icon><VideoPlay /></el-icon>
          {{ isOptimizing ? '优化中...' : '开始优化' }}
        </el-button>
        <el-button @click="saveConfig">
          <el-icon><DocumentAdd /></el-icon>
          保存配置
        </el-button>
      </div>
    </div>

    <div class="optimization-content">
      <el-form :model="optimizationForm" label-width="120px" class="optimization-form">
        <!-- 策略选择 -->
        <el-form-item label="选择策略" required>
          <el-select v-model="optimizationForm.strategyId" placeholder="请选择策略" style="width: 300px">
            <el-option
              v-for="strategy in strategies"
              :key="strategy.id"
              :label="strategy.name"
              :value="strategy.id"
            />
          </el-select>
        </el-form-item>

        <!-- 优化目标 -->
        <el-form-item label="优化目标" required>
          <el-radio-group v-model="optimizationForm.objective">
            <el-radio label="sharpe">夏普比率</el-radio>
            <el-radio label="profit">总收益</el-radio>
            <el-radio label="winrate">胜率</el-radio>
            <el-radio label="maxdrawdown">最大回撤</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 优化算法 -->
        <el-form-item label="优化算法" required>
          <el-select v-model="optimizationForm.algorithm" placeholder="请选择优化算法" style="width: 200px">
            <el-option label="网格搜索" value="grid" />
            <el-option label="遗传算法" value="genetic" />
            <el-option label="贝叶斯优化" value="bayesian" />
            <el-option label="粒子群优化" value="pso" />
          </el-select>
        </el-form-item>

        <!-- 参数范围设置 -->
        <el-form-item label="参数范围">
          <div class="parameter-ranges">
            <div v-for="(param, index) in optimizationForm.parameters" :key="index" class="parameter-item">
              <el-input 
                v-model="param.name" 
                placeholder="参数名" 
                style="width: 120px; margin-right: 8px"
              />
              <el-input-number 
                v-model="param.min" 
                placeholder="最小值" 
                :min="-1000" 
                :max="1000"
                style="width: 100px; margin-right: 8px"
              />
              <el-input-number 
                v-model="param.max" 
                placeholder="最大值" 
                :min="-1000" 
                :max="1000"
                style="width: 100px; margin-right: 8px"
              />
              <el-input-number 
                v-model="param.step" 
                placeholder="步长" 
                :min="0.001" 
                :max="100"
                :step="0.001"
                style="width: 100px; margin-right: 8px"
              />
              <el-button @click="removeParameter(index)" type="danger" circle>
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button @click="addParameter" type="primary" plain>
              <el-icon><Plus /></el-icon>
              添加参数
            </el-button>
          </div>
        </el-form-item>

        <!-- 回测时间范围 -->
        <el-form-item label="回测时间范围" required>
          <div class="date-range">
            <el-date-picker
              v-model="optimizationForm.startDate"
              type="datetime"
              placeholder="开始时间"
              style="width: 200px"
            />
            <span class="date-separator">至</span>
            <el-date-picker
              v-model="optimizationForm.endDate"
              type="datetime"
              placeholder="结束时间"
              style="width: 200px"
            />
          </div>
        </el-form-item>

        <!-- 初始资金 -->
        <el-form-item label="初始资金" required>
          <el-input-number 
            v-model="optimizationForm.initialCapital" 
            :min="1000" 
            :max="10000000"
            :step="1000"
            style="width: 200px"
          />
        </el-form-item>

        <!-- 优化设置 -->
        <el-form-item label="优化设置">
          <el-checkbox-group v-model="optimizationForm.settings">
            <el-checkbox label="parallel">并行计算</el-checkbox>
            <el-checkbox label="earlyStopping">早停机制</el-checkbox>
            <el-checkbox label="crossValidation">交叉验证</el-checkbox>
            <el-checkbox label="saveResults">保存结果</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <!-- 进度显示 -->
        <el-form-item v-if="isOptimizing" label="优化进度">
          <el-progress :percentage="optimizationProgress" :status="progressStatus" />
          <div class="progress-info">
            <span>当前最优: {{ bestResult || '计算中...' }}</span>
            <span>剩余时间: {{ estimatedTime || '计算中...' }}</span>
          </div>
        </el-form-item>
      </el-form>
    </div>

    <!-- 优化结果 -->
    <div v-if="optimizationResults.length > 0" class="results-section">
      <h3>优化结果</h3>
      <el-table :data="optimizationResults" style="width: 100%">
        <el-table-column prop="rank" label="排名" width="80" />
        <el-table-column prop="parameters" label="参数" width="200" />
        <el-table-column prop="objective" label="目标值" width="120" />
        <el-table-column prop="sharpe" label="夏普比率" width="120" />
        <el-table-column prop="profit" label="总收益" width="120" />
        <el-table-column prop="winrate" label="胜率" width="120" />
        <el-table-column prop="maxDrawdown" label="最大回撤" width="120" />
        <el-table-column prop="trades" label="交易次数" width="120" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button @click="viewResult(scope.row)" type="primary" size="small">
              查看详情
            </el-button>
            <el-button @click="useParameters(scope.row)" type="success" size="small">
              使用参数
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay, DocumentAdd, Delete, Plus } from '@element-plus/icons-vue'

interface Strategy {
  id: string
  name: string
  description: string
}

interface ParameterRange {
  name: string
  min: number
  max: number
  step: number
}

interface OptimizationResult {
  rank: number
  parameters: string
  objective: number
  sharpe: number
  profit: number
  winrate: number
  maxDrawdown: number
  trades: number
  details?: any
}

const strategies = ref<Strategy[]>([])
const isOptimizing = ref(false)
const optimizationProgress = ref(0)
const progressStatus = ref('')
const bestResult = ref('')
const estimatedTime = ref('')
const optimizationResults = ref<OptimizationResult[]>([])

const optimizationForm = reactive({
  strategyId: '',
  objective: 'sharpe',
  algorithm: 'grid',
  parameters: [
    { name: 'fastPeriod', min: 5, max: 20, step: 1 },
    { name: 'slowPeriod', min: 20, max: 50, step: 1 }
  ] as ParameterRange[],
  startDate: '',
  endDate: '',
  initialCapital: 100000,
  settings: ['parallel', 'saveResults']
})

const addParameter = () => {
  optimizationForm.parameters.push({
    name: '',
    min: 0,
    max: 100,
    step: 1
  })
}

const removeParameter = (index: number) => {
  optimizationForm.parameters.splice(index, 1)
}

const runOptimization = async () => {
  if (!optimizationForm.strategyId) {
    ElMessage.error('请选择策略')
    return
  }

  isOptimizing.value = true
  optimizationProgress.value = 0
  progressStatus.value = ''
  bestResult.value = '0.00'
  estimatedTime.value = '计算中...'
  optimizationResults.value = []

  try {
    // 模拟优化过程
    const totalSteps = 100
    for (let i = 0; i <= totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, 100))
      optimizationProgress.value = (i / totalSteps) * 100
      
      if (i === 20) progressStatus.value = ''
      if (i === 50) bestResult.value = '1.25'
      if (i === 80) progressStatus.value = 'success'
      
      const remainingTime = Math.ceil((totalSteps - i) * 0.1)
      estimatedTime.value = `${remainingTime}秒`
    }

    // 生成模拟结果
    optimizationResults.value = [
      {
        rank: 1,
        parameters: 'fast:12, slow:26',
        objective: 1.45,
        sharpe: 1.45,
        profit: 15680,
        winrate: 68.5,
        maxDrawdown: -8.2,
        trades: 142
      },
      {
        rank: 2,
        parameters: 'fast:10, slow:30',
        objective: 1.32,
        sharpe: 1.32,
        profit: 12450,
        winrate: 65.2,
        maxDrawdown: -9.1,
        trades: 128
      },
      {
        rank: 3,
        parameters: 'fast:15, slow:35',
        objective: 1.28,
        sharpe: 1.28,
        profit: 11890,
        winrate: 63.8,
        maxDrawdown: -8.9,
        trades: 135
      }
    ]

    ElMessage.success('参数优化完成！')
  } catch (error) {
    ElMessage.error('优化过程中出现错误')
    progressStatus.value = 'exception'
  } finally {
    isOptimizing.value = false
  }
}

const saveConfig = () => {
  ElMessage.success('配置已保存')
}

const viewResult = (result: OptimizationResult) => {
  ElMessage.info(`查看参数组合详情: ${result.parameters}`)
}

const useParameters = (result: OptimizationResult) => {
  ElMessage.success(`已应用参数组合: ${result.parameters}`)
}

onMounted(() => {
  // 模拟策略数据
  strategies.value = [
    { id: '1', name: '双均线策略', description: '基于快慢均线的交叉信号进行交易' },
    { id: '2', name: 'RSI策略', description: '基于RSI指标的超买超卖信号' },
    { id: '3', name: 'MACD策略', description: '基于MACD指标的趋势跟踪策略' }
  ]

  // 设置默认时间范围
  const now = new Date()
  optimizationForm.endDate = now.toISOString()
  optimizationForm.startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
})
</script>

<style scoped>
.parameter-optimization {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--primary-text);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.optimization-content {
  background: var(--primary-bg);
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
}

.optimization-form {
  max-width: 800px;
}

.parameter-ranges {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.parameter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-separator {
  color: var(--secondary-text);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 14px;
  color: var(--secondary-text);
}

.results-section {
  background: var(--primary-bg);
  border-radius: 8px;
  padding: 24px;
}

.results-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--primary-text);
}
</style>