import request from '@/request'

/**
 * 获取投诉建议统计数据
 * @param {number} tenantId
 */
export async function getComplaintStatsApi(tenantId) {
  const [complaintsRes, recordsRes] = await Promise.all([
    request.get('/complaints', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/complaintProcessRecords', { params: { tenant_id: tenantId } }),
  ])

  const complaints = (complaintsRes.data || []).filter(c => Number(c.tenant_id) === Number(tenantId))
  const records = (recordsRes.data || []).filter(r => Number(r.tenant_id) === Number(tenantId))

  // 按状态统计
  const statusCount = { pending: 0, processing: 0, resolved: 0, cancelled: 0 }
  complaints.forEach(c => {
    if (statusCount[c.status] !== undefined) statusCount[c.status]++
  })

  // 按类型统计
  const typeCount = {}
  complaints.forEach(c => {
    const t = c.complaint_type || 'other'
    typeCount[t] = (typeCount[t] || 0) + 1
  })

  // 按优先级统计
  const priorityCount = { high: 0, normal: 0, low: 0 }
  complaints.forEach(c => {
    if (priorityCount[c.priority] !== undefined) priorityCount[c.priority]++
  })

  // 按月趋势
  const monthMap = {}
  complaints.forEach(c => {
    const d = new Date(c.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthMap[key] = (monthMap[key] || 0) + 1
  })
  const monthTrend = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }))

  // 平均处理时长（天）
  let avgDays = 0
  const resolvedWithDates = complaints.filter(c => c.status === 'resolved' && c.resolved_at)
  if (resolvedWithDates.length > 0) {
    const totalDays = resolvedWithDates.reduce((sum, c) => {
      const created = new Date(c.created_at)
      const resolved = new Date(c.resolved_at)
      return sum + (resolved - created) / (1000 * 60 * 60 * 24)
    }, 0)
    avgDays = Math.round((totalDays / resolvedWithDates.length) * 10) / 10
  }

  return {
    total: complaints.length,
    statusCount,
    typeCount,
    priorityCount,
    monthTrend,
    avgHandleDays: avgDays,
    processRecordCount: records.length,
  }
}

/**
 * 获取投诉建议列表（分页）
 * @param {number} tenantId
 * @param {object} params - { status, complaint_type, priority, page, pageSize }
 */
export async function getComplaintListApi(tenantId, params = {}) {
  const query = { tenant_id: tenantId, deleted: false, ...params }
  const res = await request.get('/complaints', { params: query })
  const all = (res.data || []).filter(c => Number(c.tenant_id) === Number(tenantId))

  // 客户端分页
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 10
  const total = all.length
  const start = (page - 1) * pageSize
  const list = all.slice(start, start + pageSize)

  return { list, total, page, pageSize }
}

/**
 * 获取投诉建议详情
 * @param {number} tenantId
 * @param {number} complaintId
 */
export async function getComplaintDetailApi(tenantId, complaintId) {
  const [complaintsRes, recordsRes] = await Promise.all([
    request.get('/complaints', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/complaintProcessRecords', { params: { tenant_id: tenantId, complaint_id: complaintId } }),
  ])

  const complaint = (complaintsRes.data || []).find(c => Number(c.id) === Number(complaintId) && Number(c.tenant_id) === Number(tenantId))
  const records = (recordsRes.data || []).filter(r => Number(r.complaint_id) === Number(complaintId))

  if (!complaint) return null

  // 关联提交人信息（仅非匿名时展示）
  let submitterInfo = null
  if (!complaint.anonymous_to_handler && complaint.submitter_id) {
    const profilesRes = await request.get('/personProfiles', { params: { user_id: complaint.submitter_id, deleted: false } })
    const profile = (profilesRes.data || [])[0]
    if (profile) {
      submitterInfo = {
        realName: profile.real_name || '',
        roleType: profile.role_type || '',
      }
    }
  }

  // 关联服务部门/院系
  let orgInfo = null
  if (complaint.service_org_id) {
    const orgsRes = await request.get('/serviceOrgUnits', { params: { id: complaint.service_org_id, deleted: false } })
    const org = (orgsRes.data || [])[0]
    if (org) orgInfo = { name: org.name, type: org.type }
  } else if (complaint.teaching_org_id) {
    const orgsRes = await request.get('/teachingOrgUnits', { params: { id: complaint.teaching_org_id, deleted: false } })
    const org = (orgsRes.data || [])[0]
    if (org) orgInfo = { name: org.name, type: 'teaching' }
  }

  return {
    ...complaint,
    submitterInfo,
    orgInfo,
    processRecords: records.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
  }
}

/**
 * 更新投诉状态并添加处理记录
 * @param {number} tenantId
 * @param {number} complaintId
 * @param {object} data - { to_status, content, handler_id }
 */
export async function updateComplaintStatusApi(tenantId, complaintId, data) {
  const db = await request.get('/complaintProcessRecords', { params: { _sort: 'id', _order: 'desc', _limit: 1 } })
  const nextId = (db.data || []).length > 0 ? Math.max(...(db.data || []).map(r => r.id)) + 1 : 1

  const record = {
    id: nextId,
    tenant_id: tenantId,
    complaint_id: complaintId,
    handler_id: data.handler_id || null,
    from_status: data.from_status || null,
    to_status: data.to_status,
    content: data.content || '',
    created_at: new Date().toISOString(),
  }

  const createRes = await request.post('/complaintProcessRecords', record)

  // 更新投诉主表状态
  const updateData = { status: data.to_status, updated_at: new Date().toISOString() }
  if (data.to_status === 'resolved') {
    updateData.resolved_at = new Date().toISOString()
  }
  await request.put(`/complaints/${complaintId}`, updateData)

  return createRes.data
}

/**
 * 获取投诉类型中文映射
 */
export function getComplaintTypeLabel(type) {
  const map = {
    complaint: '投诉',
    suggestion: '建议',
    inquiry: '咨询',
    praise: '表扬',
  }
  return map[type] || type || '未知'
}

/**
 * 获取投诉状态中文映射
 */
export function getComplaintStatusLabel(status) {
  const map = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    cancelled: '已撤销',
  }
  return map[status] || status || '未知'
}

/**
 * 获取优先级中文映射
 */
export function getPriorityLabel(priority) {
  const map = {
    high: '高',
    normal: '普通',
    low: '低',
  }
  return map[priority] || priority || '未知'
}
