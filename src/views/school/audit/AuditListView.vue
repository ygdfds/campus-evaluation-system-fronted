<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh, Search, DocumentChecked,
  Check, Close, View, Warning,
  OfficeBuilding, Timer, User, Lock,
} from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
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

const formPage = ref(1)
const formPageSize = ref(10)

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

const tracePage = ref(1)
const tracePageSize = ref(10)

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

// ==================== 分页计算 ====================
const paginatedAuditList = computed(() => {
  const start = (formPage.value - 1) * formPageSize.value
  return auditList.value.slice(start, start + formPageSize.value)
})

const paginatedTraceList = computed(() => {
  const start = (tracePage.value - 1) * tracePageSize.value
  return traceList.value.slice(start, start + tracePageSize.value)
})

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
onMounted(async () => {
  // 同时加载两个 Tab 的 summary，确保 badge 显示
  const tid = userStore.tenantId
  try {
    const [fs, ts] = await Promise.all([
      getSchoolAuditSummaryApi(tid),
      getTraceAuthSummaryApi(tid),
    ])
    formSummary.value = fs
    traceSummary.value = ts
  } catch { /* ignore */ }
  // 加载当前 Tab 的列表数据
  if (activeTab.value === 'trace') loadTraceData()
  else loadFormData()
})
</script>

