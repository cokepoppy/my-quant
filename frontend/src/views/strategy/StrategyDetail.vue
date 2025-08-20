<template>
  <div class="strategy-detail">
    <div class="page-header">
      <h2>{{ strategy.name }} - 策略详情</h2>
      <el-button @click="$router.go(-1)">返回</el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <!-- 策略基本信息 -->
        <el-card class="mb-20">
          <template #header>
            <div class="card-header">
              <h3>基本信息</h3>
              <el-button-group>
                <el-button size="small" @click="editStrategy">编辑</el-button>
                <el-button size="small" @click="duplicateStrategy"
                  >复制</el-button
                >
                <el-button size="small" @click="exportStrategy">导出</el-button>
              </el-button-group>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="策略名称">{{
              strategy.name
            }}</el-descriptions-item>
            <el-descriptions-item label="策略类型">
              <el-tag :type="getTypeColor(strategy.type)">{{
                getTypeText(strategy.type)
              }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="交易品种">{{
              strategy.symbol
            }}</el-descriptions-item>
            <el-descriptions-item label="时间周期">{{
              strategy.timeframe
            }}</el-descriptions-item>
            <el-descriptions-item label="初始资金"
              >${{
                strategy.initialCapital.toLocaleString()
              }}</el-descriptions-item
            >
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusColor(strategy.status)">{{
                getStatusText(strategy.status)
              }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{
              formatTime(strategy.createdAt)
            }}</el-descriptions-item>
            <el-descriptions-item label="最后运行">{{
              formatTime(strategy.lastRunAt) || "未运行"
            }}</el-descriptions-item>
          </el-descriptions>

          <div class="strategy-description">
            <h4>策略描述</h4>
            <p>{{ strategy.description }}</p>
          </div>
        </el-card>

        <!-- 策略代码 -->
        <el-card class="mb-20">
          <template #header>
            <div class="card-header">
              <h3>策略代码</h3>
              <el-button size="small" @click="copyCode">复制代码</el-button>
            </div>
          </template>
          <div class="code-editor">
            <pre><code>{{ strategy.code }}</code></pre>
          </div>
        </el-card>

        <!-- 性能分析 -->
        <el-card>
          <template #header>
            <h3>性能分析</h3>
          </template>
          <div v-if="strategy.performance" class="performance-grid">
            <div class="performance-item">
              <div class="performance-label">总收益率</div>
              <div
                class="performance-value"
                :class="
                  strategy.performance.totalReturn >= 0
                    ? 'positive'
                    : 'negative'
                "
              >
                {{ (strategy.performance.totalReturn * 100).toFixed(2) }}%
              </div>
            </div>
            <div class="performance-item">
              <div class="performance-label">年化收益率</div>
              <div
                class="performance-value"
                :class="
                  strategy.performance.annualizedReturn >= 0
                    ? 'positive'
                    : 'negative'
                "
              >
                {{ (strategy.performance.annualizedReturn * 100).toFixed(2) }}%
              </div>
            </div>
            <div class="performance-item">
              <div class="performance-label">夏普比率</div>
              <div class="performance-value">
                {{ strategy.performance.sharpeRatio.toFixed(2) }}
              </div>
            </div>
            <div class="performance-item">
              <div class="performance-label">最大回撤</div>
              <div class="performance-value negative">
                {{ (strategy.performance.maxDrawdown * 100).toFixed(2) }}%
              </div>
            </div>
            <div class="performance-item">
              <div class="performance-label">胜率</div>
              <div class="performance-value">
                {{ (strategy.performance.winRate * 100).toFixed(2) }}%
              </div>
            </div>
            <div class="performance-item">
              <div class="performance-label">交易次数</div>
              <div class="performance-value">
                {{ strategy.performance.totalTrades }}
              </div>
            </div>
          </div>
          <div v-else class="no-performance">
            <el-empty description="暂无性能数据" :image-size="80" />
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <!-- 操作面板 -->
        <el-card class="mb-20">
          <template #header>
            <h3>操作面板</h3>
          </template>
          <div class="action-panel">
            <el-button
              v-if="
                strategy.status === 'stopped' || strategy.status === 'draft'
              "
              type="success"
              size="large"
              @click="startStrategy"
              style="width: 100%; margin-bottom: 10px"
            >
              启动策略
            </el-button>
            <el-button
              v-if="strategy.status === 'active'"
              type="warning"
              size="large"
              @click="stopStrategy"
              style="width: 100%; margin-bottom: 10px"
            >
              停止策略
            </el-button>
            <el-button
              type="primary"
              size="large"
              @click="runBacktest"
              style="width: 100%; margin-bottom: 10px"
            >
              回测策略
            </el-button>
            <el-button size="large" @click="viewLogs" style="width: 100%">
              查看日志
            </el-button>
          </div>
        </el-card>

        <!-- 风险参数 -->
        <el-card class="mb-20">
          <template #header>
            <h3>风险参数</h3>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="最大仓位"
              >{{ strategy.maxPosition }}%</el-descriptions-item
            >
            <el-descriptions-item label="止损比例"
              >{{ strategy.stopLoss }}%</el-descriptions-item
            >
            <el-descriptions-item label="止盈比例"
              >{{ strategy.takeProfit }}%</el-descriptions-item
            >
          </el-descriptions>
        </el-card>

        <!-- 最近交易 -->
        <el-card>
          <template #header>
            <div class="card-header">
              <h3>最近交易</h3>
              <el-button size="small" @click="refreshTrades">刷新</el-button>
            </div>
          </template>
          <div v-if="recentTrades.length > 0" class="recent-trades">
            <div
              v-for="trade in recentTrades"
              :key="trade.id"
              class="trade-item"
            >
              <div class="trade-header">
                <span class="trade-symbol">{{ trade.symbol }}</span>
                <el-tag
                  :type="trade.type === 'buy' ? 'success' : 'danger'"
                  size="small"
                >
                  {{ trade.type === "buy" ? "买入" : "卖出" }}
                </el-tag>
              </div>
              <div class="trade-details">
                <span class="trade-price">${{ trade.price }}</span>
                <span class="trade-amount">{{ trade.amount }}</span>
                <span class="trade-time">{{
                  formatTime(trade.timestamp)
                }}</span>
              </div>
            </div>
          </div>
          <div v-else class="no-trades">
            <el-empty description="暂无交易记录" :image-size="60" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";

