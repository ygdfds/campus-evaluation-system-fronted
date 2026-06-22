<script setup>
import { APPEAL_STATUS_MAP, APPEAL_TYPE_MAP, APPEAL_PRIORITY_MAP, TRACE_AUTH_STATUS_MAP } from '@/api/staffAppeals'

defineOptions({ name: 'AppealList' })

defineProps({
  list: { type: Array, default: () => [] },
})

const emit = defineEmits(['view', 'action'])

const statusTypeMap = {
  pending: 'warning',
  processing: '',
  waiting_trace_auth: 'danger',
  resolved: 'success',
  rejected: 'danger',
  closed: 'info',
}

const priorityTypeMap = {
  high: 'danger',
  normal: 'warning',
  low: 'info',
}

function formatTime(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function getActions(item) {
  const actions = []
  switch (item.status) {
    case 'pending':
      actions.push({ key: 'view', label: '查看详情', type: 'default' })
      actions.push({ key: 'accept', label: '受理', type: 'success' })
      actions.push({ key: 'reject', label: '驳回', type: 'danger' })
      break
    case 'processing':
      actions.push({ key: 'view', label: '查看详情', type: 'default' })
      actions.push({ key: 'supplement', label: '要求补充', type: 'warning' })
      actions.push({ key: 'trace', label: '申请追溯授权', type: 'default' })
      actions.push({ key: 'resolve', label: '完成处理', type: 'success' })
      actions.push({ key: 'reject', label: '驳回', type: 'danger' })
      break
    case 'waiting_trace_auth':
      actions.push({ key: 'view', label: '查看详情', type: 'default' })
      actions.push({ key: 'trace_status', label: '查看授权状态', type: 'default' })
      actions.push({ key: 'resolve', label: '完成处理', type: 'success' })
      actions.push({ key: 'reject', label: '驳回', type: 'danger' })
      break
    case 'resolved':
      actions.push({ key: 'view', label: '查看详情', type: 'default' })
      actions.push({ key: 'close', label: '关闭', type: 'info' })
      break
    case 'rejected':
      actions.push({ key: 'view', label: '查看详情', type: 'default' })
      actions.push({ key: 'close', label: '关闭', type: 'info' })
      break
    case 'closed':
      actions.push({ key: 'view', label: '查看详情', type: 'default' })
      break
  }
  return actions
}
</script>

<template>
  <div class="appeal-list">
    <div v-for="item in list" :key="item.id" class="appeal-card">
      <!-- 左侧：主要信息 -->
      <div class="card-main">
        <div class="card-header">
          <span class="appeal-no">{{ item.appeal_no }}</span>
          <el-tag size="small" :type="statusTypeMap[item.status] || ''" effect="plain">
            {{ APPEAL_STATUS_MAP[item.status] || item.status }}
          </el-tag>
          <el-tag v-if="item.priority" size="small" :type="priorityTypeMap[item.priority] || ''" effect="plain">
            {{ APPEAL_PRIORITY_MAP[item.priority] || item.priority }}
          </el-tag>
        </div>
        <div class="card-body">
          <div class="info-row">
            <span class="info-label">评价对象</span>
            <span class="info-value">{{ item.target_name }}</span>
            <el-tag v-if="item.evaluation_type" size="small" effect="plain" class="type-tag">
              {{ item.evaluation_type === 'teaching' ? '教学评价' : item.evaluation_type === 'service' ? '服务评价' : '其他' }}
            </el-tag>
          </div>
          <div class="info-row">
            <span class="info-label">所属组织</span>
            <span class="info-value">{{ item.target_org_name || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">评价表单</span>
            <span class="info-value">{{ item.form_name || '-' }}</span>
          </div>
          <div class="info-row reason-row">
            <span class="info-label">申诉原因</span>
            <span class="info-value reason-text" :title="item.reason">{{ item.reason }}</span>
          </div>
        </div>
        <div class="card-footer">
          <span class="meta-item">提交：{{ formatTime(item.submitted_at) }}</span>
          <span class="meta-item">更新：{{ formatTime(item.updated_at) }}</span>
          <span v-if="item.has_trace_request" class="meta-item trace-tag">
            追溯：{{ TRACE_AUTH_STATUS_MAP[item.trace_auth_status] || item.trace_auth_status }}
          </span>
        </div>
      </div>

      <!-- 右侧：操作区 -->
      <div class="card-actions">
        <div v-for="act in getActions(item)" :key="act.key" class="action-wrapper">
          <el-button
            :type="act.type"
            size="small"
            style="width: 100%; height: 100%"
            @click="act.key === 'view' ? emit('view', item) : emit('action', { action: act.key, item })"
          >
            {{ act.label }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.appeal-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.appeal-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-5);
  transition: box-shadow 0.2s;
}

.appeal-card:hover {
  box-shadow: var(--shadow-md);
}

.card-main {
  flex: 1;
  min-width: 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  flex-wrap: wrap;
}

.appeal-no {
  font-size: var(--font-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.info-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-sm);
}

.info-label {
  width: 64px;
  color: var(--color-text-muted);
  flex-shrink: 0;
  font-size: var(--font-xs);
}

.info-value {
  color: var(--color-text-body);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.type-tag {
  flex-shrink: 0;
}

.reason-row {
  align-items: flex-start;
}

.reason-text {
  white-space: normal;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: var(--border-lighter);
  flex-wrap: wrap;
}

.meta-item {
  font-size: var(--font-xs);
  color: var(--color-text-muted-light);
}

.trace-tag {
  color: var(--color-danger);
}

.card-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
  width: 128px;
  align-self: flex-start;
}

.action-wrapper {
  width: 112px;
  height: 32px;
  flex-shrink: 0;
}

@media (max-width: 900px) {
  .appeal-card {
    flex-direction: column;
  }
  .card-actions {
    flex-direction: row;
    flex-wrap: wrap;
    min-width: auto;
  }
}
</style>
