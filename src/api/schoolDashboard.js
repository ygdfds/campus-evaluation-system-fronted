import request from '@/request'

/**
 * 学校管理端首页概览数据聚合
 */

// 表单类型中文映射
const formTypeMap = {
  teaching: '教学评价',
  service: '服务评价',
  instant: '即时评价',
}

// 表单状态中文映射
const formStatusMap = {
  draft: '草稿',
  pending_review: '待审核',
  published: '已发布',
  rejected: '已驳回',
  closed: '已关闭',
}

// 审核状态中文映射
const auditStatusMap = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
}

// 追溯授权状态中文映射
const traceStatusMap = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已驳回',
}

// 操作日志模块中文映射
const moduleMap = {
  appeal: '申诉处理',
  form: '表单管理',
  feedback: '反馈处理',
  org: '组织管理',
  user: '用户管理',
  audit: '审核管理',
  trace: '追溯授权',
}

// 操作日志动作中文映射
const actionMap = {
  accept: '受理',
  resolve: '办结',
  reject: '驳回',
  create: '创建',
  update: '更新',
  delete: '删除',
  publish: '发布',
  request_trace_authorization: '发起追溯授权',
  approve_trace: '批准追溯',
  reject_trace: '驳回追溯',
}

/**
 * 获取学校概览核心指标
 */
export async function getSchoolDashboardOverviewApi(tenantId) {
  const [
    profilesRes,
    teachingOrgsRes,
    serviceOrgsRes,
    formsRes,
    auditsRes,
    traceAuthRes,
  ] = await Promise.all([
    request.get('/personProfiles', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/teachingOrgUnits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/serviceOrgUnits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/evaluationForms', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/formPublishAudits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/traceAuthorizations', { params: { tenant_id: tenantId, deleted: false } }),
  ])

  const profiles = (profilesRes.data || []).filter(p => !p.deleted)
  const teachingOrgs = (teachingOrgsRes.data || []).filter(o => !o.deleted)
  const serviceOrgs = (serviceOrgsRes.data || []).filter(o => !o.deleted)
  const forms = (formsRes.data || []).filter(f => !f.deleted)
  const audits = (auditsRes.data || []).filter(a => !a.deleted)
  const traces = (traceAuthRes.data || []).filter(t => t.deleted === false || t.deleted === undefined)

  // 统计学生账号数（role_type 为 student 的 personProfiles）
  const studentCount = profiles.filter(p => p.role_type === 'student').length
  // 统计教职工账号数（role_type 为 staff 或管理角色的 personProfiles）
  const staffRoles = ['staff', 'teaching_admin', 'service_admin', 'feedback_handler', 'form_publisher', 'course_owner', 'service_window_manager']
  const staffCount = profiles.filter(p => staffRoles.includes(p.role_type)).length

  return {
    staffCount,
    studentCount,
    teachingOrgCount: teachingOrgs.length,
    serviceOrgCount: serviceOrgs.length,
    pendingAuditCount: audits.filter(a => a.status === 'pending').length,
    pendingTraceCount: traces.filter(t => t.status === 'pending').length,
    // 表单状态分布
    formStatusDistribution: {
      draft: forms.filter(f => f.status === 'draft').length,
      pending_review: forms.filter(f => f.status === 'pending_review').length,
      published: forms.filter(f => f.status === 'published').length,
      rejected: forms.filter(f => f.status === 'rejected').length,
      closed: forms.filter(f => f.status === 'closed').length,
    },
  }
}

/**
 * 获取待审核评价表单列表
 */
