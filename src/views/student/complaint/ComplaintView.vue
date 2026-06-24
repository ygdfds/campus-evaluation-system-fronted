<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { Search, RefreshRight, Delete, Upload, Plus, Close } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import {
  getMyComplaintsApi, getComplaintProcessRecordsApi,
  createComplaintApi, createProcessRecordApi, createFeedbackWorkOrderApi,
  createFileResourceApi, getCourseEnrollmentsApi,
  getCoursesApi, getServiceItemsApi, getTeachingOrgUnitsApi, getServiceOrgUnitsApi,
  cancelComplaintApi, getFeedbackWorkOrderBySourceApi, updateFeedbackWorkOrderApi,
} from '@/api/complaint'
import EmptyPlaceholder from '@/components/common/EmptyPlaceholder.vue'

defineOptions({ name: 'StudentComplaintView' })

const userStore = useUserStore()
const loading = ref(true)
const submitting = ref(false)

// ==================== 抽屉状态 ====================
const drawerVisible = ref(false)
const formDirty = ref(false)

// ==================== 表单状态 ====================
const form = reactive({
  complaint_type: '', target_type: '', target_id: null,
  title: '', content: '', anonymous_to_handler: false,
})
const formErrors = reactive({})
const attachments = ref([])

const complaintTypes = [
  { value: 'complaint', label: '投诉' }, { value: 'suggestion', label: '建议' },
  { value: 'inquiry', label: '咨询' }, { value: 'praise', label: '表扬' },
]
const targetTypes = [
  { value: 'teaching', label: '教学相关' }, { value: 'logistics', label: '后勤服务' }, { value: 'other', label: '其他' },
]
const otherTargets = [
  { id: 'service_center', name: '学校服务中心' },
  { id: 'it_center', name: '信息化服务中心' },
  { id: 'other', name: '其他问题' },
]

const targetOptions = ref([])
const targetLoading = ref(false)
const enrolledCourses = ref([])
const serviceItems = ref([])
const serviceOrgs = ref([])

// ==================== 列表状态 ====================
const complaints = ref([])
const searchText = ref('')
const filterType = ref('all')
const filterStatus = ref('all')
const sortBy = ref('latest')
const currentPage = ref(1)
const pageSize = 5

// ==================== 详情抽屉 ====================
const detailVisible = ref(false)
const detailData = ref(null)
const detailRecords = ref([])
const detailLoading = ref(false)

// ==================== 计算属性 ====================
const typeMap = { complaint: '投诉', suggestion: '建议', inquiry: '咨询', praise: '表扬' }
const statusMap = { pending: '待处理', processing: '处理中', resolved: '已办结', rejected: '已驳回', cancelled: '已撤销' }
const statusTypeMap = { pending: 'warning', processing: '', resolved: 'success', rejected: 'danger', cancelled: 'info' }

const filteredList = computed(() => {
  let list = complaints.value
  if (filterType.value !== 'all') list = list.filter(c => c.complaint_type === filterType.value)
  if (filterStatus.value !== 'all') list = list.filter(c => c.status === filterStatus.value)
  if (searchText.value.trim()) {
    const kw = searchText.value.trim().toLowerCase()
    list = list.filter(c =>
      (c.title || '').toLowerCase().includes(kw) ||
      (c.content || '').toLowerCase().includes(kw) ||
      (c._target_name || '').toLowerCase().includes(kw)
    )
  }
  if (sortBy.value === 'latest') list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  else list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
  return list
})

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredList.value.slice(start, start + pageSize)
})

function formatDateTime(dt) { return dt ? dt.replace('T', ' ').slice(0, 16) : '' }

// ==================== 抽屉操作 ====================
function openDrawer() { resetForm(); drawerVisible.value = true }

async function closeDrawer() {
  if (formDirty.value) {
    try {
      await ElMessageBox.confirm(
        '当前内容尚未提交，确认关闭？', '提示',
        { confirmButtonText: '确认关闭', cancelButtonText: '继续编辑', type: 'warning' }
      )
    } catch { return }
  }
  drawerVisible.value = false
  formDirty.value = false
  resetForm()
}

// 监听表单变化，标记 dirty
watch(() => ({ ...form }), (val) => {
  if (val.complaint_type || val.target_type || val.target_id || val.title || val.content) {
    formDirty.value = true
  }
}, { deep: true })