<template>
  <div class="page">
    <PageHeader title="审核中心" description="审核本校评价表单发布申请与追溯授权申请">
      <template #actions>
        <el-button :icon="Refresh" @click="handleRefresh" :loading="formLoading || traceLoading">刷新</el-button>
      </template>
    </PageHeader>

    <div class="toolbar">
      <div class="toolbar-tabs">
        <el-radio-group :model-value="activeTab" @change="switchTab" size="large">
          <el-radio-button value="form"><el-icon><DocumentChecked /></el-icon>评价表单审核</el-radio-button>
          <el-radio-button value="trace"><el-icon><Lock /></el-icon>追溯授权审批<el-badge v-if="traceSummary.pending > 0" :value="traceSummary.pending" type="warning" class="badge" /></el-radio-button>
        </el-radio-group>
      </div>
      <div class="toolbar-stats">
        <span v-for="(c, i) in statusCards" :key="c.key" class="s">
          <em :class="`c-${c.tone}`">{{ c.value }}</em>{{ c.label }}<span v-if="i < statusCards.length - 1" class="d" />
        </span>
      </div>
    </div>

    <template v-if="activeTab === 'form'">
      <div class="filters">
        <el-input v-model="filters.keyword" placeholder="搜索表单名称、提交人、组织…" :prefix-icon="Search" clearable @clear="loadFormData" @keyup.enter="loadFormData" />
        <el-select v-model="filters.status" @change="loadFormData"><el-option label="全部状态" value="all" /><el-option label="待审核" value="pending" /><el-option label="已通过" value="approved" /><el-option label="已驳回" value="rejected" /></el-select>
        <el-select v-model="filters.formType" @change="loadFormData"><el-option label="全部类型" value="all" /><el-option label="教学评价" value="teaching" /><el-option label="服务评价" value="service" /><el-option label="即时评价" value="instant" /></el-select>
        <el-select v-model="filters.timeRange" @change="loadFormData"><el-option label="全部时间" value="all" /><el-option label="今日" value="today" /><el-option label="本周" value="week" /><el-option label="本月" value="month" /></el-select>
        <el-select v-model="filters.sort" @change="loadFormData"><el-option label="最新提交" value="latest" /><el-option label="最近审核" value="recent_audit" /><el-option label="状态优先" value="status_first" /></el-select>
        <el-button text type="primary" @click="resetFormFilters">重置</el-button>
      </div>

      <div class="list" v-loading="formLoading">
        <template v-if="auditList.length">
          <div v-for="item in paginatedAuditList" :key="item.id" class="card">
            <div class="card-body">
              <div class="card-hd">
                <span class="card-title">{{ item.form_title }}</span>
                <el-tag :type="statusTagType(item.status_code)" size="small" effect="plain">{{ item.status }}</el-tag>
                <el-tag size="small" effect="plain">{{ item.form_type }}</el-tag>
              </div>
              <div class="card-sub">
                <span><el-icon><User /></el-icon>{{ item.submitter_name }}</span>
                <span class="dot">·</span>
                <span><el-icon><OfficeBuilding /></el-icon>{{ item.org_name }}</span>
                <span class="dot">·</span>
                <span><el-icon><Timer /></el-icon>{{ item.window_summary }}</span>
                <span class="dot">·</span>
                <span>{{ formatTime(item.requested_at) }}</span>
                <template v-if="item.target_name">
                  <span class="dot">·</span>
                  <span>对象：{{ item.target_name }}</span>
                </template>
                <template v-if="item.submit_reason">
                  <span class="dot">·</span>
                  <span>说明：{{ item.submit_reason }}</span>
                </template>
              </div>
              <div v-if="item.missing_items?.length" class="card-risk">
                <el-icon :size="14" color="var(--color-warning)"><Warning /></el-icon>
                <span>{{ item.missing_items.length <= 2 ? '风险：' + item.missing_items.join('、') : '风险：存在 ' + item.missing_items.length + ' 项阻断问题' }}</span>
              </div>
              <div v-if="item.review_comment" class="card-note"><span class="note-label">审核意见：</span>{{ item.review_comment }}</div>
            </div>
            <div class="card-act">
              <span class="action-slot action-slot--detail">
                <el-button text type="primary" size="small" :icon="View" @click="openDetail(item.id)">查看详情</el-button>
              </span>
              <template v-if="item.status_code === 'pending'">
                <span class="action-slot action-slot--middle">
                  <el-tooltip v-if="item.missing_items?.length" :content="'请先' + item.missing_items.join('、')" placement="top">
                    <el-button type="warning" size="small" plain :icon="Warning" disabled>存在风险</el-button>
                  </el-tooltip>
                  <el-button v-else type="primary" size="small" plain :icon="Check" @click="handleApprove(item)">通过</el-button>
                </span>
                <span class="action-slot action-slot--reject">
                  <el-button type="danger" size="small" plain :icon="Close" @click="openReject(item.id)">驳回</el-button>
                </span>
              </template>
            </div>
          </div>
          <div class="pagination-bar" v-if="auditList.length > 0">
            <el-pagination
              v-model:current-page="formPage"
              :page-size="formPageSize"
              :total="auditList.length"
              layout="prev, pager, next"
            />
          </div>
        </template>
        <div v-else-if="!formLoading" class="empty">
          <el-icon :size="48" color="var(--color-text-placeholder)"><DocumentChecked /></el-icon>
          <p>暂无审核申请</p>
          <span>职工提交评价表单审核后，将在这里处理发布申请。</span>
        </div>
      </div>
    </template>

    <template v-if="activeTab === 'trace'">
      <div class="filters">
        <el-input v-model="traceFilters.keyword" placeholder="搜索申请编号、申诉编号、申请人…" :prefix-icon="Search" clearable @clear="loadTraceData" @keyup.enter="loadTraceData" />
        <el-select v-model="traceFilters.status" @change="loadTraceData"><el-option label="全部状态" value="all" /><el-option label="待审批" value="pending" /><el-option label="已授权" value="approved" /><el-option label="已拒绝" value="rejected" /></el-select>
        <el-select v-model="traceFilters.timeRange" @change="loadTraceData"><el-option label="全部时间" value="all" /><el-option label="今日" value="today" /><el-option label="本周" value="week" /><el-option label="本月" value="month" /></el-select>
        <el-select v-model="traceFilters.sort" @change="loadTraceData"><el-option label="最新申请" value="latest" /><el-option label="最近审批" value="recent_audit" /><el-option label="状态优先" value="status_first" /></el-select>
        <el-button text type="primary" @click="resetTraceFilters">重置</el-button>
      </div>

      <el-alert type="info" :closable="false" show-icon class="alert">
        <template #title><span>隐私保护提示：审批页面不展示匿名评价者身份信息，授权通过后申请人方可查看。</span></template>
      </el-alert>

      <div class="list" v-loading="traceLoading">
        <template v-if="traceList.length">
          <div v-for="item in paginatedTraceList" :key="item.id" class="card">
            <div class="card-body">
              <div class="card-hd">
                <span class="card-title">追溯授权申请</span>
                <el-tag :type="statusTagType(item.status_code)" size="small" effect="plain">{{ item.status }}</el-tag>
                <el-tag size="small" effect="plain">{{ item.appeal_no }}</el-tag>
              </div>
              <div class="card-sub">
                <span><el-icon><User /></el-icon>申请人：{{ item.applicant_name }}</span>
                <span class="dot">·</span>
                <span>关联表单：{{ item.form_name }}</span>
                <span class="dot">·</span>
                <span>申诉编号：{{ item.appeal_no }}</span>
                <span class="dot">·</span>
                <span>{{ formatTime(item.requested_at) }}</span>
                <template v-if="item.applicant_account">
                  <span class="dot">·</span>
                  <span>账号：{{ item.applicant_account }}</span>
                </template>
                <template v-if="item.expected_count">
                  <span class="dot">·</span>
                  <span>期望：{{ item.expected_count }}条记录</span>
                </template>
              </div>
              <div class="card-reason"><span class="note-label">申请原因：</span>{{ item.reason.length > 80 ? item.reason.slice(0, 80) + '…' : item.reason }}</div>
            </div>
            <div class="card-act">
              <el-button text type="primary" size="small" :icon="View" @click="openTraceDetail(item.id)">查看详情</el-button>
              <template v-if="item.status_code === 'pending'">
                <el-button type="primary" size="small" plain :icon="Check" @click="handleTraceApprove(item)">同意授权</el-button>
                <el-button type="danger" size="small" plain :icon="Close" @click="openTraceReject(item.id)">拒绝</el-button>
              </template>
            </div>
          </div>
          <div class="pagination-bar" v-if="traceList.length > 0">
            <el-pagination
              v-model:current-page="tracePage"
              :page-size="tracePageSize"
              :total="traceList.length"
              layout="prev, pager, next"
            />
          </div>
        </template>
        <div v-else-if="!traceLoading" class="empty">
          <el-icon :size="48" color="var(--color-text-placeholder)"><Lock /></el-icon>
          <p>暂无追溯授权申请</p>
          <span>教职工发起追溯授权申请后，将在这里进行审批处理。</span>
        </div>
      </div>
    </template>

    <el-drawer v-model="drawerVisible" title="评价表单审核详情" size="720px" :close-on-click-modal="true">
      <div v-loading="drawerLoading">
        <template v-if="drawerDetail">
          <div class="ds"><h3 class="ds-title">审核申请信息</h3><div class="dg"><div class="di"><span class="dl">审核编号</span><span class="dv">#{{ drawerDetail.audit_id }}</span></div><div class="di"><span class="dl">当前状态</span><span class="dv"><el-tag :type="statusTagType(drawerDetail.audit_status_code)" size="small" effect="plain">{{ drawerDetail.audit_status }}</el-tag></span></div><div class="di"><span class="dl">提交人</span><span class="dv">{{ drawerDetail.submitter_name }}</span></div><div class="di"><span class="dl">提交时间</span><span class="dv">{{ formatFullTime(drawerDetail.requested_at) }}</span></div><div class="di"><span class="dl">所属组织</span><span class="dv">{{ drawerDetail.org_name || '未配置' }}</span></div><div class="di"><span class="dl">更新时间</span><span class="dv">{{ formatFullTime(drawerDetail.reviewed_at || drawerDetail.requested_at) }}</span></div></div><div v-if="drawerDetail.submit_reason" class="db"><span class="dl">申请说明</span><p class="dv">{{ drawerDetail.submit_reason }}</p></div></div>
          <div class="ds"><h3 class="ds-title">表单基础信息</h3><div class="dg"><div class="di"><span class="dl">表单名称</span><span class="dv">{{ drawerDetail.form_title }}</span></div><div class="di"><span class="dl">表单类型</span><span class="dv">{{ drawerDetail.form_type }}</span></div><div class="di"><span class="dl">表单状态</span><span class="dv">{{ drawerDetail.form_status }}</span></div><div class="di"><span class="dl">创建人</span><span class="dv">{{ drawerDetail.form_publisher_name || '未知' }}</span></div><div class="di"><span class="dl">创建时间</span><span class="dv">{{ formatFullTime(drawerDetail.form_created_at) }}</span></div><div class="di"><span class="dl">匿名评价</span><span class="dv">{{ drawerDetail.form_anonymous ? '是' : '否' }}</span></div></div><div v-if="drawerDetail.form_description" class="db"><span class="dl">表单说明</span><p class="dv">{{ drawerDetail.form_description }}</p></div></div>
          <div class="ds"><h3 class="ds-title">评价对象</h3><div class="dg"><div class="di"><span class="dl">所属组织</span><span class="dv">{{ drawerDetail.org_name || '组织未匹配' }}</span></div><div v-if="drawerDetail.course_id" class="di"><span class="dl">关联课程</span><span class="dv">{{ drawerDetail.object_type_label }}：{{ drawerDetail.object_name || '对象未匹配' }}</span></div><div v-if="drawerDetail.service_item_id" class="di"><span class="dl">关联服务项</span><span class="dv">{{ drawerDetail.object_type_label }}：{{ drawerDetail.object_name || '对象未匹配' }}</span></div></div></div>
          <div class="ds"><h3 class="ds-title">评价窗口</h3><template v-if="drawerDetail.windows.length"><div v-for="w in drawerDetail.windows" :key="w.id" class="wc"><div class="dg"><div class="di"><span class="dl">开始时间</span><span class="dv">{{ formatFullTime(w.start_at) }}</span></div><div class="di"><span class="dl">截止时间</span><span class="dv">{{ formatFullTime(w.end_at) }}</span></div><div class="di"><span class="dl">窗口状态</span><span class="dv"><el-tag size="small" :type="w.status_code === 'open' ? 'success' : w.status_code === 'pending' ? 'warning' : 'info'" effect="plain">{{ w.status_label }}</el-tag></span></div></div></div></template><p v-else class="de">未配置评价窗口</p></div>
          <div class="ds"><h3 class="ds-title">审核记录</h3><div class="tl"><div class="ti"><span class="td ti-info"></span><div class="tc"><span class="tt">{{ drawerDetail.submitter_name }} 提交审核申请</span><span class="tm">{{ formatFullTime(drawerDetail.requested_at) }}</span></div></div><div v-if="drawerDetail.audit_status_code !== 'pending'" class="ti"><span class="td" :class="drawerDetail.audit_status_code === 'approved' ? 'ti-ok' : 'ti-no'"></span><div class="tc"><span class="tt">{{ drawerDetail.reviewed_by_name || '审核人' }} {{ drawerDetail.audit_status_code === 'approved' ? '审核通过' : '驳回' }}</span><span class="tm">{{ formatFullTime(drawerDetail.reviewed_at) }}</span><p v-if="drawerDetail.review_comment" class="tcm">{{ drawerDetail.review_comment }}</p></div></div></div></div>
          <div class="ds"><h3 class="ds-title">{{ drawerDetail.audit_status_code === 'pending' ? '风险检查' : '配置记录检查' }}</h3><template v-if="drawerDetail.audit_status_code === 'pending'"><template v-if="drawerDetail.blocking_risks?.length"><div v-for="(r, i) in drawerDetail.blocking_risks" :key="'b'+i" class="ri ri-b"><el-icon color="var(--color-danger)"><Warning /></el-icon><span>{{ r }}（阻断项）</span></div></template><template v-if="drawerDetail.warning_risks?.length"><div v-for="(r, i) in drawerDetail.warning_risks" :key="'w'+i" class="ri"><el-icon color="var(--color-warning)"><Warning /></el-icon><span>{{ r }}</span></div></template><p v-if="!drawerDetail.blocking_risks?.length && !drawerDetail.warning_risks?.length" class="de" style="color:var(--color-success)"><el-icon :size="16"><Check /></el-icon> 未发现配置风险</p></template><template v-else><template v-if="drawerDetail.blocking_risks?.length"><div v-for="(r, i) in drawerDetail.blocking_risks" :key="'h'+i" class="ri ri-h"><el-icon color="var(--color-text-placeholder)"><Warning /></el-icon><span>历史数据缺少{{ r.replace('未配置', '配置记录').replace('至少需要配置1个题目', '题目配置记录') }}</span></div></template><p v-else class="de" style="color:var(--color-success)"><el-icon :size="16"><Check /></el-icon> 配置记录完整</p></template></div>
        </template>
        <div v-else-if="!drawerLoading" class="empty"><p>表单信息未完整配置</p></div>
      </div>
      <template #footer>
        <template v-if="drawerDetail?.audit_status_code === 'pending'">
          <el-button type="danger" plain @click="openReject(drawerDetail.audit_id)">驳回</el-button>
          <el-tooltip v-if="drawerDetail.blocking_risks?.length" content="请修复风险项后再审核通过" placement="top"><el-button class="btn-dis" disabled>存在阻断风险</el-button></el-tooltip>
          <el-button v-else type="primary" @click="handleApprove({ ...drawerDetail, id: drawerDetail.audit_id, form_title: drawerDetail.form_title, status_code: 'pending' })">审核通过</el-button>
        </template>
        <el-button v-else @click="drawerVisible = false">关闭</el-button>
      </template>
    </el-drawer>

    <el-drawer v-model="traceDrawerVisible" title="追溯授权审批详情" size="720px" :close-on-click-modal="true">
      <div v-loading="traceDrawerLoading">
        <template v-if="traceDrawerDetail">
          <el-alert type="warning" :closable="false" show-icon class="dpa"><template #title>匿名安全提示</template>追溯授权审批过程中，不展示匿名评价者的真实身份。授权通过后，申请人方可查看评价者信息。</el-alert>
          <div class="ds"><h3 class="ds-title">授权申请信息</h3><div class="dg"><div class="di"><span class="dl">申请编号</span><span class="dv">#{{ traceDrawerDetail.trace_id }}</span></div><div class="di"><span class="dl">当前状态</span><span class="dv"><el-tag :type="statusTagType(traceDrawerDetail.status_code)" size="small" effect="plain">{{ traceDrawerDetail.status }}</el-tag></span></div><div class="di"><span class="dl">申请人</span><span class="dv">{{ traceDrawerDetail.applicant_name }}</span></div><div class="di"><span class="dl">申请时间</span><span class="dv">{{ formatFullTime(traceDrawerDetail.requested_at) }}</span></div><div v-if="traceDrawerDetail.approved_at" class="di"><span class="dl">授权时间</span><span class="dv">{{ formatFullTime(traceDrawerDetail.approved_at) }}</span></div><div v-if="traceDrawerDetail.rejected_at" class="di"><span class="dl">拒绝时间</span><span class="dv">{{ formatFullTime(traceDrawerDetail.rejected_at) }}</span></div></div><div class="db"><span class="dl">申请原因</span><p class="dv">{{ traceDrawerDetail.reason || '无' }}</p></div></div>
          <div class="ds"><h3 class="ds-title">关联申诉信息</h3><div class="dg"><div class="di"><span class="dl">申诉编号</span><span class="dv">{{ traceDrawerDetail.appeal_no }}</span></div><div class="di"><span class="dl">申诉状态</span><span class="dv">{{ traceDrawerDetail.appeal_status }}</span></div><div class="di"><span class="dl">申诉人</span><span class="dv">{{ traceDrawerDetail.appeal_appellant_name }}</span></div><div class="di"><span class="dl">关联表单</span><span class="dv">{{ traceDrawerDetail.form_name }}</span></div></div><div class="db"><span class="dl">申诉原因</span><p class="dv">{{ traceDrawerDetail.appeal_reason || '无' }}</p></div></div>
          <div class="ds"><h3 class="ds-title">审批记录</h3><div class="tl"><div class="ti"><span class="td ti-info"></span><div class="tc"><span class="tt">{{ traceDrawerDetail.applicant_name }} 发起追溯授权申请</span><span class="tm">{{ formatFullTime(traceDrawerDetail.requested_at) }}</span></div></div><div v-if="traceDrawerDetail.status_code !== 'pending'" class="ti"><span class="td" :class="traceDrawerDetail.status_code === 'approved' ? 'ti-ok' : 'ti-no'"></span><div class="tc"><span class="tt">{{ traceDrawerDetail.approver_name || '审核人' }} {{ traceDrawerDetail.status_code === 'approved' ? '同意授权' : '拒绝授权' }}</span><span class="tm">{{ formatFullTime(traceDrawerDetail.approved_at || traceDrawerDetail.rejected_at) }}</span><p v-if="traceDrawerDetail.reject_reason" class="tcm">拒绝原因：{{ traceDrawerDetail.reject_reason }}</p></div></div><div v-for="log in traceDrawerDetail.logs" :key="log.id" class="ti"><span class="td ti-info"></span><div class="tc"><span class="tt">{{ log.content }}</span><span class="tm">{{ formatFullTime(log.created_at) }}</span></div></div></div></div>
        </template>
        <div v-else-if="!traceDrawerLoading" class="empty"><p>追溯授权信息未找到</p></div>
      </div>
      <template #footer>
        <template v-if="traceDrawerDetail?.status_code === 'pending'">
          <el-button type="danger" plain @click="openTraceReject(traceDrawerDetail.trace_id)">拒绝</el-button>
          <el-button type="primary" @click="handleTraceApprove({ id: traceDrawerDetail.trace_id, status_code: 'pending' })">同意授权</el-button>
        </template>
        <el-button v-else @click="traceDrawerVisible = false">关闭</el-button>
      </template>
    </el-drawer>

    <el-dialog v-model="rejectVisible" title="驳回评价表单审核申请" width="520px" :close-on-click-modal="false">
      <p class="rd">请填写驳回原因，提交人可根据原因修改后重新提交审核。</p>
      <div class="qr"><el-tag v-for="r in quickReasons" :key="r" size="small" effect="plain" class="qt" :class="{ on: rejectForm.quickReason === r }" @click="selectQuickReason(r)">{{ r }}</el-tag></div>
      <el-form ref="rejectFormRef" :model="rejectForm" :rules="rejectRules" label-position="top"><el-form-item label="驳回原因" prop="reason"><el-input v-model="rejectForm.reason" type="textarea" :rows="4" maxlength="300" show-word-limit placeholder="请填写驳回原因（10-300字）" /></el-form-item></el-form>
      <template #footer><el-button @click="rejectVisible = false">取消</el-button><el-button type="danger" @click="submitReject">确认驳回</el-button></template>
    </el-dialog>

    <el-dialog v-model="traceRejectVisible" title="拒绝追溯授权申请" width="520px" :close-on-click-modal="false">
      <p class="rd">请填写拒绝原因，申请人将根据原因了解拒绝理由。</p>
      <el-form ref="traceRejectFormRef" :model="traceRejectForm" :rules="traceRejectRules" label-position="top"><el-form-item label="拒绝原因" prop="reason"><el-input v-model="traceRejectForm.reason" type="textarea" :rows="4" maxlength="300" show-word-limit placeholder="请填写拒绝原因（10-300字）" /></el-form-item></el-form>
      <template #footer><el-button @click="traceRejectVisible = false">取消</el-button><el-button type="danger" @click="submitTraceReject">确认拒绝</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: var(--space-4); }

