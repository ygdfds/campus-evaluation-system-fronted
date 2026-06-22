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
  <div class="summary-cards">
    <div
      v-for="item in statusItems"
      :key="item.key"
      class="summary-card"
      :class="{ active: activeStatus === item.key }"
      @click="emit('status-change', item.key)"
    >
      <span class="card-count">{{ item.key === 'all' ? (summary.total ?? 0) : (summary[item.key] ?? 0) }}</span>
      <span class="card-label">{{ APPEAL_STATUS_MAP[item.key] || item.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.summary-cards {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--space-3);
}

.summary-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--space-4) var(--space-3);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.summary-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.summary-card.active {
  border-color: var(--color-primary);
  background: var(--color-primary-50);
}

.card-count {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
}

.card-label {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
}

@media (max-width: 900px) {
  .summary-cards { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 600px) {
  .summary-cards { grid-template-columns: repeat(2, 1fr); }
}
</style>
