<script setup>
import { Clock, WarningFilled } from '@element-plus/icons-vue'
import { computed } from 'vue'
import CoverImage from '@/components/common/CoverImage.vue'

defineOptions({ name: 'EvaluationTaskCard' })

const props = defineProps({
  /** 评价任务数据 */
  task: { type: Object, required: true },
})

defineEmits(['click'])

const actionConfig = computed(() => {
  const map = {
    '待评价': { label: '去评价', type: 'primary', plain: false },
    '进行中': { label: '继续填写', type: 'primary', plain: false },
    '已完成': { label: '查看详情', type: 'default', plain: true },
    '可修改': { label: '修改评价', type: 'warning', plain: false },
    '已截止': { label: '已截止', type: 'info', plain: true },
    '未开始': { label: '查看详情', type: 'info', plain: true },
  }
  return map[props.task.status] || { label: '查看', type: 'default', plain: true }
})

/** 是否即将截止（3天内） */
const isUrgent = computed(() => {
  if (!props.task.endDate) return false
  const end = new Date(props.task.endDate.replace(/^(\d{2})-(\d{2})$/, '2026-$1-$2'))
  if (isNaN(end.getTime())) return false
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000
})
</script>

<template>
  <div class="eval-card" @click="$emit('click', task)">
    <CoverImage
      :src="task.img"
      :alt="task.title"
      width="160px"
      height="96px"
      radius="var(--radius-md)"
      class="eval-cover"
    />
    <div class="eval-body">
      <h4 class="eval-title">{{ task.title }}</h4>
      <div class="eval-meta">
        <span class="meta-dept">{{ task.dept }}</span>
        <span class="meta-sep">·</span>
        <span class="meta-target">{{ task.target }}</span>
      </div>
      <div class="eval-time">
        <el-icon :size="12"><Clock /></el-icon>
        <span>{{ task.startDate }} ~ {{ task.endDate }}</span>
        <span v-if="isUrgent && (task.status === '待评价' || task.status === '进行中')" class="urgent-hint">
          <el-icon :size="12"><WarningFilled /></el-icon>
          即将截止
        </span>
      </div>
    </div>
    <div class="eval-action">
      <el-tag size="small" effect="plain" class="action-type-tag">{{ task.type }}</el-tag>
      <el-tag :type="task.statusType" size="small" effect="plain">{{ task.status }}</el-tag>
      <el-button
        :type="actionConfig.type"
        :plain="actionConfig.plain"
        size="small"
        class="eval-action-btn"
        @click.stop="$emit('click', task)"
      >
        {{ actionConfig.label }}
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.eval-card {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-4) var(--space-5);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 128px;
}

.eval-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary-100);
}

.eval-cover {
  flex-shrink: 0;
}

.eval-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
  justify-content: center;
}

.eval-title {
  font-size: var(--font-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-heading);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: var(--line-height-tight);
}

.eval-meta {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-sm);
  color: var(--color-text-muted);
}

.meta-sep {
  color: var(--color-text-placeholder);
}

.eval-time {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
}

.urgent-hint {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--color-warning);
  font-weight: var(--font-weight-semibold);
  margin-left: var(--space-2);
}

.eval-action {
  width: 150px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: var(--space-2);
}

.action-type-tag {
  align-self: flex-end;
}

.eval-action :deep(.el-tag) {
  align-self: flex-end;
}

.eval-action-btn {
  width: 100%;
}
</style>
