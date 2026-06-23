<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, InfoFilled, Star, ChatDotSquare, Lock, Notification as NotificationIcon } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useNotificationStore } from '@/stores/notification'
import {
  getNotificationsApi,
  markNotificationReadApi as markOrigReadApi,
  markAllNotificationsReadApi as markAllOrigApi,
} from '@/api/notification'

defineOptions({ name: 'NotificationDropdown' })

const router = useRouter()
const userStore = useUserStore()
const notificationStore = useNotificationStore()

const popoverVisible = ref(false)
const recentList = ref([])
const loading = ref(false)

// 判断是否为职工端用户
const isStaffUser = computed(() => {
  const role = userStore.userRole
  if (role === 'staff') return true
  const roles = userStore.userInfo?.roles
  if (Array.isArray(roles)) {
    const staffCodes = ['teaching_admin', 'service_admin', 'feedback_handler', 'form_publisher', 'course_owner', 'service_window-manager']
    return roles.some(r => staffCodes.includes(r.role_code))
  }
  return false
})

const unreadCount = computed(() => notificationStore.unreadCount)

// 通知类型配置
const typeConfig = {
  system:        { icon: InfoFilled,       label: '系统通知', color: 'var(--color-info)' },
  evaluation:    { icon: Star,             label: '评价提醒', color: 'var(--color-warning)' },
  complaint:     { icon: ChatDotSquare,    label: '投诉进度', color: 'var(--color-primary)' },
  account:       { icon: Lock,             label: '账号安全', color: 'var(--color-danger)' },
  announcement:  { icon: NotificationIcon, label: '公告通知', color: 'var(--color-accent-school-500)' },
}

function getContext() {
  return {
    tenantId: userStore.tenantId,
    userId: userStore.userInfo?.id,
    role: userStore.userRole,
  }
}

function formatTime(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  const now = new Date()
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} 小时前`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay} 天前`
  return dt.replace('T', ' ').slice(0, 16)
}

async function loadData() {
  const ctx = getContext()
  if (!ctx.tenantId) return
  loading.value = true
  try {
    // 根据角色获取未读数
    if (isStaffUser.value) {
      await notificationStore.fetchUnreadCount({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
      })
    } else {
      // 学生端仍用原 API
      const { getUnreadCountApi } = await import('@/api/notification')
      const count = await getUnreadCountApi(ctx)
      notificationStore.setUnreadCount(count)
    }
    // 根据角色使用不同 API 获取列表
    if (isStaffUser.value) {
      const { getStaffNotificationListApi } = await import('@/api/staffNotifications')
      const res = await getStaffNotificationListApi({ tenantId: ctx.tenantId, userId: ctx.userId }, { pageSize: 5 })
      recentList.value = res.list || []
    } else {
      const list = await getNotificationsApi(ctx)
      recentList.value = list.slice(0, 5)
    }
  } catch (e) { console.error('加载通知失败:', e) }
  finally { loading.value = false }
}

async function handleMarkAllRead() {
  try {
    if (isStaffUser.value) {
      const { markAllStaffNotificationsReadApi } = await import('@/api/staffNotifications')
      await markAllStaffNotificationsReadApi(getContext())
    } else {
      await markAllOrigApi(getContext())
    }
    notificationStore.setUnreadCount(0)
    recentList.value = recentList.value.map(n => ({ ...n, read_status: 'read' }))
    ElMessage.success('已全部标记为已读')
  } catch { ElMessage.error('操作失败') }
}

async function handleItemClick(item) {
  if (item.read_status === 'unread') {
    try {
      if (isStaffUser.value) {
        const { markStaffNotificationReadApi } = await import('@/api/staffNotifications')
        await markStaffNotificationReadApi(item.id)
      } else {
        await markOrigReadApi(item.id)
      }
      item.read_status = 'read'
      notificationStore.setUnreadCount(Math.max(0, notificationStore.unreadCount - 1))
    } catch (e) { console.error(e) }
  }
  popoverVisible.value = false
  if (item.link) {
    router.push(item.link)
  }
}

function goNotificationCenter() {
  popoverVisible.value = false
  if (isStaffUser.value) {
    router.push('/staff/notifications')
  } else {
    router.push('/student/notifications')
  }
}

onMounted(() => { loadData() })

defineExpose({ loadData })
</script>

