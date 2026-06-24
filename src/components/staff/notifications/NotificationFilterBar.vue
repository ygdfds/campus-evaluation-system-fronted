<script setup>
import { NOTIFICATION_TYPE_MAP, NOTIFICATION_BIZ_TYPE_MAP, NOTIFICATION_PRIORITY_MAP } from '@/api/staffNotifications'

defineOptions({ name: 'NotificationFilterBar' })

const props = defineProps({
  filters: { type: Object, required: true },
})

const emit = defineEmits(['update:filters', 'reset'])

const typeOptions = [
  { value: 'all', label: '全部类型' },
  ...Object.entries(NOTIFICATION_TYPE_MAP).map(([value, label]) => ({ value, label })),
]

const bizTypeOptions = [
  { value: 'all', label: '全部来源' },
  ...Object.entries(NOTIFICATION_BIZ_TYPE_MAP).map(([value, label]) => ({ value, label })),
]

const readStatusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'unread', label: '未读' },
  { value: 'read', label: '已读' },
]

const priorityOptions = [
  { value: 'all', label: '全部优先级' },
  ...Object.entries(NOTIFICATION_PRIORITY_MAP).map(([value, label]) => ({ value, label })),
]

const timeOptions = [
  { value: 'all', label: '全部时间' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'custom', label: '自定义' },
]

const sortOptions = [
  { value: 'latest', label: '最新消息' },
  { value: 'unread_first', label: '未读优先' },
  { value: 'priority', label: '优先级最高' },
  { value: 'latest_update', label: '最近更新' },
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
          placeholder="搜索标题、内容"
          size="default"
          clearable
          @input="v => handleChange('keyword', v)"
        />
      </div>
      <div class="filter-item">
        <label class="filter-label">类型</label>
        <el-select :model-value="filters.type" size="default" @change="v => handleChange('type', v)">
          <el-option v-for="opt in typeOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
        </el-select>
      </div>
      <div class="filter-item">
        <label class="filter-label">来源</label>
        <el-select :model-value="filters.businessType" size="default" @change="v => handleChange('businessType', v)">
          <el-option v-for="opt in bizTypeOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
        </el-select>
      </div>
      <div class="filter-item">
        <label class="filter-label">状态</label>
        <el-select :model-value="filters.readStatus" size="default" @change="v => handleChange('readStatus', v)">
          <el-option v-for="opt in readStatusOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
        </el-select>
      </div>
      <div class="filter-item">
        <label class="filter-label">优先级</label>
        <el-select :model-value="filters.priority" size="default" @change="v => handleChange('priority', v)">
          <el-option v-for="opt in priorityOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
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
