<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh, ArrowLeft, Search, DocumentChecked,
  Check, Close, View, Warning,
  OfficeBuilding, Timer, User, Lock,
} from '@element-plus/icons-vue'
import {
  getSchoolAuditListApi,
  getSchoolAuditSummaryApi,
  getSchoolAuditDetailApi,
  approveSchoolAuditApi,
  rejectSchoolAuditApi,
} from '@/api/schoolAudit'
import {
  getTraceAuthListApi,
  getTraceAuthSummaryApi,
  getTraceAuthDetailApi,
  approveTraceAuthApi,
  rejectTraceAuthApi,
} from '@/api/traceAuth'

defineOptions({ name: 'SchoolAuditListView' })

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// ==================== Tab 切换 ====================
const activeTab = ref(route.query.tab === 'trace' ? 'trace' : 'form')

function switchTab(tab) {
  activeTab.value = tab
  router.replace({ path: route.path, query: { ...route.query, tab } })
  if (tab === 'form') loadFormData()
  else loadTraceData()
}

watch(() => route.query.tab, (val) => {
  const t = val === 'trace' ? 'trace' : 'form'
  if (t !== activeTab.value) {
    activeTab.value = t
    if (t === 'form') loadFormData()
    else loadTraceData()
  }
})

// ==================== 评价表单审核 - 状态 ====================
const formLoading = ref(false)
const auditList = ref([])
const formSummary = ref({ total: 0, pending: 0, approved: 0, rejected: 0, todaySubmitted: 0, monthAudited: 0 })

const filters = ref({
  keyword: '',
  status: 'all',
  formType: 'all',
  timeRange: 'all',
  sort: 'latest',
})

const drawerVisible = ref(false)
const drawerLoading = ref(false)
const drawerDetail = ref(null)

const rejectVisible = ref(false)
const rejectForm = ref({ reason: '', quickReason: '' })
const rejectAuditId = ref(null)
const rejectRules = {
  reason: [{ required: true, message: '请填写驳回原因', trigger: 'blur' }, { min: 10, max: 300, message: '驳回原因 10-300 字', trigger: 'blur' }],
}
const rejectFormRef = ref(null)

const quickReasons = [
  '评价对象配置不完整',
  '题目设置不符合要求',
  '评价窗口时间不合理',
  '表单说明不清晰',
  '其他',
]

// ==================== 追溯授权审批 - 状态 ====================
const traceLoading = ref(false)
const traceList = ref([])
const traceSummary = ref({ total: 0, pending: 0, approved: 0, rejected: 0, todayApplied: 0, monthAudited: 0 })

const traceFilters = ref({
  keyword: '',
  status: 'all',
  timeRange: 'all',
  sort: 'latest',
})

const traceDrawerVisible = ref(false)
const traceDrawerLoading = ref(false)
const traceDrawerDetail = ref(null)

const traceRejectVisible = ref(false)
const traceRejectForm = ref({ reason: '' })
const traceRejectId = ref(null)
const traceRejectRules = {
  reason: [{ required: true, message: '请填写拒绝原因', trigger: 'blur' }, { min: 10, max: 300, message: '拒绝原因 10-300 字', trigger: 'blur' }],
}
const traceRejectFormRef = ref(null)

// ==================== 计算属性 ====================
const statusCards = computed(() => {
  if (activeTab.value === 'trace') {
    return [
      { key: 'total', label: '全部申请', value: traceSummary.value.total, tone: 'default' },
      { key: 'pending', label: '待审批', value: traceSummary.value.pending, tone: 'warning' },
      { key: 'approved', label: '已授权', value: traceSummary.value.approved, tone: 'success' },
      { key: 'rejected', label: '已拒绝', value: traceSummary.value.rejected, tone: 'danger' },
      { key: 'todayApplied', label: '今日申请', value: traceSummary.value.todayApplied, tone: 'info' },
      { key: 'monthAudited', label: '本月审批', value: traceSummary.value.monthAudited, tone: 'info' },
    ]
  }
  return [
    { key: 'total', label: '全部申请', value: formSummary.value.total, tone: 'default' },
    { key: 'pending', label: '待审核', value: formSummary.value.pending, tone: 'warning' },
    { key: 'approved', label: '已通过', value: formSummary.value.approved, tone: 'success' },
    { key: 'rejected', label: '已驳回', value: formSummary.value.rejected, tone: 'danger' },
    { key: 'todaySubmitted', label: '今日提交', value: formSummary.value.todaySubmitted, tone: 'info' },
    { key: 'monthAudited', label: '本月审核', value: formSummary.value.monthAudited, tone: 'info' },
  ]
})

const statusTagType = (code) => {
  const map = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return map[code] || 'info'
}

// ==================== 评价表单审核 - 数据加载 ====================
async function loadFormData() {
  formLoading.value = true
  try {
    const tid = userStore.tenantId
    const [list, sum] = await Promise.all([
      getSchoolAuditListApi(tid, filters.value),
      getSchoolAuditSummaryApi(tid),
    ])
    auditList.value = list
    formSummary.value = sum
  } catch (e) {
    console.error('加载审核列表失败', e)
    ElMessage.error('加载审核列表失败')
  } finally {
    formLoading.value = false
  }
}

function resetFormFilters() {
  filters.value = { keyword: '', status: 'all', formType: 'all', timeRange: 'all', sort: 'latest' }
  loadFormData()
}

