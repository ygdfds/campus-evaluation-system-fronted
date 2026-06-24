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
  formStatusDistribution: {},
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

// 核心指标卡数据
const metricCards = computed(() => [
  { key: 'staffCount', title: '教职工账号', value: overview.value.staffCount, icon: User, color: 'primary' },
  { key: 'studentCount', title: '学生账号', value: overview.value.studentCount, icon: User, color: 'success' },
  { key: 'teachingOrgCount', title: '院系/教学组织', value: overview.value.teachingOrgCount, icon: OfficeBuilding, color: 'info' },
  { key: 'serviceOrgCount', title: '服务部门', value: overview.value.serviceOrgCount, icon: OfficeBuilding, color: 'warning' },
  { key: 'pendingAuditCount', title: '待审核表单', value: overview.value.pendingAuditCount, icon: DocumentChecked, color: 'danger' },
  { key: 'pendingTraceCount', title: '待追溯授权', value: overview.value.pendingTraceCount, icon: Lock, color: 'info' },
])

// 表单状态分布（中文标签）
const formStatusLabels = [
  { key: 'draft', label: '草稿' },
  { key: 'pending_review', label: '待审核' },
  { key: 'published', label: '已发布' },
  { key: 'rejected', label: '已驳回' },
  { key: 'closed', label: '已关闭' },
]

// 反馈工单状态分布（中文标签）
const feedbackStatusLabels = [
  { key: 'pending', label: '待处理' },
  { key: 'processing', label: '处理中' },
  { key: 'resolved', label: '已解决' },
  { key: 'rejected', label: '已驳回' },
  { key: 'closed', label: '已关闭' },
]

// 快捷管理入口
const quickEntries = [
  { title: '审核中心', desc: '审核评价表单发布申请', path: '/school/audit/list', icon: DocumentChecked, color: 'primary' },
  { title: '组织架构', desc: '管理院系与部门', path: '/school/org/departments', icon: OfficeBuilding, color: 'success' },
  { title: '教职工管理', desc: '管理教职工账号', path: '/school/users/staff', icon: User, color: 'info' },
  { title: '学生管理', desc: '管理学生账号', path: '/school/users/student', icon: User, color: 'warning' },
  { title: '表单管理', desc: '查看评价表单', path: '/school/form/list', icon: Files, color: 'danger' },
]

