<template>
  <el-dialog
    v-model="visible"
    title="回测配置"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      class="backtest-config-form"
    >
      <!-- 基本信息 -->
      <div class="config-section">
        <h3>基本信息</h3>
        <el-form-item label="回测名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入回测名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="回测描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入回测描述"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </div>

      <!-- 数据配置 -->
      <div class="config-section">
        <h3>数据配置</h3>
        <el-form-item label="交易品种" prop="symbol">
          <el-select
            v-model="form.symbol"
            placeholder="请选择交易品种"
            style="width: 100%"
          >
            <el-option label="BTC/USDT" value="BTCUSDT" />
            <el-option label="ETH/USDT" value="ETHUSDT" />
            <el-option label="BNB/USDT" value="BNBUSDT" />
            <el-option label="ADA/USDT" value="ADAUSDT" />
            <el-option label="DOT/USDT" value="DOTUSDT" />
          </el-select>
        </el-form-item>

        <el-form-item label="时间周期" prop="timeframe">
          <el-select
            v-model="form.timeframe"
            placeholder="请选择时间周期"
            style="width: 100%"
          >
            <el-option label="1分钟" value="1m" />
            <el-option label="5分钟" value="5m" />
            <el-option label="15分钟" value="15m" />
            <el-option label="30分钟" value="30m" />
            <el-option label="1小时" value="1h" />
            <el-option label="4小时" value="4h" />
            <el-option label="1天" value="1d" />
            <el-option label="1周" value="1w" />
          </el-select>
        </el-form-item>

        <el-form-item label="回测时间段" prop="dateRange">
          <el-date-picker
            v-model="form.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :disabled-date="disabledDate"
            style="width: 100%"
          />
        </el-form-item>
      </div>

      <!-- 资金管理 -->
      <div class="config-section">
        <h3>资金管理</h3>
        <el-form-item label="初始资金" prop="initialCapital">
          <el-input-number
            v-model="form.initialCapital"
            :min="1000"
            :max="10000000"
            :step="1000"
            :precision="2"
            style="width: 200px"
          />
          <span style="margin-left: 10px">USDT</span>
        </el-form-item>

        <el-form-item label="最大仓位" prop="maxPositionSize">
          <el-input-number
            v-model="form.maxPositionSize"
            :min="1"
            :max="100"
            :step="1"
            :precision="0"
            style="width: 200px"
          />
          <span style="margin-left: 10px">%</span>
        </el-form-item>

        <el-form-item label="杠杆倍数" prop="leverage">
          <el-input-number
            v-model="form.leverage"
            :min="1"
            :max="100"
            :step="1"
            :precision="0"
            style="width: 200px"
          />
          <span style="margin-left: 10px">倍</span>
        </el-form-item>
      </div>

      <!-- 风险管理 -->
      <div class="config-section">
        <h3>风险管理</h3>
        <el-form-item label="止损比例" prop="stopLoss">
          <el-input-number
            v-model="form.stopLoss"
            :min="0.1"
            :max="50"
            :step="0.1"
            :precision="1"
            style="width: 200px"
          />
          <span style="margin-left: 10px">%</span>
        </el-form-item>

        <el-form-item label="止盈比例" prop="takeProfit">
          <el-input-number
            v-model="form.takeProfit"
            :min="0.1"
            :max="100"
            :step="0.1"
            :precision="1"
            style="width: 200px"
          />
          <span style="margin-left: 10px">%</span>
        </el-form-item>

        <el-form-item label="最大风险" prop="maxRiskPerTrade">
          <el-input-number
            v-model="form.maxRiskPerTrade"
            :min="0.1"
            :max="10"
            :step="0.1"
            :precision="1"
            style="width: 200px"
          />
          <span style="margin-left: 10px">%</span>
        </el-form-item>
      </div>

      <!-- 交易成本 -->
      <div class="config-section">
        <h3>交易成本</h3>
        <el-form-item label="手续费率" prop="commission">
          <el-input-number
            v-model="form.commission"
            :min="0"
            :max="1"
            :step="0.01"
            :precision="3"
            style="width: 200px"
          />
          <span style="margin-left: 10px">%</span>
        </el-form-item>

        <el-form-item label="滑点" prop="slippage">
          <el-input-number
            v-model="form.slippage"
            :min="0"
            :max="1"
            :step="0.01"
            :precision="3"
            style="width: 200px"
          />
          <span style="margin-left: 10px">%</span>
        </el-form-item>
      </div>

      <!-- 策略参数 -->
      <div class="config-section">
        <h3>策略参数</h3>
        <div v-if="strategyParams.length > 0">
          <el-form-item
            v-for="param in strategyParams"
            :key="param.name"
            :label="param.label"
            :prop="`params.${param.name}`"
          >
            <el-input-number
              v-model="form.params[param.name]"
              :min="param.min"
              :max="param.max"
              :step="param.step"
              :precision="param.precision"
              style="width: 200px"
            />
            <span style="margin-left: 10px">{{ param.unit }}</span>
          </el-form-item>
        </div>
        <div v-else class="no-params">
          <p>该策略无可配置参数</p>
        </div>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          开始回测
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

