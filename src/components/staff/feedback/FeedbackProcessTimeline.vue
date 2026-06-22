<script setup>
defineOptions({ name: 'FeedbackProcessTimeline' })

defineProps({
  records: { type: Array, default: () => [] },
})

const statusLabelMap = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已办结',
  rejected: '已驳回',
  cancelled: '已撤销',
}

const dotClassMap = {
  pending: 'dot-warning',
  processing: 'dot-primary',
  resolved: 'dot-success',
  rejected: 'dot-danger',
  cancelled: 'dot-info',
}

function formatTime(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}
</script>

<template>
  <div class="process-timeline">
    <div v-if="records.length === 0" class="timeline-empty">暂无处理记录</div>
    <div v-else class="timeline-list">
      <div v-for="(record, index) in records" :key="index" class="timeline-item">
        <div class="timeline-dot" :class="dotClassMap[record.to_status] || 'dot-info'" />
        <div class="timeline-content">
          <div class="timeline-header">
            <span v-if="record.from_status" class="status-change">
              {{ statusLabelMap[record.from_status] || record.from_status }}
              <span class="arrow">→</span>
              {{ statusLabelMap[record.to_status] || record.to_status }}
            </span>
            <span v-else class="status-change">
              {{ statusLabelMap[record.to_status] || record.to_status }}
            </span>
            <span class="timeline-time">{{ formatTime(record.created_at) }}</span>
          </div>
          <div class="timeline-body">{{ record.content }}</div>
          <div v-if="record.handler_id" class="timeline-handler">处理人：工作人员 #{{ record.handler_id }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.process-timeline {
  padding: var(--space-2) 0;
}

.timeline-empty {
  text-align: center;
  padding: var(--space-6) 0;
  color: var(--color-text-muted);
  font-size: var(--font-sm);
}

.timeline-list {
  position: relative;
  padding-left: var(--space-6);
}

.timeline-list::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: var(--color-border-light);
}

.timeline-item {
  position: relative;
  padding-bottom: var(--space-5);
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: calc(-1 * var(--space-6) + 3px);
  top: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--color-bg-card);
}

.dot-warning { background: var(--color-warning); }
.dot-primary { background: var(--color-accent-user-700); }
.dot-success { background: var(--color-success); }
.dot-danger { background: var(--color-danger); }
.dot-info { background: var(--color-info); }

.timeline-content {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
}

.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.status-change {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.arrow {
  margin: 0 var(--space-1);
  color: var(--color-text-muted);
}

.timeline-time {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
}

.timeline-body {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.timeline-handler {
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
  margin-top: var(--space-1);
}
</style>
