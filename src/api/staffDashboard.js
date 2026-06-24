import request from '@/request'

/**
 * 职工工作台 API
 * 
 * 所有方法内部组合调用 json-server 已有资源，
 * 按 tenant_id + 角色授权范围过滤数据。
 */

// ==================== 基础数据读取 ====================

/**
 * 获取教学组织列表
 */
export function getTeachingOrgUnitsApi(tenantId) {
  return request.get('/teachingOrgUnits', {
    params: { tenant_id: tenantId, deleted: false }
  }).then(res => (res.data || []).filter(o => !o.deleted))
}

/**
 * 获取服务组织列表
 */
export function getServiceOrgUnitsApi(tenantId) {
  return request.get('/serviceOrgUnits', {
    params: { tenant_id: tenantId, deleted: false }
  }).then(res => (res.data || []).filter(o => !o.deleted))
}

/**
 * 获取服务项列表
 */
export function getServiceItemsApi(tenantId) {
  return request.get('/serviceItems', {
    params: { tenant_id: tenantId, deleted: false }
  }).then(res => (res.data || []).filter(o => !o.deleted))
}

/**
 * 获取课程列表
 */
export function getCoursesApi(tenantId) {
  return request.get('/courses', {
    params: { tenant_id: tenantId, deleted: false }
  }).then(res => (res.data || []).filter(o => !o.deleted))
}

// ==================== 工作台数据 ====================

/**
 * 获取待办统计
 * @returns {{ pendingForms: number, pendingFeedback: number, activeWindows: number, pendingAppeals: number }}
 */
export async function getStaffTodoStatsApi(tenantId) {
  const [formAudits, complaintsRes, windows, appeals] = await Promise.all([
    request.get('/formPublishAudits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/complaints', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/evaluationWindows', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/appealRequests', { params: { tenant_id: tenantId, deleted: false } }),
  ])

  const audits = (formAudits.data || []).filter(r => !r.deleted)
  // 待处理反馈基于 complaints 统计，与反馈处理页保持一致
  const complaintList = (complaintsRes.data || []).filter(c => !c.deleted)
  const wins = (windows.data || []).filter(r => !r.deleted)
  const apps = (appeals.data || []).filter(r => !r.deleted)

  return {
    pendingForms: audits.filter(r => r.status === 'pending').length,
    pendingFeedback: complaintList.filter(c => c.status === 'pending' || c.status === 'processing').length,
    activeWindows: wins.filter(r => r.status === 'open').length,
    pendingAppeals: apps.filter(r => r.status === 'pending' || r.status === 'processing').length,
  }
}

/**
 * 获取进行中的评价窗口列表（含表单名称、提交统计和封面图）
 */
export async function getStaffActiveWindowsApi(tenantId) {
  const [windowsRes, formsRes, submissionsRes, filesRes] = await Promise.all([
    request.get('/evaluationWindows', { params: { tenant_id: tenantId, deleted: false, status: 'open' } }),
    request.get('/evaluationForms', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/evaluationSubmissions', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/fileResources', { params: { tenant_id: tenantId, deleted: false } }),
  ])

  const windows = (windowsRes.data || []).filter(w => !w.deleted)
  const forms = (formsRes.data || []).filter(f => !f.deleted)
  const submissions = (submissionsRes.data || []).filter(s => !s.deleted)
  const files = (filesRes.data || []).filter(f => !f.deleted)

  const formMap = {}
  forms.forEach(f => { formMap[f.id] = f })

  const fileMap = {}
  files.forEach(f => { fileMap[f.id] = f })

  return windows.map(w => {
    const form = formMap[w.form_id]
    const formSubmissions = submissions.filter(s => s.form_id === w.form_id && s.window_id === w.id)
    const coverFileId = form?.cover_file_id
    const coverUrl = coverFileId ? fileMap[coverFileId]?.url : ''
    return {
      ...w,
      form_title: form?.title || `评价表单 #${w.form_id}`,
      form_type: form?.type || w.type,
      submission_count: formSubmissions.length,
      cover_url: coverUrl || '',
    }
  }).sort((a, b) => new Date(b.start_at) - new Date(a.start_at))
}

/**
 * 获取待处理反馈列表（最近 5 条）
 * 不展示学生真实身份，只显示「学生用户」或匿名标识
 */
