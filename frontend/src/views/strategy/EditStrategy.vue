<template>
  <div class="edit-strategy">
    <div class="page-header">
      <h2>编辑策略</h2>
      <el-button @click="$router.go(-1)">返回</el-button>
    </div>

    <el-card>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
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
          <span style="margin-left: 10px">USDT</span>
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
                <span style="margin-left: 10px">%</span>
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
                <span style="margin-left: 10px">%</span>
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
                <span style="margin-left: 10px">%</span>
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
          <el-button type="primary" @click="handleSubmit" :loading="saving"
            >保存策略</el-button
          >
          <el-button @click="handleReset">重置</el-button>
          <el-button @click="handleBacktest">回测</el-button>
          <el-button @click="handlePreview">预览</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewVisible" title="策略预览" width="80%">
      <div class="preview-content">
        <h4>基本信息</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="策略名称">{{
            form.name
          }}</el-descriptions-item>
          <el-descriptions-item label="策略类型">{{
            getTypeText(form.type)
          }}</el-descriptions-item>
          <el-descriptions-item label="交易品种">{{
            form.symbol
          }}</el-descriptions-item>
          <el-descriptions-item label="时间周期">{{
            form.timeframe
          }}</el-descriptions-item>
          <el-descriptions-item label="初始资金"
            >${{ form.initialCapital.toLocaleString() }}</el-descriptions-item
          >
          <el-descriptions-item label="最大仓位"
            >{{ form.maxPosition }}%</el-descriptions-item
          >
        </el-descriptions>

        <h4 style="margin-top: 20px">策略描述</h4>
        <p>{{ form.description }}</p>

        <h4 style="margin-top: 20px">风险参数</h4>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="止损比例"
            >{{ form.stopLoss }}%</el-descriptions-item
          >
          <el-descriptions-item label="止盈比例"
            >{{ form.takeProfit }}%</el-descriptions-item
          >
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";

const router = useRouter();
const route = useRoute();
const formRef = ref<FormInstance>();
const saving = ref(false);
const previewVisible = ref(false);

const form = reactive({
  name: "",
  description: "",
  type: "",
  symbol: "",
  timeframe: "",
  initialCapital: 10000,
  maxPosition: 10,
  stopLoss: 2,
  takeProfit: 3,
  code: "",
});

const originalForm = reactive({ ...form });

const rules: FormRules = {
  name: [
    { required: true, message: "请输入策略名称", trigger: "blur" },
    {
      min: 2,
      max: 50,
      message: "策略名称长度在 2 到 50 个字符",
      trigger: "blur",
    },
  ],
  description: [
    { required: true, message: "请输入策略描述", trigger: "blur" },
    { max: 500, message: "策略描述最多500个字符", trigger: "blur" },
  ],
  type: [{ required: true, message: "请选择策略类型", trigger: "change" }],
  symbol: [{ required: true, message: "请选择交易品种", trigger: "change" }],
  timeframe: [{ required: true, message: "请选择时间周期", trigger: "change" }],
  initialCapital: [
    { required: true, message: "请输入初始资金", trigger: "blur" },
    {
      type: "number",
      min: 100,
      message: "初始资金不能少于100",
      trigger: "blur",
    },
  ],
  maxPosition: [
    { required: true, message: "请输入最大仓位", trigger: "blur" },
    {
      type: "number",
      min: 1,
      max: 100,
      message: "最大仓位在1-100之间",
      trigger: "blur",
    },
  ],
  stopLoss: [
    { required: true, message: "请输入止损比例", trigger: "blur" },
    {
      type: "number",
      min: 0.1,
      max: 10,
      message: "止损比例在0.1-10之间",
      trigger: "blur",
    },
  ],
  takeProfit: [
    { required: true, message: "请输入止盈比例", trigger: "blur" },
    {
      type: "number",
      min: 0.1,
      max: 20,
      message: "止盈比例在0.1-20之间",
      trigger: "blur",
    },
  ],
  code: [{ required: true, message: "请输入策略代码", trigger: "blur" }],
};

const fetchStrategy = async () => {
  try {
    // TODO: 根据路由参数获取策略详情
    const strategyId = route.params.id as string;

    // 模拟数据
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 填充表单数据
    Object.assign(form, {
      name: "BTC趋势跟踪策略",
      description:
        "基于移动平均线的趋势跟踪策略，当短期均线上穿长期均线时买入，下穿时卖出。",
      type: "trend",
      symbol: "BTC/USDT",
      timeframe: "1h",
      initialCapital: 10000,
      maxPosition: 20,
      stopLoss: 2,
      takeProfit: 3,
      code: `// BTC趋势跟踪策略
const strategy = {
  name: 'BTC趋势跟踪策略',
  timeframe: '1h',
  symbols: ['BTC/USDT'],
  
  init: function() {
    this.shortMA = this.MA(20);
    this.longMA = this.MA(50);
  },
  
  onTick: function() {
    const shortMA = this.shortMA.value();
    const longMA = this.longMA.value();
    
    if (shortMA > longMA && !this.hasPosition()) {
      this.buy('BTC/USDT', 0.1);
    } else if (shortMA < longMA && this.hasPosition()) {
      this.sell('BTC/USDT', 0.1);
    }
  }
};`,
    });

    // 保存原始数据
    Object.assign(originalForm, form);
  } catch (error) {
    ElMessage.error("获取策略详情失败");
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    saving.value = true;

    // TODO: 调用API更新策略
    await new Promise((resolve) => setTimeout(resolve, 1000));

    ElMessage.success("策略更新成功");
    router.push(`/strategies/${route.params.id}`);
  } catch (error) {
    console.error("Form validation failed:", error);
  } finally {
    saving.value = false;
  }
};

