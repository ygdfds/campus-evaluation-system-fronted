<script setup>
import { Search, RefreshRight } from '@element-plus/icons-vue'

defineOptions({ name: 'StaffFormFilterBar' })

const props = defineProps({
  filters: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:filters', 'reset'])

const typeOptions = [
  { label: '全部类型', value: 'all' },
  { label: '教学评价', value: 'teaching' },
  { label: '后勤服务评价', value: 'service' },
  { label: '即时评价', value: 'instant' },
]

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '草稿', value: 'draft' },
  { label: '待审核', value: 'pending_review' },
  { label: '已发布', value: 'published' },
  { label: '已驳回', value: 'rejected' },
  { label: '已关闭', value: 'closed' },
]

const targetOptions = [
  { label: '全部对象', value: 'all' },
  { label: '课程/教师', value: 'course_teacher' },
  { label: '服务项目', value: 'service_item' },
  { label: '服务部门', value: 'service_org' },
]

const sortOptions = [
  { label: '最近更新', value: 'latest_update' },
  { label: '最新创建', value: 'latest_create' },
  { label: '窗口截止', value: 'window_end' },
  { label: '状态优先', value: 'status_priority' },
]

function updateFilter(key, value) {
  emit('update:filters', { ...props.filters, [key]: value })
}
</script>

<template>
  <div class="filter-bar">
    <div class="filter-row">
      <el-input
        :model-value="filters.keyword"
        placeholder="搜索表单名称、描述..."
        :prefix-icon="Search"
        clearable
        class="filter-search"
        @update:model-value="updateFilter('keyword', $event)"
      />
      <el-select
        :model-value="filters.type"
        placeholder="表单类型"
        class="filter-select"
        @update:model-value="updateFilter('type', $event)"
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
        placeholder="评价对象"
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
      <el-button :icon="RefreshRight" @click="emit('reset')">重置</el-button>
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
  width: 240px;
}

.filter-select {
  width: 140px;
}
</style>
