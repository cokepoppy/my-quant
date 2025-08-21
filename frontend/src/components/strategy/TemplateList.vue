<template>
  <div class="template-list-container">
    <!-- 搜索和过滤 -->
    <div class="filter-section">
      <el-input
        v-model="searchQuery"
        placeholder="搜索策略模板..."
        prefix-icon="search"
        clearable
        @input="handleSearch"
      />
      <el-select
        v-model="selectedCategory"
        placeholder="选择分类"
        clearable
        @change="handleSearch"
      >
        <el-option label="全部分类" value="" />
        <el-option label="趋势策略" value="trend" />
        <el-option label="动量策略" value="momentum" />
        <el-option label="均值回归" value="mean_reversion" />
        <el-option label="套利策略" value="arbitrage" />
        <el-option label="高频交易" value="high_frequency" />
        <el-option label="机器学习" value="machine_learning" />
      </el-select>
      <el-select
        v-model="selectedDifficulty"
        placeholder="选择难度"
        clearable
        @change="handleSearch"
      >
        <el-option label="全部难度" value="" />
        <el-option label="初级" value="beginner" />
        <el-option label="中级" value="intermediate" />
        <el-option label="高级" value="advanced" />
      </el-select>
    </div>

    <!-- 模板列表 -->
    <div v-if="filteredTemplates.length === 0" class="empty-container">
      <el-empty description="暂无符合条件的模板" />
    </div>

    <div v-else class="template-grid">
      <el-card
        v-for="template in filteredTemplates"
        :key="template.id"
        class="template-card"
        @click="selectTemplate(template)"
      >
        <div class="template-header">
          <div class="template-info">
            <h3>{{ template.name }}</h3>
            <div class="template-meta">
              <el-tag size="small" :type="getCategoryType(template.category)">
                {{ getCategoryText(template.category) }}
              </el-tag>
              <el-tag
                size="small"
                :type="getDifficultyType(template.difficulty)"
              >
                {{ getDifficultyText(template.difficulty) }}
              </el-tag>
              <el-tag size="small" type="info">{{ template.language }}</el-tag>
            </div>
          </div>
          <div class="template-rating">
            <el-rate
              v-model="template.rating"
              disabled
              show-score
              text-color="#ff9900"
              score-template="{value}"
            />
          </div>
        </div>

        <div class="template-description">
          {{ template.description }}
        </div>

        <div class="template-parameters">
          <div class="parameter-count">
            <el-icon><setting /></el-icon>
            {{ template.parameters.length }} 个参数
          </div>
          <div class="usage-count">
            <el-icon><user /></el-icon>
            {{ template.usageCount }} 次使用
          </div>
        </div>

        <div class="template-tags">
          <el-tag
            v-for="tag in template.tags"
            :key="tag"
            size="small"
            class="template-tag"
          >
            {{ tag }}
          </el-tag>
        </div>

        <div class="template-footer">
          <div class="template-stats">
            <div class="stat-item">
              <div class="stat-label">创建时间</div>
              <div class="stat-value">{{ formatDate(template.createdAt) }}</div>
            </div>
          </div>
          <el-button
            type="primary"
            size="small"
            @click.stop="selectTemplate(template)"
          >
            使用模板
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="showPreviewDialog"
      title="模板预览"
      width="80%"
      :before-close="closePreview"
    >
      <div v-if="selectedTemplate" class="template-preview">
        <div class="preview-header">
          <h2>{{ selectedTemplate.name }}</h2>
          <div class="preview-meta">
            <el-tag :type="getCategoryType(selectedTemplate.category)">
              {{ getCategoryText(selectedTemplate.category) }}
            </el-tag>
            <el-tag :type="getDifficultyType(selectedTemplate.difficulty)">
              {{ getDifficultyText(selectedTemplate.difficulty) }}
            </el-tag>
            <el-tag type="info">{{ selectedTemplate.language }}</el-tag>
          </div>
        </div>

        <div class="preview-description">
          <h3>策略描述</h3>
          <p>{{ selectedTemplate.description }}</p>
        </div>

        <div class="preview-parameters">
          <h3>策略参数</h3>
          <el-table :data="selectedTemplate.parameters" size="small">
            <el-table-column prop="name" label="参数名" width="120" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="required" label="必填" width="80">
              <template #default="{ row }">
                <el-tag :type="row.required ? 'success' : 'info'" size="small">
                  {{ row.required ? "是" : "否" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="范围" width="120">
              <template #default="{ row }">
                <span
                  v-if="
                    row.type === 'number' &&
                    row.min !== undefined &&
                    row.max !== undefined
                  "
                >
                  {{ row.min }} - {{ row.max }}
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="preview-code">
          <h3>策略代码</h3>
          <el-input
            v-model="selectedTemplate.code"
            type="textarea"
            :rows="15"
            readonly
            class="code-preview"
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="closePreview">关闭</el-button>
        <el-button type="primary" @click="confirmSelectTemplate">
          使用此模板
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Search, Setting, User } from "@element-plus/icons-vue";
import type { StrategyTemplate } from "@/types/strategy";

interface Props {
  templates: StrategyTemplate[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  select: [template: StrategyTemplate];
  cancel: [];
}>();

// 响应式数据
const searchQuery = ref("");
const selectedCategory = ref("");
const selectedDifficulty = ref("");
const showPreviewDialog = ref(false);
const selectedTemplate = ref<StrategyTemplate | null>(null);

// 计算属性
const filteredTemplates = computed(() => {
  let filtered = props.templates;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (template) =>
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some((tag) => tag.toLowerCase().includes(query)),
    );
  }

  if (selectedCategory.value) {
    filtered = filtered.filter(
      (template) => template.category === selectedCategory.value,
    );
  }

  if (selectedDifficulty.value) {
    filtered = filtered.filter(
      (template) => template.difficulty === selectedDifficulty.value,
    );
  }

  return filtered;
});