// ==================== 追溯授权审批 - 数据加载 ====================
async function loadTraceData() {
  traceLoading.value = true
  try {
    const tid = userStore.tenantId
    const [list, sum] = await Promise.all([
      getTraceAuthListApi(tid, traceFilters.value),
      getTraceAuthSummaryApi(tid),
    ])
    traceList.value = list
    traceSummary.value = sum
  } catch (e) {
    console.error('加载追溯授权列表失败', e)
    ElMessage.error('加载追溯授权列表失败')
  } finally {
    traceLoading.value = false
  }
}

function resetTraceFilters() {
  traceFilters.value = { keyword: '', status: 'all', timeRange: 'all', sort: 'latest' }
  loadTraceData()
}

// ==================== 评价表单审核 - 详情抽屉 ====================
async function openDetail(auditId) {
  drawerVisible.value = true
  drawerLoading.value = true
  drawerDetail.value = null
  try {
    drawerDetail.value = await getSchoolAuditDetailApi(userStore.tenantId, auditId)
  } catch (e) {
    console.error('加载详情失败', e)
    ElMessage.error('加载审核详情失败')
  } finally {
    drawerLoading.value = false
  }
}

// ==================== 评价表单审核 - 通过 ====================
function hasBlockingRisks(item) {
  if (item.missing_items && item.missing_items.length > 0) return true
  if (item.blocking_risks && item.blocking_risks.length > 0) return true
  return false
}

function blockingTooltip(item) {
  if (item.missing_items?.length) return '请先' + item.missing_items.join('、')
  if (item.blocking_risks?.length) return item.blocking_risks.join('、')
  return ''
}

async function handleApprove(audit) {
  if (hasBlockingRisks(audit)) {
    ElMessage.warning('存在阻断风险，无法通过审核：' + blockingTooltip(audit))
    return
  }
  try {
    await ElMessageBox.confirm(
      `通过后「${audit.form_title}」将进入已发布状态，在设定开放时间内对学生端可见。`,
      '确认通过该评价表单审核？',
      {
        confirmButtonText: '确认通过',
        cancelButtonText: '取消',
        type: 'success',
        confirmButtonClass: 'audit-confirm-btn',
      }
    )
    const uid = userStore.userInfo?.id
    await approveSchoolAuditApi(userStore.tenantId, userStore.schoolId, audit.id, uid)
    ElMessage.success(`已通过「${audit.form_title}」`)
    loadFormData()
    if (drawerVisible.value) openDetail(audit.id)
  } catch (e) {
    if (e !== 'cancel' && e?.toString() !== 'cancel') {
      ElMessage.error(e.message || '审核操作失败')
    }
  }
}

// ==================== 评价表单审核 - 驳回 ====================
function openReject(auditId) {
  rejectAuditId.value = auditId
  rejectForm.value = { reason: '', quickReason: '' }
  rejectVisible.value = true
}

function selectQuickReason(text) {
  rejectForm.value.quickReason = text
  const current = rejectForm.value.reason
  if (current && current !== text) {
    rejectForm.value.reason = current + '；' + text
  } else {
    rejectForm.value.reason = text
  }
}

async function submitReject() {
  try {
    await rejectFormRef.value?.validate()
  } catch { return }
  try {
    const uid = userStore.userInfo?.id
    await rejectSchoolAuditApi(userStore.tenantId, userStore.schoolId, rejectAuditId.value, uid, rejectForm.value.reason)
    ElMessage.success('已驳回该申请')
    rejectVisible.value = false
    loadFormData()
    if (drawerVisible.value) openDetail(rejectAuditId.value)
  } catch (e) {
    ElMessage.error(e.message || '驳回操作失败')
  }
}

// ==================== 追溯授权审批 - 详情抽屉 ====================
async function openTraceDetail(traceId) {
  traceDrawerVisible.value = true
  traceDrawerLoading.value = true
  traceDrawerDetail.value = null
  try {
    traceDrawerDetail.value = await getTraceAuthDetailApi(userStore.tenantId, traceId)
  } catch (e) {
    console.error('加载追溯授权详情失败', e)
    ElMessage.error('加载追溯授权详情失败')
  } finally {
    traceDrawerLoading.value = false
  }
}

// ==================== 追溯授权审批 - 同意 ====================
async function handleTraceApprove(trace) {
  try {
    await ElMessageBox.confirm(
      `授权后将解除关联申诉中匿名评价者的身份保护，申请人可查看评价者真实身份。`,
      '确认同意该追溯授权申请？',
      {
        confirmButtonText: '确认授权',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'audit-confirm-btn',
      }
    )
    const uid = userStore.userInfo?.id
    await approveTraceAuthApi(userStore.tenantId, userStore.schoolId, trace.id, uid)
    ElMessage.success('已同意追溯授权申请')
    loadTraceData()
    if (traceDrawerVisible.value) openTraceDetail(trace.id)
  } catch (e) {
    if (e !== 'cancel' && e?.toString() !== 'cancel') {
      ElMessage.error(e.message || '审批操作失败')
    }
  }
}

// ==================== 追溯授权审批 - 拒绝 ====================
function openTraceReject(traceId) {
  traceRejectId.value = traceId
  traceRejectForm.value = { reason: '' }
  traceRejectVisible.value = true
}

