<script setup>
import { computed } from 'vue'
import CoverImage from '@/components/common/CoverImage.vue'

defineOptions({ name: 'StaffEvalFormDetailDrawer' })

const props = defineProps({
  visible: { type: Boolean, default: false },
  detail: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:visible', 'edit', 'submit-audit'])

const typeMap = {
  teaching: { label: '教学评价', type: 'primary' },
  service: { label: '服务评价', type: 'success' },
  instant: { label: '即时评价', type: 'warning' },
}

const statusMap = {
  draft: { label: '草稿', type: 'info' },
  pending_review: { label: '待审核', type: 'warning' },
  published: { label: '已发布', type: 'success' },
  rejected: { label: '已驳回', type: 'danger' },
  closed: { label: '已关闭', type: '' },
}

const typeLabelMap = { rating: '评分题', text: '文本题', single: '单选题', multiple: '多选题' }

const questions = computed(() => props.detail._questions || [])
const windows = computed(() => props.detail._windows || [])
const audits = computed(() => props.detail._audits || [])

function formatTime(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN')
}

function handleClose() {
  emit('update:visible', false)
}
</script>

<template>
  <el-drawer
    :model-value="visible"
    title="评价表单详情"
    size="680px"
    @close="handleClose"
  >
    <div v-loading="loading" class="detail-body">
      <!-- 基本信息 -->
      <div class="detail-section">
        <h3 class="section-title">基本信息</h3>
        <div v-if="detail._cover_url" class="detail-cover">
          <CoverImage :src="detail._cover_url" width="100%" height="220px" radius="var(--radius-lg)" />
        </div>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">表单名称</span>
            <span class="detail-value">{{ detail.title }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">表单类型</span>
            <el-tag :type="typeMap[detail.type]?.type || 'info'" size="small" effect="light">
              {{ typeMap[detail.type]?.label || detail.type }}
            </el-tag>
          </div>
          <div class="detail-item">
            <span class="detail-label">状态</span>
            <el-tag :type="statusMap[detail.status]?.type || 'info'" size="small" effect="light">
              {{ statusMap[detail.status]?.label || detail.status }}
            </el-tag>
          </div>
          <div class="detail-item">
            <span class="detail-label">匿名评价</span>
            <span class="detail-value">{{ detail.anonymous ? '是' : '否' }}</span>
          </div>
        </div>
        <div v-if="detail.description" class="detail-desc">
          <span class="detail-label">说明：</span>
          <span>{{ detail.description }}</span>
        </div>
      </div>

      <!-- 评价对象 -->
      <div class="detail-section">
        <h3 class="section-title">评价对象</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">对象名称</span>
            <span class="detail-value">{{ detail._target_name || '未指定' }}</span>
          </div>
          <div v-if="detail._org_name" class="detail-item">
            <span class="detail-label">所属组织</span>
            <span class="detail-value">{{ detail._org_name }}</span>
          </div>
        </div>
      </div>

      <!-- 题目列表 -->
      <div v-if="questions.length > 0" class="detail-section">
        <h3 class="section-title">题目列表（{{ questions.length }} 道）</h3>
        <div class="questions-list">
          <div v-for="(q, i) in questions" :key="q.id || i" class="question-item">
            <div class="question-header">
              <span class="question-index">{{ i + 1 }}.</span>
              <span class="question-title">{{ q.title }}</span>
              <el-tag size="small" type="info">{{ typeLabelMap[q.type] || q.type }}</el-tag>
              <span v-if="q.required" class="question-required">必填</span>
            </div>
            <div v-if="q._options && q._options.length > 0" class="question-options">
              <span v-for="(opt, oi) in q._options" :key="oi" class="option-text">
                {{ oi + 1 }}. {{ opt.option_text || opt.text }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 评价窗口 -->
      <div v-if="windows.length > 0" class="detail-section">
        <h3 class="section-title">评价窗口</h3>
        <div class="windows-list">
          <div v-for="w in windows" :key="w.id" class="window-item">
            <div class="window-time">
              <span>{{ formatTime(w.start_at) }} — {{ formatTime(w.end_at) }}</span>
              <el-tag :type="w.status === 'open' ? 'success' : 'info'" size="small">
                {{ w.status === 'open' ? '开放中' : '已结束' }}
              </el-tag>
            </div>
            <div v-if="w.modifiable_hours" class="window-modify">
              提交后 {{ w.modifiable_hours }} 小时内可修改
            </div>
          </div>
        </div>
      </div>

      <!-- 审核记录 -->
      <div v-if="audits.length > 0" class="detail-section">
        <h3 class="section-title">审核记录</h3>
        <div class="audits-list">
          <div v-for="a in audits" :key="a.id" class="audit-item">
            <div class="audit-header">
              <el-tag
                :type="a.status === 'approved' ? 'success' : a.status === 'rejected' ? 'danger' : a.status === 'withdrawn' ? 'info' : 'warning'"
                size="small"
              >
                {{ a.status === 'approved' ? '已通过' : a.status === 'rejected' ? '已驳回' : a.status === 'withdrawn' ? '已撤回' : '待审核' }}
              </el-tag>
              <span class="audit-time">提交：{{ formatTime(a.requested_at) }}</span>
            </div>
            <div v-if="a.submitter_role" class="audit-meta">
              <span class="audit-label">提交人角色：</span>
              <span>{{ a.submitter_role }}</span>
            </div>
            <div v-if="a.submit_reason" class="audit-meta">
              <span class="audit-label">提交说明：</span>
              <span>{{ a.submit_reason }}</span>
            </div>
            <div v-if="a.reviewed_by" class="audit-meta">
              <span class="audit-label">审核人：</span>
              <span>{{ a.reviewed_by }}</span>
            </div>
            <div v-if="a.reviewed_at" class="audit-meta">
              <span class="audit-label">审核时间：</span>
              <span>{{ formatTime(a.reviewed_at) }}</span>
            </div>
            <div v-if="a.review_comment" class="audit-comment">
              <span class="audit-label">审核意见：</span>
              <span>{{ a.review_comment }}</span>
            </div>
            <div v-if="a.withdrawn_at" class="audit-meta">
              <span class="audit-label">撤回时间：</span>
              <span>{{ formatTime(a.withdrawn_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 时间信息 -->
      <div class="detail-section">
        <h3 class="section-title">时间信息</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">创建时间</span>
            <span class="detail-value">{{ formatTime(detail.created_at) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">更新时间</span>
            <span class="detail-value">{{ formatTime(detail.updated_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作 -->
    <template #footer>
      <div class="drawer-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button v-if="detail.status === 'draft'" type="primary" @click="$emit('edit', detail)">编辑</el-button>
        <el-button v-if="detail.status === 'draft'" type="success" @click="$emit('submit-audit', detail)">提交审核</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped>
.detail-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.section-title {
  font-size: var(--font-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin: 0;
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-border-lighter);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.detail-label {
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
}

.detail-value {
  font-size: var(--font-sm);
  color: var(--color-text-primary);
}

.detail-desc {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.detail-desc .detail-label {
  color: var(--color-text-placeholder);
}

/* 题目列表 */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.question-item {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-3);
}

.question-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.question-index {
  font-size: var(--font-sm);
  color: var(--color-text-placeholder);
  width: 20px;
  flex-shrink: 0;
}

.question-title {
  flex: 1;
  font-size: var(--font-sm);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

.question-required {
  font-size: var(--font-xs);
  color: var(--color-danger);
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding-left: var(--space-5);
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
}

/* 窗口列表 */
.windows-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.window-item {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-3);
}

.window-time {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-sm);
  color: var(--color-text-primary);
}

.window-modify {
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
  margin-top: var(--space-1);
}

/* 审核记录 */
.audits-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.audit-item {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-3);
}

.audit-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.audit-time {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
}

.audit-comment {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  margin-top: var(--space-2);
  line-height: var(--line-height-relaxed);
}

.audit-meta {
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
  margin-top: var(--space-1);
}

.audit-label {
  color: var(--color-text-placeholder);
}

/* 底部 */
.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  width: 100%;
}

.detail-cover {
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: var(--space-2);
}
</style>