export async function getSchoolAuditFormsApi(tenantId) {
  const [auditsRes, formsRes, usersRes] = await Promise.all([
    request.get('/formPublishAudits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/evaluationForms', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/userAccounts', { params: { tenant_id: tenantId, deleted: false } }),
  ])

  const audits = (auditsRes.data || []).filter(a => !a.deleted && a.status === 'pending')
  const forms = (formsRes.data || []).filter(f => !f.deleted)
  const users = (usersRes.data || []).filter(u => !u.deleted)

  const formMap = {}
  forms.forEach(f => { formMap[f.id] = f })
  const userMap = {}
  users.forEach(u => { userMap[u.id] = u })

  return audits.map(a => {
    const form = formMap[a.form_id] || {}
    const requester = userMap[a.requested_by] || {}
    return {
      id: a.id,
      form_id: a.form_id,
      form_title: form.title || '评价表单',
      form_type: formTypeMap[form.type] || '评价',
      form_status: formStatusMap[form.status] || form.status || '未知',
      requester_name: requester.real_name || requester.username || '未知',
      submit_reason: a.submit_reason || '申请发布评价表单',
      requested_at: a.requested_at,
      status: auditStatusMap[a.status] || a.status,
    }
  })
}

/**
 * 获取待处理追溯授权申请列表
 */
export async function getSchoolTraceAuthTasksApi(tenantId) {
  const [tracesRes, appealsRes, usersRes] = await Promise.all([
    request.get('/traceAuthorizations', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/appealRequests', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/userAccounts', { params: { tenant_id: tenantId, deleted: false } }),
  ])

  const traces = (tracesRes.data || []).filter(t => (t.deleted === false || t.deleted === undefined) && t.status === 'pending')
  const appeals = (appealsRes.data || []).filter(a => !a.deleted)
  const users = (usersRes.data || []).filter(u => !u.deleted)

  const appealMap = {}
  appeals.forEach(a => { appealMap[a.id] = a })
  const userMap = {}
  users.forEach(u => { userMap[u.id] = u })

  return traces.map(t => {
    const appeal = appealMap[t.appeal_id] || {}
    const applicant = userMap[t.applicant_id] || {}
    return {
      id: t.id,
      appeal_id: t.appeal_id,
      appeal_no: appeal.appeal_no || `申诉#${t.appeal_id || '?'}`,
      applicant_name: applicant.real_name || applicant.username || '未知',
      reason: t.reason || '无',
      status: traceStatusMap[t.status] || t.status,
      requested_at: t.requested_at,
    }
  })
}

/**
 * 获取学校运行概览数据（表单状态分布、反馈工单概览、评价提交趋势）
 */
export async function getSchoolOperationOverviewApi(tenantId) {
  const [formsRes, complaintsRes, submissionsRes] = await Promise.all([
    request.get('/evaluationForms', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/complaints', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/evaluationSubmissions', { params: { tenant_id: tenantId, deleted: false } }),
  ])

  const forms = (formsRes.data || []).filter(f => !f.deleted)
  const complaints = (complaintsRes.data || []).filter(c => !c.deleted)
  const submissions = (submissionsRes.data || []).filter(s => !s.deleted)

  // 表单状态分布
  const formStatus = {
    draft: forms.filter(f => f.status === 'draft').length,
    pending_review: forms.filter(f => f.status === 'pending_review').length,
    published: forms.filter(f => f.status === 'published').length,
    rejected: forms.filter(f => f.status === 'rejected').length,
    closed: forms.filter(f => f.status === 'closed').length,
  }

  // 反馈工单处理概览
  const feedbackStatus = {
    pending: complaints.filter(c => c.status === 'pending').length,
    processing: complaints.filter(c => c.status === 'processing').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    rejected: complaints.filter(c => c.status === 'rejected').length,
    closed: complaints.filter(c => c.status === 'closed').length,
  }

  // 本月评价提交数
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthSubmissions = submissions.filter(s => {
    const submitDate = new Date(s.submitted_at || s.created_at)
    return submitDate >= monthStart
  })

  return {
    formStatus,
    feedbackStatus,
    monthSubmissionCount: monthSubmissions.length,
    totalSubmissionCount: submissions.length,
  }
}

/**
 * 获取最近操作动态
 */
export async function getSchoolRecentActivitiesApi(tenantId) {
  const [logsRes, auditsRes, tracesRes] = await Promise.all([
    request.get('/operationLogs', { params: { tenant_id: tenantId } }),
    request.get('/formPublishAudits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/traceAuthorizations', { params: { tenant_id: tenantId, deleted: false } }),
  ])

  const logs = (logsRes.data || []).slice(0, 20)
  const audits = (auditsRes.data || []).filter(a => !a.deleted)
  const traces = (tracesRes.data || []).filter(t => t.deleted === false || t.deleted === undefined)

  // 合并并排序，取最新6条
  const activities = []

  // 操作日志
  logs.forEach(log => {
    activities.push({
      id: `log_${log.id}`,
      type: 'operation',
      module: moduleMap[log.module] || log.module || '其他',
      action: actionMap[log.action] || log.action || '操作',
      content: log.content || '',
      target_type: log.target_type,
      created_at: log.created_at,
    })
  })

  // 审核记录（最近创建的）
  audits.slice(0, 5).forEach(audit => {
    activities.push({
      id: `audit_${audit.id}`,
      type: 'audit',
      module: '审核管理',
      action: audit.status === 'pending' ? '待审核' : auditStatusMap[audit.status] || audit.status,
      content: `表单审核 #${audit.id}`,
      target_type: 'form_publish_audit',
      created_at: audit.requested_at || audit.created_at,
    })
  })

  // 追溯授权申请
  traces.slice(0, 5).forEach(trace => {
    activities.push({
      id: `trace_${trace.id}`,
      type: 'trace',
      module: '追溯授权',
      action: traceStatusMap[trace.status] || trace.status,
      content: `追溯授权申请 #${trace.id}`,
      target_type: 'trace_authorization',
      created_at: trace.requested_at || trace.created_at,
    })
  })

  // 按时间倒序排列，取前6条
  activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return activities.slice(0, 6)
}

/**
 * 获取学校首页所有数据（聚合调用）
 */
export async function getSchoolDashboardAllApi(tenantId) {
  const [overview, auditForms, traceTasks, operationOverview, recentActivities] = await Promise.all([
    getSchoolDashboardOverviewApi(tenantId),
    getSchoolAuditFormsApi(tenantId),
    getSchoolTraceAuthTasksApi(tenantId),
    getSchoolOperationOverviewApi(tenantId),
    getSchoolRecentActivitiesApi(tenantId),
  ])

  return {
    overview,
    auditForms,
    traceTasks,
    operationOverview,
    recentActivities,
  }
}
