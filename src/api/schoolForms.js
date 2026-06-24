import request from '@/request'

/**
 * 学校管理端评价表单管理 API
 *
 * 封装学校管理端对评价表单的列表查询、审核、状态管理、
 * 窗口管理、题目查看等操作。所有查询基于 tenant_id 过滤。
 */

// ==================== 映射表 ====================

export const formTypeMap = {
  teaching: '教学评价',
  service: '服务评价',
  instant: '即时评价',
}

export const formStatusMap = {
  draft: '草稿',
  pending_review: '待审核',
  published: '已发布',
  rejected: '已拒绝',
  closed: '已关闭',
}

export const windowStatusMap = {
  open: '开放中',
  scheduled: '待开放',
  closed: '已关闭',
}

export const publishScopeMap = {
  all_students: '全体学生',
  all_staff: '全体教职工',
  enrolled_students: '选课学生',
  specified_class: '指定班级',
  specified_org: '指定组织',
}

// ==================== 查询类 ====================

/**
 * 获取评价表单列表（含关联统计）
 * @param {Object} context - { tenantId }
 * @param {Object} filters - { status, type, keyword, page, pageSize }
 */
export async function getSchoolFormListApi(context, filters = {}) {
  const { tenantId } = context
  const { status, type, keyword, page = 1, pageSize = 10 } = filters

  // 并行获取所有关联数据
  const [formsRes, windowsRes, auditsRes, questionsRes, serviceItemsRes, coursesRes, serviceOrgsRes, teachingOrgsRes, filesRes] = await Promise.all([
    request.get('/evaluationForms', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/evaluationWindows', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/formPublishAudits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/evaluationQuestions', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/serviceItems', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/courses', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/serviceOrgUnits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/teachingOrgUnits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/fileResources', { params: { tenant_id: tenantId, deleted: false } }),
  ])

  let forms = (formsRes.data || []).filter(f => !f.deleted)
  const windows = (windowsRes.data || []).filter(w => !w.deleted)
  const audits = (auditsRes.data || []).filter(a => !a.deleted)
  const questions = (questionsRes.data || []).filter(q => !q.deleted)
  const serviceItems = (serviceItemsRes.data || []).filter(s => !s.deleted)
  const courses = (coursesRes.data || []).filter(c => !c.deleted)
  const serviceOrgs = (serviceOrgsRes.data || []).filter(o => !o.deleted)
  const teachingOrgs = (teachingOrgsRes.data || []).filter(o => !o.deleted)
  const files = (filesRes.data || []).filter(f => !f.deleted)

  // 构建映射
  const windowMap = {}
  windows.forEach(w => {
    if (!windowMap[w.form_id]) windowMap[w.form_id] = []
    windowMap[w.form_id].push(w)
  })

  const auditMap = {}
  audits.forEach(a => {
    if (!auditMap[a.form_id]) auditMap[a.form_id] = []
    auditMap[a.form_id].push(a)
  })

  const questionCountMap = {}
  questions.forEach(q => {
    questionCountMap[q.form_id] = (questionCountMap[q.form_id] || 0) + 1
  })

  const sItemMap = Object.fromEntries(serviceItems.map(s => [s.id, s]))
  const courseMap = Object.fromEntries(courses.map(c => [c.id, c]))
  const sOrgMap = Object.fromEntries(serviceOrgs.map(o => [o.id, o]))
  const tOrgMap = Object.fromEntries(teachingOrgs.map(o => [o.id, o]))
  const fileMap = Object.fromEntries(files.map(f => [f.id, f]))

  // 状态过滤
  if (status && status !== 'all') {
    forms = forms.filter(f => f.status === status)
  }

  // 类型过滤
  if (type && type !== 'all') {
    forms = forms.filter(f => f.type === type)
  }

  // 关键词搜索
  if (keyword && keyword.trim()) {
    const kw = keyword.trim().toLowerCase()
    forms = forms.filter(f =>
      (f.title && f.title.toLowerCase().includes(kw)) ||
      (f.description && f.description.toLowerCase().includes(kw))
    )
  }

  // 排序：最新创建优先
  forms.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  // 分页
  const total = forms.length
  const start = (page - 1) * pageSize
  const paged = forms.slice(start, start + pageSize)

  // 组合关联数据
  const list = paged.map(f => {
    let targetName = ''
    if (f.type === 'teaching') {
      targetName = courseMap[f.course_id]?.course_name || tOrgMap[f.teaching_org_id]?.name || ''
    } else {
      targetName = sItemMap[f.service_item_id]?.name || sOrgMap[f.service_org_id]?.name || ''
    }

    let orgName = ''
    if (f.type === 'teaching') {
      orgName = tOrgMap[f.teaching_org_id]?.name || ''
    } else {
      orgName = sOrgMap[f.service_org_id]?.name || ''
    }

    const latestAudit = auditMap[f.id]?.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))?.[0]
    const latestWindow = windowMap[f.id]?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))?.[0]
    const coverFile = f.cover_file_id ? fileMap[f.cover_file_id] : null

    return {
      ...f,
      _target_name: targetName || '未指定对象',
      _org_name: orgName,
      _question_count: questionCountMap[f.id] || 0,
      _window: latestWindow || null,
      _audit: latestAudit || null,
      _cover_url: coverFile?.url || '',
    }
  })

  return { list, total, page, pageSize }
}

