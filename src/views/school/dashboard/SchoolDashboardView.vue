<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  User, OfficeBuilding,
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

const metricCards = computed(() => [
  { key: 'staffCount', title: '教职工账号', value: overview.value.staffCount, icon: User, tone: 'default' },
  { key: 'studentCount', title: '学生账号', value: overview.value.studentCount, icon: User, tone: 'default' },
  { key: 'teachingOrgCount', title: '院系/教学组织', value: overview.value.teachingOrgCount, icon: OfficeBuilding, tone: 'default' },
  { key: 'serviceOrgCount', title: '服务部门', value: overview.value.serviceOrgCount, icon: OfficeBuilding, tone: 'default' },
  { key: 'pendingAuditCount', title: '待审核表单', value: overview.value.pendingAuditCount, icon: DocumentChecked, tone: 'warning' },
  { key: 'pendingTraceCount', title: '待追溯授权', value: overview.value.pendingTraceCount, icon: Lock, tone: 'warning' },
])

const formStatusItems = computed(() => {
  const s = operationOverview.value.formStatus
  const total = (s.draft || 0) + (s.pending_review || 0) + (s.published || 0) + (s.rejected || 0) + (s.closed || 0)
  return [
    { label: '草稿', value: s.draft || 0, color: 'var(--color-info)' },
    { label: '待审核', value: s.pending_review || 0, color: 'var(--color-warning)' },
    { label: '已发布', value: s.published || 0, color: 'var(--color-success)' },
    { label: '已驳回', value: s.rejected || 0, color: 'var(--color-danger)' },
    { label: '已关闭', value: s.closed || 0, color: 'var(--color-text-muted-light)' },
  ].map(item => ({
    ...item,
    percent: total > 0 ? Math.round((item.value / total) * 100) : 0,
  }))
})

