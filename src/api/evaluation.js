import request from '@/request'

// ==================== 基础读取 ====================

/**
 * 获取评价表单（任务即表单）
 */
export function getEvaluationTaskById(taskId) {
  return request.get(`/evaluationForms/${taskId}`).then(res => res.data)
}
export const getEvaluationFormById = getEvaluationTaskById

/**
 * 获取评价窗口
 */
export function getEvaluationWindowById(windowId) {
  return request.get(`/evaluationWindows/${windowId}`).then(res => res.data)
}

/**
 * 获取评价窗口列表
 */
export function getEvaluationWindowsApi(tenantId) {
  return request.get('/evaluationWindows', { params: { tenant_id: tenantId } })
    .then(res => (res.data || []).filter(w => !w.deleted))
}

/**
 * 获取评价表单列表
 */
export function getEvaluationFormsApi(tenantId) {
  return request.get('/evaluationForms', { params: { tenant_id: tenantId } })
    .then(res => (res.data || []).filter(f => !f.deleted))
}

/**
 * 获取单个评价表单
 */
export function getEvaluationFormApi(id) {
  return request.get(`/evaluationForms/${id}`).then(res => res.data)
}

/**
 * 获取评价题目列表（按表单）
 */
export function getEvaluationQuestions(formId, context) {
  return request.get('/evaluationQuestions', {
    params: { tenant_id: context.tenantId, form_id: formId, _sort: 'sort_order', _order: 'asc' }
  }).then(res => (res.data || []).filter(q => !q.deleted))
}

/**
 * 获取题目选项（单选/多选）
 */
export function getEvaluationQuestionOptionsApi(questionId) {
  return request.get('/evaluationQuestionOptions', {
    params: { question_id: questionId, _sort: 'sort_order', _order: 'asc' }
  }).then(res => (res.data || []).filter(o => !o.deleted))
}

/**
 * 批量获取多个题目的选项
 */
export async function getEvaluationQuestionOptions(questionIds) {
  const result = {}
  for (const qid of questionIds) {
    result[qid] = await getEvaluationQuestionOptionsApi(qid)
  }
  return result
}

/**
 * 获取评价提交记录列表
 */
export function getEvaluationSubmissionsApi(tenantId, evaluatorUserId) {
  return request.get('/evaluationSubmissions', {
    params: { tenant_id: tenantId, evaluator_user_id: evaluatorUserId }
  }).then(res => (res.data || []).filter(s => !s.deleted))
}

/**
 * 获取单条评价提交记录
 */
export function getEvaluationSubmissionApi(id) {
  return request.get(`/evaluationSubmissions/${id}`).then(res => res.data)
}

/**
 * 按任务查找当前用户的 submission
 */
export function getSubmissionByTask({ formId, userId, tenantId }) {
  return request.get('/evaluationSubmissions', {
    params: { tenant_id: tenantId, evaluator_user_id: userId, form_id: formId }
  }).then(res => {
    const list = (res.data || []).filter(s => !s.deleted)
    // 取最新的一条（按 created_at 降序）
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return list[0] || null
  })
}

/**
 * 获取提交的答案
 */
export function getSubmissionAnswers(submissionId, context) {
  return request.get('/evaluationAnswers', {
    params: { tenant_id: context.tenantId, submission_id: submissionId }
  }).then(res => (res.data || []).filter(a => !a.deleted))
}

/**
 * 获取提交的评分
 */
export function getSubmissionScores(submissionId, context) {
  return request.get('/evaluationScores', {
    params: { tenant_id: context.tenantId, submission_id: submissionId }
  }).then(res => (res.data || []).filter(s => !s.deleted))
}

/**
 * 获取提交的附件
 */
export function getSubmissionAttachments(submissionId, context) {
  return request.get('/evaluationAttachments', {
    params: { tenant_id: context.tenantId, submission_id: submissionId }
  }).then(res => (res.data || []).filter(a => !a.deleted))
}

// ==================== 写入 ====================

/**
 * 创建评价提交
 */