/**
 * 获取表单状态统计
 */
export async function getSchoolFormStatsApi(context) {
  const { tenantId } = context
  const res = await request.get('/evaluationForms', { params: { tenant_id: tenantId, deleted: false } })
  const forms = (res.data || []).filter(f => !f.deleted)

  return {
    draft: forms.filter(f => f.status === 'draft').length,
    pending_review: forms.filter(f => f.status === 'pending_review').length,
    published: forms.filter(f => f.status === 'published').length,
    rejected: forms.filter(f => f.status === 'rejected').length,
    closed: forms.filter(f => f.status === 'closed').length,
    total: forms.length,
  }
}

/**
 * 获取表单详情（含窗口、审核记录）
 */
export async function getSchoolFormDetailApi(context, formId) {
  const { tenantId } = context
  const [formRes, windowsRes, auditsRes, questionsRes, optionsRes, serviceItemsRes, coursesRes, serviceOrgsRes, teachingOrgsRes, filesRes] = await Promise.all([
    request.get(`/evaluationForms/${formId}`),
    request.get('/evaluationWindows', { params: { tenant_id: tenantId, form_id: formId, deleted: false } }),
    request.get('/formPublishAudits', { params: { tenant_id: tenantId, form_id: formId, deleted: false } }),
    request.get('/evaluationQuestions', { params: { tenant_id: tenantId, form_id: formId, deleted: false } }),
    request.get('/evaluationQuestionOptions', { params: { deleted: false } }),
    request.get('/serviceItems', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/courses', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/serviceOrgUnits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/teachingOrgUnits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/fileResources', { params: { tenant_id: tenantId, deleted: false } }),
  ])

  const form = formRes.data
  if (!form || form.tenant_id !== tenantId) return null

  const sItemMap = Object.fromEntries((serviceItemsRes.data || []).map(s => [s.id, s]))
  const courseMap = Object.fromEntries((coursesRes.data || []).map(c => [c.id, c]))
  const sOrgMap = Object.fromEntries((serviceOrgsRes.data || []).map(o => [o.id, o]))
  const tOrgMap = Object.fromEntries((teachingOrgsRes.data || []).map(o => [o.id, o]))
  const fileMap = Object.fromEntries((filesRes.data || []).filter(f => !f.deleted).map(f => [f.id, f]))

  let targetName = ''
  if (form.type === 'teaching') {
    targetName = courseMap[form.course_id]?.course_name || tOrgMap[form.teaching_org_id]?.name || ''
  } else {
    targetName = sItemMap[form.service_item_id]?.name || sOrgMap[form.service_org_id]?.name || ''
  }

  const windows = (windowsRes.data || []).filter(w => !w.deleted)
  const audits = (auditsRes.data || []).filter(a => !a.deleted).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
  const coverFile = form.cover_file_id ? fileMap[form.cover_file_id] : null

  // 组装题目
  const allOptions = (optionsRes.data || []).filter(o => !o.deleted)
  const optionMap = {}
  allOptions.forEach(o => {
    if (!optionMap[o.question_id]) optionMap[o.question_id] = []
    optionMap[o.question_id].push(o)
  })
  const questions = (questionsRes.data || [])
    .filter(q => !q.deleted)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(q => ({
      ...q,
      _options: (optionMap[q.id] || []).sort((a, b) => a.sort_order - b.sort_order),
    }))

  return {
    ...form,
    _target_name: targetName || '未指定对象',
    _org_name: form.type === 'teaching' ? (tOrgMap[form.teaching_org_id]?.name || '') : (sOrgMap[form.service_org_id]?.name || ''),
    _windows: windows,
    _audits: audits,
    _questions: questions,
    _cover_url: coverFile?.url || '',
  }
}