const handleReset = () => {
  Object.assign(form, originalForm);
  ElMessage.info("表单已重置");
};

const handleBacktest = () => {
  // TODO: 实现回测逻辑
  ElMessage.info("回测功能开发中");
};

const handlePreview = () => {
  previewVisible.value = true;
};

const getTypeText = (type: string) => {
  const texts: Record<string, string> = {
    trend: "趋势跟踪",
    momentum: "动量策略",
    mean_reversion: "均值回归",
    arbitrage: "套利策略",
    high_frequency: "高频交易",
    machine_learning: "机器学习",
  };
  return texts[type] || type;
};

// 生命周期
onMounted(() => {
  fetchStrategy();
});
</script>

<style scoped>
.edit-strategy {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  background: var(--bg-primary);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: var(--surface-elevated);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
}

.page-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-2xl);
  font-weight: var(--font-semibold);
}

/* Element Plus 组件样式覆盖 */
:deep(.el-card) {
  background: var(--surface-elevated);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

:deep(.el-card__body) {
  padding: 24px;
}

:deep(.el-form-item__label) {
  color: var(--text-secondary);
  font-weight: var(--font-medium);
  font-size: var(--font-sm);
}

:deep(.el-input__inner) {
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  color: var(--input-text);
  border-radius: var(--radius-md);
  font-size: var(--font-base);
}

:deep(.el-input__inner:focus) {
  border-color: var(--input-focus);
  box-shadow: 0 0 0 2px var(--glow-primary);
}

:deep(.el-input__inner::placeholder) {
  color: var(--input-placeholder);
}

:deep(.el-textarea__inner) {
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  color: var(--input-text);
  border-radius: var(--radius-md);
  font-size: var(--font-base);
}

:deep(.el-textarea__inner:focus) {
  border-color: var(--input-focus);
  box-shadow: 0 0 0 2px var(--glow-primary);
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-select .el-input__inner) {
  cursor: pointer;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}

.code-editor {
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-secondary);
}

.code-editor :deep(.el-textarea__inner) {
  border: none;
  background: transparent;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: var(--font-sm);
  line-height: 1.6;
  resize: none;
  color: var(--text-primary);
}

.code-editor :deep(.el-textarea__inner):focus {
  box-shadow: none;
}

/* 按钮样式 */
:deep(.el-button) {
  border-radius: var(--radius-md);
  font-weight: var(--font-medium);
  transition: all var(--transition-normal) var(--ease-out);
}

:deep(.el-button--primary) {
  background: var(--btn-primary);
  border-color: var(--btn-primary);
  color: white;
}

:deep(.el-button--primary:hover) {
  background: var(--btn-primary-hover);
  border-color: var(--btn-primary-hover);
  box-shadow: var(--glow-primary);
}

:deep(.el-button--default) {
  background: var(--btn-secondary);
  border-color: var(--border-primary);
  color: var(--text-secondary);
}

:deep(.el-button--default:hover) {
  background: var(--bg-hover);
  border-color: var(--border-secondary);
  color: var(--text-primary);
}

:deep(.el-button--danger) {
  background: var(--market-down);
  border-color: var(--market-down);
  color: white;
}

:deep(.el-button--danger:hover) {
  background: #e02e24;
  border-color: #e02e24;
  box-shadow: var(--glow-danger);
}

/* 对话框样式 */
:deep(.el-dialog) {
  background: var(--surface-overlay);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-premium-lg);
}

:deep(.el-dialog__header) {
  background: var(--surface-elevated);
  border-bottom: 1px solid var(--border-primary);
  padding: 20px 24px;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}

:deep(.el-dialog__title) {
  color: var(--text-primary);
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
}

:deep(.el-dialog__body) {
  background: var(--bg-primary);
  padding: 24px;
  color: var(--text-primary);
}

:deep(.el-dialog__footer) {
  background: var(--surface-elevated);
  border-top: 1px solid var(--border-primary);
  padding: 16px 24px;
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
}

/* 描述组件样式 */
:deep(.el-descriptions) {
  background: transparent;
}

:deep(.el-descriptions__header) {
  background: transparent;
}

:deep(.el-descriptions__title) {
  color: var(--text-primary);
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
}

:deep(.el-descriptions__label) {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
  font-size: var(--font-sm);
}

:deep(.el-descriptions__content) {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-base);
}

:deep(.el-descriptions__border) .el-descriptions__cell {
  border-color: var(--border-primary);
}

.preview-content h4 {
  margin: 0 0 16px 0;
  color: var(--text-primary);
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
}

.preview-content p {
  margin: 0 0 16px 0;
  color: var(--text-secondary);
  line-height: var(--leading-normal);
  font-size: var(--font-base);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .edit-strategy {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
    padding: 12px 16px;
  }

  .page-header h2 {
    font-size: var(--font-xl);
  }

  :deep(.el-card__body) {
    padding: 16px;
  }

  :deep(.el-form-item__label) {
    float: none;
    display: block;
    text-align: left;
    margin-bottom: 8px;
  }

  :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }
}
</style>