const router = useRouter();
const route = useRoute();

// 策略数据
const strategy = reactive({
  id: "1",
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
  status: "active",
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
  createdAt: "2024-01-01T00:00:00Z",
  lastRunAt: "2024-01-15T10:30:00Z",
  performance: {
    totalReturn: 0.1567,
    annualizedReturn: 0.2341,
    sharpeRatio: 1.23,
    maxDrawdown: 0.0892,
    winRate: 0.6234,
    totalTrades: 45,
  },
});

// 最近交易
const recentTrades = ref([
  {
    id: "1",
    symbol: "BTC/USDT",
    type: "buy",
    price: "45000",
    amount: "0.1",
    timestamp: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    symbol: "BTC/USDT",
    type: "sell",
    price: "45200",
    amount: "0.1",
    timestamp: "2024-01-15T11:00:00Z",
  },
]);

// 方法
const editStrategy = () => {
  router.push(`/strategies/${strategy.id}/edit`);
};

const duplicateStrategy = () => {
  ElMessage.success("策略复制成功");
};

const exportStrategy = () => {
  const dataStr = JSON.stringify(strategy, null, 2);
  const dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

  const exportFileDefaultName = `${strategy.name}.json`;

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", exportFileDefaultName);
  linkElement.click();

  ElMessage.success("策略导出成功");
};

const copyCode = () => {
  navigator.clipboard.writeText(strategy.code);
  ElMessage.success("代码已复制到剪贴板");
};

const startStrategy = async () => {
  try {
    // TODO: 调用API启动策略
    await new Promise((resolve) => setTimeout(resolve, 1000));
    strategy.status = "active";
    ElMessage.success("策略启动成功");
  } catch (error) {
    ElMessage.error("策略启动失败");
  }
};

const stopStrategy = async () => {
  try {
    // TODO: 调用API停止策略
    await new Promise((resolve) => setTimeout(resolve, 1000));
    strategy.status = "stopped";
    ElMessage.success("策略停止成功");
  } catch (error) {
    ElMessage.error("策略停止失败");
  }
};

const runBacktest = () => {
  router.push(`/backtest?strategy=${strategy.id}`);
};

const viewLogs = () => {
  router.push(`/strategies/${strategy.id}/logs`);
};

const refreshTrades = async () => {
  try {
    // TODO: 调用API刷新交易记录
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ElMessage.success("交易记录已刷新");
  } catch (error) {
    ElMessage.error("刷新失败");
  }
};

// 工具函数
const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    trend: "success",
    momentum: "warning",
    mean_reversion: "info",
    arbitrage: "danger",
  };
  return colors[type] || "info";
};

const getTypeText = (type: string) => {
  const texts: Record<string, string> = {
    trend: "趋势跟踪",
    momentum: "动量策略",
    mean_reversion: "均值回归",
    arbitrage: "套利策略",
  };
  return texts[type] || type;
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: "success",
    stopped: "warning",
    draft: "info",
    error: "danger",
  };
  return colors[status] || "info";
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    active: "运行中",
    stopped: "已停止",
    draft: "草稿",
    error: "错误",
  };
  return texts[status] || status;
};

const formatTime = (timeString: string) => {
  return new Date(timeString).toLocaleString("zh-CN");
};

// 生命周期
onMounted(async () => {
  try {
    // TODO: 根据路由参数获取策略详情
    const strategyId = route.params.id as string;
    // await fetchStrategyDetails(strategyId)
  } catch (error) {
    ElMessage.error("获取策略详情失败");
  }
});
</script>

<style scoped>
.strategy-detail {
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

.mb-20 {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #333;
}

.strategy-description {
  margin-top: 20px;
}

.strategy-description h4 {
  margin: 0 0 8px 0;
  color: #333;
}

.strategy-description p {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

.code-editor {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 16px;
  overflow-x: auto;
}

.code-editor pre {
  margin: 0;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 14px;
  line-height: 1.5;
}

.code-editor code {
  font-family: inherit;
}

.performance-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.performance-item {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.performance-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.performance-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.positive {
  color: #67c23a;
}

.negative {
  color: #f56c6c;
}

.no-performance {
  padding: 40px;
  text-align: center;
}

.action-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.recent-trades {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trade-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid #409eff;
}

.trade-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.trade-symbol {
  font-weight: 600;
  color: #333;
}

.trade-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
}

.trade-price {
  font-weight: 600;
  color: #333;
}

.trade-time {
  color: #999;
}

.no-trades {
  padding: 20px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .strategy-detail {
    padding: 10px;
  }

  .performance-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .page-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}
</style>
