<script setup>
defineOptions({ name: 'PageSection' })

defineProps({
  title: { type: String, default: '' },
  shadow: { type: String, default: 'hover' },
})
</script>

<template>
  <el-card :shadow="shadow" class="page-section">
    <template v-if="title || $slots.header" #header>
      <slot name="header">
        <span class="section-title">{{ title }}</span>
      </slot>
    </template>
    <slot />
  </el-card>
</template>

<style scoped>
.page-section {
  border-radius: var(--card-section-border-radius);
}

.section-title {
  font-size: var(--font-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}
</style>
