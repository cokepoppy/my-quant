<template>
  <div class="strategy-list-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1>策略管理</h1>
          <p>管理和配置您的交易策略</p>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="createStrategy">
            <el-icon><plus /></el-icon>
            创建策略
          </el-button>
          <el-button @click="fetchTemplates">
            <el-icon><document /></el-icon>
            使用模板
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon total">
                <el-icon><collection /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ strategyStats.total }}</div>
                <div class="stat-label">总策略数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon active">
                <el-icon><video-play /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ strategyStats.active }}</div>
                <div class="stat-label">运行中</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon draft">
                <el-icon><edit /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ strategyStats.draft }}</div>
                <div class="stat-label">草稿</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon stopped">
                <el-icon><video-pause /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ strategyStats.stopped }}</div>
                <div class="stat-label">已停止</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和过滤器 -->
    <div class="filter-section">
      <el-card>
        <el-form :inline="true" :model="filters" class="filter-form">
          <el-form-item label="搜索">
            <el-input
              v-model="filters.search"
              placeholder="搜索策略名称或描述"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              v-model="filters.status"
              placeholder="选择状态"
              clearable
            >
              <el-option label="全部" value="" />
              <el-option label="运行中" value="active" />
              <el-option label="草稿" value="draft" />
              <el-option label="已停止" value="stopped" />
              <el-option label="错误" value="error" />
            </el-select>
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="filters.type" placeholder="选择类型" clearable>
              <el-option label="全部" value="" />
              <el-option label="趋势" value="trend" />
              <el-option label="动量" value="momentum" />
              <el-option label="均值回归" value="mean_reversion" />
              <el-option label="套利" value="arbitrage" />
              <el-option label="自定义" value="custom" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 策略列表 -->
    <div class="strategy-list">
      <el-card>
        <div v-if="isLoading" class="loading-container fade-in">
          <el-skeleton :rows="5" animated />
        </div>

        <div v-else-if="strategies.length === 0" class="empty-container fade-in">
          <el-empty description="暂无策略">
            <el-button type="primary" @click="createStrategy">
              创建第一个策略
            </el-button>
          </el-empty>
        </div>

        <div v-else>
          <div
            v-for="(strategy, index) in strategies"
            :key="strategy.id"
            class="strategy-item"
            :class="`fade-in delay-${index}`"
          >
            <div class="strategy-content">
              <div class="strategy-info">
                <div class="strategy-header">
                  <h3>{{ strategy.name }}</h3>
                  <el-tag :type="getStatusType(strategy.status)">
                    {{ getStatusText(strategy.status) }}
                  </el-tag>
                </div>
                <p class="strategy-description">{{ strategy.description }}</p>
                <div class="strategy-meta">
                  <span class="meta-item">
                    <el-icon><cpu /></el-icon>
                    {{ getTypeText(strategy.type) }}
                  </span>
                  <span class="meta-item">
                    <el-icon><document /></el-icon>
                    {{ strategy.language }}
                  </span>
                  <span class="meta-item">
                    <el-icon><calendar /></el-icon>
                    {{ formatDate(strategy.createdAt) }}
                  </span>
                  <span v-if="strategy.lastRunAt" class="meta-item">
                    <el-icon><timer /></el-icon>
                    最后运行: {{ formatDate(strategy.lastRunAt) }}
                  </span>
                </div>
                <div class="strategy-tags">
                  <el-tag
                    v-for="tag in strategy.tags"
                    :key="tag"
                    size="small"
                    class="strategy-tag"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </div>

              <div class="strategy-actions">
                <el-button-group>
                  <el-button size="small" @click="viewStrategy(strategy.id)">
                    查看
                  </el-button>
                  <el-button size="small" @click="editStrategy(strategy.id)">
                    编辑
                  </el-button>
                  <el-button
                    v-if="strategy.status === 'active'"
                    size="small"
                    type="warning"
                    @click="stopStrategy(strategy.id)"
                  >
                    停止
                  </el-button>
                  <el-button
                    v-else-if="
                      strategy.status === 'stopped' ||
                      strategy.status === 'draft'
                    "
                    size="small"
                    type="success"
                    @click="startStrategy(strategy.id)"
                  >
                    启动
                  </el-button>
                </el-button-group>
                <el-dropdown
                  @command="(command) => handleAction(command, strategy.id)"
                >
                  <el-button size="small" text>
                    <el-icon><more /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="performance"
                        >性能分析</el-dropdown-item
                      >
                      <el-dropdown-item command="logs"
                        >查看日志</el-dropdown-item
                      >
                      <el-dropdown-item command="duplicate"
                        >复制策略</el-dropdown-item
                      >
                      <el-dropdown-item command="export"
                        >导出策略</el-dropdown-item
                      >
                      <el-dropdown-item
                        divided
                        command="delete"
                        class="text-danger"
                      >
                        删除策略
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="strategies.length > 0" class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.limit"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 创建策略对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="创建策略"
      width="80%"
      :before-close="handleCloseCreateDialog"
    >
      <strategy-form
        v-if="showCreateDialog"
        :templates="templates"
        @submit="handleCreateSubmit"
        @cancel="handleCloseCreateDialog"
      />
    </el-dialog>

    <!-- 模板选择对话框 -->
    <el-dialog
      v-model="showTemplateDialog"
      title="选择策略模板"
      width="60%"
      :before-close="handleCloseTemplateDialog"
    >
      <template-list
        v-if="showTemplateDialog"
        :templates="templates"
        @select="handleTemplateSelect"
        @cancel="handleCloseTemplateDialog"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Document,
  Collection,
  VideoPlay,
  VideoPause,
  Edit,
  More,
  Cpu,
  Calendar,
  Timer,
} from "@element-plus/icons-vue";
import { useStrategyStore } from "@/stores/strategy";
import { useAppStore } from "@/stores/app";
import type { Strategy, StrategyTemplate } from "@/types/strategy";
import StrategyForm from "@/components/forms/StrategyForm.vue";
import TemplateList from "@/components/strategy/TemplateList.vue";