// ==================== 动态反馈对象加载 ====================
async function loadTargetOptions() {
  targetLoading.value = true
  targetOptions.value = []
  form.target_id = null
  const tid = userStore.tenantId, uid = userStore.userInfo?.id
  try {
    if (form.target_type === 'teaching') {
      const [enrollments, courses, orgs] = await Promise.all([
        getCourseEnrollmentsApi(tid, uid), getCoursesApi(tid), getTeachingOrgUnitsApi(tid),
      ])
      enrolledCourses.value = enrollments
      const enrolledIds = enrollments.map(e => e.course_id)
      const myCourses = courses.filter(c => enrolledIds.includes(c.id))
      // 构建课程选项：显示课程名 + 所属部门
      const courseOpts = myCourses.map(c => {
        const orgName = orgs.find(o => o.id === c.org_unit_id)?.name || ''
        const sub = orgName ? `${c.course_name} · ${orgName}` : c.course_name
        return { id: `course_${c.id}`, name: c.course_name, _display: sub, _sub: '课程', _rawId: c.id }
      })
      const orgOpts = orgs.map(o => ({
        id: `org_${o.id}`, name: o.name, _display: o.name, _sub: '教学部门', _rawId: o.id,
      }))
      targetOptions.value = [...courseOpts, ...orgOpts]
    } else if (form.target_type === 'logistics') {
      const [items, orgs] = await Promise.all([getServiceItemsApi(tid), getServiceOrgUnitsApi(tid)])
      serviceItems.value = items; serviceOrgs.value = orgs
      const itemOpts = items.map(s => {
        const orgName = orgs.find(o => o.id === s.service_org_id)?.name || ''
        const sub = orgName ? `${s.name} · ${orgName}` : s.name
        return { id: `sitem_${s.id}`, name: s.name, _display: sub, _sub: '服务项目', _rawId: s.id }
      })
      const orgOpts = orgs.map(o => ({
        id: `sorg_${o.id}`, name: o.name, _display: o.name, _sub: '服务部门', _rawId: o.id,
      }))
      targetOptions.value = [...orgOpts, ...itemOpts]
    } else if (form.target_type === 'other') {
      targetOptions.value = otherTargets.map(o => ({ id: o.id, name: o.name, _display: o.name, _sub: '' }))
    }
  } catch (e) { console.error('加载反馈对象失败', e) }
  finally { targetLoading.value = false }
}

// ==================== 附件 ====================
function handleFileSelect(event) {
  const files = Array.from(event.target.files || [])
  for (const file of files) {
    if (attachments.value.length >= 3) {
      ElMessage.warning('附件最多上传 3 个')
      break
    }
    attachments.value.push({ id: Date.now() + Math.random(), name: file.name, size: file.size })
    formDirty.value = true
  }
  event.target.value = ''
}
function removeAttachment(idx) { attachments.value.splice(idx, 1) }
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

// ==================== 表单校验 ====================
function validateForm() {
  Object.keys(formErrors).forEach(k => delete formErrors[k])
  if (!form.complaint_type) formErrors.complaint_type = '请选择反馈类型'
  if (!form.target_type) formErrors.target_type = '请选择对象类型'
  if (!form.target_id) formErrors.target_id = '请选择反馈对象'
  if (!form.title.trim()) formErrors.title = '请输入标题'
  else if (form.title.length > 50) formErrors.title = '标题不能超过50字'
  if (!form.content.trim()) formErrors.content = '请输入内容描述'
  else if (form.content.length < 10) formErrors.content = '内容至少10字'
  else if (form.content.length > 500) formErrors.content = '内容不能超过500字'
  if (attachments.value.length > 3) formErrors.attachments = '附件不超过3个'
  return Object.keys(formErrors).length === 0
}

function resetForm() {
  Object.assign(form, { complaint_type: '', target_type: '', target_id: null, title: '', content: '', anonymous_to_handler: false })
  attachments.value = []
  Object.keys(formErrors).forEach(k => delete formErrors[k])
  targetOptions.value = []
}

