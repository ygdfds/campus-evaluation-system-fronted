<script setup>
import { ref, onMounted, onActivated, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  Document, ChatLineSquare, Timer, Warning,
  ArrowRight, Clock,
} from '@element-plus/icons-vue'
import {
  getStaffTodoStatsApi,
  getStaffActiveWindowsApi,
  getStaffPendingFeedbackApi,
  getStaffPendingAppealsApi,
  getStaffEvalSummaryApi,
  getStaffRecentActivitiesApi,
} from '@/api/staffDashboard'

defineOptions({ name: 'StaffDashboardView' })

const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const todoStats = ref({ pendingForms: 0, pendingFeedback: 0, activeWindows: 0, pendingAppeals: 0 })
const activeWindows = ref([])
const pendingFeedback = ref([])
const pendingAppeals = ref([])
const evalSummary = ref({ monthCount: 0, avgScore: 0, participationRate: 0, lowScoreCount: 0 })
const recentActivities = ref([])

const statusTypeMap = {
  pending: 'warning', processing: '', resolved: 'success',
  rejected: 'danger', cancelled: 'info', open: 'success', closed: 'info',
}

const windowTypeMap = {
  teaching: '教学评价', service: '后勤服务评价', instant: '即时评价',
}

// 待办项中最重要的项高亮
const highlightKey = computed(() => {
  if (todoStats.value.pendingFeedback > 0) return 'pendingFeedback'
  if (todoStats.value.pendingAppeals > 0) return 'pendingAppeals'
  if (todoStats.value.pendingForms > 0) return 'pendingForms'
  return ''
})

const todoItems = computed(() => [
  {
    key: 'pendingForms',
    count: todoStats.value.pendingForms,
    title: '待提交审核表单',
    desc: '需要审核或发布的评价表单',
    icon: Document,
    iconClass: 'icon-blue',
    link: '/staff/evaluation/forms?status=draft',
  },
  {
    key: 'pendingFeedback',
    count: todoStats.value.pendingFeedback,
    title: '待处理反馈',
    desc: '待跟进的投诉建议与反馈工单',
    icon: ChatLineSquare,
    iconClass: 'icon-orange',
    link: '/staff/feedback?status=pending',
  },
  {
    key: 'activeWindows',
    count: todoStats.value.activeWindows,
    title: '进行中评价窗口',
    desc: '当前正在运行的评价窗口',
    icon: Timer,
    iconClass: 'icon-green',
    link: '/staff/evaluation/forms?status=active',
  },
  {
    key: 'pendingAppeals',
    count: todoStats.value.pendingAppeals,
    title: '待处理申诉',
    desc: '学生提交的评价申诉',
    icon: Warning,
    iconClass: 'icon-red',
    link: '/staff/appeals?status=pending',
  },
])

