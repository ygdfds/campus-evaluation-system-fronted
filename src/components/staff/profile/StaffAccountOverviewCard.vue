<script setup>
import { Bell, Document, ChatDotSquare, Lock } from '@element-plus/icons-vue'

defineOptions({ name: 'StaffAccountOverviewCard' })

defineProps({
  account: { type: Object, default: null },
  stats: { type: Object, default: () => ({ unreadCount: 0, pendingTotal: 0, pendingFeedbackCount: 0, pendingAppealCount: 0, permissionModuleCount: 0 }) },
})

function formatDateTime(dt) {
  if (!dt) return '暂无记录'
  return dt.replace('T', ' ').slice(0, 16)
}
</script>

<template>
  <div class="overview-card">
    <h4 class="overview-title">账号概览</h4>
    <div class="overview-list">
      <div class="overview-item">
        <div class="overview-icon-wrap">
          <el-icon :size="16" class="overview-icon"><ChatDotSquare /></el-icon>
        </div>
        <span class="overview-label">最近登录</span>
        <span class="overview-value">{{ formatDateTime(account?.last_login_at) }}</span>
      </div>
      <div class="overview-item">
        <div class="overview-icon-wrap">
          <el-icon :size="16" class="overview-icon"><Bell /></el-icon>
        </div>
        <span class="overview-label">未读消息</span>
        <span class="overview-value">
          <span v-if="stats.unreadCount > 0" class="value-badge">{{ stats.unreadCount }} 条</span>
          <span v-else class="value-muted">0 条</span>
        </span>
      </div>
      <div class="overview-item">
        <div class="overview-icon-wrap">
          <el-icon :size="16" class="overview-icon"><Document /></el-icon>
        </div>
        <span class="overview-label">待处理事项</span>
        <span class="overview-value">
          <span v-if="stats.pendingTotal > 0" class="value-badge">{{ stats.pendingTotal }} 项</span>
          <span v-else class="value-muted">0 项</span>
        </span>
      </div>
      <div class="overview-item">
        <div class="overview-icon-wrap">
          <el-icon :size="16" class="overview-icon"><Lock /></el-icon>
        </div>
        <span class="overview-label">授权模块</span>
        <span class="overview-value">{{ stats.permissionModuleCount }} 个</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overview-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-card, 0 1px 3px rgba(0,0,0,0.06));
  padding: var(--space-4, 16px) var(--space-5, 20px);
  margin-top: var(--space-4, 16px);
}
.overview-title {
  font-size: var(--font-sm, 13px);
  font-weight: 600;
  color: var(--color-text-heading);
  margin: 0 0 var(--space-3, 12px);
  padding-bottom: var(--space-2, 8px);
  border-bottom: 1px solid var(--color-border-light, #f0f0f0);
}
.overview-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.overview-item {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
  padding: var(--space-2, 8px) 0;
  border-bottom: 1px solid var(--color-border-lighter, #f5f5f5);
}
.overview-item:last-child { border-bottom: none; }
.overview-icon-wrap {
  width: 28px; height: 28px;
  border-radius: var(--radius-sm, 6px);
  background: var(--color-primary-50, #e8f5e9);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.overview-icon { color: var(--color-primary, #2d6a2e); }
.overview-label {
  flex: 1;
  font-size: var(--font-xs, 12px);
  color: var(--color-text-secondary);
}
.overview-value {
  font-size: var(--font-xs, 12px);
  color: var(--color-text-heading);
  font-weight: 500;
  text-align: right;
}
.value-badge {
  color: var(--color-primary, #2d6a2e);
  font-weight: 600;
}
.value-muted {
  color: var(--color-text-muted);
}
</style>
