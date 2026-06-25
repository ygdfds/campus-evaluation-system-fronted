<script setup>


defineOptions({ name: 'StaffFormStatusCards' })

defineProps({
  stats: { type: Object, default: () => ({ draft: 0, pending_review: 0, published: 0, rejected: 0, closed: 0 }) },
  activeStatus: { type: String, default: 'all' },
})

defineEmits(['status-change'])

const statusItems = [
  { key: 'draft', label: '草稿', color: 'info' },
  { key: 'pending_review', label: '待审核', color: 'warning' },
  { key: 'published', label: '已发布', color: 'success' },
  { key: 'rejected', label: '已驳回', color: 'danger' },
  { key: 'closed', label: '已关闭', color: '' },
]
</script>

<template>
  <div class="stats-strip">
    <div
      v-for="item in statusItems"
      :key="item.key"
      class="strip-item"
      :class="{ active: activeStatus === item.key }"
      @click="$emit('status-change', activeStatus === item.key ? 'all' : item.key)"
    >
      <span class="strip-value">{{ stats[item.key] || 0 }}</span>
      <span class="strip-label">{{ item.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.stats-strip {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
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

.strip-item.active {
  background: var(--color-primary-50);
}

.strip-item.active::before {
  background: var(--color-primary);
}

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
