<template>
  <div class="create-strategy">
    <div class="page-header">
      <h2>创建策略</h2>
      <el-button @click="$router.go(-1)">返回</el-button>
    </div>
    
    <el-card>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="策略名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入策略名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="策略描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入策略描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="策略类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择策略类型">
            <el-option label="趋势跟踪" value="trend" />
            <el-option label="均值回归" value="mean_reversion" />
            <el-option label="套利" value="arbitrage" />
            <el-option label="高频交易" value="high_frequency" />
            <el-option label="机器学习" value="machine_learning" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="交易品种" prop="symbol">
          <el-select
            v-model="form.symbol"
            placeholder="请选择交易品种"
            filterable
            allow-create
          >
            <el-option label="BTC/USDT" value="BTC/USDT" />
            <el-option label="ETH/USDT" value="ETH/USDT" />
            <el-option label="BNB/USDT" value="BNB/USDT" />
            <el-option label="ADA/USDT" value="ADA/USDT" />
            <el-option label="DOT/USDT" value="DOT/USDT" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="时间周期" prop="timeframe">
          <el-select v-model="form.timeframe" placeholder="请选择时间周期">
            <el-option label="1分钟" value="1m" />
            <el-option label="5分钟" value="5m" />
            <el-option label="15分钟" value="15m" />
            <el-option label="30分钟" value="30m" />
            <el-option label="1小时" value="1h" />
            <el-option label="4小时" value="4h" />
            <el-option label="1天" value="1d" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="初始资金" prop="initialCapital">
          <el-input-number
            v-model="form.initialCapital"
            :min="100"
            :max="1000000"
            :step="100"
            :precision="2"
          />
          <span style="margin-left: 10px;">USDT</span>
        </el-form-item>
        
        <el-form-item label="风险参数">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="最大仓位" prop="maxPosition">
                <el-input-number
                  v-model="form.maxPosition"
                  :min="1"
                  :max="100"
                  :step="1"
                  :precision="0"
                />
                <span style="margin-left: 10px;">%</span>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="止损比例" prop="stopLoss">
                <el-input-number
                  v-model="form.stopLoss"
                  :min="0.1"
                  :max="10"
                  :step="0.1"
                  :precision="1"
                />
                <span style="margin-left: 10px;">%</span>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="止盈比例" prop="takeProfit">
                <el-input-number
                  v-model="form.takeProfit"
                  :min="0.1"
                  :max="20"
                  :step="0.1"
                  :precision="1"
                />
                <span style="margin-left: 10px;">%</span>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form-item>
        
        <el-form-item label="策略代码" prop="code">
          <div class="code-editor">
            <el-input
              v-model="form.code"
              type="textarea"
              :rows="20"
              placeholder="请输入策略代码"
            />
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSubmit">创建策略</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button @click="handleBacktest">回测</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

const router = useRouter()
const formRef = ref<FormInstance>()

const form = reactive({
  name: '',
  description: '',
  type: '',
  symbol: '',
  timeframe: '',
  initialCapital: 10000,
  maxPosition: 10,
  stopLoss: 2,
  takeProfit: 3,
  code: ''
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入策略名称', trigger: 'blur' },
    { min: 2, max: 50, message: '策略名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入策略描述', trigger: 'blur' },
    { max: 500, message: '策略描述最多500个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择策略类型', trigger: 'change' }
  ],
  symbol: [
    { required: true, message: '请选择交易品种', trigger: 'change' }
  ],
  timeframe: [
    { required: true, message: '请选择时间周期', trigger: 'change' }
  ],
  initialCapital: [
    { required: true, message: '请输入初始资金', trigger: 'blur' },
    { type: 'number', min: 100, message: '初始资金不能少于100', trigger: 'blur' }
  ],
  maxPosition: [
    { required: true, message: '请输入最大仓位', trigger: 'blur' },
    { type: 'number', min: 1, max: 100, message: '最大仓位在1-100之间', trigger: 'blur' }
  ],
  stopLoss: [
    { required: true, message: '请输入止损比例', trigger: 'blur' },
    { type: 'number', min: 0.1, max: 10, message: '止损比例在0.1-10之间', trigger: 'blur' }
  ],
  takeProfit: [
    { required: true, message: '请输入止盈比例', trigger: 'blur' },
    { type: 'number', min: 0.1, max: 20, message: '止盈比例在0.1-20之间', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入策略代码', trigger: 'blur' }
  ]
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    // TODO: 调用API创建策略
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('策略创建成功')
    router.push('/strategies')
  } catch (error) {
    console.error('Form validation failed:', error)
  }
}

const handleReset = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

const handleBacktest = () => {
  // TODO: 实现回测逻辑
  ElMessage.info('回测功能开发中')
}
</script>

<style scoped>
.create-strategy {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #333;
}

.code-editor {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.code-editor :deep(.el-textarea__inner) {
  border: none;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
}
</style>