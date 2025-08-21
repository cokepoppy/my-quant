<template>
  <div class="strategy-logs">
    <div class="page-header animate-fade-in">
      <h2 class="text-gradient-primary">策略日志</h2>
      <div class="header-actions">
        <el-button @click="$router.go(-1)" class="premium-button">返回</el-button>
        <el-button type="primary" @click="refreshLogs" class="premium-button primary">
          <el-icon><refresh /></el-icon>
          刷新日志
        </el-button>
        <el-button @click="exportLogs" class="premium-button">
          <el-icon><download /></el-icon>
          导出日志
        </el-button>
      </div>
    </div>

    <!-- 日志过滤器 -->
    <div class="log-filters animate-fade-in delay-1">
      <el-card class="premium-card">
        <template #header>
          <div class="card-header">
            <h3>日志过滤器</h3>
          </div>
        </template>
        <el-form :inline="true" :model="filters" class="filter-form">
          <el-form-item label="日志级别">
            <el-select v-model="filters.level" placeholder="选择级别" clearable>
              <el-option label="全部" value="" />
              <el-option label="DEBUG" value="debug" />
              <el-option label="INFO" value="info" />
              <el-option label="WARNING" value="warning" />
              <el-option label="ERROR" value="error" />
              <el-option label="CRITICAL" value="critical" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="filters.dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
          <el-form-item label="关键词">
            <el-input
              v-model="filters.keyword"
              placeholder="搜索日志内容"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch" class="premium-button">搜索</el-button>
            <el-button @click="resetFilters" class="premium-button">重置</el-button>
            <el-button @click="clearLogs" class="premium-button danger">清空日志</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 日志统计 -->
    <div class="log-stats animate-fade-in delay-2">
      <el-row :gutter="20">
        <el-col :span="4">
          <div class="premium-stat-card">
            <div class="stat-icon debug">
              <el-icon><info /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ logStats.debug }}</div>
              <div class="stat-label">DEBUG</div>
            </div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="premium-stat-card">
            <div class="stat-icon info">
              <el-icon><message /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ logStats.info }}</div>
              <div class="stat-label">INFO</div>
            </div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="premium-stat-card">
            <div class="stat-icon warning">
              <el-icon><warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ logStats.warning }}</div>
              <div class="stat-label">WARNING</div>
            </div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="premium-stat-card">
            <div class="stat-icon error">
              <el-icon><circle-close /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ logStats.error }}</div>
              <div class="stat-label">ERROR</div>
            </div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="premium-stat-card">
            <div class="stat-icon critical">
              <el-icon><dangerous /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ logStats.critical }}</div>
              <div class="stat-label">CRITICAL</div>
            </div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="premium-stat-card">
            <div class="stat-icon total">
              <el-icon><document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ logStats.total }}</div>
              <div class="stat-label">总计</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 日志列表 -->
    <div class="log-list animate-fade-in delay-3">
      <el-card class="premium-card">
        <template #header>
          <div class="card-header">
            <h3>日志列表</h3>
            <div class="list-controls">
              <el-switch
                v-model="autoRefresh"
                active-text="自动刷新"
                inactive-text="手动刷新"
                @change="toggleAutoRefresh"
              />
              <el-select v-model="refreshInterval" size="small" @change="updateRefreshInterval">
                <el-option label="5秒" value="5000" />
                <el-option label="10秒" value="10000" />
                <el-option label="30秒" value="30000" />
                <el-option label="1分钟" value="60000" />
              </el-select>
            </div>
          </div>
        </template>

        <div v-loading="loading" class="log-container">
          <div v-if="filteredLogs.length === 0" class="empty-logs">
            <el-empty description="暂无日志记录">
              <el-button type="primary" @click="refreshLogs">刷新日志</el-button>
            </el-empty>
          </div>

          <div v-else class="log-entries">
            <div
              v-for="log in paginatedLogs"
              :key="log.id"
              class="log-entry"
              :class="[
                `log-${log.level}`,
                { expanded: expandedLogs.includes(log.id) }
              ]"
            >
              <div class="log-header" @click="toggleLogExpansion(log.id)">
                <div class="log-level">
                  <el-tag :type="getLogLevelType(log.level)" size="small">
                    {{ log.level.toUpperCase() }}
                  </el-tag>
                </div>
                <div class="log-time">{{ formatTime(log.timestamp) }}</div>
                <div class="log-message">{{ log.message }}</div>
                <div class="log-actions">
                  <el-button size="small" text @click.stop="copyLog(log)">
                    <el-icon><copy-document /></el-icon>
                  </el-button>
                  <el-button size="small" text @click.stop="toggleLogExpansion(log.id)">
                    <el-icon>{{ expandedLogs.includes(log.id) ? 'arrow-up' : 'arrow-down' }}</el-icon>
                  </el-button>
                </div>
              </div>
              
              <div v-if="expandedLogs.includes(log.id)" class="log-details">
                <div class="detail-item">
                  <div class="detail-label">策略ID:</div>
                  <div class="detail-value">{{ log.strategyId }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">模块:</div>
                  <div class="detail-value">{{ log.module }}</div>
                </div>
                <div v-if="log.function" class="detail-item">
                  <div class="detail-label">函数:</div>
                  <div class="detail-value">{{ log.function }}</div>
                </div>
                <div v-if="log.line" class="detail-item">
                  <div class="detail-label">行号:</div>
                  <div class="detail-value">{{ log.line }}</div>
                </div>
                <div v-if="log.details" class="detail-item">
                  <div class="detail-label">详细信息:</div>
                  <div class="detail-value details-content">{{ log.details }}</div>
                </div>
                <div v-if="log.stackTrace" class="detail-item">
                  <div class="detail-label">堆栈跟踪:</div>
                  <div class="detail-value stack-content">{{ log.stackTrace }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <div v-if="filteredLogs.length > 0" class="pagination-container">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.size"
              :page-sizes="[10, 20, 50, 100]"
              :total="filteredLogs.length"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Refresh,
  Download,
  InfoFilled,
  Message,
  Warning,
  CircleClose,
    Document,
  CopyDocument,
  ArrowUp,
  ArrowDown,
} from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();

// 响应式数据
const loading = ref(false);
const autoRefresh = ref(false);
const refreshInterval = ref('10000');
const refreshTimer = ref<NodeJS.Timeout | null>(null);
const expandedLogs = ref<string[]>([]);

// 过滤器
const filters = reactive({
  level: '',
  dateRange: [] as string[],
  keyword: '',
});

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
});