export function createEvaluationSubmissionApi(data) {
  return request.post('/evaluationSubmissions', data).then(res => res.data)
}

/**
 * 更新评价提交（PATCH 部分更新）
 */
export function updateEvaluationSubmissionApi(id, data) {
  return request.patch(`/evaluationSubmissions/${id}`, data).then(res => res.data)
}

/**
 * 创建答案
 */
export function createEvaluationAnswerApi(data) {
  return request.post('/evaluationAnswers', data).then(res => res.data)
}

/**
 * 创建评分
 */
export function createEvaluationScoreApi(data) {
  return request.post('/evaluationScores', data).then(res => res.data)
}

/**
 * 创建附件
 */
export function createEvaluationAttachmentApi(data) {
  return request.post('/evaluationAttachments', data).then(res => res.data)
}

/**
 * 软删除答案（PATCH deleted=true）
 */
export function softDeleteAnswerApi(id) {
  return request.patch(`/evaluationAnswers/${id}`, { deleted: true }).then(res => res.data)
}

/**
 * 软删除评分
 */
export function softDeleteScoreApi(id) {
  return request.patch(`/evaluationScores/${id}`, { deleted: true }).then(res => res.data)
}

/**
 * 软删除附件
 */
export function softDeleteAttachmentApi(id) {
  return request.patch(`/evaluationAttachments/${id}`, { deleted: true }).then(res => res.data)
}

// ==================== 答案/评分/附件 更新（覆盖式） ====================

/**
 * 更新提交的答案：软删除旧答案 → 写入新答案
 */
export async function updateSubmissionAnswers(submissionId, answers, context) {
  // 1. 查询旧答案并软删除
  const oldAnswers = await getSubmissionAnswers(submissionId, context)
  for (const old of oldAnswers) {
    await softDeleteAnswerApi(old.id)
  }
  // 2. 写入新答案
  const now = new Date().toISOString()
  const created = []
  for (const ans of answers) {
    if (ans.answer_value === null || ans.answer_value === undefined || ans.answer_value === '') continue
    const record = {
      tenant_id: context.tenantId,
      school_id: context.schoolId,
      submission_id: submissionId,
      question_id: ans.question_id,
      answer_value: ans.answer_value,
      created_at: now,
      updated_at: now,
      deleted: false,
    }
    const r = await createEvaluationAnswerApi(record)
    created.push(r)
  }
  return created
}

/**
 * 更新提交的评分：软删除旧评分 → 写入新评分
 */
export async function updateSubmissionScores(submissionId, scores, context) {
  const oldScores = await getSubmissionScores(submissionId, context)
  for (const old of oldScores) {
    await softDeleteScoreApi(old.id)
  }
  const now = new Date().toISOString()
  const created = []
  for (const sc of scores) {
    if (sc.score === null || sc.score === undefined) continue
    const record = {
      tenant_id: context.tenantId,
      school_id: context.schoolId,
      submission_id: submissionId,
      question_id: sc.question_id,
      score: sc.score,
      created_at: now,
      updated_at: now,
      deleted: false,
    }
    const r = await createEvaluationScoreApi(record)
    created.push(r)
  }
  return created
}

/**
 * 更新提交的附件：软删除旧附件 → 写入新附件
 */
export async function updateSubmissionAttachments(submissionId, attachments, context) {
  const oldAttachments = await getSubmissionAttachments(submissionId, context)
  for (const old of oldAttachments) {
    await softDeleteAttachmentApi(old.id)
  }
  const now = new Date().toISOString()
  const created = []
  for (const att of attachments) {
    const record = {
      tenant_id: context.tenantId,
      school_id: context.schoolId,
      submission_id: submissionId,
      question_id: att.question_id || null,
      file_id: att.file_id,
      created_at: now,
      updated_at: now,
      deleted: false,
    }
    const r = await createEvaluationAttachmentApi(record)
    created.push(r)
  }
  return created
}

// ==================== 草稿 / 提交 / 修改 ====================

/**
 * 保存草稿
 */
