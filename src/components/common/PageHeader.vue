<script setup>
defineOptions({ name: 'PageHeader' })

import { computed } from 'vue'

const props = defineProps({
  /** 页面标题 */
  title: { type: String, required: true },
  /** 描述文字 */
  description: { type: String, default: '' },
  /** 页面副标题，兼容既有页面传参 */
  subtitle: { type: String, default: '' },
})

const helperText = computed(() => props.subtitle || props.description)
</script>

<template>
  <div class="page-header">
    <div class="header-info">
      <h2 class="header-title">{{ title }}</h2>
      <p v-if="helperText" class="header-desc">{{ helperText }}</p>
    </div>
    <div class="header-actions">
      <slot name="actions" />
      <slot name="extra" />
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
