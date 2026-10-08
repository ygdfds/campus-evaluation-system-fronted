import request from '@/request'
import { dataOf, getPage } from '@/api/backend'

function formTypeCode(value) {
  if (value === 'teaching') return 'course_evaluation'
  if (value === 'service' || value === 'instant') return 'service_evaluation'
  return value
}

function normalizeQuestion(question = {}) {
  return {
    ...question,
    type: question.questionType || question.question_type || question.type,
    question_type: question.questionType || question.question_type || question.type,
    max_score: question.maxScore ?? question.max_score,
    sort_order: question.sortOrder ?? question.sort_order,
    _options: (question.options || question._options || []).map((option) => ({
      ...option,
      option_text: option.optionText || option.option_text || option.label || '',
      text: option.label || option.optionText || option.option_text || '',
    })),
  }
}

function normalizeWindow(window, formId) {
  if (!window) return null
  return {
    ...window,
    form_id: formId,
    start_at: window.startTime || window.start_at,
    end_at: window.endTime || window.end_at,
  }
}

function normalizeForm(form = {}) {
  const backendType = form.formType || form.form_type || form.type
  const type = backendType === 'course_evaluation' ? 'teaching'
    : backendType === 'service_evaluation' ? 'service'
      : backendType
  const questions = (form.questions || form._questions || []).map(normalizeQuestion)
  const audits = form.auditRecords || form._audits || []
  const window = normalizeWindow(form.window || form._window, form.id)
  return {
    ...form,
    type,
    form_type: type,
    formType: backendType,
    target_type: form.targetType || form.target_type,
    target_id: form.targetId || form.target_id,
    cover_file_id: form.coverFileId ?? form.cover_file_id,
    anonymous: form.anonymousEnabled ?? form.anonymous,
    score_enabled: form.scoreEnabled ?? form.score_enabled,
    created_at: form.createdAt || form.created_at,
    updated_at: form.updatedAt || form.updated_at,
    _target_name: form.targetName || form.target_name || '',
    _question_count: form.questionCount ?? questions.length,
    _window: window,
    _windows: window ? [window] : [],
    _audit: audits[0] || null,
    _audits: audits,
    _cover_url: form.coverUrl || '',
    questions,
  }
}

function formPayload(payload = {}) {
  const targetType = payload.targetType || payload.target_type
    || (payload.course_id || payload.courseId ? 'course' : 'service_item')
  const targetId = payload.targetId || payload.target_id
    || payload.course_id || payload.courseId
    || payload.service_item_id || payload.serviceItemId
  return {
    title: payload.title,
    description: payload.description || '',
    formType: formTypeCode(payload.type || payload.form_type || payload.formType),
    targetType,
    targetId: Number(targetId),
    coverFileId: payload.coverFileId ?? payload.cover_file_id ?? null,
    anonymousEnabled: payload.anonymousEnabled ?? payload.anonymous ?? true,
    scoreEnabled: payload.scoreEnabled ?? payload.score_enabled ?? false,
  }
}

function questionPayload(question, index) {
  return {
    title: question.title,
    questionType: question.questionType || question.question_type || question.type,
    required: question.required ?? true,
    sortOrder: question.sortOrder ?? question.sort_order ?? index + 1,
    maxScore: question.maxScore ?? question.max_score ?? null,
    options: (question.options || question._options || []).map((option, optionIndex) => ({
      label: option.label || option.optionText || option.option_text || option.text,
      sortOrder: option.sortOrder ?? option.sort_order ?? optionIndex + 1,
    })),
  }
}

export async function getStaffEvalFormsApi(_context, filters = {}) {
  const page = await getPage(request, '/evaluation/forms', {
    keyword: filters.keyword,
    status: filters.status === 'pending_review' ? 'pending' : filters.status,
    formType: filters.type ? formTypeCode(filters.type) : undefined,
    targetType: filters.targetType,
    page: filters.page || 1,
    pageSize: filters.pageSize || 10,
  })
  return {
    list: page.records.map(normalizeForm),
    total: page.total,
    page: page.pageNum,
    pageSize: page.pageSize,
  }
}