const router = useRouter();
const strategyStore = useStrategyStore();
const appStore = useAppStore();

// 响应式数据
const showCreateDialog = ref(false);
const showTemplateDialog = ref(false);

// 计算属性
const strategies = computed(() => strategyStore.strategies);
const templates = computed(() => strategyStore.templates);
const isLoading = computed(() => strategyStore.isLoading);
const strategyStats = computed(() => strategyStore.strategyStats);
const pagination = computed(() => strategyStore.pagination);
const filters = computed(() => strategyStore.filters);

// 方法
const createStrategy = () => {
  showCreateDialog.value = true;
};

const fetchTemplates = async () => {
  try {
    await strategyStore.fetchTemplates();
    showTemplateDialog.value = true;
  } catch (error) {
    console.error("获取模板失败:", error);
  }
};

const viewStrategy = (id: string) => {
  router.push(`/strategies/${id}`);
};

const editStrategy = (id: string) => {
  router.push(`/strategies/${id}/edit`);
};

const startStrategy = async (id: string) => {
  try {
    await strategyStore.startStrategyById(id);
  } catch (error) {
    console.error("启动策略失败:", error);
  }
};

const stopStrategy = async (id: string) => {
  try {
    await strategyStore.stopStrategyById(id);
  } catch (error) {
    console.error("停止策略失败:", error);
  }
};

const handleAction = (command: string, id: string) => {
  switch (command) {
    case "performance":
      router.push(`/strategies/${id}/performance`);
      break;
    case "logs":
      router.push(`/strategies/${id}/logs`);
      break;
    case "duplicate":
      duplicateStrategy(id);
      break;
    case "export":
      exportStrategy(id);
      break;
    case "delete":
      deleteStrategyAction(id);
      break;
  }
};

const duplicateStrategy = async (id: string) => {
  try {
    const strategy = await strategyStore.fetchStrategyById(id);
    const newStrategy = {
      ...strategy,
      name: `${strategy.name} (复制)`,
      status: "draft" as const,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      lastRunAt: undefined,
    };
    await strategyStore.createNewStrategy(newStrategy);
  } catch (error) {
    console.error("复制策略失败:", error);
  }
};

