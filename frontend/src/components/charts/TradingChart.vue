<template>
  <div class="trading-chart">
    <div class="chart-header">
      <div class="chart-title">
        <h3>{{ title }}</h3>
        <span class="symbol">{{ symbol }}</span>
      </div>
      <div class="chart-controls">
        <el-button-group>
          <el-button
            v-for="timeframe in timeframes"
            :key="timeframe.value"
            :type="currentTimeframe === timeframe.value ? 'primary' : 'default'"
            size="small"
            @click="changeTimeframe(timeframe.value)"
          >
            {{ timeframe.label }}
          </el-button>
        </el-button-group>
        <el-button size="small" @click="toggleFullscreen">
          <el-icon><full-screen /></el-icon>
        </el-button>
      </div>
    </div>

    <div class="chart-container" ref="chartContainer">
      <div ref="chart" class="chart"></div>

      <!-- 图表加载状态 -->
      <div v-if="loading" class="chart-loading">
        <el-icon class="loading-icon"><loading /></el-icon>
        <span>加载中...</span>
      </div>

      <!-- 图表工具栏 -->
      <div class="chart-toolbar">
        <el-tooltip content="十字线" placement="top">
          <el-button
            size="small"
            :type="tools.crosshair ? 'primary' : 'default'"
            @click="toggleTool('crosshair')"
          >
            <el-icon><aim /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="水平线" placement="top">
          <el-button
            size="small"
            :type="tools.horizontal ? 'primary' : 'default'"
            @click="toggleTool('horizontal')"
          >
            <el-icon><remove /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="垂直线" placement="top">
          <el-button
            size="small"
            :type="tools.vertical ? 'primary' : 'default'"
            @click="toggleTool('vertical')"
          >
            <el-icon><remove /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="趋势线" placement="top">
          <el-button
            size="small"
            :type="tools.trend ? 'primary' : 'default'"
            @click="toggleTool('trend')"
          >
            <el-icon><operation /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="斐波那契" placement="top">
          <el-button
            size="small"
            :type="tools.fibonacci ? 'primary' : 'default'"
            @click="toggleTool('fibonacci')"
          >
            <el-icon><share /></el-icon>
          </el-button>
        </el-tooltip>
        <el-divider direction="vertical" />
        <el-tooltip content="指标设置" placement="top">
          <el-button size="small" @click="openIndicatorSettings">
            <el-icon><setting /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="清除标记" placement="top">
          <el-button size="small" @click="clearDrawings">
            <el-icon><delete /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="截图" placement="top">
          <el-button size="small" @click="takeScreenshot">
            <el-icon><camera /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- 图例和指标 -->
    <div class="chart-legend">
      <div
        class="legend-item"
        v-for="indicator in visibleIndicators"
        :key="indicator.name"
      >
        <div
          class="legend-color"
          :style="{ backgroundColor: indicator.color }"
        ></div>
        <span class="legend-label">{{ indicator.name }}</span>
        <span class="legend-value">{{ indicator.value }}</span>
      </div>
    </div>

    <!-- 市场信息面板 -->
    <div class="market-info">
      <div class="info-item">
        <span class="label">最新价</span>
        <span class="value" :class="priceChange >= 0 ? 'positive' : 'negative'">
          {{ latestPrice }}
        </span>
      </div>
      <div class="info-item">
        <span class="label">涨跌幅</span>
        <span class="value" :class="priceChange >= 0 ? 'positive' : 'negative'">
          {{ priceChange >= 0 ? "+" : "" }}{{ priceChangePercent }}%
        </span>
      </div>
      <div class="info-item">
        <span class="label">成交量</span>
        <span class="value">{{ volume }}</span>
      </div>
      <div class="info-item">
        <span class="label">最高价</span>
        <span class="value">{{ highPrice }}</span>
      </div>
      <div class="info-item">
        <span class="label">最低价</span>
        <span class="value">{{ lowPrice }}</span>
      </div>
    </div>
  </div>

  <!-- 指标设置对话框 -->
  <el-dialog
    v-model="indicatorSettingsOpen"
    title="技术指标设置"
    width="500px"
    @closed="saveIndicatorSettings"
  >
    <div class="indicator-settings">
      <h4>移动平均线</h4>
      <div class="setting-item">
        <el-checkbox v-model="indicators.ma5">MA5</el-checkbox>
        <el-checkbox v-model="indicators.ma10">MA10</el-checkbox>
        <el-checkbox v-model="indicators.ma20">MA20</el-checkbox>
      </div>

      <h4>震荡指标</h4>
      <div class="setting-item">
        <el-checkbox v-model="indicators.rsi">RSI</el-checkbox>
        <el-checkbox v-model="indicators.macd">MACD</el-checkbox>
        <el-checkbox v-model="indicators.bollinger">布林带</el-checkbox>
      </div>

      <h4>成交量</h4>
      <div class="setting-item">
        <el-checkbox v-model="indicators.volume">显示成交量</el-checkbox>
      </div>
    </div>

    <template #footer>
      <el-button @click="indicatorSettingsOpen = false">取消</el-button>
      <el-button type="primary" @click="saveIndicatorSettings">
        保存设置
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from "vue";
import * as echarts from "echarts";
import {
  Loading,
  FullScreen,
  Aim,
  Operation,
  Delete,
  Camera,
  Remove,
  Share,
  Setting,
} from "@element-plus/icons-vue";