/* 工具栏：Tab + 统计 合并 */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-card);
  padding: var(--space-3) var(--space-4);
  box-shadow: var(--shadow-card);
}
.toolbar-tabs :deep(.el-radio-group) {
  display: flex;
  background: var(--color-bg-light);
  border-radius: var(--radius-md);
  padding: 3px;
}
.toolbar-tabs :deep(.el-radio-button__inner) {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  border: none !important;
  background: transparent !important;
  border-radius: var(--radius-sm) !important;
  padding: 6px var(--space-4);
  font-weight: var(--font-weight-medium);
  box-shadow: none !important;
}
.toolbar-tabs :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: var(--color-bg-card) !important;
  box-shadow: var(--shadow-sm) !important;
  color: var(--color-primary);
}
.badge { margin-left: var(--space-1); }
.badge :deep(.el-badge__content) { font-size: 10px; }

.toolbar-stats { display: flex; align-items: center; gap: var(--space-4); flex-shrink: 0; }
.s {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  font-size: var(--font-sm);
  color: var(--color-text-muted);
  white-space: nowrap;
}
.s em {
  font-style: normal;
  font-size: var(--font-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-heading);
}
.s .d {
  display: inline-block;
  width: 1px;
  height: 14px;
  background: var(--color-border-lighter);
  margin-left: var(--space-4);
}
.c-default em { color: var(--color-primary); }
.c-warning em { color: var(--color-warning); }
.c-success em { color: var(--color-success); }
.c-danger em { color: var(--color-danger); }
.c-info em { color: var(--color-primary); }

