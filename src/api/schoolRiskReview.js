import request from '@/request'
import { unwrap } from '@/request'

// ==================== 映射表 ====================

const riskTypeMap = {
  sensitive_words: '敏感词',
  extreme_low_score: '极端低分',
  abnormal_submission: '异常提交',
}

const riskLevelMap = {
  low: '低',
  medium: '中',
  high: '高',
}

const reviewStatusMap = {
  pending: '待复核',
  confirmed: '已确认',
  ignored: '已忽略',
}

// ==================== 公开 API ====================

/**
 * 获取风险评价复核列表
 */
export async function getSchoolRiskReviewListApi(tenantId, filters = {}) {
  const [tasksRes, formsRes, submissionsRes] = await Promise.all([
    request.get('/evaluationReviewTasks', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/evaluationForms', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/evaluationSubmissions', { params: { tenant_id: tenantId, deleted: false } }),
  ])

  let tasks = (tasksRes.data || []).filter(t => !t.deleted)
  const forms = (formsRes.data || []).filter(f => !f.deleted)
  const submissions = (submissionsRes.data || []).filter(s => !s.deleted)
  const formMap = {}
  forms.forEach(f => { formMap[f.id] = f })
  const subMap = {}
  submissions.forEach(s => { subMap[s.id] = s })

  // 风险类型筛选
  if (filters.risk_type && filters.risk_type !== 'all') {
    tasks = tasks.filter(t => t.risk_type === filters.risk_type)
  }
  // 风险等级筛选
  if (filters.risk_level && filters.risk_level !== 'all') {
    tasks = tasks.filter(t => t.risk_level === filters.risk_level)
  }
  // 状态筛选
  if (filters.status && filters.status !== 'all') {
    tasks = tasks.filter(t => t.status === filters.status)
  }
  // 搜索
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    tasks = tasks.filter(t => {
      const form = formMap[t.form_id] || {}
      return (
        (form.title || '').toLowerCase().includes(kw) ||
        (t.risk_description || '').toLowerCase().includes(kw) ||
        String(t.id).includes(kw)
      )
    })
  }

  tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return tasks.map(t => {
    const form = formMap[t.form_id] || {}
    const sub = subMap[t.submission_id] || {}
    return {
      id: t.id,
      form_name: form.title || form.name || '未命名表单',
      form_id: t.form_id,
      submission_id: t.submission_id,
      risk_type: riskTypeMap[t.risk_type] || t.risk_type,
      risk_type_code: t.risk_type,
      risk_level: riskLevelMap[t.risk_level] || t.risk_level,
      risk_level_code: t.risk_level,
      risk_description: t.risk_description || '',
      status: reviewStatusMap[t.status] || t.status,
      status_code: t.status,
      total_score: sub.total_score ?? null,
      reviewer_id: t.reviewer_id,
      reviewed_at: t.reviewed_at,
      review_comment: t.review_comment || '',
      created_at: t.created_at,
      updated_at: t.updated_at,
    }
  })
}

/**
 * 获取风险评价复核统计
 */
export async function getSchoolRiskReviewSummaryApi(tenantId) {
  const [tasksRes] = await Promise.all([
    request.get('/evaluationReviewTasks', { params: { tenant_id: tenantId, deleted: false } }),
  ])
  const tasks = (tasksRes.data || []).filter(t => !t.deleted)
  return {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    confirmed: tasks.filter(t => t.status === 'confirmed').length,
    ignored: tasks.filter(t => t.status === 'ignored').length,
    high: tasks.filter(t => t.risk_level === 'high').length,
  }
}

/**
 * 确认风险评价（标记有效）
 */
export async function confirmRiskReviewApi(tenantId, schoolId, taskId, currentUserId, comment) {
  const now = new Date().toISOString()
  await request.patch(`/evaluationReviewTasks/${taskId}`, {
    status: 'confirmed',
    reviewer_id: currentUserId,
    reviewed_at: now,
    review_comment: comment || '已确认风险有效',
    updated_at: now,
  }).then(unwrap)

  await request.post('/operationLogs', {
    tenant_id: tenantId,
    school_id: schoolId,
    user_id: currentUserId,
    module: 'audit',
    action: 'approve',
    target_type: 'evaluation_review_task',
    target_id: taskId,
    content: `确认风险评价复核 #${taskId}`,
    created_at: now,
    deleted: false,
  })

  await request.post('/auditLogs', {
    tenant_id: tenantId,
    school_id: schoolId,
    user_id: currentUserId,
    module: 'audit',
    action_type: 'confirm_risk',
    target_type: 'evaluation_review_task',
    target_id: taskId,
    target_name: `风险复核 #${taskId}`,
    content: `确认风险评价有效`,
    result: 'success',
    ip: '-',
    device: '-',
    created_at: now,
    deleted: false,
  })

  return { success: true }
}

/**
 * 忽略风险评价
 */
export async function ignoreRiskReviewApi(tenantId, schoolId, taskId, currentUserId, comment) {
  const now = new Date().toISOString()
  await request.patch(`/evaluationReviewTasks/${taskId}`, {
    status: 'ignored',
    reviewer_id: currentUserId,
    reviewed_at: now,
    review_comment: comment || '已忽略该风险',
    updated_at: now,
  }).then(unwrap)

  await request.post('/operationLogs', {
    tenant_id: tenantId,
    school_id: schoolId,
    user_id: currentUserId,
    module: 'audit',
    action: 'reject',
    target_type: 'evaluation_review_task',
    target_id: taskId,
    content: `忽略风险评价复核 #${taskId}`,
    created_at: now,
    deleted: false,
  })

  return { success: true }
}
