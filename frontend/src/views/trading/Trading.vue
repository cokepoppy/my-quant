<template>
  <div class="trading">
    <div class="page-header">
      <h2>交易管理</h2>
      <div class="header-actions">
        <el-button @click="handleRefresh">刷新</el-button>
        <el-button type="primary" @click="showAddExchangeDialog = true">
          添加交易所
        </el-button>
      </div>
    </div>

    <!-- 交易所选项卡 -->
    <div class="exchange-tabs" v-if="exchangeAccounts.length > 0">
      <el-tabs v-model="activeExchangeId" @tab-click="handleExchangeChange">
        <el-tab-pane
          v-for="account in exchangeAccounts"
          :key="account.id"
          :label="getExchangeTabLabel(account)"
          :name="account.id"
        >
          <template #label>
            <span class="exchange-tab-label">
              {{ account.name }}
              <el-tag
                size="small"
                :type="getConnectionStatusType(account.connectionStatus)"
                class="connection-status"
              >
                {{ getConnectionStatusText(account.connectionStatus) }}
              </el-tag>
              <el-button
                v-if="account.connectionStatus === 'disconnected'"
                size="small"
                type="primary"
                @click.stop="handleConnectExchange(account.id)"
              >
                连接
              </el-button>
              <el-button
                v-else-if="account.connectionStatus === 'connected'"
                size="small"
                type="warning"
                @click.stop="handleDisconnectExchange(account.id)"
              >
                断开
              </el-button>
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 没有交易所账户时的提示 -->
    <div v-else class="no-exchanges">
      <el-empty description="暂无交易所账户">
        <el-button type="primary" @click="showAddExchangeDialog = true">
          添加交易所账户
        </el-button>
      </el-empty>
    </div>

    <!-- 当前交易所的内容 -->
    <div v-if="activeExchangeAccount" class="exchange-content">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="balance-card">
            <template #header>
              <span>账户余额</span>
            </template>
            <div class="balance-info">
              <div class="total-balance">
                <span class="label">总资产</span>
                <span class="value">${{ formatNumber(activeExchangeAccount.totalBalanceInUSD || 0) }}</span>
              </div>
              <div class="balance-detail">
                <div class="item">
                  <span class="label">可用余额</span>
                  <span class="value">${{ formatNumber(getAvailableBalance()) }}</span>
                </div>
                <div class="item">
                  <span class="label">冻结资金</span>
                  <span class="value">${{ formatNumber(getLockedBalance()) }}</span>
                </div>
                <div class="item">
                  <span class="label">今日盈亏</span>
                  <span
                    class="value"
                    :class="(activeExchangeAccount.totalPnL || 0) >= 0 ? 'profit' : 'loss'"
                  >
                    {{ (activeExchangeAccount.totalPnL || 0) >= 0 ? '+' : '' }}${{ formatNumber(activeExchangeAccount.totalPnL || 0) }}
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
                <span class="value">{{ activeExchangeAccount.positions?.length || 0 }} 个</span>
              </div>
              <div class="position-item">
                <span class="label">盈利持仓</span>
                <span class="value profit">{{ getProfitablePositionsCount() }} 个</span>
              </div>
              <div class="position-item">
                <span class="label">亏损持仓</span>
                <span class="value loss">{{ getLosingPositionsCount() }} 个</span>
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
                <span class="value">{{ todayOrders.length }} 个</span>
              </div>
              <div class="order-item">
                <span class="label">成交订单</span>
                <span class="value">{{ getFilledOrdersCount() }} 个</span>
              </div>
              <div class="order-item">
                <span class="label">成交率</span>
                <span class="value">{{ getFilledRate() }}%</span>
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
              :data="activeExchangeAccount.positions || []"
              style="width: 100%"
              border
              size="small"
            >
              <el-table-column prop="symbol" label="交易品种" width="100" />
              <el-table-column prop="side" label="方向" width="60">
                <template #default="{ row }">
                  <el-tag
                    :type="row.side === 'long' ? 'success' : 'danger'"
                    size="small"
                  >
                    {{ row.side === "long" ? "多" : "空" }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="size" label="数量" width="80" />
              <el-table-column prop="entryPrice" label="开仓价" width="80" />
              <el-table-column prop="markPrice" label="当前价" width="80" />
              <el-table-column prop="pnl" label="盈亏" width="80">
                <template #default="{ row }">
                  <span :class="(row.pnl || 0) >= 0 ? 'profit' : 'loss'">
                    {{ (row.pnl || 0) >= 0 ? "+" : "" }}{{ row.pnl }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="roe" label="盈亏%" width="80">
                <template #default="{ row }">
                  <span :class="(row.roe || 0) >= 0 ? 'profit' : 'loss'">
                    {{ (row.roe || 0) >= 0 ? "+" : "" }}{{ row.roe }}%
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
              :data="activeExchangeAccount.orders || []"
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
              <el-table-column prop="quantity" label="数量" width="80" />
              <el-table-column prop="price" label="价格" width="80" />
              <el-table-column prop="status" label="状态" width="80">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)" size="small">
                    {{ getStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="时间" width="120">
                <template #default="{ row }">
                  {{ formatTime(row.createTime) }}
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <!-- 快速交易 -->
      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="24">
          <el-card>
            <template #header>
              <span>快速交易</span>
            </template>
            <el-form :model="tradeForm" label-width="80px" inline>
              <el-form-item label="交易品种">
                <el-select v-model="tradeForm.symbol" placeholder="请选择交易品种" style="width: 150px">
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
                  style="width: 120px"
                />
              </el-form-item>
              <el-form-item label="数量">
                <el-input-number
                  v-model="tradeForm.quantity"
                  :min="0"
                  :step="0.001"
                  :precision="3"
                  style="width: 120px"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handlePlaceOrder" :loading="placingOrder">
                  下单
                </el-button>
              </el-form-item>
            </el-form>
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
    </div>

    <!-- 添加交易所对话框 -->
    <el-dialog v-model="showAddExchangeDialog" title="添加交易所账户" width="600px">
      <el-form :model="addExchangeForm" :rules="addExchangeRules" ref="addExchangeFormRef" label-width="120px">
        <el-form-item label="交易所" prop="exchange">
          <el-select v-model="addExchangeForm.exchange" placeholder="请选择交易所" @change="handleExchangeChange">
            <el-option
              v-for="exchange in supportedExchanges"
              :key="exchange.id"
              :label="exchange.name"
              :value="exchange.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="账户名称" prop="name">
          <el-input v-model="addExchangeForm.name" placeholder="请输入账户名称" />
        </el-form-item>
        <el-form-item label="API Key" prop="apiKey">
          <el-input v-model="addExchangeForm.apiKey" placeholder="请输入API Key" show-password />
        </el-form-item>
        <el-form-item label="API Secret" prop="apiSecret">
          <el-input v-model="addExchangeForm.apiSecret" placeholder="请输入API Secret" show-password />
        </el-form-item>
        <el-form-item v-if="requiresPassphrase" label="Passphrase" prop="passphrase">
          <el-input v-model="addExchangeForm.passphrase" placeholder="请输入Passphrase" show-password />
        </el-form-item>
        <el-form-item label="测试网络">
          <el-switch v-model="addExchangeForm.testnet" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddExchangeDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddExchange" :loading="addingExchange">
          添加
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import TradingChart from "@/components/charts/TradingChart.vue";
import * as tradingApi from "@/api/trading";
import { get, post } from "@/api/base";

// 多交易所相关状态
const exchangeAccounts = ref<any[]>([]);
const activeExchangeId = ref<string>("");
const supportedExchanges = ref<any[]>([]);
const showAddExchangeDialog = ref(false);
const addingExchange = ref(false);
const positionsLoading = ref(false);
const ordersLoading = ref(false);
const placingOrder = ref(false);

// 添加交易所表单
const addExchangeForm = reactive({
  exchange: "",
  name: "",
  apiKey: "",
  apiSecret: "",
  passphrase: "",
  testnet: false,
});

// 添加交易所表单验证规则
const addExchangeRules = {
  exchange: [{ required: true, message: "请选择交易所", trigger: "change" }],
  name: [{ required: true, message: "请输入账户名称", trigger: "blur" }],
  apiKey: [{ required: true, message: "请输入API Key", trigger: "blur" }],
  apiSecret: [{ required: true, message: "请输入API Secret", trigger: "blur" }],
};

// 交易表单
const tradeForm = reactive({
  symbol: "BTC/USDT",
  side: "buy",
  type: "market",
  price: 0,
  quantity: 0.001,
});

// 计算属性
const activeExchangeAccount = computed(() => {
  return exchangeAccounts.value.find(account => account.id === activeExchangeId.value);
});

const requiresPassphrase = computed(() => {
  const exchange = supportedExchanges.value.find(e => e.id === addExchangeForm.exchange);
  return exchange?.requiredCredentials?.includes('passphrase') || false;
});

const todayOrders = computed(() => {
  if (!activeExchangeAccount.value?.orders) return [];
  const today = new Date().toDateString();
  return activeExchangeAccount.value.orders.filter((order: any) => {
    return new Date(order.createTime).toDateString() === today;
  });
});

// 方法
const getExchangeTabLabel = (account: any) => {
  return `${account.name} (${account.exchange})`;
};

const getConnectionStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    connected: "success",
    connecting: "warning",
    disconnected: "info",
    error: "danger",
  };
  return typeMap[status] || "info";
};

const getConnectionStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    connected: "已连接",
    connecting: "连接中",
    disconnected: "未连接",
    error: "错误",
  };
  return textMap[status] || status;
};

