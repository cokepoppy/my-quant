<template>
  <div class="settings">
    <div class="page-header">
      <h2>系统设置</h2>
      <el-button type="primary" @click="handleSave">保存设置</el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-tabs v-model="activeTab">
          <!-- 基本设置 -->
          <el-tab-pane label="基本设置" name="basic">
            <el-card>
              <el-form :model="basicSettings" label-width="120px">
                <el-form-item label="系统名称">
                  <el-input v-model="basicSettings.systemName" />
                </el-form-item>
                <el-form-item label="系统描述">
                  <el-input
                    v-model="basicSettings.systemDescription"
                    type="textarea"
                    :rows="3"
                  />
                </el-form-item>
                <el-form-item label="时区">
                  <el-select v-model="basicSettings.timezone">
                    <el-option label="Asia/Shanghai" value="Asia/Shanghai" />
                    <el-option label="UTC" value="UTC" />
                    <el-option
                      label="America/New_York"
                      value="America/New_York"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="语言">
                  <el-select v-model="basicSettings.language">
                    <el-option label="中文" value="zh-CN" />
                    <el-option label="English" value="en-US" />
                  </el-select>
                </el-form-item>
                <el-form-item label="主题">
                  <el-select v-model="basicSettings.theme">
                    <el-option label="浅色" value="light" />
                    <el-option label="深色" value="dark" />
                    <el-option label="跟随系统" value="auto" />
                  </el-select>
                </el-form-item>
              </el-form>
            </el-card>
          </el-tab-pane>

          <!-- 交易设置 -->
          <el-tab-pane label="交易设置" name="trading">
            <el-card>
              <el-form :model="tradingSettings" label-width="120px">
                <el-form-item label="默认杠杆">
                  <el-input-number
                    v-model="tradingSettings.defaultLeverage"
                    :min="1"
                    :max="125"
                    :step="1"
                  />
                </el-form-item>
                <el-form-item label="手续费率">
                  <el-input-number
                    v-model="tradingSettings.feeRate"
                    :min="0"
                    :max="1"
                    :step="0.001"
                    :precision="3"
                  />
                  <span style="margin-left: 10px">%</span>
                </el-form-item>
                <el-form-item label="最小交易量">
                  <el-input-number
                    v-model="tradingSettings.minTradeAmount"
                    :min="0"
                    :step="0.001"
                    :precision="3"
                  />
                </el-form-item>
                <el-form-item label="最大持仓数">
                  <el-input-number
                    v-model="tradingSettings.maxPositions"
                    :min="1"
                    :max="100"
                    :step="1"
                  />
                </el-form-item>
                <el-form-item label="风险限制">
                  <el-row :gutter="20">
                    <el-col :span="8">
                      <el-form-item label="单笔最大风险">
                        <el-input-number
                          v-model="tradingSettings.maxRiskPerTrade"
                          :min="0"
                          :max="100"
                          :step="0.1"
                          :precision="1"
                        />
                        <span style="margin-left: 10px">%</span>
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="每日最大风险">
                        <el-input-number
                          v-model="tradingSettings.maxDailyRisk"
                          :min="0"
                          :max="100"
                          :step="0.1"
                          :precision="1"
                        />
                        <span style="margin-left: 10px">%</span>
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="最大回撤">
                        <el-input-number
                          v-model="tradingSettings.maxDrawdown"
                          :min="0"
                          :max="100"
                          :step="0.1"
                          :precision="1"
                        />
                        <span style="margin-left: 10px">%</span>
                      </el-form-item>
                    </el-col>
                  </el-row>
                </el-form-item>
              </el-form>
            </el-card>
          </el-tab-pane>

          <!-- 通知设置 -->
          <el-tab-pane label="通知设置" name="notification">
            <el-card>
              <el-form :model="notificationSettings" label-width="120px">
                <el-form-item label="邮件通知">
                  <el-switch v-model="notificationSettings.emailEnabled" />
                </el-form-item>
                <el-form-item
                  v-if="notificationSettings.emailEnabled"
                  label="SMTP服务器"
                >
                  <el-input v-model="notificationSettings.smtpHost" />
                </el-form-item>
                <el-form-item
                  v-if="notificationSettings.emailEnabled"
                  label="SMTP端口"
                >
                  <el-input-number
                    v-model="notificationSettings.smtpPort"
                    :min="1"
                    :max="65535"
                  />
                </el-form-item>
                <el-form-item
                  v-if="notificationSettings.emailEnabled"
                  label="邮箱账号"
                >
                  <el-input v-model="notificationSettings.emailUser" />
                </el-form-item>
                <el-form-item
                  v-if="notificationSettings.emailEnabled"
                  label="邮箱密码"
                >
                  <el-input
                    v-model="notificationSettings.emailPassword"
                    type="password"
                    show-password
                  />
                </el-form-item>

                <el-divider />

                <el-form-item label="短信通知">
                  <el-switch v-model="notificationSettings.smsEnabled" />
                </el-form-item>
                <el-form-item
                  v-if="notificationSettings.smsEnabled"
                  label="短信服务商"
                >
                  <el-select v-model="notificationSettings.smsProvider">
                    <el-option label="阿里云" value="aliyun" />
                    <el-option label="腾讯云" value="tencent" />
                    <el-option label="Twilio" value="twilio" />
                  </el-select>
                </el-form-item>

                <el-divider />

                <el-form-item label="通知类型">
                  <el-checkbox-group
                    v-model="notificationSettings.notificationTypes"
                  >
                    <el-checkbox label="trade">交易通知</el-checkbox>
                    <el-checkbox label="risk">风险警告</el-checkbox>
                    <el-checkbox label="system">系统通知</el-checkbox>
                    <el-checkbox label="strategy">策略通知</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
              </el-form>
            </el-card>
          </el-tab-pane>

          <!-- API设置 -->
          <el-tab-pane label="API设置" name="api">
            <el-card>
              <el-form :model="apiSettings" label-width="120px">
                <el-form-item label="数据源">
                  <el-select v-model="apiSettings.dataSource">
                    <el-option label="Binance" value="binance" />
                    <el-option label="OKX" value="okx" />
                    <el-option label="Huobi" value="huobi" />
                    <el-option label="聚合数据" value="juhe" />
                  </el-select>
                </el-form-item>
                <el-form-item label="API密钥">
                  <el-input
                    v-model="apiSettings.apiKey"
                    placeholder="请输入API密钥"
                    show-password
                  />
                </el-form-item>
                <el-form-item label="API密钥">
                  <el-input
                    v-model="apiSettings.apiSecret"
                    placeholder="请输入API密钥"
                    show-password
                  />
                </el-form-item>
                <el-form-item label="请求限制">
                  <el-row :gutter="20">
                    <el-col :span="12">
                      <el-form-item label="每分钟请求数">
                        <el-input-number
                          v-model="apiSettings.requestsPerMinute"
                          :min="1"
                          :max="10000"
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="每小时请求数">
                        <el-input-number
                          v-model="apiSettings.requestsPerHour"
                          :min="1"
                          :max="100000"
                        />
                      </el-form-item>
                    </el-col>
                  </el-row>
                </el-form-item>
                <el-form-item label="测试连接">
                  <el-button @click="testApiConnection">测试连接</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </el-tab-pane>

          <!-- 数据库设置 -->
          <el-tab-pane label="数据库设置" name="database">
            <el-card>
              <el-form :model="databaseSettings" label-width="120px">
                <el-form-item label="数据库类型">
                  <el-select v-model="databaseSettings.type">
                    <el-option label="PostgreSQL" value="postgresql" />
                    <el-option label="MySQL" value="mysql" />
                    <el-option label="SQLite" value="sqlite" />
                  </el-select>
                </el-form-item>
                <el-form-item label="主机地址">
                  <el-input v-model="databaseSettings.host" />
                </el-form-item>
                <el-form-item label="端口">
                  <el-input-number
                    v-model="databaseSettings.port"
                    :min="1"
                    :max="65535"
                  />
                </el-form-item>
                <el-form-item label="数据库名">
                  <el-input v-model="databaseSettings.database" />
                </el-form-item>
                <el-form-item label="用户名">
                  <el-input v-model="databaseSettings.username" />
                </el-form-item>
                <el-form-item label="密码">
                  <el-input
                    v-model="databaseSettings.password"
                    type="password"
                    show-password
                  />
                </el-form-item>
                <el-form-item label="连接池大小">
                  <el-input-number
                    v-model="databaseSettings.poolSize"
                    :min="1"
                    :max="100"
                  />
                </el-form-item>
                <el-form-item label="备份策略">
                  <el-select v-model="databaseSettings.backupStrategy">
                    <el-option label="每日" value="daily" />
                    <el-option label="每周" value="weekly" />
                    <el-option label="每月" value="monthly" />
                  </el-select>
                </el-form-item>
              </el-form>
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";