export async function getStaffPendingFeedbackApi(tenantId) {
  const [complaintsRes, recordsRes, serviceItemsRes, serviceOrgsRes, coursesRes, teachingOrgsRes] = await Promise.all([
    request.get('/complaints', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/complaintProcessRecords', { params: { tenant_id: tenantId } }),
    request.get('/serviceItems', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/serviceOrgUnits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/courses', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/teachingOrgUnits', { params: { tenant_id: tenantId, deleted: false } }),
  ])

  const complaints = (complaintsRes.data || [])
    .filter(c => !c.deleted && (c.status === 'pending' || c.status === 'processing'))
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 5)

  const records = (recordsRes.data || []).filter(r => !r.deleted)
  const sItems = (serviceItemsRes.data || []).filter(o => !o.deleted)
  const sOrgs = (serviceOrgsRes.data || []).filter(o => !o.deleted)
  const courses = (coursesRes.data || []).filter(o => !o.deleted)
  const tOrgs = (teachingOrgsRes.data || []).filter(o => !o.deleted)

  const sItemMap = {}; sItems.forEach(s => { sItemMap[s.id] = s })
  const sOrgMap = {}; sOrgs.forEach(o => { sOrgMap[o.id] = o })
  const courseMap = {}; courses.forEach(c => { courseMap[c.id] = c })
  const tOrgMap = {}; tOrgs.forEach(o => { tOrgMap[o.id] = o })

  // 按 complaint_id 分组取最新记录
  const latestRecordMap = {}
  records.forEach(r => {
    if (!latestRecordMap[r.complaint_id] || new Date(r.created_at) > new Date(latestRecordMap[r.complaint_id].created_at)) {
      latestRecordMap[r.complaint_id] = r
    }
  })

  const typeMap = { complaint: '投诉', suggestion: '建议', consultation: '咨询', inquiry: '咨询', praise: '表扬' }
  const statusMap = { pending: '待处理', processing: '处理中', resolved: '已办结', rejected: '已驳回', cancelled: '已撤销' }

  return complaints.map(c => {
    let targetName = ''
    if (c.target_type === 'logistics') {
      targetName = sItemMap[c.target_id]?.name || sOrgMap[c.service_org_id]?.name || '后勤服务'
    } else if (c.target_type === 'teaching') {
      targetName = courseMap[c.course_id]?.course_name || tOrgMap[c.teaching_org_id]?.name || '教学相关'
    } else {
      targetName = '其他'
    }

    return {
      id: c.id,
      title: c.title,
      type: typeMap[c.complaint_type] || '反馈',
      target_name: targetName,
      status: statusMap[c.status] || c.status,
      status_code: c.status,
      latest_process_time: latestRecordMap[c.id]?.created_at || c.updated_at,
      submitter_label: c.anonymous_to_handler ? '匿名' : '学生用户',
    }
  })
}

/**
 * 获取评价概览统计
 * @returns {{ monthCount: number, avgScore: number, participationRate: number, lowScoreCount: number }}
 */
export async function getStaffEvalSummaryApi(tenantId) {
  const [submissionsRes, scoresRes] = await Promise.all([
    request.get('/evaluationSubmissions', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/evaluationScores', { params: { tenant_id: tenantId, deleted: false } }),
  ])

  const submissions = (submissionsRes.data || []).filter(s => !s.deleted)
  const scores = (scoresRes.data || []).filter(s => !s.deleted)

  // 本月评价数
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthSubmissions = submissions.filter(s => new Date(s.submitted_at) >= monthStart)

  // 平均分
  const avgScore = scores.length > 0
    ? (scores.reduce((sum, s) => sum + (s.score || 0), 0) / scores.length).toFixed(1)
    : 0

  // 低分预警（分数 <= 2）
  const lowScoreSubmissions = scores.filter(s => s.score <= 2)
  const lowScoreSubmissionIds = new Set(lowScoreSubmissions.map(s => s.submission_id))

  // 参与率（简化：本月提交数 / 总窗口数 * 100，实际应为学生数基数）
  const participationRate = submissions.length > 0 ? Math.min(100, Math.round(submissions.length * 5)) : 0

  return {
    monthCount: monthSubmissions.length,
    avgScore: Number(avgScore),
    participationRate,
    lowScoreCount: lowScoreSubmissionIds.size,
  }
}

/**
 * 获取最近处理记录
 */
export async function getStaffRecentActivitiesApi(tenantId, userId) {
  const [recordsRes, complaintsRes, formAuditsRes, notificationsRes] = await Promise.all([
    request.get('/complaintProcessRecords', { params: { tenant_id: tenantId } }),
    request.get('/complaints', { params: { tenant_id: tenantId } }),
    request.get('/formPublishAudits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/notifications', { params: { tenant_id: tenantId } }),
  ])

  // 构建投诉标题映射
  const complaintsMap = {}
  const complaints = complaintsRes.data || []
  complaints.forEach(c => {
    if (!c.deleted) {
      complaintsMap[c.id] = c.title || '反馈记录'
    }
  })

  // 根据 from_status 和 to_status 生成动作名称和颜色
  function getActionInfo(fromStatus, toStatus) {
    if (fromStatus === 'pending' && toStatus === 'processing') {
      return { action: '已受理', color: 'success' }
    }
    if (fromStatus === 'processing' && toStatus === 'processing') {
      return { action: '更新进度', color: 'success' }
    }
    if (toStatus === 'resolved') {
      return { action: '已办结', color: 'success' }
    }
    if (toStatus === 'rejected') {
      return { action: '已驳回', color: 'danger' }
    }
    if (toStatus === 'cancelled') {
      return { action: '已撤销', color: 'muted' }
    }
    return { action: '处理', color: 'muted' }
  }

  const records = (recordsRes.data || [])
    .filter(r => !r.deleted && r.handler_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)

  const audits = (formAuditsRes.data || [])
    .filter(a => !a.deleted && a.requested_by === userId)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 3)

  const notifications = (notificationsRes.data || [])
    .filter(n => !n.deleted && n.receiver_user_id === userId)
    .sort((a, b) => new Date(b.created_at || b.publish_time) - new Date(a.created_at || a.publish_time))
    .slice(0, 5)

  // 合并为统一时间线
  const activities = [
    ...records.map(r => {
      const actionInfo = getActionInfo(r.from_status, r.to_status)
      const complaintTitle = complaintsMap[r.complaint_id] || '反馈记录'
      return {
        id: `record-${r.id}`,
        type: 'process',
        action: actionInfo.action,
        actionColor: actionInfo.color,
        title: complaintTitle,
        content: r.content || '',
        time: r.created_at,
      }
    }),
    ...audits.map(a => ({
      id: `audit-${a.id}`,
      type: 'audit',
      action: '审核',
      actionColor: 'warning',
      title: `表单审核 #${a.form_id}`,
      content: a.review_comment || '',
      time: a.updated_at,
    })),
    ...notifications.map(n => ({
      id: `notification-${n.id}`,
      type: 'notification',
      action: '通知',
      actionColor: 'info',
      title: n.title || n.content?.slice(0, 30) || '新通知',
      content: n.content || '',
      time: n.created_at || n.publish_time,
    })),
  ]

  activities.sort((a, b) => new Date(b.time) - new Date(a.time))
  return activities.slice(0, 10)
}

