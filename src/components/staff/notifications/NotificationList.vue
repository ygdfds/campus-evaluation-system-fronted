<script setup>
import {
  NOTIFICATION_TYPE_MAP,
  NOTIFICATION_BIZ_TYPE_MAP,
  NOTIFICATION_PRIORITY_MAP,
} from '@/api/staffNotifications'

defineOptions({ name: 'NotificationList' })

defineProps({
  list: { type: Array, default: () => [] },
})

const emit = defineEmits(['view', 'mark-read', 'go-link', 'delete'])

const typeTagMap = {
  todo: 'warning',
  business: '',
  system: 'info',
  audit: 'danger',
  security: 'danger',
}

const priorityTagMap = {
  normal: 'info',
  important: 'warning',
  urgent: 'danger',
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} 小时前`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay} 天前`
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<template>
  <div class="notification-list">
    <div
      v-for="item in list"
      :key="item.id"
      class="notif-card"
      :class="{
        'is-unread': item.read_status === 'unread',
        'is-urgent': item.priority === 'urgent',
      }"
    >
      <!-- 左侧未读指示 -->
      <div v-if="item.read_status === 'unread'" class="unread-indicator" />

      <!-- 主体内容 -->
      <div class="card-body">
        <div class="card-header">
          <span class="notif-title">{{ item.title || '未知通知' }}</span>
          <el-tag
            v-if="item.priority && item.priority !== 'normal'"
            size="small"
            :type="priorityTagMap[item.priority] || 'info'"
            effect="light"
            class="priority-tag"
          >
            {{ NOTIFICATION_PRIORITY_MAP[item.priority] || item.priority }}
          </el-tag>
        </div>

        <p class="notif-content">{{ item.content || '' }}</p>

        <div class="card-meta">
          <div class="meta-tags">
            <el-tag size="small" :type="typeTagMap[item.type] || 'info'" effect="plain">
              {{ NOTIFICATION_TYPE_MAP[item.type] || item.type || '未知' }}
            </el-tag>
            <el-tag v-if="item.business_type" size="small" effect="plain" type="info">
              {{ NOTIFICATION_BIZ_TYPE_MAP[item.business_type] || item.business_type }}
            </el-tag>
            <span v-if="item.read_status === 'read'" class="read-label">已读</span>
          </div>
          <span class="notif-time">{{ formatTime(item.created_at) }}</span>
        </div>
      </div>

      <!-- 右侧操作 -->
      <div class="card-actions">
        <el-button size="small" @click="emit('view', item)">查看详情</el-button>
        <el-button
          v-if="item.read_status === 'unread'"
          size="small"
          type="success"
          plain
          @click="emit('mark-read', item)"
        >
          标记已读
        </el-button>
        <el-button
          v-if="item.link"
          size="small"
          type="primary"
          plain
          @click="emit('go-link', item)"
        >
          跳转处理
        </el-button>
        <el-button
          size="small"
          type="danger"
          text
          @click="emit('delete', item)"
        >
          删除
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notification-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.notif-card {
  display: flex;
  align-items: stretch;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-4) var(--space-5);
  transition: box-shadow 0.2s, background 0.2s;
  position: relative;
  overflow: hidden;
}

.notif-card:hover {
  box-shadow: var(--shadow-md);
}

.notif-card.is-unread {
  background: var(--color-primary-50);
  border-left: 3px solid var(--color-primary);
}

.notif-card.is-urgent:not(.is-unread) {
  border-left: 3px solid var(--color-danger);
}

/* 未读指示点 */
.unread-indicator {
  position: absolute;
  top: 50%;
  left: 8px;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  flex-shrink: 0;
}

.card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.notif-title {
  font-size: var(--font-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-heading);
  line-height: 1.4;
}

.is-unread .notif-title {
  font-weight: var(--font-weight-bold);
}

.priority-tag {
  flex-shrink: 0;
}

.notif-content {
  font-size: var(--font-sm);
  color: var(--color-text-body);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
  margin-top: auto;
  padding-top: var(--space-2);
}

.meta-tags {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.read-label {
  font-size: var(--font-xs);
  color: var(--color-text-muted-light);
}

.notif-time {
  font-size: var(--font-xs);
  color: var(--color-text-muted-light);
  white-space: nowrap;
  flex-shrink: 0;
}

.card-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
  margin-left: var(--space-4);
  align-self: flex-start;
}

@media (max-width: 900px) {
  .notif-card {
    flex-direction: column;
  }
  .card-actions {
    flex-direction: row;
    flex-wrap: wrap;
    margin-left: 0;
    margin-top: var(--space-3);
  }
}
</style>
