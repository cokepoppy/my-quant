<template>
  <div class="strategy-form-container">
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      label-position="top"
    >
      <!-- 基本信息 -->
      <el-card class="form-section">
        <template #header>
          <div class="card-header">
            <h3>基本信息</h3>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="策略名称" prop="name">
              <el-input
                v-model="form.name"
                placeholder="请输入策略名称"
                maxlength="50"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="策略类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择策略类型">
                <el-option label="趋势策略" value="trend" />
                <el-option label="动量策略" value="momentum" />
                <el-option label="均值回归策略" value="mean_reversion" />
                <el-option label="套利策略" value="arbitrage" />
                <el-option label="自定义策略" value="custom" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="编程语言" prop="language">
              <el-select v-model="form.language" placeholder="请选择编程语言">
                <el-option label="Python" value="python" />
                <el-option label="JavaScript" value="javascript" />
                <el-option label="TypeScript" value="typescript" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标签">
              <el-select
                v-model="form.tags"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="请选择或创建标签"
              >
                <el-option
                  v-for="tag in tagOptions"
                  :key="tag"
                  :label="tag"
                  :value="tag"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

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
      </el-card>

      <!-- 策略代码 -->
      <el-card class="form-section">
        <template #header>
          <div class="card-header">
            <h3>策略代码</h3>
            <div class="header-actions">
              <el-button @click="validateCode">验证代码</el-button>
              <el-button @click="formatCode">格式化</el-button>
              <el-dropdown @command="handleTemplateCommand">
                <el-button>
                  插入模板
                  <el-icon class="el-icon--right"><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="sma"
                      >简单移动平均</el-dropdown-item
                    >
                    <el-dropdown-item command="ema"
                      >指数移动平均</el-dropdown-item
                    >
                    <el-dropdown-item command="rsi"
                      >相对强弱指数</el-dropdown-item
                    >
                    <el-dropdown-item command="macd">MACD</el-dropdown-item>
                    <el-dropdown-item command="bollinger"
                      >布林带</el-dropdown-item
                    >
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </template>

        <el-form-item prop="code">
          <el-input
            v-model="form.code"
            type="textarea"
            :rows="20"
            placeholder="请输入策略代码"
            class="code-editor"
          />
        </el-form-item>

        <div v-if="validationResult" class="validation-result">
          <el-alert
            :title="validationResult.isValid ? '验证通过' : '验证失败'"
            :type="validationResult.isValid ? 'success' : 'error'"
            :description="validationResult.errors.join(', ')"
            show-icon
            :closable="false"
          />
        </div>
      </el-card>

      <!-- 策略参数 -->
      <el-card class="form-section">
        <template #header>
          <div class="card-header">
            <h3>策略参数</h3>
            <el-button @click="addParameter">添加参数</el-button>
          </div>
        </template>

        <div
          v-for="(param, index) in form.parameters"
          :key="index"
          class="parameter-item"
        >
          <el-row :gutter="20">
            <el-col :span="4">
              <el-form-item
                :label="`参数${index + 1}名称`"
                :prop="`parameters.${index}.name`"
                :rules="{
                  required: true,
                  message: '请输入参数名称',
                  trigger: 'blur',
                }"
              >
                <el-input v-model="param.name" placeholder="参数名称" />
              </el-form-item>
            </el-col>
            <el-col :span="3">
              <el-form-item
                label="类型"
                :prop="`parameters.${index}.type`"
                :rules="{
                  required: true,
                  message: '请选择参数类型',
                  trigger: 'change',
                }"
              >
                <el-select v-model="param.type">
                  <el-option label="数字" value="number" />
                  <el-option label="字符串" value="string" />
                  <el-option label="布尔值" value="boolean" />
                  <el-option label="数组" value="array" />
                  <el-option label="对象" value="object" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item
                label="值"
                :prop="`parameters.${index}.value`"
                :rules="{
                  required: true,
                  message: '请输入参数值',
                  trigger: 'blur',
                }"
              >
                <el-input v-model="param.value" placeholder="参数值" />
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="描述">
                <el-input v-model="param.description" placeholder="参数描述" />
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="范围">
                <el-input-number
                  v-if="param.type === 'number'"
                  v-model="param.min"
                  placeholder="最小值"
                  :min="0"
                />
                <el-input-number
                  v-if="param.type === 'number'"
                  v-model="param.max"
                  placeholder="最大值"
                  :min="0"
                />
              </el-form-item>
            </el-col>
            <el-col :span="2">
              <el-form-item label="必填">
                <el-switch v-model="param.required" />
              </el-form-item>
            </el-col>
            <el-col :span="2">
              <el-button
                type="danger"
                size="small"
                @click="removeParameter(index)"
              >
                删除
              </el-button>
            </el-col>
          </el-row>
        </div>

        <div v-if="form.parameters.length === 0" class="empty-parameters">
          <el-empty description="暂无参数" :image-size="80">
            <el-button @click="addParameter">添加第一个参数</el-button>
          </el-empty>
        </div>
      </el-card>

      <!-- 交易配置 -->
      <el-card class="form-section">
        <template #header>
          <div class="card-header">
            <h3>交易配置</h3>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="交易标的" prop="config.symbols">
              <el-select
                v-model="form.config.symbols"
                multiple
                filterable
                allow-create
                placeholder="请输入交易标的"
              >
                <el-option label="BTC/USDT" value="BTC/USDT" />
                <el-option label="ETH/USDT" value="ETH/USDT" />
                <el-option label="BNB/USDT" value="BNB/USDT" />
                <el-option label="ADA/USDT" value="ADA/USDT" />
                <el-option label="SOL/USDT" value="SOL/USDT" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="时间周期" prop="config.timeframe">
              <el-select
                v-model="form.config.timeframe"
                placeholder="请选择时间周期"
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
          </el-col>
          <el-col :span="8">
            <el-form-item label="交易所" prop="config.execution.exchange">
              <el-select
                v-model="form.config.execution.exchange"
                placeholder="请选择交易所"
              >
                <el-option label="币安" value="binance" />
                <el-option label="OKX" value="okx" />
                <el-option label="火币" value="huobi" />
                <el-option label="Bybit" value="bybit" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 风险管理 -->
      <el-card class="form-section">
        <template #header>
          <div class="card-header">
            <h3>风险管理</h3>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item
              label="最大持仓"
              prop="config.riskManagement.maxPositionSize"
            >
              <el-input-number
                v-model="form.config.riskManagement.maxPositionSize"
                :min="0"
                :max="100"
                :step="0.1"
                placeholder="百分比"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item
              label="最大回撤"
              prop="config.riskManagement.maxDrawdown"
            >
              <el-input-number
                v-model="form.config.riskManagement.maxDrawdown"
                :min="0"
                :max="100"
                :step="0.1"
                placeholder="百分比"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item
              label="止损比例"
              prop="config.riskManagement.stopLoss"
            >
              <el-input-number
                v-model="form.config.riskManagement.stopLoss"
                :min="0"
                :max="100"
                :step="0.1"
                placeholder="百分比"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item
              label="止盈比例"
              prop="config.riskManagement.takeProfit"
            >
              <el-input-number
                v-model="form.config.riskManagement.takeProfit"
                :min="0"
                :max="100"
                :step="0.1"
                placeholder="百分比"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item
              label="单笔风险"
              prop="config.riskManagement.riskPerTrade"
            >
              <el-input-number
                v-model="form.config.riskManagement.riskPerTrade"
                :min="0"
                :max="100"
                :step="0.1"
                placeholder="百分比"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item
              label="最大相关性"
              prop="config.riskManagement.maxCorrelation"
            >
              <el-input-number
                v-model="form.config.riskManagement.maxCorrelation"
                :min="0"
                :max="1"
                :step="0.1"
                placeholder="0-1之间"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 表单操作 -->
      <div class="form-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          {{ isEdit ? "更新策略" : "创建策略" }}
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { ArrowDown } from "@element-plus/icons-vue";
import { useStrategyStore } from "@/stores/strategy";
import type {
  Strategy,
  StrategyParameter,
  StrategyConfig,
} from "@/types/strategy";

