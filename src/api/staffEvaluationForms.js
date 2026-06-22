import request from '@/request'

/**
 * 职工端评价表单管理 API
 *
 * 封装评价表单的列表查询、详情、创建、编辑、题目管理、
 * 评价窗口、提交审核等操作。所有查询基于 tenant_id 过滤。
 */

// ==================== 查询类 ====================

/**
 * 获取评价表单列表（含关联统计）
 * @param {Object} context - { tenantId, userId, roleCodes }
 * @param {Object} filters - { status, type, targetType, keyword, sort, page, pageSize }
 */
export async function getStaffEvalFormsApi(context, filters = {}) {
  const { tenantId } = context
  const { status, type, targetType, keyword, sort = 'latest_update', page = 1, pageSize = 10 } = filters

  // 并行获取表单、窗口、审核、题目、关联对象
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

  // 评价对象过滤
  if (targetType && targetType !== 'all') {
    if (targetType === 'course_teacher') {
      forms = forms.filter(f => f.type === 'teaching' && f.course_id)
    } else if (targetType === 'service_item') {
      forms = forms.filter(f => (f.type === 'service' || f.type === 'instant') && f.service_item_id)
    } else if (targetType === 'service_org') {
      forms = forms.filter(f => (f.type === 'service' || f.type === 'instant') && f.service_org_id)
    }
  }

  // 关键词搜索
  if (keyword && keyword.trim()) {
    const kw = keyword.trim().toLowerCase()
    forms = forms.filter(f =>
      (f.title && f.title.toLowerCase().includes(kw)) ||
      (f.description && f.description.toLowerCase().includes(kw))
    )
  }

  // 排序
  switch (sort) {
    case 'latest_create':
      forms.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      break
    case 'window_end':
      forms.sort((a, b) => {
        const wa = windowMap[a.id]?.[0]
        const wb = windowMap[b.id]?.[0]
        return (wb?.end_at || '') > (wa?.end_at || '') ? 1 : -1
      })
      break
    case 'status_priority': {
      const order = { draft: 0, pending_review: 1, rejected: 2, published: 3, closed: 4 }
      forms.sort((a, b) => (order[a.status] ?? 5) - (order[b.status] ?? 5))
      break
    }
    default: // latest_update
      forms.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
  }

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
    const coverFile = f.cover_file_id ? fileMap[f.cover_file_id] : null

    return {
      ...f,
      _target_name: targetName || '未指定对象',
      _org_name: orgName,
      _question_count: questionCountMap[f.id] || 0,
      _window: windowMap[f.id]?.[0] || null,
      _audit: latestAudit || null,
      _cover_url: coverFile?.url || '',
    }
  })

  return { list, total, page, pageSize }
}

/**
 * 获取表单状态统计
 */