const feedbackStatusItems = computed(() => {
  const s = operationOverview.value.feedbackStatus
  const total = (s.pending || 0) + (s.processing || 0) + (s.resolved || 0) + (s.rejected || 0) + (s.closed || 0)
  return [
    { label: '待处理', value: s.pending || 0, color: 'var(--color-warning)' },
    { label: '处理中', value: s.processing || 0, color: 'var(--color-primary)' },
    { label: '已解决', value: s.resolved || 0, color: 'var(--color-success)' },
    { label: '已驳回', value: s.rejected || 0, color: 'var(--color-danger)' },
    { label: '已关闭', value: s.closed || 0, color: 'var(--color-info)' },
  ].map(item => ({
    ...item,
    percent: total > 0 ? Math.round((item.value / total) * 100) : 0,
  }))
})

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
  <div v-loading="loading" class="dashboard">
    <div class="welcome">
      <div>
        <span class="page-kicker">Evaluation console</span>
        <h1 class="welcome-title">学校管理端</h1>
        <p class="welcome-desc">统一查看评价审核、追溯授权、账号组织与服务质量运行数据。</p>
      </div>
    </div>

    <div class="metrics">
      <div v-for="item in metricCards" :key="item.key" class="metric" :class="{ 'metric--warn': item.tone === 'warning' && item.value > 0 }">
        <span class="metric-val" :class="`tone-${item.tone}`">{{ item.value }}</span>
        <span class="metric-label">{{ item.title }}</span>
      </div>
    </div>

    <div class="main-grid">
      <div class="col-left">
        <section class="panel">
          <div class="panel-hd">
            <h3 class="panel-title">
              <el-icon><DocumentChecked /></el-icon>
              待审核表单
              <el-badge v-if="auditForms.length" :value="auditForms.length" type="warning" />
            </h3>
            <el-button text type="primary" size="small" @click="router.push('/school/audit/list?tab=form')">
              全部 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div class="panel-bd panel-bd--audit">
            <template v-if="auditForms.length">
              <div v-for="item in auditForms" :key="item.id" class="todo-row" @click="router.push('/school/audit/list?tab=form')">
                <div class="todo-r1">
                  <span class="todo-name">{{ item.form_title }}</span>
                  <el-tag size="small" effect="plain">{{ item.form_type }}</el-tag>
                </div>
                <div class="todo-r2">
                  <span class="todo-meta">{{ item.requester_name }} · {{ item.org_name || '未匹配组织' }} · {{ formatTime(item.requested_at) }}</span>
                  <el-button text type="primary" size="small">去审核</el-button>
                </div>
              </div>
            </template>
            <div v-else class="empty-sm">
              <el-icon :size="20"><CircleCheck /></el-icon>
              <span>暂无待审核表单</span>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-hd">
            <h3 class="panel-title">
              <el-icon><Lock /></el-icon>
              追溯授权申请
              <el-badge v-if="traceTasks.length" :value="traceTasks.length" type="warning" />
            </h3>
            <el-button text type="primary" size="small" @click="router.push('/school/audit/list?tab=trace')">
              全部 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div class="panel-bd panel-bd--trace">
            <template v-if="traceTasks.length">
              <div v-for="item in traceTasks" :key="item.id" class="todo-row" @click="router.push('/school/audit/list?tab=trace')">
                <div class="todo-r1">
                  <span class="todo-name">{{ item.appeal_no }}</span>
                  <el-tag size="small" type="warning" effect="plain">{{ item.status }}</el-tag>
                </div>
                <div class="todo-r2">
                  <span class="todo-meta">{{ item.applicant_name }} · {{ formatTime(item.requested_at) }}</span>
                  <el-button text type="primary" size="small">查看</el-button>
                </div>
              </div>
            </template>
            <div v-else class="empty-sm">
              <el-icon :size="20"><CircleCheck /></el-icon>
              <span>暂无待处理追溯授权</span>
            </div>
          </div>
        </section>
      </div>

      <div class="col-right">
        <section class="panel">
          <div class="panel-hd">
            <h3 class="panel-title">评价提交</h3>
          </div>
          <div class="panel-bd">
            <div class="submit-stats">
              <div class="submit-item">
                <span class="submit-num">{{ operationOverview.monthSubmissionCount }}</span>
                <span class="submit-label">本月提交</span>
              </div>
              <div class="submit-item">
                <span class="submit-num submit-num--primary">{{ operationOverview.totalSubmissionCount }}</span>
                <span class="submit-label">累计提交</span>
              </div>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-hd">
            <h3 class="panel-title">运行概览</h3>
          </div>
          <div class="panel-bd">
            <div class="ov-section">
              <h4 class="ov-title">评价表单状态</h4>
              <div class="bar-list">
                <div v-for="item in formStatusItems" :key="item.label" class="bar-row">
                  <span class="bar-label">{{ item.label }}</span>
                  <div class="bar-track"><div class="bar-fill" :style="{ width: item.percent + '%', background: item.color }" /></div>
                  <span class="bar-val">{{ item.value }}</span>
                </div>
              </div>
            </div>
            <div class="ov-section ov-section--mt">
              <h4 class="ov-title">反馈工单状态</h4>
              <div class="bar-list">
                <div v-for="item in feedbackStatusItems" :key="item.label" class="bar-row">
                  <span class="bar-label">{{ item.label }}</span>
                  <div class="bar-track"><div class="bar-fill" :style="{ width: item.percent + '%', background: item.color }" /></div>
                  <span class="bar-val">{{ item.value }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <section class="panel">
      <div class="panel-hd">
        <h3 class="panel-title">最近动态</h3>
      </div>
      <div class="panel-bd">
        <template v-if="recentActivities.length">
          <div v-for="activity in recentActivities" :key="activity.id" class="act-row">
            <el-tag size="small" effect="plain">{{ activity.module }}</el-tag>
            <span class="act-text">{{ activity.content }}</span>
            <span v-if="activity.operator_name" class="act-user">{{ activity.operator_name }}</span>
            <span class="act-time">{{ formatTime(activity.created_at) }}</span>
          </div>
        </template>
        <div v-else class="empty-sm">
          <el-icon :size="20"><Clock /></el-icon>
          <span>暂无最近动态</span>
        </div>
      </div>
    </section>
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

.welcome {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  min-height: 48px;
  padding: 0 0 var(--space-1);
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

.metrics {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  background: var(--color-border-lighter);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.metric {
  min-height: 92px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--color-bg-card);
  position: relative;
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

.metric--warn::before {
  background: var(--color-warning);
}

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

.tone-warning {
  color: var(--color-warning) !important;
}

.main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: var(--space-5);
  align-items: stretch;
}

.col-left,
.col-right {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  min-width: 0;
  height: 100%;
}

.col-left {
  gap: var(--space-3);
}



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
  min-height: 54px;
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
  font-size: var(--font-base);
  font-weight: var(--font-weight-semibold);
}

.panel-bd {
  padding: var(--space-3) var(--space-5);
}

.todo-row {
  padding: var(--space-3);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-lg);
  background: #FBFCFF;
  cursor: pointer;
  transition: background 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
}

