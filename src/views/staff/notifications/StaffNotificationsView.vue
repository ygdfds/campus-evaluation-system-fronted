<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  InfoFilled, Clock, Lock, ArrowLeft,
  Notification as NotificationIcon, Search, Star, Refresh,
  Filter, ArrowDown,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useNotificationStore } from '@/stores/notification'
import {
  getStaffNotificationListApi,
  markStaffNotificationReadApi,
  markAllStaffNotificationsReadApi,
  deleteStaffNotificationApi,
  NOTIFICATION_BIZ_TYPE_MAP,
} from '@/api/staffNotifications'

defineOptions({ name: 'StaffNotificationsView' })

const router = useRouter()
const userStore = useUserStore()
const notificationStore = useNotificationStore()

// ==================== 状态 ====================
const loading = ref(true)
const allNotifications = ref([])
const activeTab = ref('all') // all | unread | todo | business | system
const sortOrder = ref('desc')
const searchKeyword = ref('')
const filterType = ref('all') // 低频筛选：类型
const currentPage = ref(1)
const pageSize = 8
const drawerVisible = ref(false)
const selectedNotification = ref(null)
const showFilterPopover = ref(false)

// 类型配置
const typeConfig = {
  todo:             { icon: Clock,            label: '待办提醒', color: 'var(--color-warning)',           bg: 'var(--color-warning-light)' },
  business:         { icon: InfoFilled,       label: '业务通知', color: 'var(--color-primary)',           bg: 'var(--color-primary-50)' },
  system:           { icon: NotificationIcon, label: '系统通知', color: 'var(--color-info)',              bg: 'var(--color-info-light)' },
  audit:            { icon: Star,             label: '审核通知', color: 'var(--color-accent-school-500)', bg: 'var(--color-accent-school-50)' },
  security:         { icon: Lock,             label: '安全提醒', color: 'var(--color-danger)',            bg: 'var(--color-danger-light)' },
}

const typeFilterOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'todo', label: '待办提醒' },
  { value: 'business', label: '业务通知' },
  { value: 'system', label: '系统通知' },
  { value: 'audit', label: '审核通知' },
  { value: 'security', label: '安全提醒' },
]

const sortOptions = [
  { value: 'desc', label: '最新优先' },
  { value: 'asc', label: '最早优先' },
]

// Tab 定义
const tabs = [
  { key: 'all', label: '全部' },
  { key: 'unread', label: '未读' },
  { key: 'todo', label: '待办' },
  { key: 'business', label: '业务' },
  { key: 'system', label: '系统' },
]

// ==================== 计算属性 ====================
const filteredNotifications = computed(() => {
  let list = [...allNotifications.value]

  // Tab 筛选
  if (activeTab.value === 'unread') {
    list = list.filter(n => n.read_status === 'unread')
  } else if (activeTab.value === 'todo') {
    list = list.filter(n => n.type === 'todo')
  } else if (activeTab.value === 'business') {
    list = list.filter(n => n.type === 'business')
  } else if (activeTab.value === 'system') {
    list = list.filter(n => n.type === 'system' || n.type === 'security')
  }

  // 低频筛选：类型
  if (filterType.value !== 'all') {
    list = list.filter(n => n.type === filterType.value)
  }

  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.trim().toLowerCase()
    list = list.filter(n =>
      (n.title || '').toLowerCase().includes(kw) ||
      (n.content || '').toLowerCase().includes(kw)
    )
  }
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
function getUserContext() {
  const info = userStore.userInfo || {}
  return {
    tenantId: userStore.tenantId || info.tenant_id,
    userId: info.id || info.user_id || info.account_id,
  }
}

async function loadData() {
  loading.value = true
  try {
    const res = await getStaffNotificationListApi(getUserContext(), { pageSize: 999 })
    allNotifications.value = res.list || []
    notificationStore.setUnreadCount(unreadCount.value)
  } catch (e) {
    console.error('加载通知列表失败:', e)
  } finally {
    loading.value = false
  }
}

// ==================== 交互 ====================
function handleBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/staff/dashboard')
  }
}

function formatDateTime(dt) {
  return dt ? dt.replace('T', ' ').slice(0, 16) : '—'
}

