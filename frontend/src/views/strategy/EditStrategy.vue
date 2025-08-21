<template>
  <div class="strategy-editor-container">
    <div class="editor-header">
      <h1>{{ isNew ? '创建策略' : '编辑策略' }}</h1>
      <div class="action-buttons">
        <el-button type="primary" @click="saveStrategy" :loading="saving">保存策略</el-button>
        <el-button @click="cancel">取消</el-button>
      </div>
    </div>

    <el-form 
      ref="strategyForm" 
      :model="strategy" 
      :rules="rules" 
      label-position="top" 
      class="strategy-form"
      v-loading="loading"
    >
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="策略名称" prop="name" required>
            <el-input 
              v-model="strategy.name" 
              placeholder="输入策略名称" 
              maxlength="50"
              show-word-limit
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="策略类型" prop="type" required>
            <el-select 
              v-model="strategy.type" 
              placeholder="选择策略类型"
              class="full-width"
            >
              <el-option v-for="type in strategyTypes" :key="type.value" :label="type.label" :value="type.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="策略描述" prop="description">
        <el-input 
          v-model="strategy.description" 
          type="textarea" 
          :rows="4" 
          placeholder="输入策略描述"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-divider content-position="left">交易参数</el-divider>

      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="交易品种" prop="symbol" required>
            <el-select 
              v-model="strategy.symbol" 
              placeholder="选择交易品种"
              class="full-width"
              filterable
            >
              <el-option v-for="symbol in symbols" :key="symbol.value" :label="symbol.label" :value="symbol.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="时间周期" prop="timeframe" required>
            <el-select 
              v-model="strategy.timeframe" 
              placeholder="选择时间周期"
              class="full-width"
            >
              <el-option v-for="tf in timeframes" :key="tf.value" :label="tf.label" :value="tf.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="初始资金" prop="initialCapital" required>
            <el-input-number 
              v-model="strategy.initialCapital" 
              :min="1000" 
              :max="10000000" 
              :step="1000"
              class="full-width"
              controls-position="right"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="手续费率 (%)" prop="commissionRate">
            <el-input-number 
              v-model="strategy.commissionRate" 
              :min="0" 
              :max="5" 
              :step="0.01"
              :precision="2"
              class="full-width"
              controls-position="right"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">风险参数</el-divider>

      <el-row :gutter="24">
        <el-col :span="8">
          <el-form-item label="最大仓位" prop="maxPosition" required>
            <el-input-number 
              v-model="strategy.maxPosition" 
              :min="1" 
              :max="100" 
              :step="1"
              class="full-width"
              controls-position="right"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="止损比例 (%)" prop="stopLossRatio">
            <el-input-number 
              v-model="strategy.stopLossRatio" 
              :min="0.1" 
              :max="20" 
              :step="0.1"
              :precision="1"
              class="full-width"
              controls-position="right"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="止盈比例 (%)" prop="takeProfitRatio">
            <el-input-number 
              v-model="strategy.takeProfitRatio" 
              :min="0.1" 
              :max="100" 
              :step="0.1"
              :precision="1"
              class="full-width"
              controls-position="right"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="策略代码" prop="code" required>
        <div class="code-editor-wrapper">
          <div class="code-editor-header">
            <span>Python 策略代码</span>
            <div class="code-actions">
              <el-tooltip content="代码模板">
                <el-button size="small" @click="insertTemplate" icon="Document">模板</el-button>
              </el-tooltip>
              <el-tooltip content="格式化代码">
                <el-button size="small" @click="formatCode" icon="Magic-stick">格式化</el-button>
              </el-tooltip>
              <el-tooltip content="全屏编辑">
                <el-button size="small" @click="toggleFullscreen" icon="FullScreen">全屏</el-button>
              </el-tooltip>
            </div>
          </div>
          <div class="code-editor" ref="codeEditor"></div>
        </div>
      </el-form-item>
    </el-form>

    <!-- 全屏代码编辑器对话框 -->
    <el-dialog
      v-model="fullscreenCodeEditor"
      title="策略代码编辑"
      fullscreen
      :show-close="true"
      :close-on-click-modal="false"
      :close-on-press-escape="true"
    >
      <div class="fullscreen-editor" ref="fullscreenEditor"></div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="fullscreenCodeEditor = false">取消</el-button>
          <el-button type="primary" @click="applyFullscreenCode">应用代码</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useStrategyStore } from '@/stores/strategy';
import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/monokai.css';
import 'codemirror/mode/python/python';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/selection/active-line';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/foldgutter.css';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/indent-fold';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/addon/hint/python-hint';

