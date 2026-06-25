<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  Document, ChatLineSquare, TrendCharts, Warning,
  PieChart, DataLine, Refresh,
} from '@element-plus/icons-vue'
import { getStaffRoleCodes, getStaffRoleNames, getStaffScopeDescription, getStaffRoleScope } from '@/utils/staffPermission'
import PageHeader from '@/components/common/PageHeader.vue'
import EmptyPlaceholder from '@/components/common/EmptyPlaceholder.vue'
import StaffReportFilterBar from '@/components/staff/reports/StaffReportFilterBar.vue'
import StaffMetricCard from '@/components/staff/reports/StaffMetricCard.vue'
import ScoreDistributionCard from '@/components/staff/reports/ScoreDistributionCard.vue'
import ObjectRankingList from '@/components/staff/reports/ObjectRankingList.vue'
import LowScoreWarningList from '@/components/staff/reports/LowScoreWarningList.vue'
import FeedbackSummaryCard from '@/components/staff/reports/FeedbackSummaryCard.vue'
import ReportDetailDrawer from '@/components/staff/reports/ReportDetailDrawer.vue'
import {
  getStaffReportContextApi,
  getStaffReportOverviewApi,
  getStaffScoreDistributionApi,
  getStaffEvaluationSummaryApi,
  getStaffObjectRankingApi,
  getStaffLowScoreWarningsApi,
  getStaffFeedbackSummaryApi,
  getStaffReportObjectDetailApi,
} from '@/api/staffReports'
import request from '@/request'

defineOptions({ name: 'StaffReportsView' })

const router = useRouter()
const userStore = useUserStore()

// 权限
const roleCodes = getStaffRoleCodes(userStore.userInfo)
const roleNames = getStaffRoleNames(roleCodes)
const scopeDesc = getStaffScopeDescription(roleCodes)
const allowedRoles = ['teaching_admin', 'service_admin', 'course_owner', 'feedback_handler', 'school_admin', 'form_publisher']
const hasPermission = roleCodes.some(c => allowedRoles.includes(c))

// 数据
const loading = ref(true)
const ctx = ref(null)

// 筛选
const filters = reactive({
  timeRange: 'all',
  evalType: 'all',
  targetType: 'all',
  windowStatus: 'all',
  sort: 'low_first',
  startDate: '',
  endDate: '',
})

// 计算数据
const overview = computed(() => ctx.value ? getStaffReportOverviewApi(ctx.value, filters) : {})
const distribution = computed(() => ctx.value ? getStaffScoreDistributionApi(ctx.value, filters) : [])
const indicatorScores = computed(() => ctx.value ? getStaffEvaluationSummaryApi(ctx.value, filters) : [])
const ranking = computed(() => ctx.value ? getStaffObjectRankingApi(ctx.value, filters) : [])
const warnings = computed(() => ctx.value ? getStaffLowScoreWarningsApi(ctx.value, filters) : [])
const feedbackSummary = computed(() => ctx.value ? getStaffFeedbackSummaryApi(ctx.value, filters) : {})

// 详情抽屉
const drawerVisible = ref(false)
const drawerLoading = ref(false)
const drawerDetail = ref({})

// 加载数据
async function loadData() {
  loading.value = true
  try {
    const tid = userStore.tenantId
    if (!tid) return

    // 先加载组织数据以计算权限范围
    const [teachingOrgsRes, serviceOrgsRes] = await Promise.all([
      request.get('/teachingOrgUnits', { params: { tenant_id: tid, deleted: false } }),
      request.get('/serviceOrgUnits', { params: { tenant_id: tid, deleted: false } }),
    ])
    const teachingOrgs = (teachingOrgsRes.data || []).filter(o => !o.deleted)
    const serviceOrgs = (serviceOrgsRes.data || []).filter(o => !o.deleted)

    // 计算当前职工权限范围，用于数据隔离
    const scope = getStaffRoleScope(userStore, teachingOrgs, serviceOrgs)
    const isSchoolAdmin = roleCodes.includes('school_admin')

    ctx.value = await getStaffReportContextApi(tid, { ...scope, schoolAdmin: isSchoolAdmin })
  } catch (err) {
    console.error('加载数据看板数据失败:', err)
  } finally {
    loading.value = false
  }
}

// 筛选变化
function handleFilterUpdate(newFilters) {
  Object.assign(filters, newFilters)
}

function handleReset() {
  filters.timeRange = 'all'
  filters.evalType = 'all'
  filters.targetType = 'all'
  filters.windowStatus = 'all'
  filters.sort = 'low_first'
  filters.startDate = ''
  filters.endDate = ''
}

// 排行排序
function handleSortChange(sort) {
  filters.sort = sort
}