export async function getStaffEvalFormStatsApi(context) {
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
export async function getEvalFormDetailApi(context, formId) {
  const { tenantId } = context
  const [formRes, windowsRes, auditsRes, serviceItemsRes, coursesRes, serviceOrgsRes, teachingOrgsRes, filesRes] = await Promise.all([
    request.get(`/evaluationForms/${formId}`),
    request.get('/evaluationWindows', { params: { tenant_id: tenantId, form_id: formId, deleted: false } }),
    request.get('/formPublishAudits', { params: { tenant_id: tenantId, form_id: formId, deleted: false } }),
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

  return {
    ...form,
    _target_name: targetName || '未指定对象',
    _org_name: form.type === 'teaching' ? (tOrgMap[form.teaching_org_id]?.name || '') : (sOrgMap[form.service_org_id]?.name || ''),
    _windows: windows,
    _audits: audits,
    _cover_url: coverFile?.url || '',
  }
}

/**
 * 获取表单题目（含选项）
 */
export async function getEvalQuestionsByFormApi(context, formId) {
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

// ==================== 操作类 ====================

/**
 * 创建评价表单草稿
 */
export async function createEvalFormDraftApi(context, payload) {
  const now = new Date().toISOString()
  const data = {
    ...payload,
    tenant_id: context.tenantId,
    school_id: context.schoolId || null,
    publisher_id: context.userId,
    status: 'draft',
    created_at: now,
    updated_at: now,
    deleted: false,
  }
  const res = await request.post('/evaluationForms', data)
  return res
}

/**
 * 更新评价表单
 */
export async function updateEvalFormApi(context, formId, payload) {
  const now = new Date().toISOString()
  await request.patch(`/evaluationForms/${formId}`, { ...payload, updated_at: now })
}

/**
 * 删除表单（软删除）
 */
export async function deleteDraftEvalFormApi(context, formId) {
  const now = new Date().toISOString()
  await request.patch(`/evaluationForms/${formId}`, { deleted: true, deleted_at: now, updated_at: now })
}

/**
 * 批量保存题目（先删除旧题目和选项，再新增）
 */
export async function saveEvalQuestionsApi(context, formId, questions) {
  const { tenantId } = context

  // 获取旧题目
  const oldRes = await request.get('/evaluationQuestions', { params: { tenant_id: tenantId, form_id: formId, deleted: false } })
  const oldQuestions = (oldRes.data || []).filter(q => !q.deleted)

  // 软删除旧题目
  for (const q of oldQuestions) {
    await request.patch(`/evaluationQuestions/${q.id}`, { deleted: true })
    // 软删除旧选项
    const optRes = await request.get('/evaluationQuestionOptions', { params: { question_id: q.id, deleted: false } })
    for (const opt of (optRes.data || [])) {
      if (!opt.deleted) await request.patch(`/evaluationQuestionOptions/${opt.id}`, { deleted: true })
    }
  }

  // 新增题目
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const qRes = await request.post('/evaluationQuestions', {
      tenant_id: tenantId,
      form_id: formId,
      type: q.type,
      title: q.title,
      required: q.required ?? true,
      max_score: q.max_score || (q.type === 'rating' ? 5 : null),
      min_length: q.min_length || null,
      sort_order: i + 1,
      deleted: false,
    })

    // 新增选项
    if (q._options && q._options.length > 0) {
      for (let j = 0; j < q._options.length; j++) {
        await request.post('/evaluationQuestionOptions', {
          question_id: qRes.data.id,
          option_text: q._options[j].option_text || q._options[j].text,
          sort_order: j + 1,
          deleted: false,
        })
      }
    }
  }
}

/**
 * 创建评价窗口
 */
export async function createEvalWindowApi(context, payload) {
  const now = new Date().toISOString()
  const data = {
    ...payload,
    tenant_id: context.tenantId,
    created_at: now,
    updated_at: now,
    deleted: false,
  }
  const res = await request.post('/evaluationWindows', data)
  return res
}

/**
 * 更新评价窗口
 */
export async function updateEvalWindowApi(context, windowId, payload) {
  const now = new Date().toISOString()
  await request.patch(`/evaluationWindows/${windowId}`, { ...payload, updated_at: now })
}

/**
 * 提交表单审核
 */
export async function submitFormForAuditApi(context, formId, payload = {}) {
  const { userId, roleCodes } = context
  const now = new Date().toISOString()

  // 更新表单状态
  await request.patch(`/evaluationForms/${formId}`, {
    status: 'pending_review',
    updated_at: now,
  })

  // 创建审核记录
  const auditRes = await request.post('/formPublishAudits', {
    tenant_id: context.tenantId,
    school_id: context.schoolId || null,
    form_id: formId,
    action: 'publish',
    status: 'pending',
    requested_by: userId,
    submitter_role: roleCodes?.[0] || 'staff',
    submit_reason: payload.submit_reason || '提交评价表单审核',
    requested_at: now,
    reviewed_by: null,
    reviewed_at: null,
    review_comment: null,
    created_at: now,
    updated_at: now,
    deleted: false,
  })

  // 创建通知给学校管理员（可选）
  try {
    await request.post('/notifications', {
      tenant_id: context.tenantId,
      school_id: context.schoolId || null,
      receiver_user_id: null,
      target_roles: 'school_admin',
      type: 'form_audit',
      title: '有新的评价表单待审核',
      content: `职工提交了评价表单《${payload.form_title || ''}》审核申请，请及时处理。`,
      read_status: 'unread',
      link: '/school/audit/list',
      biz_type: 'form_publish_audit',
      biz_id: auditRes?.id || null,
      created_at: now,
      updated_at: now,
      deleted: false,
    })
  } catch {
    // 通知创建失败不影响主流程
  }

  return auditRes
}

/**
 * 获取表单审核记录
 */
export async function getFormAuditApi(context, formId) {
  const { tenantId } = context
  const res = await request.get('/formPublishAudits', {
    params: { tenant_id: tenantId, form_id: formId, deleted: false },
  })
  return (res.data || []).filter(a => !a.deleted).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
}

/**
 * 获取发布目标选项（课程、组织、服务项目）
 */
export async function getPublishTargetOptionsApi(context) {
  const { tenantId } = context
  const [serviceItemsRes, coursesRes, serviceOrgsRes, teachingOrgsRes, courseTeachersRes] = await Promise.all([
    request.get('/serviceItems', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/courses', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/serviceOrgUnits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/teachingOrgUnits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/courseTeachers', { params: { tenant_id: tenantId, deleted: false } }).catch(() => ({ data: [] })),
  ])

  return {
    serviceItems: (serviceItemsRes.data || []).filter(s => !s.deleted),
    courses: (coursesRes.data || []).filter(c => !c.deleted),
    serviceOrgs: (serviceOrgsRes.data || []).filter(o => !o.deleted),
    teachingOrgs: (teachingOrgsRes.data || []).filter(o => !o.deleted),
    courseTeachers: (courseTeachersRes.data || []).filter(ct => !ct.deleted),
  }
}

/**
 * 撤回审核申请
 */
export async function withdrawAuditApi(context, formId) {
  const { tenantId } = context
  const now = new Date().toISOString()

  // 更新表单状态回到草稿
  await request.patch(`/evaluationForms/${formId}`, {
    status: 'draft',
    updated_at: now,
  })

  // 查找对应的待审核记录并标记为撤回
  try {
    const auditsRes = await request.get('/formPublishAudits', {
      params: { tenant_id: tenantId, form_id: formId, status: 'pending', deleted: false },
    })
    const pendingAudits = (auditsRes.data || []).filter(a => !a.deleted)
    if (pendingAudits.length > 0) {
      const latestAudit = pendingAudits.sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at))[0]
      await request.patch(`/formPublishAudits/${latestAudit.id}`, {
        status: 'withdrawn',
        withdrawn_at: now,
        updated_at: now,
      })
    }
  } catch (err) {
    console.error('撤回审核记录更新失败:', err)
  }
}

/**
 * 获取表单数据统计（提交数、平均分、分数分布等）
 */
export async function getEvalFormDataApi(context, formId) {
  const { tenantId } = context
  const [submissionsRes, questionsRes] = await Promise.all([
    request.get('/evaluationSubmissions', { params: { tenant_id: tenantId, form_id: formId, deleted: false } }),
    request.get('/evaluationQuestions', { params: { tenant_id: tenantId, form_id: formId, deleted: false } }),
  ])

  const submissions = (submissionsRes.data || []).filter(s => !s.deleted)
  const questions = (questionsRes.data || []).filter(q => !q.deleted).sort((a, b) => a.sort_order - b.sort_order)

  // 基础统计
  const totalCount = submissions.length
  const avgScore = totalCount > 0
    ? (submissions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / totalCount).toFixed(2)
    : 0

  // 分数分布
  const scoreDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  submissions.forEach(s => {
    const score = Math.round(s.overall_score || 0)
    if (score >= 1 && score <= 5) scoreDistribution[score]++
  })

  // 最近提交
  const recentSubmissions = submissions
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
    .slice(0, 10)

  return {
    totalCount,
    avgScore: Number(avgScore),
    scoreDistribution,
    recentSubmissions,
    questions,
  }
}
