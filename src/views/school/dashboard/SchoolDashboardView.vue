<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  User, OfficeBuilding, Files,
  DocumentChecked, Clock, ArrowRight, Lock,
  CircleCheck,
} from '@element-plus/icons-vue'
import { getSchoolDashboardAllApi } from '@/api/schoolDashboard'

defineOptions({ name: 'SchoolDashboardView' })

const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const overview = ref({
  staffCount: 0,
  studentCount: 0,
  teachingOrgCount: 0,
  serviceOrgCount: 0,
  pendingAuditCount: 0,
  pendingTraceCount: 0,
})
const auditForms = ref([])
const traceTasks = ref([])
const operationOverview = ref({
  formStatus: {},
  feedbackStatus: {},
  monthSubmissionCount: 0,
  totalSubmissionCount: 0,
})
const recentActivities = ref([])

// 核心指标卡
const metricCards = computed(() => [
  { key: 'staffCount', title: '教职工账号', value: overview.value.staffCount, icon: User, tone: 'default' },
  { key: 'studentCount', title: '学生账号', value: overview.value.studentCount, icon: User, tone: 'default' },
  { key: 'teachingOrgCount', title: '院系/教学组织', value: overview.value.teachingOrgCount, icon: OfficeBuilding, tone: 'default' },
  { key: 'serviceOrgCount', title: '服务部门', value: overview.value.serviceOrgCount, icon: OfficeBuilding, tone: 'default' },
  { key: 'pendingAuditCount', title: '待审核表单', value: overview.value.pendingAuditCount, icon: DocumentChecked, tone: 'warning' },
  { key: 'pendingTraceCount', title: '待追溯授权', value: overview.value.pendingTraceCount, icon: Lock, tone: 'warning' },
])

// 表单状态分布
const formStatusItems = computed(() => {
  const s = operationOverview.value.formStatus
  const total = (s.draft || 0) + (s.pending_review || 0) + (s.published || 0) + (s.rejected || 0) + (s.closed || 0)
  return [
    { label: '草稿', value: s.draft || 0, color: '#909399' },
    { label: '待审核', value: s.pending_review || 0, color: '#e6a23c' },
    { label: '已发布', value: s.published || 0, color: '#18a058' },
    { label: '已驳回', value: s.rejected || 0, color: '#f56c6c' },
    { label: '已关闭', value: s.closed || 0, color: '#909399' },
  ].map(item => ({
    ...item,
    percent: total > 0 ? Math.round((item.value / total) * 100) : 0,
  }))
})

// 反馈工单状态分布
const feedbackStatusItems = computed(() => {
  const s = operationOverview.value.feedbackStatus
  const total = (s.pending || 0) + (s.processing || 0) + (s.resolved || 0) + (s.rejected || 0) + (s.closed || 0)
  return [
    { label: '待处理', value: s.pending || 0, color: '#e6a23c' },
    { label: '处理中', value: s.processing || 0, color: '#409eff' },
    { label: '已解决', value: s.resolved || 0, color: '#18a058' },
    { label: '已驳回', value: s.rejected || 0, color: '#f56c6c' },
    { label: '已关闭', value: s.closed || 0, color: '#909399' },
  ].map(item => ({
    ...item,
    percent: total > 0 ? Math.round((item.value / total) * 100) : 0,
  }))
})

// 快捷入口
const quickEntries = [
  { title: '审核中心', desc: '审核评价表单发布申请', path: '/school/audit/list', icon: DocumentChecked },
  { title: '组织架构', desc: '管理院系与部门', path: '/school/org/departments', icon: OfficeBuilding },
  { title: '教职工管理', desc: '管理教职工账号', path: '/school/users/staff', icon: User },
  { title: '学生管理', desc: '管理学生账号', path: '/school/users/student', icon: User },
  { title: '评价表单', desc: '查看评价表单', path: '/school/form/list', icon: Files },
]