async function handleMarkAllRead() {
  try {
    await markAllStaffNotificationsReadApi(getUserContext())
    allNotifications.value = allNotifications.value.map(n => ({ ...n, read_status: 'read' }))
    notificationStore.setUnreadCount(0)
    ElMessage.success('已全部标记为已读')
  } catch {
    ElMessage.error('操作失败')
  }
}

async function handleItemClick(item) {
  if (item.read_status === 'unread') {
    try {
      await markStaffNotificationReadApi(item.id)
      item.read_status = 'read'
      notificationStore.setUnreadCount(Math.max(0, notificationStore.unreadCount - 1))
    } catch (e) {
      console.error(e)
    }
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

async function handleDrawerDelete() {
  try {
    await ElMessageBox.confirm('确认删除该通知？', '提示', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteStaffNotificationApi(selectedNotification.value.id)
    allNotifications.value = allNotifications.value.filter(n => n.id !== selectedNotification.value.id)
    drawerVisible.value = false
    ElMessage.success('已删除')
  } catch (action) {
    if (action !== 'cancel') ElMessage.error('操作失败')
  }
}

function getActionLabel(item) {
  if (item.link) {
    const bizMap = {
      feedback: '去处理',
      appeal: '去处理',
      evaluation_form: '去查看',
      trace_authorization: '去查看',
      system: '查看详情',
      account: '去查看',
    }
    return bizMap[item.business_type] || '查看详情'
  }
  return '查看详情'
}

function getBizLabel(bizType) {
  return NOTIFICATION_BIZ_TYPE_MAP[bizType] || ''
}

// 筛选变化时回到第一页
watch([activeTab, filterType, sortOrder, searchKeyword], () => {
  currentPage.value = 1
})

onMounted(() => { loadData() })
</script>

<template>
  <div class="notification-center">
    <!-- 轻量头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button text :icon="ArrowLeft" class="back-btn" @click="handleBack">返回</el-button>
        <div class="header-text">
          <h1 class="page-title">消息通知</h1>
          <p class="page-subtitle">查看业务提醒、审核结果和系统通知</p>
        </div>
      </div>
      <div class="header-right">
        <el-button class="btn-green-outline" :disabled="unreadCount === 0" @click="handleMarkAllRead">
          全部已读
        </el-button>
        <el-button :icon="Refresh" @click="loadData">刷新</el-button>
      </div>
    </div>

    <div v-if="loading" class="loading-area"><el-skeleton :rows="6" animated /></div>

    <template v-else>
      <!-- 筛选 + 列表 + 分页（合并到大盒子） -->
      <el-card shadow="never" class="section-card list-card">
        <!-- 轻量筛选区：Tabs + 搜索 + 折叠筛选 -->
        <div class="filter-bar">
          <div class="filter-tabs">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              class="tab-btn"
              :class="{ active: activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
              <span v-if="tab.key === 'unread' && unreadCount > 0" class="tab-badge">{{ unreadCount }}</span>
            </button>
          </div>
          <div class="filter-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索通知"
              :prefix-icon="Search"
              clearable
              class="filter-search"
            />
            <el-popover
              v-model:visible="showFilterPopover"
              trigger="click"
              placement="bottom-end"
              :width="240"
            >
              <template #reference>
                <el-button class="filter-btn" :icon="Filter">
                  筛选
                  <el-icon class="arrow-icon" :class="{ 'is-open': showFilterPopover }"><ArrowDown /></el-icon>
                </el-button>
              </template>
              <div class="popover-content">
                <div class="popover-item">
                  <label>类型</label>
                  <el-select v-model="filterType" size="small" class="popover-select">
                    <el-option v-for="opt in typeFilterOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
                  </el-select>
                </div>
                <div class="popover-item">
                  <label>排序</label>
                  <el-select v-model="sortOrder" size="small" class="popover-select">
                    <el-option v-for="opt in sortOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
                  </el-select>
                </div>
              </div>
            </el-popover>
          </div>
        </div>

        <!-- 通知列表 -->
        <div v-if="pagedList.length" class="notification-list">
          <div
            v-for="(item, index) in pagedList"
            :key="item.id"
            class="notification-card"
            :class="{
              'is-unread': item.read_status === 'unread',
              'is-first-unread': item.read_status === 'unread' && !pagedList.slice(0, index).some(n => n.read_status === 'unread')
            }"
            @click="handleItemClick(item)"
          >
            <div class="card-left">
              <div class="type-icon" :style="{ color: typeConfig[item.type]?.color, background: typeConfig[item.type]?.bg }">
                <el-icon :size="18">
                  <component :is="typeConfig[item.type]?.icon || InfoFilled" />
                </el-icon>
              </div>
              <span v-if="item.read_status === 'unread'" class="unread-dot" />
            </div>
            <div class="card-body">
              <div class="card-top-row">
                <span class="type-badge" :style="{ color: typeConfig[item.type]?.color, background: typeConfig[item.type]?.bg }">
                  {{ typeConfig[item.type]?.label || '通知' }}
                </span>
                <span v-if="item.business_type" class="biz-badge">{{ getBizLabel(item.business_type) }}</span>
                <span class="card-time">{{ formatDateTime(item.created_at) }}</span>
              </div>
              <h3 class="card-title">{{ item.title }}</h3>
              <p class="card-content">{{ item.content }}</p>
            </div>
            <div class="card-right">
              <span class="card-action">{{ getActionLabel(item) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <el-icon :size="48" class="empty-icon"><NotificationIcon /></el-icon>
          <p class="empty-text">暂无通知</p>
          <p class="empty-hint">当前筛选条件下没有匹配的通知</p>
        </div>

        <!-- 分页 -->
        <div v-if="filteredNotifications.length > 0" class="pagination-bar">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="filteredNotifications.length"
            layout="prev, pager, next"
          />
        </div>
      </el-card>
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
          <span v-if="selectedNotification.business_type" class="biz-badge">{{ getBizLabel(selectedNotification.business_type) }}</span>
          <span class="drawer-time">{{ formatDateTime(selectedNotification.created_at) }}</span>
        </div>
        <h2 class="drawer-title">{{ selectedNotification.title }}</h2>
        <div class="drawer-body">
          <p>{{ selectedNotification.content }}</p>
        </div>
        <div class="drawer-actions">
          <el-button v-if="selectedNotification.link" class="btn-green" @click="handleDrawerAction">
            {{ getActionLabel(selectedNotification) }}
          </el-button>
          <el-button @click="drawerVisible = false">关闭</el-button>
          <el-button v-if="selectedNotification.link" text type="danger" size="small" @click="handleDrawerDelete" class="delete-text-btn">删除</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.notification-center {
  max-width: 1480px;
  margin: 0 auto;
  width: 100%;
  padding-bottom: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* 大盒子 */
.section-card {
  border: 1px solid var(--color-border-lighter) !important;
  border-radius: var(--radius-card) !important;
  box-shadow: var(--shadow-card) !important;
  overflow: hidden;
}

.list-card :deep(.el-card__body) {
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--space-2) 0 var(--space-4);
  gap: var(--space-4);
}
.header-left {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}
.back-btn {
  margin-top: 4px;
  flex-shrink: 0;
}
.header-text { flex: 1; }
.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}
.page-title { font-size: 22px; font-weight: var(--font-weight-bold); color: var(--color-text-heading); margin: 0 0 var(--space-1); }
.page-subtitle { font-size: var(--font-sm); color: var(--color-text-secondary); margin: 0; }

.loading-area { padding: var(--space-8); background: var(--color-bg-card); border-radius: var(--radius-lg); }

/* ==================== 绿色按钮样式 ==================== */
.btn-green {
  --el-button-bg-color: var(--color-primary);
  --el-button-border-color: var(--color-primary);
  --el-button-hover-bg-color: var(--color-primary-hover);
  --el-button-hover-border-color: var(--color-primary-hover);
  --el-button-active-bg-color: var(--color-primary-active);
  --el-button-active-border-color: var(--color-primary-active);
  color: #fff;
}
.btn-green-outline {
  --el-button-bg-color: transparent;
  --el-button-border-color: var(--color-primary);
  --el-button-text-color: var(--color-primary);
  --el-button-hover-bg-color: var(--color-primary-50);
  --el-button-hover-border-color: var(--color-primary-hover);
  --el-button-hover-text-color: var(--color-primary-hover);
  --el-button-active-bg-color: var(--color-primary-50);
  --el-button-active-border-color: var(--color-primary-active);
}
.btn-green-outline:disabled {
  --el-button-disabled-bg-color: transparent;
  --el-button-disabled-border-color: var(--color-border);
  --el-button-disabled-text-color: var(--color-text-muted);
}

/* ==================== 筛选区 ==================== */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: 0 0 var(--space-4);
  border-bottom: 1px solid var(--color-border-lighter);
  flex-wrap: wrap;
}
.filter-tabs {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  font-size: var(--font-sm);
  color: var(--color-text-body);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s;
  font-weight: var(--font-weight-regular);
}
.tab-btn:hover {
  background: var(--color-bg-page);
  color: var(--color-text-heading);
}
.tab-btn.active {
  background: var(--color-primary-50);
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}
.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 11px;
  font-weight: var(--font-weight-medium);
  color: #fff;
  background: var(--color-danger);
  border-radius: 8px;
}
.filter-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.filter-search {
  width: 180px;
}
.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.arrow-icon {
  transition: transform 0.2s;
  margin-left: 2px;
  font-size: 12px;
}
.arrow-icon.is-open {
  transform: rotate(180deg);
}
.popover-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.popover-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.popover-item label {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  min-width: 36px;
}
.popover-select {
  flex: 1;
}

/* ==================== 通知列表 ==================== */
.notification-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.notification-card {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-lighter);
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
}
.notification-card:hover {
  border-color: var(--color-primary-200);
  background: var(--color-primary-50);
}