export async function saveEvaluationDraft(payload, context) {
  const now = new Date().toISOString()
  let submissionId = payload.submissionId

  if (submissionId) {
    // 更新已有草稿
    await updateEvaluationSubmissionApi(submissionId, {
      updated_at: now,
    })
  } else {
    // 创建新草稿
    const newSub = await createEvaluationSubmissionApi({
      tenant_id: context.tenantId,
      school_id: context.schoolId,
      form_id: payload.formId,
      window_id: payload.windowId,
      evaluator_user_id: context.userId,
      target_type: payload.targetType,
      target_id: payload.targetId,
      overall_score: null,
      anonymous: false,
      submitted_at: null,
      modifiable_until: null,
      locked_at: null,
      status: 'draft',
      review_status: null,
      created_at: now,
      updated_at: now,
      deleted: false,
    })
    submissionId = newSub.id
  }

  // 覆盖答案/评分/附件
  await updateSubmissionAnswers(submissionId, payload.answers || [], context)
  await updateSubmissionScores(submissionId, payload.scores || [], context)
  await updateSubmissionAttachments(submissionId, payload.attachments || [], context)

  return { id: submissionId }
}

/**
 * 提交评价
 */
export async function submitEvaluation(payload, context) {
  const now = new Date()
  const nowStr = now.toISOString()
  const modifiableHours = payload.modifiableHours || 24
  const modifiableUntil = new Date(now.getTime() + modifiableHours * 3600 * 1000).toISOString()
  let submissionId = payload.submissionId

  if (submissionId) {
    // 更新已有 submission（草稿→提交，或修改模式下的重新提交）
    await updateEvaluationSubmissionApi(submissionId, {
      status: 'submitted',
      submitted_at: payload.keepOriginalSubmitTime ? payload.originalSubmittedAt : nowStr,
      modifiable_until: payload.keepOriginalModifiableTime ? payload.originalModifiableUntil : modifiableUntil,
      locked_at: null,
      review_status: payload.reviewStatus || null,
      updated_at: nowStr,
    })
  } else {
    // 创建新 submission
    const newSub = await createEvaluationSubmissionApi({
      tenant_id: context.tenantId,
      school_id: context.schoolId,
      form_id: payload.formId,
      window_id: payload.windowId,
      evaluator_user_id: context.userId,
      target_type: payload.targetType,
      target_id: payload.targetId,
      overall_score: null,
      anonymous: false,
      submitted_at: nowStr,
      modifiable_until: modifiableUntil,
      locked_at: null,
      status: 'submitted',
      review_status: payload.reviewStatus || null,
      created_at: nowStr,
      updated_at: nowStr,
      deleted: false,
    })
    submissionId = newSub.id
  }

  // 覆盖答案/评分/附件
  await updateSubmissionAnswers(submissionId, payload.answers || [], context)
  await updateSubmissionScores(submissionId, payload.scores || [], context)
  await updateSubmissionAttachments(submissionId, payload.attachments || [], context)

  return { id: submissionId }
}

/**
 * 修改评价（提交修改）— 不新建 submission，只更新答案
 */
export async function updateEvaluationSubmission(submissionId, payload, context) {
  const now = new Date().toISOString()

  // 只更新 updated_at
  await updateEvaluationSubmissionApi(submissionId, {
    updated_at: now,
    review_status: payload.reviewStatus !== undefined ? payload.reviewStatus : undefined,
  })

  // 覆盖答案/评分/附件
  await updateSubmissionAnswers(submissionId, payload.answers || [], context)
  await updateSubmissionScores(submissionId, payload.scores || [], context)
  await updateSubmissionAttachments(submissionId, payload.attachments || [], context)

  return { id: submissionId }
}

// ==================== 聚合方法 ====================

/**
 * 获取评价提交页全部数据（聚合）
 */