.todo-row + .todo-row {
  margin-top: var(--space-2);
}

.todo-row:hover {
  border-color: var(--color-primary-100);
  background: var(--color-primary-50);
  box-shadow: 0 4px 12px rgba(16, 24, 40, 0.05);
}

.todo-r1 {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}

.todo-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--color-text-heading);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-r2 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.todo-meta {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: var(--font-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-bd--audit { min-height: 260px; }
.panel-bd--trace { min-height: 190px; }

.todo-row :deep(.el-tag) {
  --el-tag-bg-color: #F6F8FC;
  --el-tag-border-color: var(--color-border-light);
  --el-tag-text-color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.todo-row :deep(.el-tag--warning) {
  --el-tag-bg-color: #FFF8EA;
  --el-tag-border-color: #F4D9A8;
  --el-tag-text-color: #9A650D;
}

.todo-r2 :deep(.el-button.is-text) {
  height: 26px;
  padding: 0 var(--space-2);
  color: var(--color-text-secondary);
  background: transparent;
  border-radius: var(--radius-sm);
  box-shadow: none;
  font-weight: var(--font-weight-medium);
}

.todo-row:hover .todo-r2 :deep(.el-button.is-text) {
  color: var(--color-primary-600);
  background: rgba(255, 255, 255, 0.72);
}

.empty-sm {
  min-height: 128px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  color: var(--color-text-placeholder);
  font-size: var(--font-sm);
}

.col-right .panel:first-child .panel-hd {
  min-height: 46px;
}

.col-right .panel:first-child .panel-bd {
  padding-top: var(--space-2);
  padding-bottom: var(--space-2);
}

.submit-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
  padding: 0;
}

.submit-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: var(--space-3);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-lg);
  background: #FBFCFF;
}

.submit-num {
  color: var(--color-text-heading);
  font-family: var(--font-family-data);
  font-size: 28px;
  font-weight: var(--font-weight-bold);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.submit-num--primary {
  color: var(--color-primary);
}

.submit-label {
  color: var(--color-text-muted);
  font-size: var(--font-xs);
}

.ov-section--mt {
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-lighter);
}

.ov-title {
  margin: 0 0 var(--space-3);
  color: var(--color-text-heading);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
}

.bar-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.bar-row {
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr) 36px;
  align-items: center;
  gap: var(--space-2);
}

.bar-label {
  color: var(--color-text-body);
  font-size: var(--font-xs);
  text-align: right;
}

.bar-track {
  height: 7px;
  overflow: hidden;
  border-radius: var(--radius-full);
  background: var(--color-bg-light);
}

.bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.35s ease;
}

.bar-val {
  color: var(--color-text-heading);
  font-family: var(--font-family-data);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-bold);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.act-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border-lighter);
  font-size: var(--font-sm);
}

.act-row:last-child {
  border-bottom: none;
}

.act-text {
  min-width: 0;
  overflow: hidden;
  color: var(--color-text-body);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.act-user,
.act-time {
  color: var(--color-text-muted);
  font-size: var(--font-xs);
  white-space: nowrap;
}

@media (max-width: 1280px) {
  .metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .main-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .welcome {
    align-items: flex-start;
    flex-direction: column;
  }

  .metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .act-row {
    grid-template-columns: 1fr;
    gap: var(--space-2);
  }
}
</style>