interface Props {
  title?: string;
  symbol?: string;
  height?: number;
  realtime?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: "价格走势图",
  symbol: "BTC/USDT",
  height: 400,
  realtime: true,
});

const chartContainer = ref<HTMLElement>();
const chart = ref<HTMLElement>();
let chartInstance: echarts.ECharts | null = null;

// 指标设置对话框
const indicatorSettingsOpen = ref(false);

// 状态管理
const loading = ref(false);
const currentTimeframe = ref("1h");
const isFullscreen = ref(false);

// 时间周期选项
const timeframes = [
  { label: "1分钟", value: "1m" },
  { label: "5分钟", value: "5m" },
  { label: "15分钟", value: "15m" },
  { label: "30分钟", value: "30m" },
  { label: "1小时", value: "1h" },
  { label: "2小时", value: "2h" },
  { label: "4小时", value: "4h" },
  { label: "1天", value: "1d" },
  { label: "3天", value: "3d" },
  { label: "1周", value: "1w" },
  { label: "1月", value: "1M" },
];

// 工具状态
const tools = reactive({
  crosshair: false,
  line: false,
  rectangle: false,
  horizontal: false,
  vertical: false,
  trend: false,
  fibonacci: false,
});

// 指标状态
const indicators = reactive({
  ma5: true,
  ma10: true,
  ma20: true,
  rsi: true,
  macd: false,
  bollinger: false,
  volume: true,
});

// 市场数据
const latestPrice = ref("45000.00");
const priceChange = ref(150.0);
const priceChangePercent = ref(0.33);
const volume = ref("1234.56");
const highPrice = ref("45200.00");
const lowPrice = ref("44800.00");

// 技术指标显示
const displayedIndicators = ref([
  { name: "MA5", value: "44950.00", color: "#00d4aa", visible: true },
  { name: "MA10", value: "44800.00", color: "#ff6b6b", visible: true },
  { name: "MA20", value: "44600.00", color: "#4ecdc4", visible: true },
  { name: "RSI", value: "65.4", color: "#45b7d1", visible: true },
]);

// 计算可见指标
const visibleIndicators = computed(() => {
  return displayedIndicators.value.filter((indicator) => indicator.visible);
});

// 模拟数据生成
const generateMockData = (count: number = 100) => {
  const data = [];
  let basePrice = 45000;
  const now = Date.now();

  for (let i = count - 1; i >= 0; i--) {
    const time = now - i * 60000; // 1分钟间隔
    const volatility = 0.002; // 0.2% 波动率
    const change = (Math.random() - 0.5) * volatility * basePrice;

    basePrice += change;
    const high = basePrice + Math.random() * 50;
    const low = basePrice - Math.random() * 50;
    const open = basePrice + (Math.random() - 0.5) * 20;
    const close = basePrice;

    data.push([
      time,
      open.toFixed(2),
      high.toFixed(2),
      low.toFixed(2),
      close.toFixed(2),
    ]);
  }

  return data;
};