async function loadDashboardData() {
  loading.value = true
  try {
    const tid = userStore.tenantId
    if (!tid) return

    const [todoRes, windowsRes, feedbackRes, appealsRes, summaryRes, activitiesRes] = await Promise.all([
      getStaffTodoStatsApi(tid).catch(() => ({ pendingForms: 0, pendingFeedback: 0, activeWindows: 0, pendingAppeals: 0 })),
      getStaffActiveWindowsApi(tid).catch(() => []),
      getStaffPendingFeedbackApi(tid).catch(() => []),
      getStaffPendingAppealsApi(tid).catch(() => []),
      getStaffEvalSummaryApi(tid).catch(() => ({ monthCount: 0, avgScore: 0, participationRate: 0, lowScoreCount: 0 })),
      getStaffRecentActivitiesApi(tid, userStore.userInfo?.id).catch(() => []),
    ])

    todoStats.value = todoRes
    activeWindows.value = windowsRes
    pendingFeedback.value = feedbackRes
    pendingAppeals.value = appealsRes
    evalSummary.value = summaryRes
    recentActivities.value = activitiesRes
  } catch (e) {
    console.error('加载职工工作台数据失败:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})

// 支持 keep-alive 场景下重新进入时刷新数据
onActivated(() => {
  loadDashboardData()
})

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatTime(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<template>
  <div v-loading="loading" class="staff-dashboard">
    <!-- 1. 页面标题区 -->
    <div class="page-header">
      <h1 class="page-title">职工工作台</h1>
      <p class="page-subtitle">处理评价发布、反馈跟进与授权范围内的服务质量数据</p>
    </div>

    <!-- 2. 今日待办卡片 -->
    <div class="todo-row">
      <div
        v-for="item in todoItems"
        :key="item.key"
        class="todo-card"
        :class="{ 'is-highlighted': item.key === highlightKey }"
        @click="router.push(item.link)"
      >
        <div class="todo-icon" :class="item.iconClass">
          <el-icon :size="24"><component :is="item.icon" /></el-icon>
        </div>
        <div class="todo-info">
          <span class="todo-count">{{ item.count }}</span>
          <span class="todo-title">{{ item.title }}</span>
          <span class="todo-desc">{{ item.desc }}</span>
        </div>
        <el-icon class="todo-arrow" :size="14"><ArrowRight /></el-icon>
      </div>
    </div>

    <!-- 3. 业务区 -->
    <div class="biz-area">
        <!-- 3a. 进行中的评价窗口 -->
        <div class="section-card">
          <div class="section-header">
            <h3 class="section-title">进行中的评价窗口</h3>
            <el-button text size="small" @click="router.push('/staff/evaluation/forms')">
              查看全部 <el-icon :size="14"><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div v-if="activeWindows.length === 0" class="empty-tip">暂无进行中的评价窗口</div>
          <div v-else class="window-list">
            <div v-for="win in activeWindows" :key="win.id" class="window-row">
              <div class="window-thumb">
                <img v-if="win.cover_url" :src="win.cover_url" :alt="win.form_title" class="window-thumb-img" />
                <div v-else class="window-thumb-placeholder">
                  <el-icon :size="20"><Document /></el-icon>
                </div>
              </div>
              <div class="window-body">
                <div class="window-title-row">
                  <span class="window-title">{{ win.form_title }}</span>
                  <el-tag size="small" effect="plain">{{ windowTypeMap[win.form_type] || win.form_type || '评价' }}</el-tag>
                </div>
                <div class="window-time">
                  <el-icon :size="13"><Clock /></el-icon>
                  {{ formatDate(win.start_at) }} ~ {{ formatDate(win.end_at) }}
                </div>
              </div>
              <div class="window-stats-col">
                <div class="window-stat">参与 <strong>{{ win.submission_count }}</strong> 人</div>
                <el-tag :type="statusTypeMap[win.status] || 'info'" size="small" effect="plain">
                  {{ win.status === 'open' ? '进行中' : win.status }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 3b. 待处理反馈 -->
        <div class="section-card">
          <div class="section-header">
            <h3 class="section-title">待处理反馈</h3>
            <el-button text size="small" @click="router.push('/staff/feedback')">
              查看全部 <el-icon :size="14"><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div v-if="pendingFeedback.length === 0" class="empty-tip">暂无待处理反馈</div>
          <div v-else class="feedback-list">
            <div v-for="item in pendingFeedback" :key="item.id" class="feedback-row">
              <div class="feedback-main">
                <span class="feedback-title">{{ item.title }}</span>
                <el-tag size="small" effect="plain">{{ item.type }}</el-tag>
              </div>
              <div class="feedback-target">{{ item.target_name }}</div>
              <div class="feedback-meta">
                <el-tag :type="statusTypeMap[item.status_code] || 'info'" size="small" effect="plain">{{ item.status }}</el-tag>
                <span class="feedback-time">{{ formatTime(item.latest_process_time) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3c. 待处理申诉 -->
        <div v-if="pendingAppeals.length > 0" class="section-card">
          <div class="section-header">
            <h3 class="section-title">待处理申诉</h3>
            <el-button text size="small" @click="router.push('/staff/appeals')">
              查看全部 <el-icon :size="14"><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div v-if="pendingAppeals.length === 0" class="empty-tip">暂无待处理申诉</div>
          <div v-else class="appeal-list">
            <div v-for="item in pendingAppeals" :key="item.id" class="appeal-row">
              <div class="appeal-main">
                <span class="appeal-form-title">{{ item.form_title }}</span>
                <span class="appeal-reason">{{ item.reason }}</span>
              </div>
              <div class="appeal-meta">
                <el-tag :type="statusTypeMap[item.status_code] || 'info'" size="small" effect="plain">{{ item.status }}</el-tag>
                <span class="appeal-time">{{ formatTime(item.updated_at) }}</span>
              </div>
            </div>
          </div>
        </div>
    </div>

    <!-- 4. 评价概览 -->
    <div class="section-card">
      <div class="section-header">
        <h3 class="section-title">本部门 / 本学院评价概览</h3>
        <span class="section-hint">基于当前授权范围统计</span>
      </div>
      <div class="summary-row">
        <div class="summary-item">
          <span class="summary-value">{{ evalSummary.monthCount }}</span>
          <span class="summary-label">本月评价数</span>
          <span class="summary-desc">授权范围内本月提交的评价总数</span>
        </div>
        <div class="summary-item">
          <span class="summary-value">{{ evalSummary.avgScore }}</span>
          <span class="summary-label">平均评分</span>
          <span class="summary-desc">所有评价指标得分的平均值</span>
        </div>
        <div class="summary-item">
          <span class="summary-value">{{ evalSummary.participationRate }}%</span>
          <span class="summary-label">参与率</span>
          <span class="summary-desc">已参与学生占应参与学生的比例</span>
        </div>
        <div class="summary-item">
          <span class="summary-value" :class="{ 'is-warning': evalSummary.lowScoreCount > 0 }">{{ evalSummary.lowScoreCount }}</span>
          <span class="summary-label">低分预警</span>
          <span class="summary-desc">评分 ≤ 2 分的评价条目数</span>
        </div>
      </div>
    </div>

    <!-- 5. 最近处理记录 -->
    <div class="section-card">
      <div class="section-header">
        <h3 class="section-title">最近处理记录</h3>
      </div>
      <div v-if="recentActivities.length === 0" class="empty-tip compact">暂无处理记录</div>
      <div v-else class="timeline">
        <div v-for="item in recentActivities" :key="item.id" class="timeline-item">
          <div class="timeline-dot" :class="[`dot-${item.type}`, item.actionColor && `dot-${item.actionColor}`]" />
          <div class="timeline-content">
            <div class="timeline-main">
              <span class="timeline-action" :class="item.actionColor && `action-${item.actionColor}`">{{ item.action }}</span>
              <span class="timeline-title">{{ item.title }}</span>
            </div>
            <div v-if="item.content" class="timeline-desc">{{ item.content }}</div>
            <span class="timeline-time">{{ formatTime(item.time) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.staff-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

/* ==================== 1. 页面标题 ==================== */
.page-header {
  padding: var(--space-2) 0;
}

.page-title {
  font-size: var(--font-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
  margin: 0;
  line-height: var(--line-height-tight);
}

.page-subtitle {
  font-size: var(--font-sm);
  color: var(--color-text-muted);
  margin: var(--space-1) 0 0;
}

/* ==================== 2. 待办事项 ==================== */
.todo-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
}

.todo-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  min-height: 96px;
}

.todo-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary-100);
}

.todo-card.is-highlighted {
  border-color: var(--color-accent-user-700);
  background: var(--color-primary-50);
}

.todo-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-blue { background: var(--color-primary-50); color: var(--color-accent-user-700); }
.icon-orange { background: var(--color-warning-light); color: var(--color-warning); }
.icon-green { background: var(--color-success-light); color: var(--color-success); }
.icon-red { background: var(--color-danger-light); color: var(--color-danger); }

.todo-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.todo-count {
  font-size: var(--font-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
  line-height: var(--line-height-tight);
}

.todo-title { font-size: var(--font-sm); color: var(--color-text-body); font-weight: var(--font-weight-medium); }
.todo-desc { font-size: var(--font-xs); color: var(--color-text-placeholder); }
.todo-arrow { color: var(--color-text-placeholder); flex-shrink: 0; }

/* ==================== 3. 业务区 ==================== */
.biz-area {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.section-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--card-section-padding);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-base);
}

.section-title {
  font-size: var(--font-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
  margin: 0;
}

.section-hint {
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
}

.empty-tip {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--color-text-muted);
  font-size: var(--font-sm);
}

.empty-tip.compact {
  padding: var(--space-5) 0;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 评价窗口列表 */
.window-list { display: flex; flex-direction: column; }

.window-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-bottom: var(--border-lighter);
  transition: background 0.15s;
  border-radius: var(--radius-md);
}

.window-row:last-child { border-bottom: none; }
.window-row:hover { background: var(--color-bg-primary-hover); }

.window-thumb {
  width: 88px;
  height: 64px;
  border-radius: var(--radius-md);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--color-bg-page-alt);
}

.window-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.window-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-placeholder);
  opacity: 0.5;
}

.window-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.window-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.window-title {
  font-size: var(--font-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-heading);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.window-time {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-xs);
  color: var(--color-text-muted);
}

.window-stats-col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-1);
  flex-shrink: 0;
}

