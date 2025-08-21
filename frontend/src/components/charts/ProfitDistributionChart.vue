<template>
  <div class="profit-distribution-chart">
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

interface Props {
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: 300
})

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

const generateData = () => {
  return [
    { name: 'MA双均线策略', value: 45.2 },
    { name: '网格交易策略', value: 32.8 },
    { name: 'RSI超卖策略', value: -8.5 },
    { name: 'MACD策略', value: 18.7 },
    { name: '其他策略', value: 11.8 }
  ]
}

const initChart = () => {
  if (!chartRef.value) return

  chart = echarts.init(chartRef.value)
  updateChart()
}

const updateChart = () => {
  if (!chart) return

  const data = generateData()
  
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      borderColor: '#00d4aa',
      borderWidth: 2,
      textStyle: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: 600
      },
      extraCssText: 'box-shadow: 0 8px 32px rgba(0, 212, 170, 0.3); border-radius: 8px;',
      formatter: (params: any) => {
        const value = params.value
        const percent = params.percent
        const valueColor = value >= 0 ? '#00d4aa' : '#ff3b30'
        return `
          <div style="padding: 12px; min-width: 180px;">
            <div style="margin-bottom: 8px; font-weight: 700; font-size: 14px; color: #00d4aa;">${params.name}</div>
            <div style="margin-bottom: 6px;">贡献: <span style="color: ${valueColor}; font-weight: 700;">${value >= 0 ? '+' : ''}${value}%</span></div>
            <div style="font-size: 12px; color: #e0e0e0;">占比: ${percent.toFixed(1)}%</div>
          </div>
        `
      }
    },
    series: [{
      name: '收益分布',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '50%'],
      data: data.map((item, index) => ({
        ...item,
        itemStyle: {
          color: item.value >= 0 ? 
            ['#00d4aa', '#00b894', '#00a085', '#008876', '#007067'][index % 5] : 
            ['#ff3b30', '#e02e24', '#cc251e', '#b71c1c', '#a01818'][index % 5],
          borderColor: '#ffffff',
          borderWidth: 2,
          shadowColor: item.value >= 0 ? '#00d4aa' : '#ff3b30',
          shadowBlur: 8
        }
      })),
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      label: {
        show: true,
        position: 'outside',
        formatter: '{b}\n{d}%',
        color: '#ffffff',
        fontSize: 13,
        fontWeight: 600,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: [4, 8],
        borderRadius: 4
      },
      labelLine: {
        show: true,
        lineStyle: {
          color: '#404040',
          width: 2
        }
      }
    }]
  }

  chart.setOption(option)
}

const handleThemeChange = () => {
  if (chart) {
    chart.dispose()
    initChart()
  }
}

onMounted(() => {
  initChart()
  
  // 监听主题变化
  const observer = new MutationObserver(() => {
    handleThemeChange()
  })
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })
  
  // 响应式处理
  window.addEventListener('resize', () => {
    chart?.resize()
  })
})

onBeforeUnmount(() => {
  if (chart) {
    chart.dispose()
  }
})
</script>

<style scoped>
.profit-distribution-chart {
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  height: 100%;
}
</style>