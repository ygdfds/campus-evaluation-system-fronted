<script setup>
import { computed } from 'vue'
import FeedbackProcessTimeline from './FeedbackProcessTimeline.vue'

defineOptions({ name: 'StaffFeedbackDetailDrawer' })

const props = defineProps({
  visible: { type: Boolean, default: false },
  detail: { type: Object, default: () => ({}) },
  processRecords: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

defineEmits(['update:visible', 'action'])

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
  high: { label: '高优先级', type: 'danger' },
  normal: { label: '中优先级', type: 'info' },
  low: { label: '低优先级', type: '' },
}

const canProcess = computed(() => {
  const s = props.detail?.status
  return s === 'pending' || s === 'processing'
})

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
  <el-drawer
    :model-value="visible"
    title="反馈详情"
    size="640px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
  >
    <div v-loading="loading" class="drawer-content">
      <!-- 顶部信息 -->
      <div class="detail-header">
        <h3 class="detail-title">{{ detail.title }}</h3>
        <div class="detail-tags">
          <el-tag :type="statusMap[detail.status]?.type || 'info'" effect="light">
            {{ statusMap[detail.status]?.label || detail.status }}
          </el-tag>
          <el-tag :type="typeMap[detail.complaint_type]?.type || 'info'" size="small" effect="light">
            {{ typeMap[detail.complaint_type]?.label || detail.complaint_type }}
          </el-tag>
          <el-tag v-if="detail.priority" :type="priorityMap[detail.priority]?.type" size="small" effect="plain">
            {{ priorityMap[detail.priority]?.label }}
          </el-tag>
        </div>
        <div class="detail-time">提交时间：{{ formatTime(detail.created_at) }}</div>
      </div>

      <!-- 反馈对象 -->
      <div class="detail-section">
        <h4 class="section-title">反馈对象</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">对象类型</span>
            <span class="info-value">{{ targetMap[detail.target_type] || detail.target_type || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">反馈对象</span>
            <span class="info-value">{{ detail._target_name || '未指定对象' }}</span>
          </div>
          <div v-if="detail._org_name" class="info-item">
            <span class="info-label">所属组织</span>
            <span class="info-value">{{ detail._org_name }}</span>
          </div>
        </div>
      </div>

      <!-- 提交人信息 -->
      <div class="detail-section">
        <h4 class="section-title">提交人</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">身份</span>
            <span class="info-value">{{ detail.anonymous_to_handler ? '匿名学生' : '学生用户' }}</span>
          </div>
        </div>
      </div>

      <!-- 内容描述 -->
      <div class="detail-section">
        <h4 class="section-title">内容描述</h4>
        <div class="content-text">{{ detail.content || '暂无内容' }}</div>
      </div>

      <!-- 附件 -->
      <div v-if="detail.attachment_file_ids?.length" class="detail-section">
        <h4 class="section-title">附件（{{ detail.attachment_file_ids.length }}）</h4>
        <div class="attachment-list">
          <div v-for="fileId in detail.attachment_file_ids" :key="fileId" class="attachment-item">
            <el-icon :size="16"><Document /></el-icon>
            <span>文件 #{{ fileId }}</span>
          </div>
        </div>
      </div>

      <!-- 处理时间线 -->
      <div class="detail-section">
        <h4 class="section-title">处理记录</h4>
        <FeedbackProcessTimeline :records="processRecords" />
      </div>

      <!-- 操作按钮 -->
      <div v-if="canProcess" class="detail-actions">
        <template v-if="detail.status === 'pending'">
          <el-button type="primary" @click="$emit('action', 'accept')">受理</el-button>
          <el-button @click="$emit('action', 'transfer')">转交</el-button>
          <el-button type="danger" plain @click="$emit('action', 'reject')">驳回</el-button>
        </template>
        <template v-if="detail.status === 'processing'">
          <el-button type="primary" @click="$emit('action', 'progress')">更新进度</el-button>
          <el-button @click="$emit('action', 'transfer')">转交</el-button>
          <el-button type="success" @click="$emit('action', 'resolve')">办结</el-button>
          <el-button type="danger" plain @click="$emit('action', 'reject')">驳回</el-button>
        </template>
      </div>
      <div v-else class="detail-readonly">
        <el-tag type="info" effect="plain">当前状态为只读</el-tag>
      </div>

      <!-- 底部关闭按钮 -->
      <div class="detail-footer">
        <el-button @click="$emit('update:visible', false)">关闭</el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script>
import { Document } from '@element-plus/icons-vue'
export default { components: { Document } }
</script>

<style scoped>
.drawer-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.detail-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.detail-title {
  font-size: var(--font-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: var(--line-height-tight);
}

.detail-tags {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.detail-time {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
}

.detail-section {
  border-top: 1px solid var(--color-border-light);
  padding-top: var(--space-4);
}

.section-title {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-3);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
}

.info-value {
  font-size: var(--font-sm);
  color: var(--color-text-primary);
}

.content-text {
  font-size: var(--font-sm);
  color: var(--color-text-primary);
  line-height: var(--line-height-relaxed);
  white-space: pre-wrap;
  word-break: break-word;
  background: var(--color-bg-secondary);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
}

.detail-actions {
  display: flex;
  gap: var(--space-3);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-light);
}

.detail-readonly {
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-light);
}

.detail-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-light);
}
</style>
