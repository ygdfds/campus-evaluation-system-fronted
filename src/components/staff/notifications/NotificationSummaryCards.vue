<script setup>
defineOptions({ name: 'NotificationSummaryCards' })

defineProps({
  summary: { type: Object, default: () => ({}) },
  activeFilter: { type: String, default: 'all' },
})

const emit = defineEmits(['filter-change'])

const items = [
  { key: 'all', label: '全部消息', countKey: 'total', color: '' },
  { key: 'unread', label: '未读消息', countKey: 'unread', color: 'danger' },
  { key: 'todo', label: '待办提醒', countKey: 'todo', color: 'warning' },
  { key: 'business', label: '业务通知', countKey: 'business', color: '' },
  { key: 'system', label: '系统通知', countKey: 'system', color: '' },
  { key: 'urgent', label: '紧急消息', countKey: 'urgent', color: 'danger' },
]
</script>

<template>
  <div class="summary-cards">
    <div
      v-for="item in items"
      :key="item.key"
      class="summary-card"
      :class="{
        active: activeFilter === item.key,
        highlight: item.key === 'unread' || item.key === 'urgent',
      }"
      @click="emit('filter-change', item.key)"
    >
      <span class="card-count">{{ summary[item.countKey] ?? 0 }}</span>
      <span class="card-label">{{ item.label }}</span>
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

.summary-card.highlight .card-count {
  color: var(--color-danger);
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