const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    pending: "warning",
    open: "primary",
    filled: "success",
    cancelled: "info",
    rejected: "danger",
  };
  return typeMap[status] || "info";
};

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending: "待成交",
    open: "已开盘",
    filled: "已成交",
    cancelled: "已取消",
    rejected: "已拒绝",
  };
  return textMap[status] || status;
};

const formatNumber = (num: number) => {
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatTime = (time: string) => {
  return new Date(time).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const getAvailableBalance = () => {
  if (!activeExchangeAccount.value?.balances) return 0;
  return activeExchangeAccount.value.balances.reduce((total: number, balance: any) => {
    return total + (balance.free || 0);
  }, 0);
};

const getLockedBalance = () => {
  if (!activeExchangeAccount.value?.balances) return 0;
  return activeExchangeAccount.value.balances.reduce((total: number, balance: any) => {
    return total + (balance.locked || 0);
  }, 0);
};

const getProfitablePositionsCount = () => {
  if (!activeExchangeAccount.value?.positions) return 0;
  return activeExchangeAccount.value.positions.filter((p: any) => (p.pnl || 0) > 0).length;
};

const getLosingPositionsCount = () => {
  if (!activeExchangeAccount.value?.positions) return 0;
  return activeExchangeAccount.value.positions.filter((p: any) => (p.pnl || 0) < 0).length;
};

const getFilledOrdersCount = () => {
  return todayOrders.value.filter((order: any) => order.status === 'filled').length;
};

const getFilledRate = () => {
  if (todayOrders.value.length === 0) return 0;
  const filledCount = getFilledOrdersCount();
  return ((filledCount / todayOrders.value.length) * 100).toFixed(1);
};

// API调用
const fetchSupportedExchanges = async () => {
  try {
    const response = await get('/multi-exchange/supported');
    supportedExchanges.value = response;
  } catch (error) {
    console.error('获取支持的交易所失败:', error);
  }
};

const fetchExchangeAccounts = async () => {
  try {
    const response = await get('/multi-exchange/accounts');
    exchangeAccounts.value = response;
    
    // 设置默认选中的交易所
    if (exchangeAccounts.value.length > 0 && !activeExchangeId.value) {
      activeExchangeId.value = exchangeAccounts.value[0].id;
    }
  } catch (error) {
    console.error('获取交易所账户失败:', error);
  }
};

const handleExchangeChange = async (tab: any) => {
  activeExchangeId.value = tab.props.name;
  // 可以在这里添加切换交易所时的逻辑
};

const handleExchangeSelectChange = () => {
  // 重置表单中的一些字段
  addExchangeForm.name = "";
  addExchangeForm.apiKey = "";
  addExchangeForm.apiSecret = "";
  addExchangeForm.passphrase = "";
};

const handleAddExchange = async () => {
  try {
    const response = await post('/multi-exchange/accounts', addExchangeForm);
    if (response.success) {
      ElMessage.success('交易所账户添加成功');
      showAddExchangeDialog.value = false;
      fetchExchangeAccounts();
      
      // 重置表单
      Object.assign(addExchangeForm, {
        exchange: "",
        name: "",
        apiKey: "",
        apiSecret: "",
        passphrase: "",
        testnet: false,
      });
    } else {
      ElMessage.error(response.message || '添加失败');
    }
  } catch (error) {
    console.error('添加交易所账户失败:', error);
    ElMessage.error('添加交易所账户失败');
  }
};

const handleConnectExchange = async (accountId: string) => {
  try {
    await post(`/multi-exchange/accounts/${accountId}/connect`);
    ElMessage.success('交易所连接成功');
    await fetchExchangeAccounts();
  } catch (error) {
    console.error('连接交易所失败:', error);
    ElMessage.error('连接交易所失败');
  }
};

const handleDisconnectExchange = async (accountId: string) => {
  try {
    const response = await fetch(`/api/multi-exchange/accounts/${accountId}/disconnect`, {
      method: 'POST',
    });
    
    const result = await response.json();
    if (result.success) {
      ElMessage.success('交易所连接已断开');
      await fetchExchangeAccounts();
    } else {
      ElMessage.error(result.message || '断开连接失败');
    }
  } catch (error) {
    console.error('断开交易所连接失败:', error);
    ElMessage.error('断开交易所连接失败');
  }
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

    const response = await fetch(`/api/trading/positions/${position.id}/close`, {
      method: 'POST',
    });
    
    const result = await response.json();
    if (result.success) {
      ElMessage.success("平仓成功");
      await fetchExchangeAccounts();
    } else {
      throw new Error(result.message || '平仓失败');
    }
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
  if (!activeExchangeAccount.value) {
    ElMessage.error('请先选择交易所账户');
    return;
  }

  placingOrder.value = true;
  try {
    const orderData = {
      accountId: activeExchangeAccount.value.id,
      symbol: tradeForm.symbol,
      type: tradeForm.type,
      side: tradeForm.side,
      quantity: tradeForm.quantity,
      price: tradeForm.type === 'limit' ? tradeForm.price : undefined,
    };
    
    const response = await fetch('/api/trading/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    
    const result = await response.json();
    
    if (result.success) {
      ElMessage.success("下单成功");
      await fetchExchangeAccounts();
      // 重置表单
      Object.assign(tradeForm, {
        symbol: "BTC/USDT",
        side: "buy",
        type: "market",
        price: 0,
        quantity: 0.001,
      });
    } else {
      throw new Error(result.message || '下单失败');
    }
  } catch (error) {
    console.error('下单失败:', error);
    ElMessage.error('下单失败: ' + (error instanceof Error ? error.message : '未知错误'));
  } finally {
    placingOrder.value = false;
  }
};

onMounted(async () => {
  await fetchSupportedExchanges();
  await fetchExchangeAccounts();
});
</script>

<style scoped>
.trading {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  background: var(--bg-primary);
}

.header-actions {
  display: flex;
  gap: 10px;
}

.exchange-tabs {
  margin-bottom: 20px;
}

.exchange-tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.connection-status {
  font-size: 10px;
}

.no-exchanges {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.exchange-content {
  margin-top: 20px;
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
