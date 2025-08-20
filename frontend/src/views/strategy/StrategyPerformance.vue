<template>
  <div class="strategy-performance">
    <div class="page-header animate-fade-in">
      <h2 class="text-gradient-primary">策略性能分析</h2>
      <div class="header-actions">
        <el-button @click="$router.go(-1)" class="premium-button">返回</el-button>
        <el-button type="primary" @click="refreshData" class="premium-button primary">
          <el-icon><refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 性能概览卡片 -->
    <div class="performance-overview animate-fade-in delay-1">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="premium-stat-card">
            <div class="stat-icon total">
              <el-icon><trend-charts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ performance.totalReturn }}%</div>
              <div class="stat-label">总收益率</div>
              <div class="stat-change" :class="performance.totalReturn >= 0 ? 'positive' : 'negative'">
                {{ performance.totalReturn >= 0 ? '+' : '' }}{{ performance.totalReturn }}%
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="premium-stat-card">
            <div class="stat-icon winrate">
              <el-icon><pie-chart /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ performance.winRate }}%</div>
              <div class="stat-label">胜率</div>
              <div class="stat-change positive">{{ performance.winRate }}%</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="premium-stat-card">
            <div class="stat-icon profit">
              <el-icon><money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">${{ performance.totalProfit.toLocaleString() }}</div>
              <div class="stat-label">总盈利</div>
              <div class="stat-change" :class="performance.totalProfit >= 0 ? 'positive' : 'negative'">
                {{ performance.totalProfit >= 0 ? '+' : '' }}${{ performance.totalProfit.toLocaleString() }}
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="premium-stat-card">
            <div class="stat-icon trades">
              <el-icon><list /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ performance.totalTrades }}</div>
              <div class="stat-label">总交易次数</div>
              <div class="stat-change">{{ performance.totalTrades }} 次</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 详细性能指标 -->
    <div class="performance-details animate-fade-in delay-2">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="premium-card">
            <template #header>
              <div class="card-header">
                <h3>风险指标</h3>
              </div>
            </template>
            <div class="risk-metrics">
              <div class="metric-item">
                <div class="metric-label">最大回撤</div>
                <div class="metric-value" :class="performance.maxDrawdown >= 0 ? 'negative' : 'positive'">
                  {{ performance.maxDrawdown }}%
                </div>
              </div>
              <div class="metric-item">
                <div class="metric-label">夏普比率</div>
                <div class="metric-value">{{ performance.sharpeRatio }}</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">信息比率</div>
                <div class="metric-value">{{ performance.informationRatio }}</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Sortino比率</div>
                <div class="metric-value">{{ performance.sortinoRatio }}</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Calmar比率</div>
                <div class="metric-value">{{ performance.calmarRatio }}</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Beta系数</div>
                <div class="metric-value">{{ performance.beta }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="premium-card">
            <template #header>
              <div class="card-header">
                <h3>交易统计</h3>
              </div>
            </template>
            <div class="trade-stats">
              <div class="metric-item">
                <div class="metric-label">盈利交易</div>
                <div class="metric-value positive">{{ performance.winningTrades }}</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">亏损交易</div>
                <div class="metric-value negative">{{ performance.losingTrades }}</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">平均盈利</div>
                <div class="metric-value positive">${{ performance.avgWin }}</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">平均亏损</div>
                <div class="metric-value negative">${{ performance.avgLoss }}</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">盈亏比</div>
                <div class="metric-value">{{ performance.profitFactor }}</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">最大连续盈利</div>
                <div class="metric-value positive">{{ performance.maxConsecutiveWins }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 收益曲线图表 -->
    <div class="performance-charts animate-fade-in delay-3">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-card class="premium-card">
            <template #header>
              <div class="card-header">
                <h3>收益曲线</h3>
                <div class="chart-controls">
                  <el-radio-group v-model="chartPeriod" size="small">
                    <el-radio-button label="1d">1天</el-radio-button>
                    <el-radio-button label="1w">1周</el-radio-button>
                    <el-radio-button label="1m">1月</el-radio-button>
                    <el-radio-button label="3m">3月</el-radio-button>
                    <el-radio-button label="1y">1年</el-radio-button>
                    <el-radio-button label="all">全部</el-radio-button>
                  </el-radio-group>
                </div>
              </div>
            </template>
            <div class="chart-container">
              <StrategyPerformanceChart
                :data="performance.equityCurve"
                :height="400"
                :realtime="false"
              />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 月度收益分布 -->
    <div class="monthly-returns animate-fade-in delay-4">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="premium-card">
            <template #header>
              <div class="card-header">
                <h3>月度收益分布</h3>
              </div>
            </template>
            <div class="chart-container">
              <ProfitDistributionChart
                :data="performance.monthlyReturns"
                :height="300"
              />
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="premium-card">
            <template #header>
              <div class="card-header">
                <h3>收益分布直方图</h3>
              </div>
            </template>
            <div class="chart-container">
              <ProfitDistributionChart
                :data="performance.returnsDistribution"
                :height="300"
              />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 导出功能 -->
    <div class="export-section animate-fade-in delay-5">
      <el-card class="premium-card">
        <template #header>
          <div class="card-header">
            <h3>数据导出</h3>
          </div>
        </template>
        <div class="export-options">
          <el-button @click="exportPerformance" class="premium-button">
            <el-icon><download /></el-icon>
            导出性能报告
          </el-button>
          <el-button @click="exportTrades" class="premium-button">
            <el-icon><document /></el-icon>
            导出交易记录
          </el-button>
          <el-button @click="exportChartData" class="premium-button">
            <el-icon><pie-chart /></el-icon>
            导出图表数据
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  Refresh,
  TrendCharts,
  PieChart,
  Money,
  List,
  Download,
  Document,
} from '@element-plus/icons-vue';
import StrategyPerformanceChart from '@/components/charts/StrategyPerformanceChart.vue';
import ProfitDistributionChart from '@/components/charts/ProfitDistributionChart.vue';

const route = useRoute();
const router = useRouter();

// 响应式数据
const loading = ref(false);
const chartPeriod = ref('1m');

// 性能数据
const performance = reactive({
  totalReturn: 15.6,
  winRate: 68.5,
  totalProfit: 12580,
  totalTrades: 156,
  maxDrawdown: -8.2,
  sharpeRatio: 1.85,
  informationRatio: 0.92,
  sortinoRatio: 2.15,
  calmarRatio: 1.90,
  beta: 0.85,
  winningTrades: 107,
  losingTrades: 49,
  avgWin: 156.8,
  avgLoss: -89.2,
  profitFactor: 1.76,
  maxConsecutiveWins: 8,
  equityCurve: [],
  monthlyReturns: [],
  returnsDistribution: [],
});

// 方法
const fetchPerformanceData = async () => {
  loading.value = true;
  try {
    // TODO: 从API获取策略性能数据
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 模拟数据
    performance.equityCurve = generateEquityCurve();
    performance.monthlyReturns = generateMonthlyReturns();
    performance.returnsDistribution = generateReturnsDistribution();
  } catch (error) {
    ElMessage.error('获取性能数据失败');
  } finally {
    loading.value = false;
  }
};

const refreshData = () => {
  fetchPerformanceData();
};

const exportPerformance = () => {
  // TODO: 导出性能报告
  ElMessage.success('性能报告导出成功');
};

const exportTrades = () => {
  // TODO: 导出交易记录
  ElMessage.success('交易记录导出成功');
};

const exportChartData = () => {
  // TODO: 导出图表数据
  ElMessage.success('图表数据导出成功');
};

// 生成模拟数据
const generateEquityCurve = () => {
  const data = [];
  let value = 10000;
  for (let i = 0; i < 100; i++) {
    value += (Math.random() - 0.4) * 100;
    data.push({
      timestamp: new Date(Date.now() - (100 - i) * 24 * 60 * 60 * 1000),
      value: Math.round(value),
    });
  }
  return data;
};

const generateMonthlyReturns = () => {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  return months.map(month => ({
    month,
    return: (Math.random() - 0.3) * 10,
  }));
};

const generateReturnsDistribution = () => {
  const data = [];
  for (let i = -10; i <= 10; i++) {
    data.push({
      range: `${i}%`,
      count: Math.floor(Math.random() * 20) + 1,
    });
  }
  return data;
};

// 生命周期
onMounted(() => {
  fetchPerformanceData();
});
</script>

<style scoped>
.strategy-performance {
  padding: 20px;
  background: var(--gradient-primary);
  min-height: 100vh;
  position: relative;
}

.strategy-performance::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 10% 20%, rgba(0, 122, 255, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 90% 80%, rgba(0, 212, 170, 0.05) 0%, transparent 50%);
  pointer-events: none;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  position: relative;
  z-index: 1;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  box-shadow: var(--shadow-glass);
  transition: all var(--transition-smooth) var(--transition-spring);
}

