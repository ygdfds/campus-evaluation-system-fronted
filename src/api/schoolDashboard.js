import request from '@/request'
import { dataOf, getPage, listOf } from '@/api/backend'

const formStatusMap = {
  draft: '草稿',
  pending: '待审核',
  published: '已发布',
  rejected: '已驳回',
  closed: '已关闭',
}

const formTypeMap = {
  course_evaluation: '教学评价',
  service_evaluation: '服务评价',
}

const auditStatusMap = { pending: '待审核', approved: '已通过', rejected: '已驳回' }

async function forms() {
  return (await getPage(request, '/evaluation/forms', { page: 1, pageSize: 500 })).records
}

async function audits() {
  return (await getPage(request, '/evaluation/audits', { page: 1, pageSize: 500 })).records
}

async function traceTasks() {
  return listOf(await request.get('/review/traceAuthorizations', { params: { status: 'pending' } }))
}

export async function getSchoolDashboardOverviewApi() {
  const [staff, students, teachingOrgs, serviceOrgs, formList, auditList, traceList] = await Promise.all([
    listOf(await request.get('/school/staff-users', { params: { page: 1, pageSize: 500 } })),
    listOf(await request.get('/school/student-users', { params: { page: 1, pageSize: 500 } })),
    listOf(await request.get('/school/teaching-orgs', { params: { page: 1, pageSize: 500 } })),
    listOf(await request.get('/school/service-orgs', { params: { page: 1, pageSize: 500 } })),
    forms(),
    audits(),
    traceTasks(),
  ])
  return {
    staffCount: staff.length,
    studentCount: students.length,
    teachingOrgCount: teachingOrgs.length,
    serviceOrgCount: serviceOrgs.length,
    pendingAuditCount: auditList.filter((item) => item.status === 'pending').length,
    pendingTraceCount: traceList.length,
    formStatusDistribution: {
      draft: formList.filter((item) => item.status === 'draft').length,
      pending_review: formList.filter((item) => item.status === 'pending').length,
      published: formList.filter((item) => item.status === 'published').length,
      rejected: formList.filter((item) => item.status === 'rejected').length,
      closed: formList.filter((item) => item.status === 'closed').length,
    },
  }
}

export async function getSchoolAuditFormsApi() {
  const list = await audits()
  return list.filter((item) => item.status === 'pending').map((item) => ({
    id: item.id,
    form_id: item.formId,
    form_title: item.formTitle || '',
    form_type: formTypeMap[item.formType] || item.formType || '评价',
    form_status: formStatusMap[item.formStatus] || item.formStatus || '待审核',
    requester_name: item.submitterName || '未知提交人',
    org_name: '',
    submit_reason: item.submitReason || '申请发布评价表单',
    requested_at: item.requestedAt,
    status: auditStatusMap[item.status] || item.status,
  }))
}

export async function getSchoolTraceAuthTasksApi() {
  return traceTasks()
}

export async function getSchoolOperationOverviewApi() {
  const [formList, complaints, ctx] = await Promise.all([
    forms(),
    listOf(await request.get('/complaints')),
    dataOf(await request.get('/stats/staff/reports/context')),
  ])
  const submissions = ctx.submissions || []
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  return {
    formStatus: {
      draft: formList.filter((item) => item.status === 'draft').length,
      pending_review: formList.filter((item) => item.status === 'pending').length,
      published: formList.filter((item) => item.status === 'published').length,
      rejected: formList.filter((item) => item.status === 'rejected').length,
      closed: formList.filter((item) => item.status === 'closed').length,
    },
    feedbackStatus: {
      pending: complaints.filter((item) => item.status === 'pending').length,
      processing: complaints.filter((item) => item.status === 'processing').length,
      resolved: complaints.filter((item) => item.status === 'resolved').length,
      rejected: complaints.filter((item) => item.status === 'rejected').length,
      closed: complaints.filter((item) => item.status === 'closed').length,
    },
    monthSubmissionCount: submissions.filter((item) => new Date(item.submitted_at || item.created_at) >= monthStart).length,
    totalSubmissionCount: submissions.length,
  }
}

export async function getSchoolRecentActivitiesApi() {
  const [auditList, notificationList] = await Promise.all([
    audits(),
    listOf(await request.get('/notifications')),
  ])
  return [
    ...auditList.slice(0, 5).map((item) => ({
      id: `audit_${item.id}`,
      type: 'audit',
      module: '审核管理',
      action: auditStatusMap[item.status] || item.status,
      content: `${item.submitterName || '相关教师'}提交了《${item.formTitle || '评价表单'}》审核申请`,
      operator_name: item.submitterName || '',
      target_type: 'form_publish_audit',
      created_at: item.requestedAt,
    })),
    ...notificationList.slice(0, 5).map((item) => ({
      id: `notification_${item.id}`,
      type: 'notification',
      module: '消息通知',
      action: '通知',
      content: item.title || item.content || '',
      operator_name: '',
      target_type: item.bizType || item.biz_type || '',
      created_at: item.createdAt || item.created_at || item.publishTime,
    })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6)
}

export async function getSchoolDashboardAllApi(tenantId) {
  const [overview, auditForms, traceTasks, operationOverview, recentActivities] = await Promise.all([
    getSchoolDashboardOverviewApi(tenantId),
    getSchoolAuditFormsApi(tenantId),
    getSchoolTraceAuthTasksApi(tenantId),
    getSchoolOperationOverviewApi(tenantId),
    getSchoolRecentActivitiesApi(tenantId),
  ])
  return { overview, auditForms, traceTasks, operationOverview, recentActivities }
}
