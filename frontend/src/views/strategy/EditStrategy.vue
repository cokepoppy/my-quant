<template>
  <div class="edit-strategy">
    <div class="page-header">
      <h2>编辑策略</h2>
      <div class="header-actions">
        <el-button @click="backToList">返回列表</el-button>
        <el-button @click="saveStrategy" :icon="Document" size="large" type="primary" :loading="saving">
          保存策略
        </el-button>
      </div>
    </div>

    <div class="strategy-content">
      <el-form :model="strategyForm" label-width="120px">
        <!-- 基本信息 -->
        <el-card class="form-section">
          <template #header>
            <div class="card-header">
              <el-icon><InfoFilled /></el-icon>
              <span>基本信息</span>
            </div>
          </template>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="策略名称" required>
                <el-input v-model="strategyForm.name" placeholder="请输入策略名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="策略类型" required>
                <el-select v-model="strategyForm.type" placeholder="请选择策略类型">
                  <el-option label="趋势跟踪" value="trend" />
                  <el-option label="均值回归" value="mean_reversion" />
                  <el-option label="套利" value="arbitrage" />
                  <el-option label="高频" value="high_frequency" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="策略描述">
            <el-input 
              v-model="strategyForm.description" 
              type="textarea" 
              :rows="3" 
              placeholder="请输入策略描述"
            />
          </el-form-item>
        </el-card>

        <!-- 策略参数 -->
        <el-card class="form-section">
          <template #header>
            <div class="card-header">
              <el-icon><Setting /></el-icon>
              <span>策略参数</span>
            </div>
          </template>
          
          <div class="parameters-list">
            <div v-for="(param, index) in strategyForm.parameters" :key="index" class="parameter-item">
              <el-row :gutter="16">
                <el-col :span="4">
                  <el-form-item label="参数名">
                    <el-input v-model="param.name" placeholder="参数名" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="类型">
                    <el-select v-model="param.type" placeholder="类型">
                      <el-option label="数字" value="number" />
                      <el-option label="字符串" value="string" />
                      <el-option label="布尔" value="boolean" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="默认值">
                    <el-input v-model="param.defaultValue" placeholder="默认值" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="最小值">
                    <el-input v-model="param.min" placeholder="最小值" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="最大值">
                    <el-input v-model="param.max" placeholder="最大值" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="操作">
                    <el-button @click="removeParameter(index)" type="danger" circle>
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
            
            <el-button @click="addParameter" type="primary" plain>
              <el-icon><Plus /></el-icon>
              添加参数
            </el-button>
          </div>
        </el-card>

        <!-- 策略代码 -->
        <el-card class="form-section">
          <template #header>
            <div class="card-header">
              <el-icon><Document /></el-icon>
              <span>策略代码</span>
            </div>
          </template>
          
          <div class="code-editor">
            <el-input
              v-model="strategyForm.code"
              type="textarea"
              :rows="20"
              placeholder="请输入策略代码"
            />
          </div>
        </el-card>

        <!-- 风控设置 -->
        <el-card class="form-section">
          <template #header>
            <div class="card-header">
              <el-icon><WarningFilled /></el-icon>
              <span>风控设置</span>
            </div>
          </template>
          
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="最大仓位">
                <el-input-number v-model="strategyForm.maxPosition" :min="0" :max="100" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="止损比例">
                <el-input-number v-model="strategyForm.stopLoss" :min="0" :max="100" :step="0.1" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="止盈比例">
                <el-input-number v-model="strategyForm.takeProfit" :min="0" :max="100" :step="0.1" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Document, InfoFilled, Setting, WarningFilled, Plus, Delete 
} from '@element-plus/icons-vue'

const router = useRouter()
const saving = ref(false)

const strategyForm = reactive({
  name: '',
  type: '',
  description: '',
  parameters: [
    { name: '', type: 'number', defaultValue: '', min: '', max: '' }
  ],
  code: '',
  maxPosition: 100,
  stopLoss: 5,
  takeProfit: 10
})

const addParameter = () => {
  strategyForm.parameters.push({
    name: '',
    type: 'number',
    defaultValue: '',
    min: '',
    max: ''
  })
}

const removeParameter = (index) => {
  strategyForm.parameters.splice(index, 1)
}

const backToList = () => {
  router.push('/strategies')
}

const saveStrategy = async () => {
  if (!strategyForm.name) {
    ElMessage.error('请输入策略名称')
    return
  }

  saving.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('策略保存成功')
    router.push('/strategies')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  // 加载策略数据
})
</script>

<style scoped>
.edit-strategy {
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

.strategy-content {
  max-width: 1200px;
  margin: 0 auto;
}

.form-section {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.parameters-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.parameter-item {
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--primary-bg);
}

.code-editor {
  margin-top: 16px;
}

.code-editor :deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  background: #1e1e1e;
  color: #d4d4d4;
  border: 1px solid #3e3e3e;
}

.code-editor :deep(.el-textarea__inner)::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.code-editor :deep(.el-textarea__inner)::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.code-editor :deep(.el-textarea__inner)::-webkit-scrollbar-thumb {
  background: #4e4e4e;
  border-radius: 4px;
}

.code-editor :deep(.el-textarea__inner)::-webkit-scrollbar-thumb:hover {
  background: #6e6e6e;
}
</style>