<script setup>
import { View, Edit, Delete, Promotion, Document, RefreshLeft, Warning } from '@element-plus/icons-vue'
import CoverImage from '@/components/common/CoverImage.vue'

defineOptions({ name: 'StaffEvalFormCard' })

defineProps({
  item: { type: Object, required: true },
})

defineEmits(['view', 'edit', 'delete', 'submit-audit', 'view-data', 'withdraw-audit', 'view-reject-reason', 'limited-edit', 'close-window'])

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

const windowStatusMap = {
  open: { label: '开放中', class: 'window-open' },
  scheduled: { label: '待开始', class: 'window-scheduled' },
  closed: { label: '已结束', class: 'window-closed' },
}

function formatTime(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<template>
  <div class="form-card" @click="$emit('view', item)">
    <!-- 封面 -->
    <div class="card-cover">
      <CoverImage v-if="item._cover_url" :src="item._cover_url" :size="72" />
      <div v-else class="cover-placeholder">
        <el-icon :size="28"><Document /></el-icon>
      </div>
    </div>

    <!-- 主体 -->
    <div class="card-main">
      <div class="card-header">
        <span class="card-title">{{ item.title }}</span>
        <div class="card-tags">
          <el-tag :type="typeMap[item.type]?.type || 'info'" size="small" effect="light">
            {{ typeMap[item.type]?.label || item.type }}
          </el-tag>
          <el-tag :type="statusMap[item.status]?.type || 'info'" size="small" effect="light">
            {{ statusMap[item.status]?.label || item.status }}
          </el-tag>
        </div>
      </div>
      <div class="card-meta">
        <span class="meta-item">
          <span class="meta-label">对象：</span>
          <span>{{ item._target_name }}</span>
        </span>
        <span v-if="item._org_name" class="meta-item">
          <span class="meta-label">组织：</span>
          <span>{{ item._org_name }}</span>
        </span>
        <span class="meta-item">
          <span class="meta-label">题目：</span>
          <span>{{ item._question_count }} 道</span>
        </span>
      </div>
      <div class="card-time">
        <span>创建：{{ formatTime(item.created_at) }}</span>
        <span>更新：{{ formatTime(item.updated_at) }}</span>
      </div>
    </div>

    <!-- 右侧 -->
    <div class="card-side">
      <!-- 窗口信息 -->
      <div v-if="item._window" class="window-info">
        <span class="window-label">评价窗口</span>
        <span :class="['window-status', windowStatusMap[item._window.status]?.class]">
          {{ windowStatusMap[item._window.status]?.label || item._window.status }}
        </span>
        <span class="window-time">{{ formatTime(item._window.end_at) }} 截止</span>
      </div>

      <!-- 操作按钮 -->
      <div class="card-actions">
        <!-- draft 草稿 -->
        <template v-if="item.status === 'draft'">
          <el-button size="small" :icon="Edit" class="btn-green" text @click.stop="$emit('edit', item)">编辑</el-button>
          <el-button size="small" :icon="Promotion" class="btn-green" text @click.stop="$emit('submit-audit', item)">提交审核</el-button>
          <el-button size="small" :icon="Delete" type="danger" text @click.stop="$emit('delete', item)">删除</el-button>
        </template>
        <!-- pending_review 待审核 -->
        <template v-else-if="item.status === 'pending_review'">
          <el-button size="small" :icon="View" text @click.stop="$emit('view', item)">查看</el-button>
          <el-button size="small" :icon="RefreshLeft" class="btn-orange" text @click.stop="$emit('withdraw-audit', item)">撤回审核</el-button>
        </template>
        <!-- rejected 已驳回 -->
        <template v-else-if="item.status === 'rejected'">
          <el-button size="small" :icon="Warning" type="danger" text @click.stop="$emit('view-reject-reason', item)">驳回原因</el-button>
          <el-button size="small" :icon="Edit" class="btn-green" text @click.stop="$emit('edit', item)">编辑</el-button>
          <el-button size="small" :icon="Promotion" class="btn-green" text @click.stop="$emit('submit-audit', item)">重新提交</el-button>
          <el-button size="small" :icon="Delete" type="danger" text @click.stop="$emit('delete', item)">删除</el-button>
        </template>
        <!-- published 已发布 -->
        <template v-else-if="item.status === 'published'">
          <el-button size="small" :icon="View" text @click.stop="$emit('view', item)">查看</el-button>
          <el-button size="small" text @click.stop="$emit('view-data', item)">查看数据</el-button>
          <el-button size="small" :icon="Edit" class="btn-green" text @click.stop="$emit('limited-edit', item)">有限修改</el-button>
          <el-button size="small" class="btn-orange" text @click.stop="$emit('close-window', item)">关闭窗口</el-button>
        </template>
        <!-- closed 已关闭 -->
        <template v-else>
          <el-button size="small" :icon="View" text @click.stop="$emit('view', item)">查看</el-button>
          <el-button size="small" text @click.stop="$emit('view-data', item)">查看数据</el-button>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-card {
  display: flex;
  gap: var(--space-5);
  padding: var(--space-5);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.form-card:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary-100);
}

.card-cover {
  flex-shrink: 0;
}

.cover-placeholder {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-placeholder);
}

.card-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
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
  gap: var(--space-2);
  flex-shrink: 0;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
}

.meta-label {
  color: var(--color-text-placeholder);
}

.card-time {
  display: flex;
  gap: var(--space-4);
  font-size: var(--font-xs);
  color: var(--color-text-muted);
}

.card-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-3);
  flex-shrink: 0;
}

.window-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-size: var(--font-xs);
}

.window-label {
  color: var(--color-text-placeholder);
}

.window-status {
  font-weight: var(--font-weight-medium);
}

.window-open { color: var(--color-success); }
.window-scheduled { color: var(--color-warning); }
.window-closed { color: var(--color-text-muted); }

.window-time {
  color: var(--color-text-muted);
}

.card-actions {
  display: flex;
  gap: var(--space-1);
  flex-wrap: wrap;
}

.btn-green {
  color: var(--color-primary) !important;
}

.btn-green:hover {
  color: var(--color-primary-600, var(--color-primary)) !important;
}

.btn-orange {
  color: var(--color-warning) !important;
}

.btn-orange:hover {
  color: var(--color-warning-dark, var(--color-warning)) !important;
}
</style>