// ==================== 提交 ====================
async function handleSubmit() {
  if (!validateForm()) return
  try {
    await ElMessageBox.confirm(
      '提交后学校相关部门将按流程处理，你可以在本页面查看进度。',
      '确认提交投诉建议？',
      { confirmButtonText: '确认提交', cancelButtonText: '取消', type: 'info' }
    )
  } catch { return }

  submitting.value = true
  const now = new Date().toISOString()
  const tid = userStore.tenantId, uid = userStore.userInfo?.id, sid = userStore.schoolId
  try {
    const fileIds = []
    for (const att of attachments.value) {
      const fr = await createFileResourceApi({
        tenant_id: tid, school_id: sid, file_name: att.name, file_size: att.size,
        file_type: att.name.split('.').pop() || 'png', url: '', uploaded_at: now, deleted: false,
      })
      if (fr?.id) fileIds.push(fr.id)
    }

    const selectedOpt = targetOptions.value.find(o => o.id === form.target_id)
    const rawTargetId = selectedOpt?._rawId || form.target_id
    const complaintData = {
      tenant_id: tid, school_id: sid, submitter_id: uid,
      complaint_type: form.complaint_type, target_type: form.target_type, target_id: rawTargetId,
      title: form.title.trim(), content: form.content.trim(),
      status: 'pending', priority: 'normal', anonymous_to_handler: form.anonymous_to_handler,
      attachment_file_ids: fileIds, created_at: now, updated_at: now, deleted: false,
    }
    if (form.target_type === 'logistics') {
      const si = serviceItems.value.find(s => s.id === rawTargetId)
      const so = serviceOrgs.value.find(o => o.id === rawTargetId)
      if (si) complaintData.service_item_id = si.id
      if (so) complaintData.service_org_id = so.id
    } else if (form.target_type === 'teaching') {
      if (form.target_id?.startsWith('course_')) complaintData.course_id = rawTargetId
      else complaintData.teaching_org_id = rawTargetId
    }

    const newComplaint = await createComplaintApi(complaintData)
    await createProcessRecordApi({
      tenant_id: tid, complaint_id: newComplaint.id,
      handler_id: null, from_status: null, to_status: 'pending',
      content: '已提交，等待学校相关部门处理', created_at: now,
    })
    await createFeedbackWorkOrderApi({
      tenant_id: tid, submitter_id: uid, source: 'complaint', source_id: newComplaint.id,
      status: 'pending', priority: 'normal', created_at: now, updated_at: now, deleted: false,
    })

    ElMessage.success('投诉建议已提交')
    formDirty.value = false
    drawerVisible.value = false
    resetForm()
    await loadComplaints()
  } catch (err) { console.error('提交失败:', err); ElMessage.error('提交失败，请重试') }
  finally { submitting.value = false }
}

// ==================== 列表加载 ====================
async function loadComplaints() {
  const tid = userStore.tenantId, uid = userStore.userInfo?.id
  if (!tid || !uid) return
  try {
    const [complaintList, serviceItems, courses, teachingOrgs, serviceOrgs] = await Promise.all([
      getMyComplaintsApi(tid, uid),
      getServiceItemsApi(tid).catch(() => []),
      getCoursesApi(tid).catch(() => []),
      getTeachingOrgUnitsApi(tid).catch(() => []),
      getServiceOrgUnitsApi(tid).catch(() => []),
    ])
    const sItemMap = {}, courseMap = {}, tOrgMap = {}, sOrgMap = {}
    serviceItems.forEach(s => { sItemMap[s.id] = s })
    courses.forEach(c => { courseMap[c.id] = c })
    teachingOrgs.forEach(o => { tOrgMap[o.id] = o })
    serviceOrgs.forEach(o => { sOrgMap[o.id] = o })

    complaints.value = complaintList.map(c => {
      let targetName = ''
      if (c.target_type === 'logistics') {
        targetName = sItemMap[c.service_item_id]?.name || sOrgMap[c.service_org_id]?.name || ''
      } else if (c.target_type === 'teaching') {
        targetName = courseMap[c.course_id]?.course_name || tOrgMap[c.teaching_org_id]?.name || ''
      } else {
        targetName = otherTargets.find(o => o.id === c.target_id)?.name || ''
      }
      if (!targetName) targetName = c.target_type === 'other' ? '其他问题' : '未指定对象'
      return { ...c, _target_name: targetName }
    })
  } catch (e) { console.error('加载投诉列表失败:', e) }
  finally { loading.value = false }
}

