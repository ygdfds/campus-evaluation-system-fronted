<script setup>
import { View, Edit } from '@element-plus/icons-vue'

defineOptions({ name: 'StaffFeedbackCard' })

defineProps({
  item: { type: Object, required: true },
})

defineEmits(['view', 'process'])

const typeMap = {
  complaint: { label: '投诉', type: 'danger' },
  suggestion: { label: '建议', type: 'primary' },
  inquiry: { label: '咨询', type: 'info' },
  praise: { label: '表扬', type: 'success' },
}

const statusMap = {
  pending: { label: '待处理', type: 'warning' },
  processing: { label: '处理中', type: 'primary' },
  resolved: { label: '已办结', type: 'success' },
  rejected: { label: '已驳回', type: 'danger' },
  cancelled: { label: '已撤销', type: 'info' },
}

const targetMap = {
  teaching: '教学相关',
  logistics: '后勤服务',
  other: '其他',
}

const priorityMap = {
  high: { label: '高', class: 'priority-high' },
  normal: { label: '中', class: 'priority-normal' },
  low: { label: '低', class: 'priority-low' },
}

function formatTime(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<template>
  <div class="feedback-card" @click="$emit('view', item)">
    <div class="card-main">
      <div class="card-header">
        <span class="card-title">{{ item.title }}</span>
        <div class="card-tags">
          <el-tag :type="typeMap[item.complaint_type]?.type || 'info'" size="small" effect="light">
            {{ typeMap[item.complaint_type]?.label || item.complaint_type }}
          </el-tag>
          <el-tag size="small" effect="plain">{{ targetMap[item.target_type] || item.target_type }}</el-tag>
          <span class="target-name">{{ item._target_name || '未指定对象' }}</span>
          <span v-if="item.priority && item.priority !== 'normal'" class="priority-badge" :class="priorityMap[item.priority]?.class">
            {{ priorityMap[item.priority]?.label }}
          </span>
        </div>
      </div>
      <p class="card-content">{{ item.content }}</p>
      <div class="card-meta">
        <span class="meta-item">
          <span class="meta-label">提交人：</span>
          <span>{{ item.anonymous_to_handler ? '匿名学生' : '学生用户' }}</span>
        </span>
        <span v-if="item.attachment_file_ids?.length" class="meta-item">
          附件 {{ item.attachment_file_ids.length }} 份
        </span>
      </div>
    </div>
    <div class="card-side">
      <el-tag :type="statusMap[item.status]?.type || 'info'" size="small" effect="light" class="status-tag">
        {{ statusMap[item.status]?.label || item.status }}
      </el-tag>
      <div class="time-info">
        <div class="time-row">
          <span class="time-label">提交：</span>
          <span>{{ formatTime(item.created_at) }}</span>
        </div>
        <div class="time-row">
          <span class="time-label">更新：</span>
          <span>{{ formatTime(item.updated_at) }}</span>
        </div>
      </div>
      <div class="card-actions" v-if="item.status === 'pending' || item.status === 'processing'">
        <el-button size="small" :icon="View" text @click.stop="$emit('view', item)">详情</el-button>
        <el-button size="small" :icon="Edit" type="primary" text @click.stop="$emit('process', item)">处理</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.feedback-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-5);
  padding: var(--space-5);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.feedback-card:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary-100);
}

.card-main {
  flex: 1;
  min-width: 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.card-title {
  font-size: var(--font-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-tags {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.priority-badge {
  font-size: var(--font-xs);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-medium);
}

.target-name {
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.priority-high { background: var(--color-danger-light); color: var(--color-danger); }
.priority-normal { background: var(--color-info-light); color: var(--color-info); }
.priority-low { background: var(--color-bg-secondary); color: var(--color-text-muted); }

.card-content {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-3);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: var(--line-height-relaxed);
}

.card-meta {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  font-size: var(--font-xs);
  color: var(--color-text-muted);
}

.meta-label {
  color: var(--color-text-placeholder);
}

.card-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
  flex-shrink: 0;
}

.status-tag {
  min-width: 60px;
  text-align: center;
}

.time-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: var(--font-xs);
  color: var(--color-text-muted);
}

.time-label {
  color: var(--color-text-placeholder);
}

.card-actions {
  display: flex;
  gap: var(--space-1);
  margin-top: var(--space-2);
}
</style>