/* 筛选 */
.filters {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-card);
  padding: var(--space-3) var(--space-4);
  box-shadow: var(--shadow-card);
  flex-wrap: wrap;
}
.filters .el-input { width: 260px; }
.filters .el-select { width: 130px; }

/* 隐私提示 */
.alert { background: var(--color-bg-card); border-radius: var(--radius-card); }

/* 列表 */
.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: var(--space-16);
  padding: var(--space-3);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.card {
  background: #FBFCFF;
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  box-shadow: none;
  transition: background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}
.card:hover {
  background: var(--color-primary-50);
  border-color: var(--color-primary-100);
  box-shadow: 0 4px 12px rgba(16, 24, 40, 0.05);
}

.card-body { flex: 1; min-width: 0; }
.card-hd { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2); }
.card-title {
  font-size: var(--font-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-heading);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-sub {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-xs);
  color: var(--color-text-muted);
  flex-wrap: wrap;
}
.card-sub .el-icon { font-size: var(--font-sm); vertical-align: -2px; }
.dot { color: var(--color-text-disabled); margin: 0 var(--space-1); }
.card-risk {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  width: fit-content;
  max-width: min(420px, 100%);
  font-size: var(--font-xs);
  color: var(--color-warning);
  margin-top: var(--space-2);
  padding: 3px var(--space-2);
  background: var(--color-risk-warning-light);
  border: 1px solid rgba(245, 158, 11, 0.18);
  border-radius: var(--radius-full);
}
.card-risk span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-note {
  margin-top: var(--space-2);
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
}
.card-reason {
  margin-top: var(--space-2);
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
  line-height: 1.5;
}
.note-label { color: var(--color-text-placeholder); }