// 初始化图表
const initChart = async () => {
  await nextTick();

  if (!chart.value) return;

  chartInstance = echarts.init(chart.value);

  const option = {
    backgroundColor: "transparent",
    grid: {
      left: "8%",
      right: "8%",
      top: "12%",
      bottom: "18%",
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
    xAxis: {
      type: "time",
      axisLine: {
        lineStyle: {
          color: "rgba(255, 255, 255, 0.2)",
        },
      },
      axisLabel: {
        color: "rgba(255, 255, 255, 0.8)",
        fontSize: 11,
        fontFamily: "monospace",
      },
      splitLine: {
        lineStyle: {
          color: "rgba(255, 255, 255, 0.05)",
          type: "dashed",
        },
      },
      axisPointer: {
        lineStyle: {
          color: "rgba(0, 212, 170, 0.8)",
          type: "dashed",
        },
      },
    },
    yAxis: {
      type: "value",
      scale: true,
      axisLine: {
        lineStyle: {
          color: "rgba(255, 255, 255, 0.2)",
        },
      },
      axisLabel: {
        color: "rgba(255, 255, 255, 0.8)",
        fontSize: 11,
        fontFamily: "monospace",
        formatter: (value: number) => value.toFixed(2),
      },
      splitLine: {
        lineStyle: {
          color: "rgba(255, 255, 255, 0.05)",
          type: "dashed",
        },
      },
      axisPointer: {
        lineStyle: {
          color: "rgba(0, 212, 170, 0.8)",
          type: "dashed",
        },
      },
    },
    series: [
      {
        name: "K线",
        type: "candlestick",
        data: generateMockData(),
        itemStyle: {
          color: "#00d4aa",
          color0: "#ff4757",
          borderColor: "#00d4aa",
          borderColor0: "#ff4757",
          borderWidth: 1,
        },
      },
      {
        name: "MA5",
        type: "line",
        data: [],
        lineStyle: {
          color: "#00d4aa",
          width: 2,
        },
        smooth: true,
      },
      {
        name: "MA10",
        type: "line",
        data: [],
        lineStyle: {
          color: "#ff6b6b",
          width: 2,
        },
        smooth: true,
      },
      {
        name: "MA20",
        type: "line",
        data: [],
        lineStyle: {
          color: "#4ecdc4",
          width: 2,
        },
        smooth: true,
      },
    ],
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(0, 0, 0, 0.9)",
      borderColor: "rgba(0, 212, 170, 0.5)",
      borderWidth: 1,
      textStyle: {
        color: "#ffffff",
        fontSize: 12,
        fontFamily: "monospace",
      },
      extraCssText:
        "backdrop-filter: blur(10px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);",
      formatter: (params: any) => {
        const data = params[0].data;
        const change = (
          ((parseFloat(data[4]) - parseFloat(data[1])) / parseFloat(data[1])) *
          100
        ).toFixed(2);
        const changeColor = change >= 0 ? "#00d4aa" : "#ff4757";
        return `
          <div style="padding: 12px; min-width: 200px">
            <div style="margin-bottom: 8px; font-weight: 600; color: #00d4aa">
              ${new Date(data[0]).toLocaleString()}
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0">
              <span style="color: rgba(255, 255, 255, 0.7)">开盘:</span>
              <span style="color: #ffffff; font-family: monospace">${data[1]}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0">
              <span style="color: rgba(255, 255, 255, 0.7)">最高:</span>
              <span style="color: #00d4aa; font-family: monospace">${data[2]}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0">
              <span style="color: rgba(255, 255, 255, 0.7)">最低:</span>
              <span style="color: #ff4757; font-family: monospace">${data[3]}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0">
              <span style="color: rgba(255, 255, 255, 0.7)">收盘:</span>
              <span style="color: #ffffff; font-family: monospace">${data[4]}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0">
              <span style="color: rgba(255, 255, 255, 0.7)">涨跌:</span>
              <span style="color: ${changeColor}; font-family: monospace">${change >= 0 ? "+" : ""}${change}%</span>
            </div>
          </div>
        `;
      },
    },
    dataZoom: [
      {
        type: "inside",
        start: 80,
        end: 100,
        zoomLock: false,
        moveOnMouseMove: true,
      },
      {
        start: 80,
        end: 100,
        height: 25,
        bottom: 30,
        handleIcon:
          "M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z",
        handleSize: "80%",
        handleStyle: {
          color: "rgba(0, 212, 170, 0.8)",
          borderColor: "rgba(0, 212, 170, 1)",
          borderWidth: 1,
        },
        textStyle: {
          color: "rgba(255, 255, 255, 0.8)",
          fontSize: 11,
        },
        borderColor: "rgba(255, 255, 255, 0.2)",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        fillerColor: "rgba(0, 212, 170, 0.1)",
        dataBackground: {
          lineStyle: {
            color: "rgba(255, 255, 255, 0.1)",
            width: 1,
          },
          areaStyle: {
            color: "rgba(255, 255, 255, 0.05)",
          },
        },
      },
    ],
  };

  chartInstance.setOption(option);

  // 响应式处理
  window.addEventListener("resize", handleResize);
};

