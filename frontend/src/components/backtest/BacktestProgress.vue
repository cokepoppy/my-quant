<template>
  <div class="backtest-progress-container">
    <!-- 回测进度卡片 -->
    <el-card v-if="backtestStore.currentBacktest" class="progress-card">
      <template #header>
        <div class="card-header">
          <h3>回测进度</h3>
          <el-tag :type="getStatusTagType(backtestStore.currentBacktest.status)">
            {{ getStatusText(backtestStore.currentBacktest.status) }}
          </el-tag>
        </div>
      </template>

      <!-- 进度条 -->
      <div class="progress-section">
        <div class="progress-info">
          <span class="progress-label">执行进度</span>
          <span class="progress-percentage">{{ backtestStore.progressPercentage.toFixed(1) }}%</span>
        </div>
        <el-progress
          :percentage="backtestStore.progressPercentage"
          :status="getProgressStatus(backtestStore.currentBacktest.status)"
          :stroke-width="8"
          :show-text="false"
        />
        <div class="progress-details">
          <span>回测名称: {{ backtestStore.currentBacktest.name }}</span>
          <span>开始时间: {{ formatDate(backtestStore.currentBacktest.createdAt) }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="progress-actions">
        <el-button
          v-if="backtestStore.isBacktestRunning"
          type="danger"
          size="small"
          @click="handleCancel"
          :loading="backtestStore.isLoading"
        >
          取消回测
        </el-button>
        <el-button
          v-if="backtestStore.currentBacktest.status === 'completed'"
          type="primary"
          size="small"
          @click="handleViewResults"
        >
          查看结果
        </el-button>
        <el-button
          size="small"
          @click="handleHide"
        >
          隐藏
        </el-button>
      </div>
    </el-card>

    <!-- 回测结果概览 -->
    <el-card
      v-if="backtestStore.currentBacktest?.status === 'completed' && backtestStore.currentBacktest.metrics"
      class="results-card"
    >
      <template #header>
        <div class="card-header">
          <h3>回测结果概览</h3>
          <el-tag type="success" effect="dark">
            回测完成
          </el-tag>
        </div>
      </template>

      <!-- 性能指标 -->
      <div class="metrics-grid">
        <div class="metric-item">
          <div class="metric-label">总收益率</div>
          <div :class="['metric-value', getProfitClass(backtestStore.currentBacktest.metrics.totalReturn)]">
            {{ formatProfitRate(backtestStore.currentBacktest.metrics.totalReturn) }}
          </div>
        </div>
        <div class="metric-item">
          <div class="metric-label">夏普比率</div>
          <div class="metric-value">
            {{ backtestStore.currentBacktest.metrics.sharpeRatio?.toFixed(2) || '--' }}
          </div>
        </div>
        <div class="metric-item">
          <div class="metric-label">最大回撤</div>
          <div class="metric-value negative">
            {{ formatDrawdown(backtestStore.currentBacktest.metrics.maxDrawdown) }}
          </div>
        </div>
        <div class="metric-item">
          <div class="metric-label">胜率</div>
          <div class="metric-value">
            {{ formatWinRate(backtestStore.currentBacktest.metrics.winRate) }}
          </div>
        </div>
        <div class="metric-item">
          <div class="metric-label">盈亏比</div>
          <div class="metric-value">
            {{ backtestStore.currentBacktest.metrics.profitFactor?.toFixed(2) || '--' }}
          </div>
        </div>
        <div class="metric-item">
          <div class="metric-label">交易次数</div>
          <div class="metric-value">
            {{ backtestStore.currentBacktest.metrics.totalTrades || 0 }}
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="results-actions">
        <el-button type="primary" @click="handleViewResults">
          查看详细结果
        </el-button>
        <el-button @click="handleExportReport">
          导出报告
        </el-button>
        <el-button @click="handleViewTrades">
          查看交易记录
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useBacktestStore } from '@/stores/backtest'

const router = useRouter()
const backtestStore = useBacktestStore()

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  const typeMap: Record<string, string> = {
    pending: 'info',
    running: 'warning',
    completed: 'success',
    failed: 'danger',
    cancelled: 'info'
  }
  return typeMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending: '等待中',
    running: '运行中',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消'
  }
  return textMap[status] || status
}

// 获取进度条状态
const getProgressStatus = (status: string) => {
  if (status === 'completed') return 'success'
  if (status === 'failed') return 'exception'
  if (status === 'cancelled') return 'warning'
  return ''
}

// 获取盈亏样式类
const getProfitClass = (profit: number) => {
  return profit >= 0 ? 'profit-positive' : 'profit-negative'
}

// 格式化收益率
const formatProfitRate = (rate: number) => {
  if (rate === undefined || rate === null) return '--'
  return `${rate >= 0 ? '+' : ''}${rate.toFixed(2)}%`
}

// 格式化回撤
const formatDrawdown = (drawdown: number) => {
  if (drawdown === undefined || drawdown === null) return '--'
  return `-${Math.abs(drawdown).toFixed(2)}%`
}

// 格式化胜率
const formatWinRate = (winRate: number) => {
  if (winRate === undefined || winRate === null) return '--'
  return `${winRate.toFixed(1)}%`
}

// 格式化日期
const formatDate = (date: string | Date) => {
  if (!date) return '--'
  try {
    const d = new Date(date)
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
  } catch (e) {
    return '--'
  }
}

// 取消回测
const handleCancel = async () => {
  if (!backtestStore.currentBacktest) return
  
  try {
    await backtestStore.cancelBacktest(backtestStore.currentBacktest.id)
    ElMessage.success('回测已取消')
  } catch (error) {
    console.error('取消回测失败:', error)
  }
}

// 查看结果
const handleViewResults = () => {
  if (!backtestStore.currentBacktest) return
  
  // 跳转到回测结果页面
  router.push(`/backtest/${backtestStore.currentBacktest.id}/results`)
}

// 导出报告
const handleExportReport = async () => {
  if (!backtestStore.currentBacktest) return
  
  try {
    await backtestStore.exportBacktestReport(backtestStore.currentBacktest.id)
  } catch (error) {
    console.error('导出报告失败:', error)
  }
}

// 查看交易记录
const handleViewTrades = () => {
  if (!backtestStore.currentBacktest) return
  
  // 跳转到交易记录页面
  router.push(`/backtest/${backtestStore.currentBacktest.id}/trades`)
}

// 隐藏进度显示
const handleHide = () => {
  backtestStore.clearCurrentBacktest()
}
</script>

<style scoped>
.backtest-progress-container {
  margin-bottom: 20px;
}

.progress-card,
.results-card {
  margin-bottom: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.progress-section {
  margin-bottom: 20px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.progress-percentage {
  font-weight: 600;
  color: var(--el-color-primary);
}

.progress-details {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.progress-actions,
.results-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.metric-item {
  text-align: center;
  padding: 16px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 4px;
  transition: all 0.3s ease;
}

.metric-item:hover {
  background-color: var(--el-fill-color-dark);
  transform: translateY(-2px);
}

.metric-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
  font-weight: 500;
}

.metric-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.profit-positive {
  color: #67c23a;
}

.profit-negative {
  color: #f56c6c;
}

.negative {
  color: #f56c6c;
}

:deep(.el-progress-bar__inner) {
  transition: width 0.3s ease;
}

:deep(.el-card__body) {
  padding: 20px;
}
</style>