import request from '@/request'

// ==================== 映射表 ====================

const auditStatusMap = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
}

const formTypeMap = {
  teaching: '教学评价',
  service: '服务评价',
  instant: '即时评价',
}

const formStatusMap = {
  draft: '草稿',
  pending_review: '待审核',
  published: '已发布',
  rejected: '已驳回',
  closed: '已关闭',
}

const windowStatusMap = {
  pending: '未开始',
  open: '进行中',
  closed: '已结束',
}

// ==================== 辅助函数 ====================

function resolveFormName(form) {
  return form.title || form.name || form.form_name || '未命名评价表单'
}

function resolveOrgName(form, orgMap) {
  const org = orgMap[form.teaching_org_id || form.service_org_id]
  return org?.name || ''
}

function resolveProfileName(profileMap, userId) {
  const p = profileMap[userId]
  return p?.real_name || ''
}

function calcWindowStatus(w) {
  const now = new Date()
  const start = new Date(w.start_at)
  const end = new Date(w.end_at)
  if (now < start) return 'pending'
  if (now > end) return 'closed'
  return 'open'
}

// ==================== 公开 API ====================

/**
 * 获取审核列表（聚合数据）
 */
export async function getSchoolAuditListApi(tenantId, filters = {}) {
  const [auditsRes, formsRes, profilesRes, teachingOrgsRes, serviceOrgsRes, windowsRes, coursesRes, serviceItemsRes] = await Promise.all([
    request.get('/formPublishAudits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/evaluationForms', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/personProfiles', { params: { deleted: false } }),
    request.get('/teachingOrgUnits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/serviceOrgUnits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/evaluationWindows', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/courses', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/serviceItems', { params: { tenant_id: tenantId, deleted: false } }),
  ])

  let audits = (auditsRes.data || []).filter(a => !a.deleted)
  const forms = (formsRes.data || []).filter(f => !f.deleted)
  const profiles = (profilesRes.data || []).filter(p => !p.deleted)
  const teachingOrgs = (teachingOrgsRes.data || []).filter(o => !o.deleted)
  const serviceOrgs = (serviceOrgsRes.data || []).filter(o => !o.deleted)
  const windows = (windowsRes.data || []).filter(w => !w.deleted)
  const courses = (coursesRes.data || []).filter(c => !c.deleted)
  const serviceItems = (serviceItemsRes.data || []).filter(s => !s.deleted)

  // 构建映射
  const formMap = {}
  forms.forEach(f => { formMap[f.id] = f })
  const profileMap = {}
  profiles.forEach(p => { profileMap[p.user_id] = p })
  const orgMap = {}
  teachingOrgs.forEach(o => { orgMap[o.id] = o })
  serviceOrgs.forEach(o => { orgMap[o.id] = o })
  const windowMap = {}
  windows.forEach(w => {
    if (!windowMap[w.form_id]) windowMap[w.form_id] = []
    windowMap[w.form_id].push(w)
  })
  const courseMap = {}
  courses.forEach(c => { courseMap[c.id] = c })
  const serviceItemMap = {}
  serviceItems.forEach(s => { serviceItemMap[s.id] = s })

  // 状态筛选
  if (filters.status && filters.status !== 'all') {
    audits = audits.filter(a => a.status === filters.status)
  }

  // 类型筛选
  if (filters.formType && filters.formType !== 'all') {
    audits = audits.filter(a => {
      const form = formMap[a.form_id]
      return form && form.type === filters.formType
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
      audits = audits.filter(a => new Date(a.requested_at || a.created_at) >= since)
    }
  }

  // 搜索
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    audits = audits.filter(a => {
      const form = formMap[a.form_id] || {}
      const profile = profileMap[a.requested_by] || {}
      const org = orgMap[form.teaching_org_id || form.service_org_id] || {}
      return (
        resolveFormName(form).toLowerCase().includes(kw) ||
        (profile.real_name || '').toLowerCase().includes(kw) ||
        (org.name || '').toLowerCase().includes(kw) ||
        String(a.id).includes(kw)
      )
    })
  }

  // 排序
  if (filters.sort === 'recent_audit') {
    audits.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
  } else if (filters.sort === 'status_first') {
    const order = { pending: 0, rejected: 1, approved: 2 }
    audits.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9))
  } else {
    // 默认最新提交
    audits.sort((a, b) => new Date(b.requested_at || b.created_at) - new Date(a.requested_at || a.created_at))
  }

  // 组装结果
  return audits.map(a => {
    const form = formMap[a.form_id] || {}
    const formWindows = (windowMap[a.form_id] || []).map(w => ({
      ...w,
      status_label: windowStatusMap[calcWindowStatus(w)] || calcWindowStatus(w),
    }))

    // 解析评价对象名称
    let objectName = ''
    let objectTypeLabel = ''
    if (form.course_id) {
      const course = courseMap[form.course_id]
      objectName = course?.course_name || '对象未匹配'
      objectTypeLabel = '课程'
    } else if (form.service_item_id) {
      const item = serviceItemMap[form.service_item_id]
      objectName = item?.name || '对象未匹配'
      objectTypeLabel = '服务项目'
    }

    // 构建缺失项提示
    const missingItems = []
    if (!form.title && !form.name && !form.form_name) missingItems.push('表单名称未配置')
    if (!form.teaching_org_id && !form.service_org_id && !form.course_id && !form.service_item_id) missingItems.push('对象未配置')
    if (!formWindows.length) missingItems.push('窗口未配置')

    return {
      id: a.id,
      form_id: a.form_id,
      form_title: resolveFormName(form),
      form_type: formTypeMap[form.type] || '评价',
      form_type_code: form.type,
      form_status: formStatusMap[form.status] || form.status || '未知',
      form_description: form.description || '',
      form_anonymous: form.anonymous,
      form_publish_scope: form.publish_scope,
      status: auditStatusMap[a.status] || a.status,
      status_code: a.status,
      submitter_name: resolveProfileName(profileMap, a.requested_by) || '未知提交人',
      org_name: resolveOrgName(form, orgMap) || '组织未匹配',
      submit_reason: a.submit_reason || '',
      requested_at: a.requested_at || a.created_at,
      reviewed_at: a.reviewed_at,
      reviewed_by_name: resolveProfileName(profileMap, a.reviewed_by),
      review_comment: a.review_comment || '',
      auditor_id: a.reviewed_by,
      windows: formWindows,
      window_summary: formWindows.length
        ? `${formWindows[0].start_at?.slice(0, 10) || '?'} ~ ${formWindows[0].end_at?.slice(0, 10) || '?'}`
        : '窗口未配置',
      // 评价对象信息
      object_name: objectName,
      object_type_label: objectTypeLabel,
      // 缺失项提示
      missing_items: missingItems,
    }
  })
}

