import request from '@/request'
import { dataOf, getPage, listOf } from '@/api/backend'

export const formTypeMap = {
  teaching: '教学评价',
  service: '服务评价',
  instant: '即时评价',
}

export const formStatusMap = {
  draft: '草稿',
  pending: '待审核',
  pending_review: '待审核',
  published: '已发布',
  rejected: '已驳回',
  closed: '已关闭',
}

export const windowStatusMap = {
  scheduled: '待开放',
  active: '开放中',
  open: '开放中',
  ended: '已结束',
  closed: '已关闭',
}

export const publishScopeMap = {
  all_students: '全体学生',
  all_staff: '全体教职工',
  enrolled_students: '选课学生',
  specified_class: '指定班级',
  specified_org: '指定组织',
}

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
    _options: (question.options || []).map((option) => ({
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
    start_time: window.startTime || window.start_at,
    end_time: window.endTime || window.end_at,
  }
}

function normalizeForm(form = {}) {
  const backendType = form.formType || form.form_type || form.type
  const backendStatus = form.status === 'pending' ? 'pending_review' : form.status
  const type = backendType === 'course_evaluation' ? 'teaching'
    : backendType === 'service_evaluation' ? 'service'
      : backendType
  const window = normalizeWindow(form.window || form._window, form.id)
  const questions = (form.questions || form._questions || []).map(normalizeQuestion)
  const audits = form.auditRecords || form._audits || []
  return {
    ...form,
    type,
    form_type: type,
    formType: backendType,
    status: backendStatus,
    status_code: form.status,
    target_type: form.targetType || form.target_type,
    target_id: form.targetId || form.target_id,
    target_name: form.targetName || form.target_name || '',
    cover_file_id: form.coverFileId ?? form.cover_file_id,
    anonymous: form.anonymousEnabled ?? form.anonymous,
    score_enabled: form.scoreEnabled ?? form.score_enabled,
    created_at: form.createdAt || form.created_at,
    updated_at: form.updatedAt || form.updated_at,
    publisher_id: form.creatorId ?? form.publisher_id,
    _target_name: form.targetName || form.target_name || '',
    _question_count: form.questionCount ?? questions.length,
    _window: window,
    _windows: window ? [window] : [],
    _audits: audits,
    _audit: audits[0] || null,
    _cover_url: form.coverUrl || form._cover_url || '',
    questions,
    auditRecords: audits,
  }
}

function formPayload(payload = {}) {
  const type = payload.type || payload.form_type || payload.formType
  const targetType = payload.targetType || payload.target_type
    || (payload.course_id || payload.courseId ? 'course' : 'service_item')
  const targetId = payload.targetId || payload.target_id
    || payload.course_id || payload.courseId
    || payload.service_item_id || payload.serviceItemId
  return {
    title: payload.title,
    description: payload.description || '',
    formType: formTypeCode(type),
    targetType,
    targetId: Number(targetId),
    coverFileId: payload.coverFileId ?? payload.cover_file_id ?? null,
    anonymousEnabled: payload.anonymousEnabled ?? payload.anonymous ?? true,
    scoreEnabled: payload.scoreEnabled ?? payload.score_enabled ?? false,
  }
}

async function findAuditByForm(formId) {
  const page = await getPage(request, '/evaluation/audits', {
    status: 'pending',
    page: 1,
    pageSize: 500,
  })
  return page.records.find((item) => Number(item.formId ?? item.form_id) === Number(formId))
}

export async function getSchoolFormListApi(_context, filters = {}) {
  const page = await getPage(request, '/evaluation/forms', {
    keyword: filters.keyword,
    status: filters.status === 'pending_review' ? 'pending' : filters.status,
    formType: filters.type ? formTypeCode(filters.type) : undefined,
    targetType: filters.targetType,
    page: filters.page || 1,
    pageSize: filters.pageSize || 10,
  })
  const list = page.records.map(normalizeForm)
  return { list, total: page.total, page: page.pageNum, pageSize: page.pageSize }
}

export async function getSchoolFormStatsApi() {
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

export async function getSchoolFormDetailApi(_context, formId) {
  return normalizeForm(dataOf(await request.get(`/evaluation/forms/${formId}`)))
}

export async function getSchoolPendingAuditsApi() {
  const page = await getPage(request, '/evaluation/audits', {
    status: 'pending',
    page: 1,
    pageSize: 500,
  })
  return page.records.map((item) => ({
    ...item,
    form_id: item.formId || item.form_id,
    form_title: item.formTitle || item.form_title,
    submitter_name: item.submitterName || item.submitter_name,
    requested_at: item.requestedAt || item.requested_at,
    status_code: item.status,
  }))
}

export async function approveFormPublishApi(_context, formId) {
  const audit = await findAuditByForm(formId)
  if (!audit) throw new Error('未找到待审核记录')
  await request.post(`/evaluation/audits/${audit.id}/approve`)
  return { success: true }
}

export async function rejectFormPublishApi(_context, formId, reviewComment) {
  const audit = await findAuditByForm(formId)
  if (!audit) throw new Error('未找到待审核记录')
  await request.post(`/evaluation/audits/${audit.id}/reject`, {
    reason: reviewComment || '审核未通过',
  })
  return { success: true }
}

export async function closeFormApi(_context, formId) {
  await request.post(`/evaluation/forms/${formId}/close`)
  return { success: true }
}

export async function deleteSchoolFormApi(_context, formId) {
  await request.delete(`/evaluation/forms/${formId}`)
  return { success: true }
}

export async function getSchoolFormWindowsApi(_context, formId) {
  try {
    const window = normalizeWindow(dataOf(await request.get(`/evaluation/forms/${formId}/window`)), formId)
    return window ? [window] : []
  } catch (error) {
    if (error?.response?.status === 404) return []
    throw error
  }
}

export async function createSchoolFormWindowApi(_context, payload) {
  return request.put(`/evaluation/forms/${payload.form_id || payload.formId}/window`, {
    startTime: payload.startTime || payload.start_at,
    endTime: payload.endTime || payload.end_at,
    description: payload.description || '',
  }).then(dataOf)
}

export async function updateSchoolFormWindowApi(_context, windowId, payload) {
  const formId = payload.form_id || payload.formId
  if (!formId) throw new Error('缺少评价表单ID')
  return createSchoolFormWindowApi(_context, { ...payload, form_id: formId })
}

export async function closeSchoolFormWindowApi(_context, windowId) {
  const formId = _context?.formId || _context?.form_id
  if (!formId) throw new Error('缺少评价表单ID')
  await request.post(`/evaluation/forms/${formId}/window/close`)
  return { success: true, windowId }
}

export async function getSchoolFormQuestionsApi(_context, formId) {
  const questions = dataOf(await request.get(`/evaluation/forms/${formId}/questions`)) || []
  return questions.map(normalizeQuestion)
}

export async function getSchoolServiceItemOptionsApi() {
  return listOf(await request.get('/school/service-items/options'))
}

export async function getSchoolCourseOptionsApi() {
  return listOf(await request.get('/school/courses/options'))
}

export async function getSchoolOrgUnitOptionsApi() {
  const [teaching, service] = await Promise.all([
    dataOf(await request.get('/school/teaching-orgs/tree')),
    dataOf(await request.get('/school/service-orgs/tree')),
  ])
  return { teachingOrgs: teaching || [], serviceOrgs: service || [] }
}