// ==================== 审核操作 ====================

/**
 * 获取待审核表单列表
 */
export async function getSchoolPendingAuditsApi(context) {
  const { tenantId } = context
  const [auditsRes, formsRes] = await Promise.all([
    request.get('/formPublishAudits', { params: { tenant_id: tenantId, status: 'pending', deleted: false } }),
    request.get('/evaluationForms', { params: { tenant_id: tenantId, status: 'pending_review', deleted: false } }),
  ])

  const audits = (auditsRes.data || []).filter(a => !a.deleted)
  const forms = (formsRes.data || []).filter(f => !f.deleted)

  // 关联表单信息
  const formMap = Object.fromEntries(forms.map(f => [f.id, f]))
  return audits.map(a => ({
    ...a,
    _form: formMap[a.form_id] || null,
  }))
}

/**
 * 通过审核
 */
export async function approveFormPublishApi(context, formId, reviewComment) {
  const { tenantId, userId } = context
  const now = new Date().toISOString()

  // 查找对应的待审核记录
  const auditsRes = await request.get('/formPublishAudits', {
    params: { tenant_id: tenantId, form_id: formId, status: 'pending', deleted: false },
  })
  const pendingAudits = (auditsRes.data || []).filter(a => !a.deleted)
  if (pendingAudits.length === 0) throw new Error('未找到待审核记录')

  const latestAudit = pendingAudits.sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at))[0]

  // 更新审核记录
  await request.patch(`/formPublishAudits/${latestAudit.id}`, {
    status: 'approved',
    reviewed_by: userId,
    reviewed_at: now,
    review_comment: reviewComment || '',
    updated_at: now,
  })

  // 更新表单状态为已发布
  await request.patch(`/evaluationForms/${formId}`, {
    status: 'published',
    updated_at: now,
  })

  // 创建默认评价窗口
  const formRes = await request.get(`/evaluationForms/${formId}`)
  const form = formRes.data
  const startDate = new Date(now)
  const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 默认30天

  await request.post('/evaluationWindows', {
    tenant_id: tenantId,
    form_id: formId,
    type: form?.type || 'service',
    start_at: startDate.toISOString(),
    end_at: endDate.toISOString(),
    modifiable_hours: 24,
    status: 'open',
    created_at: now,
    updated_at: now,
    deleted: false,
  })

  // 记录操作日志
  try {
    await request.post('/operationLogs', {
      tenant_id: tenantId,
      user_id: userId,
      module: 'form',
      action: 'approve_publish',
      target_type: 'evaluation_form',
      target_id: formId,
      result: 'success',
      detail: reviewComment ? `审核通过，意见：${reviewComment}` : '审核通过',
      created_at: now,
      updated_at: now,
      deleted: false,
    })
  } catch {
    // 日志记录失败不影响主流程
  }

  return { success: true }
}

/**
 * 拒绝审核
 */
