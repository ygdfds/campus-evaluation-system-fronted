<script setup>
import { APPEAL_STATUS_MAP, APPEAL_TYPE_MAP } from '@/api/staffAppeals'

defineOptions({ name: 'AppealFilterBar' })

const props = defineProps({
  filters: { type: Object, required: true },
})

const emit = defineEmits(['update:filters', 'reset'])

const statusOptions = [
  { value: 'all', label: '全部状态' },
  ...Object.entries(APPEAL_STATUS_MAP).map(([value, label]) => ({ value, label })),
]

const typeOptions = [
  { value: 'all', label: '全部类型' },
  ...Object.entries(APPEAL_TYPE_MAP).map(([value, label]) => ({ value, label })),
]

const targetOptions = [
  { value: 'all', label: '全部对象' },
  { value: 'teaching', label: '教学评价' },
  { value: 'service', label: '服务评价' },
]

const timeOptions = [
  { value: 'all', label: '全部时间' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'custom', label: '自定义' },
]

const sortOptions = [
  { value: 'latest_submit', label: '最新提交' },
  { value: 'latest_update', label: '最近更新' },
  { value: 'priority', label: '优先级' },
]

function handleChange(key, value) {
  emit('update:filters', { ...props.filters, [key]: value })
}

function handleReset() {
  emit('reset')
}
</script>

<template>
  <div class="filter-bar">
    <div class="filter-row">
      <div class="filter-item search-item">
        <el-input
          :model-value="filters.keyword"
          placeholder="搜索申诉编号、申诉原因"
          size="default"
          clearable
          @input="v => handleChange('keyword', v)"
        />
      </div>
      <div class="filter-item">
        <label class="filter-label">状态</label>
        <el-select :model-value="filters.status" size="default" @change="v => handleChange('status', v)">
          <el-option v-for="opt in statusOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
        </el-select>
      </div>
      <div class="filter-item">
        <label class="filter-label">类型</label>
        <el-select :model-value="filters.appealType" size="default" @change="v => handleChange('appealType', v)">
          <el-option v-for="opt in typeOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
        </el-select>
      </div>
      <div class="filter-item">
        <label class="filter-label">对象</label>
        <el-select :model-value="filters.targetType" size="default" @change="v => handleChange('targetType', v)">
          <el-option v-for="opt in targetOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
        </el-select>
      </div>
      <div class="filter-item">
        <label class="filter-label">时间</label>
        <el-select :model-value="filters.timeRange" size="default" @change="v => handleChange('timeRange', v)">
          <el-option v-for="opt in timeOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
        </el-select>
      </div>
      <div v-if="filters.timeRange === 'custom'" class="filter-item">
        <el-date-picker
          :model-value="filters.startDate"
          type="date"
          placeholder="开始日期"
          size="default"
          value-format="YYYY-MM-DD"
          @change="v => handleChange('startDate', v)"
        />
      </div>
      <div v-if="filters.timeRange === 'custom'" class="filter-item">
        <el-date-picker
          :model-value="filters.endDate"
          type="date"
          placeholder="结束日期"
          size="default"
          value-format="YYYY-MM-DD"
          @change="v => handleChange('endDate', v)"
        />
      </div>
      <div class="filter-item">
        <label class="filter-label">排序</label>
        <el-select :model-value="filters.sort" size="default" @change="v => handleChange('sort', v)">
          <el-option v-for="opt in sortOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
        </el-select>
      </div>
      <el-button class="reset-btn" @click="handleReset">重置</el-button>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-4) var(--space-5);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.search-item {
  flex: 0 1 220px;
  min-width: 160px;
}

.search-item :deep(.el-input) {
  width: 100%;
}

.filter-label {
  font-size: var(--font-sm);
  color: var(--color-text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.filter-item :deep(.el-select) {
  width: 120px;
}

.filter-item :deep(.el-date-editor) {
  width: 150px;
}

.reset-btn {
  margin-left: auto;
  flex-shrink: 0;
}
</style>
