import request from '@/request'

/**
 * 职工端申诉处理 API
 *
 * 所有查询均基于 tenant_id + deleted 过滤，
 * 按角色 scope 限定数据范围。
 */

// ==================== 常量 ====================

export const APPEAL_STATUS_MAP = {
  pending: '待受理',
  processing: '处理中',
  waiting_trace_auth: '待追溯授权',
  resolved: '已办结',
  rejected: '已驳回',
  closed: '已关闭',
}

export const APPEAL_TYPE_MAP = {
  content_dispute: '评价内容争议',
  malicious_review: '疑似恶意评价',
  factual_error: '事实不符',
  privacy_risk: '隐私风险',
  other: '其他',
}

export const APPEAL_PRIORITY_MAP = {
  high: '高',
  normal: '中',
  low: '低',
}

export const APPEAL_RESULT_MAP = {
  maintain: '维持原评价',
  hide_review: '隐藏评价',
  remove_invalid: '删除无效评价',
  adjust_stat: '不纳入统计',
  other: '其他处理',
}

export const TRACE_AUTH_STATUS_MAP = {
  pending: '待审核',
  approved: '已授权',
  rejected: '已驳回',
  expired: '已过期',
}

// ==================== 基础数据读取 ====================

function fetchAll(resource, tenantId) {
  return request.get(`/${resource}`, {
    params: { tenant_id: tenantId, deleted: false },
  }).then(res => (res.data || []).filter(r => !r.deleted))
}

/**
 * 加载申诉处理所需的上下文数据
 */
export async function getStaffAppealContextApi(tenantId) {
  const [
    appeals, records, traces,
    submissions, forms, windows, scores, answers,
    courses, serviceItems, teachingOrgs, serviceOrgs,
    profiles,
  ] = await Promise.all([
    fetchAll('appealRequests', tenantId),
    fetchAll('appealProcessRecords', tenantId),
    fetchAll('traceAuthorizations', tenantId),
    fetchAll('evaluationSubmissions', tenantId),
    fetchAll('evaluationForms', tenantId),
    fetchAll('evaluationWindows', tenantId),
    fetchAll('evaluationScores', tenantId),
    fetchAll('evaluationAnswers', tenantId),
    fetchAll('courses', tenantId),
    fetchAll('serviceItems', tenantId),
    fetchAll('teachingOrgUnits', tenantId),
    fetchAll('serviceOrgUnits', tenantId),
    fetchAll('personProfiles', tenantId),
  ])

  return {
    appeals, records, traces,
    submissions, forms, windows, scores, answers,
    courses, serviceItems, teachingOrgs, serviceOrgs,
    profiles,
  }
}

// ==================== 权限范围过滤 ====================

/**
 * 按权限范围过滤申诉列表
 */
function filterAppealsByScope(appeals, scope, ctx) {
  if (!scope || scope.schoolAdmin) return appeals

  const { courses, serviceItems } = ctx
  const { roleCodes = [] } = scope || {}
  const allowedCourseIds = new Set(
    courses.filter(c => (scope.teachingOrgIds || []).includes(c.teaching_org_id)).map(c => c.id)
  )
  const allowedItemIds = new Set(
    serviceItems.filter(i => (scope.serviceOrgIds || []).includes(i.service_org_id)).map(i => i.id)
  )

  const hasTeaching = allowedCourseIds.size > 0
  const hasService = allowedItemIds.size > 0

  // Mock 阶段兜底：当 teaching_admin 的 teachingOrgIds 为空时，允许查看本租户所有教学类申诉
  const isTeachingAdmin = roleCodes.includes('teaching_admin')
  const fallbackTeaching = isTeachingAdmin && !hasTeaching
  // Mock 阶段兜底：当 service_admin 的 serviceOrgIds 为空时，允许查看本租户所有服务类申诉
  const isServiceAdmin = roleCodes.includes('service_admin')
  const fallbackService = isServiceAdmin && !hasService

  return appeals.filter(a => {
    if (a.target_type === 'course') return hasTeaching || fallbackTeaching
    if (a.target_type === 'service_item') return hasService || fallbackService
    // 其他类型（teacher/service_org）暂不过滤
    return true
  })
}