// ==================== 详情 ====================
async function showDetail(item) {
  detailData.value = item; detailVisible.value = true; detailLoading.value = true; detailRecords.value = []
  try {
    const records = await getComplaintProcessRecordsApi(userStore.tenantId, item.id)
    records.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    detailRecords.value = records
  } catch (e) { console.error('加载处理记录失败:', e) }
  finally { detailLoading.value = false }
}

function handleReset() {
  searchText.value = ''; filterType.value = 'all'; filterStatus.value = 'all'; sortBy.value = 'latest'; currentPage.value = 1
}

// ==================== 撤销投诉建议 ====================
async function handleCancel(item, event) {
  event.stopPropagation()
  if (item.status !== 'pending') return
  try {
    await ElMessageBox.confirm(
      '撤销后学校将不再处理该事项，该操作不可恢复。',
      '确认撤销该投诉建议？',
      { confirmButtonText: '确认撤销', cancelButtonText: '取消', type: 'warning' }
    )
  } catch { return }

  const now = new Date().toISOString()
  const tid = userStore.tenantId, uid = userStore.userInfo?.id
  try {
    // 1. PATCH complaints/:id → status=cancelled
    await cancelComplaintApi(item.id, {
      status: 'cancelled',
      cancelled_at: now,
      cancel_reason: '用户主动撤销',
      updated_at: now,
    })
    // 2. POST complaintProcessRecords
    await createProcessRecordApi({
      tenant_id: tid, complaint_id: item.id,
      handler_id: null, from_status: 'pending', to_status: 'cancelled',
      content: '学生主动撤销投诉建议', created_at: now,
    })
    // 3. 查找并更新关联 feedbackWorkOrders
    const workOrders = await getFeedbackWorkOrderBySourceApi(tid, uid, item.id)
    for (const wo of workOrders) {
      if (wo.status !== 'cancelled') {
        await updateFeedbackWorkOrderApi(wo.id, { status: 'cancelled', updated_at: now })
      }
    }
    ElMessage.success('投诉建议已撤销')
    // 如果详情抽屉正在查看该条，刷新详情
    if (detailData.value?.id === item.id) {
      detailData.value = { ...detailData.value, status: 'cancelled' }
      const records = await getComplaintProcessRecordsApi(tid, item.id)
      records.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      detailRecords.value = records
    }
    await loadComplaints()
  } catch (err) { console.error('撤销失败:', err); ElMessage.error('撤销失败，请重试') }
}

onMounted(() => { loadComplaints() })
</script>