/**
 * 获取审核统计
 */
export async function getSchoolAuditSummaryApi(tenantId) {
  const [auditsRes] = await Promise.all([
    request.get('/formPublishAudits', { params: { tenant_id: tenantId, deleted: false } }),
  ])
  const audits = (auditsRes.data || []).filter(a => !a.deleted)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  return {
    total: audits.length,
    pending: audits.filter(a => a.status === 'pending').length,
    approved: audits.filter(a => a.status === 'approved').length,
    rejected: audits.filter(a => a.status === 'rejected').length,
    todaySubmitted: audits.filter(a => new Date(a.requested_at || a.created_at) >= todayStart).length,
    monthAudited: audits.filter(a => a.reviewed_at && new Date(a.reviewed_at) >= monthStart).length,
  }
}

/**
 * 获取审核详情（含表单、题目、窗口等完整信息）
 */
export async function getSchoolAuditDetailApi(tenantId, auditId) {
  // formQuestions 集合可能不存在，单独 catch 避免整体失败，silent 静默不弹错误提示
  const questionsPromise = request.get('/formQuestions', { params: { tenant_id: tenantId, deleted: false }, silent: true }).catch(() => ({ data: [] }))

  const [auditsRes, formsRes, profilesRes, teachingOrgsRes, serviceOrgsRes, windowsRes, coursesRes, serviceItemsRes, questionsRes] = await Promise.all([
    request.get('/formPublishAudits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/evaluationForms', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/personProfiles', { params: { deleted: false } }),
    request.get('/teachingOrgUnits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/serviceOrgUnits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/evaluationWindows', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/courses', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/serviceItems', { params: { tenant_id: tenantId, deleted: false } }),
    questionsPromise,
  ])

  const audits = (auditsRes.data || []).filter(a => !a.deleted)
  const forms = (formsRes.data || []).filter(f => !f.deleted)
  const profiles = (profilesRes.data || []).filter(p => !p.deleted)
  const teachingOrgs = (teachingOrgsRes.data || []).filter(o => !o.deleted)
  const serviceOrgs = (serviceOrgsRes.data || []).filter(o => !o.deleted)
  const windows = (windowsRes.data || []).filter(w => !w.deleted)
  const courses = (coursesRes.data || []).filter(c => !c.deleted)
  const serviceItems = (serviceItemsRes.data || []).filter(s => !s.deleted)
  const questions = (questionsRes.data || []).filter(q => !q.deleted)

  const audit = audits.find(a => a.id === Number(auditId))
  if (!audit) return null

  const form = forms.find(f => f.id === audit.form_id) || {}
  const profileMap = {}
  profiles.forEach(p => { profileMap[p.user_id] = p })
  const orgMap = {}
  teachingOrgs.forEach(o => { orgMap[o.id] = o })
  serviceOrgs.forEach(o => { orgMap[o.id] = o })
  const courseMap = {}
  courses.forEach(c => { courseMap[c.id] = c })
  const serviceItemMap = {}
  serviceItems.forEach(s => { serviceItemMap[s.id] = s })

  const formWindows = windows
    .filter(w => w.form_id === audit.form_id)
    .map(w => ({
      ...w,
      status_code: calcWindowStatus(w),
      status_label: windowStatusMap[calcWindowStatus(w)] || calcWindowStatus(w),
    }))

  // 统计题目数量
  const formQuestionsCount = questions.filter(q => q.form_id === audit.form_id).length

  // 风险检查（区分阻断项和警告项）
  const blockingRisks = []  // 阻断项：不允许通过
  const warningRisks = []   // 警告项：提醒但不阻断

  if (!form.title && !form.name && !form.form_name) {
    blockingRisks.push('表单名称未配置')
  }
  if (!form.teaching_org_id && !form.service_org_id && !form.course_id && !form.service_item_id) {
    blockingRisks.push('评价对象未配置')
  }
  if (formQuestionsCount === 0) {
    blockingRisks.push('至少需要配置1个题目')
  }
  if (!formWindows.length) {
    blockingRisks.push('评价窗口未配置')
  } else {
    const w = formWindows[0]
    if (!w.start_at || !w.end_at) {
      blockingRisks.push('评价窗口时间不完整')
    } else if (new Date(w.end_at) <= new Date(w.start_at)) {
      blockingRisks.push('评价截止时间必须晚于开始时间')
    }
  }

  // 合并所有风险（兼容旧代码）
  const risks = [...blockingRisks, ...warningRisks]

  // 解析评价对象名称
  let objectName = ''
  let objectTypeLabel = ''
  if (form.course_id) {
    const course = courseMap[form.course_id]
    objectName = course?.course_name || '对象未匹配'
    objectTypeLabel = '课程'
  } else if (form.service_item_id) {
    const item = serviceItemMap[form.service_item_id]
    objectName = item?.name || '对象未匹配'
    objectTypeLabel = '服务项目'
  }

  return {
    // 审核信息
    audit_id: audit.id,
    audit_status: auditStatusMap[audit.status] || audit.status,
    audit_status_code: audit.status,
    submitter_name: resolveProfileName(profileMap, audit.requested_by) || '未知',
    submitter_id: audit.requested_by,
    submit_reason: audit.submit_reason || '',
    requested_at: audit.requested_at || audit.created_at,
    reviewed_at: audit.reviewed_at,
    reviewed_by_name: resolveProfileName(profileMap, audit.reviewed_by),
    review_comment: audit.review_comment || '',
    // 表单信息
    form_id: form.id,
    form_title: resolveFormName(form),
    form_type: formTypeMap[form.type] || '评价',
    form_description: form.description || '',
    form_status: formStatusMap[form.status] || form.status || '未知',
    form_anonymous: form.anonymous,
    form_publish_scope: form.publish_scope || '',
    form_created_at: form.created_at,
    form_publisher_name: resolveProfileName(profileMap, form.publisher_id),
    // 评价对象
    org_name: resolveOrgName(form, orgMap) || '',
    org_id: form.teaching_org_id || form.service_org_id,
    course_id: form.course_id,
    service_item_id: form.service_item_id,
    object_name: objectName,
    object_type_label: objectTypeLabel,
    // 题目数量
    questions_count: formQuestionsCount,
    // 窗口
    windows: formWindows,
    // 风险（分类）
    risks,
    blocking_risks: blockingRisks,
    warning_risks: warningRisks,
  }
}

/**
 * 审核通过
 */
export async function approveSchoolAuditApi(tenantId, schoolId, auditId, currentUserId) {
  // 1. 获取审核记录和表单
  const [auditsRes, formsRes] = await Promise.all([
    request.get('/formPublishAudits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/evaluationForms', { params: { tenant_id: tenantId, deleted: false } }),
  ])
  const audit = (auditsRes.data || []).find(a => a.id === Number(auditId))
  const form = (formsRes.data || []).find(f => f.id === audit?.form_id)
  if (!audit || !form) throw new Error('审核记录或表单不存在')

  const now = new Date().toISOString()
  const formTitle = resolveFormName(form)

  // 2. 更新审核记录
  await request.patch(`/formPublishAudits/${auditId}`, {
    status: 'approved',
    audit_result: 'approved',
    auditor_id: currentUserId,
    audit_comment: '审核通过',
    reviewed_by: currentUserId,
    reviewed_at: now,
    updated_at: now,
  })

  // 3. 更新表单状态
  await request.patch(`/evaluationForms/${form.id}`, {
    status: 'published',
    updated_at: now,
  })

  // 4. 写入操作日志
  await request.post('/operationLogs', {
    tenant_id: tenantId,
    school_id: schoolId,
    user_id: currentUserId,
    module: 'school_audit',
    action: 'approve_form_publish',
    target_type: 'evaluation_form',
    target_id: form.id,
    content: `审核通过《${formTitle}》发布申请`,
    created_at: now,
    updated_at: now,
    deleted: false,
  })

  // 5. 写入通知
  await request.post('/notifications', {
    tenant_id: tenantId,
    school_id: schoolId,
    receiver_user_id: audit.requested_by,
    target_roles: null,
    type: 'evaluation',
    title: '评价表单审核通过',
    content: `《${formTitle}》已通过学校审核`,
    link: '/staff/evaluation/forms',
    read_status: 'unread',
    created_at: now,
    updated_at: now,
    deleted: false,
  })

  return { success: true, formTitle }
}

/**
 * 审核驳回
 */
export async function rejectSchoolAuditApi(tenantId, schoolId, auditId, currentUserId, reason) {
  const [auditsRes, formsRes] = await Promise.all([
    request.get('/formPublishAudits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/evaluationForms', { params: { tenant_id: tenantId, deleted: false } }),
  ])
  const audit = (auditsRes.data || []).find(a => a.id === Number(auditId))
  const form = (formsRes.data || []).find(f => f.id === audit?.form_id)
  if (!audit || !form) throw new Error('审核记录或表单不存在')

  const now = new Date().toISOString()
  const formTitle = resolveFormName(form)

  // 2. 更新审核记录
  await request.patch(`/formPublishAudits/${auditId}`, {
    status: 'rejected',
    audit_result: 'rejected',
    auditor_id: currentUserId,
    audit_comment: reason,
    reviewed_by: currentUserId,
    reviewed_at: now,
    updated_at: now,
  })

  // 3. 更新表单状态
  await request.patch(`/evaluationForms/${form.id}`, {
    status: 'rejected',
    reject_reason: reason,
    updated_at: now,
  })

  // 4. 写入操作日志
  await request.post('/operationLogs', {
    tenant_id: tenantId,
    school_id: schoolId,
    user_id: currentUserId,
    module: 'school_audit',
    action: 'reject_form_publish',
    target_type: 'evaluation_form',
    target_id: form.id,
    content: `驳回《${formTitle}》发布申请`,
    created_at: now,
    updated_at: now,
    deleted: false,
  })

  // 5. 写入通知
  await request.post('/notifications', {
    tenant_id: tenantId,
    school_id: schoolId,
    receiver_user_id: audit.requested_by,
    target_roles: null,
    type: 'evaluation',
    title: '评价表单审核被驳回',
    content: `《${formTitle}》审核未通过，请根据驳回原因修改后重新提交`,
    link: '/staff/evaluation/forms',
    read_status: 'unread',
    created_at: now,
    updated_at: now,
    deleted: false,
  })

  return { success: true, formTitle }
}
