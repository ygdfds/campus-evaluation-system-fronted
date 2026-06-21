<script setup>
import { Search, RefreshRight } from '@element-plus/icons-vue'

defineOptions({ name: 'StaffFeedbackFilterBar' })

const props = defineProps({
  filters: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:filters', 'reset'])

const typeOptions = [
  { label: '全部类型', value: 'all' },
  { label: '投诉', value: 'complaint' },
  { label: '建议', value: 'suggestion' },
  { label: '咨询', value: 'inquiry' },
  { label: '表扬', value: 'praise' },
]

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '待处理', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '已办结', value: 'resolved' },
  { label: '已驳回', value: 'rejected' },
]

const targetOptions = [
  { label: '全部对象', value: 'all' },
  { label: '教学相关', value: 'teaching' },
  { label: '后勤服务', value: 'logistics' },
  { label: '其他', value: 'other' },
]

const sortOptions = [
  { label: '最新提交', value: 'latest_submit' },
  { label: '最近更新', value: 'latest_update' },
  { label: '优先级', value: 'priority' },
  { label: '状态优先', value: 'status_priority' },
]

function updateFilter(key, value) {
  emit('update:filters', { ...props.filters, [key]: value })
}

function handleReset() {
  emit('reset')
}
</script>

<template>
  <div class="filter-bar">
    <div class="filter-row">
      <el-input
        :model-value="filters.keyword"
        placeholder="搜索标题、内容..."
        :prefix-icon="Search"
        clearable
        class="filter-search"
        @update:model-value="updateFilter('keyword', $event)"
      />
      <el-select
        :model-value="filters.complaintType"
        placeholder="反馈类型"
        class="filter-select"
        @update:model-value="updateFilter('complaintType', $event)"
      >
        <el-option v-for="opt in typeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      <el-select
        :model-value="filters.status"
        placeholder="状态"
        class="filter-select"
        @update:model-value="updateFilter('status', $event)"
      >
        <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      <el-select
        :model-value="filters.targetType"
        placeholder="对象类型"
        class="filter-select"
        @update:model-value="updateFilter('targetType', $event)"
      >
        <el-option v-for="opt in targetOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      <el-select
        :model-value="filters.sort"
        placeholder="排序"
        class="filter-select"
        @update:model-value="updateFilter('sort', $event)"
      >
        <el-option v-for="opt in sortOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: var(--space-4) var(--space-5);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.filter-search {
  width: 260px;
}

.filter-select {
  width: 140px;
}
</style>
