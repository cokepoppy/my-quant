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
      backgroundColor: 'var(--secondary-bg)',
      borderColor: 'var(--border-color)',
      textStyle: {
        color: 'var(--secondary-text)'
      },
      formatter: (params: any) => {
        const value = params.value
        const percent = params.percent
        return `
          <div style="padding: 8px">
            <div style="margin-bottom: 4px; font-weight: 600">${params.name}</div>
            <div>贡献: <span style="color: ${value >= 0 ? 'var(--positive-color)' : 'var(--negative-color)'}">${value >= 0 ? '+' : ''}${value}%</span></div>
            <div>占比: ${percent.toFixed(1)}%</div>
          </div>
        `
      }
    },
    series: [{
      name: '收益分布',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '50%'],
      data: data.map(item => ({
        ...item,
        itemStyle: {
          color: item.value >= 0 ? 'var(--positive-color)' : 'var(--negative-color)'
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
        color: 'var(--secondary-text)',
        fontSize: 12
      },
      labelLine: {
        show: true,
        lineStyle: {
          color: 'var(--border-color)'
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