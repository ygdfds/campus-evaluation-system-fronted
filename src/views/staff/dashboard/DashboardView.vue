<script setup>
import { ref, onMounted, onActivated, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  Document, ChatLineSquare, Timer, Warning,
  ArrowRight, Clock, CircleCheck,
} from '@element-plus/icons-vue'
import {
  getStaffTodoStatsApi,
  getStaffActiveWindowsApi,
  getStaffPendingFeedbackApi,
  getStaffPendingAppealsApi,
  getStaffEvalSummaryApi,
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

    const [todoRes, windowsRes, feedbackRes, appealsRes, summaryRes] = await Promise.all([
      getStaffTodoStatsApi(tid).catch(() => ({ pendingForms: 0, pendingFeedback: 0, activeWindows: 0, pendingAppeals: 0 })),
      getStaffActiveWindowsApi(tid).catch(() => []),
      getStaffPendingFeedbackApi(tid).catch(() => []),
      getStaffPendingAppealsApi(tid).catch(() => []),
      getStaffEvalSummaryApi(tid).catch(() => ({ monthCount: 0, avgScore: 0, participationRate: 0, lowScoreCount: 0 })),
    ])

    todoStats.value = todoRes
    activeWindows.value = windowsRes
    pendingFeedback.value = feedbackRes
    pendingAppeals.value = appealsRes
    evalSummary.value = summaryRes
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
  <div v-loading="loading" class="dashboard">
    <!-- 1. 欢迎区 -->
    <div class="welcome">
      <div>
        <span class="page-kicker">Staff workspace</span>
        <h1 class="welcome-title">职工工作台</h1>
        <p class="welcome-desc">处理评价发布、反馈跟进与授权范围内的服务质量数据。</p>
      </div>
    </div>

    <!-- 2. 指标条 -->
    <div class="metrics">
      <div
        v-for="item in todoItems"
        :key="item.key"
        class="metric"
        :class="{ 'metric--warn': item.key === highlightKey }"
        @click="router.push(item.link)"
      >
        <span class="metric-val">{{ item.count }}</span>
        <span class="metric-label">{{ item.title }}</span>
      </div>
    </div>

    <!-- 3. 主网格：左内容 + 右辅助 -->
    <div class="main-grid">
      <div class="col-left">
        <!-- 3a. 进行中的评价窗口 -->
        <section class="panel">
          <div class="panel-hd">
            <h3 class="panel-title">
              <el-icon><Timer /></el-icon>
              进行中的评价窗口
              <el-badge v-if="activeWindows.length" :value="activeWindows.length" type="warning" />
            </h3>
            <el-button text type="primary" size="small" @click="router.push('/staff/evaluation/forms')">
              全部 <el-icon :size="14"><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div class="panel-bd panel-bd--windows">
            <template v-if="activeWindows.length">
              <div v-for="win in activeWindows" :key="win.id" class="win-row">
                <div class="win-r1">
                  <span class="win-name">{{ win.form_title }}</span>
                  <el-tag size="small" effect="plain">{{ windowTypeMap[win.form_type] || win.form_type || '评价' }}</el-tag>
                </div>
                <div class="win-r2">
                  <span class="win-meta">
                    <el-icon :size="12"><Clock /></el-icon>
                    {{ formatDate(win.start_at) }} ~ {{ formatDate(win.end_at) }}
                  </span>
                  <span class="win-stat">参与 <strong>{{ win.submission_count }}</strong> 人</span>
                  <el-tag :type="statusTypeMap[win.status] || 'info'" size="small" effect="plain">
                    {{ win.status === 'open' ? '进行中' : win.status }}
                  </el-tag>
                </div>
              </div>
            </template>
            <div v-else class="empty-sm">
              <el-icon :size="20"><CircleCheck /></el-icon>
              <span>暂无进行中的评价窗口</span>
            </div>
          </div>
        </section>

        <!-- 3b. 待处理反馈 -->
        <section class="panel">
          <div class="panel-hd">
            <h3 class="panel-title">
              <el-icon><ChatLineSquare /></el-icon>
              待处理反馈
              <el-badge v-if="pendingFeedback.length" :value="pendingFeedback.length" type="warning" />
            </h3>
            <el-button text type="primary" size="small" @click="router.push('/staff/feedback')">
              全部 <el-icon :size="14"><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div class="panel-bd panel-bd--feedback">
            <template v-if="pendingFeedback.length">
              <div v-for="item in pendingFeedback" :key="item.id" class="fb-row">
                <div class="fb-r1">
                  <span class="fb-name">{{ item.title }}</span>
                  <el-tag size="small" effect="plain">{{ item.type }}</el-tag>
                </div>
                <div class="fb-r2">
                  <span class="fb-meta">{{ item.target_name }}</span>
                  <el-tag :type="statusTypeMap[item.status_code] || 'info'" size="small" effect="plain">{{ item.status }}</el-tag>
                  <span class="fb-time">{{ formatTime(item.latest_process_time) }}</span>
                </div>
              </div>
            </template>
            <div v-else class="empty-sm">
              <el-icon :size="20"><CircleCheck /></el-icon>
              <span>暂无待处理反馈</span>
            </div>
          </div>
        </section>
      </div>

      <div class="col-right">
        <!-- 右侧：评价概览 -->
        <section class="panel">
          <div class="panel-hd">
            <h3 class="panel-title">评价概览</h3>
            <span class="panel-hint">基于当前授权范围</span>
          </div>
          <div class="panel-bd panel-bd--summary">
            <div class="summary-grid">
              <div class="summary-cell">
                <span class="summary-val">{{ evalSummary.monthCount }}</span>
                <span class="summary-lbl">本月评价</span>
              </div>
              <div class="summary-cell">
                <span class="summary-val">{{ evalSummary.avgScore }}</span>
                <span class="summary-lbl">平均评分</span>
              </div>
              <div class="summary-cell">
                <span class="summary-val">{{ evalSummary.participationRate }}%</span>
                <span class="summary-lbl">参与率</span>
              </div>
              <div class="summary-cell">
                <span class="summary-val" :class="{ 'is-warn': evalSummary.lowScoreCount > 0 }">{{ evalSummary.lowScoreCount }}</span>
                <span class="summary-lbl">低分预警</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 右侧：待处理申诉 -->
        <section class="panel">
          <div class="panel-hd">
            <h3 class="panel-title">
              <el-icon><Warning /></el-icon>
              待处理申诉
              <el-badge v-if="pendingAppeals.length" :value="pendingAppeals.length" type="warning" />
            </h3>
            <el-button text type="primary" size="small" @click="router.push('/staff/appeals')">
              全部 <el-icon :size="14"><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div class="panel-bd panel-bd--appeals">
            <template v-if="pendingAppeals.length">
              <div v-for="item in pendingAppeals" :key="item.id" class="ap-row">
                <div class="ap-r1">
                  <span class="ap-name">{{ item.form_title }}</span>
                  <el-tag :type="statusTypeMap[item.status_code] || 'info'" size="small" effect="plain">{{ item.status }}</el-tag>
                </div>
                <div class="ap-r2">
                  <span class="ap-reason">{{ item.reason }}</span>
                  <span class="ap-time">{{ formatTime(item.updated_at) }}</span>
                </div>
              </div>
            </template>
            <div v-else class="empty-sm">
              <el-icon :size="20"><CircleCheck /></el-icon>
              <span>暂无待处理申诉</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 1480px;
  margin-inline: auto;
}