interface Props {
  modelValue: boolean
  strategy: any
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', config: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)

// 对话框可见性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 表单数据
const form = reactive({
  name: '',
  description: '',
  symbol: 'BTCUSDT',
  timeframe: '1h',
  dateRange: [] as Date[],
  initialCapital: 10000,
  maxPositionSize: 20,
  leverage: 1,
  stopLoss: 2.0,
  takeProfit: 5.0,
  maxRiskPerTrade: 2.0,
  commission: 0.1,
  slippage: 0.05,
  params: {} as Record<string, any>
})

// 策略参数配置
const strategyParams = ref([
  {
    name: 'shortPeriod',
    label: '短期均线周期',
    min: 5,
    max: 50,
    step: 1,
    precision: 0,
    unit: '天',
    default: 10
  },
  {
    name: 'longPeriod',
    label: '长期均线周期',
    min: 20,
    max: 200,
    step: 1,
    precision: 0,
    unit: '天',
    default: 30
  }
])

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入回测名称', trigger: 'blur' },
    { min: 2, max: 50, message: '回测名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  symbol: [
    { required: true, message: '请选择交易品种', trigger: 'change' }
  ],
  timeframe: [
    { required: true, message: '请选择时间周期', trigger: 'change' }
  ],
  dateRange: [
    { required: true, message: '请选择回测时间段', trigger: 'change' }
  ],
  initialCapital: [
    { required: true, message: '请输入初始资金', trigger: 'blur' },
    { type: 'number', min: 1000, message: '初始资金不能少于1000', trigger: 'blur' }
  ],
  maxPositionSize: [
    { required: true, message: '请输入最大仓位', trigger: 'blur' },
    { type: 'number', min: 1, max: 100, message: '最大仓位在1-100之间', trigger: 'blur' }
  ],
  stopLoss: [
    { required: true, message: '请输入止损比例', trigger: 'blur' },
    { type: 'number', min: 0.1, max: 50, message: '止损比例在0.1-50之间', trigger: 'blur' }
  ],
  takeProfit: [
    { required: true, message: '请输入止盈比例', trigger: 'blur' },
    { type: 'number', min: 0.1, max: 100, message: '止盈比例在0.1-100之间', trigger: 'blur' }
  ]
}

// 禁用未来日期
const disabledDate = (time: Date) => {
  return time > new Date()
}

// 初始化表单数据
const initForm = () => {
  if (props.strategy) {
    form.name = `${props.strategy.name}_回测_${new Date().toLocaleDateString()}`
    form.description = `策略 ${props.strategy.name} 的回测测试`
    
    // 根据策略设置默认参数
    strategyParams.value.forEach(param => {
      form.params[param.name] = param.default
    })
    
    // 设置默认时间范围（最近3个月）
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 3)
    form.dateRange = [startDate, endDate]
  }
}

// 处理提交
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    // 构建回测配置
    const config = {
      strategyId: props.strategy.id,
      name: form.name,
      description: form.description,
      symbols: [form.symbol], // 后端需要数组格式
      timeframe: form.timeframe,
      startDate: form.dateRange[0],
      endDate: form.dateRange[1],
      initialCapital: form.initialCapital,
      maxPositionSize: form.maxPositionSize,
      leverage: form.leverage,
      stopLoss: form.stopLoss,
      takeProfit: form.takeProfit,
      maxRiskPerTrade: form.maxRiskPerTrade,
      commission: form.commission,
      slippage: form.slippage,
      params: form.params
    }
    
    loading.value = true
    
    // 发送配置到父组件
    emit('submit', config)
    
    // 关闭对话框
    visible.value = false
    
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    loading.value = false
  }
}

// 处理关闭
const handleClose = () => {
  visible.value = false
}

// 监听对话框打开
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    initForm()
  }
})
</script>

<style scoped>
.backtest-config-form {
  max-height: 600px;
  overflow-y: auto;
}

.config-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.config-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.config-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.dialog-footer {
  text-align: right;
}

.no-params {
  text-align: center;
  color: var(--el-text-color-secondary);
  padding: 20px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-date-editor) {
  width: 100%;
}
</style>