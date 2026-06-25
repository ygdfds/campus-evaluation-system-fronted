<script setup>
import { APPEAL_STATUS_MAP } from '@/api/staffAppeals'

defineOptions({ name: 'AppealSummaryCards' })

defineProps({
  summary: { type: Object, default: () => ({}) },
  activeStatus: { type: String, default: 'all' },
})

const emit = defineEmits(['status-change'])

const statusItems = [
  { key: 'all', label: '全部申诉', color: '' },
  { key: 'pending', label: '待受理', color: 'warning' },
  { key: 'processing', label: '处理中', color: '' },
  { key: 'waiting_trace_auth', label: '待追溯授权', color: 'danger' },
  { key: 'resolved', label: '已办结', color: 'success' },
  { key: 'rejected', label: '已驳回', color: 'danger' },
]
</script>

<template>
  <div class="stats-strip">
    <div
      v-for="item in statusItems"
      :key="item.key"
      class="strip-item"
      :class="{ active: activeStatus === item.key }"
      @click="emit('status-change', item.key)"
    >
      <span class="strip-value">{{ item.key === 'all' ? (summary.total ?? 0) : (summary[item.key] ?? 0) }}</span>
      <span class="strip-label">{{ APPEAL_STATUS_MAP[item.key] || item.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.stats-strip {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  padding: 0;
  background: var(--color-border-lighter);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.strip-item {
  min-height: 72px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--color-bg-card);
  position: relative;
  cursor: pointer;
  transition: background 0.16s;
}

.strip-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 18px;
  bottom: 18px;
  width: 3px;
  border-radius: var(--radius-full);
  background: var(--color-border-light);
}

.strip-item:hover { background: var(--color-bg-page); }

.strip-item.active { background: var(--color-primary-50); }
.strip-item.active::before { background: var(--color-primary); }

.strip-value {
  font-family: var(--font-family-data);
  font-size: 24px;
  font-weight: var(--font-weight-bold);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-heading);
}

.strip-label {
  color: var(--color-text-secondary);
  font-size: var(--font-xs);
}

@media (max-width: 900px) {
  .stats-strip { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
</style>
