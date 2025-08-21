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
      left: '10%',
      right: '5%',
      top: '10%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'time',
      axisLine: {
        lineStyle: {
          color: '#404040',
          width: 2
        }
      },
      axisLabel: {
        color: '#e0e0e0',
        fontSize: 12,
        fontWeight: 600
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#2a2a2a',
          opacity: 0.8,
          type: 'solid',
          width: 1
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#404040',
          width: 2
        }
      },
      axisLabel: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: 700,
        formatter: (value: number) => {
          return '$' + (value / 1000).toFixed(0) + 'K'
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#2a2a2a',
          opacity: 0.8,
          type: 'solid',
          width: 1
        }
      }
    },
    series: [{
      name: '总资产',
      type: 'line',
      data: data,
      smooth: true,
      showSymbol: false,
      emphasis: {
        scale: true,
        focus: 'series'
      },
      markPoint: {
        data: [
          { type: 'max', name: '最高值' },
          { type: 'min', name: '最低值' }
        ],
        symbol: 'circle',
        symbolSize: 10,
        itemStyle: {
          color: '#00d4aa',
          borderColor: '#ffffff',
          borderWidth: 3,
          shadowColor: '#00d4aa',
          shadowBlur: 10
        },
        label: {
          color: '#ffffff',
          fontSize: 12,
          fontWeight: 700,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          padding: [6, 10],
          borderRadius: 6,
          borderColor: '#00d4aa',
          borderWidth: 1
        }
      },
      lineStyle: {
        color: '#00d4aa',
        width: 4,
        shadowColor: '#00d4aa',
        shadowBlur: 15,
        shadowOffsetY: 3
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
            color: 'rgba(0, 212, 170, 0.8)'
          }, {
            offset: 0.3,
            color: 'rgba(0, 212, 170, 0.5)'
          }, {
            offset: 0.7,
            color: 'rgba(0, 212, 170, 0.2)'
          }, {
            offset: 1,
            color: 'rgba(0, 212, 170, 0.02)'
          }]
        }
      }
    }],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      borderColor: '#00d4aa',
      borderWidth: 2,
      textStyle: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 600
      },
      extraCssText: 'box-shadow: 0 12px 40px rgba(0, 212, 170, 0.4); border-radius: 10px; backdrop-filter: blur(10px);',
      formatter: (params: any) => {
        const data = params[0]
        const value = data.data[1]
        const date = new Date(data.data[0])
        
        // 计算变化
        let change = 0
        let changePercent = 0
        if (data.dataIndex > 0) {
          const prevValue = params[0].data[1] - (Math.random() - 0.5) * 2000 // 模拟前一个值
          change = value - prevValue
          changePercent = prevValue !== 0 ? (change / prevValue) * 100 : 0
        }
        
        const changeColor = change >= 0 ? '#00d4aa' : '#ff3b30'
        const changeSymbol = change >= 0 ? '+' : ''
        
        return `
          <div style="padding: 15px; min-width: 220px;">
            <div style="margin-bottom: 10px; font-weight: 700; font-size: 15px; color: #00d4aa; text-align: center;">
              ${date.toLocaleDateString('zh-CN', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
            <div style="margin-bottom: 8px; font-size: 18px; font-weight: 700; text-align: center;">
              总资产: <span style="color: #ffffff;">$${value.toLocaleString('zh-CN', { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
              })}</span>
            </div>
            ${change !== 0 ? `
              <div style="font-size: 13px; text-align: center; padding-top: 8px; border-top: 1px solid #333;">
                变化: <span style="color: ${changeColor}; font-weight: 700;">
                  ${changeSymbol}$${Math.abs(change).toLocaleString('zh-CN', { 
                    minimumFractionDigits: 0, 
                    maximumFractionDigits: 0 
                  })} (${changeSymbol}${changePercent.toFixed(2)}%)
                </span>
              </div>
            ` : ''}
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
  position: relative;
}

.chart-container {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.05) 100%);
  border-radius: 8px;
  border: 1px solid rgba(64, 64, 64, 0.3);
}

.chart-container:hover {
  border-color: rgba(0, 212, 170, 0.3);
  box-shadow: 0 4px 20px rgba(0, 212, 170, 0.1);
  transition: all 0.3s ease;
}
</style>