const exportStrategy = async (id: string) => {
  try {
    const strategy = await strategyStore.fetchStrategyById(id);
    const dataStr = JSON.stringify(strategy, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `${strategy.name}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  } catch (error) {
    console.error("导出策略失败:", error);
  }
};

const deleteStrategyAction = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      "确定要删除这个策略吗？此操作不可撤销。",
      "删除策略",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    await strategyStore.deleteStrategyById(id);
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除策略失败:", error);
    }
  }
};

const handleSearch = () => {
  strategyStore.setFilters(filters.value);
  strategyStore.fetchStrategies();
};

const resetFilters = () => {
  strategyStore.setFilters({
    search: "",
    status: "",
    type: "",
  });
  strategyStore.fetchStrategies();
};

const handleSizeChange = (size: number) => {
  strategyStore.setPagination({ limit: size });
  strategyStore.fetchStrategies();
};

const handleCurrentChange = (page: number) => {
  strategyStore.setPagination({ page });
  strategyStore.fetchStrategies();
};

const handleCreateSubmit = async (data: Partial<Strategy>) => {
  try {
    await strategyStore.createNewStrategy(data);
    showCreateDialog.value = false;
    router.push(`/strategies/${strategyStore.strategies[0].id}`);
  } catch (error) {
    console.error("创建策略失败:", error);
  }
};

const handleCloseCreateDialog = () => {
  showCreateDialog.value = false;
};

const handleTemplateSelect = async (template: StrategyTemplate) => {
  try {
    showTemplateDialog.value = false;
    router.push(`/strategies/create?template=${template.id}`);
  } catch (error) {
    console.error("选择模板失败:", error);
  }
};

const handleCloseTemplateDialog = () => {
  showTemplateDialog.value = false;
};

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    active: "success",
    draft: "info",
    stopped: "warning",
    error: "danger",
  };
  return types[status] || "info";
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    active: "运行中",
    draft: "草稿",
    stopped: "已停止",
    error: "错误",
  };
  return texts[status] || status;
};

const getTypeText = (type: string) => {
  const types: Record<string, string> = {
    trend: "趋势",
    momentum: "动量",
    mean_reversion: "均值回归",
    arbitrage: "套利",
    custom: "自定义",
  };
  return types[type] || type;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("zh-CN");
};

// 生命周期
onMounted(async () => {
  try {
    await strategyStore.fetchStrategies();
    await strategyStore.fetchTemplates();
  } catch (error) {
    console.error("获取策略列表失败:", error);
  }
});
</script>

<style scoped>
.strategy-list-container {
  padding: 20px;
  background: var(--gradient-primary);
  min-height: 100vh;
  position: relative;
}

.strategy-list-container::before {
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
  margin-bottom: 30px;
  position: relative;
  z-index: 1;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  box-shadow: var(--shadow-glass);
  transition: all var(--transition-smooth) var(--transition-spring);
}

.header-content:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-premium-lg);
}

.header-left h1 {
  margin: 0 0 8px 0;
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.header-left p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 16px;
  font-weight: 400;
}

.header-right {
  display: flex;
  gap: 12px;
}

.stats-section {
  margin-bottom: 30px;
  position: relative;
  z-index: 1;
}

.stat-card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-glass);
  transition: all var(--transition-smooth) var(--transition-spring);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--btn-primary), var(--market-up), var(--market-down));
  animation: shimmer 2s linear infinite;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-premium-lg);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: var(--space-lg);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  position: relative;
  overflow: hidden;
}

.stat-icon::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.stat-icon:hover::before {
  left: 100%;
}

.stat-icon.total {
  background: linear-gradient(135deg, var(--btn-primary) 0%, #4a90e2 100%);
  box-shadow: var(--glow-primary);
}

.stat-icon.active {
  background: linear-gradient(135deg, var(--market-up) 0%, #00a885 100%);
  box-shadow: var(--glow-success);
}

.stat-icon.draft {
  background: linear-gradient(135deg, var(--market-volatile) 0%, #e07f00 100%);
  box-shadow: var(--glow-warning);
}

.stat-icon.stopped {
  background: linear-gradient(135deg, var(--text-tertiary) 0%, var(--text-muted) 100%);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 36px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.stat-label {
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 4px;
  font-weight: 500;
}

.filter-section {
  margin-bottom: 30px;
  position: relative;
  z-index: 1;
}

.filter-form {
  margin: 0;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  box-shadow: var(--shadow-glass);
  transition: all var(--transition-smooth) var(--transition-spring);
}

.filter-form:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-premium-lg);
}

.strategy-list {
  margin-bottom: 30px;
  position: relative;
  z-index: 1;
}

.loading-container {
  padding: 20px;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-glass);
}

.empty-container {
  padding: 60px 20px;
  text-align: center;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-glass);
}

.strategy-item {
  padding: 20px 0;
  border-bottom: 1px solid var(--glass-border);
  transition: all var(--transition-smooth) var(--transition-spring);
}

.strategy-item:hover {
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-lg);
  margin: 0 -20px;
  padding-left: 20px;
  padding-right: 20px;
}

.strategy-item:last-child {
  border-bottom: none;
}

.strategy-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.strategy-info {
  flex: 1;
}

.strategy-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.strategy-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.strategy-description {
  margin: 0 0 12px 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.strategy-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
}

.strategy-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.strategy-tag {
  margin-right: 0;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  transition: all var(--transition-smooth) var(--transition-spring);
}

.strategy-tag:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.strategy-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-container {
  padding: 20px 0 0 0;
  text-align: center;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-glass);
  transition: all var(--transition-smooth) var(--transition-spring);
}

.pagination-container:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-premium-lg);
}

.text-danger {
  color: var(--market-down);
}

/* 动画效果 */
.fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.slide-in {
  animation: slideIn 0.6s ease-out;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-50px); }
  to { opacity: 1; transform: translateX(0); }
}

.scale-in {
  animation: scaleIn 0.4s ease-out;
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

/* 延迟动画效果 */
.delay-0 { animation-delay: 0.1s; }
.delay-1 { animation-delay: 0.2s; }
.delay-2 { animation-delay: 0.3s; }
.delay-3 { animation-delay: 0.4s; }
.delay-4 { animation-delay: 0.5s; }
.delay-5 { animation-delay: 0.6s; }
.delay-6 { animation-delay: 0.7s; }
.delay-7 { animation-delay: 0.8s; }
.delay-8 { animation-delay: 0.9s; }
.delay-9 { animation-delay: 1.0s; }

/* Element Plus 组件样式覆盖 */
.dark .el-card {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--radius-xl) !important;
  box-shadow: var(--shadow-glass) !important;
  transition: all var(--transition-smooth) var(--transition-spring) !important;
}

.dark .el-card:hover {
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-premium-lg) !important;
}

.dark .el-button {
  background: var(--gradient-glass) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--radius-lg) !important;
  font-weight: var(--font-semibold) !important;
  transition: all var(--transition-smooth) var(--transition-spring) !important;
}

.dark .el-button:hover {
  transform: translateY(-2px) !important;
  box-shadow: var(--glow-primary) !important;
  border-color: var(--border-glow-primary) !important;
}

.dark .el-button--primary {
  background: var(--btn-primary) !important;
  border-color: var(--btn-primary) !important;
}

.dark .el-button--primary:hover {
  background: var(--btn-primary-hover) !important;
  box-shadow: var(--glow-primary) !important;
}

.dark .el-input__inner {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--radius-lg) !important;
  color: var(--text-primary) !important;
  transition: all var(--transition-smooth) var(--transition-spring) !important;
}

.dark .el-input__inner:focus {
  border-color: var(--border-glow-primary) !important;
  box-shadow: var(--glow-primary) !important;
}

.dark .el-select .el-input__inner {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid var(--glass-border) !important;
  color: var(--text-primary) !important;
}

.dark .el-select-dropdown {
  background: var(--gradient-surface) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--radius-xl) !important;
  box-shadow: var(--shadow-premium-lg) !important;
}

.dark .el-select-dropdown__item {
  color: var(--text-primary) !important;
  transition: all var(--transition-smooth) var(--transition-spring) !important;
}

.dark .el-select-dropdown__item:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  color: var(--text-primary) !important;
}

.dark .el-tag {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--radius-lg) !important;
  color: var(--text-primary) !important;
  transition: all var(--transition-smooth) var(--transition-spring) !important;
}

.dark .el-tag:hover {
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-md) !important;
}

.dark .el-table {
  background: transparent !important;
  color: var(--text-primary) !important;
}

.dark .el-table th {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(10px) !important;
  border-bottom: 1px solid var(--glass-border) !important;
  color: var(--text-secondary) !important;
  font-weight: var(--font-semibold) !important;
}

.dark .el-table td {
  background: transparent !important;
  border-bottom: 1px solid var(--glass-border) !important;
  color: var(--text-primary) !important;
}

.dark .el-table tr:hover td {
  background: rgba(255, 255, 255, 0.05) !important;
}

.dark .el-dialog {
  background: var(--gradient-surface) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--radius-xl) !important;
  box-shadow: var(--shadow-premium-lg) !important;
}

.dark .el-dialog__header {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(10px) !important;
  border-bottom: 1px solid var(--glass-border) !important;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0 !important;
}

.dark .el-dialog__title {
  color: var(--text-primary) !important;
  font-weight: var(--font-semibold) !important;
}

.dark .el-dialog__body {
  background: transparent !important;
  color: var(--text-primary) !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .strategy-list-container {
    padding: 10px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .stats-section .el-col {
    margin-bottom: 16px;
  }

  .strategy-content {
    flex-direction: column;
    gap: 16px;
  }

  .strategy-actions {
    justify-content: flex-start;
  }

  .filter-form {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
