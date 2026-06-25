import request from '@/request'

// ==================== 映射表 ====================

const traceStatusMap = {
  pending: '待审批',
  approved: '已授权',
  rejected: '已拒绝',
}

const appealStatusMap = {
  pending: '待处理',
  processing: '处理中',
  waiting_trace_auth: '等待追溯授权',
  resolved: '已解决',
  rejected: '已驳回',
  closed: '已关闭',
}

// ==================== 辅助函数 ====================

function resolveProfileName(profileMap, userId) {
  const p = profileMap[userId]
  return p?.real_name || '未知'
}

function resolveFormName(form) {
  return form?.title || form?.name || form?.form_name || '未命名评价表单'
}

// ==================== 公开 API ====================

/**
 * 获取追溯授权列表（聚合数据）
 */
export async function getTraceAuthListApi(tenantId, filters = {}) {
  const [tracesRes, appealsRes, profilesRes, formsRes] = await Promise.all([
    request.get('/traceAuthorizations', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/appealRequests', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/personProfiles', { params: { deleted: false } }),
    request.get('/evaluationForms', { params: { tenant_id: tenantId, deleted: false } }),
  ])

  let traces = (tracesRes.data || []).filter(t => t.deleted === false || t.deleted === undefined)
  const appeals = (appealsRes.data || []).filter(a => !a.deleted)
  const profiles = (profilesRes.data || []).filter(p => !p.deleted)
  const forms = (formsRes.data || []).filter(f => !f.deleted)

  const appealMap = {}
  appeals.forEach(a => { appealMap[a.id] = a })
  const profileMap = {}
  profiles.forEach(p => { profileMap[p.user_id] = p })
  const formMap = {}
  forms.forEach(f => { formMap[f.id] = f })

  // 状态筛选
  if (filters.status && filters.status !== 'all') {
    traces = traces.filter(t => t.status === filters.status)
  }

  // 搜索
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    traces = traces.filter(t => {
      const appeal = appealMap[t.appeal_id] || {}
      const applicant = profileMap[t.applicant_id] || {}
      const form = formMap[appeal.form_id] || {}
      return (
        String(t.id).includes(kw) ||
        (appeal.appeal_no || '').toLowerCase().includes(kw) ||
        (applicant.real_name || '').toLowerCase().includes(kw) ||
        resolveFormName(form).toLowerCase().includes(kw) ||
        (t.reason || '').toLowerCase().includes(kw)
      )
    })
  }

  // 时间筛选
  if (filters.timeRange && filters.timeRange !== 'all') {
    const now = new Date()
    let since
    if (filters.timeRange === 'today') {
      since = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (filters.timeRange === 'week') {
      since = new Date(now.getTime() - 7 * 24 * 3600 * 1000)
    } else if (filters.timeRange === 'month') {
      since = new Date(now.getFullYear(), now.getMonth(), 1)
    }
    if (since) {
      traces = traces.filter(t => new Date(t.requested_at || t.created_at) >= since)
    }
  }

  // 排序
  if (filters.sort === 'recent_audit') {
    traces.sort((a, b) => new Date(b.approved_at || b.rejected_at || b.updated_at || b.created_at) - new Date(a.approved_at || a.rejected_at || a.updated_at || a.created_at))
  } else if (filters.sort === 'status_first') {
    const order = { pending: 0, approved: 1, rejected: 2 }
    traces.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9))
  } else {
    traces.sort((a, b) => new Date(b.requested_at || b.created_at) - new Date(a.requested_at || a.created_at))
  }

  return traces.map(t => {
    const appeal = appealMap[t.appeal_id] || {}
    const applicant = profileMap[t.applicant_id] || {}
    const form = formMap[appeal.form_id] || {}
    return {
      id: t.id,
      appeal_id: t.appeal_id,
      appeal_no: appeal.appeal_no || `申诉#${t.appeal_id || '?'}`,
      appeal_status: appealStatusMap[appeal.status] || appeal.status || '未知',
      appeal_reason: appeal.reason || '',
      applicant_id: t.applicant_id,
      applicant_name: applicant.real_name || '申请人未匹配',
      form_name: resolveFormName(form),
      form_id: appeal.form_id,
      reason: t.reason || '',
      status: traceStatusMap[t.status] || t.status,
      status_code: t.status,
      requested_at: t.requested_at || t.created_at,
      approved_at: t.approved_at,
      rejected_at: t.rejected_at,
    }
  })
}