// 更新图表数据
const updateChart = () => {
  if (!chartInstance) return;

  const newData = generateMockData(50);
  const option = {
    series: [
      {
        data: newData,
      },
    ],
  };

  chartInstance.setOption(option);
};

// 实时数据更新
let updateInterval: NodeJS.Timeout | null = null;

const startRealtimeUpdate = () => {
  if (!props.realtime) return;

  updateInterval = setInterval(() => {
    updateChart();
    updateMarketData();
  }, 3000); // 3秒更新一次
};

const stopRealtimeUpdate = () => {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
};

// 更新市场数据
const updateMarketData = () => {
  // 模拟价格变化
  const change = (Math.random() - 0.5) * 100;
  const currentPrice = parseFloat(latestPrice.value);
  const newPrice = currentPrice + change;

  latestPrice.value = newPrice.toFixed(2);
  priceChange.value = change;
  priceChangePercent.value = ((change / currentPrice) * 100).toFixed(2);

  // 更新成交量
  volume.value = (Math.random() * 2000 + 500).toFixed(2);

  // 更新最高最低价
  if (newPrice > parseFloat(highPrice.value)) {
    highPrice.value = newPrice.toFixed(2);
  }
  if (newPrice < parseFloat(lowPrice.value)) {
    lowPrice.value = newPrice.toFixed(2);
  }
};

// 切换时间周期
const changeTimeframe = (timeframe: string) => {
  currentTimeframe.value = timeframe;
  loading.value = true;

  // 模拟加载新数据
  setTimeout(() => {
    updateChart();
    loading.value = false;
  }, 500);
};

// 切换工具
const toggleTool = (tool: string) => {
  // 重置所有工具
  Object.keys(tools).forEach((key) => {
    tools[key as keyof typeof tools] = false;
  });

  // 启用选中的工具
  tools[tool as keyof typeof tools] = true;
};

// 清除绘制
const clearDrawings = () => {
  // 实现清除绘制功能
  console.log("清除绘制");
};

// 截图功能
const takeScreenshot = () => {
  if (!chartInstance) return;

  const url = chartInstance.getDataURL({
    type: "png",
    pixelRatio: 2,
    backgroundColor: "#1a1a2e",
  });

  const link = document.createElement("a");
  link.download = `${props.symbol}_${new Date().toISOString().slice(0, 10)}.png`;
  link.href = url;
  link.click();
};

// 打开指标设置
const openIndicatorSettings = () => {
  indicatorSettingsOpen.value = true;
};

// 保存指标设置
const saveIndicatorSettings = () => {
  // 更新显示的指标
  displayedIndicators.value = displayedIndicators.value.map((indicator) => {
    return {
      ...indicator,
      visible:
        indicators[indicator.name.toLowerCase() as keyof typeof indicators],
    };
  });

  // 更新图表
  updateChartWithIndicators();

  indicatorSettingsOpen.value = false;

  // 保存到本地存储
  localStorage.setItem("chartIndicators", JSON.stringify(indicators));
};