<template>
  <el-popover
    v-model:visible="popoverVisible"
    trigger="click"
    placement="bottom-end"
    :width="400"
    popper-class="notification-popover"
    :show-arrow="false"
    :offset="8"
  >
    <template #reference>
      <el-button text class="nav-icon-btn badge-btn">
        <el-icon :size="20"><Bell /></el-icon>
        <span v-if="unreadCount > 0" class="badge-dot">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      </el-button>
    </template>

    <div class="notif-panel">
      <!-- 标题栏 -->
      <div class="notif-header">
        <span class="notif-title">消息通知</span>
        <el-button text size="small" class="mark-all-btn" @click="handleMarkAllRead">全部已读</el-button>
      </div>

      <!-- 列表 -->
      <div v-if="loading" class="notif-loading">
        <el-skeleton :rows="3" animated />
      </div>
      <div v-else-if="recentList.length" class="notif-list">
        <div
          v-for="item in recentList"
          :key="item.id"
          class="notif-item"
          :class="{ 'is-unread': item.read_status === 'unread' }"
          @click="handleItemClick(item)"
        >
          <div class="notif-icon-wrap" :style="{ color: typeConfig[item.type]?.color || 'var(--color-info)' }">
            <el-icon :size="18">
              <component :is="typeConfig[item.type]?.icon || InfoFilled" />
            </el-icon>
          </div>
          <div class="notif-body">
            <div class="notif-item-header">
              <span class="notif-item-title">{{ item.title }}</span>
              <span v-if="item.read_status === 'unread'" class="unread-dot" />
            </div>
            <p class="notif-item-content">{{ item.content?.slice(0, 50) }}{{ item.content?.length > 50 ? '...' : '' }}</p>
            <span class="notif-item-time">{{ formatTime(item.created_at) }}</span>
          </div>
        </div>
      </div>
      <div v-else class="notif-empty">
        <el-icon :size="40" class="empty-icon"><Bell /></el-icon>
        <p>暂无消息通知</p>
      </div>

      <!-- 底部 -->
      <div class="notif-footer" @click="goNotificationCenter">
        查看全部
      </div>
    </div>
  </el-popover>
</template>

<style scoped>
.nav-icon-btn {
  color: var(--color-text-muted);
}
.nav-icon-btn:hover {
  color: var(--color-accent-user-700);
}

/* 消息角标 */
.badge-btn {
  position: relative;
}
.badge-dot {
  position: absolute;
  top: var(--badge-offset);
  right: var(--badge-offset);
  min-width: var(--badge-min-size);
  height: var(--badge-min-size);
  padding: 0 var(--badge-padding-x);
  background: var(--badge-bg);
  color: var(--badge-text);
  font-size: var(--badge-font-size);
  font-weight: var(--font-weight-semibold);
  line-height: var(--badge-min-size);
  text-align: center;
  border-radius: var(--radius-full);
}

/* ==================== 通知面板 ==================== */
.notif-panel {
  margin: -12px;
}
.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border-light);
}
.notif-title {
  font-size: var(--font-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-heading);
}
.mark-all-btn {
  color: var(--color-primary) !important;
  font-size: var(--font-xs);
}
.mark-all-btn:hover {
  color: var(--color-primary-hover) !important;
}

.notif-loading {
  padding: var(--space-5);
}

.notif-list {
  max-height: 380px;
  overflow-y: auto;
}
.notif-item {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid var(--color-border-lighter);
}
.notif-item:hover {
  background: var(--color-bg-subtle);
}
.notif-item:last-child {
  border-bottom: none;
}
.notif-item.is-unread {
  background: var(--color-primary-50);
}
.notif-item.is-unread:hover {
  background: var(--color-bg-primary-hover);
}

.notif-icon-wrap {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--color-bg-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.notif-body {
  flex: 1;
  min-width: 0;
}
.notif-item-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: 2px;
}
.notif-item-title {
  font-size: var(--font-sm);
  color: var(--color-text-body);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.is-unread .notif-item-title {
  font-weight: 600;
  color: var(--color-text-heading);
}
.unread-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-danger);
  flex-shrink: 0;
}
.notif-item-content {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
  line-height: 1.4;
  margin: 0 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.notif-item-time {
  font-size: 11px;
  color: var(--color-text-muted-light);
}

.notif-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-8) 0;
  color: var(--color-text-muted);
  font-size: var(--font-sm);
}
.empty-icon {
  opacity: 0.3;
}

.notif-footer {
  text-align: center;
  padding: var(--space-3);
  font-size: var(--font-sm);
  color: var(--color-primary);
  cursor: pointer;
  border-top: 1px solid var(--color-border-light);
  transition: background 0.15s;
}
.notif-footer:hover {
  background: var(--color-bg-subtle);
  color: var(--color-primary-hover);
}
</style>
