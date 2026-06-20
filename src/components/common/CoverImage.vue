<script setup>
defineOptions({ name: 'CoverImage' })

defineProps({
  /** 图片 URL */
  src: { type: String, default: '' },
  /** 替代文字 */
  alt: { type: String, default: '' },
  /** 宽度 */
  width: { type: String, default: '100%' },
  /** 高度 */
  height: { type: String, default: '100%' },
  /** 圆角 */
  radius: { type: String, default: '0' },
  /** object-fit */
  fit: { type: String, default: 'cover' },
})
</script>

<template>
  <div class="cover-image" :style="{ width, height, borderRadius: radius }">
    <img v-if="src" :src="src" :alt="alt" :style="{ objectFit: fit }" />
    <div v-else class="cover-placeholder">
      <span>{{ alt || '暂无图片' }}</span>
    </div>
  </div>
</template>

<style scoped>
.cover-image {
  overflow: hidden;
  flex-shrink: 0;
}

.cover-image img {
  width: 100%;
  height: 100%;
  display: block;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-light);
  color: var(--color-text-placeholder);
  font-size: var(--font-xs);
}
</style>