// 日志统计
const logStats = reactive({
  debug: 45,
  info: 128,
  warning: 23,
  error: 8,
  critical: 2,
  total: 206,
});

// 模拟日志数据
const logs = ref([
  {
    id: '1',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    level: 'info',
    message: '策略启动成功，初始化完成',
    strategyId: route.params.id,
    module: 'StrategyEngine',
    function: 'initialize',
    line: 156,
    details: '策略参数: timeframe=1h, symbols=BTC/USDT,ETH/USDT',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 4 * 60 * 1000),
    level: 'debug',
    message: '市场数据连接成功',
    strategyId: route.params.id,
    module: 'MarketData',
    function: 'connect',
    line: 89,
    details: 'WebSocket连接建立，订阅实时数据流',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 3 * 60 * 1000),
    level: 'warning',
    message: '网络延迟较高，可能影响交易执行',
    strategyId: route.params.id,
    module: 'Network',
    function: 'checkLatency',
    line: 234,
    details: '当前延迟: 450ms，建议检查网络连接',
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    level: 'error',
    message: 'API调用失败，重试中...',
    strategyId: route.params.id,
    module: 'APIClient',
    function: 'fetchData',
    line: 312,
    details: 'HTTP 429: Too Many Requests',
    stackTrace: 'Error: API rate limit exceeded\n    at APIClient.fetchData (apiclient.js:312)\n    at processTicksAndRejections (internal/process/task_queues.js:95:5)',
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 1 * 60 * 1000),
    level: 'info',
    message: '交易信号生成: BTC/USDT 买入信号',
    strategyId: route.params.id,
    module: 'SignalGenerator',
    function: 'generateSignal',
    line: 178,
    details: 'RSI: 28.5, MACD: 看涨交叉，成交量: 正常',
  },
]);

// 计算属性
const filteredLogs = computed(() => {
  let result = logs.value;

  // 按级别过滤
  if (filters.level) {
    result = result.filter(log => log.level === filters.level);
  }

  // 按时间范围过滤
  if (filters.dateRange && filters.dateRange.length === 2) {
    const [start, end] = filters.dateRange;
    result = result.filter(log => {
      const logTime = new Date(log.timestamp);
      return logTime >= new Date(start) && logTime <= new Date(end);
    });
  }

  // 按关键词过滤
  if (filters.keyword) {
    const keyword = filters.keyword.toLowerCase();
    result = result.filter(log => 
      log.message.toLowerCase().includes(keyword) ||
      (log.details && log.details.toLowerCase().includes(keyword))
    );
  }

  return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
});