// ==================== 筛选辅助 ====================

function filterAppeals(appeals, filters) {
  let list = [...appeals]

  // 关键词搜索（支持申诉编号、申诉原因、评价对象名称、评价表单名称）
  if (filters.keyword && filters.keyword.trim()) {
    const kw = filters.keyword.trim().toLowerCase()
    list = list.filter(a => {
      if (a.appeal_no && a.appeal_no.toLowerCase().includes(kw)) return true
      if (a.reason && a.reason.toLowerCase().includes(kw)) return true
      // 搜索评价对象名称和表单名称（需先解析）
      if (a._resolved) {
        if (a._resolved.target_name && a._resolved.target_name.toLowerCase().includes(kw)) return true
        if (a._resolved.form_name && a._resolved.form_name.toLowerCase().includes(kw)) return true
      }
      return false
    })
  }

  // 状态筛选
  if (filters.status && filters.status !== 'all') {
    list = list.filter(a => a.status === filters.status)
  }

  // 申诉类型筛选
  if (filters.appealType && filters.appealType !== 'all') {
    list = list.filter(a => a.appeal_type === filters.appealType)
  }

  // 对象类型筛选
  if (filters.targetType && filters.targetType !== 'all') {
    if (filters.targetType === 'teaching') {
      list = list.filter(a => a.target_type === 'course' || a.target_type === 'teacher')
    } else if (filters.targetType === 'service') {
      list = list.filter(a => a.target_type === 'service_item' || a.target_type === 'service_org')
    }
  }

  // 时间范围筛选
  if (filters.timeRange && filters.timeRange !== 'all') {
    const now = new Date()
    if (filters.timeRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 86400000)
      list = list.filter(a => new Date(a.submitted_at) >= weekAgo)
    } else if (filters.timeRange === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      list = list.filter(a => new Date(a.submitted_at) >= monthStart)
    } else if (filters.timeRange === 'custom' && filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate)
      const end = new Date(filters.endDate)
      list = list.filter(a => {
        const d = new Date(a.submitted_at)
        return d >= start && d <= end
      })
    }
  }

  // 排序
  switch (filters.sort) {
    case 'latest_update':
      list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      break
    case 'priority': {
      const order = { high: 0, normal: 1, low: 2 }
      list.sort((a, b) => (order[a.priority] ?? 1) - (order[b.priority] ?? 1))
      break
    }
    default: // latest_submit
      list.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
  }

  return list
}

// ==================== 名称解析 ====================

function buildNameMaps(ctx) {
  const subMap = {}; ctx.submissions.forEach(s => { subMap[s.id] = s })
  const formMap = {}; ctx.forms.forEach(f => { formMap[f.id] = f })
  const courseMap = {}; ctx.courses.forEach(c => { courseMap[c.id] = c })
  const sItemMap = {}; ctx.serviceItems.forEach(s => { sItemMap[s.id] = s })
  const tOrgMap = {}; ctx.teachingOrgs.forEach(o => { tOrgMap[o.id] = o })
  const sOrgMap = {}; ctx.serviceOrgs.forEach(o => { sOrgMap[o.id] = o })
  const winMap = {}; ctx.windows.forEach(w => { winMap[w.id] = w })
  const handlerMap = {}
  if (ctx.profiles) {
    ctx.profiles.forEach(p => {
      if (p.user_id) handlerMap[p.user_id] = p.real_name
    })
  }
  return { subMap, formMap, courseMap, sItemMap, tOrgMap, sOrgMap, winMap, handlerMap }
}

