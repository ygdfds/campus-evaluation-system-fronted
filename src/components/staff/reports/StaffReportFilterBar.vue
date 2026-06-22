<script setup>
defineOptions({ name: 'StaffReportFilterBar' })

const props = defineProps({
  filters: { type: Object, required: true },
})

const emit = defineEmits(['update:filters', 'reset'])

const timeOptions = [
  { value: 'all', label: '全部时间' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'semester', label: '本学期' },
  { value: 'custom', label: '自定义' },
]

const evalTypeOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'teaching', label: '教学评价' },
  { value: 'service', label: '服务评价' },
  { value: 'instant', label: '即时评价' },
]

const targetTypeOptions = [
  { value: 'all', label: '全部对象' },
  { value: 'course', label: '课程/教师' },
  { value: 'service_item', label: '服务项目' },
]

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'open', label: '评价中' },
  { value: 'closed', label: '已结束' },
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
        <label class="filter-label">类型</label>
        <el-select :model-value="filters.evalType" size="default" @change="v => handleChange('evalType', v)">
          <el-option v-for="opt in evalTypeOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
        </el-select>
      </div>
      <div class="filter-item">
        <label class="filter-label">对象</label>
        <el-select :model-value="filters.targetType" size="default" @change="v => handleChange('targetType', v)">
          <el-option v-for="opt in targetTypeOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
        </el-select>
      </div>
      <div class="filter-item">
        <label class="filter-label">状态</label>
        <el-select :model-value="filters.windowStatus" size="default" @change="v => handleChange('windowStatus', v)">
          <el-option v-for="opt in statusOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
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

.filter-label {
  font-size: var(--font-sm);
  color: var(--color-text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.filter-item :deep(.el-select) {
  width: 130px;
}

.filter-item :deep(.el-date-editor) {
  width: 150px;
}

.reset-btn {
  margin-left: auto;
  flex-shrink: 0;
}
</style>
