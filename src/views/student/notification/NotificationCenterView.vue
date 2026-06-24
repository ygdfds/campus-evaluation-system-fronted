<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  InfoFilled, Star, ChatDotSquare, Lock,
  Notification as NotificationIcon, Search,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import {
  getNotificationsApi, markNotificationReadApi,
  markAllNotificationsReadApi,
} from '@/api/notification'

defineOptions({ name: 'NotificationCenterView' })

const router = useRouter()
const userStore = useUserStore()

// ==================== 状态 ====================
const loading = ref(true)
const allNotifications = ref([])
const filterType = ref('all')
const filterRead = ref('all')
const sortOrder = ref('desc')
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = 8
const drawerVisible = ref(false)
const selectedNotification = ref(null)

// 类型配置
const typeConfig = {
  system:        { icon: InfoFilled,       label: '系统通知', color: 'var(--color-info)',              bg: 'var(--color-info-light)' },
  evaluation:    { icon: Star,             label: '评价提醒', color: 'var(--color-warning)',           bg: 'var(--color-warning-light)' },
  complaint:     { icon: ChatDotSquare,    label: '投诉进度', color: 'var(--color-primary)',           bg: 'var(--color-primary-50)' },
  account:       { icon: Lock,             label: '账号安全', color: 'var(--color-danger)',            bg: 'var(--color-danger-light)' },
  announcement:  { icon: NotificationIcon, label: '公告通知', color: 'var(--color-accent-school-500)', bg: 'var(--color-accent-school-50)' },
}

const typeOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'system', label: '系统通知' },
  { value: 'evaluation', label: '评价提醒' },
  { value: 'complaint', label: '投诉进度' },
  { value: 'account', label: '账号安全' },
  { value: 'announcement', label: '公告通知' },
]
const readOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'unread', label: '未读' },
  { value: 'read', label: '已读' },
]
const sortOptions = [
  { value: 'desc', label: '最新优先' },
  { value: 'asc', label: '最早优先' },
]

// ==================== 计算属性 ====================
const filteredNotifications = computed(() => {
  let list = [...allNotifications.value]
  // 类型筛选
  if (filterType.value !== 'all') {
    list = list.filter(n => n.type === filterType.value)
  }
  // 阅读状态筛选
  if (filterRead.value !== 'all') {
    list = list.filter(n => n.read_status === filterRead.value)
  }
  // 搜索
  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.trim().toLowerCase()
    list = list.filter(n =>
      (n.title || '').toLowerCase().includes(kw) ||
      (n.content || '').toLowerCase().includes(kw)
    )
  }
  // 排序
  if (sortOrder.value === 'asc') {
    list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  } else {
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }
  return list
})

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredNotifications.value.slice(start, start + pageSize)
})

const unreadCount = computed(() => allNotifications.value.filter(n => n.read_status === 'unread').length)

// ==================== 数据加载 ====================
function getContext() {
  return {
    tenantId: userStore.tenantId,
    userId: userStore.userInfo?.id,
    role: userStore.userRole,
  }
}

async function loadData() {
  loading.value = true
  try {
    allNotifications.value = await getNotificationsApi(getContext())
  } catch (e) { console.error('加载通知列表失败:', e) }
  finally { loading.value = false }
}

// ==================== 交互 ====================
function formatDateTime(dt) {
  return dt ? dt.replace('T', ' ').slice(0, 16) : '—'
}

async function handleMarkAllRead() {
  try {
    await markAllNotificationsReadApi(getContext())
    allNotifications.value = allNotifications.value.map(n => ({ ...n, read_status: 'read' }))
    ElMessage.success('已全部标记为已读')
  } catch { ElMessage.error('操作失败') }
}

async function handleItemClick(item) {
  if (item.read_status === 'unread') {
    try {
      await markNotificationReadApi(item.id)
      item.read_status = 'read'
    } catch (e) { console.error(e) }
  }
  selectedNotification.value = item
  drawerVisible.value = true
}

function handleDrawerAction() {
  drawerVisible.value = false
  if (selectedNotification.value?.link) {
    router.push(selectedNotification.value.link)
  }
}