/* 未读样式：轻量表达 */
.notification-card.is-unread {
  border-left: 3px solid var(--color-primary);
}
.notification-card.is-first-unread {
  background: var(--color-primary-50-light);
}
.notification-card.is-unread:not(.is-first-unread) {
  background: var(--color-bg-card);
}

.card-left { position: relative; flex-shrink: 0; }
.type-icon {
  width: 38px; height: 38px;
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
}
.unread-dot {
  position: absolute; top: -2px; right: -2px;
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--color-danger);
  border: 1.5px solid var(--color-bg-card);
}

.card-body { flex: 1; min-width: 0; }
.card-top-row { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-1); }
.type-badge { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: var(--font-xs); font-weight: var(--font-weight-medium); }
.biz-badge { display: inline-block; padding: 1px 5px; border-radius: 4px; font-size: 11px; color: var(--color-text-muted); background: var(--color-bg-page); }
.card-time { font-size: var(--font-xs); color: var(--color-text-muted-light); }
.card-title { font-size: var(--font-md); font-weight: var(--font-weight-medium); color: var(--color-text-heading); margin: 0 0 var(--space-1); line-height: 1.4; }
.is-unread .card-title { font-weight: 600; }
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
.is-unread .card-content {
  color: var(--color-text-secondary);
}

