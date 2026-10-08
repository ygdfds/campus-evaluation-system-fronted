import request from '@/request'
import { unwrap } from '@/request'

function dataOf(res) {
  return res && typeof res === 'object' && 'data' in res ? res.data : res
}

export function getStudentEvaluationTasksApi() {
  return request.get('/evaluation/student/tasks').then(dataOf)
}

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
  return request.post('/evaluationSubmissions', data).then(unwrap)
}

/**
 * 更新评价提交（PATCH 部分更新）
 */
export function updateEvaluationSubmissionApi(id, data) {
  return request.patch(`/evaluationSubmissions/${id}`, data).then(unwrap)
}

/**
 * 创建答案
 */
export function createEvaluationAnswerApi(data) {
  return request.post('/evaluationAnswers', data).then(unwrap)
}

/**
 * 创建评分
 */
export function createEvaluationScoreApi(data) {
  return request.post('/evaluationScores', data).then(unwrap)
}

/**
 * 创建附件
 */
export function createEvaluationAttachmentApi(data) {
  return request.post('/evaluationAttachments', data).then(unwrap)
}

/**
 * 软删除答案（PATCH deleted=true）
 */
export function softDeleteAnswerApi(id) {
  return request.patch(`/evaluationAnswers/${id}`, { deleted: true }).then(unwrap)
}

/**
 * 软删除评分
 */
export function softDeleteScoreApi(id) {
  return request.patch(`/evaluationScores/${id}`, { deleted: true }).then(unwrap)
}

/**
 * 软删除附件
 */
export function softDeleteAttachmentApi(id) {
  return request.patch(`/evaluationAttachments/${id}`, { deleted: true }).then(unwrap)
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
  return request.post('/evaluation/student/submissions/draft', payload).then(dataOf)
}

/**
 * 提交评价
 */
export async function submitEvaluation(payload, context) {
  return request.post('/evaluation/student/submissions/submit', payload).then(dataOf)
}

/**
 * 修改评价（提交修改）— 不新建 submission，只更新答案
 */
export async function updateEvaluationSubmission(submissionId, payload, context) {
  return request.put(`/evaluation/student/submissions/${submissionId}`, payload).then(dataOf)
}

// ==================== 聚合方法 ====================

/**
 * 获取评价提交页全部数据（聚合）
 */
export async function getEvaluationSubmitPageData(taskId, context) {
  return request.get(`/evaluation/student/forms/${taskId}/submit-page`).then(dataOf)
}

/**
 * 获取我的评价列表
 */
export async function getMyEvaluations(context, filters = {}) {
  let list = await request.get('/evaluation/student/submissions/my').then(dataOf)
  if (filters.status) list = list.filter(item => item.display_status === filters.status)
  return list
}

// ==================== 杈呭姪璧勬簮璇诲彇 ====================

/**
 * 鑾峰彇璇剧▼鍒楄〃
 */

export function getCoursesApi(tenantId) {
  return request.get('/evaluation/student/courses').then(dataOf)
}

export function getCourseEnrollmentsApi(tenantId, studentId) {
  return request.get('/evaluation/student/course-enrollments').then(dataOf)
}

export function getServiceItemsApi(tenantId) {
  return request.get('/evaluation/student/service-items').then(dataOf)
}

export function getTeachingOrgUnitsApi(tenantId) {
  return request.get('/evaluation/student/teaching-orgs').then(dataOf)
}

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