function resolveAppealItem(appeal, maps) {
  const sub = maps.subMap[appeal.submission_id]
  const form = sub ? maps.formMap[sub.form_id] : maps.formMap[appeal.form_id]
  const win = sub ? maps.winMap[sub.window_id] : null

  let targetName = ''
  let orgName = ''
  let evalType = ''

  if (appeal.target_type === 'course') {
    const course = maps.courseMap[appeal.target_id]
    targetName = course?.course_name || `课程 #${appeal.target_id}`
    orgName = maps.tOrgMap[course?.teaching_org_id]?.name || ''
    evalType = 'teaching'
  } else if (appeal.target_type === 'service_item') {
    const item = maps.sItemMap[appeal.target_id]
    targetName = item?.name || `服务项目 #${appeal.target_id}`
    orgName = maps.sOrgMap[item?.service_org_id]?.name || ''
    evalType = 'service'
  } else {
    targetName = `对象 #${appeal.target_id}`
    evalType = 'other'
  }

  // 兜底：用表单标题
  if (!targetName || targetName.startsWith('#')) {
    targetName = form?.title || targetName
  }

  return {
    ...appeal,
    form_name: form?.title || '',
    target_name: targetName,
    target_org_name: orgName,
    evaluation_type: evalType,
    window_period: win ? `${win.start_at?.slice(0, 10)} ~ ${win.end_at?.slice(0, 10)}` : '',
    handler_name: appeal.handler_id ? (maps.handlerMap[appeal.handler_id] || `职工 #${appeal.handler_id}`) : '',
  }
}

// ==================== 查询类 API ====================

/**
 * 获取申诉列表
 */
export function getStaffAppealListApi(ctx, filters = {}, scope = null) {
  const { appeals } = ctx
  const { page = 1, pageSize = 10, ...restFilters } = filters

  // 权限范围过滤
  let filtered = filterAppealsByScope(appeals, scope, ctx)

  // 构建名称映射
  const maps = buildNameMaps(ctx)

  // 先解析名称（用于关键词搜索评价对象/表单名称）
  filtered = filtered.map(a => {
    const resolved = resolveAppealItem(a, maps)
    return { ...resolved, _resolved: { target_name: resolved.target_name, form_name: resolved.form_name } }
  })

  // 条件筛选
  filtered = filterAppeals(filtered, restFilters)

  // 构建追溯授权 map
  const traceMap = {}
  ctx.traces.forEach(t => {
    if (!traceMap[t.appeal_id] || new Date(t.created_at) > new Date(traceMap[t.appeal_id].created_at)) {
      traceMap[t.appeal_id] = t
    }
  })

  // 分页
  const total = filtered.length
  const start = (page - 1) * pageSize
  const list = filtered.slice(start, start + pageSize).map(a => {
    const trace = traceMap[a.id]
    return {
      ...a,
      has_trace_request: !!trace,
      trace_auth_status: trace?.status || null,
    }
  })

  return { list, total, page, pageSize }
}

/**
 * 获取申诉状态统计
 */
export function getStaffAppealSummaryApi(ctx, scope = null, filters = null) {
  const { appeals } = ctx
  let filtered = filterAppealsByScope(appeals, scope, ctx)

  // 如果提供了筛选条件，同步应用到统计
  if (filters) {
    const maps = buildNameMaps(ctx)
    const resolved = filtered.map(a => {
      const r = resolveAppealItem(a, maps)
      return { ...a, _resolved: { target_name: r.target_name, form_name: r.form_name } }
    })
    filtered = filterAppeals(resolved, filters)
  }

  const summary = {
    pending: 0,
    processing: 0,
    waiting_trace_auth: 0,
    resolved: 0,
    rejected: 0,
    closed: 0,
    total: filtered.length,
  }

  filtered.forEach(a => {
    if (summary[a.status] !== undefined) summary[a.status]++
  })

  return summary
}

/**
 * 获取申诉详情
 */
