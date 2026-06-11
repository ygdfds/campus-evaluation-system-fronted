<script setup>
defineOptions({ name: 'PageHeader' })

defineProps({
  /** 页面标题 */
  title: { type: String, required: true },
  /** 描述文字 */
  description: { type: String, default: '' },
})
</script>

<template>
  <div class="page-header">
    <div class="header-info">
      <h2 class="header-title">{{ title }}</h2>
      <p v-if="description" class="header-desc">{{ description }}</p>
    </div>
    <div class="header-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
}

.header-title {
  font-size: var(--font-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: var(--line-height-tight);
}

.header-desc {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  margin: var(--space-1) 0 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
</style>