<template>
  <div class="page-container">
    <!-- 页面标题区 -->
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">投诉建议</h1>
        <p class="page-subtitle">
          提交校园服务问题、教学相关反馈或改进建议，并查看处理进度
          <span class="hint-tag">投诉建议不纳入公开评价统计，仅用于问题处理</span>
        </p>
      </div>
      <el-button type="primary" @click="openDrawer">
        <el-icon :size="14"><Plus /></el-icon> 新建投诉建议
      </el-button>
    </div>

    <!-- 筛选工具栏卡片 -->
    <div class="filter-card">
      <div class="filter-bar">
        <el-input v-model="searchText" placeholder="搜索标题、内容、反馈对象" :prefix-icon="Search"
          clearable class="search-input" @input="currentPage = 1" />
        <el-select v-model="filterType" class="filter-select" @change="currentPage = 1">
          <el-option label="全部类型" value="all" />
          <el-option v-for="t in complaintTypes" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
        <el-select v-model="filterStatus" class="filter-select" @change="currentPage = 1">
          <el-option label="全部状态" value="all" />
          <el-option label="待处理" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="已办结" value="resolved" />
          <el-option label="已驳回" value="rejected" />
          <el-option label="已撤销" value="cancelled" />
        </el-select>
        <el-select v-model="sortBy" class="filter-select">
          <el-option label="最新提交" value="latest" />
          <el-option label="最近更新" value="updated" />
        </el-select>
        <el-button text type="primary" size="small" @click="handleReset">
          <el-icon :size="14"><RefreshRight /></el-icon> 重置
        </el-button>
      </div>
    </div>

    <!-- 加载态 -->
    <div v-if="loading" class="loading-skeleton"><el-skeleton :rows="4" animated /></div>

    <!-- 卡片列表 -->
    <div v-else-if="filteredList.length" class="complaint-list">
      <div v-for="item in pagedList" :key="item.id" class="complaint-card" @click="showDetail(item)">
        <div class="cc-top">
          <h3 class="cc-title">{{ item.title }}</h3>
          <el-tag :type="statusTypeMap[item.status] || 'info'" size="small" effect="plain">
            {{ statusMap[item.status] || item.status }}
          </el-tag>
        </div>
        <div class="cc-meta">
          <span class="cc-type">{{ typeMap[item.complaint_type] || '—' }}</span>
          <span class="cc-sep">·</span>
          <span class="cc-target">{{ item._target_name || '—' }}</span>
          <span v-if="item.attachment_file_ids?.length" class="cc-attach">
            <span class="cc-sep">·</span> {{ item.attachment_file_ids.length }} 个附件
          </span>
        </div>
        <div class="cc-bottom">
          <span class="cc-time">提交于 {{ formatDateTime(item.created_at) }}</span>
          <div class="cc-actions">
            <el-button v-if="item.status === 'pending'" type="danger" size="small" text
              @click="handleCancel(item, $event)">撤销</el-button>
            <span class="cc-link">查看详情 →</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <EmptyPlaceholder text="暂无投诉建议记录" description="你可以提交校园服务问题、教学相关反馈或改进建议。" />
      <el-button type="primary" class="empty-btn" @click="openDrawer">新建投诉建议</el-button>
    </div>

    <!-- 分页 -->
    <div v-if="filteredList.length > pageSize" class="pagination-wrap">
      <el-pagination v-model:current-page="currentPage" :page-size="pageSize"
        :total="filteredList.length" layout="total, prev, pager, next" small />
    </div>

    <!-- ==================== 新建投诉建议抽屉 ==================== -->
    <el-drawer v-model="drawerVisible" direction="rtl" size="580px" :close-on-click-modal="true"
      :show-close="false" class="complaint-drawer" @close="closeDrawer">
      <!-- 自定义标题栏 -->
      <template #header>
        <div class="drawer-header">
          <span class="drawer-header-title">新建投诉建议</span>
          <el-icon class="drawer-close-btn" :size="18" @click="closeDrawer"><Close /></el-icon>
        </div>
      </template>

      <div class="drawer-form">
        <div class="form-row">
          <label class="form-label">反馈类型 <span class="req">*</span></label>
          <div class="type-pills">
            <button v-for="t in complaintTypes" :key="t.value" class="pill-btn"
              :class="{ 'is-active': form.complaint_type === t.value }"
              @click="form.complaint_type = t.value; delete formErrors.complaint_type">{{ t.label }}</button>
          </div>
          <span v-if="formErrors.complaint_type" class="field-error">{{ formErrors.complaint_type }}</span>
        </div>
        <div class="form-row">
          <label class="form-label">对象类型 <span class="req">*</span></label>
          <div class="type-pills">
            <button v-for="t in targetTypes" :key="t.value" class="pill-btn"
              :class="{ 'is-active': form.target_type === t.value }"
              @click="form.target_type = t.value; form.target_id = null; delete formErrors.target_type; loadTargetOptions()">{{ t.label }}</button>
          </div>
          <span v-if="formErrors.target_type" class="field-error">{{ formErrors.target_type }}</span>
        </div>
        <div class="form-row" v-if="form.target_type">
          <label class="form-label">反馈对象 <span class="req">*</span></label>
          <el-select :key="form.target_type" v-model="form.target_id" placeholder="请选择反馈对象" :loading="targetLoading"
            filterable class="form-select" @change="delete formErrors.target_id">
            <template v-if="!targetOptions.length && !targetLoading" #empty>
              <div class="select-empty">暂无可选反馈对象</div>
            </template>
            <el-option v-for="opt in targetOptions" :key="opt.id"
              :label="opt._display || opt.name" :value="opt.id" />
          </el-select>
          <span v-if="formErrors.target_id" class="field-error">{{ formErrors.target_id }}</span>
        </div>
        <div class="form-row">
          <label class="form-label">标题 <span class="req">*</span></label>
          <el-input v-model="form.title" placeholder="请简要描述问题或建议" maxlength="50" show-word-limit
            @input="delete formErrors.title" />
          <span v-if="formErrors.title" class="field-error">{{ formErrors.title }}</span>
        </div>
        <div class="form-row">
          <label class="form-label">内容描述 <span class="req">*</span></label>
          <el-input v-model="form.content" type="textarea" :rows="4"
            placeholder="请详细描述问题发生时间、地点、经过或改进建议"
            maxlength="500" show-word-limit @input="delete formErrors.content" />
          <span v-if="formErrors.content" class="field-error">{{ formErrors.content }}</span>
        </div>
        <div class="form-row">
          <label class="form-label">附件（最多 3 个）</label>
          <div class="attach-area">
            <label v-if="attachments.length < 3" class="upload-btn">
              <el-icon :size="14"><Upload /></el-icon> 选择文件
              <input type="file" multiple accept="image/*,.pdf,.doc,.docx" style="display:none" @change="handleFileSelect" />
            </label>
            <div v-if="attachments.length" class="attach-list">
              <div v-for="(att, idx) in attachments" :key="att.id" class="attach-item">
                <span class="att-name">{{ att.name }}</span>
                <span class="att-size">{{ formatFileSize(att.size) }}</span>
                <el-icon class="att-del" :size="14" @click="removeAttachment(idx)"><Delete /></el-icon>
              </div>
            </div>
          </div>
          <span v-if="formErrors.attachments" class="field-error">{{ formErrors.attachments }}</span>
        </div>
        <div class="form-row anon-row">
          <el-switch v-model="form.anonymous_to_handler" />
          <div class="anon-text">
            <span class="anon-label">匿名给处理部门</span>
            <span class="anon-hint">仅对处理部门隐藏个人信息，后台保留授权追溯记录。</span>
          </div>
        </div>
      </div>

      <!-- 固定底部按钮栏 -->
      <template #footer>
        <div class="drawer-footer">
          <el-button @click="closeDrawer">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
        </div>
      </template>
    </el-drawer>

    <!-- ==================== 详情抽屉 ==================== -->
    <el-drawer v-model="detailVisible" direction="rtl" size="540px" class="detail-drawer">
      <template #header>
        <div class="drawer-header">
          <span class="drawer-header-title">投诉建议详情</span>
          <el-icon class="drawer-close-btn" :size="18" @click="detailVisible = false"><Close /></el-icon>
        </div>
      </template>
      <div v-if="detailData" class="detail-body">
        <div class="detail-header">
          <h3>{{ detailData.title }}</h3>
          <el-tag :type="statusTypeMap[detailData.status] || 'info'" size="small" effect="plain">
            {{ statusMap[detailData.status] || detailData.status }}
          </el-tag>
        </div>
        <div class="detail-info">
          <div class="di-row"><span class="di-label">反馈类型</span><span>{{ typeMap[detailData.complaint_type] || '—' }}</span></div>
          <div class="di-row"><span class="di-label">反馈对象</span><span>{{ detailData._target_name || '—' }}</span></div>
          <div class="di-row"><span class="di-label">提交时间</span><span>{{ formatDateTime(detailData.created_at) }}</span></div>
        </div>
        <div class="detail-content">
          <h4>内容描述</h4>
          <p>{{ detailData.content }}</p>
        </div>
        <div v-if="detailData.attachment_file_ids?.length" class="detail-attachments">
          <h4>附件（{{ detailData.attachment_file_ids.length }}）</h4>
          <span class="detail-att-hint">附件文件 ID：{{ detailData.attachment_file_ids.join(', ') }}</span>
        </div>
        <div class="detail-timeline">
          <h4>处理进度</h4>
          <div v-if="detailLoading" class="timeline-loading"><el-skeleton :rows="2" animated /></div>
          <div v-else-if="detailRecords.length" class="timeline">
            <div v-for="(rec, idx) in detailRecords" :key="idx" class="tl-item">
              <div class="tl-dot" :class="'tl-' + rec.to_status" />
              <div class="tl-body">
                <div class="tl-status">
                  <el-tag :type="statusTypeMap[rec.to_status] || 'info'" size="small" effect="plain">
                    {{ statusMap[rec.to_status] || rec.to_status }}
                  </el-tag>
                  <span class="tl-time">{{ formatDateTime(rec.created_at) }}</span>
                </div>
                <p class="tl-content">{{ rec.content }}</p>
              </div>
            </div>
          </div>
          <div v-else class="timeline-empty">暂无处理记录</div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.page-container {
  display: flex; flex-direction: column; gap: var(--space-5);
  max-width: 1200px; margin: 0 auto; width: 100%; padding-bottom: var(--space-8);
}
.page-header {
  display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4);
  padding: var(--space-2) 0;
}
.page-header-left { flex: 1; }
.page-title { font-size: 28px; font-weight: var(--font-weight-bold); color: var(--color-text-heading); margin-bottom: var(--space-2); }
.page-subtitle { font-size: var(--font-base); color: var(--color-text-secondary); display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
.hint-tag { display: inline-block; padding: 2px var(--space-2); background: var(--color-primary-50); color: var(--color-primary-600); border-radius: var(--radius-sm); font-size: var(--font-xs); }

.filter-card { background: var(--color-bg-card); border-radius: var(--radius-lg); box-shadow: var(--shadow-card); padding: var(--space-4) var(--space-5); }
.filter-bar { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
.search-input { width: 300px; }
.filter-select { width: 130px; }

.loading-skeleton { padding: var(--space-5); background: var(--color-bg-subtle); border-radius: var(--radius-md); }

.complaint-list { display: flex; flex-direction: column; gap: var(--space-3); }
.complaint-card {
  padding: var(--space-4) var(--space-5); background: var(--color-bg-card);
  border: 1px solid var(--color-border-light); border-radius: var(--radius-lg);
  cursor: pointer; transition: box-shadow 0.2s, border-color 0.2s;
}
.complaint-card:hover { box-shadow: var(--shadow-sm); border-color: var(--color-primary-200); }
.cc-top { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-2); }
.cc-title { font-size: var(--font-md); font-weight: var(--font-weight-medium); color: var(--color-text-heading); line-height: var(--line-height-tight); }
.cc-meta { font-size: var(--font-sm); color: var(--color-text-secondary); margin-bottom: var(--space-2); }
.cc-type { color: var(--color-primary); font-weight: var(--font-weight-medium); }
.cc-sep { margin: 0 var(--space-1); color: var(--color-text-muted); }
.cc-attach { color: var(--color-text-muted); }
.cc-bottom { display: flex; align-items: center; justify-content: space-between; }
.cc-time { font-size: var(--font-xs); color: var(--color-text-muted); }
.cc-link { font-size: var(--font-sm); color: var(--color-primary); font-weight: var(--font-weight-medium); }
.cc-actions { display: flex; align-items: center; gap: var(--space-2); }

.empty-state { display: flex; flex-direction: column; align-items: center; padding: var(--space-10) 0 var(--space-8); gap: var(--space-4); }
.empty-btn { margin-top: var(--space-2); }

.pagination-wrap { display: flex; justify-content: center; padding-top: var(--space-4); }

/* ==================== 抽屉公共样式 ==================== */
/* 遮罩层减淡 */
:deep(.el-overlay) {
  background-color: rgba(0, 0, 0, 0.32) !important;
}
/* 抽屉头部 */
:deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 0;
  border-bottom: 1px solid var(--color-border-light);
}
.drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--space-4) var(--space-6);
}
.drawer-header-title {
  font-size: 18px; font-weight: 600; color: var(--color-text-heading);
}
.drawer-close-btn {
  cursor: pointer; color: var(--color-text-muted); transition: color 0.2s;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
}
.drawer-close-btn:hover { color: var(--color-text-heading); }

