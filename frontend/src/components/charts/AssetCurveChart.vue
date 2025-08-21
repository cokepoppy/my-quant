<template>
  <div class="asset-curve-chart">
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'

interface Props {
  period?: string
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  period: '1m',
  height: 300
})

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

// 生成模拟数据
const generateData = (period: string) => {
  const data = []
  const now = new Date()
  let dataPoints = 30
  let interval = 24 * 60 * 60 * 1000 // 1天

  switch (period) {
    case '1d':
      dataPoints = 24
      interval = 60 * 60 * 1000 // 1小时
      break
    case '1w':
      dataPoints = 7
      interval = 24 * 60 * 60 * 1000 // 1天
      break
    case '1m':
      dataPoints = 30
      interval = 24 * 60 * 60 * 1000 // 1天
      break
    case '3m':
      dataPoints = 90
      interval = 24 * 60 * 60 * 1000 // 1天
      break
    case '1y':
      dataPoints = 365
      interval = 24 * 60 * 60 * 1000 // 1天
      break
  }

  let baseValue = 100000
  for (let i = dataPoints - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * interval)
    const change = (Math.random() - 0.5) * 2000
    baseValue += change
    data.push([time.getTime(), baseValue])
  }

  return data
}

const initChart = () => {
  if (!chartRef.value) return

  chart = echarts.init(chartRef.value)
  updateChart()
}

const updateChart = () => {
  if (!chart) return

  const data = generateData(props.period)
  
  const option = {
    backgroundColor: 'transparent',
    grid: {
      left: '3%',
      right: '3%',
      top: '3%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'time',
      axisLine: {
        lineStyle: {
          color: 'var(--border-primary)'
        }
      },
      axisLabel: {
        color: 'var(--text-muted)',
        fontSize: 10
      },
      splitLine: {
        lineStyle: {
          color: 'var(--border-primary)',
          opacity: 0.3
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: 'var(--border-primary)'
        }
      },
      axisLabel: {
        color: 'var(--text-muted)',
        fontSize: 10,
        formatter: (value: number) => {
          return (value / 1000).toFixed(0) + 'K'
        }
      },
      splitLine: {
        lineStyle: {
          color: 'var(--border-primary)',
          opacity: 0.3
        }
      }
    },
    series: [{
      name: '总资产',
      type: 'line',
      data: data,
      smooth: true,
      showSymbol: false,
      lineStyle: {
        color: 'var(--market-up)',
        width: 2
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0,
            color: 'rgba(0, 212, 170, 0.3)'
          }, {
            offset: 1,
            color: 'rgba(0, 212, 170, 0.05)'
          }]
        }
      }
    }],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'var(--surface-overlay)',
      borderColor: 'var(--border-primary)',
      textStyle: {
        color: 'var(--text-primary)'
      },
      formatter: (params: any) => {
        const data = params[0]
        const value = data.data[1]
        const date = new Date(data.data[0])
        return `
          <div style="padding: 8px">
            <div style="margin-bottom: 4px; font-weight: 600">${date.toLocaleDateString('zh-CN')}</div>
            <div>总资产: <span style="color: var(--market-up)">$${value.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span></div>
          </div>
        `
      }
    }
  }

  chart.setOption(option)
}

// 监听周期变化
watch(() => props.period, () => {
  updateChart()
})

// 监听主题变化
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

// 清理
onBeforeUnmount(() => {
  if (chart) {
    chart.dispose()
  }
})
</script>

<style scoped>
.asset-curve-chart {
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  height: 100%;
}
</style>