.page-header:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-premium-lg);
}

.page-header h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.performance-overview {
  margin-bottom: 30px;
  position: relative;
  z-index: 1;
}

.premium-stat-card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  position: relative;
  overflow: hidden;
  transition: all var(--transition-smooth) var(--transition-spring);
  height: 100%;
}

.premium-stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--btn-primary), var(--market-up), var(--market-down));
  animation: shimmer 2s linear infinite;
}

.premium-stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-premium-lg);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  position: relative;
  overflow: hidden;
  margin-bottom: var(--space-md);
}

.stat-icon::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.stat-icon:hover::before {
  left: 100%;
}

.stat-icon.total {
  background: linear-gradient(135deg, var(--btn-primary) 0%, #4a90e2 100%);
  box-shadow: var(--glow-primary);
}

.stat-icon.winrate {
  background: linear-gradient(135deg, var(--market-up) 0%, #00a885 100%);
  box-shadow: var(--glow-success);
}

.stat-icon.profit {
  background: linear-gradient(135deg, var(--market-up) 0%, #00a885 100%);
  box-shadow: var(--glow-success);
}

.stat-icon.trades {
  background: linear-gradient(135deg, var(--market-volatile) 0%, #e07f00 100%);
  box-shadow: var(--glow-warning);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  margin-bottom: var(--space-xs);
}

.stat-label {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: var(--space-xs);
  font-weight: 500;
}

.stat-change {
  font-size: 14px;
  font-weight: 600;
}

.stat-change.positive {
  color: var(--market-up);
}

.stat-change.negative {
  color: var(--market-down);
}

.performance-details,
.performance-charts,
.monthly-returns,
.export-section {
  margin-bottom: 30px;
  position: relative;
  z-index: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-weight: var(--font-semibold);
  font-size: var(--font-lg);
}

.chart-controls {
  display: flex;
  gap: var(--space-md);
}

.risk-metrics,
.trade-stats {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--glass-border);
}

.metric-item:last-child {
  border-bottom: none;
}

.metric-label {
  color: var(--text-secondary);
  font-size: var(--font-sm);
  font-weight: 500;
}

.metric-value {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.metric-value.positive {
  color: var(--market-up);
}

.metric-value.negative {
  color: var(--market-down);
}

.chart-container {
  position: relative;
  height: 400px;
}

.export-options {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
}

/* 动画效果 */
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }
.delay-3 { animation-delay: 0.3s; }
.delay-4 { animation-delay: 0.4s; }
.delay-5 { animation-delay: 0.5s; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .strategy-performance {
    padding: 10px;
  }

  .page-header {
    flex-direction: column;
    gap: var(--space-md);
    text-align: center;
  }

  .header-actions {
    justify-content: center;
  }

  .performance-overview .el-col {
    margin-bottom: var(--space-md);
  }

  .chart-controls {
    flex-direction: column;
    gap: var(--space-sm);
  }

  .export-options {
    flex-direction: column;
  }

  .export-options .el-button {
    width: 100%;
  }
}
</style>