/* 抽屉底部 */
:deep(.el-drawer__footer) {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border-light);
  background: var(--color-bg-card);
}
.drawer-footer {
  display: flex; justify-content: flex-end; gap: var(--space-3);
}
/* 提交按钮跟随系统主色 */
:deep(.el-drawer__footer .el-button--primary) {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

/* 抽屉表单内容区 */
.drawer-form {
  padding: var(--space-5) var(--space-6);
  display: flex; flex-direction: column; gap: 0;
}
.form-row { margin-bottom: var(--space-5); }
.form-label { display: block; font-size: var(--font-sm); font-weight: var(--font-weight-medium); color: var(--color-text-body); margin-bottom: var(--space-2); }
.req { color: var(--color-danger); }
.type-pills { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.pill-btn {
  padding: var(--space-1) var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-full);
  background: var(--color-bg-card); color: var(--color-text-body); font-size: var(--font-sm); cursor: pointer; transition: all 0.2s;
}
.pill-btn:hover { border-color: var(--color-primary-300); color: var(--color-primary); }
.pill-btn.is-active { background: var(--color-primary-50); border-color: var(--color-primary); color: var(--color-primary); font-weight: var(--font-weight-medium); }
.form-select { width: 100%; }
.field-error { display: block; margin-top: var(--space-1); font-size: var(--font-xs); color: var(--color-danger); }
.select-empty { padding: var(--space-3); text-align: center; font-size: var(--font-sm); color: var(--color-text-muted); }

.attach-area { display: flex; flex-direction: column; gap: var(--space-2); }
.upload-btn {
  display: inline-flex; align-items: center; gap: var(--space-1); padding: var(--space-1) var(--space-3);
  border: 1px dashed var(--color-border-dark); border-radius: var(--radius-md);
  background: var(--color-bg-subtle); color: var(--color-text-secondary); font-size: var(--font-sm); cursor: pointer; transition: border-color 0.2s;
}
.upload-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.attach-list { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.attach-item { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-1) var(--space-3); background: var(--color-bg-subtle); border-radius: var(--radius-sm); font-size: var(--font-xs); }
.att-name { color: var(--color-text-body); max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.att-size { color: var(--color-text-muted); }
.att-del { cursor: pointer; color: var(--color-text-muted); }
.att-del:hover { color: var(--color-danger); }

.anon-row { display: flex; align-items: flex-start; gap: var(--space-3); padding: var(--space-3); background: var(--color-bg-subtle); border-radius: var(--radius-md); }
.anon-text { display: flex; flex-direction: column; gap: 2px; }
.anon-label { font-size: var(--font-sm); color: var(--color-text-body); font-weight: var(--font-weight-medium); }
.anon-hint { font-size: var(--font-xs); color: var(--color-text-muted); }

/* ==================== 详情抽屉 ==================== */
.detail-body { display: flex; flex-direction: column; gap: var(--space-5); padding: var(--space-5) var(--space-6); }
.detail-header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-3); }
.detail-header h3 { font-size: var(--font-lg); font-weight: var(--font-weight-semibold); color: var(--color-text-heading); }
.detail-info { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-3); background: var(--color-bg-subtle); border-radius: var(--radius-md); }
.di-row { display: flex; gap: var(--space-3); font-size: var(--font-sm); }
.di-label { color: var(--color-text-muted); min-width: 70px; flex-shrink: 0; }
.detail-content h4, .detail-timeline h4, .detail-attachments h4 { font-size: var(--font-md); font-weight: var(--font-weight-medium); color: var(--color-text-heading); margin-bottom: var(--space-3); }
.detail-content p { font-size: var(--font-sm); color: var(--color-text-body); line-height: var(--line-height-relaxed); white-space: pre-wrap; }
.detail-att-hint { font-size: var(--font-xs); color: var(--color-text-muted); }

.timeline { display: flex; flex-direction: column; }
.tl-item { display: flex; gap: var(--space-3); padding-bottom: var(--space-4); position: relative; }
.tl-item:not(:last-child)::before { content: ''; position: absolute; left: 5px; top: 14px; bottom: 0; width: 2px; background: var(--color-border-light); }
.tl-dot { width: 12px; height: 12px; border-radius: var(--radius-full); flex-shrink: 0; margin-top: 2px; background: var(--color-border); }
.tl-pending { background: var(--color-warning); }
.tl-processing { background: var(--color-primary); }
.tl-resolved { background: var(--color-success); }
.tl-rejected { background: var(--color-danger); }
.tl-cancelled { background: var(--color-text-muted); }
.tl-body { flex: 1; }
.tl-status { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-1); }
.tl-time { font-size: var(--font-xs); color: var(--color-text-muted); }
.tl-content { font-size: var(--font-sm); color: var(--color-text-body); line-height: var(--line-height-normal); }
.timeline-loading { padding: var(--space-3); }
.timeline-empty { font-size: var(--font-sm); color: var(--color-text-muted); padding: var(--space-3); }
</style>
