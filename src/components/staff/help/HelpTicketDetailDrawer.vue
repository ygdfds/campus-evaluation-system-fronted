<script setup>
import { computed } from 'vue'
import { Clock, Check, Close, Paperclip } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  ticket: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'close-ticket'])

// 状态映射
const statusMap = {
  pending: { label: '待处理', type: 'warning', icon: Clock },
  processing: { label: '处理中', type: '', icon: Clock },
  replied: { label: '已回复', type: 'success', icon: Check },
  closed: { label: '已关闭', type: 'info', icon: Close },
}

// 分类映射
const categoryMap = {
  permission: '权限与数据',
  evaluation: '评价管理',
  feedback: '反馈处理',
  appeal: '申诉处理',
  notification: '消息通知',
  account: '账号安全',
  system: '系统问题',
}

// 优先级映射
const priorityMap = {
  normal: { label: '普通', type: 'info' },
  urgent: { label: '紧急', type: 'danger' },
}

// 当前状态信息
const currentStatus = computed(() => {
  if (!props.ticket) return statusMap.pending
  return statusMap[props.ticket.status] || statusMap.pending
})

// 当前优先级信息
const currentPriority = computed(() => {
  if (!props.ticket) return priorityMap.normal
  return priorityMap[props.ticket.priority] || priorityMap.normal
})

// 是否可以关闭
const canClose = computed(() => {
  return props.ticket?.status === 'replied'
})

// 格式化时间
function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function handleClose() {
  emit('update:modelValue', false)
}

function handleCloseTicket() {
  if (props.ticket) {
    emit('close-ticket', props.ticket)
  }
}
</script>