export async function rejectFormPublishApi(context, formId, reviewComment) {
  const { tenantId, userId } = context
  const now = new Date().toISOString()

  // 查找对应的待审核记录
  const auditsRes = await request.get('/formPublishAudits', {
    params: { tenant_id: tenantId, form_id: formId, status: 'pending', deleted: false },
  })
  const pendingAudits = (auditsRes.data || []).filter(a => !a.deleted)
  if (pendingAudits.length === 0) throw new Error('未找到待审核记录')

  const latestAudit = pendingAudits.sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at))[0]

  // 更新审核记录
  await request.patch(`/formPublishAudits/${latestAudit.id}`, {
    status: 'rejected',
    reviewed_by: userId,
    reviewed_at: now,
    review_comment: reviewComment || '',
    updated_at: now,
  })

  // 更新表单状态为已拒绝
  await request.patch(`/evaluationForms/${formId}`, {
    status: 'rejected',
    updated_at: now,
  })

  // 记录操作日志
  try {
    await request.post('/operationLogs', {
      tenant_id: tenantId,
      user_id: userId,
      module: 'form',
      action: 'reject_publish',
      target_type: 'evaluation_form',
      target_id: formId,
      result: 'success',
      detail: reviewComment ? `审核拒绝，原因：${reviewComment}` : '审核拒绝',
      created_at: now,
      updated_at: now,
      deleted: false,
    })
  } catch {
    // 日志记录失败不影响主流程
  }

  return { success: true }
}

// ==================== 状态管理 ====================

/**
 * 关闭表单（published → closed）
 */
export async function closeFormApi(context, formId) {
  const { tenantId, userId } = context
  const now = new Date().toISOString()

  await request.patch(`/evaluationForms/${formId}`, {
    status: 'closed',
    updated_at: now,
  })

  // 关闭关联的开放窗口
  try {
    const windowsRes = await request.get('/evaluationWindows', {
      params: { tenant_id: tenantId, form_id: formId, status: 'open', deleted: false },
    })
    const openWindows = (windowsRes.data || []).filter(w => !w.deleted)
    for (const w of openWindows) {
      await request.patch(`/evaluationWindows/${w.id}`, {
        status: 'closed',
        updated_at: now,
      })
    }
  } catch {
    // 窗口关闭失败不影响主流程
  }

  // 记录操作日志
  try {
    await request.post('/operationLogs', {
      tenant_id: tenantId,
      user_id: userId,
      module: 'form',
      action: 'close_form',
      target_type: 'evaluation_form',
      target_id: formId,
      result: 'success',
      detail: '关闭评价表单',
      created_at: now,
      updated_at: now,
      deleted: false,
    })
  } catch {
    // 日志记录失败不影响主流程
  }

  return { success: true }
}

/**
 * 软删除表单
 */
export async function deleteSchoolFormApi(context, formId) {
  const { tenantId, userId } = context
  const now = new Date().toISOString()

  await request.patch(`/evaluationForms/${formId}`, {
    deleted: true,
    updated_at: now,
  })

  // 记录操作日志
  try {
    await request.post('/operationLogs', {
      tenant_id: tenantId,
      user_id: userId,
      module: 'form',
      action: 'delete_form',
      target_type: 'evaluation_form',
      target_id: formId,
      result: 'success',
      detail: '删除评价表单',
      created_at: now,
      updated_at: now,
      deleted: false,
    })
  } catch {
    // 日志记录失败不影响主流程
  }

  return { success: true }
}

// ==================== 窗口管理 ====================

/**
 * 获取表单关联窗口
 */
