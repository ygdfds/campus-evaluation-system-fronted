<script setup>
defineOptions({ name: 'PageHeader' })

import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  subtitle: { type: String, default: '' },
})

const helperText = computed(() => props.subtitle || props.description)
</script>

<template>
  <header class="page-header">
    <div class="header-info">
      <span class="page-kicker">Evaluation console</span>
      <h2 class="header-title">{{ title }}</h2>
      <p v-if="helperText" class="header-desc">{{ helperText }}</p>
    </div>
    <div class="header-actions">
      <slot name="actions" />
      <slot name="extra" />
    </div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-5);
  padding: 0 0 var(--space-1);
}

.header-info {
  min-width: 0;
}

.header-title {
  margin: 0;
  color: var(--color-text-heading);
  font-family: var(--font-family-display);
  font-size: var(--font-3xl);
  font-weight: var(--font-weight-display);
  line-height: var(--line-height-tight);
  letter-spacing: 0;
}

.header-desc {
  max-width: 760px;
  margin: var(--space-1) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  line-height: var(--line-height-normal);
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
  flex-wrap: wrap;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>