// 格式化时间
function formatTime(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${min}`
}

// 加载数据
async function loadData() {
  loading.value = true
  try {
    const tenantId = userStore.tenantId
    if (!tenantId) {
      console.warn('学校管理端：未获取到 tenant_id')
      return
    }
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
      <div class="header-left">
        <h1 class="page-title">学校管理端</h1>
        <p class="page-subtitle">统一管理本校组织、账号、评价审核与校园服务质量数据</p>
      </div>
      <div class="header-right">
        <div class="header-info">
          <span class="info-label">当前学校</span>
          <span class="info-value">{{ userStore.schoolName || '本校' }}</span>
        </div>
        <div class="header-info">
          <span class="info-label">租户范围</span>
          <span class="info-value">租户 #{{ userStore.tenantId || '-' }}</span>
        </div>
        <el-tag effect="plain" size="small" class="role-badge">学校管理员</el-tag>
      </div>
    </section>

    <!-- 核心指标区 -->
    <section class="metrics-grid">
      <div v-for="item in metricCards" :key="item.key" class="metric-card">
        <div class="metric-icon" :class="`icon-${item.color}`">
          <el-icon :size="22"><component :is="item.icon" /></el-icon>
        </div>
        <div class="metric-content">
          <span class="metric-value">{{ item.value }}</span>
          <span class="metric-title">{{ item.title }}</span>
        </div>
      </div>
    </section>

    <!-- 待办处理区 -->
    <section class="todo-section">
      <div class="todo-grid">
        <!-- 待审核评价表单 -->
        <div class="todo-card">
          <div class="todo-header">
            <h3 class="todo-title">
              <el-icon><DocumentChecked /></el-icon>
              待审核评价表单
            </h3>
            <el-button text type="primary" @click="router.push('/school/audit/list')">
              查看全部 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div class="todo-body">
            <template v-if="auditForms.length > 0">
              <div v-for="item in auditForms" :key="item.id" class="todo-item">
                <div class="todo-item-main">
                  <span class="todo-item-title">{{ item.form_title }}</span>
                  <el-tag size="small" effect="plain">{{ item.form_type }}</el-tag>
                </div>
                <div class="todo-item-meta">
                  <span>提交人：{{ item.requester_name }}</span>
                  <span>{{ formatTime(item.requested_at) }}</span>
                </div>
              </div>
            </template>
            <div v-else class="empty-state">
              <el-icon :size="32"><CircleCheck /></el-icon>
              <p>暂无待审核表单</p>
            </div>
          </div>
        </div>

        <!-- 追溯授权申请 -->
        <div class="todo-card">
          <div class="todo-header">
            <h3 class="todo-title">
              <el-icon><Lock /></el-icon>
              追溯授权申请
            </h3>
            <el-button text type="primary" @click="router.push('/school/audit/list')">
              查看全部 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div class="todo-body">
            <template v-if="traceTasks.length > 0">
              <div v-for="item in traceTasks" :key="item.id" class="todo-item">
                <div class="todo-item-main">
                  <span class="todo-item-title">{{ item.appeal_no }}</span>
                  <el-tag size="small" type="warning" effect="plain">{{ item.status }}</el-tag>
                </div>
                <div class="todo-item-meta">
                  <span>申请人：{{ item.applicant_name }}</span>
                  <span>{{ formatTime(item.requested_at) }}</span>
                </div>
                <p class="todo-item-reason">{{ item.reason }}</p>
              </div>
            </template>
            <div v-else class="empty-state">
              <el-icon :size="32"><CircleCheck /></el-icon>
              <p>暂无待处理追溯授权</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 学校运行概览区 -->
    <section class="overview-section">
      <h2 class="section-title">学校运行概览</h2>
      <div class="overview-grid">
        <!-- 评价表单状态分布 -->
        <div class="overview-card">
          <h4 class="card-subtitle">评价表单状态分布</h4>
          <div class="status-list">
            <div v-for="item in formStatusLabels" :key="item.key" class="status-item">
              <span class="status-label">{{ item.label }}</span>
              <span class="status-value">{{ operationOverview.formStatus[item.key] || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- 反馈工单处理概览 -->
        <div class="overview-card">
          <h4 class="card-subtitle">反馈工单处理概览</h4>
          <div class="status-list">
            <div v-for="item in feedbackStatusLabels" :key="item.key" class="status-item">
              <span class="status-label">{{ item.label }}</span>
              <span class="status-value">{{ operationOverview.feedbackStatus[item.key] || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- 本月评价提交 -->
        <div class="overview-card">
          <h4 class="card-subtitle">评价提交统计</h4>
          <div class="submission-stats">
            <div class="submission-item">
              <span class="submission-label">本月提交</span>
              <span class="submission-value">{{ operationOverview.monthSubmissionCount }}</span>
            </div>
            <div class="submission-item">
              <span class="submission-label">累计提交</span>
              <span class="submission-value">{{ operationOverview.totalSubmissionCount }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 快捷管理入口 -->
    <section class="quick-section">
      <h2 class="section-title">快捷管理入口</h2>
      <div class="quick-grid">
        <div v-for="entry in quickEntries" :key="entry.path" class="quick-card" @click="router.push(entry.path)">
          <div class="quick-icon" :class="`icon-${entry.color}`">
            <el-icon :size="24"><component :is="entry.icon" /></el-icon>
          </div>
          <div class="quick-content">
            <h4 class="quick-title">{{ entry.title }}</h4>
            <p class="quick-desc">{{ entry.desc }}</p>
          </div>
          <el-icon class="quick-arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </section>

    <!-- 最近动态 -->
    <section class="activities-section">
      <h2 class="section-title">最近动态</h2>
      <div class="activities-card">
        <template v-if="recentActivities.length > 0">
          <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
            <div class="activity-dot" />
            <div class="activity-content">
              <div class="activity-main">
                <el-tag size="small" effect="plain">{{ activity.module }}</el-tag>
                <span class="activity-action">{{ activity.action }}</span>
                <span class="activity-text">{{ activity.content }}</span>
              </div>
              <span class="activity-time">{{ formatTime(activity.created_at) }}</span>
            </div>
          </div>
        </template>
        <div v-else class="empty-state">
          <el-icon :size="32"><Clock /></el-icon>
          <p>暂无最近动态</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.school-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* 页面标题区 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: var(--font-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-title);
  margin: 0 0 var(--space-1);
}

.page-subtitle {
  font-size: var(--font-base);
  color: var(--color-text-secondary);
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-shrink: 0;
}

.header-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.info-label {
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
}

.info-value {
  font-size: var(--font-sm);
  color: var(--color-text-title);
  font-weight: var(--font-weight-medium);
}

.role-badge {
  background: var(--color-primary-50);
  color: var(--color-primary);
  border-color: var(--color-primary-200);
}

/* 核心指标区 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--space-4);
}

.metric-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.metric-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-primary { background: var(--color-primary-50); color: var(--color-primary); }
.icon-success { background: var(--color-success-50, #f0fdf4); color: var(--color-success); }
.icon-warning { background: var(--color-warning-50, #fffbeb); color: var(--color-warning); }
.icon-danger { background: var(--color-danger-50, #fef2f2); color: var(--color-danger); }
.icon-info { background: var(--color-info-50, #f0f9ff); color: var(--color-info, #0284c7); }

.metric-content {
  display: flex;
  flex-direction: column;
}

.metric-value {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-title);
  line-height: 1.2;
}

.metric-title {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
}

/* 待办处理区 */
.todo-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.todo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}

.todo-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.todo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border-light);
}

.todo-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-title);
  margin: 0;
}

.todo-body {
  padding: var(--space-3) var(--space-4);
}

.todo-item {
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border-lighter);
}

.todo-item:last-child {
  border-bottom: none;
}

.todo-item-main {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}

.todo-item-title {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-title);
}

.todo-item-meta {
  display: flex;
  gap: var(--space-4);
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
}

.todo-item-reason {
  font-size: var(--font-xs);
  color: var(--color-text-body);
  margin: var(--space-1) 0 0;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) 0;
  color: var(--color-text-placeholder);
  gap: var(--space-2);
}

.empty-state p {
  margin: 0;
  font-size: var(--font-sm);
}

/* 学校运行概览区 */
.overview-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.section-title {
  font-size: var(--font-lg);
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
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
}

.card-subtitle {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-title);
  margin: 0 0 var(--space-3);
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-1) 0;
}

.status-label {
  font-size: var(--font-sm);
  color: var(--color-text-body);
}

.status-value {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-title);
}

.submission-stats {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.submission-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.submission-label {
  font-size: var(--font-sm);
  color: var(--color-text-body);
}

.submission-value {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

/* 快捷管理入口 */
.quick-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-4);
}

.quick-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: all 0.2s;
}

.quick-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover, 0 8px 24px rgba(0, 0, 0, 0.08));
}

.quick-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.quick-content {
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
}

/* 最近动态 */
.activities-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.activities-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
}

.activity-item {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border-lighter);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  margin-top: 6px;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
}

.activity-main {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.activity-action {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-title);
}

.activity-text {
  font-size: var(--font-sm);
  color: var(--color-text-body);
}

.activity-time {
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
  white-space: nowrap;
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

@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
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

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }
  .header-right {
    align-self: flex-start;
  }
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  .quick-grid {
    grid-template-columns: 1fr;
  }
}
</style>
