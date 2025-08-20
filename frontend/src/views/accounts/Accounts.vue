<template>
  <div class="accounts">
    <div class="page-header">
      <h2>账户管理</h2>
      <el-button type="primary" @click="handleAddAccount">添加账户</el-button>
    </div>

    <!-- 账户概览 -->
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card class="overview-card">
          <template #header>
            <span>账户概览</span>
          </template>
          <div class="overview-content">
            <div class="overview-item">
              <span class="label">总账户数</span>
              <span class="value">{{ accountOverview.totalAccounts }}</span>
            </div>
            <div class="overview-item">
              <span class="label">活跃账户</span>
              <span class="value">{{ accountOverview.activeAccounts }}</span>
            </div>
            <div class="overview-item">
              <span class="label">总资产</span>
              <span class="value"
                >${{ accountOverview.totalAssets.toLocaleString() }}</span
              >
            </div>
            <div class="overview-item">
              <span class="label">今日盈亏</span>
              <span
                class="value"
                :class="accountOverview.todayPnl >= 0 ? 'profit' : 'loss'"
              >
                {{ accountOverview.todayPnl >= 0 ? "+" : "" }}${{
                  accountOverview.todayPnl.toLocaleString()
                }}
              </span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="18">
        <el-card>
          <template #header>
            <span>账户列表</span>
          </template>
          <el-table
            v-loading="loading"
            :data="accounts"
            style="width: 100%"
            border
          >
            <el-table-column prop="name" label="账户名称" width="150" />
            <el-table-column prop="exchange" label="交易所" width="120">
              <template #default="{ row }">
                <el-tag size="small">{{ row.exchange }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="账户类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getAccountTypeColor(row.type)" size="small">
                  {{ getAccountTypeText(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="balance" label="账户余额" width="150">
              <template #default="{ row }">
                <span class="balance-value"
                  >${{ row.balance.toLocaleString() }}</span
                >
              </template>
            </el-table-column>
            <el-table-column prop="pnl" label="今日盈亏" width="120">
              <template #default="{ row }">
                <span :class="row.pnl >= 0 ? 'profit' : 'loss'">
                  {{ row.pnl >= 0 ? "+" : "" }}${{ row.pnl.toLocaleString() }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusColor(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="lastSync" label="最后同步" width="180">
              <template #default="{ row }">
                {{ formatTime(row.lastSync) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button size="small" @click="viewAccount(row)"
                  >查看</el-button
                >
                <el-button size="small" @click="editAccount(row)"
                  >编辑</el-button
                >
                <el-button size="small" @click="syncAccount(row)"
                  >同步</el-button
                >
                <el-button
                  size="small"
                  type="danger"
                  @click="deleteAccount(row)"
                  >删除</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <!-- 账户详情 -->
      <el-tab-pane label="账户详情" name="detail">
        <el-card v-if="selectedAccount">
          <template #header>
            <div class="card-header">
              <h3>{{ selectedAccount.name }} - 详细信息</h3>
              <el-button @click="refreshAccountDetails" :loading="detailLoading"
                >刷新</el-button
              >
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-card>
                <template #header>
                  <span>基本信息</span>
                </template>
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="账户名称">
                    {{ selectedAccount.name }}
                  </el-descriptions-item>
                  <el-descriptions-item label="交易所">
                    {{ selectedAccount.exchange }}
                  </el-descriptions-item>
                  <el-descriptions-item label="账户类型">
                    {{ getAccountTypeText(selectedAccount.type) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="API Key">
                    {{ maskApiKey(selectedAccount.apiKey) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="创建时间">
                    {{ formatTime(selectedAccount.createdAt) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="状态">
                    <el-tag
                      :type="getStatusColor(selectedAccount.status)"
                      size="small"
                    >
                      {{ getStatusText(selectedAccount.status) }}
                    </el-tag>
                  </el-descriptions-item>
                </el-descriptions>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card>
                <template #header>
                  <span>资产概览</span>
                </template>
                <div class="asset-overview">
                  <div class="asset-item">
                    <span class="label">总资产</span>
                    <span class="value"
                      >${{ selectedAccount.balance.toLocaleString() }}</span
                    >
                  </div>
                  <div class="asset-item">
                    <span class="label">可用余额</span>
                    <span class="value"
                      >${{
                        selectedAccount.availableBalance.toLocaleString()
                      }}</span
                    >
                  </div>
                  <div class="asset-item">
                    <span class="label">冻结资金</span>
                    <span class="value"
                      >${{
                        selectedAccount.frozenBalance.toLocaleString()
                      }}</span
                    >
                  </div>
                  <div class="asset-item">
                    <span class="label">今日盈亏</span>
                    <span
                      class="value"
                      :class="selectedAccount.pnl >= 0 ? 'profit' : 'loss'"
                    >
                      {{ selectedAccount.pnl >= 0 ? "+" : "" }}${{
                        selectedAccount.pnl.toLocaleString()
                      }}
                    </span>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
          <el-row :gutter="20" style="margin-top: 20px">
            <el-col :span="24">
              <el-card>
                <template #header>
                  <span>持仓情况</span>
                </template>
                <el-table
                  v-loading="positionsLoading"
                  :data="positions"
                  style="width: 100%"
                  border
                >
                  <el-table-column prop="symbol" label="交易对" width="100" />
                  <el-table-column prop="side" label="方向" width="80">
                    <template #default="{ row }">
                      <el-tag
                        :type="row.side === 'long' ? 'success' : 'danger'"
                        size="small"
                      >
                        {{ row.side === "long" ? "多头" : "空头" }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="size" label="数量" width="100" />
                  <el-table-column
                    prop="entryPrice"
                    label="开仓价"
                    width="120"
                  />
                  <el-table-column
                    prop="currentPrice"
                    label="当前价"
                    width="120"
                  />
                  <el-table-column prop="pnl" label="盈亏" width="120">
                    <template #default="{ row }">
                      <span :class="row.pnl >= 0 ? 'profit' : 'loss'">
                        {{ row.pnl >= 0 ? "+" : "" }}${{ row.pnl }}
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="pnlPercent" label="盈亏%" width="100">
                    <template #default="{ row }">
                      <span :class="row.pnlPercent >= 0 ? 'profit' : 'loss'">
                        {{ row.pnlPercent >= 0 ? "+" : ""
                        }}{{ row.pnlPercent }}%
                      </span>
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </el-col>
          </el-row>
        </el-card>
        <el-card v-else>
          <div class="empty-state">
            <el-empty description="请选择一个账户查看详情" :image-size="100" />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 交易历史 -->
      <el-tab-pane label="交易历史" name="history">
        <el-card>
          <div class="history-controls">
            <el-form :model="historyForm" inline>
              <el-form-item label="账户">
                <el-select
                  v-model="historyForm.accountId"
                  placeholder="选择账户"
                  clearable
                >
                  <el-option
                    v-for="account in accounts"
                    :key="account.id"
                    :label="account.name"
                    :value="account.id"
                  />
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
                <el-button type="primary" @click="queryTradeHistory"
                  >查询</el-button
                >
                <el-button @click="exportTradeHistory">导出</el-button>
              </el-form-item>
            </el-form>
          </div>
          <el-table
            v-loading="historyLoading"
            :data="tradeHistory"
            style="width: 100%"
            border
            height="400"
          >
            <el-table-column prop="timestamp" label="时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.timestamp) }}
              </template>
            </el-table-column>
            <el-table-column prop="account" label="账户" width="120" />
            <el-table-column prop="symbol" label="交易对" width="100" />
            <el-table-column prop="type" label="类型" width="80">
              <template #default="{ row }">
                <el-tag
                  :type="row.type === 'buy' ? 'success' : 'danger'"
                  size="small"
                >
                  {{ row.type === "buy" ? "买入" : "卖出" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="price" label="价格" width="120" />
            <el-table-column prop="amount" label="数量" width="100" />
            <el-table-column prop="total" label="总额" width="120" />
            <el-table-column prop="fee" label="手续费" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getTradeStatusColor(row.status)" size="small">
                  {{ getTradeStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
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

      <!-- API配置 -->
      <el-tab-pane label="API配置" name="api">
        <el-card>
          <template #header>
            <div class="card-header">
              <h3>API配置管理</h3>
              <el-button @click="testAllConnections">测试所有连接</el-button>
            </div>
          </template>
          <el-table :data="apiConfigs" style="width: 100%" border>
            <el-table-column prop="exchange" label="交易所" width="120" />
            <el-table-column prop="apiKey" label="API Key" width="200">
              <template #default="{ row }">
                {{ maskApiKey(row.apiKey) }}
              </template>
            </el-table-column>
            <el-table-column prop="permissions" label="权限" width="200">
              <template #default="{ row }">
                <el-tag
                  v-for="permission in row.permissions"
                  :key="permission"
                  size="small"
                  style="margin-right: 4px"
                >
                  {{ getPermissionText(permission) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="连接状态" width="120">
              <template #default="{ row }">
                <el-tag
                  :type="getConnectionStatusColor(row.status)"
                  size="small"
                >
                  {{ getConnectionStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="lastTest" label="最后测试" width="180">
              <template #default="{ row }">
                {{ formatTime(row.lastTest) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="{ row }">
                <el-button size="small" @click="testConnection(row)"
                  >测试</el-button
                >
                <el-button size="small" @click="editApiConfig(row)"
                  >编辑</el-button
                >
                <el-button
                  size="small"
                  type="danger"
                  @click="deleteApiConfig(row)"
                  >删除</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 添加/编辑账户对话框 -->
    <el-dialog
      v-model="accountDialogVisible"
      :title="accountDialogType === 'add' ? '添加账户' : '编辑账户'"
      width="600px"
    >
      <el-form
        ref="accountFormRef"
        :model="accountForm"
        :rules="accountRules"
        label-width="100px"
      >
        <el-form-item label="账户名称" prop="name">
          <el-input v-model="accountForm.name" placeholder="请输入账户名称" />
        </el-form-item>
        <el-form-item label="交易所" prop="exchange">
          <el-select v-model="accountForm.exchange" placeholder="请选择交易所">
            <el-option label="Binance" value="binance" />
            <el-option label="OKX" value="okx" />
            <el-option label="Huobi" value="huobi" />
            <el-option label="Bybit" value="bybit" />
          </el-select>
        </el-form-item>
        <el-form-item label="账户类型" prop="type">
          <el-select v-model="accountForm.type" placeholder="请选择账户类型">
            <el-option label="现货" value="spot" />
            <el-option label="合约" value="futures" />
            <el-option label="保证金" value="margin" />
          </el-select>
        </el-form-item>
        <el-form-item label="API Key" prop="apiKey">
          <el-input
            v-model="accountForm.apiKey"
            placeholder="请输入API Key"
            show-password
          />
        </el-form-item>
        <el-form-item label="API Secret" prop="apiSecret">
          <el-input
            v-model="accountForm.apiSecret"
            placeholder="请输入API Secret"
            show-password
          />
        </el-form-item>
        <el-form-item label="Passphrase" prop="passphrase">
          <el-input
            v-model="accountForm.passphrase"
            placeholder="请输入Passphrase（如果需要）"
            show-password
          />
        </el-form-item>
        <el-form-item label="测试网络">
          <el-switch v-model="accountForm.testnet" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="accountDialogVisible = false">取消</el-button>
        <el-button @click="testApiConnection">测试连接</el-button>
        <el-button type="primary" @click="saveAccount">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
} from "element-plus";

const activeTab = ref("detail");
const loading = ref(false);
const detailLoading = ref(false);
const historyLoading = ref(false);
const positionsLoading = ref(false);
const accountDialogVisible = ref(false);
const accountDialogType = ref<"add" | "edit">("add");
const accountFormRef = ref<FormInstance>();

// 账户概览
const accountOverview = reactive({
  totalAccounts: 3,
  activeAccounts: 2,
  totalAssets: 150000,
  todayPnl: 2500,
});

// 账户列表
const accounts = ref([
  {
    id: 1,
    name: "Binance现货账户",
    exchange: "Binance",
    type: "spot",
    balance: 50000,
    pnl: 1200,
    status: "active",
    lastSync: "2024-01-15 10:30:00",
    apiKey: "binance_api_key_123",
    availableBalance: 45000,
    frozenBalance: 5000,
    createdAt: "2024-01-01 00:00:00",
  },
  {
    id: 2,
    name: "OKX合约账户",
    exchange: "OKX",
    type: "futures",
    balance: 100000,
    pnl: 1300,
    status: "active",
    lastSync: "2024-01-15 10:25:00",
    apiKey: "okx_api_key_456",
    availableBalance: 80000,
    frozenBalance: 20000,
    createdAt: "2024-01-02 00:00:00",
  },
]);

// 选中的账户
const selectedAccount = ref(null);

// 持仓情况
const positions = ref([
  {
    symbol: "BTC/USDT",
    side: "long",
    size: "0.5",
    entryPrice: "45000",
    currentPrice: "45500",
    pnl: "+250",
    pnlPercent: "+0.56",
  },
  {
    symbol: "ETH/USDT",
    side: "short",
    size: "2.0",
    entryPrice: "3000",
    currentPrice: "2950",
    pnl: "+100",
    pnlPercent: "+1.67",
  },
]);

// 交易历史表单
const historyForm = reactive({
  accountId: "",
  dateRange: [],
});

// 交易历史
const tradeHistory = ref([]);
const historyPagination = reactive({
  page: 1,
  size: 100,
  total: 0,
});

// API配置
const apiConfigs = ref([
  {
    id: 1,
    exchange: "Binance",
    apiKey: "binance_api_key_123",
    permissions: ["read", "trade"],
    status: "connected",
    lastTest: "2024-01-15 10:30:00",
  },
  {
    id: 2,
    exchange: "OKX",
    apiKey: "okx_api_key_456",
    permissions: ["read", "trade", "withdraw"],
    status: "connected",
    lastTest: "2024-01-15 10:25:00",
  },
]);

// 账户表单
const accountForm = reactive({
  id: "",
  name: "",
  exchange: "",
  type: "spot",
  apiKey: "",
  apiSecret: "",
  passphrase: "",
  testnet: false,
});

const accountRules: FormRules = {
  name: [
    { required: true, message: "请输入账户名称", trigger: "blur" },
    {
      min: 2,
      max: 50,
      message: "账户名称长度在 2 到 50 个字符",
      trigger: "blur",
    },
  ],
  exchange: [{ required: true, message: "请选择交易所", trigger: "change" }],
  type: [{ required: true, message: "请选择账户类型", trigger: "change" }],
  apiKey: [{ required: true, message: "请输入API Key", trigger: "blur" }],
  apiSecret: [{ required: true, message: "请输入API Secret", trigger: "blur" }],
};

// 方法
const fetchAccounts = async () => {
  loading.value = true;
  try {
    // TODO: 从API获取账户列表
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (error) {
    ElMessage.error("获取账户列表失败");
  } finally {
    loading.value = false;
  }
};

const handleAddAccount = () => {
  accountDialogType.value = "add";
  Object.assign(accountForm, {
    id: "",
    name: "",
    exchange: "",
    type: "spot",
    apiKey: "",
    apiSecret: "",
    passphrase: "",
    testnet: false,
  });
  accountDialogVisible.value = true;
};

const viewAccount = (account: any) => {
  selectedAccount.value = account;
  activeTab.value = "detail";
  fetchAccountDetails(account.id);
};

const editAccount = (account: any) => {
  accountDialogType.value = "edit";
  Object.assign(accountForm, {
    ...account,
    apiSecret: "", // 不显示原密码
  });
  accountDialogVisible.value = true;
};

const saveAccount = async () => {
  if (!accountFormRef.value) return;

  try {
    await accountFormRef.value.validate();

    // TODO: 调用API保存账户
    await new Promise((resolve) => setTimeout(resolve, 1000));

    ElMessage.success(
      accountDialogType.value === "add" ? "账户添加成功" : "账户编辑成功",
    );
    accountDialogVisible.value = false;
    fetchAccounts();
  } catch (error) {
    console.error("Form validation failed:", error);
  }
};

const syncAccount = async (account: any) => {
  try {
    // TODO: 调用API同步账户
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ElMessage.success("账户同步成功");
    fetchAccounts();
  } catch (error) {
    ElMessage.error("账户同步失败");
  }
};

const deleteAccount = async (account: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除账户"${account.name}"吗？此操作不可撤销。`,
      "删除账户",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    // TODO: 调用API删除账户
    await new Promise((resolve) => setTimeout(resolve, 1000));

    ElMessage.success("账户删除成功");
    fetchAccounts();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("账户删除失败");
    }
  }
};

const fetchAccountDetails = async (accountId: string) => {
  detailLoading.value = true;
  try {
    // TODO: 从API获取账户详情
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (error) {
    ElMessage.error("获取账户详情失败");
  } finally {
    detailLoading.value = false;
  }
};

const refreshAccountDetails = async () => {
  if (selectedAccount.value) {
    await fetchAccountDetails(selectedAccount.value.id);
    ElMessage.success("账户详情已刷新");
  }
};

const handleTabClick = (tab: any) => {
  if (tab.props.name === "history") {
    queryTradeHistory();
  }
};

const queryTradeHistory = async () => {
  historyLoading.value = true;
  try {
    // TODO: 从API获取交易历史
    await new Promise((resolve) => setTimeout(resolve, 1000));
    tradeHistory.value = [];
    historyPagination.total = 0;
  } catch (error) {
    ElMessage.error("查询交易历史失败");
  } finally {
    historyLoading.value = false;
  }
};

const exportTradeHistory = () => {
  // TODO: 导出交易历史
  ElMessage.success("交易历史导出成功");
};

const handleHistorySizeChange = (size: number) => {
  historyPagination.size = size;
  queryTradeHistory();
};

const handleHistoryCurrentChange = (page: number) => {
  historyPagination.page = page;
  queryTradeHistory();
};

const testApiConnection = async () => {
  try {
    // TODO: 测试API连接
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ElMessage.success("API连接测试成功");
  } catch (error) {
    ElMessage.error("API连接测试失败");
  }
};

const testConnection = async (config: any) => {
  try {
    // TODO: 测试指定API连接
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ElMessage.success("连接测试成功");
  } catch (error) {
    ElMessage.error("连接测试失败");
  }
};

const testAllConnections = async () => {
  try {
    // TODO: 测试所有API连接
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ElMessage.success("所有连接测试完成");
  } catch (error) {
    ElMessage.error("连接测试失败");
  }
};

const editApiConfig = (config: any) => {
  // TODO: 编辑API配置
  ElMessage.info("编辑API配置功能开发中");
};

const deleteApiConfig = async (config: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除${config.exchange}的API配置吗？`,
      "删除API配置",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    // TODO: 调用API删除API配置
    await new Promise((resolve) => setTimeout(resolve, 1000));

    ElMessage.success("API配置删除成功");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("API配置删除失败");
    }
  }
};

// 工具函数
const getAccountTypeText = (type: string) => {
  const types: Record<string, string> = {
    spot: "现货",
    futures: "合约",
    margin: "保证金",
  };
  return types[type] || type;
};

const getAccountTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    spot: "success",
    futures: "warning",
    margin: "info",
  };
  return colors[type] || "info";
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    active: "活跃",
    inactive: "停用",
    error: "错误",
  };
  return texts[status] || status;
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: "success",
    inactive: "info",
    error: "danger",
  };
  return colors[status] || "info";
};

const getTradeStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: "待成交",
    filled: "已成交",
    cancelled: "已取消",
    rejected: "已拒绝",
  };
  return texts[status] || status;
};

const getTradeStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: "warning",
    filled: "success",
    cancelled: "info",
    rejected: "danger",
  };
  return colors[status] || "info";
};

const getConnectionStatusText = (status: string) => {
  const texts: Record<string, string> = {
    connected: "已连接",
    disconnected: "未连接",
    error: "错误",
  };
  return texts[status] || status;
};

const getConnectionStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    connected: "success",
    disconnected: "info",
    error: "danger",
  };
  return colors[status] || "info";
};

const getPermissionText = (permission: string) => {
  const texts: Record<string, string> = {
    read: "读取",
    trade: "交易",
    withdraw: "提现",
  };
  return texts[permission] || permission;
};

const maskApiKey = (apiKey: string) => {
  if (!apiKey) return "";
  return apiKey.substring(0, 8) + "****" + apiKey.substring(apiKey.length - 4);
};

const formatTime = (timeString: string) => {
  return new Date(timeString).toLocaleString("zh-CN");
};

// 生命周期
onMounted(() => {
  fetchAccounts();
});
</script>

<style scoped>
.accounts {
  padding: 20px;
  background: var(--gradient-primary);
  min-height: 100vh;
  position: relative;
}

.accounts::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 10% 20%, rgba(0, 122, 255, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 90% 80%, rgba(0, 212, 170, 0.05) 0%, transparent 50%);
  pointer-events: none;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  box-shadow: var(--shadow-glass);
  transition: all var(--transition-smooth) var(--transition-spring);
}

.page-header:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-premium-lg);
}

.page-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 28px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.overview-card {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--radius-xl) !important;
  box-shadow: var(--shadow-glass) !important;
  transition: all var(--transition-smooth) var(--transition-spring) !important;
  position: relative;
  overflow: hidden;
}

.overview-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.overview-card:hover::before {
  left: 100%;
}

.overview-card:hover {
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-premium-lg) !important;
  border-color: var(--border-glow-primary) !important;
}

.overview-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: var(--space-lg);
  position: relative;
  z-index: 1;
}

.overview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--glass-border);
  transition: all var(--transition-smooth) var(--transition-spring);
}

.overview-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  margin: 0 -var(--space-md);
  padding-left: var(--space-md);
  padding-right: var(--space-md);
}

.overview-item:last-child {
  border-bottom: none;
}

.overview-item .label {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.overview-item .value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.balance-value {
  color: var(--market-up);
  font-weight: 600;
  text-shadow: 0 0 10px rgba(0, 212, 170, 0.3);
}

.profit {
  color: var(--market-up) !important;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(0, 212, 170, 0.3);
}

.loss {
  color: var(--market-down) !important;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(255, 59, 48, 0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--glass-border);
}

.card-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-weight: var(--font-semibold);
  font-size: var(--font-lg);
}

.asset-overview {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: var(--space-lg);
  position: relative;
  z-index: 1;
}

.asset-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--glass-border);
  transition: all var(--transition-smooth) var(--transition-spring);
}

.asset-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  margin: 0 -var(--space-md);
  padding-left: var(--space-md);
  padding-right: var(--space-md);
}

.asset-item:last-child {
  border-bottom: none;
}

.asset-item .label {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.asset-item .value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.history-controls {
  margin-bottom: 20px;
}

.empty-state {
  padding: 40px;
  text-align: center;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

/* 卡片样式 */
.el-card {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--radius-xl) !important;
  box-shadow: var(--shadow-glass) !important;
  transition: all var(--transition-smooth) var(--transition-spring) !important;
  position: relative;
  overflow: hidden;
}

.el-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.el-card:hover::before {
  left: 100%;
}

.el-card:hover {
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-premium-lg) !important;
  border-color: var(--border-glow-primary) !important;
}

.el-card__header {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(10px) !important;
  border-bottom: 1px solid var(--glass-border) !important;
  padding: var(--space-lg) !important;
}

.el-card__header span,
.el-card__header h3 {
  color: var(--text-primary) !important;
  font-weight: var(--font-semibold) !important;
  font-size: var(--font-lg) !important;
}

/* 表格样式 */
.el-table {
  background: transparent !important;
  color: var(--text-primary) !important;
  border-radius: var(--radius-lg) !important;
  overflow: hidden !important;
}

.el-table th {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(10px) !important;
  color: var(--text-secondary) !important;
  border-bottom: 1px solid var(--glass-border) !important;
  font-weight: var(--font-semibold) !important;
  font-size: var(--font-sm) !important;
  text-transform: uppercase !important;
  letter-spacing: 0.5px !important;
}

.el-table td {
  background: transparent !important;
  border-bottom: 1px solid var(--glass-border) !important;
  color: var(--text-primary) !important;
  font-weight: var(--font-normal) !important;
}

.el-table--enable-row-hover .el-table__body tr:hover > td {
  background: rgba(255, 255, 255, 0.05) !important;
  border-radius: var(--radius-sm) !important;
}

.el-table tr:last-child td {
  border-bottom: none !important;
}

/* 标签样式 */
.el-tag {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--radius-lg) !important;
  color: var(--text-primary) !important;
  font-weight: var(--font-semibold) !important;
  transition: all var(--transition-smooth) var(--transition-spring) !important;
}

