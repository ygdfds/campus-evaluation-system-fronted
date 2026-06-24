<script setup>
import { Clock } from '@element-plus/icons-vue'
import CoverImage from '@/components/common/CoverImage.vue'

defineOptions({ name: 'AnnouncementCard' })

defineProps({
  /** 公告数据 { id, title, content, tag, publish_time, cover } */
  item: { type: Object, required: true },
})

defineEmits(['click'])
</script>

<template>
  <div class="announce-card" @click="$emit('click', item)">
    <CoverImage v-if="item.cover" :src="item.cover" :alt="item.title" width="200px" class="card-cover" />
    <div class="card-body">
      <div class="card-top">
        <el-tag size="small" effect="plain">{{ item.tag }}</el-tag>
        <span class="card-time">
          <el-icon :size="12"><Clock /></el-icon>
          {{ item.publish_time }}
        </span>
      </div>
      <h3 class="card-title">{{ item.title }}</h3>
      <p class="card-desc">{{ item.content }}</p>
    </div>
  </div>
</template>

<style scoped>
.announce-card {
  display: flex;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.announce-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.card-cover {
  flex-shrink: 0;
}

.card-cover :deep(img) {
  min-height: 120px;
}

.card-body {
  flex: 1;
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-time {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
}

.card-title {
  font-size: var(--font-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-heading);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-desc {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
