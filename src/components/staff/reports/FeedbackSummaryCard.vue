<script setup>
import { useRouter } from 'vue-router'

defineOptions({ name: 'FeedbackSummaryCard' })

defineProps({
  summary: { type: Object, default: () => ({}) },
})

const router = useRouter()

const statusLabels = { pending: '待处理', processing: '处理中', resolved: '已办结', rejected: '已驳回' }
const statusColors = { pending: 'warning', processing: '', resolved: 'success', rejected: 'danger' }
const typeLabels = { complaint: '投诉', suggestion: '建议', consultation: '咨询', praise: '表扬' }

function formatProcessTime(hours) {
  if (!hours || hours <= 0) return '0小时'
  if (hours < 24) return hours + '小时'
  const days = (hours / 24).toFixed(1)
  return '约' + days + '天'
}

function formatTime(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<template>
  <div class="feedback-area">
    <!-- 状态统计 -->
    <div class="feedback-card">
      <h4 class="card-title">反馈处理统计</h4>
      <div class="status-grid">
        <div v-for="(label, key) in statusLabels" :key="key" class="status-item">
          <span class="status-count">{{ summary.statusStats?.[key] || 0 }}</span>
          <el-tag :type="statusColors[key]" size="small" effect="plain">{{ label }}</el-tag>
        </div>
      </div>
      <div class="type-grid">
        <div v-for="(label, key) in typeLabels" :key="key" class="type-item">
          <span class="type-count">{{ summary.typeStats?.[key] || 0 }}</span>
          <span class="type-label">{{ label }}</span>
        </div>
      </div>
      <div class="efficiency-row">
        <div class="efficiency-item">
          <span class="eff-value">{{ summary.resolveRate || 0 }}%</span>
          <span class="eff-label">办结率</span>
        </div>
        <div class="efficiency-item">
          <span class="eff-value">{{ formatProcessTime(summary.avgProcessHours) }}</span>
          <span class="eff-label">平均处理时长</span>
        </div>
        <div class="efficiency-item">
          <span class="eff-value">{{ summary.total || 0 }}</span>
          <span class="eff-label">总反馈数</span>
        </div>
      </div>
      <div class="eff-note">
        基于已办结反馈计算
        <template v-if="summary.resolvedSampleCount !== undefined">
          （{{ summary.resolvedSampleCount }} 条样本）
        </template>
        <template v-if="summary.resolvedSampleCount !== undefined && summary.resolvedSampleCount < 5">
          ，样本较少，仅供参考
        </template>
      </div>
      <el-button text size="small" class="jump-btn" @click="router.push('/staff/feedback?status=pending')">
        查看待处理反馈 →
      </el-button>
    </div>

    <!-- 最近处理记录 -->
    <div class="feedback-card">
      <h4 class="card-title">最近处理记录</h4>
      <div v-if="!summary.recentRecords?.length" class="empty-hint">暂无处理记录</div>
      <div v-else class="record-list">
        <div v-for="item in summary.recentRecords" :key="item.id" class="record-row">
          <span class="record-action" :class="`action-${item.actionColor}`">{{ item.action }}</span>
          <div class="record-info">
            <span class="record-title">{{ item.title }}</span>
            <span v-if="item.content" class="record-content">{{ item.content }}</span>
          </div>
          <span class="record-time">{{ formatTime(item.time) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.feedback-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.feedback-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-5);
}

.card-title {
  font-size: var(--font-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
  margin: 0 0 var(--space-4);
}

.empty-hint {
  text-align: center;
  padding: var(--space-4) 0;
  color: var(--color-text-muted);
  font-size: var(--font-sm);
}

/* 状态统计 */
.status-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2);
  background: var(--color-bg-page-alt);
  border-radius: var(--radius-md);
}

.status-count {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
}

/* 类型统计 */
.type-grid {
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: var(--border-lighter);
}

.type-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.type-count {
  font-size: var(--font-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-heading);
}

.type-label {
  font-size: var(--font-sm);
  color: var(--color-text-muted);
}

/* 效率 */
.efficiency-row {
  display: flex;
  gap: var(--space-5);
  margin-bottom: var(--space-3);
}

.efficiency-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.eff-value {
  font-size: var(--font-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-accent-user-700);
}

.eff-label {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
}

.eff-note {
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
  margin-bottom: var(--space-3);
}

.jump-btn {
  margin-top: var(--space-2);
}

/* 处理记录 */
.record-list { display: flex; flex-direction: column; }

.record-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-2) 0;
  border-bottom: var(--border-lighter);
}

.record-row:last-child { border-bottom: none; }

.record-action {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  flex-shrink: 0;
  padding: 2px 0;
}

.action-success { color: var(--color-success); }
.action-danger { color: var(--color-danger); }
.action-muted { color: var(--color-text-muted); }

.record-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.record-title {
  font-size: var(--font-sm);
  color: var(--color-text-heading);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-content {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-time {
  font-size: var(--font-xs);
  color: var(--color-text-muted-light);
  flex-shrink: 0;
  white-space: nowrap;
  padding-top: 2px;
}

@media (max-width: 900px) {
  .feedback-area { grid-template-columns: 1fr; }
  .status-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