export async function getEvaluationSubmitPageData(taskId, context) {
  const formId = Number(taskId)

  // 1. 并行加载基础数据
  const [form, windows, questions, submission] = await Promise.all([
    getEvaluationFormById(formId),
    getEvaluationWindowsApi(context.tenantId),
    getEvaluationQuestions(formId, context),
    getSubmissionByTask({ formId, userId: context.userId, tenantId: context.tenantId }),
  ])

  if (!form) return null

  // 2. 找到对应的窗口
  const win = windows.find(w => w.form_id === formId) || null

  // 3. 加载题目选项
  const selectQuestions = questions.filter(q => q.type === 'single' || q.type === 'multiple')
  const optionsMap = {}
  await Promise.all(
    selectQuestions.map(async q => {
      optionsMap[q.id] = await getEvaluationQuestionOptionsApi(q.id)
    })
  )

  // 4. 判断模式
  const now = new Date()
  let mode = 'create'
  let readonly = false
  let readonlyReason = ''
  let answers = []
  let scores = []
  let attachments = []

  if (win) {
    const start = new Date(win.start_at)
    const end = new Date(win.end_at)

    if (submission && submission.status !== 'pending') {
      // 有有效 submission（pending 视为无效，走无 submission 逻辑）
      if (submission.locked_at) {
        mode = 'readonly'
        readonly = true
        readonlyReason = '评价已锁定，无法修改'
      } else if (submission.status === 'draft') {
        mode = 'draft'
        readonly = false
      } else if (submission.status === 'submitted') {
        if (now <= new Date(submission.modifiable_until)) {
          mode = 'edit'
          readonly = false
        } else {
          mode = 'readonly'
          readonly = true
          readonlyReason = '修改期限已过，评价已锁定'
        }
      } else {
        mode = 'readonly'
        readonly = true
        readonlyReason = '评价状态异常'
      }
    } else {
      // 无 submission
      if (now < start) {
        mode = 'not_started'
        readonly = true
        readonlyReason = '评价尚未开始'
      } else if (now > end) {
        mode = 'closed'
        readonly = true
        readonlyReason = '评价已截止，无法提交'
      } else {
        mode = 'create'
        readonly = false
      }
    }
  } else {
    // 无窗口
    readonly = true
    readonlyReason = '评价窗口不存在'
  }

  // 5. 加载历史答案/评分/附件
  if (submission && (mode === 'draft' || mode === 'edit' || mode === 'readonly')) {
    const [a, s, att] = await Promise.all([
      getSubmissionAnswers(submission.id, context),
      getSubmissionScores(submission.id, context),
      getSubmissionAttachments(submission.id, context),
    ])
    answers = a
    scores = s
    attachments = att
  }

  return {
    task: form,
    form,
    window: win,
    questions,
    options: optionsMap,
    submission,
    answers,
    scores,
    attachments,
    mode,
    readonly,
    readonlyReason,
  }
}

/**
 * 获取我的评价列表
 */