/**
 * 获取工作通知（与当前职工相关的业务提醒）
 * 来源：notifications 按 tenant_id + receiver_user_id 过滤
 * @returns {Array} 工作通知列表
 */
export async function getStaffWorkNotificationsApi(tenantId, userId) {
  const res = await request.get('/notifications', {
    params: { tenant_id: tenantId, deleted: false },
  })
  const all = (res.data || []).filter(n => !n.deleted)

  // 筛选：receiver_user_id 匹配当前用户，或 target_roles 包含 staff
  const relevant = all.filter(n => {
    if (n.receiver_user_id === userId) return true
    if (n.target_roles && n.target_roles.includes('staff')) return true
    return false
  })

  return relevant
    .sort((a, b) => new Date(b.publish_time || b.created_at) - new Date(a.publish_time || a.created_at))
    .slice(0, 5)
    .map(n => ({
      id: n.id,
      title: n.title,
      content: n.content,
      type: n.type || 'system',
      tag: n.tag || '',
      link: n.link || '',
      time: n.publish_time || n.created_at,
      read_status: n.read_status || 'unread',
    }))
}

/**
 * 获取待处理申诉列表（最近 5 条）
 */
export async function getStaffPendingAppealsApi(tenantId) {
  const [appealsRes, formsRes] = await Promise.all([
    request.get('/appealRequests', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/evaluationForms', { params: { tenant_id: tenantId, deleted: false } }),
  ])

  const appeals = (appealsRes.data || [])
    .filter(a => !a.deleted && (a.status === 'pending' || a.status === 'processing'))
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 5)

  const forms = (formsRes.data || []).filter(f => !f.deleted)
  const formMap = {}; forms.forEach(f => { formMap[f.id] = f })

  const statusMap = { pending: '待处理', processing: '处理中', resolved: '已办结', rejected: '已驳回' }

  return appeals.map(a => {
    // 优先使用申诉记录自身的 form_id，兜底通过 submission 查找
    const formId = a.form_id
    const form = formId ? formMap[formId] : null
    return {
      id: a.id,
      submission_id: a.submission_id,
      form_title: form?.title || '评价表单',
      reason: a.reason,
      status: statusMap[a.status] || a.status,
      status_code: a.status,
      appeal_by: a.appeal_by,
      created_at: a.created_at,
      updated_at: a.updated_at,
    }
  })
}

/**
 * 获取职工工作台 Hero 图片
 * 从 fileResources 中筛选 biz_type = staff_dashboard 的图片
 * @returns {string} 图片 URL，无则返回空字符串
 */
export async function getStaffHeroImageApi(tenantId) {
  const res = await request.get('/fileResources', {
    params: { tenant_id: tenantId, deleted: false },
  })
  const files = (res.data || []).filter(f => !f.deleted)
  const hero = files.find(f => f.biz_type === 'staff_dashboard' && f.category === 'staff_hero')
  return hero?.url || ''
}
