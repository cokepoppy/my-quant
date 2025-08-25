<template>
  <div class="orders-management">
    <div class="page-header">
      <h2>订单管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="refreshOrders">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="exportOrders">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
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
        <el-form-item label="订单状态">
          <el-select v-model="filterForm.status" placeholder="选择状态" style="width: 120px" clearable>
            <el-option label="全部" value="" />
            <el-option label="待成交" value="pending" />
            <el-option label="部分成交" value="partially_filled" />
            <el-option label="完全成交" value="filled" />
            <el-option label="已取消" value="canceled" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单类型">
          <el-select v-model="filterForm.type" placeholder="选择类型" style="width: 120px" clearable>
            <el-option label="全部" value="" />
            <el-option label="限价单" value="limit" />
            <el-option label="市价单" value="market" />
            <el-option label="止损单" value="stop" />
            <el-option label="止盈单" value="take_profit" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="applyFilter">筛选</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 订单列表 -->
    <div class="orders-table">
      <el-table :data="filteredOrders" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="订单ID" width="120" />
        <el-table-column prop="symbol" label="交易对" width="100" />
        <el-table-column prop="type" label="类型" width="80">
          <template #default="scope">
            <el-tag :type="getOrderTypeTag(scope.row.type)" size="small">
              {{ getOrderTypeText(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="side" label="方向" width="80">
          <template #default="scope">
            <span :class="scope.row.side === 'buy' ? 'buy-color' : 'sell-color'">
              {{ scope.row.side === 'buy' ? '买入' : '卖出' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="100">
          <template #default="scope">
            {{ scope.row.type === 'market' ? '市价' : scope.row.price.toFixed(4) }}
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="100" />
        <el-table-column prop="executedQuantity" label="已成交" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getOrderStatusTag(scope.row.status)" size="small">
              {{ getOrderStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160" />
        <el-table-column prop="updatedAt" label="更新时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button 
              v-if="scope.row.status === 'pending' || scope.row.status === 'partially_filled'"
              @click="cancelOrder(scope.row)" 
              type="danger" 
              size="small"
            >
              取消
            </el-button>
            <el-button @click="viewOrderDetails(scope.row)" type="primary" size="small">
              详情
            </el-button>
            <el-button @click="copyOrder(scope.row)" type="info" size="small">
              复制
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="totalOrders"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 订单详情弹窗 -->
    <el-dialog v-model="detailsDialogVisible" title="订单详情" width="800px">
      <div v-if="selectedOrder" class="order-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单ID">{{ selectedOrder.id }}</el-descriptions-item>
          <el-descriptions-item label="交易对">{{ selectedOrder.symbol }}</el-descriptions-item>
          <el-descriptions-item label="订单类型">{{ getOrderTypeText(selectedOrder.type) }}</el-descriptions-item>
          <el-descriptions-item label="交易方向">
            <span :class="selectedOrder.side === 'buy' ? 'buy-color' : 'sell-color'">
              {{ selectedOrder.side === 'buy' ? '买入' : '卖出' }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="价格">{{ selectedOrder.price }}</el-descriptions-item>
          <el-descriptions-item label="数量">{{ selectedOrder.quantity }}</el-descriptions-item>
          <el-descriptions-item label="已成交数量">{{ selectedOrder.executedQuantity }}</el-descriptions-item>
          <el-descriptions-item label="成交均价">{{ selectedOrder.averagePrice || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getOrderStatusTag(selectedOrder.status)">
              {{ getOrderStatusText(selectedOrder.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ selectedOrder.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ selectedOrder.updatedAt }}</el-descriptions-item>
          <el-descriptions-item label="手续费">{{ selectedOrder.fee || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ selectedOrder.note || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Download } from '@element-plus/icons-vue'

interface Order {
  id: string
  symbol: string
  type: 'limit' | 'market' | 'stop' | 'take_profit'
  side: 'buy' | 'sell'
  price: number
  quantity: number
  executedQuantity: number
  averagePrice?: number
  status: 'pending' | 'partially_filled' | 'filled' | 'canceled' | 'rejected'
  createdAt: string
  updatedAt: string
  fee?: number
  note?: string
}

const loading = ref(false)
const orders = ref<Order[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const totalOrders = ref(0)
const detailsDialogVisible = ref(false)
const selectedOrder = ref<Order | null>(null)

const filterForm = reactive({
  symbol: '',
  status: '',
  type: '',
  dateRange: [] as [Date, Date] | []
})

const filteredOrders = computed(() => {
  let filtered = orders.value

  if (filterForm.symbol) {
    filtered = filtered.filter(order => order.symbol === filterForm.symbol)
  }

  if (filterForm.status) {
    filtered = filtered.filter(order => order.status === filterForm.status)
  }

  if (filterForm.type) {
    filtered = filtered.filter(order => order.type === filterForm.type)
  }

  if (filterForm.dateRange && filterForm.dateRange.length === 2) {
    const [startDate, endDate] = filterForm.dateRange
    filtered = filtered.filter(order => {
      const orderDate = new Date(order.createdAt)
      return orderDate >= startDate && orderDate <= endDate
    })
  }

  return filtered
})

const getOrderTypeTag = (type: string) => {
  const tagMap: Record<string, string> = {
    limit: '',
    market: 'success',
    stop: 'warning',
    take_profit: 'info'
  }
  return tagMap[type] || ''
}

const getOrderTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    limit: '限价单',
    market: '市价单',
    stop: '止损单',
    take_profit: '止盈单'
  }
  return textMap[type] || type
}

const getOrderStatusTag = (status: string) => {
  const tagMap: Record<string, string> = {
    pending: 'warning',
    partially_filled: 'info',
    filled: 'success',
    canceled: 'danger',
    rejected: 'danger'
  }
  return tagMap[status] || ''
}

const getOrderStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending: '待成交',
    partially_filled: '部分成交',
    filled: '完全成交',
    canceled: '已取消',
    rejected: '已拒绝'
  }
  return textMap[status] || status
}

const refreshOrders = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    generateMockOrders()
    ElMessage.success('订单列表已刷新')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    loading.value = false
  }
}

const generateMockOrders = () => {
  const mockOrders: Order[] = [
    {
      id: 'ORD001',
      symbol: 'BTCUSDT',
      type: 'limit',
      side: 'buy',
      price: 45000,
      quantity: 0.1,
      executedQuantity: 0.1,
      averagePrice: 45000,
      status: 'filled',
      createdAt: '2024-01-15 10:30:00',
      updatedAt: '2024-01-15 10:35:00',
      fee: 0.0001
    },
    {
      id: 'ORD002',
      symbol: 'ETHUSDT',
      type: 'market',
      side: 'sell',
      price: 0,
      quantity: 2,
      executedQuantity: 2,
      averagePrice: 2800,
      status: 'filled',
      createdAt: '2024-01-15 11:00:00',
      updatedAt: '2024-01-15 11:00:00',
      fee: 0.0056
    },
    {
      id: 'ORD003',
      symbol: 'BNBUSDT',
      type: 'limit',
      side: 'buy',
      price: 320,
      quantity: 5,
      executedQuantity: 3,
      averagePrice: 320,
      status: 'partially_filled',
      createdAt: '2024-01-15 11:30:00',
      updatedAt: '2024-01-15 11:45:00'
    },
    {
      id: 'ORD004',
      symbol: 'ADAUSDT',
      type: 'limit',
      side: 'sell',
      price: 0.65,
      quantity: 1000,
      executedQuantity: 0,
      status: 'pending',
      createdAt: '2024-01-15 12:00:00',
      updatedAt: '2024-01-15 12:00:00'
    }
  ]
  orders.value = mockOrders
  totalOrders.value = mockOrders.length
}

const applyFilter = () => {
  ElMessage.success('筛选条件已应用')
}

const resetFilter = () => {
  filterForm.symbol = ''
  filterForm.status = ''
  filterForm.type = ''
  filterForm.dateRange = []
  ElMessage.info('筛选条件已重置')
}

const cancelOrder = async (order: Order) => {
  try {
    await ElMessageBox.confirm('确定要取消这个订单吗？', '确认取消', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const index = orders.value.findIndex(o => o.id === order.id)
    if (index > -1) {
      orders.value[index].status = 'canceled'
      orders.value[index].updatedAt = new Date().toLocaleString()
    }
    
    ElMessage.success('订单已取消')
  } catch (error) {
    // 用户取消操作
  }
}

const viewOrderDetails = (order: Order) => {
  selectedOrder.value = order
  detailsDialogVisible.value = true
}

const copyOrder = (order: Order) => {
  ElMessage.success(`已复制订单 ${order.id}`)
}

const exportOrders = () => {
  ElMessage.success('订单数据导出中...')
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

onMounted(() => {
  generateMockOrders()
})
</script>

<style scoped>
.orders-management {
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

.orders-table {
  background: var(--primary-bg);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
}

.buy-color {
  color: #67c23a;
  font-weight: 600;
}

.sell-color {
  color: #f56c6c;
  font-weight: 600;
}

.order-details {
  padding: 16px 0;
}
</style>