async function submitTraceReject() {
  try {
    await traceRejectFormRef.value?.validate()
  } catch { return }
  try {
    const uid = userStore.userInfo?.id
    await rejectTraceAuthApi(userStore.tenantId, userStore.schoolId, traceRejectId.value, uid, traceRejectForm.value.reason)
    ElMessage.success('已拒绝该追溯授权申请')
    traceRejectVisible.value = false
    loadTraceData()
    if (traceDrawerVisible.value) openTraceDetail(traceRejectId.value)
  } catch (e) {
    ElMessage.error(e.message || '审批操作失败')
  }
}

// ==================== 格式化 ====================
function formatTime(t) {
  if (!t) return '-'
  const d = new Date(t)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}-${dd} ${hh}:${mi}`
}

function formatFullTime(t) {
  if (!t) return '-'
  return new Date(t).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ==================== 统一刷新 ====================
function handleRefresh() {
  if (activeTab.value === 'form') loadFormData()
  else loadTraceData()
}

// ==================== 生命周期 ====================
onMounted(() => {
  if (activeTab.value === 'trace') loadTraceData()
  else loadFormData()
})
</script>

<template>
  <div class="audit-page">
    <!-- 页面标题 -->
    <section class="page-header">
      <div class="header-info">
        <h1 class="page-title">审核中心</h1>
        <p class="page-subtitle">审核本校评价表单发布申请与追溯授权申请</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="handleRefresh" :loading="formLoading || traceLoading">刷新</el-button>
        <el-button :icon="ArrowLeft" text @click="router.push('/school/dashboard')">返回首页</el-button>
      </div>
    </section>

    <!-- Tab 切换 -->
    <section class="tab-bar">
      <el-radio-group :model-value="activeTab" @change="switchTab" size="large">
        <el-radio-button value="form">
          <el-icon><DocumentChecked /></el-icon>
          评价表单审核
        </el-radio-button>
        <el-radio-button value="trace">
          <el-icon><Lock /></el-icon>
          追溯授权审批
          <el-badge v-if="traceSummary.pending > 0" :value="traceSummary.pending" type="warning" class="tab-badge" />
        </el-radio-button>
      </el-radio-group>
    </section>

    <!-- 状态统计 -->
    <section class="status-cards">
      <div v-for="card in statusCards" :key="card.key" class="status-card" :class="`tone-${card.tone}`">
        <span class="card-value">{{ card.value }}</span>
        <span class="card-label">{{ card.label }}</span>
      </div>
    </section>

    <!-- ==================== 评价表单审核 Tab ==================== -->
    <template v-if="activeTab === 'form'">
      <!-- 筛选工具栏 -->
      <section class="filter-bar">
        <el-input v-model="filters.keyword" placeholder="搜索表单名称、提交人、组织…" :prefix-icon="Search" clearable style="width: 320px" @clear="loadFormData" @keyup.enter="loadFormData" />
        <el-select v-model="filters.status" style="width: 130px" @change="loadFormData">
          <el-option label="全部状态" value="all" />
          <el-option label="待审核" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已驳回" value="rejected" />
        </el-select>
        <el-select v-model="filters.formType" style="width: 130px" @change="loadFormData">
          <el-option label="全部类型" value="all" />
          <el-option label="教学评价" value="teaching" />
          <el-option label="服务评价" value="service" />
          <el-option label="即时评价" value="instant" />
        </el-select>
        <el-select v-model="filters.timeRange" style="width: 130px" @change="loadFormData">
          <el-option label="全部时间" value="all" />
          <el-option label="今日" value="today" />
          <el-option label="本周" value="week" />
          <el-option label="本月" value="month" />
        </el-select>
        <el-select v-model="filters.sort" style="width: 130px" @change="loadFormData">
          <el-option label="最新提交" value="latest" />
          <el-option label="最近审核" value="recent_audit" />
          <el-option label="状态优先" value="status_first" />
        </el-select>
        <el-button text type="primary" @click="resetFormFilters">重置</el-button>
      </section>

      <!-- 审核列表 -->
      <section class="audit-list" v-loading="formLoading">
        <template v-if="auditList.length">
          <div v-for="item in auditList" :key="item.id" class="audit-card">
            <div class="audit-card-main">
              <div class="audit-card-row1">
                <span class="audit-form-title">{{ item.form_title }}</span>
                <el-tag :type="statusTagType(item.status_code)" size="small" effect="plain">{{ item.status }}</el-tag>
                <el-tag size="small" effect="plain" class="type-tag">{{ item.form_type }}</el-tag>
              </div>
              <div class="audit-card-row2">
                <span><el-icon><User /></el-icon> {{ item.submitter_name }}</span>
                <span class="sep">·</span>
                <span><el-icon><OfficeBuilding /></el-icon> {{ item.org_name }}</span>
                <span class="sep">·</span>
                <span><el-icon><Timer /></el-icon> {{ item.window_summary }}</span>
                <span class="sep">·</span>
                <span>{{ formatTime(item.requested_at) }}</span>
              </div>
              <div v-if="item.missing_items && item.missing_items.length" class="audit-card-risk">
                <el-icon :size="14" color="var(--color-warning)"><Warning /></el-icon>
                <span v-if="item.missing_items.length <= 2">风险：{{ item.missing_items.join('、') }}</span>
                <span v-else>风险：存在 {{ item.missing_items.length }} 项阻断问题</span>
              </div>
              <div v-if="item.review_comment" class="audit-card-row3">
                <span class="review-label">审核意见：</span>{{ item.review_comment }}
              </div>
            </div>
            <div class="audit-card-actions">
              <el-button text type="primary" size="small" :icon="View" @click="openDetail(item.id)">查看详情</el-button>
              <template v-if="item.status_code === 'pending'">
                <div class="approve-slot">
                  <el-tooltip
                    v-if="item.missing_items && item.missing_items.length"
                    :content="'请先' + item.missing_items.join('、')"
                    placement="top"
                  >
                    <el-button type="warning" size="small" plain :icon="Warning" disabled>存在风险</el-button>
                  </el-tooltip>
                  <el-button v-else type="primary" size="small" plain :icon="Check" @click="handleApprove(item)">通过</el-button>
                </div>
                <el-button type="danger" size="small" plain :icon="Close" @click="openReject(item.id)">驳回</el-button>
              </template>
            </div>
          </div>
        </template>
        <div v-else-if="!formLoading" class="empty-state">
          <el-icon :size="48" color="var(--color-text-placeholder)"><DocumentChecked /></el-icon>
          <p class="empty-title">暂无审核申请</p>
          <p class="empty-desc">职工提交评价表单审核后，将在这里处理发布申请。</p>
        </div>
      </section>
    </template>

    <!-- ==================== 追溯授权审批 Tab ==================== -->
    <template v-if="activeTab === 'trace'">
      <!-- 筛选工具栏 -->
      <section class="filter-bar">
        <el-input v-model="traceFilters.keyword" placeholder="搜索申请编号、申诉编号、申请人…" :prefix-icon="Search" clearable style="width: 320px" @clear="loadTraceData" @keyup.enter="loadTraceData" />
        <el-select v-model="traceFilters.status" style="width: 130px" @change="loadTraceData">
          <el-option label="全部状态" value="all" />
          <el-option label="待审批" value="pending" />
          <el-option label="已授权" value="approved" />
          <el-option label="已拒绝" value="rejected" />
        </el-select>
        <el-select v-model="traceFilters.timeRange" style="width: 130px" @change="loadTraceData">
          <el-option label="全部时间" value="all" />
          <el-option label="今日" value="today" />
          <el-option label="本周" value="week" />
          <el-option label="本月" value="month" />
        </el-select>
        <el-select v-model="traceFilters.sort" style="width: 130px" @change="loadTraceData">
          <el-option label="最新申请" value="latest" />
          <el-option label="最近审批" value="recent_audit" />
          <el-option label="状态优先" value="status_first" />
        </el-select>
        <el-button text type="primary" @click="resetTraceFilters">重置</el-button>
      </section>

      <!-- 隐私安全提示 -->
      <el-alert
        type="info"
        :closable="false"
        show-icon
        class="privacy-alert"
      >
        <template #title>
          <span>隐私保护提示：审批页面不展示匿名评价者身份信息，授权通过后申请人方可查看。</span>
        </template>
      </el-alert>

      <!-- 追溯授权列表 -->
      <section class="audit-list" v-loading="traceLoading">
        <template v-if="traceList.length">
          <div v-for="item in traceList" :key="item.id" class="audit-card">
            <div class="audit-card-main">
              <div class="audit-card-row1">
                <span class="audit-form-title">追溯授权 #{{ item.id }}</span>
                <el-tag :type="statusTagType(item.status_code)" size="small" effect="plain">{{ item.status }}</el-tag>
                <el-tag size="small" effect="plain" class="type-tag">{{ item.appeal_no }}</el-tag>
              </div>
              <div class="audit-card-row2">
                <span><el-icon><User /></el-icon> 申请人：{{ item.applicant_name }}</span>
                <span class="sep">·</span>
                <span>关联表单：{{ item.form_name }}</span>
                <span class="sep">·</span>
                <span>{{ formatTime(item.requested_at) }}</span>
              </div>
              <div class="trace-reason-preview">
                <span class="review-label">申请原因：</span>{{ item.reason.length > 60 ? item.reason.slice(0, 60) + '…' : item.reason }}
              </div>
            </div>
            <div class="audit-card-actions">
              <el-button text type="primary" size="small" :icon="View" @click="openTraceDetail(item.id)">查看详情</el-button>
              <template v-if="item.status_code === 'pending'">
                <el-button type="primary" size="small" plain :icon="Check" @click="handleTraceApprove(item)">同意授权</el-button>
                <el-button type="danger" size="small" plain :icon="Close" @click="openTraceReject(item.id)">拒绝</el-button>
              </template>
            </div>
          </div>
        </template>
        <div v-else-if="!traceLoading" class="empty-state">
          <el-icon :size="48" color="var(--color-text-placeholder)"><Lock /></el-icon>
          <p class="empty-title">暂无追溯授权申请</p>
          <p class="empty-desc">教职工发起追溯授权申请后，将在这里进行审批处理。</p>
        </div>
      </section>
    </template>

    <!-- ==================== 评价表单审核 - 详情抽屉 ==================== -->
    <el-drawer v-model="drawerVisible" title="评价表单审核详情" size="720px" :close-on-click-modal="true">
      <div v-loading="drawerLoading">
        <template v-if="drawerDetail">
          <div class="detail-section">
            <h3 class="detail-section-title">审核申请信息</h3>
            <div class="detail-grid">
              <div class="detail-item"><span class="label">审核编号</span><span class="value">#{{ drawerDetail.audit_id }}</span></div>
              <div class="detail-item"><span class="label">当前状态</span><span class="value"><el-tag :type="statusTagType(drawerDetail.audit_status_code)" size="small" effect="plain">{{ drawerDetail.audit_status }}</el-tag></span></div>
              <div class="detail-item"><span class="label">提交人</span><span class="value">{{ drawerDetail.submitter_name }}</span></div>
              <div class="detail-item"><span class="label">提交时间</span><span class="value">{{ formatFullTime(drawerDetail.requested_at) }}</span></div>
              <div class="detail-item"><span class="label">所属组织</span><span class="value">{{ drawerDetail.org_name || '未配置' }}</span></div>
              <div class="detail-item"><span class="label">更新时间</span><span class="value">{{ formatFullTime(drawerDetail.reviewed_at || drawerDetail.requested_at) }}</span></div>
            </div>
            <div v-if="drawerDetail.submit_reason" class="detail-block">
              <span class="label">申请说明</span>
              <p class="value">{{ drawerDetail.submit_reason }}</p>
            </div>
          </div>
          <div class="detail-section">
            <h3 class="detail-section-title">表单基础信息</h3>
            <div class="detail-grid">
              <div class="detail-item"><span class="label">表单名称</span><span class="value">{{ drawerDetail.form_title }}</span></div>
              <div class="detail-item"><span class="label">表单类型</span><span class="value">{{ drawerDetail.form_type }}</span></div>
              <div class="detail-item"><span class="label">表单状态</span><span class="value">{{ drawerDetail.form_status }}</span></div>
              <div class="detail-item"><span class="label">创建人</span><span class="value">{{ drawerDetail.form_publisher_name || '未知' }}</span></div>
              <div class="detail-item"><span class="label">创建时间</span><span class="value">{{ formatFullTime(drawerDetail.form_created_at) }}</span></div>
              <div class="detail-item"><span class="label">匿名评价</span><span class="value">{{ drawerDetail.form_anonymous ? '是' : '否' }}</span></div>
            </div>
            <div v-if="drawerDetail.form_description" class="detail-block">
              <span class="label">表单说明</span>
              <p class="value">{{ drawerDetail.form_description }}</p>
            </div>
          </div>
          <div class="detail-section">
            <h3 class="detail-section-title">评价对象</h3>
            <div class="detail-grid">
              <div class="detail-item"><span class="label">所属组织</span><span class="value">{{ drawerDetail.org_name || '组织未匹配' }}</span></div>
              <div v-if="drawerDetail.course_id" class="detail-item">
                <span class="label">关联课程</span>
                <span class="value">{{ drawerDetail.object_type_label }}：{{ drawerDetail.object_name || '对象未匹配' }}</span>
              </div>
              <div v-if="drawerDetail.service_item_id" class="detail-item">
                <span class="label">关联服务项</span>
                <span class="value">{{ drawerDetail.object_type_label }}：{{ drawerDetail.object_name || '对象未匹配' }}</span>
              </div>
            </div>
          </div>
          <div class="detail-section">
            <h3 class="detail-section-title">评价窗口</h3>
            <template v-if="drawerDetail.windows.length">
              <div v-for="w in drawerDetail.windows" :key="w.id" class="window-card">
                <div class="detail-grid">
                  <div class="detail-item"><span class="label">开始时间</span><span class="value">{{ formatFullTime(w.start_at) }}</span></div>
                  <div class="detail-item"><span class="label">截止时间</span><span class="value">{{ formatFullTime(w.end_at) }}</span></div>
                  <div class="detail-item"><span class="label">窗口状态</span><span class="value"><el-tag size="small" :type="w.status_code === 'open' ? 'success' : w.status_code === 'pending' ? 'warning' : 'info'" effect="plain">{{ w.status_label }}</el-tag></span></div>
                </div>
              </div>
            </template>
            <p v-else class="detail-empty">未配置评价窗口</p>
          </div>
          <div class="detail-section">
            <h3 class="detail-section-title">审核记录</h3>
            <div class="timeline">
              <div class="timeline-item">
                <span class="timeline-dot tone-info"></span>
                <div class="timeline-content">
                  <span class="timeline-text">{{ drawerDetail.submitter_name }} 提交审核申请</span>
                  <span class="timeline-time">{{ formatFullTime(drawerDetail.requested_at) }}</span>
                </div>
              </div>
              <div v-if="drawerDetail.audit_status_code !== 'pending'" class="timeline-item">
                <span class="timeline-dot" :class="drawerDetail.audit_status_code === 'approved' ? 'tone-success' : 'tone-danger'"></span>
                <div class="timeline-content">
                  <span class="timeline-text">{{ drawerDetail.reviewed_by_name || '审核人' }} {{ drawerDetail.audit_status_code === 'approved' ? '审核通过' : '驳回' }}</span>
                  <span class="timeline-time">{{ formatFullTime(drawerDetail.reviewed_at) }}</span>
                  <p v-if="drawerDetail.review_comment" class="timeline-comment">{{ drawerDetail.review_comment }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="detail-section">
            <h3 class="detail-section-title">
              {{ drawerDetail.audit_status_code === 'pending' ? '风险检查' : '配置记录检查' }}
            </h3>
            <template v-if="drawerDetail.audit_status_code === 'pending'">
              <template v-if="drawerDetail.blocking_risks && drawerDetail.blocking_risks.length">
                <div v-for="(risk, i) in drawerDetail.blocking_risks" :key="'b'+i" class="risk-item risk-blocking">
                  <el-icon color="var(--color-danger)"><Warning /></el-icon>
                  <span>{{ risk }}（阻断项）</span>
                </div>
              </template>
              <template v-if="drawerDetail.warning_risks && drawerDetail.warning_risks.length">
                <div v-for="(risk, i) in drawerDetail.warning_risks" :key="'w'+i" class="risk-item">
                  <el-icon color="var(--color-warning)"><Warning /></el-icon>
                  <span>{{ risk }}</span>
                </div>
              </template>
              <p v-if="(!drawerDetail.blocking_risks || !drawerDetail.blocking_risks.length) && (!drawerDetail.warning_risks || !drawerDetail.warning_risks.length)" class="detail-empty" style="color: var(--color-success)">
                <el-icon :size="16"><Check /></el-icon> 未发现配置风险
              </p>
            </template>
            <template v-else>
              <template v-if="drawerDetail.blocking_risks && drawerDetail.blocking_risks.length">
                <div v-for="(risk, i) in drawerDetail.blocking_risks" :key="'h'+i" class="risk-item risk-history">
                  <el-icon color="var(--color-text-placeholder)"><Warning /></el-icon>
                  <span>历史数据缺少{{ risk.replace('未配置', '配置记录').replace('至少需要配置1个题目', '题目配置记录') }}</span>
                </div>
              </template>
              <p v-else class="detail-empty" style="color: var(--color-success)">
                <el-icon :size="16"><Check /></el-icon> 配置记录完整
              </p>
            </template>
          </div>
        </template>
        <div v-else-if="!drawerLoading" class="empty-state">
          <p class="empty-title">表单信息未完整配置</p>
        </div>
      </div>
      <template #footer>
        <template v-if="drawerDetail?.audit_status_code === 'pending'">
          <el-button type="danger" plain @click="openReject(drawerDetail.audit_id)">驳回</el-button>
          <el-tooltip
            v-if="drawerDetail.blocking_risks && drawerDetail.blocking_risks.length > 0"
            content="请修复风险项后再审核通过"
            placement="top"
          >
            <el-button class="btn-disabled-hint" disabled>存在阻断风险</el-button>
          </el-tooltip>
          <el-button v-else type="primary" @click="handleApprove({ ...drawerDetail, id: drawerDetail.audit_id, form_title: drawerDetail.form_title, status_code: 'pending' })">
            审核通过
          </el-button>
        </template>
        <el-button v-else @click="drawerVisible = false">关闭</el-button>
      </template>
    </el-drawer>

    <!-- ==================== 追溯授权审批 - 详情抽屉 ==================== -->
    <el-drawer v-model="traceDrawerVisible" title="追溯授权审批详情" size="720px" :close-on-click-modal="true">
      <div v-loading="traceDrawerLoading">
        <template v-if="traceDrawerDetail">
          <!-- 隐私安全提示 -->
          <el-alert type="warning" :closable="false" show-icon class="detail-privacy-alert">
            <template #title>匿名安全提示</template>
            追溯授权审批过程中，不展示匿名评价者的真实身份。授权通过后，申请人方可查看评价者信息。
          </el-alert>

          <!-- 授权申请信息 -->
          <div class="detail-section">
            <h3 class="detail-section-title">授权申请信息</h3>
            <div class="detail-grid">
              <div class="detail-item"><span class="label">申请编号</span><span class="value">#{{ traceDrawerDetail.trace_id }}</span></div>
              <div class="detail-item"><span class="label">当前状态</span><span class="value"><el-tag :type="statusTagType(traceDrawerDetail.status_code)" size="small" effect="plain">{{ traceDrawerDetail.status }}</el-tag></span></div>
              <div class="detail-item"><span class="label">申请人</span><span class="value">{{ traceDrawerDetail.applicant_name }}</span></div>
              <div class="detail-item"><span class="label">申请时间</span><span class="value">{{ formatFullTime(traceDrawerDetail.requested_at) }}</span></div>
              <div v-if="traceDrawerDetail.approved_at" class="detail-item"><span class="label">授权时间</span><span class="value">{{ formatFullTime(traceDrawerDetail.approved_at) }}</span></div>
              <div v-if="traceDrawerDetail.rejected_at" class="detail-item"><span class="label">拒绝时间</span><span class="value">{{ formatFullTime(traceDrawerDetail.rejected_at) }}</span></div>
            </div>
            <div class="detail-block">
              <span class="label">申请原因</span>
              <p class="value">{{ traceDrawerDetail.reason || '无' }}</p>
            </div>
          </div>

          <!-- 关联申诉信息 -->
          <div class="detail-section">
            <h3 class="detail-section-title">关联申诉信息</h3>
            <div class="detail-grid">
              <div class="detail-item"><span class="label">申诉编号</span><span class="value">{{ traceDrawerDetail.appeal_no }}</span></div>
              <div class="detail-item"><span class="label">申诉状态</span><span class="value">{{ traceDrawerDetail.appeal_status }}</span></div>
              <div class="detail-item"><span class="label">申诉人</span><span class="value">{{ traceDrawerDetail.appeal_appellant_name }}</span></div>
              <div class="detail-item"><span class="label">关联表单</span><span class="value">{{ traceDrawerDetail.form_name }}</span></div>
            </div>
            <div class="detail-block">
              <span class="label">申诉原因</span>
              <p class="value">{{ traceDrawerDetail.appeal_reason || '无' }}</p>
            </div>
          </div>

          <!-- 审批记录 -->
          <div class="detail-section">
            <h3 class="detail-section-title">审批记录</h3>
            <div class="timeline">
              <div class="timeline-item">
                <span class="timeline-dot tone-info"></span>
                <div class="timeline-content">
                  <span class="timeline-text">{{ traceDrawerDetail.applicant_name }} 发起追溯授权申请</span>
                  <span class="timeline-time">{{ formatFullTime(traceDrawerDetail.requested_at) }}</span>
                </div>
              </div>
              <div v-if="traceDrawerDetail.status_code !== 'pending'" class="timeline-item">
                <span class="timeline-dot" :class="traceDrawerDetail.status_code === 'approved' ? 'tone-success' : 'tone-danger'"></span>
                <div class="timeline-content">
                  <span class="timeline-text">{{ traceDrawerDetail.approver_name || '审核人' }} {{ traceDrawerDetail.status_code === 'approved' ? '同意授权' : '拒绝授权' }}</span>
                  <span class="timeline-time">{{ formatFullTime(traceDrawerDetail.approved_at || traceDrawerDetail.rejected_at) }}</span>
                  <p v-if="traceDrawerDetail.reject_reason" class="timeline-comment">拒绝原因：{{ traceDrawerDetail.reject_reason }}</p>
                </div>
              </div>
              <div v-for="log in traceDrawerDetail.logs" :key="log.id" class="timeline-item">
                <span class="timeline-dot tone-info"></span>
                <div class="timeline-content">
                  <span class="timeline-text">{{ log.content }}</span>
                  <span class="timeline-time">{{ formatFullTime(log.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
        <div v-else-if="!traceDrawerLoading" class="empty-state">
          <p class="empty-title">追溯授权信息未找到</p>
        </div>
      </div>
      <template #footer>
        <template v-if="traceDrawerDetail?.status_code === 'pending'">
          <el-button type="danger" plain @click="openTraceReject(traceDrawerDetail.trace_id)">拒绝</el-button>
          <el-button type="primary" @click="handleTraceApprove({ id: traceDrawerDetail.trace_id, status_code: 'pending' })">同意授权</el-button>
        </template>
        <el-button v-else @click="traceDrawerVisible = false">关闭</el-button>
      </template>
    </el-drawer>

    <!-- ==================== 评价表单审核 - 驳回弹窗 ==================== -->
    <el-dialog v-model="rejectVisible" title="驳回评价表单审核申请" width="520px" :close-on-click-modal="false">
      <p class="reject-desc">请填写驳回原因，提交人可根据原因修改后重新提交审核。</p>
      <div class="quick-reasons">
        <el-tag v-for="r in quickReasons" :key="r" size="small" effect="plain" class="quick-tag" :class="{ active: rejectForm.quickReason === r }" @click="selectQuickReason(r)">{{ r }}</el-tag>
      </div>
      <el-form ref="rejectFormRef" :model="rejectForm" :rules="rejectRules" label-position="top">
        <el-form-item label="驳回原因" prop="reason">
          <el-input v-model="rejectForm.reason" type="textarea" :rows="4" maxlength="300" show-word-limit placeholder="请填写驳回原因（10-300字）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" @click="submitReject">确认驳回</el-button>
      </template>
    </el-dialog>

    <!-- ==================== 追溯授权审批 - 拒绝弹窗 ==================== -->
    <el-dialog v-model="traceRejectVisible" title="拒绝追溯授权申请" width="520px" :close-on-click-modal="false">
      <p class="reject-desc">请填写拒绝原因，申请人将根据原因了解拒绝理由。</p>
      <el-form ref="traceRejectFormRef" :model="traceRejectForm" :rules="traceRejectRules" label-position="top">
        <el-form-item label="拒绝原因" prop="reason">
          <el-input v-model="traceRejectForm.reason" type="textarea" :rows="4" maxlength="300" show-word-limit placeholder="请填写拒绝原因（10-300字）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="traceRejectVisible = false">取消</el-button>
        <el-button type="danger" @click="submitTraceReject">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.audit-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

/* 页面标题 */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.page-title {
  font-size: var(--font-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}
.page-subtitle {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  margin: var(--space-1) 0 0;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* Tab 切换 */
.tab-bar {
  display: flex;
  align-items: center;
}
.tab-bar :deep(.el-radio-group) {
  display: flex;
  gap: 0;
}
.tab-bar :deep(.el-radio-button__inner) {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}
.tab-badge {
  margin-left: var(--space-1);
}
.tab-badge :deep(.el-badge__content) {
  font-size: 10px;
}

/* 状态统计卡片 */
.status-cards {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--space-3);
}
.status-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  border: var(--border-lighter);
  padding: var(--space-4) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  transition: box-shadow 0.2s;
}
.status-card:hover { box-shadow: var(--shadow-card); }
.card-value {
  font-size: var(--font-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}
.card-label {
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
}
.tone-warning .card-value { color: var(--color-warning); }
.tone-success .card-value { color: var(--color-success); }
.tone-danger .card-value { color: var(--color-danger); }
.tone-info .card-value { color: var(--color-primary); }

/* 筛选工具栏 */
.filter-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  border: var(--border-lighter);
  padding: var(--space-3) var(--space-4);
  flex-wrap: wrap;
}

/* 隐私提示 */
.privacy-alert {
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
}

/* 审核列表 */
.audit-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: var(--space-16);
}
.audit-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  border: var(--border-lighter);
  padding: var(--space-4) var(--space-5);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  transition: box-shadow 0.2s;
}
.audit-card:hover { box-shadow: var(--shadow-card); }
.audit-card-main { flex: 1; min-width: 0; }
.audit-card-row1 {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}
.audit-form-title {
  font-size: var(--font-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.type-tag { flex-shrink: 0; }
.audit-card-row2 {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
  flex-wrap: wrap;
}
.audit-card-row2 .el-icon { font-size: var(--font-sm); vertical-align: -2px; }
.sep { color: var(--color-text-placeholder); margin: 0 var(--space-1); }
.audit-card-row3 {
  margin-top: var(--space-2);
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
}
.review-label { color: var(--color-text-placeholder); }
.audit-card-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}
.approve-slot {
  display: inline-flex;
  min-width: 88px;
  justify-content: center;
}

/* 追溯申请原因预览 */
.trace-reason-preview {
  margin-top: var(--space-2);
  font-size: var(--font-xs);
  color: var(--color-text-body);
  line-height: var(--line-height-normal);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12) var(--space-4);
  gap: var(--space-2);
}
.empty-title {
  font-size: var(--font-base);
  color: var(--color-text-secondary);
  margin: 0;
}
.empty-desc {
  font-size: var(--font-sm);
  color: var(--color-text-placeholder);
  margin: 0;
}

/* 抽屉详情 */
.detail-section {
  margin-bottom: var(--space-5);
}
.detail-section-title {
  font-size: var(--font-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: var(--border-lighter);
}
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}
.detail-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.detail-item .label, .detail-block .label {
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
}
.detail-item .value, .detail-block .value {
  font-size: var(--font-sm);
  color: var(--color-text-body);
}
.detail-block {
  margin-top: var(--space-3);
}
.detail-block .value {
  margin: var(--space-1) 0 0;
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-page);
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
  line-height: var(--line-height-relaxed);
}
.detail-empty {
  font-size: var(--font-sm);
  color: var(--color-text-placeholder);
  text-align: center;
  padding: var(--space-4);
}
.detail-privacy-alert {
  margin-bottom: var(--space-4);
}
.window-card {
  background: var(--color-bg-page);
  border-radius: var(--radius-sm);
  padding: var(--space-3);
  margin-bottom: var(--space-2);
}

/* 时间线 */
.timeline {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}
.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: var(--space-1);
  flex-shrink: 0;
  background: var(--color-text-placeholder);
}
.timeline-dot.tone-success { background: var(--color-success); }
.timeline-dot.tone-danger { background: var(--color-danger); }
.timeline-dot.tone-info { background: var(--color-primary); }
.timeline-content { flex: 1; }
.timeline-text {
  font-size: var(--font-sm);
  color: var(--color-text-body);
}
.timeline-time {
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
  margin-left: var(--space-2);
}
.timeline-comment {
  margin: var(--space-1) 0 0;
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  padding: var(--space-2);
  background: var(--color-bg-page);
  border-radius: var(--radius-sm);
}

/* 风险检查 */
.risk-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-sm);
  color: var(--color-warning);
  padding: var(--space-2) var(--space-3);
  background: var(--color-risk-warning-bg);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-2);
}
.risk-item.risk-blocking {
  color: var(--color-danger);
  background: var(--color-risk-danger-bg);
}
.risk-item.risk-history {
  color: var(--color-text-secondary);
  background: var(--color-bg-page);
}

/* 列表风险提示 */
.audit-card-risk {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-xs);
  color: var(--color-warning);
  margin-top: var(--space-2);
  padding: var(--space-1) var(--space-2);
  background: var(--color-risk-warning-light);
  border-radius: var(--radius-sm);
}

/* 驳回/拒绝弹窗 */
.reject-desc {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-3);
}
.quick-reasons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}
.quick-tag {
  cursor: pointer;
  transition: all 0.2s;
}
.quick-tag:hover, .quick-tag.active {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: var(--color-risk-tag-hover);
}

/* 审核通过确认弹窗按钮样式 */
:deep(.el-message-box__btns .audit-confirm-btn) {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-text-white);
}
:deep(.el-message-box__btns .audit-confirm-btn:hover) {
  background-color: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

/* 禁用状态阻断按钮 */
.btn-disabled-hint {
  color: var(--color-text-placeholder) !important;
  background: var(--color-bg-page) !important;
  border-color: var(--color-border-lighter) !important;
  cursor: not-allowed;
}

/* 响应式 */
@media (max-width: 1400px) {
  .status-cards { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 1000px) {
  .status-cards { grid-template-columns: repeat(2, 1fr); }
  .audit-card { flex-direction: column; align-items: flex-start; }
  .audit-card-actions { width: 100%; justify-content: flex-end; }
}
</style>
