<template>
  <div class="positions-management">
    <div class="page-header">
      <h2>持仓管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="refreshPositions">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="exportPositions">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon profit">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">${{ totalProfit.toFixed(2) }}</div>
              <div class="stat-label">总盈亏</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon positions">
              <el-icon><PieChart /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ positions.length }}</div>
              <div class="stat-label">持仓数量</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon value">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">${{ totalValue.toFixed(2) }}</div>
              <div class="stat-label">持仓总值</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon margin">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ marginUsage.toFixed(1) }}%</div>
              <div class="stat-label">保证金使用</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <el-form :model="filterForm" inline class="filter-form">
        <el-form-item label="交易对">
          <el-select v-model="filterForm.symbol" placeholder="选择交易对" style="width: 150px" clearable>
            <el-option label="BTCUSDT" value="BTCUSDT" />
            <el-option label="ETHUSDT" value="ETHUSDT" />
            <el-option label="BNBUSDT" value="BNBUSDT" />
            <el-option label="ADAUSDT" value="ADAUSDT" />
          </el-select>
        </el-form-item>
        <el-form-item label="持仓类型">
          <el-select v-model="filterForm.type" placeholder="选择类型" style="width: 120px" clearable>
            <el-option label="全部" value="" />
            <el-option label="多头" value="long" />
            <el-option label="空头" value="short" />
          </el-select>
        </el-form-item>
        <el-form-item label="盈亏状态">
          <el-select v-model="filterForm.profitStatus" placeholder="选择状态" style="width: 120px" clearable>
            <el-option label="全部" value="" />
            <el-option label="盈利" value="profit" />
            <el-option label="亏损" value="loss" />
            <el-option label="保本" value="breakeven" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="applyFilter">筛选</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 持仓列表 -->
    <div class="positions-table">
      <el-table :data="filteredPositions" style="width: 100%" v-loading="loading">
        <el-table-column prop="symbol" label="交易对" width="100" />
        <el-table-column prop="type" label="类型" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.type === 'long' ? 'success' : 'danger'" size="small">
              {{ scope.row.type === 'long' ? '多头' : '空头' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="100" />
        <el-table-column prop="entryPrice" label="开仓价格" width="100" />
        <el-table-column prop="currentPrice" label="当前价格" width="100" />
        <el-table-column prop="profitLoss" label="盈亏" width="100">
          <template #default="scope">
            <span :class="scope.row.profitLoss >= 0 ? 'profit-color' : 'loss-color'">
              {{ scope.row.profitLoss >= 0 ? '+' : '' }}${{ scope.row.profitLoss.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="profitLossPercent" label="盈亏%" width="100">
          <template #default="scope">
            <span :class="scope.row.profitLossPercent >= 0 ? 'profit-color' : 'loss-color'">
              {{ scope.row.profitLossPercent >= 0 ? '+' : '' }}{{ scope.row.profitLossPercent.toFixed(2) }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="margin" label="保证金" width="100" />
        <el-table-column prop="leverage" label="杠杆" width="80" />
        <el-table-column prop="liquidationPrice" label="强平价格" width="100" />
        <el-table-column prop="createdAt" label="开仓时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button @click="closePosition(scope.row)" type="danger" size="small">
              平仓
            </el-button>
            <el-button @click="viewPositionDetails(scope.row)" type="primary" size="small">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 持仓详情弹窗 -->
    <el-dialog v-model="detailsDialogVisible" title="持仓详情" width="800px">
      <div v-if="selectedPosition" class="position-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="交易对">{{ selectedPosition.symbol }}</el-descriptions-item>
          <el-descriptions-item label="持仓类型">
            <el-tag :type="selectedPosition.type === 'long' ? 'success' : 'danger'">
              {{ selectedPosition.type === 'long' ? '多头' : '空头' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="持仓数量">{{ selectedPosition.quantity }}</el-descriptions-item>
          <el-descriptions-item label="开仓价格">{{ selectedPosition.entryPrice }}</el-descriptions-item>
          <el-descriptions-item label="当前价格">{{ selectedPosition.currentPrice }}</el-descriptions-item>
          <el-descriptions-item label="盈亏">
            <span :class="selectedPosition.profitLoss >= 0 ? 'profit-color' : 'loss-color'">
              {{ selectedPosition.profitLoss >= 0 ? '+' : '' }}${{ selectedPosition.profitLoss.toFixed(2) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="盈亏百分比">
            <span :class="selectedPosition.profitLossPercent >= 0 ? 'profit-color' : 'loss-color'">
              {{ selectedPosition.profitLossPercent >= 0 ? '+' : '' }}{{ selectedPosition.profitLossPercent.toFixed(2) }}%
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="保证金">{{ selectedPosition.margin }}</el-descriptions-item>
          <el-descriptions-item label="杠杆">{{ selectedPosition.leverage }}x</el-descriptions-item>
          <el-descriptions-item label="强平价格">{{ selectedPosition.liquidationPrice }}</el-descriptions-item>
          <el-descriptions-item label="开仓时间">{{ selectedPosition.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="标记价格">{{ selectedPosition.markPrice }}</el-descriptions-item>
          <el-descriptions-item label="维持保证金">{{ selectedPosition.maintenanceMargin }}</el-descriptions-item>
          <el-descriptions-item label="可用余额">{{ selectedPosition.availableBalance }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Download, TrendCharts, PieChart, Money, Warning } from '@element-plus/icons-vue'

interface Position {
  id: string
  symbol: string
  type: 'long' | 'short'
  quantity: number
  entryPrice: number
  currentPrice: number
  markPrice: number
  profitLoss: number
  profitLossPercent: number
  margin: number
  maintenanceMargin: number
  leverage: number
  liquidationPrice: number
  availableBalance: number
  createdAt: string
}

const loading = ref(false)
const positions = ref<Position[]>([])
const detailsDialogVisible = ref(false)
const selectedPosition = ref<Position | null>(null)

const filterForm = reactive({
  symbol: '',
  type: '',
  profitStatus: ''
})

const filteredPositions = computed(() => {
  let filtered = positions.value

  if (filterForm.symbol) {
    filtered = filtered.filter(position => position.symbol === filterForm.symbol)
  }

  if (filterForm.type) {
    filtered = filtered.filter(position => position.type === filterForm.type)
  }

  if (filterForm.profitStatus) {
    filtered = filtered.filter(position => {
      if (filterForm.profitStatus === 'profit') return position.profitLoss > 0
      if (filterForm.profitStatus === 'loss') return position.profitLoss < 0
      if (filterForm.profitStatus === 'breakeven') return position.profitLoss === 0
      return true
    })
  }

  return filtered
})

const totalProfit = computed(() => {
  return positions.value.reduce((sum, position) => sum + position.profitLoss, 0)
})

const totalValue = computed(() => {
  return positions.value.reduce((sum, position) => sum + (position.quantity * position.currentPrice), 0)
})

const marginUsage = computed(() => {
  const totalMargin = positions.value.reduce((sum, position) => sum + position.margin, 0)
  const totalAvailable = totalMargin + 10000
  return totalAvailable > 0 ? (totalMargin / totalAvailable) * 100 : 0
})

const refreshPositions = async () => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    generateMockPositions()
    ElMessage.success('持仓列表已刷新')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    loading.value = false
  }
}

const generateMockPositions = () => {
  const mockPositions: Position[] = [
    {
      id: 'POS001',
      symbol: 'BTCUSDT',
      type: 'long',
      quantity: 0.5,
      entryPrice: 45000,
      currentPrice: 46500,
      markPrice: 46500,
      profitLoss: 750,
      profitLossPercent: 3.33,
      margin: 11250,
      maintenanceMargin: 3375,
      leverage: 2,
      liquidationPrice: 42500,
      availableBalance: 10000,
      createdAt: '2024-01-15 10:30:00'
    },
    {
      id: 'POS002',
      symbol: 'ETHUSDT',
      type: 'short',
      quantity: 2,
      entryPrice: 2800,
      currentPrice: 2750,
      markPrice: 2750,
      profitLoss: 100,
      profitLossPercent: 1.79,
      margin: 2800,
      maintenanceMargin: 840,
      leverage: 2,
      liquidationPrice: 2850,
      availableBalance: 10000,
      createdAt: '2024-01-15 11:00:00'
    },
    {
      id: 'POS003',
      symbol: 'BNBUSDT',
      type: 'long',
      quantity: 5,
      entryPrice: 320,
      currentPrice: 315,
      markPrice: 315,
      profitLoss: -25,
      profitLossPercent: -1.56,
      margin: 800,
      maintenanceMargin: 240,
      leverage: 2,
      liquidationPrice: 305,
      availableBalance: 10000,
      createdAt: '2024-01-15 11:30:00'
    }
  ]
  positions.value = mockPositions
}

const applyFilter = () => {
  ElMessage.success('筛选条件已应用')
}

const resetFilter = () => {
  filterForm.symbol = ''
  filterForm.type = ''
  filterForm.profitStatus = ''
  ElMessage.info('筛选条件已重置')
}

const closePosition = async (position: Position) => {
  try {
    await ElMessageBox.confirm('确定要平仓这个持仓吗？', '确认平仓', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const index = positions.value.findIndex(p => p.id === position.id)
    if (index > -1) {
      positions.value.splice(index, 1)
    }
    
    ElMessage.success('平仓操作成功')
  } catch (error) {
    // 用户取消操作
  }
}

const viewPositionDetails = (position: Position) => {
  selectedPosition.value = position
  detailsDialogVisible.value = true
}

const exportPositions = () => {
  ElMessage.success('持仓数据导出中...')
}

onMounted(() => {
  generateMockPositions()
})
</script>

<style scoped>
.positions-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--primary-text);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-section {
  margin-bottom: 24px;
}

.stat-card {
  background: var(--primary-bg);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid var(--border-color);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.profit {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.stat-icon.positions {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.stat-icon.value {
  background: linear-gradient(135deg, #e6a23c, #ebb563);
}

.stat-icon.margin {
  background: linear-gradient(135deg, #f56c6c, #f78989);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--primary-text);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--secondary-text);
}

.filter-section {
  background: var(--primary-bg);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.positions-table {
  background: var(--primary-bg);
  border-radius: 8px;
  padding: 20px;
}

.profit-color {
  color: #67c23a;
  font-weight: 600;
}

.loss-color {
  color: #f56c6c;
  font-weight: 600;
}

.position-details {
  padding: 16px 0;
}
</style>