const activeTab = ref("basic");

const basicSettings = reactive({
  systemName: "量化交易系统",
  systemDescription: "专业的量化交易平台",
  timezone: "Asia/Shanghai",
  language: "zh-CN",
  theme: "light",
});

const tradingSettings = reactive({
  defaultLeverage: 1,
  feeRate: 0.001,
  minTradeAmount: 0.001,
  maxPositions: 10,
  maxRiskPerTrade: 2,
  maxDailyRisk: 5,
  maxDrawdown: 10,
});

const notificationSettings = reactive({
  emailEnabled: false,
  smtpHost: "",
  smtpPort: 587,
  emailUser: "",
  emailPassword: "",
  smsEnabled: false,
  smsProvider: "aliyun",
  notificationTypes: ["trade", "risk"],
});

const apiSettings = reactive({
  dataSource: "binance",
  apiKey: "",
  apiSecret: "",
  requestsPerMinute: 1200,
  requestsPerHour: 72000,
});

const databaseSettings = reactive({
  type: "postgresql",
  host: "localhost",
  port: 5432,
  database: "quant_trading",
  username: "quant",
  password: "",
  poolSize: 10,
  backupStrategy: "daily",
});

const originalSettings = reactive({
  basic: { ...basicSettings },
  trading: { ...tradingSettings },
  notification: { ...notificationSettings },
  api: { ...apiSettings },
  database: { ...databaseSettings },
});

const fetchSettings = async () => {
  try {
    // TODO: 从API获取设置
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (error) {
    ElMessage.error("获取设置失败");
  }
};

const handleSave = async () => {
  try {
    // TODO: 调用API保存设置
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 更新原始设置
    Object.assign(originalSettings.basic, basicSettings);
    Object.assign(originalSettings.trading, tradingSettings);
    Object.assign(originalSettings.notification, notificationSettings);
    Object.assign(originalSettings.api, apiSettings);
    Object.assign(originalSettings.database, databaseSettings);

    ElMessage.success("设置保存成功");
  } catch (error) {
    ElMessage.error("设置保存失败");
  }
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

onMounted(() => {
  fetchSettings();
});
</script>

<style scoped>
.settings {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #333;
}
</style>
