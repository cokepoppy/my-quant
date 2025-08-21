<template>
  <div class="trading">
    <div class="page-header">
      <h2>交易管理</h2>
      <el-button type="primary" @click="handleRefresh">刷新</el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="balance-card">
          <template #header>
            <span>账户余额</span>
          </template>
          <div class="balance-info">
            <div class="total-balance">
              <span class="label">总资产</span>
              <span class="value">${{ balance.total.toLocaleString() }}</span>
            </div>
            <div class="balance-detail">
              <div class="item">
                <span class="label">可用余额</span>
                <span class="value"
                  >${{ balance.available.toLocaleString() }}</span
                >
              </div>
              <div class="item">
                <span class="label">冻结资金</span>
                <span class="value"
                  >${{ balance.frozen.toLocaleString() }}</span
                >
              </div>
              <div class="item">
                <span class="label">今日盈亏</span>
                <span
                  class="value"
                  :class="balance.pnl >= 0 ? 'profit' : 'loss'"
                >
                  {{ balance.pnl >= 0 ? "+" : "" }}${{
                    balance.pnl.toLocaleString()
                  }}
                </span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="positions-card">
          <template #header>
            <span>持仓统计</span>
          </template>
          <div class="positions-info">
            <div class="position-item">
              <span class="label">总持仓</span>
              <span class="value">{{ positions.total }} 个</span>
            </div>
            <div class="position-item">
              <span class="label">盈利持仓</span>
              <span class="value profit">{{ positions.profitable }} 个</span>
            </div>
            <div class="position-item">
              <span class="label">亏损持仓</span>
              <span class="value loss">{{ positions.losing }} 个</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="orders-card">
          <template #header>
            <span>今日订单</span>
          </template>
          <div class="orders-info">
            <div class="order-item">
              <span class="label">总订单</span>
              <span class="value">{{ orders.total }} 个</span>
            </div>
            <div class="order-item">
              <span class="label">成交订单</span>
              <span class="value">{{ orders.filled }} 个</span>
            </div>
            <div class="order-item">
              <span class="label">成交率</span>
              <span class="value">{{ orders.filledRate }}%</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>当前持仓</span>
          </template>
          <el-table
            v-loading="positionsLoading"
            :data="positionsList"
            style="width: 100%"
            border
            size="small"
          >
            <el-table-column prop="symbol" label="交易品种" width="100" />
            <el-table-column prop="side" label="方向" width="60">
              <template #default="{ row }">
                <el-tag
                  :type="row.side === 'buy' ? 'success' : 'danger'"
                  size="small"
                >
                  {{ row.side === "buy" ? "多" : "空" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="size" label="数量" width="80" />
            <el-table-column prop="entryPrice" label="开仓价" width="80" />
            <el-table-column prop="currentPrice" label="当前价" width="80" />
            <el-table-column prop="pnl" label="盈亏" width="80">
              <template #default="{ row }">
                <span :class="row.pnl >= 0 ? 'profit' : 'loss'">
                  {{ row.pnl >= 0 ? "+" : "" }}{{ row.pnl }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="pnlPercent" label="盈亏%" width="80">
              <template #default="{ row }">
                <span :class="row.pnlPercent >= 0 ? 'profit' : 'loss'">
                  {{ row.pnlPercent >= 0 ? "+" : "" }}{{ row.pnlPercent }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button size="small" @click="handleClosePosition(row)"
                  >平仓</el-button
                >
                <el-button size="small" @click="handleShowChart(row)"
                  >图表</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最近订单</span>
          </template>
          <el-table
            v-loading="ordersLoading"
            :data="ordersList"
            style="width: 100%"
            border
            size="small"
          >
            <el-table-column prop="symbol" label="交易品种" width="100" />
            <el-table-column prop="side" label="方向" width="60">
              <template #default="{ row }">
                <el-tag
                  :type="row.side === 'buy' ? 'success' : 'danger'"
                  size="small"
                >
                  {{ row.side === "buy" ? "买入" : "卖出" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="类型" width="60">
              <template #default="{ row }">
                <el-tag size="small">{{
                  row.type === "market" ? "市价" : "限价"
                }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="size" label="数量" width="80" />
            <el-table-column prop="price" label="价格" width="80" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="时间" width="120" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 价格图表 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <TradingChart
          title="实时价格图表"
          symbol="BTC/USDT"
          :height="400"
          :realtime="true"
        />
      </el-col>
    </el-row>

    <!-- 手动交易对话框 -->
    <el-dialog v-model="tradeDialogVisible" title="手动交易" width="500px">
      <el-form :model="tradeForm" label-width="80px">
        <el-form-item label="交易品种">
          <el-select v-model="tradeForm.symbol" placeholder="请选择交易品种">
            <el-option label="BTC/USDT" value="BTC/USDT" />
            <el-option label="ETH/USDT" value="ETH/USDT" />
            <el-option label="BNB/USDT" value="BNB/USDT" />
          </el-select>
        </el-form-item>
        <el-form-item label="方向">
          <el-radio-group v-model="tradeForm.side">
            <el-radio label="buy">买入</el-radio>
            <el-radio label="sell">卖出</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="tradeForm.type">
            <el-radio label="market">市价</el-radio>
            <el-radio label="limit">限价</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="tradeForm.type === 'limit'" label="价格">
          <el-input-number
            v-model="tradeForm.price"
            :min="0"
            :step="0.01"
            :precision="2"
          />
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number
            v-model="tradeForm.size"
            :min="0"
            :step="0.001"
            :precision="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tradeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePlaceOrder">下单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import TradingChart from "@/components/charts/TradingChart.vue";

const positionsLoading = ref(false);
const ordersLoading = ref(false);
const tradeDialogVisible = ref(false);

const balance = reactive({
  total: 10000,
  available: 8000,
  frozen: 2000,
  pnl: 150.5,
});

const positions = reactive({
  total: 3,
  profitable: 2,
  losing: 1,
});

const orders = reactive({
  total: 25,
  filled: 20,
  filledRate: 80,
});

const positionsList = ref([
  {
    symbol: "BTC/USDT",
    side: "buy",
    size: "0.1",
    entryPrice: "45000",
    currentPrice: "45500",
    pnl: "+50",
    pnlPercent: "+1.11",
  },
  {
    symbol: "ETH/USDT",
    side: "sell",
    size: "1.0",
    entryPrice: "3000",
    currentPrice: "2950",
    pnl: "+50",
    pnlPercent: "+1.67",
  },
  {
    symbol: "BNB/USDT",
    side: "buy",
    size: "2.0",
    entryPrice: "400",
    currentPrice: "395",
    pnl: "-10",
    pnlPercent: "-1.25",
  },
]);

const ordersList = ref([
  {
    symbol: "BTC/USDT",
    side: "buy",
    type: "market",
    size: "0.1",
    price: "45000",
    status: "filled",
    createdAt: "14:30:25",
  },
  {
    symbol: "ETH/USDT",
    side: "sell",
    type: "limit",
    size: "1.0",
    price: "3000",
    status: "pending",
    createdAt: "14:25:10",
  },
]);

const tradeForm = reactive({
  symbol: "",
  side: "buy",
  type: "market",
  price: 0,
  size: 0,
});

const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    pending: "warning",
    filled: "success",
    cancelled: "info",
    rejected: "danger",
  };
  return typeMap[status] || "info";
};

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending: "待成交",
    filled: "已成交",
    cancelled: "已取消",
    rejected: "已拒绝",
  };
  return textMap[status] || status;
};

const fetchTradingData = async () => {
  positionsLoading.value = true;
  ordersLoading.value = true;

  try {
    // TODO: 从API获取交易数据
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (error) {
    ElMessage.error("获取交易数据失败");
  } finally {
    positionsLoading.value = false;
    ordersLoading.value = false;
  }
};

const handleRefresh = () => {
  fetchTradingData();
};

const handleClosePosition = async (position: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要平仓 ${position.symbol} 的持仓吗？`,
      "确认平仓",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    // TODO: 调用API平仓
    await new Promise((resolve) => setTimeout(resolve, 1000));

    ElMessage.success("平仓成功");
    fetchTradingData();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("平仓失败");
    }
  }
};

const handleShowChart = (position: any) => {
  // TODO: 显示持仓图表
  ElMessage.info("图表功能开发中");
};

const handlePlaceOrder = async () => {
  try {
    // TODO: 调用API下单
    await new Promise((resolve) => setTimeout(resolve, 1000));

    ElMessage.success("下单成功");
    tradeDialogVisible.value = false;
    fetchTradingData();
  } catch (error) {
    ElMessage.error("下单失败");
  }
};

onMounted(() => {
  fetchTradingData();
});
</script>

<style scoped>
.trading {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  background: var(--bg-primary);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: var(--surface-elevated);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal) var(--ease-out);
}

.page-header:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.page-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-2xl);
  font-weight: var(--font-semibold);
}

.balance-info,
.positions-info,
.orders-info {
  padding: 20px;
}

.total-balance {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-secondary);
}

.total-balance .label {
  font-size: var(--font-base);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
}

.total-balance .value {
  font-size: var(--font-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.balance-detail .item,
.position-item,
.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  transition: all var(--transition-normal) var(--ease-out);
}

.balance-detail .item:hover,
.position-item:hover,
.order-item:hover {
  background: var(--bg-hover);
  border-color: var(--border-secondary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.balance-detail .item:last-child,
.position-item:last-child,
.order-item:last-child {
  margin-bottom: 0;
}

.item .label,
.position-item .label,
.order-item .label {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
}

.item .value,
.position-item .value,
.order-item .value {
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.profit {
  color: var(--market-up) !important;
  font-weight: var(--font-bold);
}

.loss {
  color: var(--market-down) !important;
  font-weight: var(--font-bold);
}

/* Element Plus 组件样式覆盖 */
:deep(.el-card) {
  background: var(--surface-elevated) !important;
  border: 1px solid var(--border-primary) !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: var(--shadow-md) !important;
  transition: all var(--transition-normal) var(--ease-out) !important;
  position: relative;
  overflow: hidden;
}

:deep(.el-card:hover) {
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

:deep(.el-card__header) {
  background: var(--surface-elevated) !important;
  border-bottom: 1px solid var(--border-primary) !important;
  padding: 16px 20px !important;
}

:deep(.el-card__header span) {
  color: var(--text-primary) !important;
  font-weight: var(--font-semibold) !important;
  font-size: var(--font-lg) !important;
}

:deep(.el-card__body) {
  padding: 20px !important;
}

/* 表格样式优化 */
:deep(.el-table) {
  background: transparent !important;
  color: var(--text-primary) !important;
}

:deep(.el-table th) {
  background: var(--surface-elevated) !important;
  color: var(--text-secondary) !important;
  border-bottom: 1px solid var(--border-primary) !important;
  font-weight: var(--font-semibold) !important;
}

:deep(.el-table td) {
  background: transparent !important;
  border-bottom: 1px solid var(--border-secondary) !important;
  color: var(--text-primary) !important;
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
  background: var(--bg-hover) !important;
}

:deep(.el-table__border) {
  border: 1px solid var(--border-primary) !important;
}

/* 按钮样式优化 */
:deep(.el-button) {
  border-radius: var(--radius-md) !important;
  font-weight: var(--font-medium) !important;
  transition: all var(--transition-normal) var(--ease-out) !important;
}

:deep(.el-button:hover) {
  transform: translateY(-1px) !important;
}

:deep(.el-button--primary) {
  background: var(--btn-primary) !important;
  border-color: var(--btn-primary) !important;
  color: white !important;
}

:deep(.el-button--primary:hover) {
  background: var(--btn-primary-hover) !important;
  border-color: var(--btn-primary-hover) !important;
  box-shadow: var(--glow-primary) !important;
}

:deep(.el-button--success) {
  background: var(--market-up) !important;
  border-color: var(--market-up) !important;
  color: white !important;
}

:deep(.el-button--success:hover) {
  background: #00d4aa !important;
  border-color: #00d4aa !important;
  box-shadow: var(--glow-success) !important;
}

:deep(.el-button--danger) {
  background: var(--market-down) !important;
  border-color: var(--market-down) !important;
  color: white !important;
}

:deep(.el-button--danger:hover) {
  background: #e02e24 !important;
  border-color: #e02e24 !important;
  box-shadow: var(--glow-danger) !important;
}

/* 对话框样式优化 */
:deep(.el-dialog) {
  background: var(--surface-overlay) !important;
  border: 1px solid var(--border-primary) !important;
  border-radius: var(--radius-xl) !important;
  box-shadow: var(--shadow-premium-lg) !important;
}

:deep(.el-dialog__header) {
  background: var(--surface-elevated) !important;
  border-bottom: 1px solid var(--border-primary) !important;
  padding: 20px 24px !important;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0 !important;
}

:deep(.el-dialog__title) {
  color: var(--text-primary) !important;
  font-weight: var(--font-semibold) !important;
  font-size: var(--font-lg) !important;
}

:deep(.el-dialog__body) {
  background: var(--bg-primary) !important;
  padding: 24px !important;
  color: var(--text-primary) !important;
}

:deep(.el-dialog__footer) {
  background: var(--surface-elevated) !important;
  border-top: 1px solid var(--border-primary) !important;
  padding: 16px 24px !important;
  border-radius: 0 0 var(--radius-xl) var(--radius-xl) !important;
}

/* 表单样式优化 */
:deep(.el-form-item__label) {
  color: var(--text-secondary) !important;
  font-weight: var(--font-medium) !important;
  font-size: var(--font-sm) !important;
}

:deep(.el-input__wrapper) {
  background: var(--input-bg) !important;
  border-color: var(--input-border) !important;
  border-radius: var(--radius-md) !important;
}

:deep(.el-input__inner) {
  color: var(--input-text) !important;
}

:deep(.el-input__wrapper:hover) {
  border-color: var(--input-hover) !important;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: var(--input-focus) !important;
  box-shadow: 0 0 0 2px var(--glow-primary) !important;
}

:deep(.el-select .el-input__wrapper) {
  background: var(--input-bg) !important;
  border-color: var(--input-border) !important;
}

:deep(.el-select-dropdown) {
  background: var(--surface-overlay) !important;
  border: 1px solid var(--border-primary) !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: var(--shadow-lg) !important;
}

:deep(.el-select-dropdown__item) {
  color: var(--text-primary) !important;
}

:deep(.el-select-dropdown__item:hover) {
  background: var(--bg-hover) !important;
  color: var(--text-primary) !important;
}

/* 标签样式优化 */
:deep(.el-tag) {
  border-radius: var(--radius-md) !important;
  font-weight: var(--font-medium) !important;
  border: 1px solid var(--border-primary) !important;
  background: var(--surface-elevated) !important;
  color: var(--text-primary) !important;
  transition: all var(--transition-normal) var(--ease-out) !important;
}

:deep(.el-tag:hover) {
  transform: translateY(-1px) !important;
  box-shadow: var(--shadow-sm) !important;
}

:deep(.el-tag--success) {
  background: var(--market-up) !important;
  border-color: var(--market-up) !important;
  color: white !important;
}

:deep(.el-tag--danger) {
  background: var(--market-down) !important;
  border-color: var(--market-down) !important;
  color: white !important;
}

:deep(.el-tag--warning) {
  background: var(--market-volatile) !important;
  border-color: var(--market-volatile) !important;
  color: white !important;
}

:deep(.el-tag--info) {
  background: var(--btn-primary) !important;
  border-color: var(--btn-primary) !important;
  color: white !important;
}
</style>