// 根据指标设置更新图表
const updateChartWithIndicators = () => {
  if (!chartInstance) return;

  const series = [];

  // K线图
  series.push({
    name: "K线",
    type: "candlestick",
    data: generateMockData(),
    itemStyle: {
      color: "#00d4aa",
      color0: "#ff4757",
      borderColor: "#00d4aa",
      borderColor0: "#ff4757",
      borderWidth: 1,
    },
  });

  // 移动平均线
  if (indicators.ma5) {
    series.push({
      name: "MA5",
      type: "line",
      data: [],
      lineStyle: {
        color: "#00d4aa",
        width: 2,
      },
      smooth: true,
    });
  }

  if (indicators.ma10) {
    series.push({
      name: "MA10",
      type: "line",
      data: [],
      lineStyle: {
        color: "#ff6b6b",
        width: 2,
      },
      smooth: true,
    });
  }

  if (indicators.ma20) {
    series.push({
      name: "MA20",
      type: "line",
      data: [],
      lineStyle: {
        color: "#4ecdc4",
        width: 2,
      },
      smooth: true,
    });
  }

  // 更新图表
  const option = {
    series: series,
  };

  chartInstance.setOption(option);
};

// 全屏切换
const toggleFullscreen = () => {
  if (!chartContainer.value) return;

  if (!document.fullscreenElement) {
    chartContainer.value.requestFullscreen();
    isFullscreen.value = true;
  } else {
    document.exitFullscreen();
    isFullscreen.value = false;
  }
};

// 响应式处理
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize();
  }
};

// 生命周期
onMounted(() => {
  // 加载保存的指标设置
  const savedIndicators = localStorage.getItem("chartIndicators");
  if (savedIndicators) {
    try {
      const saved = JSON.parse(savedIndicators);
      Object.assign(indicators, saved);
    } catch (error) {
      console.error("Failed to load saved indicators:", error);
    }
  }

  initChart();
  startRealtimeUpdate();
});

onUnmounted(() => {
  stopRealtimeUpdate();
  window.removeEventListener("resize", handleResize);
  if (chartInstance) {
    chartInstance.dispose();
  }
});
</script>

<style scoped>
.trading-chart {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  transition: all 0.3s ease;
}

.trading-chart:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chart-title h3 {
  margin: 0;
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
}

.symbol {
  color: #00d4aa;
  font-weight: 500;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chart-container {
  position: relative;
  height: v-bind('props.height + "px"');
}

.chart {
  width: 100%;
  height: 100%;
}

.chart-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.7);
}

.loading-icon {
  font-size: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.chart-toolbar {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 5px;
  background: rgba(0, 0, 0, 0.5);
  padding: 5px;
  border-radius: 6px;
  backdrop-filter: blur(10px);
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  padding: 15px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-label {
  color: rgba(255, 255, 255, 0.7);
}

.legend-value {
  color: #ffffff;
  font-weight: 500;
}

.market-info {
  display: flex;
  justify-content: space-around;
  padding: 15px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.info-item .label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.info-item .value {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.positive {
  color: #00d4aa !important;
}

.negative {
  color: #ff4757 !important;
}

/* 全屏模式样式 */
.trading-chart:fullscreen {
  background: #1a1a2e;
  border-radius: 0;
}

.trading-chart:fullscreen .chart-container {
  height: calc(100vh - 200px);
}

/* 指标设置对话框样式 */
.indicator-settings {
  padding: 10px 0;
}

.indicator-settings h4 {
  color: #ffffff;
  margin: 20px 0 10px 0;
  font-size: 16px;
  font-weight: 600;
}

.setting-item {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  padding: 10px 0;
}

.setting-item .el-checkbox {
  color: #e0e0e0;
}

/* Element Plus 对话框样式覆盖 */
:deep(.el-dialog) {
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.el-dialog__header) {
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.el-dialog__title) {
  color: #ffffff;
}

:deep(.el-dialog__body) {
  background: rgba(255, 255, 255, 0.02);
  color: #e0e0e0;
}

:deep(.el-checkbox__label) {
  color: #e0e0e0;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #00d4aa;
  border-color: #00d4aa;
}
</style>