/* ==================== 欢迎区 ==================== */
.welcome {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  min-height: 48px;
  padding: 0 0 var(--space-1);
}

.page-kicker {
  display: block;
  font-size: var(--font-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-placeholder);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: var(--space-1);
}

.welcome-title {
  margin: 0;
  color: var(--color-text-heading);
  font-family: var(--font-family-display);
  font-size: var(--font-3xl);
  font-weight: var(--font-weight-display);
  line-height: var(--line-height-tight);
  letter-spacing: 0;
}

.welcome-desc {
  max-width: 760px;
  margin: var(--space-1) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  line-height: var(--line-height-normal);
}

/* ==================== 指标条 ==================== */
.metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  background: var(--color-border-lighter);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.metric {
  min-height: 88px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--color-bg-card);
  position: relative;
  cursor: pointer;
  transition: background 0.16s;
}

.metric::before {
  content: '';
  position: absolute;
  left: 0;
  top: 18px;
  bottom: 18px;
  width: 3px;
  border-radius: var(--radius-full);
  background: var(--color-border-light);
}

.metric:hover { background: var(--color-bg-page); }

.metric--warn::before { background: var(--color-warning); }

.metric-val {
  color: var(--color-text-heading);
  font-family: var(--font-family-data);
  font-size: 28px;
  font-weight: var(--font-weight-bold);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.metric-label {
  color: var(--color-text-secondary);
  font-size: var(--font-xs);
}

/* ==================== 主网格 ==================== */
.main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: var(--space-5);
  align-items: start;
}