// 方法
const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
};

const selectTemplate = (template: StrategyTemplate) => {
  selectedTemplate.value = template;
  showPreviewDialog.value = true;
};

const closePreview = () => {
  showPreviewDialog.value = false;
  selectedTemplate.value = null;
};

const confirmSelectTemplate = () => {
  if (selectedTemplate.value) {
    emit("select", selectedTemplate.value);
    closePreview();
  }
};

const getCategoryType = (category: string) => {
  const types: Record<string, string> = {
    trend: "success",
    momentum: "warning",
    mean_reversion: "info",
    arbitrage: "danger",
    high_frequency: "primary",
    machine_learning: "purple",
  };
  return types[category] || "info";
};

const getCategoryText = (category: string) => {
  const texts: Record<string, string> = {
    trend: "趋势策略",
    momentum: "动量策略",
    mean_reversion: "均值回归",
    arbitrage: "套利策略",
    high_frequency: "高频交易",
    machine_learning: "机器学习",
  };
  return texts[category] || category;
};

const getDifficultyType = (difficulty: string) => {
  const types: Record<string, string> = {
    beginner: "success",
    intermediate: "warning",
    advanced: "danger",
  };
  return types[difficulty] || "info";
};

const getDifficultyText = (difficulty: string) => {
  const texts: Record<string, string> = {
    beginner: "初级",
    intermediate: "中级",
    advanced: "高级",
  };
  return texts[difficulty] || difficulty;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("zh-CN");
};

// 生命周期
onMounted(() => {
  // 可以在这里添加一些初始化逻辑
});
</script>

<style scoped>
.template-list-container {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  background: var(--bg-primary);
}

.filter-section {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  background: var(--surface-elevated);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.filter-section .el-input {
  flex: 1;
}

.filter-section .el-select {
  width: 200px;
}

.empty-container {
  padding: 60px 20px;
  text-align: center;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.template-card {
  cursor: pointer;
  transition: all var(--transition-normal) var(--ease-out);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--surface-elevated);
  border: 1px solid var(--border-primary);
  box-shadow: var(--shadow-sm);
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.template-info h3 {
  margin: 0 0 8px 0;
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.template-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.template-rating {
  text-align: right;
}

.template-description {
  color: var(--text-secondary);
  font-size: var(--font-sm);
  line-height: var(--leading-relaxed);
  margin-bottom: 16px;
  min-height: 42px;
}

.template-parameters {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  font-size: var(--font-xs);
  color: var(--text-tertiary);
}

.parameter-count,
.usage-count {
  display: flex;
  align-items: center;
  gap: 4px;
}

.template-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.template-tag {
  margin-right: 0;
}

.template-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--border-primary);
}

.template-stats {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
}

.stat-item .stat-label {
  margin-bottom: 4px;
}

.stat-item .stat-value {
  color: var(--text-secondary);
}

.template-preview {
  max-height: 70vh;
  overflow-y: auto;
}

.preview-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-primary);
}

.preview-header h2 {
  margin: 0 0 12px 0;
  font-size: var(--font-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.preview-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.preview-description {
  margin-bottom: 24px;
}

.preview-description h3 {
  margin: 0 0 8px 0;
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.preview-description p {
  margin: 0;
  color: var(--text-secondary);
  line-height: var(--leading-normal);
}

.preview-parameters {
  margin-bottom: 24px;
}

.preview-parameters h3 {
  margin: 0 0 12px 0;
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.preview-code {
  margin-bottom: 24px;
}

.preview-code h3 {
  margin: 0 0 12px 0;
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.code-preview {
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: var(--font-sm);
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
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

:deep(.el-card__body) {
  padding: 20px;
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

:deep(.el-rate) {
  color: var(--market-volatile);
}

:deep(.el-dialog) {
  background: var(--surface-overlay);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-premium-lg);
}

:deep(.el-dialog__header) {
  background: var(--surface-elevated);
  border-bottom: 1px solid var(--border-primary);
  padding: 20px 24px;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}

:deep(.el-dialog__title) {
  color: var(--text-primary);
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
}

:deep(.el-dialog__body) {
  background: var(--bg-primary);
  padding: 24px;
  color: var(--text-primary);
}

:deep(.el-dialog__footer) {
  background: var(--surface-elevated);
  border-top: 1px solid var(--border-primary);
  padding: 16px 24px;
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
}

:deep(.el-table) {
  background: transparent;
  color: var(--text-primary);
}

:deep(.el-table th) {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-weight: var(--font-semibold);
}

:deep(.el-table td) {
  background: transparent;
  color: var(--text-primary);
}

:deep(.el-table--border) {
  border-color: var(--border-primary);
}

:deep(.el-table--border th, .el-table--border td) {
  border-color: var(--border-primary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .template-list-container {
    padding: 12px;
  }

  .filter-section {
    flex-direction: column;
    gap: 12px;
  }

  .filter-section .el-select {
    width: 100%;
  }

  .template-grid {
    grid-template-columns: 1fr;
  }

  .template-header {
    flex-direction: column;
    gap: 12px;
  }

  .template-rating {
    text-align: left;
  }

  .template-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .preview-meta {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
