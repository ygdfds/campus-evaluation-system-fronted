import request from '@/request'

/**
 * 职工端反馈处理 API
 *
 * 封装反馈列表查询、详情、处理操作等接口。
 * 所有查询均基于 tenant_id 过滤，确保数据隔离。
 */

// ==================== 查询类 ====================

/**
 * 获取反馈列表（complaints + feedbackWorkOrders 组合）
 * @param {Object} context - { tenantId }
 * @param {Object} filters - { status, complaintType, targetType, keyword, sort, page, pageSize }
 */
export async function getStaffFeedbackListApi(context, filters = {}) {
  const { tenantId } = context
  const { status, complaintType, targetType, keyword, sort = 'latest_submit', page = 1, pageSize = 10 } = filters

  // 并行获取 complaints 和 feedbackWorkOrders
  const [complaintsRes, workOrdersRes] = await Promise.all([
    request.get('/complaints', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/feedbackWorkOrders', { params: { tenant_id: tenantId, deleted: false } }),
  ])

  let complaints = (complaintsRes.data || []).filter(c => !c.deleted)
  const workOrders = workOrdersRes.data || []

  // 构建 workOrder map: source_id -> workOrder
  const workOrderMap = {}
  workOrders.forEach(wo => {
    if (wo.source === 'complaint' && wo.source_id) {
      workOrderMap[wo.source_id] = wo
    }
  })

  // 状态过滤
  if (status && status !== 'all') {
    complaints = complaints.filter(c => c.status === status)
  }

  // 类型过滤
  if (complaintType && complaintType !== 'all') {
    complaints = complaints.filter(c => c.complaint_type === complaintType)
  }

  // 对象类型过滤
  if (targetType && targetType !== 'all') {
    complaints = complaints.filter(c => c.target_type === targetType)
  }

  // 关键词搜索
  if (keyword && keyword.trim()) {
    const kw = keyword.trim().toLowerCase()
    complaints = complaints.filter(c =>
      (c.title && c.title.toLowerCase().includes(kw)) ||
      (c.content && c.content.toLowerCase().includes(kw))
    )
  }

  // 排序
  switch (sort) {
    case 'latest_update':
      complaints.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      break
    case 'priority': {
      const priorityOrder = { high: 0, normal: 1, low: 2 }
      complaints.sort((a, b) => (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1))
      break
    }
    case 'status_priority': {
      const statusOrder = { pending: 0, processing: 1, resolved: 2, rejected: 3, cancelled: 4 }
      complaints.sort((a, b) => (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5))
      break
    }
    default: // latest_submit
      complaints.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }

  // 分页
  const total = complaints.length
  const start = (page - 1) * pageSize
  const paged = complaints.slice(start, start + pageSize)

  // 组合 workOrder 信息
  const list = paged.map(c => ({
    ...c,
    work_order: workOrderMap[c.id] || null,
  }))

  return { list, total, page, pageSize }
}

/**
 * 获取反馈状态统计
 * @param {Object} context - { tenantId }
 */
export async function getStaffFeedbackStatsApi(context) {
  const { tenantId } = context
  const res = await request.get('/complaints', { params: { tenant_id: tenantId, deleted: false } })
  const complaints = (res.data || []).filter(c => !c.deleted)

  return {
    pending: complaints.filter(c => c.status === 'pending').length,
    processing: complaints.filter(c => c.status === 'processing').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    rejected: complaints.filter(c => c.status === 'rejected').length,
    cancelled: complaints.filter(c => c.status === 'cancelled').length,
    total: complaints.length,
  }
}

/**
 * 获取反馈详情（单条 complaint）
 * @param {Object} context - { tenantId }
 * @param {number} complaintId
 */
export async function getFeedbackDetailApi(context, complaintId) {
  const { tenantId } = context
  const [complaintRes, workOrdersRes] = await Promise.all([
    request.get(`/complaints/${complaintId}`),
    request.get('/feedbackWorkOrders', { params: { tenant_id: tenantId, source: 'complaint', source_id: complaintId, deleted: false } }),
  ])

  const complaint = complaintRes.data
  if (!complaint || complaint.tenant_id !== tenantId) return null

  const workOrder = (workOrdersRes.data || [])[0] || null

  return { ...complaint, work_order: workOrder }
}

/**
 * 获取处理记录（时间线）
 * @param {Object} context - { tenantId }
 * @param {number} complaintId
 */
export async function getFeedbackProcessRecordsApi(context, complaintId) {
  const { tenantId } = context
  const res = await request.get('/complaintProcessRecords', {
    params: { tenant_id: tenantId, complaint_id: complaintId, _sort: 'created_at', _order: 'asc' },
  })
  return res.data || []
}

// ==================== 操作类 ====================

/**
 * 受理反馈
 */
export async function acceptFeedbackApi(context, complaintId) {
  const { userId } = context
  const now = new Date().toISOString()

  // 更新 complaint 状态
  await request.patch(`/complaints/${complaintId}`, {
    status: 'processing',
    updated_at: now,
  })

  // 更新 workOrder 状态
  const woRes = await request.get('/feedbackWorkOrders', {
    params: { tenant_id: context.tenantId, source: 'complaint', source_id: complaintId, deleted: false },
  })
  const workOrder = (woRes.data || [])[0]
  if (workOrder) {
    await request.patch(`/feedbackWorkOrders/${workOrder.id}`, {
      status: 'processing',
      assignee_id: userId,
      updated_at: now,
    })
  }

  // 新增处理记录
  const record = await request.post('/complaintProcessRecords', {
    tenant_id: context.tenantId,
    complaint_id: complaintId,
    handler_id: userId,
    from_status: 'pending',
    to_status: 'processing',
    content: '已受理，正在处理中',
    created_at: now,
  })

  return record.data
}

/**
 * 更新处理进度
 */
export async function updateFeedbackProgressApi(context, complaintId, content) {
  const { userId } = context
  const now = new Date().toISOString()

  await request.patch(`/complaints/${complaintId}`, { updated_at: now })

  const record = await request.post('/complaintProcessRecords', {
    tenant_id: context.tenantId,
    complaint_id: complaintId,
    handler_id: userId,
    from_status: 'processing',
    to_status: 'processing',
    content,
    created_at: now,
  })

  return record.data
}

/**
 * 转交反馈
 */
export async function transferFeedbackApi(context, complaintId, targetOrgId, reason) {
  const { userId } = context
  const now = new Date().toISOString()

  // 获取当前 complaint 状态
  const complaintRes = await request.get(`/complaints/${complaintId}`)
  const fromStatus = complaintRes.data?.status || 'processing'

  // 更新 workOrder
  const woRes = await request.get('/feedbackWorkOrders', {
    params: { tenant_id: context.tenantId, source: 'complaint', source_id: complaintId, deleted: false },
  })
  const workOrder = (woRes.data || [])[0]
  if (workOrder) {
    await request.patch(`/feedbackWorkOrders/${workOrder.id}`, {
      handler_org_id: targetOrgId,
      assignee_id: userId,
      updated_at: now,
    })
  }

  // 确保 complaint 状态为 processing
  if (fromStatus === 'pending') {
    await request.patch(`/complaints/${complaintId}`, {
      status: 'processing',
      updated_at: now,
    })
  }

  const record = await request.post('/complaintProcessRecords', {
    tenant_id: context.tenantId,
    complaint_id: complaintId,
    handler_id: userId,
    from_status: fromStatus,
    to_status: 'processing',
    content: `已转交至相关部门处理，原因：${reason}`,
    created_at: now,
  })

  return record.data
}

/**
 * 办结反馈
 */
export async function resolveFeedbackApi(context, complaintId, resultContent) {
  const { userId } = context
  const now = new Date().toISOString()

  await request.patch(`/complaints/${complaintId}`, {
    status: 'resolved',
    resolved_at: now,
    updated_at: now,
  })

  const woRes = await request.get('/feedbackWorkOrders', {
    params: { tenant_id: context.tenantId, source: 'complaint', source_id: complaintId, deleted: false },
  })
  const workOrder = (woRes.data || [])[0]
  if (workOrder) {
    await request.patch(`/feedbackWorkOrders/${workOrder.id}`, {
      status: 'resolved',
      completed_at: now,
      updated_at: now,
    })
  }

  const record = await request.post('/complaintProcessRecords', {
    tenant_id: context.tenantId,
    complaint_id: complaintId,
    handler_id: userId,
    from_status: 'processing',
    to_status: 'resolved',
    content: resultContent,
    created_at: now,
  })

  return record.data
}

/**
 * 驳回反馈
 */
export async function rejectFeedbackApi(context, complaintId, rejectReason) {
  const { userId } = context
  const now = new Date().toISOString()

  // 获取当前状态
  const complaintRes = await request.get(`/complaints/${complaintId}`)
  const fromStatus = complaintRes.data?.status || 'pending'

  await request.patch(`/complaints/${complaintId}`, {
    status: 'rejected',
    updated_at: now,
  })

  const woRes = await request.get('/feedbackWorkOrders', {
    params: { tenant_id: context.tenantId, source: 'complaint', source_id: complaintId, deleted: false },
  })
  const workOrder = (woRes.data || [])[0]
  if (workOrder) {
    await request.patch(`/feedbackWorkOrders/${workOrder.id}`, {
      status: 'rejected',
      updated_at: now,
    })
  }

  const record = await request.post('/complaintProcessRecords', {
    tenant_id: context.tenantId,
    complaint_id: complaintId,
    handler_id: userId,
    from_status: fromStatus,
    to_status: 'rejected',
    content: `驳回：${rejectReason}`,
    created_at: now,
  })

  return record.data
}

/**
 * 创建通知（反馈处理进度通知给学生）
 */
export async function createFeedbackNotificationApi(payload) {
  return request.post('/notifications', payload).then(res => res.data)
}

/**
 * 获取关联对象名称（服务项目、课程、组织等）
 */
export async function getFeedbackRelatedObjectsApi(tenantId) {
  const [serviceItemsRes, coursesRes, serviceOrgsRes, teachingOrgsRes] = await Promise.all([
    request.get('/serviceItems', { params: { tenant_id: tenantId } }),
    request.get('/courses', { params: { tenant_id: tenantId } }),
    request.get('/serviceOrgUnits', { params: { tenant_id: tenantId } }),
    request.get('/teachingOrgUnits', { params: { tenant_id: tenantId } }),
  ])

  return {
    serviceItems: serviceItemsRes.data || [],
    courses: coursesRes.data || [],
    serviceOrgs: serviceOrgsRes.data || [],
    teachingOrgs: teachingOrgsRes.data || [],
  }
}

/**
 * 获取附件文件列表
 */
export async function getFeedbackAttachmentsApi(fileIds) {
  if (!fileIds || fileIds.length === 0) return []
  const promises = fileIds.map(id => request.get(`/fileResources/${id}`).catch(() => null))
  const results = await Promise.all(promises)
  return results.filter(Boolean).map(r => r.data).filter(d => d && !d.deleted)
}