.window-stat { font-size: var(--font-sm); color: var(--color-text-muted); }
.window-stat strong { color: var(--color-accent-user-700); font-weight: var(--font-weight-semibold); }

/* 反馈列表 */
.feedback-list { display: flex; flex-direction: column; }

.feedback-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 48px;
  padding: var(--space-2) var(--space-3);
  border-bottom: var(--border-lighter);
  transition: background 0.15s;
  border-radius: var(--radius-md);
}

.feedback-row:last-child { border-bottom: none; }
.feedback-row:hover { background: var(--color-bg-primary-hover); }

.feedback-main {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  min-width: 0;
}

.feedback-title {
  font-size: var(--font-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-heading);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feedback-target {
  font-size: var(--font-sm);
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.feedback-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.feedback-time { font-size: var(--font-xs); color: var(--color-text-muted-light); }

/* 申诉列表 */
.appeal-list { display: flex; flex-direction: column; }

.appeal-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-bottom: var(--border-lighter);
  transition: background 0.15s;
  border-radius: var(--radius-md);
}

.appeal-row:last-child { border-bottom: none; }
.appeal-row:hover { background: var(--color-bg-primary-hover); }

.appeal-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.appeal-form-title {
  font-size: var(--font-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-heading);
}

.appeal-reason {
  font-size: var(--font-sm);
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.appeal-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-1);
  flex-shrink: 0;
}

