import request from '@/request'
import { dataOf, listOf } from '@/api/backend'

function normalizeForm(form = {}) {
  return {
    ...form,
    form_type: form.formType || form.form_type || form.type,
    target_type: form.targetType || form.target_type,
    target_id: form.targetId || form.target_id,
    cover_file_id: form.coverFileId || form.cover_file_id,
    anonymous: form.anonymousEnabled ?? form.anonymous,
    score_enabled: form.scoreEnabled ?? form.score_enabled,
    created_at: form.createdAt || form.created_at,
    updated_at: form.updatedAt || form.updated_at,
  }
}

function normalizeQuestion(question = {}) {
  return {
    ...question,
    type: question.questionType || question.type,
    question_type: question.questionType || question.type,
    max_score: question.maxScore || question.max_score,
    sort_order: question.sortOrder || question.sort_order,
    options: question.options || [],
  }
}

function normalizeWindow(window = {}, formId = null) {
  return {
    ...window,
    form_id: window.formId || window.form_id || formId,
    start_at: window.startAt || window.start_at || window.startTime,
    end_at: window.endAt || window.end_at || window.endTime,
    start_time: window.startTime || window.start_at || window.startAt,
    end_time: window.endTime || window.end_at || window.endAt,
  }
}

export function getStudentEvaluationTasksApi() {
  return request.get('/evaluation/student/tasks').then(dataOf)
}

export function getEvaluationTaskById(taskId) {
  return request.get(`/evaluation/forms/${taskId}`).then(dataOf).then(normalizeForm)
}
export const getEvaluationFormById = getEvaluationTaskById

export function getEvaluationWindowById(formId) {
  return request.get(`/evaluation/forms/${formId}/window`).then(dataOf).then((data) => normalizeWindow(data, formId))
}

export async function getEvaluationWindowsApi(tenantId) {
  const forms = await getEvaluationFormsApi(tenantId)
  const windows = await Promise.all(
    forms.map((form) => request.get(`/evaluation/forms/${form.id}/window`).then(dataOf).then((data) => normalizeWindow(data, form.id)))
  )
  return windows.filter(Boolean)
}

export function getEvaluationFormsApi() {
  return request.get('/evaluation/forms', { params: { page: 1, pageSize: 500 } })
    .then(listOf)
    .then((list) => list.map(normalizeForm))
}

export function getEvaluationFormApi(id) {
  return request.get(`/evaluation/forms/${id}`).then(dataOf).then(normalizeForm)
}

export function getEvaluationQuestions(formId) {
  return request.get(`/evaluation/forms/${formId}/questions`)
    .then(dataOf)
    .then((list) => (list || []).map(normalizeQuestion))
}

export async function getEvaluationQuestionOptionsApi(questionId, formId = null) {
  if (!formId) return []
  const questions = await getEvaluationQuestions(formId)
  return questions.find((q) => Number(q.id) === Number(questionId))?.options || []
}

export async function getEvaluationQuestionOptions(questionIds, formId = null) {
  if (!formId) return Object.fromEntries(questionIds.map((id) => [id, []]))
  const questions = await getEvaluationQuestions(formId)
  return Object.fromEntries(
    questionIds.map((id) => [id, questions.find((q) => Number(q.id) === Number(id))?.options || []])
  )
}

export function getEvaluationSubmissionsApi() {
  return request.get('/evaluation/student/submissions/my').then(dataOf)
}

export async function getEvaluationSubmissionApi(id) {
  const list = await getEvaluationSubmissionsApi()
  return list.find((item) => Number(item.id) === Number(id)) || null
}

export async function getSubmissionByTask({ formId }) {
  const list = await getEvaluationSubmissionsApi()
  return list.find((item) => Number(item.form_id || item.formId) === Number(formId)) || null
}

export async function getSubmissionAnswers(submissionId) {
  const submission = await getEvaluationSubmissionApi(submissionId)
  return submission?.answers || []
}

export async function getSubmissionScores(submissionId) {
  const submission = await getEvaluationSubmissionApi(submissionId)
  return submission?.scores || []
}

export async function getSubmissionAttachments(submissionId) {
  const submission = await getEvaluationSubmissionApi(submissionId)
  return submission?.attachments || []
}

export function createEvaluationSubmissionApi(data) {
  return request.post('/evaluation/student/submissions/draft', data).then(dataOf)
}

export function updateEvaluationSubmissionApi(id, data) {
  return request.put(`/evaluation/student/submissions/${id}`, data).then(dataOf)
}

export function createEvaluationAnswerApi(data) {
  return request.post('/evaluation/student/submissions/draft', {
    formId: data.form_id || data.formId,
    answers: [data],
  }).then(dataOf)
}

export function createEvaluationScoreApi(data) {
  return request.post('/evaluation/student/submissions/draft', {
    formId: data.form_id || data.formId,
    scores: [data],
  }).then(dataOf)
}

export function createEvaluationAttachmentApi(data) {
  return request.post('/evaluation/student/submissions/draft', {
    formId: data.form_id || data.formId,
    attachments: [data],
  }).then(dataOf)
}

export async function softDeleteAnswerApi() {
  return { success: true }
}

export async function softDeleteScoreApi() {
  return { success: true }
}

export async function softDeleteAttachmentApi() {
  return { success: true }
}

export async function updateSubmissionAnswers(submissionId, answers) {
  return request.put(`/evaluation/student/submissions/${submissionId}`, { answers }).then(dataOf)
}

export async function updateSubmissionScores(submissionId, scores) {
  return request.put(`/evaluation/student/submissions/${submissionId}`, { scores }).then(dataOf)
}

export async function updateSubmissionAttachments(submissionId, attachments) {
  return request.put(`/evaluation/student/submissions/${submissionId}`, { attachments }).then(dataOf)
}

export function saveEvaluationDraft(payload) {
  return request.post('/evaluation/student/submissions/draft', payload).then(dataOf)
}

export function submitEvaluation(payload) {
  return request.post('/evaluation/student/submissions/submit', payload).then(dataOf)
}

export function updateEvaluationSubmission(submissionId, payload) {
  return request.put(`/evaluation/student/submissions/${submissionId}`, payload).then(dataOf)
}

export function getEvaluationSubmitPageData(taskId) {
  return request.get(`/evaluation/student/forms/${taskId}/submit-page`).then(dataOf)
}

export async function getMyEvaluations(context, filters = {}) {
  let list = await request.get('/evaluation/student/submissions/my').then(dataOf)
  if (filters.status) list = list.filter((item) => item.display_status === filters.status)
  return list
}

export function getCoursesApi() {
  return request.get('/evaluation/student/courses').then(dataOf)
}

export function getCourseEnrollmentsApi() {
  return request.get('/evaluation/student/course-enrollments').then(dataOf)
}

export function getServiceItemsApi() {
  return request.get('/evaluation/student/service-items').then(dataOf)
}

export function getTeachingOrgUnitsApi() {
  return request.get('/evaluation/student/teaching-orgs').then(dataOf)
}

export function getFileResourcesApi() {
  return request.get('/files', { params: { page: 1, pageSize: 100 } }).then(dataOf)
}

export function getDashboardOverviewApi() {
  return request.get('/evaluation/student/tasks').then(dataOf).then((tasks) => ({
    pendingCount: (tasks || []).filter((item) => item.status !== 'submitted').length,
    totalCount: (tasks || []).length,
  }))
}

export { getEvaluationQuestions as getEvaluationQuestionsApi }