function getActionLabel(type) {
  const map = {
    evaluation: '去评价',
    complaint: '查看投诉进度',
    announcement: '查看公告',
    account: '查看账号安全',
    system: '查看详情',
  }
  return map[type] || '查看详情'
}

// 筛选变化时回到第一页
watch([filterType, filterRead, sortOrder, searchKeyword], () => {
  currentPage.value = 1
})

onMounted(() => { loadData() })
</script>

<template>
  <div class="notification-center">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">消息通知</h1>
      <p class="page-subtitle">查看评价提醒、投诉处理进度和系统通知</p>
    </div>

    <div v-if="loading" class="loading-area"><el-skeleton :rows="6" animated /></div>

    <template v-else>
      <!-- 筛选区 -->
      <div class="filter-bar">
        <div class="filter-left">
          <el-select v-model="filterType" size="default" class="filter-select">
            <el-option v-for="opt in typeOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </el-select>
          <el-select v-model="filterRead" size="default" class="filter-select">
            <el-option v-for="opt in readOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </el-select>
          <el-select v-model="sortOrder" size="default" class="filter-select">
            <el-option v-for="opt in sortOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </el-select>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索通知标题或内容"
            :prefix-icon="Search"
            clearable
            class="filter-search"
          />
        </div>
        <el-button type="primary" size="default" :disabled="unreadCount === 0" @click="handleMarkAllRead">
          全部已读
        </el-button>
      </div>

      <!-- 通知列表 -->
      <div v-if="pagedList.length" class="notification-list">
        <div
          v-for="item in pagedList"
          :key="item.id"
          class="notification-card"
          :class="{ 'is-unread': item.read_status === 'unread' }"
          @click="handleItemClick(item)"
        >
          <div class="card-left">
            <div class="type-icon" :style="{ color: typeConfig[item.type]?.color, background: typeConfig[item.type]?.bg }">
              <el-icon :size="20">
                <component :is="typeConfig[item.type]?.icon || InfoFilled" />
              </el-icon>
            </div>
            <span v-if="item.read_status === 'unread'" class="unread-indicator" />
          </div>
          <div class="card-body">
            <div class="card-top-row">
              <span class="type-badge" :style="{ color: typeConfig[item.type]?.color, background: typeConfig[item.type]?.bg }">
                {{ typeConfig[item.type]?.label || '通知' }}
              </span>
              <span class="card-time">{{ formatDateTime(item.created_at) }}</span>
            </div>
            <h3 class="card-title">{{ item.title }}</h3>
            <p class="card-content">{{ item.content }}</p>
          </div>
          <div class="card-right">
            <span class="card-action">{{ getActionLabel(item.type) }}</span>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <el-icon :size="56" class="empty-icon"><NotificationIcon /></el-icon>
        <p class="empty-text">暂无通知</p>
        <p class="empty-hint">当前筛选条件下没有匹配的通知</p>
      </div>

      <!-- 分页 -->
      <div v-if="filteredNotifications.length > pageSize" class="pagination-area">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredNotifications.length"
          layout="total, prev, pager, next"
        />
      </div>
    </template>

    <!-- 通知详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="通知详情"
      direction="rtl"
      size="480px"
    >
      <div v-if="selectedNotification" class="drawer-content">
        <div class="drawer-meta">
          <span class="type-badge" :style="{ color: typeConfig[selectedNotification.type]?.color, background: typeConfig[selectedNotification.type]?.bg }">
            {{ typeConfig[selectedNotification.type]?.label || '通知' }}
          </span>
          <span class="drawer-time">{{ formatDateTime(selectedNotification.created_at) }}</span>
        </div>
        <h2 class="drawer-title">{{ selectedNotification.title }}</h2>
        <div class="drawer-body">
          <p>{{ selectedNotification.content }}</p>
        </div>
        <div class="drawer-actions">
          <el-button v-if="selectedNotification.link" type="primary" @click="handleDrawerAction">
            {{ getActionLabel(selectedNotification.type) }}
          </el-button>
          <el-button @click="drawerVisible = false">关闭</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.notification-center {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding-bottom: var(--space-8);
}
.page-header { padding: var(--space-2) 0 var(--space-5); }
.page-title { font-size: 28px; font-weight: var(--font-weight-bold); color: var(--color-text-heading); margin-bottom: var(--space-1); }
.page-subtitle { font-size: var(--font-base); color: var(--color-text-secondary); }

