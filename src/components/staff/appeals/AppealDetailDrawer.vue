<template>
  <el-drawer
    v-model="visible"
    title="申诉详情"
    direction="rtl"
    size="680px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="!detail" class="detail-empty">
      <el-empty description="未找到申诉详情" />
    </div>

    <div v-else class="detail-content">
      <!-- 基础信息 -->
      <section class="detail-section">
        <h3 class="section-title">基础信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">申诉编号</span>
            <span class="info-value">{{ detail.appeal_no }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">状态</span>
            <el-tag :type="statusTagType(detail.status)" size="small">
              {{ statusLabel(detail.status) }}
            </el-tag>
          </div>
          <div class="info-item">
            <span class="info-label">申诉类型</span>
            <span class="info-value">{{ typeLabel(detail.appeal_type) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">优先级</span>
            <el-tag :type="priorityTagType(detail.priority)" size="small" effect="plain">
              {{ priorityLabel(detail.priority) }}
            </el-tag>
          </div>
          <div class="info-item">
            <span class="info-label">提交时间</span>
            <span class="info-value">{{ formatTime(detail.submitted_at) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">当前处理人</span>
            <span class="info-value">{{ detail.handler_name || '暂无' }}</span>
          </div>
        </div>
      </section>

      <!-- 评价对象 -->
      <section class="detail-section">
        <h3 class="section-title">评价对象</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">评价表单</span>
            <span class="info-value">{{ detail.form_name || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">评价对象</span>
            <span class="info-value">{{ detail.target_name || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">所属组织</span>
            <span class="info-value">{{ detail.target_org_name || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">评价类型</span>
            <span class="info-value">{{ detail.evaluation_type === 'teaching' ? '教学评价' : detail.evaluation_type === 'service' ? '服务评价' : '其他' }}</span>
          </div>
          <div class="info-item" v-if="detail.window_period">
            <span class="info-label">评价窗口</span>
            <span class="info-value">{{ detail.window_period }}</span>
          </div>
        </div>
      </section>

      <!-- 申诉内容 -->
      <section class="detail-section">
        <h3 class="section-title">申诉内容</h3>
        <div class="reason-block">
          <span class="info-label">申诉原因</span>
          <p class="reason-text">{{ detail.reason || '无' }}</p>
        </div>
        <div v-if="detail.evidence_file_ids && detail.evidence_file_ids.length" class="evidence-block">
          <span class="info-label">证据附件</span>
          <div class="evidence-list">
            <div v-for="fid in detail.evidence_file_ids" :key="fid" class="evidence-item">
              <el-icon><Document /></el-icon>
              <span>附件 #{{ fid }}</span>
            </div>
          </div>
        </div>
        <div v-else class="evidence-block">
          <span class="info-label">证据附件</span>
          <span class="info-value text-secondary">暂无附件</span>
        </div>
      </section>

      <!-- 脱敏评价摘要 -->
      <section class="detail-section">
        <h3 class="section-title">评价摘要
          <span class="section-hint">（已脱敏，不展示评价者身份）</span>
        </h3>
        <div v-if="detail.eval_summary" class="eval-summary">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">评分</span>
              <span class="info-value score-value">{{ detail.eval_summary.score ?? '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">提交时间</span>
              <span class="info-value">{{ formatTime(detail.eval_summary.submitted_at) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">匿名评价</span>
              <span class="info-value">{{ detail.eval_summary.anonymous ? '是' : '否' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">已锁定</span>
              <el-tag v-if="detail.eval_summary.locked" type="info" size="small" effect="plain">已锁定</el-tag>
              <el-tag v-else size="small" effect="plain" type="info" class="tag-light">未锁定</el-tag>
            </div>
          </div>
          <div class="eval-text" v-if="detail.eval_summary.text">
            <span class="info-label">评价文本</span>
            <p class="eval-content">{{ detail.eval_summary.text }}</p>
          </div>
        </div>
        <div v-else class="empty-hint">暂无评价摘要</div>
      </section>

      <!-- 追溯授权信息 -->
      <section class="detail-section">
        <h3 class="section-title">追溯授权信息</h3>
        <div v-if="!detail.trace_auth" class="empty-hint">
          暂未发起追溯授权
        </div>
        <div v-else class="trace-auth-info">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">授权状态</span>
              <el-tag :type="traceAuthTagType(detail.trace_auth.status)" size="small">
                {{ traceAuthLabel(detail.trace_auth.status) }}
              </el-tag>
            </div>
            <div class="info-item">
              <span class="info-label">申请时间</span>
              <span class="info-value">{{ formatTime(detail.trace_auth.requested_at) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">申请原因</span>
              <span class="info-value">{{ detail.trace_auth.reason || '-' }}</span>
            </div>
          </div>
          <el-alert
            v-if="detail.trace_auth.status === 'pending'"
            title="追溯授权待学校管理员审核"
            type="info"
            :closable="false"
            show-icon
            style="margin-top: 12px"
          />
          <el-alert
            v-if="detail.trace_auth.status === 'approved'"
            title="已授权，可查看追溯结果（仍需脱敏展示）"
            type="success"
            :closable="false"
            show-icon
            style="margin-top: 12px"
          />
          <el-alert
            v-if="detail.trace_auth.status === 'rejected'"
            title="追溯授权已驳回"
            type="error"
            :closable="false"
            show-icon
            style="margin-top: 12px"
          />
        </div>
      </section>

      <!-- 处理时间线 -->
      <section class="detail-section">
        <h3 class="section-title">处理时间线</h3>
        <div v-if="detail.timeline && detail.timeline.length" class="timeline-list">
          <div
            v-for="record in detail.timeline"
            :key="record.id"
            class="timeline-item"
          >
            <div class="timeline-dot" :class="`dot-${record.action}`"></div>
            <div class="timeline-body">
              <div class="timeline-header">
                <span class="timeline-action">{{ actionLabel(record.action) }}</span>
                <span class="timeline-time">{{ formatTime(record.created_at) }}</span>
              </div>
              <div v-if="record.content" class="timeline-content">{{ record.content }}</div>
              <div class="timeline-meta">
                <span v-if="record.from_status">
                  {{ statusLabel(record.from_status) }} → {{ statusLabel(record.to_status) }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-hint">暂无处理记录</div>
      </section>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-drawer>
</template>

<script setup>
import { computed } from 'vue'
import { Document } from '@element-plus/icons-vue'
import {
  APPEAL_STATUS_MAP,
  APPEAL_TYPE_MAP,
  APPEAL_PRIORITY_MAP,
  TRACE_AUTH_STATUS_MAP,
} from '@/api/staffAppeals'

const ACTION_MAP = {
  submit: '提交申诉',
  accept: '受理申诉',
  reject: '驳回申诉',
  request_supplement: '要求补充',
  request_trace_authorization: '申请追溯授权',
  trace_authorized: '追溯已授权',
  resolve: '完成处理',
  close: '关闭申诉',
}

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  detail: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

function handleClose() {
  visible.value = false
}

function statusLabel(status) {
  return APPEAL_STATUS_MAP[status] || status
}
function statusTagType(status) {
  const map = { pending: 'warning', processing: '', waiting_trace_auth: 'info', resolved: 'success', rejected: 'danger', closed: 'info' }
  return map[status] || ''
}
function typeLabel(type) {
  return APPEAL_TYPE_MAP[type] || type
}
function priorityLabel(p) {
  return APPEAL_PRIORITY_MAP[p] || p
}
function priorityTagType(p) {
  const map = { high: 'danger', normal: 'warning', low: 'info' }
  return map[p] || 'info'
}
function traceAuthLabel(s) {
  return TRACE_AUTH_STATUS_MAP[s] || s
}
function traceAuthTagType(s) {
  const map = { pending: 'warning', approved: 'success', rejected: 'danger', expired: 'info' }
  return map[s] || ''
}
function actionLabel(a) {
  return ACTION_MAP[a] || a
}
function formatTime(t) {
  if (!t) return '-'
  return new Date(t).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>

<style scoped>
.detail-empty {
  padding: 32px 16px;
}

.detail-content {
  padding: 0 4px;
}

.detail-section {
  margin-bottom: 28px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-title, #1a1a1a);
  margin: 0 0 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
}

.section-hint {
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-secondary, #999);
  margin-left: 6px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: var(--color-text-secondary, #999);
}

.info-value {
  font-size: 14px;
  color: var(--color-text-body, #333);
}

.score-value {
  font-weight: 600;
  color: var(--color-primary, #2d7a4e);
  font-size: 16px;
}

.text-secondary {
  color: var(--color-text-secondary, #999);
}

.reason-block,
.evidence-block,
.eval-text {
  margin-top: 12px;
}

.reason-text {
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--color-text-body, #333);
  line-height: 1.6;
  white-space: pre-wrap;
}

.evidence-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.evidence-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-primary, #2d7a4e);
  padding: 6px 10px;
  background: var(--color-bg-page, #f5f7fa);
  border-radius: 6px;
}

.eval-content {
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--color-text-body, #333);
  line-height: 1.6;
  white-space: pre-wrap;
}

.empty-hint {
  font-size: 13px;
  color: var(--color-text-secondary, #999);
  padding: 8px 0;
}

.tag-light {
  opacity: 0.6;
}

/* Timeline */
.timeline-list {
  position: relative;
  padding-left: 20px;
}

.timeline-list::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: var(--el-border-color-lighter, #ebeef5);
}

.timeline-item {
  position: relative;
  padding-bottom: 20px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -17px;
  top: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--el-border-color, #dcdfe6);
  border: 2px solid #fff;
  z-index: 1;
}

.dot-accept,
.dot-resolve {
  background: var(--color-success, #67c23a);
}

.dot-reject {
  background: var(--color-danger, #f56c6c);
}

.dot-request_trace_authorization,
.dot-trace_authorized {
  background: var(--color-warning, #e6a23c);
}

.dot-submit,
.dot-close {
  background: var(--color-text-secondary, #999);
}

.timeline-body {
  padding-left: 4px;
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.timeline-action {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-title, #1a1a1a);
}

.timeline-time {
  font-size: 12px;
  color: var(--color-text-secondary, #999);
}

.timeline-content {
  margin-top: 4px;
  font-size: 13px;
  color: var(--color-text-body, #333);
  line-height: 1.5;
}

.timeline-meta {
  margin-top: 2px;
  font-size: 12px;
  color: var(--color-text-secondary, #999);
}
</style>
