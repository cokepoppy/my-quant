<template>
  <div class="strategy-editor">
    <!-- Header Section -->
    <div class="editor-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="editor-title">
            <el-icon class="title-icon"><Edit /></el-icon>
            {{ isNew ? '创建策略' : '编辑策略' }}
          </h1>
          <p class="editor-subtitle">{{ isNew ? '创建新的量化交易策略' : '修改现有的量化交易策略' }}</p>
        </div>
        <div class="header-actions">
          <el-button @click="previewStrategy" :icon="View" size="large" class="preview-btn">
            预览
          </el-button>
          <el-button @click="saveStrategy" :icon="Document" size="large" type="primary" :loading="saving">
            {{ isNew ? '创建策略' : '保存修改' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="editor-content">
      <el-row :gutter="24">
        <!-- Left Panel - Strategy Configuration -->
        <el-col :span="8">
          <div class="config-panel">
            <div class="panel-header">
              <el-icon class="panel-icon"><Setting /></el-icon>
              <h3>策略配置</h3>
            </div>
            
            <el-form 
              ref="strategyForm" 
              :model="strategy" 
              :rules="rules" 
              label-position="top"
              class="strategy-config-form"
              v-loading="loading"
            >
              <!-- Basic Info -->
              <div class="form-section">
                <h4 class="section-title">基本信息</h4>
                <el-form-item label="策略名称" prop="name">
                  <div class="custom-input-wrapper">
                    <el-icon class="input-prefix"><Document /></el-icon>
                    <input
                      v-model="strategy.name"
                      type="text"
                      placeholder="输入策略名称"
                      class="custom-input"
                      maxlength="50"
                    />
                    <span class="input-count">{{ strategy.name.length }} / 50</span>
                  </div>
                </el-form-item>
                
                <el-form-item label="策略类型" prop="type">
                  <el-select 
                    v-model="strategy.type" 
                    placeholder="选择策略类型"
                    size="large"
                    class="modern-select"
                  >
                    <el-option
                      v-for="type in strategyTypes"
                      :key="type.value"
                      :label="type.label"
                      :value="type.value"
                    >
                      <span class="option-icon">{{ type.icon }}</span>
                      {{ type.label }}
                    </el-option>
                  </el-select>
                </el-form-item>
                
                <el-form-item label="策略描述" prop="description">
                  <el-input 
                    v-model="strategy.description" 
                    type="textarea" 
                    :rows="3"
                    placeholder="描述策略的投资逻辑和特点"
                    class="modern-textarea"
                  />
                </el-form-item>
              </div>

              <!-- Trading Parameters -->
              <div class="form-section">
                <h4 class="section-title">交易参数</h4>
                <el-form-item label="交易品种" prop="symbol">
                  <el-select 
                    v-model="strategy.symbol" 
                    placeholder="选择交易品种"
                    size="large"
                    filterable
                    class="modern-select"
                  >
                    <el-option
                      v-for="symbol in symbols"
                      :key="symbol.value"
                      :label="symbol.label"
                      :value="symbol.value"
                    />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="时间周期" prop="timeframe">
                  <el-select 
                    v-model="strategy.timeframe" 
                    placeholder="选择时间周期"
                    size="large"
                    class="modern-select"
                  >
                    <el-option
                      v-for="tf in timeframes"
                      :key="tf.value"
                      :label="tf.label"
                      :value="tf.value"
                    />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="初始资金" prop="initialCapital">
                  <el-input-number 
                    v-model="strategy.initialCapital" 
                    :min="1000" 
                    :max="10000000" 
                    :step="1000"
                    size="large"
                    class="modern-number"
                    controls-position="right"
                  >
                    <template #prefix>¥</template>
                  </el-input-number>
                </el-form-item>
                
                <el-form-item label="手续费率 (%)" prop="commissionRate">
                  <el-input-number 
                    v-model="strategy.commissionRate" 
                    :min="0" 
                    :max="5" 
                    :step="0.01"
                    :precision="2"
                    size="large"
                    class="modern-number"
                    controls-position="right"
                  />
                </el-form-item>
              </div>

              <!-- Risk Parameters -->
              <div class="form-section">
                <h4 class="section-title">风险控制</h4>
                <el-form-item label="最大仓位 (%)" prop="maxPosition">
                  <el-slider 
                    v-model="strategy.maxPosition" 
                    :min="1" 
                    :max="100" 
                    :step="1"
                    class="risk-slider"
                    :format-tooltip="value => `${value}%`"
                  />
                </el-form-item>
                
                <el-form-item label="止损比例 (%)" prop="stopLossRatio">
                  <el-slider 
                    v-model="strategy.stopLossRatio" 
                    :min="0.1" 
                    :max="20" 
                    :step="0.1"
                    class="risk-slider"
                    :format-tooltip="value => `${value}%`"
                  />
                </el-form-item>
                
                <el-form-item label="止盈比例 (%)" prop="takeProfitRatio">
                  <el-slider 
                    v-model="strategy.takeProfitRatio" 
                    :min="0.1" 
                    :max="100" 
                    :step="0.1"
                    class="risk-slider"
                    :format-tooltip="value => `${value}%`"
                  />
                </el-form-item>
              </div>
            </el-form>
          </div>
        </el-col>

        <!-- Right Panel - Code Editor -->
        <el-col :span="16">
          <div class="code-panel">
            <div class="panel-header">
              <div class="panel-title">
                <el-icon class="panel-icon"><Code /></el-icon>
                <h3>策略代码</h3>
              </div>
              <div class="code-toolbar">
                <el-button-group>
                  <el-button 
                    @click="insertTemplate" 
                    :icon="Document" 
                    size="small"
                    title="代码模板"
                  >
                    模板
                  </el-button>
                  <el-button 
                    @click="formatCode" 
                    :icon="MagicStick" 
                    size="small"
                    title="格式化代码"
                  >
                    格式化
                  </el-button>
                  <el-button 
                    @click="validateCode" 
                    :icon="CircleCheck" 
                    size="small"
                    title="验证代码"
                  >
                    验证
                  </el-button>
                </el-button-group>
                <el-button 
                  @click="toggleFullscreen" 
                  :icon="FullScreen" 
                  size="small"
                  title="全屏编辑"
                >
                  全屏
                </el-button>
              </div>
            </div>
            
            <div class="code-editor-container">
              <div class="code-editor" ref="codeEditor"></div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- Preview Dialog -->
    <el-dialog
      v-model="previewDialog"
      title="策略预览"
      width="80%"
      :show-close="true"
      :close-on-click-modal="false"
    >
      <div class="preview-content">
        <div class="preview-section">
          <h4>策略概览</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="策略名称">{{ strategy.name }}</el-descriptions-item>
            <el-descriptions-item label="策略类型">{{ getStrategyTypeLabel(strategy.type) }}</el-descriptions-item>
            <el-descriptions-item label="交易品种">{{ strategy.symbol }}</el-descriptions-item>
            <el-descriptions-item label="时间周期">{{ getTimeframeLabel(strategy.timeframe) }}</el-descriptions-item>
            <el-descriptions-item label="初始资金">¥{{ strategy.initialCapital.toLocaleString() }}</el-descriptions-item>
            <el-descriptions-item label="手续费率">{{ strategy.commissionRate }}%</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="preview-section">
          <h4>风险参数</h4>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="最大仓位">{{ strategy.maxPosition }}%</el-descriptions-item>
            <el-descriptions-item label="止损比例">{{ strategy.stopLossRatio }}%</el-descriptions-item>
            <el-descriptions-item label="止盈比例">{{ strategy.takeProfitRatio }}%</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="preview-section">
          <h4>策略描述</h4>
          <div class="preview-description">{{ strategy.description || '暂无描述' }}</div>
        </div>
      </div>
    </el-dialog>

    <!-- Fullscreen Code Editor Dialog -->
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
import * as strategyApi from '@/api/strategy';
import { 
  Edit, Document, Setting, Code, View, MagicStick, 
  FullScreen, CircleCheck 
} from '@element-plus/icons-vue';
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
// import 'codemirror/addon/hint/python-hint';

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
    const previewDialog = ref(false);
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
      { value: 'trend_following', label: '趋势跟踪', icon: '📈' },
      { value: 'mean_reversion', label: '均值回归', icon: '🔄' },
      { value: 'breakout', label: '突破策略', icon: '🚀' },
      { value: 'statistical_arbitrage', label: '统计套利', icon: '📊' },
      { value: 'machine_learning', label: '机器学习', icon: '🤖' },
      { value: 'custom', label: '自定义策略', icon: '⚙️' },
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

    // 获取策略类型标签
    const getStrategyTypeLabel = (type) => {
      const strategyType = strategyTypes.find(t => t.value === type);
      return strategyType ? strategyType.label : type;
    };

    // 获取时间周期标签
    const getTimeframeLabel = (timeframe) => {
      const tf = timeframes.find(t => t.value === timeframe);
      return tf ? tf.label : timeframe;
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

    // 格式化代码
    const formatCode = () => {
      if (editor) {
        ElMessage.info('代码格式化功能开发中...');
      }
    };

    // 验证代码
    const validateCode = () => {
      if (editor) {
        const code = editor.getValue();
        if (!code.trim()) {
          ElMessage.warning('请输入策略代码');
          return;
        }
        
        // 简单的语法检查
        const hasClass = code.includes('class ');
        const hasInit = code.includes('def __init__');
        const hasOnBar = code.includes('def on_bar');
        
        if (!hasClass || !hasInit || !hasOnBar) {
          ElMessage.warning('策略代码缺少必要的类或方法定义');
          return;
        }
        
        ElMessage.success('代码验证通过');
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

    // 预览策略
    const previewStrategy = () => {
      if (!strategyForm.value) return;
      
      strategyForm.value.validate((valid) => {
        if (valid) {
          previewDialog.value = true;
        } else {
          ElMessage.warning('请完善策略配置信息');
        }
      });
    };

    // 加载策略数据
    const loadStrategy = async () => {
      if (!isNew.value && strategy.id) {
        loading.value = true;
        try {
          const response = await strategyApi.getStrategyById(strategy.id);
          if (response.success) {
            Object.assign(strategy, response.data);
            nextTick(() => {
              if (editor) {
                editor.setValue(strategy.code || '');
              }
            });
          } else {
            throw new Error(response.message || '加载策略失败');
          }
        } catch (error) {
          console.error('加载策略失败:', error);
          ElMessage.error('加载策略失败: ' + (error instanceof Error ? error.message : '未知错误'));
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
            let response;
            if (isNew.value) {
              response = await strategyApi.createStrategy(strategy);
            } else {
              response = await strategyApi.updateStrategy(strategy.id, strategy);
            }
            
            if (response.success) {
              ElMessage.success(isNew.value ? '策略创建成功' : '策略更新成功');
              router.push({ name: 'StrategyList' });
            } else {
              throw new Error(response.message || '保存策略失败');
            }
          } catch (error) {
            console.error('保存策略失败:', error);
            ElMessage.error('保存策略失败: ' + (error instanceof Error ? error.message : '未知错误'));
          } finally {
            saving.value = false;
          }
        } else {
          ElMessage.warning('请完善策略配置信息');
          return false;
        }
      });
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
      previewDialog,
      saveStrategy,
      insertTemplate,
      formatCode,
      validateCode,
      toggleFullscreen,
      applyFullscreenCode,
      previewStrategy,
      getStrategyTypeLabel,
      getTimeframeLabel,
      // Icons
      Edit, Document, Setting, Code, View, MagicStick, FullScreen, CircleCheck
    };
  }
};
</script>

<style scoped>
.strategy-editor {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.editor-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 20px 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.title-section h1 {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 32px;
  color: #667eea;
}

.editor-subtitle {
  color: #7f8c8d;
  margin: 8px 0 0 0;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.preview-btn {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(102, 126, 234, 0.3);
  color: #667eea;
}

.preview-btn:hover {
  background: #667eea;
  color: white;
}

.editor-content {
  height: calc(100vh - 100px);
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.config-panel, .code-panel {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  height: 100%;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(102, 126, 234, 0.05);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-icon {
  font-size: 20px;
  color: #667eea;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.code-toolbar {
  display: flex;
  gap: 8px;
}

.strategy-config-form {
  padding: 24px;
  height: calc(100% - 80px);
  overflow-y: auto;
}

.form-section {
  margin-bottom: 32px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 16px;
  background: #667eea;
  border-radius: 2px;
}

.modern-input {
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

/* 自定义输入框样式 */
.custom-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 8px !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  background: rgba(255, 255, 255, 0.8) !important;
  transition: all 0.3s ease !important;
  padding: 0 12px !important;
  height: 40px !important;
  box-shadow: none !important;
}

.custom-input-wrapper:hover {
  border-color: rgba(102, 126, 234, 0.5) !important;
}

.custom-input-wrapper:focus-within {
  border-color: #667eea !important;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
}

.input-prefix {
  color: #667eea !important;
  margin-right: 8px !important;
  font-size: 16px !important;
  flex-shrink: 0;
}

.custom-input {
  flex: 1;
  border: none !important;
  background: transparent !important;
  outline: none !important;
  font-size: 14px !important;
  color: #333 !important;
  padding: 0 !important;
  height: 40px !important;
  line-height: 40px !important;
  -webkit-appearance: none !important;
  box-sizing: border-box !important;
  box-shadow: none !important;
  border-radius: 0 !important;
}

.custom-input::placeholder {
  color: #999 !important;
}

.input-count {
  font-size: 12px !important;
  color: #999 !important;
  margin-left: 8px !important;
  white-space: nowrap;
  flex-shrink: 0;
}

/* 强制覆盖Element Plus的所有输入框样式 */
.el-input__inner,
.el-input .el-input__inner,
[data-v-*] .el-input__inner,
[data-v-5b77548b] .el-input__inner,
[data-v-9a358e25] .el-input__inner,
[data-v-5b77548b] .el-input__inner,
[data-v-9a358e25] .el-input__inner {
  -webkit-appearance: none !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  outline: none !important;
  padding: 0 !important;
  margin: 0 !important;
  color: #333 !important;
  font-size: 14px !important;
  height: 40px !important;
  line-height: 40px !important;
}

/* 特别针对[data-v-5b77548b]的样式覆盖 */
[data-v-5b77548b] .el-input__inner {
  background: transparent !important;
  border: none !important;
  color: #333 !important;
  border-radius: 0 !important;
  font-size: 14px !important;
}

/* 移除所有输入框的边框 */
.el-input__inner {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
}

/* 终极覆盖 - 移除所有可能的边框样式 */
.el-input__inner,
.el-input .el-input__inner,
.el-input__wrapper .el-input__inner,
[data-v-5b77548b] .el-input__inner,
[data-v-9a358e25] .el-input__inner,
[data-v-*] .el-input__inner,
.el-input[data-v-5b77548b] .el-input__inner,
.el-input[data-v-9a358e25] .el-input__inner {
  border: none !important;
  border-width: 0 !important;
  border-style: none !important;
  border-color: transparent !important;
  background: transparent !important;
  box-shadow: none !important;
  outline: none !important;
}

/* 特别针对内联样式和计算样式 */
*[style*="border"] .el-input__inner,
.el-input__inner[style*="border"] {
  border: none !important;
  border-width: 0 !important;
  border-color: transparent !important;
}

/* 暴力重置 - 最高优先级 */
html body .el-input__inner,
html body .el-input .el-input__inner,
html body [data-v-5b77548b] .el-input__inner,
html body [data-v-9a358e25] .el-input__inner {
  border: none !important;
  border-width: 0 !important;
  border-style: none !important;
  border-color: transparent !important;
  background: transparent !important;
  box-shadow: none !important;
  outline: none !important;
  border-image: none !important;
}

/* 针对特定属性选择器 */
.el-input__inner[style*="var(--input-border)"],
.el-input__inner[style*="1px solid"] {
  border: none !important;
  border-width: 0 !important;
  border-color: transparent !important;
}

.el-input__wrapper,
.el-input .el-input__wrapper,
[data-v-*] .el-input__wrapper,
[data-v-5b77548b] .el-input__wrapper,
[data-v-9a358e25] .el-input__wrapper {
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin: 0 !important;
}

.modern-select {
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.modern-select .el-select__wrapper {
  border-radius: 8px !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  box-shadow: none !important;
  background: rgba(255, 255, 255, 0.8) !important;
  transition: all 0.3s ease !important;
}

.modern-select:focus-within .el-select__wrapper {
  border-color: #667eea !important;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
}

.modern-textarea {
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.modern-textarea:focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.modern-number {
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.modern-number:focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.risk-slider {
  margin: 16px 0;
}

.code-editor-container {
  height: calc(100% - 80px);
  padding: 20px;
}

.code-editor {
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
}

.fullscreen-editor {
  height: calc(100vh - 120px);
}

.option-icon {
  margin-right: 8px;
}

.preview-content {
  padding: 20px;
}

.preview-section {
  margin-bottom: 24px;
}

.preview-section h4 {
  color: #2c3e50;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
}

.preview-description {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #667eea;
  line-height: 1.6;
}

:deep(.CodeMirror) {
  height: 100%;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
  border-radius: 8px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 8px;
}

:deep(.el-slider__runway) {
  background: linear-gradient(to right, #e8f5e8, #ffe8e8);
}

:deep(.el-slider__bar) {
  background: linear-gradient(to right, #4caf50, #ff9800);
}

:deep(.el-descriptions__label) {
  font-weight: 500;
  color: #2c3e50;
}

:deep(.el-descriptions__content) {
  color: #5a6c7d;
}

:deep(.el-button-group .el-button) {
  border-radius: 6px;
}

:deep(.el-button-group .el-button:first-child) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

:deep(.el-button-group .el-button:last-child) {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

:deep(.el-button-group .el-button:not(:first-child):not(:last-child)) {
  border-radius: 0;
}

/* 滚动条样式 */
.strategy-config-form::-webkit-scrollbar {
  width: 6px;
}

.strategy-config-form::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.strategy-config-form::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 3px;
}

.strategy-config-form::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .editor-content {
    padding: 16px;
  }
  
  .config-panel, .code-panel {
    margin-bottom: 16px;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .title-section h1 {
    font-size: 24px;
  }
  
  .editor-content {
    padding: 12px;
  }
  
  .panel-header {
    padding: 16px 20px;
  }
  
  .strategy-config-form {
    padding: 20px;
  }
  
  .code-editor-container {
    padding: 16px;
  }
}
</style>