export async function getStaffEvalFormStatsApi() {
  const page = await getPage(request, '/evaluation/forms', { page: 1, pageSize: 500 })
  const forms = page.records.map(normalizeForm)
  return {
    draft: forms.filter((item) => item.status === 'draft').length,
    pending_review: forms.filter((item) => ['pending', 'pending_review'].includes(item.status)).length,
    published: forms.filter((item) => item.status === 'published').length,
    rejected: forms.filter((item) => item.status === 'rejected').length,
    closed: forms.filter((item) => item.status === 'closed').length,
    total: forms.length,
  }
}

export async function getEvalFormDetailApi(_context, formId) {
  return normalizeForm(dataOf(await request.get(`/evaluation/forms/${formId}`)))
}

export async function getEvalQuestionsByFormApi(_context, formId) {
  const questions = dataOf(await request.get(`/evaluation/forms/${formId}/questions`)) || []
  return questions.map(normalizeQuestion)
}

export async function createEvalFormDraftApi(_context, payload) {
  return request.post('/evaluation/forms', formPayload(payload)).then(dataOf).then(normalizeForm)
}

export async function updateEvalFormApi(_context, formId, payload) {
  return request.put(`/evaluation/forms/${formId}`, formPayload(payload)).then(dataOf).then(normalizeForm)
}

export async function deleteDraftEvalFormApi(_context, formId) {
  return request.delete(`/evaluation/forms/${formId}`).then(dataOf)
}

export async function saveEvalQuestionsApi(_context, formId, questions) {
  return request.put(`/evaluation/forms/${formId}/questions`, {
    questions: questions.map(questionPayload),
  }).then(dataOf)
}

export async function createEvalWindowApi(_context, payload) {
  return request.put(`/evaluation/forms/${payload.form_id || payload.formId}/window`, {
    startTime: payload.startTime || payload.start_at,
    endTime: payload.endTime || payload.end_at,
    description: payload.description || '',
  }).then(dataOf)
}

export async function updateEvalWindowApi(_context, _windowId, payload) {
  const formId = payload.form_id || payload.formId
  if (!formId) throw new Error('缺少评价表单ID')
  return createEvalWindowApi(_context, { ...payload, form_id: formId })
}

export async function submitFormForAuditApi(_context, formId) {
  return request.post(`/evaluation/forms/${formId}/submit-audit`).then(dataOf)
}

export async function getFormAuditApi(_context, formId) {
  const page = await getPage(request, '/evaluation/audits', {
    page: 1,
    pageSize: 500,
  })
  return page.records
    .filter((item) => Number(item.formId ?? item.form_id) === Number(formId))
    .sort((a, b) => new Date(b.requestedAt || b.requested_at) - new Date(a.requestedAt || a.requested_at))
}

export async function getPublishTargetOptionsApi() {
  const ctx = dataOf(await request.get('/stats/staff/reports/context')) || {}
  return {
    serviceItems: ctx.serviceItems || [],
    courses: ctx.courses || [],
    serviceOrgs: ctx.serviceOrgs || [],
    teachingOrgs: ctx.teachingOrgs || [],
    courseTeachers: ctx.courseTeachers || [],
  }
}

export async function withdrawAuditApi(_context, formId) {
  await request.post(`/evaluation/forms/${formId}/withdraw-audit`)
  return { success: true }
}

export async function getEvalFormDataApi(_context, formId) {
  const ctx = dataOf(await request.get('/stats/staff/reports/context')) || {}
  const submissions = (ctx.submissions || []).filter((item) => Number(item.form_id || item.formId) === Number(formId))
  const questions = (ctx.questions || []).filter((item) => Number(item.form_id || item.formId) === Number(formId))
  const scores = ctx.scores || []
  const submissionIds = new Set(submissions.map((item) => item.id))
  const relatedScores = scores.filter((item) => submissionIds.has(item.submission_id))
  const avgScore = relatedScores.length
    ? Number((relatedScores.reduce((sum, item) => sum + Number(item.score || 0), 0) / relatedScores.length).toFixed(2))
    : 0
  const scoreDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  relatedScores.forEach((item) => {
    const score = Math.round(Number(item.score || 0))
    if (score >= 1 && score <= 5) scoreDistribution[score] += 1
  })
  return {
    totalCount: submissions.length,
    avgScore,
    scoreDistribution,
    recentSubmissions: submissions.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)).slice(0, 10),
    questions: questions.map(normalizeQuestion),
  }
}
