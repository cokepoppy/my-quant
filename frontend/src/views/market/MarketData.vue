<template>
  <div class="market-data">
    <div class="page-header">
      <h2>市场数据</h2>
      <el-button type="primary" @click="handleRefresh">刷新数据</el-button>
    </div>

    <!-- 市场概览 -->
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card class="market-card">
          <template #header>
            <span>市场概况</span>
          </template>
          <div class="market-overview">
            <div class="overview-item">
              <span class="label">总市值</span>
              <span class="value"
                >${{ marketOverview.totalMarketCap.toLocaleString() }}B</span
              >
            </div>
            <div class="overview-item">
              <span class="label">24h成交量</span>
              <span class="value"
                >${{ marketOverview.volume24h.toLocaleString() }}B</span
              >
            </div>
            <div class="overview-item">
              <span class="label">BTC占比</span>
              <span class="value">{{ marketOverview.btcDominance }}%</span>
            </div>
            <div class="overview-item">
              <span class="label">活跃交易对</span>
              <span class="value">{{ marketOverview.activePairs }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="18">
        <el-card>
          <template #header>
            <span>实时价格</span>
          </template>
          <el-table
            v-loading="priceLoading"
            :data="realtimePrices"
            style="width: 100%"
            border
            size="small"
          >
            <el-table-column prop="symbol" label="交易对" width="100" />
            <el-table-column prop="price" label="价格" width="120">
              <template #default="{ row }">
                <span class="price-value"
                  >${{ row.price.toLocaleString() }}</span
                >
              </template>
            </el-table-column>
            <el-table-column prop="change24h" label="24h涨跌" width="100">
              <template #default="{ row }">
                <span :class="row.change24h >= 0 ? 'profit' : 'loss'">
                  {{ row.change24h >= 0 ? "+" : "" }}{{ row.change24h }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="volume24h" label="24h成交量" width="120">
              <template #default="{ row }">
                <span>${{ (row.volume24h / 1000000).toFixed(2) }}M</span>
              </template>
            </el-table-column>
            <el-table-column prop="high24h" label="24h最高" width="100">
              <template #default="{ row }">
                <span>${{ row.high24h.toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="low24h" label="24h最低" width="100">
              <template #default="{ row }">
                <span>${{ row.low24h.toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button size="small" @click="showChart(row)">图表</el-button>
                <el-button size="small" @click="addToWatchlist(row)"
                  >收藏</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <!-- 价格图表 -->
      <el-tab-pane label="价格图表" name="charts">
        <el-card>
          <div class="chart-controls">
            <el-select v-model="selectedSymbol" placeholder="选择交易对">
              <el-option label="BTC/USDT" value="BTC/USDT" />
              <el-option label="ETH/USDT" value="ETH/USDT" />
              <el-option label="BNB/USDT" value="BNB/USDT" />
              <el-option label="ADA/USDT" value="ADA/USDT" />
              <el-option label="DOT/USDT" value="DOT/USDT" />
            </el-select>
            <el-select v-model="timeframe" placeholder="时间周期">
              <el-option label="1分钟" value="1m" />
              <el-option label="5分钟" value="5m" />
              <el-option label="15分钟" value="15m" />
              <el-option label="1小时" value="1h" />
              <el-option label="4小时" value="4h" />
              <el-option label="1天" value="1d" />
            </el-select>
            <el-button @click="updateChart">更新图表</el-button>
          </div>
          <div class="chart-container">
            <TradingChart
              :symbol="selectedSymbol"
              :timeframe="timeframe"
              :height="500"
              :realtime="true"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 市场深度 -->
      <el-tab-pane label="市场深度" name="depth">
        <el-card>
          <div class="depth-controls">
            <el-select v-model="depthSymbol" placeholder="选择交易对">
              <el-option label="BTC/USDT" value="BTC/USDT" />
              <el-option label="ETH/USDT" value="ETH/USDT" />
              <el-option label="BNB/USDT" value="BNB/USDT" />
            </el-select>
            <el-button @click="updateDepth">更新深度</el-button>
          </div>
          <div class="depth-container">
            <div class="depth-placeholder">
              <el-empty description="市场深度图表开发中" :image-size="100" />
            </div>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 历史数据 -->
      <el-tab-pane label="历史数据" name="history">
        <el-card>
          <div class="history-controls">
            <el-form :model="historyForm" inline>
              <el-form-item label="交易对">
                <el-select
                  v-model="historyForm.symbol"
                  placeholder="选择交易对"
                >
                  <el-option label="BTC/USDT" value="BTC/USDT" />
                  <el-option label="ETH/USDT" value="ETH/USDT" />
                  <el-option label="BNB/USDT" value="BNB/USDT" />
                </el-select>
              </el-form-item>
              <el-form-item label="时间周期">
                <el-select
                  v-model="historyForm.timeframe"
                  placeholder="选择周期"
                >
                  <el-option label="1分钟" value="1m" />
                  <el-option label="5分钟" value="5m" />
                  <el-option label="15分钟" value="15m" />
                  <el-option label="1小时" value="1h" />
                  <el-option label="1天" value="1d" />
                </el-select>
              </el-form-item>
              <el-form-item label="时间范围">
                <el-date-picker
                  v-model="historyForm.dateRange"
                  type="datetimerange"
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  format="YYYY-MM-DD HH:mm:ss"
                  value-format="YYYY-MM-DD HH:mm:ss"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="queryHistory">查询</el-button>
                <el-button @click="exportHistory">导出</el-button>
              </el-form-item>
            </el-form>
          </div>
          <el-table
            v-loading="historyLoading"
            :data="historyData"
            style="width: 100%"
            border
            height="400"
          >
            <el-table-column prop="timestamp" label="时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.timestamp) }}
              </template>
            </el-table-column>
            <el-table-column prop="open" label="开盘" width="100" />
            <el-table-column prop="high" label="最高" width="100" />
            <el-table-column prop="low" label="最低" width="100" />
            <el-table-column prop="close" label="收盘" width="100" />
            <el-table-column prop="volume" label="成交量" width="120" />
            <el-table-column prop="turnover" label="成交额" width="120" />
            <el-table-column prop="trades" label="交易次数" width="100" />
          </el-table>
          <div class="pagination">
            <el-pagination
              v-model:current-page="historyPagination.page"
              v-model:page-size="historyPagination.size"
              :page-sizes="[50, 100, 200, 500]"
              :total="historyPagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleHistorySizeChange"
              @current-change="handleHistoryCurrentChange"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 自选列表 -->
      <el-tab-pane label="自选列表" name="watchlist">
        <el-card>
          <div class="watchlist-header">
            <h3>我的自选</h3>
            <el-button @click="addToWatchlistDialog = true">添加</el-button>
          </div>
          <el-table
            v-loading="watchlistLoading"
            :data="watchlist"
            style="width: 100%"
            border
          >
            <el-table-column prop="symbol" label="交易对" width="100" />
            <el-table-column prop="price" label="当前价格" width="120">
              <template #default="{ row }">
                <span class="price-value"
                  >${{ row.price.toLocaleString() }}</span
                >
              </template>
            </el-table-column>
            <el-table-column prop="change24h" label="24h涨跌" width="100">
              <template #default="{ row }">
                <span :class="row.change24h >= 0 ? 'profit' : 'loss'">
                  {{ row.change24h >= 0 ? "+" : "" }}{{ row.change24h }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="high24h" label="24h最高" width="100" />
            <el-table-column prop="low24h" label="24h最低" width="100" />
            <el-table-column prop="volume24h" label="24h成交量" width="120" />
            <el-table-column prop="alertPrice" label="提醒价格" width="120" />
            <el-table-column prop="createdAt" label="添加时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="{ row }">
                <el-button size="small" @click="showChart(row)">图表</el-button>
                <el-button size="small" @click="editWatchlist(row)"
                  >编辑</el-button
                >
                <el-button
                  size="small"
                  type="danger"
                  @click="removeWatchlist(row)"
                  >删除</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 添加自选对话框 -->
    <el-dialog v-model="addToWatchlistDialog" title="添加到自选" width="400px">
      <el-form :model="watchlistForm" label-width="80px">
        <el-form-item label="交易对">
          <el-select v-model="watchlistForm.symbol" placeholder="选择交易对">
            <el-option label="BTC/USDT" value="BTC/USDT" />
            <el-option label="ETH/USDT" value="ETH/USDT" />
            <el-option label="BNB/USDT" value="BNB/USDT" />
            <el-option label="ADA/USDT" value="ADA/USDT" />
            <el-option label="DOT/USDT" value="DOT/USDT" />
          </el-select>
        </el-form-item>
        <el-form-item label="提醒价格">
          <el-input-number
            v-model="watchlistForm.alertPrice"
            :min="0"
            :precision="2"
            placeholder="设置价格提醒"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="watchlistForm.note"
            type="textarea"
            :rows="2"
            placeholder="添加备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addToWatchlistDialog = false">取消</el-button>
        <el-button type="primary" @click="saveWatchlist">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import TradingChart from "@/components/charts/TradingChart.vue";

const activeTab = ref("charts");
const selectedSymbol = ref("BTC/USDT");
const timeframe = ref("1h");
const depthSymbol = ref("BTC/USDT");
const priceLoading = ref(false);
const historyLoading = ref(false);
const watchlistLoading = ref(false);
const addToWatchlistDialog = ref(false);
let priceUpdateInterval: any = null;

// 市场概览数据
const marketOverview = reactive({
  totalMarketCap: 1200,
  volume24h: 45,
  btcDominance: 52.3,
  activePairs: 1250,
});

// 实时价格数据
const realtimePrices = ref([
  {
    symbol: "BTC/USDT",
    price: 45000,
    change24h: 2.5,
    volume24h: 2500000000,
    high24h: 45500,
    low24h: 44200,
  },
  {
    symbol: "ETH/USDT",
    price: 3000,
    change24h: -1.2,
    volume24h: 1500000000,
    high24h: 3050,
    low24h: 2950,
  },
  {
    symbol: "BNB/USDT",
    price: 400,
    change24h: 0.8,
    volume24h: 800000000,
    high24h: 405,
    low24h: 395,
  },
]);

// 历史数据表单
const historyForm = reactive({
  symbol: "BTC/USDT",
  timeframe: "1h",
  dateRange: [],
});

// 历史数据
const historyData = ref([]);
const historyPagination = reactive({
  page: 1,
  size: 100,
  total: 0,
});

// 自选列表
const watchlist = ref([
  {
    symbol: "BTC/USDT",
    price: 45000,
    change24h: 2.5,
    high24h: 45500,
    low24h: 44200,
    volume24h: 2500000000,
    alertPrice: 46000,
    createdAt: "2024-01-01 00:00:00",
  },
]);

// 自选表单
const watchlistForm = reactive({
  symbol: "",
  alertPrice: 0,
  note: "",
});

// 方法
const handleRefresh = async () => {
  try {
    priceLoading.value = true;
    await fetchMarketData();
    ElMessage.success("数据刷新成功");
  } catch (error) {
    ElMessage.error("数据刷新失败");
  } finally {
    priceLoading.value = false;
  }
};

const fetchMarketData = async () => {
  try {
    // TODO: 从API获取市场数据
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (error) {
    console.error("获取市场数据失败:", error);
  }
};

const handleTabClick = (tab: any) => {
  if (tab.props.name === "history") {
    queryHistory();
  } else if (tab.props.name === "watchlist") {
    fetchWatchlist();
  }
};

const updateChart = () => {
  // 更新图表
  ElMessage.success("图表已更新");
};

const updateDepth = () => {
  // 更新深度图
  ElMessage.success("深度图已更新");
};

const queryHistory = async () => {
  historyLoading.value = true;
  try {
    // TODO: 从API获取历史数据
    await new Promise((resolve) => setTimeout(resolve, 1000));
    historyData.value = [];
    historyPagination.total = 0;
  } catch (error) {
    ElMessage.error("查询历史数据失败");
  } finally {
    historyLoading.value = false;
  }
};

const exportHistory = () => {
  // TODO: 导出历史数据
  ElMessage.success("历史数据导出成功");
};

const handleHistorySizeChange = (size: number) => {
  historyPagination.size = size;
  queryHistory();
};

const handleHistoryCurrentChange = (page: number) => {
  historyPagination.page = page;
  queryHistory();
};

const fetchWatchlist = async () => {
  watchlistLoading.value = true;
  try {
    // TODO: 从API获取自选列表
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (error) {
    ElMessage.error("获取自选列表失败");
  } finally {
    watchlistLoading.value = false;
  }
};

const saveWatchlist = async () => {
  try {
    // TODO: 调用API保存自选
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ElMessage.success("添加到自选成功");
    addToWatchlistDialog.value = false;
    fetchWatchlist();
  } catch (error) {
    ElMessage.error("添加到自选失败");
  }
};

const showChart = (row: any) => {
  selectedSymbol.value = row.symbol;
  activeTab.value = "charts";
  ElMessage.info("正在加载图表...");
};

const editWatchlist = (row: any) => {
  // TODO: 编辑自选
  ElMessage.info("编辑功能开发中");
};

const removeWatchlist = async (row: any) => {
  try {
    // TODO: 调用API删除自选
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ElMessage.success("删除成功");
    fetchWatchlist();
  } catch (error) {
    ElMessage.error("删除失败");
  }
};

const addToWatchlist = (row: any) => {
  watchlistForm.symbol = row.symbol;
  watchlistForm.alertPrice = row.price;
  addToWatchlistDialog.value = true;
};

const formatTime = (timeString: string) => {
  return new Date(timeString).toLocaleString("zh-CN");
};

// 自动更新价格
const startPriceUpdate = () => {
  priceUpdateInterval = setInterval(async () => {
    await fetchMarketData();
  }, 5000); // 5秒更新一次
};

const stopPriceUpdate = () => {
  if (priceUpdateInterval) {
    clearInterval(priceUpdateInterval);
    priceUpdateInterval = null;
  }
};

// 生命周期
onMounted(async () => {
  try {
    await fetchMarketData();
    startPriceUpdate();
  } catch (error) {
    console.error("初始化市场数据失败:", error);
  }
});

onUnmounted(() => {
  stopPriceUpdate();
});
</script>

<style scoped>
.market-data {
  padding: 20px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  min-height: 100vh;
  color: #e0e0e0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #ffffff;
  font-weight: 600;
}

.market-card {
  background: rgba(255, 255, 255, 0.05) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
}

.market-overview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.overview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.overview-item:last-child {
  border-bottom: none;
}

.overview-item .label {
  font-size: 14px;
  color: #b0b0b0;
}

.overview-item .value {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
}

.price-value {
  color: #00d4aa;
  font-weight: 600;
}

.profit {
  color: #00d4aa !important;
  font-weight: 600;
}

.loss {
  color: #ff4757 !important;
  font-weight: 600;
}

.chart-controls,
.depth-controls,
.history-controls,
.watchlist-header {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
}

.watchlist-header {
  justify-content: space-between;
}

.watchlist-header h3 {
  margin: 0;
  color: #ffffff;
  font-weight: 600;
}

.chart-container,
.depth-container {
  height: 500px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 20px;
}

.depth-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

/* 卡片样式 */
.el-card {
  background: rgba(255, 255, 255, 0.05) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
  transition: all 0.3s ease !important;
}

.el-card:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4) !important;
}

.el-card__header {
  background: rgba(255, 255, 255, 0.02) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.el-card__header span {
  color: #ffffff !important;
  font-weight: 600 !important;
}

/* 表格样式 */
.el-table {
  background: transparent !important;
  color: #ffffff !important;
}

.el-table th {
  background: rgba(255, 255, 255, 0.05) !important;
  color: #ffffff !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.el-table td {
  background: rgba(255, 255, 255, 0.02) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
  color: #e0e0e0 !important;
}

.el-table--enable-row-hover .el-table__body tr:hover > td {
  background: rgba(255, 255, 255, 0.08) !important;
}

/* 按钮样式 */
.el-button {
  border-radius: 6px !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
}

.el-button:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
}

/* 对话框样式 */
.el-dialog {
  background: rgba(26, 26, 46, 0.95) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5) !important;
}

.el-dialog__header {
  background: rgba(255, 255, 255, 0.02) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.el-dialog__title {
  color: #ffffff !important;
  font-weight: 600 !important;
}

.el-dialog__body {
  background: rgba(255, 255, 255, 0.02) !important;
  color: #e0e0e0 !important;
}

/* 表单样式 */
.el-form-item__label {
  color: #b0b0b0 !important;
}

.el-input__inner {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: #ffffff !important;
}

.el-input__inner:focus {
  border-color: #00d4aa !important;
  box-shadow: 0 0 0 2px rgba(0, 212, 170, 0.2) !important;
}

.el-select .el-input__inner {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: #ffffff !important;
}

.el-select-dropdown {
  background: rgba(26, 26, 46, 0.95) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
}

.el-select-dropdown__item {
  color: #e0e0e0 !important;
}

.el-select-dropdown__item:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
}

/* 标签页样式 */
.el-tabs__nav-wrap::after {
  background: rgba(255, 255, 255, 0.1) !important;
}

.el-tabs__item {
  color: #b0b0b0 !important;
}

.el-tabs__item.is-active {
  color: #00d4aa !important;
}

.el-tabs__active-bar {
  background: #00d4aa !important;
}

/* 分页样式 */
.el-pagination {
  color: #e0e0e0 !important;
}

.el-pagination .el-pagination__total {
  color: #e0e0e0 !important;
}

.el-pagination .el-pager li {
  background: rgba(255, 255, 255, 0.05) !important;
  color: #e0e0e0 !important;
}

.el-pagination .el-pager li.active {
  background: #00d4aa !important;
  color: #ffffff !important;
}
</style>
