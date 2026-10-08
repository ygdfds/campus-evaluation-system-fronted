import request from '@/request'
import { unwrap } from '@/request'

// ==================== 投诉建议 - 读取 ====================

/**
 * 获取当前学生的投诉建议列表
 */
export function getMyComplaintsApi(tenantId, submitterId) {
  return request.get('/complaints', {
    params: { tenant_id: tenantId, submitter_id: submitterId, deleted: false, _sort: 'created_at', _order: 'desc' }
  }).then(res => (res.data || []).filter(c => !c.deleted))
}

/**
 * 获取投诉处理记录（时间线）
 */
export function getComplaintProcessRecordsApi(tenantId, complaintId) {
  return request.get('/complaintProcessRecords', {
    params: { tenant_id: tenantId, complaint_id: complaintId }
  }).then(res => res.data || [])
}

/**
 * 获取反馈工单
 */
export function getFeedbackWorkOrdersApi(tenantId, submitterId) {
  return request.get('/feedbackWorkOrders', {
    params: { tenant_id: tenantId, submitter_id: submitterId }
  }).then(res => res.data || [])
}

// ==================== 投诉建议 - 写入 ====================

/**
 * 提交投诉建议（新增 complaint 记录）
 */
export function createComplaintApi(data) {
  return request.post('/complaints', data).then(unwrap)
}

/**
 * 新增处理记录
 */
export function createProcessRecordApi(data) {
  return request.post('/complaintProcessRecords', data).then(unwrap)
}

/**
 * 新增反馈工单
 */
export function createFeedbackWorkOrderApi(data) {
  return request.post('/feedbackWorkOrders', data).then(unwrap)
}

/**
 * 新增文件资源
 */
export function createFileResourceApi(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('bizType', 'complaint')
  return request.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(unwrap)
}

// ==================== 投诉建议 - 撤销 ====================

/**
 * 撤销投诉建议（PATCH complaints/:id）
 * 仅更新状态为 cancelled，不物理删除
 */
export function cancelComplaintApi(complaintId, data) {
  return request.patch(`/complaints/${complaintId}`, data).then(unwrap)
}

/**
 * 更新反馈工单状态（用于撤销时同步更新关联工单）
 */
export function updateFeedbackWorkOrderApi(workOrderId, data) {
  return request.patch(`/feedbackWorkOrders/${workOrderId}`, data).then(unwrap)
}

/**
 * 根据 source_id 查找关联的反馈工单
 */
export function getFeedbackWorkOrderBySourceApi(tenantId, submitterId, sourceId) {
  return request.get('/feedbackWorkOrders', {
    params: { tenant_id: tenantId, submitter_id: submitterId, source: 'complaint', source_id: sourceId }
  }).then(res => res.data || [])
}

// ==================== 辅助资源（复用评价模块） ====================

export { getCoursesApi, getServiceItemsApi, getTeachingOrgUnitsApi } from './evaluation'

/**
 * 获取学生选课记录
 */
export function getCourseEnrollmentsApi(tenantId, studentId) {
  return request.get('/evaluation/student/course-enrollments').then(res => res.data || res || [])
}

/**
 * 获取后勤服务组织
 */
export function getServiceOrgUnitsApi(tenantId) {
  return request.get('/school/service-orgs', {
    params: { pageNum: 1, pageSize: 1000 }
  }).then(res => res.data?.records || res.data || [])
}
