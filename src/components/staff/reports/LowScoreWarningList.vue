<script setup>
import { ArrowRight } from '@element-plus/icons-vue'

defineOptions({ name: 'LowScoreWarningList' })

defineProps({
  warnings: { type: Array, default: () => [] },
})

const emit = defineEmits(['view-detail'])

const typeMap = { teaching: '教学', service: '服务', instant: '即时', other: '其他' }

function formatTime(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <div class="warning-card">
    <div class="warning-header">
      <h4 class="card-title">
        低分预警
        <span v-if="warnings.length" class="warning-badge">{{ warnings.length }}</span>
      </h4>
    </div>
    <div v-if="warnings.length === 0" class="empty-state-compact">
      <span class="empty-title">暂无低分预警</span>
      <span class="empty-sub">当前筛选范围内暂无需重点关注的评价对象</span>
    </div>
    <div v-else class="warning-list">
      <div
        v-for="item in warnings"
        :key="item.id"
        class="warning-row"
        @click="emit('view-detail', { targetType: item.targetType, targetId: item.targetId })"
      >
        <div class="warning-main">
          <span class="warning-name">{{ item.name }}</span>
          <el-tag size="small" effect="plain" color="#fef0f0" style="color: var(--color-danger); border-color: #fde2e2;">{{ typeMap[item.evalType] || '其他' }}</el-tag>
        </div>
        <div class="warning-detail">
          <span class="warning-form">{{ item.formTitle }}</span>
          <span class="warning-reason">{{ item.reasonSummary }}</span>
        </div>
        <div class="warning-meta">
          <span class="warning-score" :class="{ 'is-critical': item.avgScore < 2 }">{{ item.avgScore }}</span>
          <span class="warning-low-count">{{ item.lowCount > 0 ? item.lowCount + ' 条低分' : '平均分偏低' }}</span>
          <span class="warning-time">{{ formatTime(item.submittedAt) }}</span>
        </div>
        <el-icon class="warning-arrow" :size="14"><ArrowRight /></el-icon>
      </div>
    </div>
  </div>
</template>

<style scoped>
.warning-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-5);
}

.warning-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.card-title {
  font-size: var(--font-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.warning-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #fef0f0;
  color: var(--color-danger);
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-full);
}

.empty-hint {
  text-align: center;
  padding: var(--space-4) 0;
  color: var(--color-text-muted);
  font-size: var(--font-sm);
}

.empty-state-compact {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: var(--space-5) 0;
}

.empty-state-compact .empty-title {
  font-size: var(--font-sm);
  color: var(--color-text-muted);
}

.empty-state-compact .empty-sub {
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
}

.warning-list { display: flex; flex-direction: column; }

.warning-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-bottom: var(--border-lighter);
  cursor: pointer;
  transition: background 0.15s;
  border-radius: var(--radius-md);
}

.warning-row:last-child { border-bottom: none; }
.warning-row:hover { background: var(--color-bg-primary-hover); }

.warning-main {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
  width: 160px;
}

.warning-name {
  font-size: var(--font-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-heading);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.warning-detail {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.warning-form {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
}

.warning-reason {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.warning-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

.warning-score {
  font-size: var(--font-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-danger);
}

.warning-score.is-critical { color: var(--color-danger); }

.warning-low-count {
  font-size: var(--font-xs);
  color: var(--color-danger);
}

.warning-time {
  font-size: var(--font-xs);
  color: var(--color-text-muted-light);
}

.warning-arrow {
  color: var(--color-text-placeholder);
  flex-shrink: 0;
}
</style>