.loading-area { padding: var(--space-8); background: var(--color-bg-card); border-radius: var(--radius-lg); }

/* ==================== 筛选区 ==================== */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-6);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}
.filter-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.filter-select { width: 140px; }
.filter-search { width: 220px; }

/* 按钮主色覆盖 */
.filter-bar :is(.el-button--primary) {
  --el-button-bg-color: var(--color-primary);
  --el-button-border-color: var(--color-primary);
  --el-button-hover-bg-color: var(--color-primary-hover);
  --el-button-hover-border-color: var(--color-primary-hover);
  --el-button-active-bg-color: var(--color-primary-active);
  --el-button-active-border-color: var(--color-primary-active);
}

/* ==================== 通知列表 ==================== */
.notification-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.notification-card {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-6);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  position: relative;
}
.notification-card:hover {
  border-color: var(--color-primary-200);
  box-shadow: var(--shadow-card), 0 2px 8px rgba(45, 106, 46, 0.06);
}
.notification-card.is-unread {
  background: var(--color-primary-50);
  border-left: 3px solid var(--color-primary);
}

.card-left {
  position: relative;
  flex-shrink: 0;
}
.type-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}
.unread-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-danger);
  border: 1.5px solid var(--color-bg-card);
}

.card-body {
  flex: 1;
  min-width: 0;
}
.card-top-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}
.type-badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: var(--font-xs);
  font-weight: var(--font-weight-medium);
}
.card-time {
  font-size: var(--font-xs);
  color: var(--color-text-muted-light);
}
.card-title {
  font-size: var(--font-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-heading);
  margin: 0 0 var(--space-1);
  line-height: 1.4;
}
.is-unread .card-title {
  font-weight: 600;
}
.card-content {
  font-size: var(--font-sm);
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
.card-action {
  font-size: var(--font-sm);
  color: var(--color-primary);
  white-space: nowrap;
}
.notification-card:hover .card-action {
  color: var(--color-primary-hover);
}

/* ==================== 空状态 ==================== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-12) 0;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}
.empty-icon { opacity: 0.25; color: var(--color-text-muted); }
.empty-text { font-size: var(--font-md); color: var(--color-text-body); margin: 0; }
.empty-hint { font-size: var(--font-sm); color: var(--color-text-muted); margin: 0; }

/* ==================== 分页 ==================== */
.pagination-area {
  display: flex;
  justify-content: center;
  padding-top: var(--space-5);
}

/* ==================== 抽屉 ==================== */
.drawer-content {
  padding: 0 var(--space-2);
}
.drawer-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.drawer-time {
  font-size: var(--font-xs);
  color: var(--color-text-muted-light);
}
.drawer-title {
  font-size: var(--font-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-heading);
  margin: 0 0 var(--space-5);
  line-height: 1.4;
}
.drawer-body {
  font-size: var(--font-sm);
  color: var(--color-text-body);
  line-height: 1.8;
  margin-bottom: var(--space-8);
}
.drawer-body p { margin: 0; }
.drawer-actions {
  display: flex;
  gap: var(--space-3);
}
.drawer-actions :is(.el-button--primary) {
  --el-button-bg-color: var(--color-primary);
  --el-button-border-color: var(--color-primary);
  --el-button-hover-bg-color: var(--color-primary-hover);
  --el-button-hover-border-color: var(--color-primary-hover);
  --el-button-active-bg-color: var(--color-primary-active);
  --el-button-active-border-color: var(--color-primary-active);
}

/* ==================== 响应式 ==================== */
@media (max-width: 768px) {
  .filter-bar { flex-direction: column; align-items: stretch; }
  .filter-left { flex-direction: column; }
  .filter-select, .filter-search { width: 100%; }
  .notification-card { flex-direction: column; }
  .card-right { align-self: flex-end; }
}
</style>