const paginatedLogs = computed(() => {
  const start = (pagination.page - 1) * pagination.size;
  const end = start + pagination.size;
  return filteredLogs.value.slice(start, end);
});

// 方法
const fetchLogs = async () => {
  loading.value = true;
  try {
    // TODO: 从API获取日志数据
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 更新统计数据
    updateLogStats();
  } catch (error) {
    ElMessage.error('获取日志失败');
  } finally {
    loading.value = false;
  }
};

const refreshLogs = () => {
  fetchLogs();
};

const handleSearch = () => {
  pagination.page = 1;
  fetchLogs();
};

const resetFilters = () => {
  Object.assign(filters, {
    level: '',
    dateRange: [],
    keyword: '',
  });
  pagination.page = 1;
  fetchLogs();
};

const clearLogs = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有日志吗？此操作不可撤销。',
      '清空日志',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );

    // TODO: 调用API清空日志
    logs.value = [];
    updateLogStats();
    ElMessage.success('日志已清空');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清空日志失败');
    }
  }
};

const exportLogs = () => {
  // TODO: 导出日志
  ElMessage.success('日志导出成功');
};

const copyLog = (log: any) => {
  const logText = `[${log.level.toUpperCase()}] ${formatTime(log.timestamp)} - ${log.message}`;
  navigator.clipboard.writeText(logText).then(() => {
    ElMessage.success('日志已复制到剪贴板');
  });
};

const toggleLogExpansion = (logId: string) => {
  const index = expandedLogs.value.indexOf(logId);
  if (index > -1) {
    expandedLogs.value.splice(index, 1);
  } else {
    expandedLogs.value.push(logId);
  }
};

const toggleAutoRefresh = (enabled: boolean) => {
  if (enabled) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
};

const startAutoRefresh = () => {
  const interval = parseInt(refreshInterval.value);
  refreshTimer.value = setInterval(() => {
    refreshLogs();
  }, interval);
};

const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value);
    refreshTimer.value = null;
  }
};

const updateRefreshInterval = () => {
  if (autoRefresh.value) {
    stopAutoRefresh();
    startAutoRefresh();
  }
};

const updateLogStats = () => {
  const stats = {
    debug: 0,
    info: 0,
    warning: 0,
    error: 0,
    critical: 0,
    total: 0,
  };

  logs.value.forEach(log => {
    stats[log.level as keyof typeof stats]++;
    stats.total++;
  });

  Object.assign(logStats, stats);
};

const handleSizeChange = (size: number) => {
  pagination.size = size;
  pagination.page = 1;
};

const handleCurrentChange = (page: number) => {
  pagination.page = page;
};

const getLogLevelType = (level: string) => {
  const typeMap: Record<string, string> = {
    debug: 'info',
    info: 'success',
    warning: 'warning',
    error: 'danger',
    critical: 'danger',
  };
  return typeMap[level] || 'info';
};

const formatTime = (timestamp: Date) => {
  return new Date(timestamp).toLocaleString('zh-CN');
};

// 生命周期
onMounted(() => {
  fetchLogs();
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style scoped>
.strategy-logs {
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
}

.page-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-2xl);
  font-weight: var(--font-semibold);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.log-filters,
.log-stats,
.log-list {
  margin-bottom: 24px;
}

.filter-form {
  margin: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-weight: var(--font-semibold);
  font-size: var(--font-lg);
}

.premium-stat-card {
  background: var(--surface-elevated);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: 20px;
  height: 100%;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal) var(--ease-out);
}

.premium-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  margin-bottom: 12px;
}

.stat-icon.debug {
  background: #6c757d;
}

.stat-icon.info {
  background: var(--btn-primary);
}

.stat-icon.warning {
  background: var(--market-volatile);
}

.stat-icon.error {
  background: var(--market-down);
}

.stat-icon.critical {
  background: #dc3545;
}

