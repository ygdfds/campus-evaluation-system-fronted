import request from '@/request'
import { dataOf, listOf, pageOf } from '@/api/backend'

const traceStatusMap = { pending: '待审批', approved: '已授权', rejected: '已拒绝' }
const appealStatusMap = {
  pending: '待处理',
  processing: '处理中',
  waiting_trace_auth: '等待追溯授权',
  resolved: '已解决',
  rejected: '已驳回',
  closed: '已关闭',
}

function formName(form) {
  return form?.title || form?.name || `评价表单 #${form?.id || '-'}`
}

async function loadForms() {
  return pageOf(await request.get('/evaluation/forms', { params: { page: 1, pageSize: 500 } })).records
}

async function loadAppeals() {
  return listOf(await request.get('/review/appeals'))
}

async function loadUserNameMap() {
  const [staff, students] = await Promise.all([
    request.get('/school/staff-users', { params: { page: 1, pageSize: 500 } }).catch(() => null),
    request.get('/school/student-users', { params: { page: 1, pageSize: 500 } }).catch(() => null),
  ])
  const map = {}
  for (const item of [...(pageOf(staff).records || []), ...(pageOf(students).records || [])]) {
    map[item.id] = item.realName || item.real_name || item.username || `用户 #${item.id}`
  }
  return map
}

export async function getTraceAuthListApi(_tenantId, filters = {}) {
  const [traces, appeals, forms, names] = await Promise.all([
    listOf(await request.get('/review/traceAuthorizations', {
      params: { status: filters.status && filters.status !== 'all' ? filters.status : undefined },
    })),
    loadAppeals(),
    loadForms(),
    loadUserNameMap(),
  ])
  const appealMap = Object.fromEntries(appeals.map(item => [item.id, item]))
  const formMap = Object.fromEntries(forms.map(item => [item.id, item]))
  let list = traces.map(trace => {
    const appeal = appealMap[trace.appeal_id] || {}
    const form = formMap[appeal.form_id]
    return {
      ...trace,
      appeal_no: appeal.appeal_no || `申诉#${trace.appeal_id || '-'}`,
      appeal_status: appealStatusMap[appeal.status] || appeal.status || '未知',
      appeal_reason: appeal.reason || '',
      applicant_name: names[trace.applicant_id] || `用户 #${trace.applicant_id || '-'}`,
      form_name: formName(form),
      form_id: appeal.form_id,
      status_code: trace.status,
      status: traceStatusMap[trace.status] || trace.status,
    }
  })
  const keyword = filters.keyword?.trim().toLowerCase()
  if (keyword) {
    list = list.filter(item =>
      String(item.id).includes(keyword) ||
      item.appeal_no.toLowerCase().includes(keyword) ||
      item.applicant_name.toLowerCase().includes(keyword) ||
      item.form_name.toLowerCase().includes(keyword) ||
      item.reason.toLowerCase().includes(keyword)
    )
  }
  if (filters.timeRange && filters.timeRange !== 'all') {
    const now = new Date()
    const since = filters.timeRange === 'today'
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
      : filters.timeRange === 'week'
        ? new Date(now.getTime() - 7 * 86400000)
        : new Date(now.getFullYear(), now.getMonth(), 1)
    list = list.filter(item => new Date(item.requested_at || item.created_at) >= since)
  }
  list.sort((a, b) => new Date(b.requested_at || b.created_at) - new Date(a.requested_at || a.created_at))
  return list
}

export async function getTraceAuthSummaryApi() {
  const traces = listOf(await request.get('/review/traceAuthorizations'))
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  return {
    total: traces.length,
    pending: traces.filter(item => item.status === 'pending').length,
    approved: traces.filter(item => item.status === 'approved').length,
    rejected: traces.filter(item => item.status === 'rejected').length,
    todayApplied: traces.filter(item => new Date(item.requested_at || item.created_at) >= todayStart).length,
    monthAudited: traces.filter(item => {
      const time = item.approved_at || item.rejected_at
      return time && new Date(time) >= monthStart
    }).length,
  }
}

export async function getTraceAuthDetailApi(_tenantId, traceId) {
  const trace = dataOf(await request.get(`/review/traceAuthorizations/${traceId}`))
  const [appeal, forms, records, names] = await Promise.all([
    dataOf(await request.get(`/review/appeals/${trace.appeal_id}`)),
    loadForms(),
    listOf(await request.get('/review/appealProcessRecords', { params: { appeal_id: trace.appeal_id } })),
    loadUserNameMap(),
  ])
  const form = forms.find(item => Number(item.id) === Number(appeal?.form_id))
  return {
    trace_id: trace.id,
    status: traceStatusMap[trace.status] || trace.status,
    status_code: trace.status,
    reason: trace.reason || '',
    requested_at: trace.requested_at || trace.created_at,
    approved_at: trace.approved_at,
    rejected_at: trace.rejected_at,
    reject_reason: trace.reject_reason || '',
    applicant_name: names[trace.applicant_id] || `用户 #${trace.applicant_id || '-'}`,
    applicant_id: trace.applicant_id,
    approver_name: names[trace.approver_id] || '',
    appeal_id: trace.appeal_id,
    appeal_no: appeal?.appeal_no || `申诉#${trace.appeal_id || '-'}`,
    appeal_status: appealStatusMap[appeal?.status] || appeal?.status || '未知',
    appeal_type: appeal?.appeal_type || '',
    appeal_reason: appeal?.reason || '',
    appeal_submitted_at: appeal?.submitted_at,
    appeal_appellant_name: names[appeal?.appellant_user_id] || `用户 #${appeal?.appellant_user_id || '-'}`,
    form_id: appeal?.form_id,
    form_name: formName(form),
    logs: records.map(record => ({
      id: record.id,
      user_name: names[record.operator_id] || `用户 #${record.operator_id || '-'}`,
      module: 'review',
      action: record.action,
      content: record.content || '',
      created_at: record.created_at,
    })),
  }
}

export async function approveTraceAuthApi(_tenantId, _schoolId, traceId) {
  return dataOf(await request.patch(`/review/traceAuthorizations/${traceId}`, { status: 'approved' }))
}

export async function rejectTraceAuthApi(_tenantId, _schoolId, traceId, _currentUserId, reason) {
  return dataOf(await request.patch(`/review/traceAuthorizations/${traceId}`, {
    status: 'rejected',
    reject_reason: reason,
  }))
}