export async function getMyEvaluations(context, filters = {}) {
  const submissions = await getEvaluationSubmissionsApi(context.tenantId, context.userId)
  const now = new Date()

  // 获取关联的表单和窗口信息
  const formIds = [...new Set(submissions.map(s => s.form_id))]
  const forms = await Promise.all(formIds.map(id => getEvaluationFormById(id).catch(() => null)))
  const formMap = {}
  forms.forEach(f => { if (f) formMap[f.id] = f })

  const windows = await getEvaluationWindowsApi(context.tenantId)
  const winMap = {}
  windows.forEach(w => { winMap[w.form_id] = w })

  // 获取封面图片、课程、服务项目、组织单位等辅助信息
  const [files, courses, serviceItems, orgUnits] = await Promise.all([
    getFileResourcesApi(context.tenantId).catch(() => []),
    getCoursesApi(context.tenantId).catch(() => []),
    getServiceItemsApi(context.tenantId).catch(() => []),
    getTeachingOrgUnitsApi(context.tenantId).catch(() => []),
  ])
  const fileMap = {}; files.forEach(f => { fileMap[f.id] = f })
  const courseMap = {}; courses.forEach(c => { courseMap[c.id] = c })
  const serviceMap = {}; serviceItems.forEach(s => { serviceMap[s.id] = s })
  const orgMap = {}; orgUnits.forEach(o => { orgMap[o.id] = o })

  // 计算每条记录的状态
  const result = submissions.map(sub => {
    const form = formMap[sub.form_id] || {}
    const win = winMap[sub.form_id] || {}
    let displayStatus = sub.status
    let canEdit = false
    let canView = true

    if (sub.status === 'draft') {
      displayStatus = 'draft'
      canEdit = true
    } else if (sub.status === 'pending') {
      displayStatus = 'pending'
      canEdit = false
    } else if (sub.status === 'submitted') {
      if (sub.locked_at) {
        displayStatus = 'locked'
        canEdit = false
      } else if (sub.modifiable_until && now <= new Date(sub.modifiable_until)) {
        displayStatus = 'modifiable'
        canEdit = true
      } else {
        displayStatus = 'locked'
        canEdit = false
      }
    } else if (sub.status === 'locked') {
      displayStatus = 'locked'
      canEdit = false
    }

    // 解析封面图片
    let coverImg = ''
    if (form.cover_file_id && fileMap[form.cover_file_id]) {
      coverImg = fileMap[form.cover_file_id].url
    }

    // 解析评价对象和部门
    let targetName = ''
    let deptName = ''
    if (form.type === 'teaching' && form.course_id) {
      const course = courseMap[form.course_id]
      targetName = course ? course.course_name : ''
      const org = course ? orgMap[course.teaching_org_id] : null
      deptName = org ? org.name : '教务处'
    } else if (form.service_item_id) {
      const si = serviceMap[form.service_item_id]
      targetName = si ? si.name : ''
      const org = si ? orgMap[si.service_org_id] : null
      deptName = org ? org.name : '后勤管理处'
    }

    return {
      ...sub,
      form_title: form.title || `评价表单 #${sub.form_id}`,
      form_type: form.type || 'service',
      window: win,
      display_status: displayStatus,
      can_edit: canEdit,
      can_view: canView,
      cover_img: coverImg,
      target_name: targetName,
      dept_name: deptName,
    }
  })

  // 按 form_id 去重：同一表单只保留最新一条 submission
  const deduped = []
  const formIdSeen = {}
  // 先按 created_at 降序排列，确保最新的在前
  result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  for (const r of result) {
    if (!formIdSeen[r.form_id]) {
      formIdSeen[r.form_id] = true
      deduped.push(r)
    }
  }

  // 按 filters 过滤
  let filtered = deduped
  if (filters.status) {
    filtered = filtered.filter(r => r.display_status === filters.status)
  }

  // 按 updated_at 降序
  filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))

  return filtered
}

// ==================== 辅助资源读取 ====================

/**
 * 获取课程列表
 */
export function getCoursesApi(tenantId) {
  return request.get('/courses', { params: { tenant_id: tenantId } })
    .then(res => res.data || [])
}

/**
 * 获取课程选课记录
 */
export function getCourseEnrollmentsApi(tenantId, studentId) {
  return request.get('/courseEnrollments', {
    params: { tenant_id: tenantId, student_id: studentId }
  }).then(res => res.data || [])
}

/**
 * 获取服务项目列表
 */
export function getServiceItemsApi(tenantId) {
  return request.get('/serviceItems', { params: { tenant_id: tenantId } })
    .then(res => res.data || [])
}

/**
 * 获取教学组织单位
 */
export function getTeachingOrgUnitsApi(tenantId) {
  return request.get('/teachingOrgUnits', { params: { tenant_id: tenantId } })
    .then(res => res.data || [])
}

/**
 * 获取文件资源
 */
export function getFileResourcesApi(tenantId) {
  return request.get('/fileResources', { params: { tenant_id: tenantId } })
    .then(res => res.data || [])
}

/**
 * 获取首页概览统计
 */
export function getDashboardOverviewApi(userId, tenantId) {
  return request.get('/dashboard/overview', { params: { user_id: userId, tenant_id: tenantId } })
    .then(res => res.data)
}

// 兼容旧导出
export { getEvaluationQuestions as getEvaluationQuestionsApi }