.stat-icon.total {
  background: var(--btn-primary);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: var(--font-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  color: var(--text-secondary);
  font-size: var(--font-sm);
  margin-bottom: 4px;
  font-weight: var(--font-medium);
}

.list-controls {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.log-container {
  min-height: 400px;
}

.empty-logs {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.log-entries {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.log-entry {
  background: var(--surface-elevated);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-normal) var(--ease-out);
}

.log-entry:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.log-entry.log-debug {
  border-left: 4px solid #6c757d;
}

.log-entry.log-info {
  border-left: 4px solid var(--btn-primary);
}

.log-entry.log-warning {
  border-left: 4px solid var(--market-volatile);
}

.log-entry.log-error {
  border-left: 4px solid var(--market-down);
}

.log-entry.log-critical {
  border-left: 4px solid #dc3545;
}

.log-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  cursor: pointer;
}

.log-level {
  flex-shrink: 0;
}

.log-time {
  color: var(--text-secondary);
  font-size: var(--font-sm);
  flex-shrink: 0;
  min-width: 150px;
}

.log-message {
  flex: 1;
  color: var(--text-primary);
  font-size: var(--font-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-actions {
  display: flex;
  gap: var(--space-xs);
  flex-shrink: 0;
}

.log-details {
  padding: 16px;
  border-top: 1px solid var(--border-primary);
  background: var(--bg-secondary);
}

.detail-item {
  display: flex;
  margin-bottom: var(--space-sm);
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 80px;
  margin-right: var(--space-md);
}

.detail-value {
  color: var(--text-primary);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: var(--font-sm);
}

.details-content,
.stack-content {
  white-space: pre-wrap;
  word-break: break-all;
  background: rgba(0, 0, 0, 0.2);
  padding: var(--space-sm);
  border-radius: var(--radius-sm);
  margin-top: var(--space-xs);
}

.pagination-container {
  padding: 20px 0 0 0;
  text-align: center;
  background: var(--surface-elevated);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  margin-top: 20px;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-card) {
  background: var(--surface-elevated);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal) var(--ease-out);
}

:deep(.el-card:hover) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

:deep(.el-card__header) {
  background: var(--surface-elevated);
  border-bottom: 1px solid var(--border-primary);
  padding: 16px 20px;
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-button) {
  border-radius: var(--radius-md);
  font-weight: var(--font-medium);
  transition: all var(--transition-normal) var(--ease-out);
}

:deep(.el-button:hover) {
  transform: translateY(-1px);
}

:deep(.el-button--primary) {
  background: var(--btn-primary);
  border-color: var(--btn-primary);
  color: white;
}

:deep(.el-button--primary:hover) {
  background: var(--btn-primary-hover);
  border-color: var(--btn-primary-hover);
  box-shadow: var(--glow-primary);
}

:deep(.el-button--danger) {
  background: var(--market-down);
  border-color: var(--market-down);
  color: white;
}

:deep(.el-button--danger:hover) {
  background: #e02e24;
  border-color: #e02e24;
  box-shadow: var(--glow-danger);
}

:deep(.el-input__wrapper) {
  background: var(--input-bg);
  border-color: var(--input-border);
  border-radius: var(--radius-md);
}

:deep(.el-input__inner) {
  color: var(--input-text);
  font-size: var(--font-base);
}

:deep(.el-select .el-input__wrapper) {
  background: var(--input-bg);
  border-color: var(--input-border);
}

:deep(.el-date-editor.el-input__wrapper) {
  background: var(--input-bg);
  border-color: var(--input-border);
}

:deep(.el-tag) {
  border-radius: var(--radius-md);
  font-weight: var(--font-medium);
}

:deep(.el-tag--success) {
  background: var(--market-up);
  border-color: var(--market-up);
  color: white;
}

:deep(.el-tag--warning) {
  background: var(--market-volatile);
  border-color: var(--market-volatile);
  color: white;
}

:deep(.el-tag--info) {
  background: var(--btn-primary);
  border-color: var(--btn-primary);
  color: white;
}

:deep(.el-tag--danger) {
  background: var(--market-down);
  border-color: var(--market-down);
  color: white;
}

:deep(.el-switch__core) {
  background: var(--input-bg);
  border-color: var(--input-border);
}

:deep(.el-switch.is-checked .el-switch__core) {
  background: var(--btn-primary);
  border-color: var(--btn-primary);
}

:deep(.el-pagination) {
  background: transparent;
}

:deep(.el-pagination .el-select .el-input__wrapper) {
  background: var(--input-bg);
  border-color: var(--input-border);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .strategy-logs {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
    padding: 12px 16px;
  }

  .header-actions {
    flex-wrap: wrap;
  }

  .log-stats .el-col {
    margin-bottom: 12px;
  }

  .log-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .log-time {
    min-width: auto;
  }

  .list-controls {
    flex-direction: column;
    gap: 8px;
  }

  .filter-form {
    flex-direction: column;
    gap: 12px;
  }
}
</style>