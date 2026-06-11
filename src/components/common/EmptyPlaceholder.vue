<script setup>
defineOptions({ name: 'EmptyPlaceholder' })

defineProps({
  /** 提示文字 */
  text: { type: String, default: '暂无数据' },
  /** 描述 */
  description: { type: String, default: '' },
})
</script>

<template>
  <div class="empty-placeholder">
    <el-empty :description="text" :image-size="120">
      <slot>
        <p v-if="description" class="empty-desc">{{ description }}</p>
      </slot>
    </el-empty>
  </div>
</template>

<style scoped>
.empty-placeholder {
  padding: var(--space-10) 0;
}

.empty-desc {
  font-size: var(--font-sm);
  color: var(--color-text-placeholder);
}
</style>