function formatTime(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${m}-${day} ${h}:${min}`
}

async function loadData() {
  loading.value = true
  try {
    const tenantId = userStore.tenantId
    if (!tenantId) return
    const data = await getSchoolDashboardAllApi(tenantId)
    overview.value = data.overview
    auditForms.value = data.auditForms.slice(0, 5)
    traceTasks.value = data.traceTasks.slice(0, 5)
    operationOverview.value = data.operationOverview
    recentActivities.value = data.recentActivities
  } catch (err) {
    console.error('学校首页数据加载失败:', err)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div v-loading="loading" class="school-dashboard">
    <!-- 页面标题区 -->
    <section class="page-header">
      <div class="header-info">
        <h1 class="page-title">学校管理端</h1>
        <p class="page-subtitle">统一管理本校组织、账号、评价审核与校园服务质量数据</p>
      </div>
    </section>

    <!-- 核心指标卡 -->
    <section class="metrics-grid">
      <div v-for="item in metricCards" :key="item.key" class="metric-card" :class="{ 'has-alert': item.tone === 'warning' && item.value > 0 }">
        <div class="metric-top">
          <el-icon :size="18" class="metric-icon" :class="`tone-${item.tone}`"><component :is="item.icon" /></el-icon>
          <span class="metric-value">{{ item.value }}</span>
        </div>
        <span class="metric-title">{{ item.title }}</span>
      </div>
    </section>

    <!-- 校级待办区 -->
    <section class="todo-section">
      <div class="todo-grid">
        <!-- 待审核评价表单 -->
        <div class="todo-card">
          <div class="todo-header">
            <h3 class="todo-title">
              <el-icon><DocumentChecked /></el-icon>
              待审核评价表单
              <el-badge v-if="auditForms.length" :value="auditForms.length" type="warning" />
            </h3>
            <el-button text type="primary" size="small" @click="router.push('/school/audit/list')">
              查看全部 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div class="todo-body">
            <template v-if="auditForms.length">
              <div v-for="item in auditForms" :key="item.id" class="todo-item">
                <div class="todo-item-row1">
                  <span class="todo-item-name">{{ item.form_title }}</span>
                  <el-tag size="small" effect="plain" class="type-tag">{{ item.form_type }}</el-tag>
                </div>
                <div class="todo-item-row2">
                  <span>提交人：{{ item.requester_name }}</span>
                  <span v-if="item.org_name">{{ item.org_name }}</span>
                  <span>{{ formatTime(item.requested_at) }}</span>
                  <el-button text type="primary" size="small" class="todo-action-btn" @click="router.push('/school/audit/list')">去审核</el-button>
                </div>
              </div>
            </template>
            <div v-else class="empty-hint">
              <el-icon :size="24"><CircleCheck /></el-icon>
              <span>暂无待审核表单</span>
            </div>
          </div>
        </div>

        <!-- 追溯授权申请 -->
        <div class="todo-card">
          <div class="todo-header">
            <h3 class="todo-title">
              <el-icon><Lock /></el-icon>
              追溯授权申请
              <el-badge v-if="traceTasks.length" :value="traceTasks.length" type="warning" />
            </h3>
            <el-button text type="primary" size="small" @click="router.push('/school/audit/list')">
              查看全部 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div class="todo-body">
            <template v-if="traceTasks.length">
              <div v-for="item in traceTasks" :key="item.id" class="todo-item">
                <div class="todo-item-row1">
                  <span class="todo-item-name">{{ item.appeal_no }}</span>
                  <el-tag size="small" type="warning" effect="plain">{{ item.status }}</el-tag>
                </div>
                <div class="todo-item-row2">
                  <span>申请人：{{ item.applicant_name }}</span>
                  <span>{{ formatTime(item.requested_at) }}</span>
                  <el-button text type="primary" size="small" class="todo-action-btn" @click="router.push('/school/audit/list')">查看</el-button>
                </div>
                <p class="todo-item-reason">{{ item.reason }}</p>
              </div>
              <div v-if="traceTasks.length < 3" class="empty-more-hint">暂无更多待办</div>
            </template>
            <div v-else class="empty-hint">
              <el-icon :size="24"><CircleCheck /></el-icon>
              <span>暂无待处理追溯授权</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 学校运行概览 -->
    <section class="overview-section">
      <h2 class="section-heading">学校运行概览</h2>
      <div class="overview-grid">
        <!-- 评价表单状态分布 -->
        <div class="overview-card">
          <h4 class="overview-card-title">评价表单状态分布</h4>
          <p class="overview-card-desc">当前学校已创建的评价表单统计</p>
          <div class="status-bars">
            <div v-for="item in formStatusItems" :key="item.label" class="status-bar-row">
              <span class="status-bar-label">{{ item.label }}</span>
              <div class="status-bar-track">
                <div class="status-bar-fill" :style="{ width: item.percent + '%', background: item.color }" />
              </div>
              <span class="status-bar-value">{{ item.value }}</span>
            </div>
          </div>
        </div>

        <!-- 反馈工单处理概览 -->
        <div class="overview-card">
          <h4 class="overview-card-title">反馈工单处理概览</h4>
          <p class="overview-card-desc">投诉建议与反馈工单的处理进度</p>
          <div class="status-bars">
            <div v-for="item in feedbackStatusItems" :key="item.label" class="status-bar-row">
              <span class="status-bar-label">{{ item.label }}</span>
              <div class="status-bar-track">
                <div class="status-bar-fill" :style="{ width: item.percent + '%', background: item.color }" />
              </div>
              <span class="status-bar-value">{{ item.value }}</span>
            </div>
          </div>
        </div>

        <!-- 评价提交统计 -->
        <div class="overview-card">
          <h4 class="overview-card-title">评价提交统计</h4>
          <p class="overview-card-desc">学生端评价提交数据汇总</p>
          <div class="submission-block">
            <div class="submission-row">
              <span class="submission-label">本月提交</span>
              <span class="submission-num">{{ operationOverview.monthSubmissionCount }}</span>
            </div>
            <div class="submission-row">
              <span class="submission-label">累计提交</span>
              <span class="submission-num">{{ operationOverview.totalSubmissionCount }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 快捷管理入口 -->
    <section class="quick-section">
      <h2 class="section-heading">快捷管理入口</h2>
      <div class="quick-grid">
        <div v-for="entry in quickEntries" :key="entry.path" class="quick-card" @click="router.push(entry.path)">
          <el-icon :size="20" class="quick-icon"><component :is="entry.icon" /></el-icon>
          <div class="quick-text">
            <h4 class="quick-title">{{ entry.title }}</h4>
            <p class="quick-desc">{{ entry.desc }}</p>
          </div>
          <el-icon class="quick-arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </section>

    <!-- 最近动态 -->
    <section class="activities-section">
      <h2 class="section-heading">最近动态</h2>
      <div class="activities-card">
        <template v-if="recentActivities.length">
          <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
            <el-tag size="small" effect="plain" class="activity-module">{{ activity.module }}</el-tag>
            <span class="activity-content">{{ activity.content }}</span>
            <span v-if="activity.operator_name" class="activity-operator">{{ activity.operator_name }}</span>
            <span class="activity-time">{{ formatTime(activity.created_at) }}</span>
          </div>
        </template>
        <div v-else class="empty-hint">
          <el-icon :size="24"><Clock /></el-icon>
          <span>暂无最近动态</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.school-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 1280px;
}

/* 页面标题区 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
}

.page-title {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-title);
  margin: 0;
  line-height: 1.3;
}

.page-subtitle {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  margin: 2px 0 0;
}

/* 核心指标卡 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--space-3);
}

.metric-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  border: 1px solid var(--color-border-light, #ebeef5);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  transition: border-color 0.2s;
}

.metric-card:hover {
  border-color: var(--color-primary-200, #b7e4c7);
}

.metric-card.has-alert {
  border-color: var(--color-warning-200, #f5dab1);
  background: #fffbf5;
}

.metric-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metric-icon {
  color: var(--color-text-secondary);
}

.tone-warning {
  color: var(--color-warning);
}

.metric-value {
  font-size: var(--font-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-title);
  line-height: 1;
}

.metric-title {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
}

/* 校级待办区 */
.todo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}

.todo-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  border: 1px solid var(--color-border-light, #ebeef5);
  overflow: hidden;
}

.todo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border-lighter, #f2f3f5);
}

.todo-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-title);
  margin: 0;
}

.todo-body {
  padding: var(--space-2) var(--space-4);
}

.todo-item {
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border-lighter, #f2f3f5);
}

.todo-item:last-child {
  border-bottom: none;
}

.todo-item-row1 {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: 4px;
}

.todo-item-name {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-title);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-tag {
  flex-shrink: 0;
}

.todo-item-row2 {
  display: flex;
  gap: var(--space-4);
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
}

.todo-item-reason {
  font-size: var(--font-xs);
  color: var(--color-text-body);
  margin: 4px 0 0;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.todo-action-btn {
  margin-left: auto;
  font-size: var(--font-xs);
  flex-shrink: 0;
}

.empty-more-hint {
  text-align: center;
  padding: var(--space-3) 0;
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
}

.empty-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-6) 0;
  color: var(--color-text-placeholder);
  font-size: var(--font-sm);
}

/* 学校运行概览 */
.section-heading {
  font-size: var(--font-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-title);
  margin: 0;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.overview-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  border: 1px solid var(--color-border-light, #ebeef5);
  padding: var(--space-4);
}

.overview-card-title {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-title);
  margin: 0;
}

.overview-card-desc {
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
  margin: 2px 0 var(--space-3);
}

.status-bars {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.status-bar-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.status-bar-label {
  width: 48px;
  font-size: var(--font-xs);
  color: var(--color-text-body);
  flex-shrink: 0;
  text-align: right;
}

.status-bar-track {
  flex: 1;
  height: 8px;
  background: var(--color-bg-light, #f5f7f5);
  border-radius: 4px;
  overflow: hidden;
}

.status-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
  min-width: 0;
}

.status-bar-value {
  width: 28px;
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-title);
  text-align: right;
  flex-shrink: 0;
}

.submission-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-2);
}

.submission-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.submission-label {
  font-size: var(--font-sm);
  color: var(--color-text-body);
}

.submission-num {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

/* 快捷管理入口 */
.quick-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-3);
}

.quick-card {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  border: 1px solid var(--color-border-light, #ebeef5);
  cursor: pointer;
  transition: all 0.15s;
}

.quick-card:hover {
  border-color: var(--color-primary-200, #b7e4c7);
  background: var(--color-primary-50, #f5faf5);
}

.quick-icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.quick-text {
  flex: 1;
  min-width: 0;
}

.quick-title {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-title);
  margin: 0;
}

.quick-desc {
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quick-arrow {
  color: var(--color-text-placeholder);
  flex-shrink: 0;
  font-size: var(--font-sm);
}

/* 最近动态 */
.activities-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  border: 1px solid var(--color-border-light, #ebeef5);
  padding: var(--space-3) var(--space-4);
}

.activity-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-border-lighter, #f2f3f5);
  font-size: var(--font-sm);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-module {
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
  color: var(--color-text-body);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-operator {
  color: var(--color-text-secondary);
  font-size: var(--font-xs);
  flex-shrink: 0;
}

.activity-time {
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
}

/* 响应式 */
@media (max-width: 1440px) {
  .metrics-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .quick-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1366px) {
  .metrics-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .todo-grid {
    grid-template-columns: 1fr;
  }
  .overview-grid {
    grid-template-columns: 1fr;
  }
  .quick-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
