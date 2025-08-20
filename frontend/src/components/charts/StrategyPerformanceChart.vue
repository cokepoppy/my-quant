<template>
  <div class="strategy-performance-chart">
    <div ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

interface Props {
  data: Array<{
    timestamp: string | Date
    value: number
    benchmark?: number
  }>
  height?: number
  realtime?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  height: 300,
  realtime: false
})

const emit = defineEmits<{
  'update:data': [data: Props['data']]
}>()

const chartContainer = ref<HTMLElement>()
let chart: echarts.ECharts | null = null
let updateInterval: number | null = null

// Initialize chart
const initChart = () => {
  if (!chartContainer.value) return
  
  chart = echarts.init(chartContainer.value)
  
  const option = getChartOption()
  chart.setOption(option)
  
  // Handle resize
  window.addEventListener('resize', handleResize)
}

// Get chart configuration
const getChartOption = () => {
  const times = props.data.map(item => {
    const date = new Date(item.timestamp)
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  })
  
  const values = props.data.map(item => item.value)
  const benchmark = props.data.map(item => item.benchmark || 0)
  
  return {
    backgroundColor: 'transparent',
    grid: {
      left: '10%',
      right: '10%',
      top: '15%',
      bottom: '15%',
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 1,
      textStyle: {
        color: '#ffffff',
        fontSize: 12
      },
      formatter: (params: any) => {
        const time = params[0].axisValue
        const value = params[0].data
        const benchmarkValue = params[1]?.data || 0
        
        return `
          <div style="padding: 8px;">
            <div style="margin-bottom: 8px; font-weight: 600;">${time}</div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 12px; height: 12px; background: #00d4ff; border-radius: 50%;"></div>
              <span>策略值: </span>
              <span style="color: #00d4ff; font-weight: 600;">${value.toFixed(2)}</span>
            </div>
            ${benchmarkValue !== 0 ? `
              <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                <div style="width: 12px; height: 12px; background: #ffa502; border-radius: 50%;"></div>
                <span>基准: </span>
                <span style="color: #ffa502; font-weight: 600;">${benchmarkValue.toFixed(2)}</span>
              </div>
            ` : ''}
          </div>
        `
      }
    },
    xAxis: {
      type: 'category',
      data: times,
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.2)'
        }
      },
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 11,
        rotate: 45
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.2)'
        }
      },
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 11,
        formatter: (value: number) => value.toFixed(0)
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    },
    series: [
      {
        name: '策略表现',
        type: 'line',
        data: values,
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 3,
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#00d4ff' },
              { offset: 1, color: '#00ff88' }
            ]
          },
          shadowColor: 'rgba(0, 212, 255, 0.5)',
          shadowBlur: 10
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0, 212, 255, 0.3)' },
              { offset: 1, color: 'rgba(0, 212, 255, 0.05)' }
            ]
          }
        },
        animation: true,
        animationDuration: 1000,
        animationEasing: 'cubicOut'
      },
      {
        name: '基准',
        type: 'line',
        data: benchmark,
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 2,
          color: '#ffa502',
          type: 'dashed'
        },
        animation: true,
        animationDuration: 1000,
        animationDelay: 200
      }
    ]
  }
}

// Update chart with new data
const updateChart = () => {
  if (!chart) return
  
  const option = getChartOption()
  chart.setOption(option, true)
}

// Handle resize
const handleResize = () => {
  if (chart) {
    chart.resize()
  }
}

// Watch for data changes
watch(() => props.data, updateChart, { deep: true })

// Lifecycle
onMounted(() => {
  initChart()
  
  if (props.realtime) {
    updateInterval = setInterval(() => {
      // Simulate real-time data updates
      if (props.data.length > 0) {
        const lastValue = props.data[props.data.length - 1].value
        const newValue = lastValue + (Math.random() - 0.5) * 100
        
        // Create a new array instead of mutating props
        const newData = [...props.data, {
          timestamp: new Date(),
          value: newValue,
          benchmark: props.data[0].value
        }]
        
        // Keep only last 50 data points
        if (newData.length > 50) {
          newData.shift()
        }
        
        // Emit update event
        emit('update:data', newData)
      }
    }, 2000)
  }
})

onUnmounted(() => {
  if (chart) {
    chart.dispose()
  }
  
  if (updateInterval) {
    clearInterval(updateInterval)
  }
  
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.strategy-performance-chart {
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  height: 100%;
}
</style>