.appeal-time { font-size: var(--font-xs); color: var(--color-text-muted-light); }

/* ==================== 4. 评价概览 ==================== */
.summary-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-4) var(--space-2);
  background: var(--color-bg-page-alt);
  border-radius: var(--radius-md);
}

.summary-value {
  font-size: var(--font-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
  line-height: var(--line-height-tight);
}

.summary-value.is-warning { color: var(--color-danger); }
.summary-label { font-size: var(--font-xs); color: var(--color-text-muted); font-weight: var(--font-weight-medium); }
.summary-desc { font-size: 11px; color: var(--color-text-placeholder); text-align: center; line-height: var(--line-height-relaxed); }

/* ==================== 5. 处理记录时间线 ==================== */
.timeline { display: flex; flex-direction: column; }

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: var(--border-lighter);
}

.timeline-item:last-child { border-bottom: none; }

.timeline-dot {
  width: var(--space-2);
  height: var(--space-2);
  border-radius: var(--radius-full);
  background: var(--color-accent-user-700);
  flex-shrink: 0;
  margin-top: var(--space-1);
}

.timeline-dot.dot-notification { background: var(--color-info); }
.timeline-dot.dot-audit { background: var(--color-warning); }
.timeline-dot.dot-success { background: var(--color-primary); }
.timeline-dot.dot-danger { background: var(--color-danger); }
.timeline-dot.dot-muted { background: var(--color-text-muted); }
.timeline-dot.dot-info { background: var(--color-info); }
.timeline-dot.dot-warning { background: var(--color-warning); }

.timeline-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.timeline-main {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

.timeline-action {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-accent-user-700);
  flex-shrink: 0;
}

.timeline-action.action-success { color: var(--color-primary); }
.timeline-action.action-danger { color: var(--color-danger); }
.timeline-action.action-muted { color: var(--color-text-muted); }
.timeline-action.action-info { color: var(--color-info); }
.timeline-action.action-warning { color: var(--color-warning); }

.timeline-title {
  font-size: var(--font-base);
  color: var(--color-text-heading);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeline-desc {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeline-time {
  font-size: var(--font-sm);
  color: var(--color-text-muted-light);
  flex-shrink: 0;
  align-self: flex-start;
}

/* ==================== 响应式 ==================== */
@media (max-width: 900px) {
  .todo-row { grid-template-columns: repeat(2, 1fr); }
  .summary-row { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 600px) {
  .todo-row { grid-template-columns: 1fr; }
  .summary-row { grid-template-columns: repeat(2, 1fr); }
}
</style>