export async function getSchoolFormWindowsApi(context, formId) {
  const { tenantId } = context
  const res = await request.get('/evaluationWindows', {
    params: { tenant_id: tenantId, form_id: formId, deleted: false },
  })
  return (res.data || []).filter(w => !w.deleted).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

/**
 * 创建评价窗口
 */
export async function createSchoolFormWindowApi(context, payload) {
  const { tenantId, userId } = context
  const now = new Date().toISOString()
  const data = {
    ...payload,
    tenant_id: tenantId,
    created_at: now,
    updated_at: now,
    deleted: false,
  }
  const res = await request.post('/evaluationWindows', data)

  // 记录操作日志
  try {
    await request.post('/operationLogs', {
      tenant_id: tenantId,
      user_id: userId,
      module: 'form',
      action: 'create_window',
      target_type: 'evaluation_window',
      target_id: res?.data?.id || null,
      result: 'success',
      detail: `创建评价窗口（表单ID: ${payload.form_id}）`,
      created_at: now,
      updated_at: now,
      deleted: false,
    })
  } catch {
    // 日志记录失败不影响主流程
  }

  return res
}

/**
 * 更新评价窗口
 */
export async function updateSchoolFormWindowApi(context, windowId, payload) {
  const { tenantId, userId } = context
  const now = new Date().toISOString()
  await request.patch(`/evaluationWindows/${windowId}`, { ...payload, updated_at: now })

  // 记录操作日志
  try {
    await request.post('/operationLogs', {
      tenant_id: tenantId,
      user_id: userId,
      module: 'form',
      action: 'update_window',
      target_type: 'evaluation_window',
      target_id: windowId,
      result: 'success',
      detail: '更新评价窗口',
      created_at: now,
      updated_at: now,
      deleted: false,
    })
  } catch {
    // 日志记录失败不影响主流程
  }
}

/**
 * 关闭窗口
 */
export async function closeSchoolFormWindowApi(context, windowId) {
  const { tenantId, userId } = context
  const now = new Date().toISOString()
  await request.patch(`/evaluationWindows/${windowId}`, {
    status: 'closed',
    updated_at: now,
  })

  // 记录操作日志
  try {
    await request.post('/operationLogs', {
      tenant_id: tenantId,
      user_id: userId,
      module: 'form',
      action: 'close_window',
      target_type: 'evaluation_window',
      target_id: windowId,
      result: 'success',
      detail: '关闭评价窗口',
      created_at: now,
      updated_at: now,
      deleted: false,
    })
  } catch {
    // 日志记录失败不影响主流程
  }
}

// ==================== 题目查看 ====================

/**
 * 获取表单题目（含选项）
 */
export async function getSchoolFormQuestionsApi(context, formId) {
  const { tenantId } = context
  const [questionsRes, optionsRes] = await Promise.all([
    request.get('/evaluationQuestions', { params: { tenant_id: tenantId, form_id: formId, deleted: false } }),
    request.get('/evaluationQuestionOptions', { params: { deleted: false } }),
  ])

  const questions = (questionsRes.data || []).filter(q => !q.deleted).sort((a, b) => a.sort_order - b.sort_order)
  const allOptions = (optionsRes.data || []).filter(o => !o.deleted)

  const optionMap = {}
  allOptions.forEach(o => {
    if (!optionMap[o.question_id]) optionMap[o.question_id] = []
    optionMap[o.question_id].push(o)
  })

  return questions.map(q => ({
    ...q,
    _options: (optionMap[q.id] || []).sort((a, b) => a.sort_order - b.sort_order),
  }))
}

// ==================== 选项数据 ====================

/**
 * 获取服务项目选项
 */
export async function getSchoolServiceItemOptionsApi(context) {
  const { tenantId } = context
  const res = await request.get('/serviceItems', { params: { tenant_id: tenantId, deleted: false } })
  return (res.data || []).filter(s => !s.deleted)
}

/**
 * 获取课程选项
 */
export async function getSchoolCourseOptionsApi(context) {
  const { tenantId } = context
  const res = await request.get('/courses', { params: { tenant_id: tenantId, deleted: false } })
  return (res.data || []).filter(c => !c.deleted)
}

/**
 * 获取组织单位选项（教学 + 服务）
 */
export async function getSchoolOrgUnitOptionsApi(context) {
  const { tenantId } = context
  const [teachingRes, serviceRes] = await Promise.all([
    request.get('/teachingOrgUnits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/serviceOrgUnits', { params: { tenant_id: tenantId, deleted: false } }),
  ])
  return {
    teachingOrgs: (teachingRes.data || []).filter(o => !o.deleted),
    serviceOrgs: (serviceRes.data || []).filter(o => !o.deleted),
  }
}
