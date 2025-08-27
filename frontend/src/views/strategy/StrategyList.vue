<template>
  <div class="strategy-list-container">
    <div class="list-header">
      <h1>策略管理</h1>
      <div class="header-actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索策略"
          prefix-icon="Search"
          clearable
          class="search-input"
          @input="handleSearch"
        />
        <el-button type="primary" @click="createStrategy" icon="Plus">创建策略</el-button>
      </div>
    </div>

    <el-card class="strategy-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <div class="filter-section">
            <el-select v-model="filterType" placeholder="策略类型" clearable @change="handleFilter">
              <el-option v-for="type in strategyTypes" :key="type.value" :label="type.label" :value="type.value" />
            </el-select>
            <el-select v-model="filterSymbol" placeholder="交易品种" clearable @change="handleFilter">
              <el-option v-for="symbol in symbols" :key="symbol.value" :label="symbol.label" :value="symbol.value" />
            </el-select>
            <el-select v-model="sortBy" placeholder="排序方式" @change="handleSort">
              <el-option label="创建时间 (新→旧)" value="created_desc" />
              <el-option label="创建时间 (旧→新)" value="created_asc" />
              <el-option label="名称 (A→Z)" value="name_asc" />
              <el-option label="名称 (Z→A)" value="name_desc" />
              <el-option label="收益率 (高→低)" value="profit_desc" />
              <el-option label="收益率 (低→高)" value="profit_asc" />
            </el-select>
          </div>
          <el-switch
            v-model="showActiveOnly"
            active-text="仅显示激活策略"
            inactive-text="显示所有策略"
            @change="handleFilter"
          />
        </div>
      </template>

      <div v-if="filteredStrategies.length === 0" class="empty-state">
        <el-empty description="暂无策略" :image-size="120">
          <template #description>
            <p>{{ loading ? '加载中...' : (searchQuery ? '没有找到匹配的策略' : '您还没有创建任何策略') }}</p>
          </template>
          <el-button type="primary" @click="createStrategy">创建第一个策略</el-button>
        </el-empty>
      </div>

      <el-table
        v-else
        :data="filteredStrategies"
        style="width: 100%"
        row-key="id"
        border
        stripe
        highlight-current-row
        @row-click="handleRowClick"
      >
        <el-table-column label="策略名称" min-width="180">
          <template #default="{ row }">
            <div class="strategy-name">
              <el-tag :type="getStatusTagType(row.status)" size="small" effect="dark">
                {{ getStatusText(row.status) }}
              </el-tag>
              <span class="name-text">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="策略类型" prop="type" min-width="120">
          <template #default="{ row }">
            {{ getStrategyTypeLabel(row.type) }}
          </template>
        </el-table-column>
        
        <el-table-column label="交易品种" prop="symbol" min-width="120">
          <template #default="{ row }">
            {{ getSymbolLabel(row.symbol) }}
          </template>
        </el-table-column>
        
        <el-table-column label="时间周期" prop="timeframe" min-width="100">
          <template #default="{ row }">
            {{ getTimeframeLabel(row.timeframe) }}
          </template>
        </el-table-column>
        
        <el-table-column label="收益率" min-width="120">
          <template #default="{ row }">
            <div :class="['profit-rate', row.profitRate >= 0 ? 'profit-positive' : 'profit-negative']">
              {{ formatProfitRate(row.profitRate) }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="创建时间" prop="createdAt" min-width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" fixed="right" width="220">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button size="small" @click.stop="viewStrategy(row)">查看</el-button>
              <el-button size="small" type="primary" @click.stop="editStrategy(row)">编辑</el-button>
              <el-dropdown trigger="click" @command="(command) => handleCommand(command, row)" @click.stop>
                <el-button size="small">
                  更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="row.status === 'active' ? 'deactivate' : 'activate'">
                      {{ row.status === 'active' ? '停用' : '启用' }}
                    </el-dropdown-item>
                    <el-dropdown-item command="backtest">回测</el-dropdown-item>
                    <el-dropdown-item command="duplicate">复制</el-dropdown-item>
                    <el-dropdown-item command="export">导出</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalStrategies"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="删除策略"
      width="400px"
      :close-on-click-modal="false"
    >
      <div class="delete-dialog-content">
        <el-icon class="warning-icon"><warning /></el-icon>
        <p>确定要删除策略 <strong>{{ selectedStrategy?.name }}</strong> 吗？</p>
        <p class="warning-text">此操作不可逆，策略相关的所有数据将被永久删除。</p>
      </div>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete" :loading="deleting">确认删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineEmits } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowDown, Warning } from '@element-plus/icons-vue';
import * as strategyApi from '@/api/strategy';

// 定义emit事件
const emit = defineEmits(['view-strategy', 'edit-strategy', 'create-strategy'])

// 状态变量
const loading = ref(false);
const strategies = ref([]);
const searchQuery = ref('');
const filterType = ref('');
const filterSymbol = ref('');
const sortBy = ref('created_desc');
const showActiveOnly = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const totalStrategies = ref(0);
const deleteDialogVisible = ref(false);
const deleting = ref(false);
const selectedStrategy = ref(null);

// 策略类型选项
const strategyTypes = [
      { value: 'trend_following', label: '趋势跟踪' },
      { value: 'mean_reversion', label: '均值回归' },
      { value: 'breakout', label: '突破策略' },
      { value: 'statistical_arbitrage', label: '统计套利' },
      { value: 'machine_learning', label: '机器学习' },
      { value: 'custom', label: '自定义策略' },
    ];
    
    // 交易品种选项
    const symbols = [
      { value: 'BTCUSDT', label: 'BTC/USDT - 比特币' },
      { value: 'ETHUSDT', label: 'ETH/USDT - 以太坊' },
      { value: 'BNBUSDT', label: 'BNB/USDT - 币安币' },
      { value: '000001.SH', label: '上证指数' },
      { value: '399001.SZ', label: '深证成指' },
      { value: '399006.SZ', label: '创业板指' },
    ];
    
    // 时间周期选项
    const timeframes = [
      { value: '1m', label: '1分钟' },
      { value: '5m', label: '5分钟' },
      { value: '15m', label: '15分钟' },
      { value: '30m', label: '30分钟' },
      { value: '1h', label: '1小时' },
      { value: '4h', label: '4小时' },
      { value: '1d', label: '日线' },
      { value: '1w', label: '周线' },
    ];
    
    // 过滤后的策略列表
    const filteredStrategies = computed(() => {
      let result = [...strategies.value];
      
      // 搜索过滤
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(strategy => 
          strategy.name.toLowerCase().includes(query) || 
          strategy.description?.toLowerCase().includes(query)
        );
      }
      
      // 类型过滤
      if (filterType.value) {
        result = result.filter(strategy => strategy.type === filterType.value);
      }
      
      // 交易品种过滤
      if (filterSymbol.value) {
        result = result.filter(strategy => strategy.symbol === filterSymbol.value);
      }
      
      // 状态过滤
      if (showActiveOnly.value) {
        result = result.filter(strategy => strategy.status === 'active');
      }
      
      // 排序
      result.sort((a, b) => {
        switch (sortBy.value) {
          case 'created_desc':
            return new Date(b.createdAt) - new Date(a.createdAt);
          case 'created_asc':
            return new Date(a.createdAt) - new Date(b.createdAt);
          case 'name_asc':
            return a.name.localeCompare(b.name);
          case 'name_desc':
            return b.name.localeCompare(a.name);
          case 'profit_desc':
            return b.profitRate - a.profitRate;
          case 'profit_asc':
            return a.profitRate - b.profitRate;
          default:
            return 0;
        }
      });
      
      return result;
    });
    
    // 加载策略列表
    const loadStrategies = async () => {
      loading.value = true;
      try {
        console.log('🔥 StrategyList: 开始加载策略列表');
        
        const params = {
          page: currentPage.value,
          limit: pageSize.value,
          search: searchQuery.value || undefined,
          status: showActiveOnly.value ? 'active' : undefined,
          type: filterType.value || undefined
        };
        
        console.log('🔥 StrategyList: 请求参数:', params);
        
        const response = await strategyApi.getStrategies(params);
        
        console.log('🔥 StrategyList: API响应:', response);
        console.log('🔥 StrategyList: 响应结构:', {
          hasStrategies: 'strategies' in response,
          hasPagination: 'pagination' in response,
          hasData: 'data' in response,
          strategies: response.strategies,
          pagination: response.pagination,
          data: response.data
        });
        
        // 处理不同的响应结构
        let strategiesData = [];
        let paginationData = { total: 0 };
        
        if (response.strategies && response.pagination) {
          // 旧结构：直接包含strategies和pagination
          strategiesData = response.strategies;
          paginationData = response.pagination;
        } else if (response.data && response.data.strategies && response.data.pagination) {
          // 新结构：包含在data中
          strategiesData = response.data.strategies;
          paginationData = response.data.pagination;
        } else if (response.data) {
          // 其他结构：尝试从data中获取
          strategiesData = response.data.strategies || [];
          paginationData = response.data.pagination || { total: response.data.total || 0 };
        }
        
        console.log('🔥 StrategyList: 处理后的数据:', {
          strategies: strategiesData,
          pagination: paginationData
        });
        
        strategies.value = strategiesData || [];
        totalStrategies.value = paginationData.total || 0;
        
        console.log('🔥 StrategyList: 加载完成，策略数量:', strategies.value.length, '总数:', totalStrategies.value);
        
      } catch (error) {
        console.error('🔥 StrategyList: 加载策略列表失败:', error);
        console.error('🔥 StrategyList: 错误详情:', {
          message: error.message,
          stack: error.stack,
          response: error.response
        });
        ElMessage.error('加载策略列表失败: ' + (error instanceof Error ? error.message : '未知错误'));
        strategies.value = [];
        totalStrategies.value = 0;
      } finally {
        loading.value = false;
      }
    };
    
    // 创建新策略
    const createStrategy = () => {
      emit('create-strategy');
    };
    
    // 查看策略详情
    const viewStrategy = (strategy) => {
      console.log('viewStrategy called with:', strategy)
      emit('view-strategy', strategy);
    };
    
    // 编辑策略
    const editStrategy = (strategy) => {
      emit('edit-strategy', strategy);
    };
    
    // 处理下拉菜单命令
    const handleCommand = (command, strategy) => {
      selectedStrategy.value = strategy;
      
      switch (command) {
        case 'activate':
          toggleStrategyStatus(strategy, 'active');
          break;
        case 'deactivate':
          toggleStrategyStatus(strategy, 'inactive');
          break;
        case 'backtest':
          router.push({ name: 'Backtest', query: { strategyId: strategy.id } });
          break;
        case 'duplicate':
          duplicateStrategy(strategy);
          break;
        case 'export':
          exportStrategy(strategy);
          break;
        case 'delete':
          deleteDialogVisible.value = true;
          break;
      }
    };
    
    // 切换策略状态
    const toggleStrategyStatus = async (strategy, newStatus) => {
      try {
        const actionText = newStatus === 'active' ? '启用' : '停用';
        
        const response = await strategyApi.updateStrategyStatus(strategy.id, newStatus);
        
        if (response.success) {
          // 更新本地状态
          const index = strategies.value.findIndex(s => s.id === strategy.id);
          if (index !== -1) {
            strategies.value[index].status = newStatus;
          }
          ElMessage.success(`策略${actionText}成功`);
        } else {
          throw new Error(response.message || '操作失败');
        }
      } catch (error) {
        console.error('切换策略状态失败:', error);
        ElMessage.error('操作失败: ' + (error instanceof Error ? error.message : '未知错误'));
      }
    };
    
    // 复制策略
    const duplicateStrategy = async (strategy) => {
      try {
        const response = await strategyApi.duplicateStrategy(strategy.id);
        
        if (response.success) {
          ElMessage.success('策略复制成功');
          loadStrategies();
        } else {
          throw new Error(response.message || '复制失败');
        }
      } catch (error) {
        console.error('复制策略失败:', error);
        ElMessage.error('复制失败: ' + (error instanceof Error ? error.message : '未知错误'));
      }
    };
    
    // 导出策略
    const exportStrategy = (strategy) => {
      try {
        // 创建要导出的策略数据
        const exportData = {
          name: strategy.name,
          description: strategy.description,
          type: strategy.type,
          symbol: strategy.symbol,
          timeframe: strategy.timeframe,
          // 其他需要导出的字段
        };
        
        // 转换为JSON字符串
        const jsonStr = JSON.stringify(exportData, null, 2);
        
        // 创建Blob对象
        const blob = new Blob([jsonStr], { type: 'application/json' });
        
        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${strategy.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        
        // 触发下载
        document.body.appendChild(a);
        a.click();
        
        // 清理
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 0);
        
        ElMessage.success('策略导出成功');
      } catch (error) {
        ElMessage.error('导出失败: ' + error.message);
      }
    };
    
    // 确认删除策略
    const confirmDelete = async () => {
      if (!selectedStrategy.value) return;
      
      deleting.value = true;
      try {
        const response = await strategyApi.deleteStrategy(selectedStrategy.value.id);
        
        if (response.success) {
          // 更新本地状态
          strategies.value = strategies.value.filter(s => s.id !== selectedStrategy.value.id);
          totalStrategies.value = Math.max(0, totalStrategies.value - 1);
          
          ElMessage.success('策略删除成功');
          deleteDialogVisible.value = false;
        } else {
          throw new Error(response.message || '删除失败');
        }
      } catch (error) {
        console.error('删除策略失败:', error);
        ElMessage.error('删除失败: ' + (error instanceof Error ? error.message : '未知错误'));
      } finally {
        deleting.value = false;
      }
    };
    
    // 处理表格行点击
    const handleRowClick = (row) => {
      viewStrategy(row);
    };
    
    // 处理搜索
    const handleSearch = () => {
      currentPage.value = 1;
      loadStrategies();
    };
    
    // 处理过滤
    const handleFilter = () => {
      currentPage.value = 1;
      loadStrategies();
    };
    
    // 处理排序
    const handleSort = () => {
      loadStrategies();
    };
    
    // 处理页面大小变化
    const handleSizeChange = (size) => {
      pageSize.value = size;
      loadStrategies();
    };
    
    // 处理页码变化
    const handleCurrentChange = (page) => {
      currentPage.value = page;
      loadStrategies();
    };
    
    // 格式化收益率
    const formatProfitRate = (rate) => {
      if (rate === undefined || rate === null) return '--';
      return `${rate >= 0 ? '+' : ''}${rate.toFixed(2)}%`;
    };
    
    // 格式化日期
    const formatDate = (date) => {
      if (!date) return '--';
      try {
        const d = new Date(date);
        return d.toLocaleDateString();
      } catch (e) {
        return '--';
      }
    };
    
    // 获取策略类型标签
    const getStrategyTypeLabel = (type) => {
      const found = strategyTypes.find(t => t.value === type);
      return found ? found.label : type;
    };
    
    // 获取交易品种标签
    const getSymbolLabel = (symbol) => {
      const found = symbols.find(s => s.value === symbol);
      return found ? found.label : symbol;
    };
    
    // 获取时间周期标签
    const getTimeframeLabel = (timeframe) => {
      const found = timeframes.find(t => t.value === timeframe);
      return found ? found.label : timeframe;
    };
    
    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        active: '运行中',
        inactive: '已停用',
        error: '错误',
        pending: '等待中'
      };
      return statusMap[status] || status;
    };
    
    // 获取状态标签类型
    const getStatusTagType = (status) => {
      const typeMap = {
        active: 'success',
        inactive: 'info',
        error: 'danger',
        pending: 'warning'
      };
      return typeMap[status] || 'info';
    };

// 暴露方法给父组件
defineExpose({
  loadStrategies
});

onMounted(() => {
  loadStrategies();
});
</script>

<style scoped>
.strategy-list-container {
  padding: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.list-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.search-input {
  width: 240px;
}

.strategy-card {
  margin-bottom: 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-section {
  display: flex;
  gap: 12px;
}

.strategy-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name-text {
  font-weight: 500;
}

.profit-rate {
  font-weight: 600;
}

.profit-positive {
  color: #67c23a;
}

.profit-negative {
  color: #f56c6c;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

.delete-dialog-content {
  text-align: center;
  padding: 20px 0;
}

.warning-icon {
  font-size: 48px;
  color: #e6a23c;
  margin-bottom: 16px;
}

.warning-text {
  color: #f56c6c;
  margin-top: 12px;
}
</style>