// 查看详情
async function handleViewDetail({ targetType, targetId }) {
  if (!ctx.value) return
  drawerVisible.value = true
  drawerLoading.value = true
  try {
    drawerDetail.value = getStaffReportObjectDetailApi(ctx.value, targetType, Number(targetId))
  } catch (err) {
    console.error('加载详情失败:', err)
    drawerDetail.value = {}
  } finally {
    drawerLoading.value = false
  }
}

// 跳转待处理反馈
function goToPendingFeedback() {
  router.push('/staff/feedback?status=pending')
}

onMounted(() => {
  if (hasPermission) {
    loadData()
  }
})
</script>

<template>
  <div class="reports-page">
    <!-- 无权限 -->
    <div v-if="!hasPermission" class="no-permission">
      <EmptyPlaceholder text="当前账号暂无数据看板权限" description="数据看板仅对教学管理员、部门管理员、课程负责人等角色开放" />
    </div>

    <template v-else>
      <!-- 页面标题 -->
      <PageHeader title="数据看板" description="查看授权范围内的评价结果、参与情况与反馈处理数据">
        <template #actions>
          <div class="header-info-block">
            <span class="role-badge">{{ roleNames }}</span>
            <span class="scope-text">{{ scopeDesc }}</span>
          </div>
          <el-button :icon="Refresh" @click="loadData">刷新</el-button>
        </template>
      </PageHeader>

      <!-- 筛选工具栏 -->
      <StaffReportFilterBar :filters="filters" @update:filters="handleFilterUpdate" @reset="handleReset" />

      <!-- 核心指标 -->
      <div v-loading="loading" class="metrics-grid">
        <StaffMetricCard
          :icon="Document"
          icon-class="icon-blue"
          :value="overview.submissionCount || 0"
          title="评价提交数"
          desc="授权范围内有效提交总数"
          trend="基于当前筛选范围"
        />
        <StaffMetricCard
          :icon="PieChart"
          icon-class="icon-green"
          :value="overview.avgScore || '0.0'"
          title="平均评分"
          desc="所有评价指标得分平均值"
          trend="基于当前筛选范围"
        />
        <StaffMetricCard
          :icon="TrendCharts"
          icon-class="icon-blue"
          :value="(overview.participationRate || 0) + '%'"
          title="参与率"
          desc="基于当前样本估算"
        />
        <StaffMetricCard
          :icon="Warning"
          icon-class="icon-red"
          :value="overview.lowScoreCount || 0"
          title="低分预警"
          desc="评分 ≤ 2 分的评价条目"
          clickable
          @click="router.push('/staff/reports#warnings')"
        />
        <StaffMetricCard
          :icon="ChatLineSquare"
          icon-class="icon-orange"
          :value="overview.pendingFeedback || 0"
          title="待处理反馈"
          desc="待跟进的投诉建议"
          clickable
          @click="goToPendingFeedback"
        />
        <StaffMetricCard
          :icon="DataLine"
          icon-class="icon-green"
          :value="(overview.resolveRate || 0) + '%'"
          title="办结率"
          desc="已办结反馈占总反馈比例"
        />
      </div>

      <!-- 评价结果分析 -->
      <ScoreDistributionCard :distribution="distribution" :indicator-scores="indicatorScores" />

      <!-- 评价对象排行 + 低分预警 -->
      <div class="two-col-area">
        <ObjectRankingList
          :ranking="ranking"
          :sort-by="filters.sort"
          @sort-change="handleSortChange"
          @view-detail="handleViewDetail"
        />
        <div id="warnings" class="warning-col">
          <LowScoreWarningList :warnings="warnings" @view-detail="handleViewDetail" />
        </div>
      </div>

      <!-- 反馈处理分析 -->
      <FeedbackSummaryCard :summary="feedbackSummary" />

      <!-- 详情抽屉 -->
      <ReportDetailDrawer
        v-model:visible="drawerVisible"
        :detail="drawerDetail"
        :loading="drawerLoading"
      />
    </template>
  </div>
</template>

<style scoped>
.reports-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 1480px;
  margin-inline: auto;
}

.no-permission {
  padding: var(--space-12) 0;
}

/* 标题区 */
.header-info-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  background: var(--color-primary-50);
  color: var(--color-accent-user-700);
  font-size: var(--font-xs);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-medium);
}

.scope-text {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
}

/* 指标卡片 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}

/* 双栏区域 */
.two-col-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  align-items: stretch;
}

.warning-col {
  display: flex;
  flex-direction: column;
}

/* 响应式 */
@media (max-width: 900px) {
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .two-col-area { grid-template-columns: 1fr; }
}

@media (max-width: 600px) {
  .metrics-grid { grid-template-columns: 1fr; }
}
</style>