<template>
  <el-drawer
    :model-value="modelValue"
    title="工单详情"
    direction="rtl"
    size="560px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="ticket" class="ticket-detail">
      <!-- 工单头部 -->
      <div class="detail-header">
        <div class="detail-title-row">
          <h3 class="detail-title">{{ ticket.title }}</h3>
        </div>
        <div class="detail-meta">
          <span class="ticket-no">{{ ticket.ticket_no }}</span>
          <el-tag :type="currentStatus.type" size="small">
            {{ currentStatus.label }}
          </el-tag>
          <el-tag :type="currentPriority.type" size="small" effect="plain">
            {{ currentPriority.label }}
          </el-tag>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="detail-section">
        <div class="info-row">
          <span class="info-label">问题分类</span>
          <span class="info-value">{{ categoryMap[ticket.category] || ticket.category }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">提交时间</span>
          <span class="info-value">{{ formatTime(ticket.created_at) }}</span>
        </div>
        <div v-if="ticket.status === 'closed'" class="info-row">
          <span class="info-label">关闭时间</span>
          <span class="info-value">{{ formatTime(ticket.updated_at) }}</span>
        </div>
      </div>

      <!-- 问题描述 -->
      <div class="detail-section">
        <h4 class="section-label">问题描述</h4>
        <div class="detail-content">{{ ticket.content }}</div>
      </div>

      <!-- 附件 -->
      <div v-if="ticket.attachment_file_ids && ticket.attachment_file_ids.length > 0" class="detail-section">
        <h4 class="section-label">
          <el-icon :size="14"><Paperclip /></el-icon>
          附件
        </h4>
        <div class="attachment-list">
          <span class="attachment-hint">{{ ticket.attachment_file_ids.length }} 个附件</span>
        </div>
      </div>

      <!-- 回复内容 -->
      <div v-if="ticket.reply_content" class="detail-section reply-section">
        <h4 class="section-label">回复内容</h4>
        <div class="reply-content">{{ ticket.reply_content }}</div>
        <div v-if="ticket.replied_at" class="reply-time">
          回复时间：{{ formatTime(ticket.replied_at) }}
        </div>
      </div>

      <!-- 当前状态说明 -->
      <div class="detail-section status-section">
        <div class="status-info">
          <el-icon :size="16" :class="'status-icon-' + ticket.status">
            <component :is="currentStatus.icon" />
          </el-icon>
          <span>
            <template v-if="ticket.status === 'pending'">工单已提交，等待处理</template>
            <template v-else-if="ticket.status === 'processing'">工单正在处理中，请耐心等待</template>
            <template v-else-if="ticket.status === 'replied'">工单已回复，您可以查看回复内容</template>
            <template v-else-if="ticket.status === 'closed'">工单已关闭</template>
          </span>
        </div>
      </div>
    </div>

    <div v-else class="empty-detail">
      <el-empty description="未选择工单" :image-size="80" />
    </div>

    <template #footer>
      <div class="drawer-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button
          v-if="canClose"
          type="warning"
          plain
          @click="handleCloseTicket"
        >
          关闭工单
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped>
.ticket-detail {
  padding: var(--space-2, 8px) 0;
}

.detail-header {
  margin-bottom: var(--space-5, 20px);
  padding-bottom: var(--space-4, 16px);
  border-bottom: 1px solid var(--color-border-light, #e8ede8);
}

.detail-title-row {
  margin-bottom: var(--space-3, 12px);
}

.detail-title {
  font-size: var(--font-lg, 18px);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-text-heading, #1a2e1a);
  margin: 0;
  line-height: var(--line-height-relaxed, 1.6);
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
}

.ticket-no {
  font-size: var(--font-xs, 12px);
  color: var(--color-text-muted, #6b7c6b);
  font-family: monospace;
}

.detail-section {
  margin-bottom: var(--space-5, 20px);
}

.section-label {
  font-size: var(--font-sm, 14px);
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-text-heading, #1a2e1a);
  margin: 0 0 var(--space-2, 8px) 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2, 8px) 0;
  border-bottom: 1px solid var(--color-border-lighter, #f0f4f0);
}

.info-label {
  font-size: var(--font-sm, 14px);
  color: var(--color-text-muted, #6b7c6b);
}

.info-value {
  font-size: var(--font-sm, 14px);
  color: var(--color-text-heading, #1a2e1a);
}

.detail-content {
  font-size: var(--font-sm, 14px);
  color: var(--color-text-secondary, #4a5c4a);
  line-height: var(--line-height-relaxed, 1.6);
  background: var(--color-bg-page, #f5f7f0);
  padding: var(--space-4, 16px);
  border-radius: var(--radius-md, 8px);
}

.attachment-list {
  padding: var(--space-3, 12px);
  background: var(--color-bg-page, #f5f7f0);
  border-radius: var(--radius-md, 8px);
}

.attachment-hint {
  font-size: var(--font-sm, 14px);
  color: var(--color-text-muted, #6b7c6b);
}

.reply-section {
  background: var(--color-primary-light-9, #f0f9eb);
  padding: var(--space-4, 16px);
  border-radius: var(--radius-md, 8px);
  border: 1px solid var(--color-primary-light-7, #c2e7d0);
}

.reply-content {
  font-size: var(--font-sm, 14px);
  color: var(--color-text-secondary, #4a5c4a);
  line-height: var(--line-height-relaxed, 1.6);
  margin-bottom: var(--space-2, 8px);
}

.reply-time {
  font-size: var(--font-xs, 12px);
  color: var(--color-text-muted, #6b7c6b);
}

.status-section {
  background: var(--color-bg-page, #f5f7f0);
  padding: var(--space-4, 16px);
  border-radius: var(--radius-md, 8px);
}

.status-info {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
  font-size: var(--font-sm, 14px);
  color: var(--color-text-secondary, #4a5c4a);
}

.status-icon-pending {
  color: var(--color-warning, #e6a23c);
}

.status-icon-processing {
  color: var(--color-primary, #2d7a4f);
}

.status-icon-replied {
  color: var(--color-success, #52c41a);
}

.status-icon-closed {
  color: var(--color-info, #909399);
}

.empty-detail {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3, 12px);
}
</style>