.card-act {
  display: grid;
  grid-template-columns: 86px 104px 72px;
  align-items: center;
  justify-content: end;
  gap: var(--space-2);
  flex-shrink: 0;
}
.action-slot {
  min-width: 0;
  display: flex;
  justify-content: center;
}
.action-slot :deep(.el-button) {
  width: 100%;
  margin-left: 0 !important;
}
.action-slot--detail :deep(.el-button) {
  justify-content: center;
}
.action-slot--middle :deep(.el-tooltip__trigger),
.action-slot--middle :deep(.el-button) {
  width: 100%;
}

/* 空状态 */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12) var(--space-4);
  gap: var(--space-2);
}
.empty p { font-size: var(--font-base); color: var(--color-text-secondary); margin: 0; }
.empty span { font-size: var(--font-sm); color: var(--color-text-placeholder); }

/* 抽屉 */
.ds { margin-bottom: var(--space-6); }
.ds-title {
  font-family: var(--font-family-display);
  font-size: var(--font-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-heading);
  margin: 0 0 var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-border-lighter);
}
.dg { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-4); }
.di { display: flex; flex-direction: column; gap: var(--space-1); }
.dl { font-size: var(--font-xs); color: var(--color-text-placeholder); }
.dv { font-size: var(--font-sm); color: var(--color-text-body); }
.db { margin-top: var(--space-3); }
.db .dv {
  margin: var(--space-1) 0 0;
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-light);
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
  line-height: var(--line-height-relaxed);
}
.de { font-size: var(--font-sm); color: var(--color-text-placeholder); text-align: center; padding: var(--space-4); }
.dpa { margin-bottom: var(--space-4); }
.wc { background: var(--color-bg-light); border-radius: var(--radius-sm); padding: var(--space-3); margin-bottom: var(--space-2); }