/* 右侧操作区：固定宽度，垂直居中 */
.card-right {
  flex-shrink: 0;
  width: 88px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.card-action {
  font-size: var(--font-sm);
  color: var(--color-primary);
  white-space: nowrap;
  font-weight: var(--font-weight-medium);
}
.notification-card:hover .card-action { color: var(--color-primary-hover); }

/* ==================== 空状态 ==================== */
.empty-state { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-10) 0; }
.empty-icon { opacity: 0.25; color: var(--color-text-muted); }
.empty-text { font-size: var(--font-md); color: var(--color-text-body); margin: 0; }
.empty-hint { font-size: var(--font-sm); color: var(--color-text-muted); margin: 0; }

/* ==================== 分页 ==================== */
.pagination-bar { display: flex; justify-content: center; padding-top: var(--space-3); border-top: 1px solid var(--color-border-lighter); }

/* ==================== 抽屉 ==================== */
.drawer-content { padding: 0 var(--space-2); }
.drawer-meta { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); }
.drawer-time { font-size: var(--font-xs); color: var(--color-text-muted-light); }
.drawer-title { font-size: var(--font-lg); font-weight: var(--font-weight-semibold); color: var(--color-text-heading); margin: 0 0 var(--space-5); line-height: 1.4; }
.drawer-body { font-size: var(--font-sm); color: var(--color-text-body); line-height: 1.8; margin-bottom: var(--space-8); }
.drawer-body p { margin: 0; }
.drawer-actions { display: flex; align-items: center; gap: var(--space-3); }
.delete-text-btn {
  margin-left: auto;
}

/* ==================== 响应式 ==================== */
@media (max-width: 768px) {
  .filter-bar { flex-direction: column; align-items: stretch; }
  .filter-actions { justify-content: flex-end; }
  .filter-search { width: 100%; }
  .notification-card { flex-direction: column; }
  .card-right { align-self: flex-end; width: auto; }
  .page-header { flex-direction: column; }
}
</style>
