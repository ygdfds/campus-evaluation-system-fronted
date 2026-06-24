<script setup>
defineOptions({ name: 'StaffMetricCard' })

defineProps({
  icon: { type: [Object, String], default: '' },
  iconClass: { type: String, default: '' },
  value: { type: [Number, String], required: true },
  title: { type: String, required: true },
  desc: { type: String, default: '' },
  trend: { type: String, default: '' },
  clickable: { type: Boolean, default: false },
})

defineEmits(['click'])
</script>

<template>
  <div class="metric-card" :class="{ clickable }" @click="$emit('click')">
    <div class="metric-icon" :class="iconClass">
      <el-icon v-if="icon" :size="22"><component :is="icon" /></el-icon>
    </div>
    <div class="metric-body">
      <span class="metric-value">{{ value }}</span>
      <span class="metric-title">{{ title }}</span>
      <span class="metric-desc">{{ desc }}</span>
      <span v-if="trend" class="metric-trend">{{ trend }}</span>
    </div>
  </div>
</template>

<style scoped>
.metric-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
}

.metric-card.clickable {
  cursor: pointer;
}

.metric-card.clickable:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary-100);
}

.metric-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.metric-icon.icon-green { background: var(--color-success-light); color: var(--color-success); }
.metric-icon.icon-blue { background: var(--color-primary-50); color: var(--color-accent-user-700); }
.metric-icon.icon-orange { background: var(--color-warning-light); color: var(--color-warning); }
.metric-icon.icon-red { background: var(--color-danger-light); color: var(--color-danger); }
.metric-icon.icon-gray { background: var(--color-bg-page-alt); color: var(--color-text-muted); }

.metric-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.metric-value {
  font-size: var(--font-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
  line-height: var(--line-height-tight);
}

.metric-title {
  font-size: var(--font-sm);
  color: var(--color-text-body);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.metric-desc {
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.metric-trend {
  font-size: var(--font-xs);
  color: var(--color-success);
}
</style>