export function getStaffAppealDetailApi(ctx, appealId) {
  const maps = buildNameMaps(ctx)
  const appeal = ctx.appeals.find(a => a.id === appealId)
  if (!appeal) return null

  const detail = resolveAppealItem(appeal, maps)

  // 评价摘要（脱敏）
  const sub = maps.subMap[appeal.submission_id]
  let evalSummary = null
  if (sub) {
    const subScores = ctx.scores.filter(sc => sc.submission_id === sub.id)
    const avgScore = subScores.length > 0
      ? Number((subScores.reduce((s, sc) => s + (sc.score || 0), 0) / subScores.length).toFixed(1))
      : sub.overall_score || 0

    const textAnswers = ctx.answers
      .filter(a => a.submission_id === sub.id && typeof a.answer_value === 'string' && a.answer_value.length > 3)
      .map(a => a.answer_value.slice(0, 120))

    evalSummary = {
      score: avgScore,
      text: textAnswers.join('；') || '无文字评价',
      submitted_at: sub.submitted_at,
      anonymous: sub.anonymous !== false,
      locked: !!sub.locked_at,
    }
  }

  // 处理时间线
  const timeline = ctx.records
    .filter(r => r.appeal_id === appealId)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  // 追溯授权状态
  const traceAuth = ctx.traces
    .filter(t => t.appeal_id === appealId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null

  return {
    ...detail,
    eval_summary: evalSummary,
    timeline,
    trace_auth: traceAuth,
  }
}

// ==================== 操作类 API ====================

/**
 * 写入处理记录
 */
async function writeProcessRecord(tenantId, appealId, operatorId, action, fromStatus, toStatus, content) {
  return request.post('/appealProcessRecords', {
    tenant_id: tenantId,
    appeal_id: appealId,
    operator_id: operatorId,
    action,
    from_status: fromStatus,
    to_status: toStatus,
    content,
    created_at: new Date().toISOString(),
  })
}

/**
 * 写入通知
 */
async function writeNotification(tenantId, schoolId, receiverUserId, title, content, link) {
  return request.post('/notifications', {
    tenant_id: tenantId,
    school_id: schoolId,
    receiver_user_id: receiverUserId,
    title,
    content,
    type: 'appeal',
    link,
    read_status: 'unread',
    created_at: new Date().toISOString(),
    deleted: false,
  })
}

/**
 * 写入操作日志
 */
async function writeOperationLog(tenantId, userId, action, targetId, content) {
  return request.post('/operationLogs', {
    tenant_id: tenantId,
    user_id: userId,
    module: 'appeal',
    action,
    target_type: 'appeal_request',
    target_id: targetId,
    content,
    created_at: new Date().toISOString(),
  })
}

/**
 * 受理申诉
 */
export async function acceptAppealApi(tenantId, schoolId, appealId, operatorId, appellantUserId, appealNo) {
  const now = new Date().toISOString()

  // 更新申诉状态
  await request.patch(`/appealRequests/${appealId}`, {
    status: 'processing',
    handler_id: operatorId,
    accepted_at: now,
    updated_at: now,
  })

  // 写入处理记录
  await writeProcessRecord(tenantId, appealId, operatorId, 'accept', 'pending', 'processing', '已受理该申诉。')

  // 写入操作日志
  await writeOperationLog(tenantId, operatorId, 'accept', appealId, `受理申诉 ${appealNo}`)

  // 通知申诉人
  await writeNotification(tenantId, schoolId, appellantUserId, '你的申诉已被受理', `你提交的申诉 ${appealNo} 已被受理，相关部门正在处理中。`, '/student/my-evaluations')
}

/**
 * 驳回申诉
 */
export async function rejectAppealApi(tenantId, schoolId, appealId, operatorId, appellantUserId, appealNo, comment) {
  const now = new Date().toISOString()
  const appeal = (await request.get(`/appealRequests/${appealId}`)).data
  const fromStatus = appeal.status

  await request.patch(`/appealRequests/${appealId}`, {
    status: 'rejected',
    handle_result: 'maintain',
    handle_comment: comment,
    resolved_at: now,
    updated_at: now,
  })

  await writeProcessRecord(tenantId, appealId, operatorId, 'reject', fromStatus, 'rejected', comment)
  await writeOperationLog(tenantId, operatorId, 'reject', appealId, `驳回申诉 ${appealNo}：${comment}`)
  await writeNotification(tenantId, schoolId, appellantUserId, '你的申诉未予受理', `你提交的申诉 ${appealNo} 未予受理。原因：${comment}`, '/student/my-evaluations')
}

/**
 * 要求补充说明
 */
export async function requestSupplementApi(tenantId, schoolId, appealId, operatorId, appellantUserId, appealNo, comment) {
  const now = new Date().toISOString()

  await request.patch(`/appealRequests/${appealId}`, {
    updated_at: now,
  })

  await writeProcessRecord(tenantId, appealId, operatorId, 'request_supplement', 'processing', 'processing', comment)
  await writeOperationLog(tenantId, operatorId, 'request_supplement', appealId, `要求补充申诉 ${appealNo}：${comment}`)
  await writeNotification(tenantId, schoolId, appellantUserId, '申诉需要补充说明', `你提交的申诉 ${appealNo} 需要补充说明。${comment}`, '/student/my-evaluations')
}

/**
 * 申请追溯授权
 */
export async function requestTraceAuthorizationApi(tenantId, schoolId, appealId, submissionId, operatorId, appellantUserId, appealNo, reason) {
  const now = new Date().toISOString()

  // 创建追溯授权申请
  await request.post('/traceAuthorizations', {
    tenant_id: tenantId,
    submission_id: submissionId,
    appeal_id: appealId,
    applicant_id: operatorId,
    approver_id: null,
    reason,
    status: 'pending',
    requested_at: now,
    approved_at: null,
    rejected_at: null,
    created_at: now,
  })

  // 更新申诉状态
  await request.patch(`/appealRequests/${appealId}`, {
    status: 'waiting_trace_auth',
    updated_at: now,
  })

  await writeProcessRecord(tenantId, appealId, operatorId, 'request_trace_authorization', 'processing', 'waiting_trace_auth', reason)
  await writeOperationLog(tenantId, operatorId, 'request_trace_authorization', appealId, `对申诉 ${appealNo} 发起追溯授权申请`)

  // 通知学校管理员（追溯授权需学校管理员审核）
  // 简化处理：通知学校管理员用户（school_admin user_id = 1 或 tenant 对应的管理员）
  const schoolAdminUserId = 1 // Mock: 学校管理员用户 ID
  await writeNotification(tenantId, schoolId, schoolAdminUserId, '收到追溯授权申请', `申诉 ${appealNo} 已发起匿名评价追溯授权申请，请及时审核。原因：${reason}`, '/staff/appeals')
}

/**
 * 完成处理申诉
 */
export async function resolveAppealApi(tenantId, schoolId, appealId, operatorId, appellantUserId, appealNo, result, comment) {
  const now = new Date().toISOString()
  const appeal = (await request.get(`/appealRequests/${appealId}`)).data
  const fromStatus = appeal.status

  await request.patch(`/appealRequests/${appealId}`, {
    status: 'resolved',
    handle_result: result,
    handle_comment: comment,
    resolved_at: now,
    updated_at: now,
  })

  await writeProcessRecord(tenantId, appealId, operatorId, 'resolve', fromStatus, 'resolved', comment)
  await writeOperationLog(tenantId, operatorId, 'resolve', appealId, `办结申诉 ${appealNo}，结果：${APPEAL_RESULT_MAP[result] || result}`)

  const resultLabel = APPEAL_RESULT_MAP[result] || result
  await writeNotification(tenantId, schoolId, appellantUserId, '你的申诉已办结', `你提交的申诉 ${appealNo} 已处理完成。处理结果：${resultLabel}。${comment}`, '/student/my-evaluations')

  // 模拟更新评价提交状态（不物理删除）
  if (['hide_review', 'remove_invalid', 'adjust_stat'].includes(result) && appeal.submission_id) {
    try {
      await request.patch(`/evaluationSubmissions/${appeal.submission_id}`, {
        review_status: result,
        updated_at: now,
      })
    } catch { /* 字段可能不存在，忽略 */ }
  }
}

/**
 * 关闭申诉
 */
export async function closeAppealApi(tenantId, appealId, operatorId, appealNo, comment) {
  const now = new Date().toISOString()
  const appeal = (await request.get(`/appealRequests/${appealId}`)).data
  const fromStatus = appeal.status

  await request.patch(`/appealRequests/${appealId}`, {
    status: 'closed',
    updated_at: now,
  })

  await writeProcessRecord(tenantId, appealId, operatorId, 'close', fromStatus, 'closed', comment || '申诉已关闭。')
  await writeOperationLog(tenantId, operatorId, 'close', appealId, `关闭申诉 ${appealNo}`)
}