.el-tag:hover {
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-md) !important;
}

.el-tag--success {
  background: rgba(0, 212, 170, 0.2) !important;
  border-color: var(--market-up) !important;
  color: var(--market-up) !important;
}

.el-tag--danger {
  background: rgba(255, 59, 48, 0.2) !important;
  border-color: var(--market-down) !important;
  color: var(--market-down) !important;
}

.el-tag--warning {
  background: rgba(255, 149, 0, 0.2) !important;
  border-color: var(--market-volatile) !important;
  color: var(--market-volatile) !important;
}

.el-tag--info {
  background: rgba(0, 122, 255, 0.2) !important;
  border-color: var(--btn-primary) !important;
  color: var(--btn-primary) !important;
}

/* 按钮样式 */
.el-button {
  background: var(--gradient-glass) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--radius-lg) !important;
  font-weight: var(--font-semibold) !important;
  color: var(--text-primary) !important;
  transition: all var(--transition-smooth) var(--transition-spring) !important;
  position: relative !important;
  overflow: hidden !important;
}

.el-button::before {
  content: '' !important;
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  width: 0 !important;
  height: 0 !important;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%) !important;
  transition: all 0.5s ease !important;
  transform: translate(-50%, -50%) !important;
}

.el-button:hover::before {
  width: 300px !important;
  height: 300px !important;
}

.el-button:hover {
  transform: translateY(-2px) !important;
  box-shadow: var(--glow-primary) !important;
  border-color: var(--border-glow-primary) !important;
}

.el-button--primary {
  background: var(--btn-primary) !important;
  border-color: var(--btn-primary) !important;
  color: white !important;
}

.el-button--primary:hover {
  background: var(--btn-primary-hover) !important;
  box-shadow: var(--glow-primary) !important;
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