.col-left,
.col-right {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
}

/* ==================== Panel 系统 ==================== */
.panel {
  overflow: hidden;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.panel-hd {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 48px;
  padding: 0 var(--space-5);
  border-bottom: 1px solid var(--color-border-lighter);
  background: linear-gradient(180deg, #fff, var(--color-bg-subtle));
}

.panel-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  color: var(--color-text-heading);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
}

.panel-hint {
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
}

.panel-bd {
  padding: var(--space-3) var(--space-5);
}

.panel-bd--windows { min-height: 160px; }
.panel-bd--feedback { min-height: 160px; }
.panel-bd--summary { padding: var(--space-3) var(--space-4); }
.panel-bd--appeals { min-height: 120px; }

/* ==================== 行项目通用 ==================== */
.win-row,
.fb-row,
.ap-row {
  padding: var(--space-3);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-lg);
  background: #FBFCFF;
  cursor: pointer;
  transition: background 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
}

.win-row + .win-row,
.fb-row + .fb-row,
.ap-row + .ap-row {
  margin-top: var(--space-2);
}

.win-row:hover,
.fb-row:hover,
.ap-row:hover {
  border-color: var(--color-primary-100);
  background: var(--color-primary-50);
  box-shadow: 0 4px 12px rgba(16, 24, 40, 0.05);
}

/* 行内两行布局 */
.win-r1, .win-r2,
.fb-r1, .fb-r2,
.ap-r1, .ap-r2 {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.win-r1, .fb-r1, .ap-r1 {
  margin-bottom: var(--space-1);
}

.win-r2, .fb-r2, .ap-r2 {
  justify-content: space-between;
}

/* 名称 */
.win-name, .fb-name, .ap-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--color-text-heading);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 元信息 */
.win-meta, .fb-meta, .ap-reason {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: var(--font-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.win-stat {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.win-stat strong {
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.fb-time, .ap-time {
  color: var(--color-text-muted-light);
  font-size: var(--font-xs);
  flex-shrink: 0;
  white-space: nowrap;
}

/* ==================== Tag 样式覆盖 ==================== */
.win-row :deep(.el-tag),
.fb-row :deep(.el-tag),
.ap-row :deep(.el-tag) {
  --el-tag-bg-color: #F6F8FC;
  --el-tag-border-color: var(--color-border-light);
  --el-tag-text-color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.win-row:hover :deep(.el-tag),
.fb-row:hover :deep(.el-tag),
.ap-row:hover :deep(.el-tag) {
  --el-tag-bg-color: rgba(255, 255, 255, 0.72);
}

/* ==================== 评价概览 ==================== */
.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}

.summary-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: var(--space-3);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-lg);
  background: #FBFCFF;
}

.summary-val {
  color: var(--color-text-heading);
  font-family: var(--font-family-data);
  font-size: 24px;
  font-weight: var(--font-weight-bold);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.summary-val.is-warn { color: var(--color-danger); }

.summary-lbl {
  color: var(--color-text-muted);
  font-size: var(--font-xs);
}

/* ==================== 空状态 ==================== */
.empty-sm {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  color: var(--color-text-placeholder);
  font-size: var(--font-sm);
}

/* ==================== 响应式 ==================== */
@media (max-width: 1280px) {
  .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .main-grid { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .welcome { align-items: flex-start; flex-direction: column; }
  .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .summary-grid { grid-template-columns: 1fr; }
}
</style>