interface Props {
  strategy?: Strategy;
  templates?: any[];
  isEdit?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isEdit: false,
});

const emit = defineEmits<{
  submit: [data: Partial<Strategy>];
  cancel: [];
}>();

const strategyStore = useStrategyStore();

// 响应式数据
const formRef = ref();
const loading = ref(false);
const validationResult = ref<any>(null);

// 表单数据
const form = reactive<Partial<Strategy>>({
  name: "",
  description: "",
  type: "trend",
  language: "python",
  code: "",
  config: {
    symbols: [],
    timeframe: "1h",
    riskManagement: {
      maxPositionSize: 10,
      maxDrawdown: 20,
      stopLoss: 5,
      takeProfit: 10,
      riskPerTrade: 2,
      maxCorrelation: 0.7,
    },
    execution: {
      exchange: "binance",
      accountType: "spot",
      slippage: 0.1,
      commission: 0.1,
      leverage: 1,
      executionDelay: 1000,
    },
    notifications: {
      email: true,
      push: true,
      events: ["trade", "error", "warning"],
    },
  },
  parameters: [],
  tags: [],
});

// 验证规则
const rules = {
  name: [
    { required: true, message: "请输入策略名称", trigger: "blur" },
    { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" },
  ],
  description: [
    { required: true, message: "请输入策略描述", trigger: "blur" },
    { min: 10, max: 500, message: "长度在 10 到 500 个字符", trigger: "blur" },
  ],
  type: [{ required: true, message: "请选择策略类型", trigger: "change" }],
  language: [{ required: true, message: "请选择编程语言", trigger: "change" }],
  code: [
    { required: true, message: "请输入策略代码", trigger: "blur" },
    { min: 10, message: "代码长度至少 10 个字符", trigger: "blur" },
  ],
  "config.symbols": [
    { required: true, message: "请选择至少一个交易标的", trigger: "change" },
  ],
  "config.timeframe": [
    { required: true, message: "请选择时间周期", trigger: "change" },
  ],
};

// 标签选项
const tagOptions = [
  "趋势跟踪",
  "均值回归",
  "动量策略",
  "套利",
  "高频交易",
  "量化交易",
  "自动化",
  "低风险",
  "中风险",
  "高风险",
];

// 方法
const validateCode = async () => {
  if (!form.code || !form.language || !form.type) {
    ElMessage.warning("请先填写策略代码、语言和类型");
    return;
  }

  try {
    loading.value = true;
    const result = await strategyStore.validateStrategyCode({
      code: form.code,
      language: form.language,
      type: form.type,
    });
    validationResult.value = result;

    if (result.isValid) {
      ElMessage.success("代码验证通过");
    } else {
      ElMessage.error("代码验证失败");
    }
  } catch (error) {
    console.error("验证代码失败:", error);
    ElMessage.error("验证代码失败");
  } finally {
    loading.value = false;
  }
};

const formatCode = () => {
  // 这里可以添加代码格式化逻辑
  ElMessage.info("代码格式化功能开发中");
};

const handleTemplateCommand = (command: string) => {
  const templates = {
    sma: `# 简单移动平均策略
def initialize(context):
    context.sma_period = 20
    context.symbol = 'BTC/USDT'

def handle_data(context, data):
    prices = data.history(context.symbol, 'close', context.sma_period + 1, '1d')
    sma = prices.mean()
    current_price = prices[-1]
    
    if current_price > sma:
        order_target_percent(context.symbol, 1.0)
    else:
        order_target_percent(context.symbol, 0.0)`,

    ema: `# 指数移动平均策略
def initialize(context):
    context.ema_period = 12
    context.symbol = 'BTC/USDT'

def handle_data(context, data):
    prices = data.history(context.symbol, 'close', context.ema_period + 1, '1d')
    ema = prices.ewm(span=context.ema_period).mean()
    current_price = prices[-1]
    
    if current_price > ema.iloc[-1]:
        order_target_percent(context.symbol, 1.0)
    else:
        order_target_percent(context.symbol, 0.0)`,

    rsi: `# RSI策略
def initialize(context):
    context.rsi_period = 14
    context.overbought = 70
    context.oversold = 30
    context.symbol = 'BTC/USDT'

def handle_data(context, data):
    prices = data.history(context.symbol, 'close', context.rsi_period + 1, '1d')
    rsi = calculate_rsi(prices, context.rsi_period)
    
    if rsi.iloc[-1] < context.oversold:
        order_target_percent(context.symbol, 1.0)
    elif rsi.iloc[-1] > context.overbought:
        order_target_percent(context.symbol, 0.0)

def calculate_rsi(prices, period):
    delta = prices.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))`,

    macd: `# MACD策略
def initialize(context):
    context.fast_period = 12
    context.slow_period = 26
    context.signal_period = 9
    context.symbol = 'BTC/USDT'

def handle_data(context, data):
    prices = data.history(context.symbol, 'close', context.slow_period + context.signal_period + 1, '1d')
    
    exp1 = prices.ewm(span=context.fast_period).mean()
    exp2 = prices.ewm(span=context.slow_period).mean()
    macd = exp1 - exp2
    signal = macd.ewm(span=context.signal_period).mean()
    
    if macd.iloc[-1] > signal.iloc[-1]:
        order_target_percent(context.symbol, 1.0)
    else:
        order_target_percent(context.symbol, 0.0)`,

    bollinger: `# 布林带策略
def initialize(context):
    context.bb_period = 20
    context.bb_std = 2
    context.symbol = 'BTC/USDT'

def handle_data(context, data):
    prices = data.history(context.symbol, 'close', context.bb_period + 1, '1d')
    
    sma = prices.rolling(window=context.bb_period).mean()
    std = prices.rolling(window=context.bb_period).std()
    upper_band = sma + (std * context.bb_std)
    lower_band = sma - (std * context.bb_std)
    
    current_price = prices[-1]
    
    if current_price < lower_band.iloc[-1]:
        order_target_percent(context.symbol, 1.0)
    elif current_price > upper_band.iloc[-1]:
        order_target_percent(context.symbol, 0.0)`,
  };

  if (templates[command]) {
    form.code = templates[command];
    ElMessage.success("模板已插入");
  }
};

const addParameter = () => {
  if (!form.parameters) {
    form.parameters = [];
  }
  form.parameters.push({
    name: "",
    type: "number",
    value: "",
    description: "",
    required: true,
    min: 0,
    max: 100,
  });
};

const removeParameter = (index: number) => {
  if (form.parameters) {
    form.parameters.splice(index, 1);
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    emit("submit", form);
  } catch (error) {
    console.error("表单验证失败:", error);
    ElMessage.error("请检查表单填写是否正确");
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  emit("cancel");
};

// 生命周期
onMounted(() => {
  if (props.strategy) {
    // 编辑模式，填充表单数据
    Object.assign(form, props.strategy);
  }
});
</script>

<style scoped>
.strategy-form-container {
  max-height: 80vh;
  overflow-y: auto;
  padding: 20px;
}

.form-section {
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
  color: #333;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.code-editor {
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 14px;
}

.validation-result {
  margin-top: 16px;
}

.parameter-item {
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 16px;
  background-color: #fafafa;
}

.empty-parameters {
  padding: 40px;
  text-align: center;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 20px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .strategy-form-container {
    padding: 10px;
  }

  .header-actions {
    flex-direction: column;
    gap: 4px;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
