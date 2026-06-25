<script setup>
import { computed, ref, watch } from 'vue'

defineOptions({ name: 'CoverImage' })

const props = defineProps({
  /** 图片 URL */
  src: { type: String, default: '' },
  /** 替代文字 */
  alt: { type: String, default: '' },
  /** 宽度 */
  width: { type: String, default: '100%' },
  /** 高度 */
  height: { type: String, default: '100%' },
  /** 统一尺寸（同时设置宽高） */
  size: { type: [Number, String], default: null },
  /** 圆角 */
  radius: { type: String, default: '0' },
  /** object-fit */
  fit: { type: String, default: 'cover' },
})

const resolvedWidth = computed(() => (props.size != null ? `${props.size}px` : props.width))
const resolvedHeight = computed(() => (props.size != null ? `${props.size}px` : props.height))

const imageFailed = ref(false)
const displaySrc = computed(() => (props.src && !imageFailed.value ? props.src : ''))

watch(
  () => props.src,
  () => {
    imageFailed.value = false
  },
)

function handleImageError() {
  imageFailed.value = true
}
</script>

<template>
  <div class="cover-image" :style="{ width: resolvedWidth, height: resolvedHeight, borderRadius: radius }">
    <img
      v-if="displaySrc"
      :src="displaySrc"
      :alt="alt"
      :style="{ objectFit: fit }"
      @error="handleImageError"
    />
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