export default {
  name: 'EditStrategy',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const strategyStore = useStrategyStore();
    const strategyForm = ref(null);
    const codeEditor = ref(null);
    const fullscreenEditor = ref(null);
    const fullscreenCodeEditor = ref(false);
    const isNew = ref(route.name === 'CreateStrategy');
    const loading = ref(false);
    const saving = ref(false);
    
    let editor = null;
    let fsEditor = null;

    const strategy = reactive({
      id: route.params.id || null,
      name: '',
      description: '',
      type: '',
      symbol: '',
      timeframe: '',
      initialCapital: 10000,
      commissionRate: 0.1,
      maxPosition: 10,
      stopLossRatio: 2.0,
      takeProfitRatio: 5.0,
      code: '',
    });

    const strategyTypes = [
      { value: 'trend_following', label: '趋势跟踪' },
      { value: 'mean_reversion', label: '均值回归' },
      { value: 'breakout', label: '突破策略' },
      { value: 'statistical_arbitrage', label: '统计套利' },
      { value: 'machine_learning', label: '机器学习' },
      { value: 'custom', label: '自定义策略' },
    ];

    const symbols = [
      { value: 'BTCUSDT', label: 'BTC/USDT - 比特币' },
      { value: 'ETHUSDT', label: 'ETH/USDT - 以太坊' },
      { value: 'BNBUSDT', label: 'BNB/USDT - 币安币' },
      { value: '000001.SH', label: '上证指数' },
      { value: '399001.SZ', label: '深证成指' },
      { value: '399006.SZ', label: '创业板指' },
    ];

    const timeframes = [
      { value: '1m', label: '1分钟' },
      { value: '5m', label: '5分钟' },
      { value: '15m', label: '15分钟' },
      { value: '30m', label: '30分钟' },
      { value: '1h', label: '1小时' },
      { value: '4h', label: '4小时' },
      { value: '1d', label: '日线' },
      { value: '1w', label: '周线' },
    ];

    const rules = {
      name: [
        { required: true, message: '请输入策略名称', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
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
        { type: 'number', min: 1000, message: '初始资金不能小于1000', trigger: 'blur' }
      ],
      code: [
        { required: true, message: '请输入策略代码', trigger: 'blur' }
      ]
    };

    // 初始化代码编辑器
    const initCodeEditor = () => {
      nextTick(() => {
        if (codeEditor.value) {
          editor = CodeMirror(codeEditor.value, {
            mode: 'python',
            theme: 'monokai',
            lineNumbers: true,
            lineWrapping: true,
            matchBrackets: true,
            autoCloseBrackets: true,
            styleActiveLine: true,
            foldGutter: true,
            gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
            indentUnit: 4,
            tabSize: 4,
            indentWithTabs: false,
            extraKeys: {
              'Tab': 'indentMore',
              'Shift-Tab': 'indentLess',
              'Ctrl-Space': 'autocomplete'
            }
          });
          
          editor.setValue(strategy.code || getDefaultTemplate());
          editor.on('change', (cm) => {
            strategy.code = cm.getValue();
          });
        }
      });
    };

    // 初始化全屏代码编辑器
    const initFullscreenEditor = () => {
      if (fullscreenEditor.value && !fsEditor) {
        fsEditor = CodeMirror(fullscreenEditor.value, {
          mode: 'python',
          theme: 'monokai',
          lineNumbers: true,
          lineWrapping: true,
          matchBrackets: true,
          autoCloseBrackets: true,
          styleActiveLine: true,
          foldGutter: true,
          gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
          indentUnit: 4,
          tabSize: 4,
          indentWithTabs: false,
          extraKeys: {
            'Tab': 'indentMore',
            'Shift-Tab': 'indentLess',
            'Ctrl-Space': 'autocomplete'
          }
        });
        
        fsEditor.setValue(editor ? editor.getValue() : strategy.code);
      }
    };

    // 切换全屏代码编辑器
    const toggleFullscreen = () => {
      fullscreenCodeEditor.value = true;
      nextTick(() => {
        initFullscreenEditor();
      });
    };

    // 应用全屏编辑器的代码
    const applyFullscreenCode = () => {
      if (fsEditor) {
        const code = fsEditor.getValue();
        strategy.code = code;
        if (editor) {
          editor.setValue(code);
        }
      }
      fullscreenCodeEditor.value = false;
    };

    // 获取默认模板
    const getDefaultTemplate = () => {
      return `# 策略名称: ${strategy.name || '我的量化策略'}
# 交易品种: ${strategy.symbol || 'BTCUSDT'}
# 时间周期: ${strategy.timeframe || '1h'}

import pandas as pd
import numpy as np
from strategy_base import StrategyBase

class MyStrategy(StrategyBase):
    """
    策略描述:
    ${strategy.description || '这是一个基本的量化交易策略模板。请在此处添加您的策略描述。'}
    """
    
    def __init__(self):
        super().__init__()
        # 初始化策略参数
        self.window = 20  # 移动平均窗口
        
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
        if len(self.data.close) < self.window:
            return
            
        # 计算技术指标
        ma_short = np.mean(self.data.close[-self.window:])
        ma_long = np.mean(self.data.close[-self.window*2:])
        
        # 交易逻辑
        if ma_short > ma_long and not self.position:
            # 做多信号
            self.buy(bar.close, 1)
            self.log(f"买入信号: 价格={bar.close}")
        elif ma_short < ma_long and self.position > 0:
            # 平仓信号
            self.sell(bar.close, self.position)
            self.log(f"卖出信号: 价格={bar.close}")
            
    def on_order_filled(self, order):
        """订单成交回调函数"""
        self.log(f"订单成交: {order.direction} {order.filled_amount} @ {order.filled_price}")
        
    def on_stop(self):
        """策略结束时调用"""
        self.log("策略运行结束")
`;
    };

    // 插入模板代码
    const insertTemplate = () => {
      ElMessageBox.confirm('插入模板代码将覆盖当前编辑器内容，是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const template = getDefaultTemplate();
        if (editor) {
          editor.setValue(template);
        }
        strategy.code = template;
      }).catch(() => {});
    };

    // 格式化代码 (简单实现)
    const formatCode = () => {
      if (editor) {
        // 这里只是一个简单的格式化示例，实际项目中可能需要更复杂的格式化逻辑
        const code = editor.getValue();
        try {
          // 简单的缩进处理
          const lines = code.split('\n');
          let formattedCode = '';
          let indentLevel = 0;
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            
            // 减少缩进的情况
            if (trimmedLine.startsWith('}') || 
                trimmedLine.startsWith(')') || 
                trimmedLine.startsWith(']') ||
                trimmedLine === 'else:' ||
                trimmedLine === 'elif:' ||
                trimmedLine.startsWith('except:')) {
              indentLevel = Math.max(0, indentLevel - 1);
            }
            
            // 添加当前行
            if (trimmedLine.length > 0) {
              formattedCode += ' '.repeat(indentLevel * 4) + trimmedLine + '\n';
            } else {
              formattedCode += '\n';
            }
            
            // 增加缩进的情况
            if (trimmedLine.endsWith(':') || 
                trimmedLine.endsWith('{') || 
                trimmedLine.endsWith('(') && !trimmedLine.includes(')') ||
                trimmedLine.endsWith('[') && !trimmedLine.includes(']')) {
              indentLevel += 1;
            }
          }
          
          editor.setValue(formattedCode);
          ElMessage.success('代码格式化完成');
        } catch (error) {
          ElMessage.error('代码格式化失败: ' + error.message);
        }
      }
    };

    // 加载策略数据
    const loadStrategy = async () => {
      if (!isNew.value && strategy.id) {
        loading.value = true;
        try {
          const data = await strategyStore.getStrategy(strategy.id);
          if (data) {
            Object.assign(strategy, data);
            nextTick(() => {
              if (editor) {
                editor.setValue(strategy.code || '');
              }
            });
          }
        } catch (error) {
          ElMessage.error('加载策略失败: ' + error.message);
        } finally {
          loading.value = false;
        }
      }
    };

    // 保存策略
    const saveStrategy = async () => {
      if (!strategyForm.value) return;
      
      await strategyForm.value.validate(async (valid) => {
        if (valid) {
          saving.value = true;
          try {
            if (isNew.value) {
              await strategyStore.createStrategy(strategy);
              ElMessage.success('策略创建成功');
            } else {
              await strategyStore.updateStrategy(strategy);
              ElMessage.success('策略更新成功');
            }
            router.push({ name: 'StrategyList' });
          } catch (error) {
            ElMessage.error('保存策略失败: ' + error.message);
          } finally {
            saving.value = false;
          }
        } else {
          ElMessage.warning('请完善表单信息');
          return false;
        }
      });
    };

    // 取消编辑
    const cancel = () => {
      ElMessageBox.confirm('确定要取消编辑吗？未保存的更改将丢失', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        router.push({ name: 'StrategyList' });
      }).catch(() => {});
    };

    onMounted(() => {
      initCodeEditor();
      loadStrategy();
    });

    return {
      strategyForm,
      codeEditor,
      fullscreenEditor,
      strategy,
      strategyTypes,
      symbols,
      timeframes,
      rules,
      isNew,
      loading,
      saving,
      fullscreenCodeEditor,
      saveStrategy,
      cancel,
      insertTemplate,
      formatCode,
      toggleFullscreen,
      applyFullscreenCode
    };
  }
};
</script>

<style scoped>
.strategy-editor-container {
  padding: 20px;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.editor-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.strategy-form {
  margin-top: 20px;
}

.full-width {
  width: 100%;
}

.code-editor-wrapper {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
}

.code-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: var(--el-color-info-light-9);
  border-bottom: 1px solid var(--el-border-color);
}

.code-editor-header span {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.code-actions {
  display: flex;
  gap: 8px;
}

.code-editor {
  height: 400px;
  overflow: auto;
}

.fullscreen-editor {
  height: calc(100vh - 180px);
}

:deep(.CodeMirror) {
  height: 100%;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
}

:deep(.el-divider__text) {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-color-primary);
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-input-number) {
  width: 100%;
}
</style>