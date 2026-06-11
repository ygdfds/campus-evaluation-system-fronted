<script setup>
defineOptions({ name: 'StatCard' })

defineProps({
  /** 标题 */
  title: { type: String, required: true },
  /** 数值 */
  value: { type: [String, Number], default: 0 },
  /** 图标组件 */
  icon: { type: [Object, String], default: null },
  /** 颜色主题: primary / success / warning / danger / info */
  color: { type: String, default: 'primary' },
  /** 描述文字 */
  description: { type: String, default: '' },
})

const colorMap = {
  primary: { bg: 'var(--color-primary-50)', text: 'var(--color-primary-500)' },
  success: { bg: 'var(--color-success-light)', text: 'var(--color-success)' },
  warning: { bg: 'var(--color-warning-light)', text: 'var(--color-warning)' },
  danger: { bg: 'var(--color-danger-light)', text: 'var(--color-danger)' },
  info: { bg: 'var(--color-info-light)', text: 'var(--color-info)' },
}
</script>

<template>
  <div class="stat-card">
    <div class="stat-icon" :style="{ background: colorMap[color]?.bg, color: colorMap[color]?.text }">
      <el-icon v-if="icon" :size="24"><component :is="icon" /></el-icon>
    </div>
    <div class="stat-content">
      <div class="stat-value">{{ value }}</div>
      <div class="stat-title">{{ title }}</div>
      <div v-if="description" class="stat-desc">{{ description }}</div>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.2s;
}

.stat-card:hover {
  box-shadow: var(--shadow-lg);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-value {
  font-size: var(--font-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
}

.stat-title {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  margin-top: var(--space-1);
}

.stat-desc {
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
  margin-top: var(--space-1);
}
</style>