/* 时间线 */
.tl { display: flex; flex-direction: column; gap: var(--space-3); }
.ti { display: flex; align-items: flex-start; gap: var(--space-3); }
.td { width: 10px; height: 10px; border-radius: 50%; margin-top: var(--space-1); flex-shrink: 0; background: var(--color-text-disabled); }
.ti-ok { background: var(--color-success); }
.ti-no { background: var(--color-danger); }
.ti-info { background: var(--color-primary); }
.tc { flex: 1; }
.tt { font-size: var(--font-sm); color: var(--color-text-body); }
.tm { font-size: var(--font-xs); color: var(--color-text-placeholder); margin-left: var(--space-2); }
.tcm { margin: var(--space-1) 0 0; font-size: var(--font-sm); color: var(--color-text-secondary); padding: var(--space-2); background: var(--color-bg-light); border-radius: var(--radius-sm); }

/* 风险 */
.ri {
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
.ri-b { color: var(--color-danger); background: var(--color-risk-danger-bg); }
.ri-h { color: var(--color-text-secondary); background: var(--color-bg-light); }

/* 弹窗 */
.rd { font-size: var(--font-sm); color: var(--color-text-secondary); margin: 0 0 var(--space-3); }
.qr { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-4); }
.qt { cursor: pointer; transition: all 0.15s ease; }
.qt:hover, .qt.on { color: var(--color-primary); border-color: var(--color-primary); background: var(--color-primary-50); }

:deep(.el-message-box__btns .audit-confirm-btn) { background-color: var(--color-primary); border-color: var(--color-primary); color: var(--color-text-white); }
:deep(.el-message-box__btns .audit-confirm-btn:hover) { background-color: var(--color-primary-hover); border-color: var(--color-primary-hover); }

.btn-dis { color: var(--color-text-placeholder) !important; background: var(--color-bg-page) !important; border-color: var(--color-border-lighter) !important; cursor: not-allowed; }

@media (max-width: 1000px) {
  .toolbar { flex-direction: column; align-items: flex-start; }
  .card { flex-direction: column; align-items: flex-start; }
  .card-act { width: 100%; grid-template-columns: 86px 104px 72px; justify-content: flex-end; }
}
</style>
