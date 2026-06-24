<script setup>
defineOptions({ name: 'AdminActionButton' })

defineProps({
  action: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'warning', 'danger', 'muted'].includes(value),
  },
  variant: {
    type: String,
    default: 'text',
    validator: (value) => ['text', 'subtle'].includes(value),
  },
})
</script>

<template>
  <el-button
    class="admin-action-button"
    :class="[`is-${action}`, `is-${variant}`]"
    size="small"
    :link="variant === 'text'"
  >
    <slot />
  </el-button>
</template>

<style scoped>
.admin-action-button {
  --action-color: var(--color-primary-500);
  --action-hover-color: var(--color-primary-600);

  min-width: var(--space-10);
  padding: var(--space-1) var(--space-2);
  color: var(--action-color);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-sm);
}

.admin-action-button:hover,
.admin-action-button:focus {
  color: var(--action-hover-color);
}

.admin-action-button.is-warning {
  --action-color: var(--color-warning);
  --action-hover-color: var(--color-warning);
}

.admin-action-button.is-danger {
  --action-color: var(--color-danger);
  --action-hover-color: var(--color-danger);
}

.admin-action-button.is-muted {
  --action-color: var(--color-text-secondary);
  --action-hover-color: var(--color-text-primary);
}

.admin-action-button.is-subtle {
  border-color: var(--color-border);
  background: var(--color-bg-card);
}

.admin-action-button.is-subtle:hover,
.admin-action-button.is-subtle:focus {
  border-color: var(--action-hover-color);
  background: var(--color-bg-primary-hover);
}
</style>