/**
 * 获取追溯授权统计
 */
export async function getTraceAuthSummaryApi(tenantId) {
  const [tracesRes] = await Promise.all([
    request.get('/traceAuthorizations', { params: { tenant_id: tenantId, deleted: false } }),
  ])
  const traces = (tracesRes.data || []).filter(t => t.deleted === false || t.deleted === undefined)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  return {
    total: traces.length,
    pending: traces.filter(t => t.status === 'pending').length,
    approved: traces.filter(t => t.status === 'approved').length,
    rejected: traces.filter(t => t.status === 'rejected').length,
    todayApplied: traces.filter(t => new Date(t.requested_at || t.created_at) >= todayStart).length,
    monthAudited: traces.filter(t => {
      const auditTime = t.approved_at || t.rejected_at
      return auditTime && new Date(auditTime) >= monthStart
    }).length,
  }
}

/**
 * 获取追溯授权详情
 */
export async function getTraceAuthDetailApi(tenantId, traceId) {
  const [tracesRes, appealsRes, profilesRes, formsRes, logsRes] = await Promise.all([
    request.get('/traceAuthorizations', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/appealRequests', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/personProfiles', { params: { deleted: false } }),
    request.get('/evaluationForms', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/operationLogs', { params: { tenant_id: tenantId } }),
  ])

  const traces = (tracesRes.data || []).filter(t => t.deleted === false || t.deleted === undefined)
  const appeals = (appealsRes.data || []).filter(a => !a.deleted)
  const profiles = (profilesRes.data || []).filter(p => !p.deleted)
  const forms = (formsRes.data || []).filter(f => !f.deleted)
  const logs = (logsRes.data || []).filter(l => !l.deleted)

  const trace = traces.find(t => t.id === Number(traceId))
  if (!trace) return null

  const appeal = appeals.find(a => a.id === trace.appeal_id) || {}
  const profileMap = {}
  profiles.forEach(p => { profileMap[p.user_id] = p })
  const form = forms.find(f => f.id === appeal.form_id) || {}

  // 查找相关操作日志
  const relatedLogs = logs.filter(l =>
    (l.target_type === 'trace_authorization' && l.target_id === trace.id) ||
    (l.target_type === 'appeal_request' && l.target_id === trace.appeal_id)
  )

  const applicant = profileMap[trace.applicant_id] || {}
  const approver = trace.approver_id ? (profileMap[trace.approver_id] || {}) : null

  return {
    // 授权申请信息
    trace_id: trace.id,
    status: traceStatusMap[trace.status] || trace.status,
    status_code: trace.status,
    reason: trace.reason || '',
    requested_at: trace.requested_at || trace.created_at,
    approved_at: trace.approved_at,
    rejected_at: trace.rejected_at,
    reject_reason: trace.reject_reason || '',
    applicant_name: applicant.real_name || '未知',
    applicant_id: trace.applicant_id,
    approver_name: approver?.real_name || '',
    // 关联申诉信息
    appeal_id: trace.appeal_id,
    appeal_no: appeal.appeal_no || `申诉#${trace.appeal_id || '?'}`,
    appeal_status: appealStatusMap[appeal.status] || appeal.status || '未知',
    appeal_type: appeal.appeal_type || '',
    appeal_reason: appeal.reason || '',
    appeal_submitted_at: appeal.submitted_at,
    appeal_appellant_name: resolveProfileName(profileMap, appeal.appellant_user_id),
    // 关联评价表单
    form_id: appeal.form_id,
    form_name: resolveFormName(form),
    // 审批记录
    logs: relatedLogs.map(l => ({
      id: l.id,
      user_name: resolveProfileName(profileMap, l.user_id),
      module: l.module,
      action: l.action,
      content: l.content || '',
      created_at: l.created_at,
    })),
  }
}

/**
 * 同意追溯授权
 */
export async function approveTraceAuthApi(tenantId, schoolId, traceId, currentUserId) {
  const [tracesRes, appealsRes, profilesRes] = await Promise.all([
    request.get('/traceAuthorizations', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/appealRequests', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/personProfiles', { params: { deleted: false } }),
  ])

  const trace = (tracesRes.data || []).find(t => t.id === Number(traceId))
  if (!trace) throw new Error('追溯授权记录不存在')

  const appeals = (appealsRes.data || []).filter(a => !a.deleted)
  const appeal = appeals.find(a => a.id === trace.appeal_id) || {}
  const profiles = (profilesRes.data || []).filter(p => !p.deleted)
  const profileMap = {}
  profiles.forEach(p => { profileMap[p.user_id] = p })

  const now = new Date().toISOString()

  // 1. 更新追溯授权状态
  await request.patch(`/traceAuthorizations/${traceId}`, {
    status: 'approved',
    approver_id: currentUserId,
    approved_at: now,
    updated_at: now,
  })

  // 2. 写入操作日志
  await request.post('/operationLogs', {
    tenant_id: tenantId,
    school_id: schoolId,
    user_id: currentUserId,
    module: 'trace',
    action: 'approve_trace',
    target_type: 'trace_authorization',
    target_id: trace.id,
    content: `同意追溯授权申请 #${trace.id}（关联申诉：${appeal.appeal_no || trace.appeal_id}）`,
    created_at: now,
    updated_at: now,
    deleted: false,
  })

  // 3. 写入通知给申请人
  await request.post('/notifications', {
    tenant_id: tenantId,
    school_id: schoolId,
    receiver_user_id: trace.applicant_id,
    target_roles: null,
    type: 'trace_authorization',
    title: '追溯授权申请已通过',
    content: `您发起的追溯授权申请（关联申诉：${appeal.appeal_no || trace.appeal_id}）已通过审批，可进行追溯操作。`,
    link: '/staff/appeals',
    read_status: 'unread',
    created_at: now,
    updated_at: now,
    deleted: false,
  })

  return { success: true }
}

/**
 * 拒绝追溯授权
 */
export async function rejectTraceAuthApi(tenantId, schoolId, traceId, currentUserId, reason) {
  const [tracesRes, appealsRes] = await Promise.all([
    request.get('/traceAuthorizations', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/appealRequests', { params: { tenant_id: tenantId, deleted: false } }),
  ])

  const trace = (tracesRes.data || []).find(t => t.id === Number(traceId))
  if (!trace) throw new Error('追溯授权记录不存在')

  const appeals = (appealsRes.data || []).filter(a => !a.deleted)
  const appeal = appeals.find(a => a.id === trace.appeal_id) || {}

  const now = new Date().toISOString()

  // 1. 更新追溯授权状态
  await request.patch(`/traceAuthorizations/${traceId}`, {
    status: 'rejected',
    reject_reason: reason,
    reviewer_id: currentUserId,
    rejected_at: now,
    reviewed_at: now,
    updated_at: now,
  })

  // 2. 写入操作日志
  await request.post('/operationLogs', {
    tenant_id: tenantId,
    school_id: schoolId,
    user_id: currentUserId,
    module: 'trace',
    action: 'reject_trace',
    target_type: 'trace_authorization',
    target_id: trace.id,
    content: `拒绝追溯授权申请 #${trace.id}（关联申诉：${appeal.appeal_no || trace.appeal_id}），原因：${reason}`,
    created_at: now,
    updated_at: now,
    deleted: false,
  })

  // 3. 写入通知给申请人
  await request.post('/notifications', {
    tenant_id: tenantId,
    school_id: schoolId,
    receiver_user_id: trace.applicant_id,
    target_roles: null,
    type: 'trace_authorization',
    title: '追溯授权申请被拒绝',
    content: `您发起的追溯授权申请（关联申诉：${appeal.appeal_no || trace.appeal_id}）已被拒绝，原因：${reason}`,
    link: '/staff/appeals',
    read_status: 'unread',
    created_at: now,
    updated_at: now,
    deleted: false,
  })

  return { success: true }
}
