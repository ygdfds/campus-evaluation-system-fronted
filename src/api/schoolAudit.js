import request from '@/request'
import { dataOf, getPage } from '@/api/backend'

const auditStatusMap = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
}

const formTypeMap = {
  course_evaluation: '教学评价',
  service_evaluation: '服务评价',
  teaching: '教学评价',
  service: '服务评价',
  instant: '即时评价',
}

const formStatusMap = {
  draft: '草稿',
  pending: '待审核',
  published: '已发布',
  rejected: '已驳回',
  closed: '已关闭',
}

function formTypeCode(value) {
  if (value === 'teaching') return 'course_evaluation'
  if (value === 'service' || value === 'instant') return 'service_evaluation'
  return value
}

function formTypeLabel(value) {
  return formTypeMap[value] || value || '评价'
}

function formatAudit(item = {}) {
  const formType = item.formType || item.form_type
  return {
    ...item,
    form_id: item.formId ?? item.form_id,
    form_title: item.formTitle || item.form_title || '',
    form_type: formTypeLabel(formType),
    form_type_code: formType,
    status_code: item.status,
    status: auditStatusMap[item.status] || item.status,
    submitter_name: item.submitterName || item.submitter_name || '未知提交人',
    requested_at: item.requestedAt || item.requested_at,
    reviewed_at: item.reviewedAt || item.reviewed_at,
    review_comment: item.reviewComment || item.review_comment || '',
    submit_reason: item.submitReason || item.submit_reason || '',
  }
}

export async function getSchoolAuditListApi(_tenantId, filters = {}) {
  const page = await getPage(request, '/evaluation/audits', {
    keyword: filters.keyword,
    status: filters.status && filters.status !== 'all' ? filters.status : undefined,
    formType: filters.formType && filters.formType !== 'all' ? formTypeCode(filters.formType) : undefined,
    page: filters.page || 1,
    pageSize: filters.pageSize || 20,
  })
  let list = page.records.map(formatAudit)
  if (filters.timeRange && filters.timeRange !== 'all') {
    const now = new Date()
    const since = filters.timeRange === 'today'
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
      : filters.timeRange === 'month'
        ? new Date(now.getFullYear(), now.getMonth(), 1)
        : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    list = list.filter((item) => new Date(item.requested_at) >= since)
  }
  return list
}

export async function getSchoolAuditSummaryApi() {
  const page = await getPage(request, '/evaluation/audits', { page: 1, pageSize: 500 })
  const audits = page.records
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const month = new Date(now.getFullYear(), now.getMonth(), 1)
  return {
    total: audits.length,
    pending: audits.filter((item) => item.status === 'pending').length,
    approved: audits.filter((item) => item.status === 'approved').length,
    rejected: audits.filter((item) => item.status === 'rejected').length,
    todaySubmitted: audits.filter((item) => new Date(item.requestedAt || item.requested_at) >= today).length,
    monthAudited: audits.filter((item) => item.reviewedAt && new Date(item.reviewedAt) >= month).length,
  }
}

export async function getSchoolAuditDetailApi(_tenantId, auditId) {
  const detail = dataOf(await request.get(`/evaluation/audits/${auditId}`))
  if (!detail) return null
  const audit = detail.audit || {}
  const form = detail.formDetail || {}
  return {
    audit_id: audit.id,
    audit_status: auditStatusMap[audit.status] || audit.status,
    audit_status_code: audit.status,
    submitter_name: audit.submitterName || '',
    submitter_id: audit.submitterId,
    submit_reason: audit.submitReason || '',
    requested_at: audit.requestedAt,
    reviewed_at: audit.reviewedAt,
    reviewed_by_name: audit.reviewerName || '',
    review_comment: audit.reviewComment || '',
    form_id: form.id,
    form_title: form.title,
    form_type: formTypeLabel(form.formType),
    form_description: form.description || '',
    form_status: formStatusMap[form.status] || form.status,
    form_anonymous: form.anonymousEnabled,
    form_publish_scope: form.publishScope || '',
    form_created_at: form.createdAt,
    form_publisher_name: form.creatorName || '',
    org_name: form.targetName || '',
    org_id: form.targetId,
    course_id: form.targetType === 'course' ? form.targetId : null,
    service_item_id: form.targetType === 'service_item' ? form.targetId : null,
    object_name: form.targetName || '',
    object_type_label: form.targetType === 'course' ? '课程' : '服务项目',
    questions_count: (form.questions || []).length,
    windows: form.window ? [form.window] : [],
    risks: (detail.riskItems || []).map((item) => item.message || item),
    blocking_risks: (detail.riskItems || []).filter((item) => item.level === 'blocker').map((item) => item.message),
    warning_risks: (detail.riskItems || []).filter((item) => item.level !== 'blocker').map((item) => item.message),
  }
}

export async function approveSchoolAuditApi(_tenantId, _schoolId, auditId) {
  await request.post(`/evaluation/audits/${auditId}/approve`)
  return { success: true }
}

export async function rejectSchoolAuditApi(_tenantId, _schoolId, auditId, _currentUserId, reason) {
  await request.post(`/evaluation/audits/${auditId}/reject`, { reason })
  return { success: true }
}
