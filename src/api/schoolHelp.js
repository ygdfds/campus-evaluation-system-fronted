import request from '@/request'
import { unwrap } from '@/request'

// ==================== 映射表 ====================

const ticketStatusMap = {
  pending: '待处理',
  replied: '已回复',
  processing: '处理中',
  closed: '已关闭',
}

const ticketPriorityMap = {
  normal: '普通',
  urgent: '较急',
  critical: '紧急',
}

const ticketCategoryMap = {
  system: '系统问题',
  permission: '权限申请',
  feedback: '反馈处理',
  notification: '消息通知',
  evaluation: '评价相关',
  other: '其他',
}

const faqCategoryMap = {
  evaluation: '评价相关',
  appeal: '申诉追溯',
  feedback: '反馈工单',
  report: '数据报表',
  notification: '消息通知',
  account: '账号设置',
  permission: '权限管理',
  system: '系统功能',
  complaint: '投诉建议',
  user: '用户管理',
  org: '组织架构',
  data: '数据统计',
  form_audit: '表单审核',
}

// ==================== 辅助函数 ====================

function resolveProfileName(profileMap, userId) {
  const p = profileMap[userId]
  return p?.real_name || '未知用户'
}

function resolveRoleLabel(profileMap, userId) {
  const p = profileMap[userId]
  if (!p) return '未知'
  if (p.role_type === 'staff' || p.position) return '教职工'
  if (p.role_type === 'student' || p.student_no) return '学生'
  return '用户'
}

// ==================== 帮助工单 API ====================

/**
 * 获取帮助工单列表
 */
export async function getSchoolHelpTicketsApi(tenantId, filters = {}) {
  const [ticketsRes, profilesRes] = await Promise.all([
    request.get('/helpTickets', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/personProfiles', { params: { deleted: false } }),
  ])

  let tickets = (ticketsRes.data || []).filter(t => !t.deleted)
  const profiles = (profilesRes.data || []).filter(p => !p.deleted)
  const profileMap = {}
  profiles.forEach(p => { profileMap[p.user_id] = p })

  // 状态筛选
  if (filters.status && filters.status !== 'all') {
    tickets = tickets.filter(t => t.status === filters.status)
  }
  // 优先级筛选
  if (filters.priority && filters.priority !== 'all') {
    tickets = tickets.filter(t => t.priority === filters.priority)
  }
  // 分类筛选
  if (filters.category && filters.category !== 'all') {
    tickets = tickets.filter(t => t.category === filters.category)
  }
  // 搜索
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    tickets = tickets.filter(t => {
      const submitter = profileMap[t.submitter_id] || {}
      return (
        (t.title || '').toLowerCase().includes(kw) ||
        (t.content || '').toLowerCase().includes(kw) ||
        (submitter.real_name || '').toLowerCase().includes(kw) ||
        (t.ticket_no || '').toLowerCase().includes(kw)
      )
    })
  }

  // 排序：最新优先
  tickets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return tickets.map(t => ({
    id: t.id,
    ticket_no: t.ticket_no || `HT${t.id}`,
    title: t.title || '',
    content: t.content || '',
    category: ticketCategoryMap[t.category] || t.category || '其他',
    category_code: t.category || 'other',
    priority: ticketPriorityMap[t.priority] || t.priority || '普通',
    priority_code: t.priority || 'normal',
    status: ticketStatusMap[t.status] || t.status || '待处理',
    status_code: t.status || 'pending',
    submitter_name: resolveProfileName(profileMap, t.submitter_id),
    submitter_role: resolveRoleLabel(profileMap, t.submitter_id),
    submitter_id: t.submitter_id,
    attachment_file_ids: t.attachment_file_ids || [],
    reply_content: t.reply_content || '',
    replied_by: t.replied_by,
    replied_at: t.replied_at,
    created_at: t.created_at,
    updated_at: t.updated_at,
  }))
}

/**
 * 获取帮助工单统计
 */
export async function getSchoolHelpTicketSummaryApi(tenantId) {
  const [ticketsRes] = await Promise.all([
    request.get('/helpTickets', { params: { tenant_id: tenantId, deleted: false } }),
  ])
  const tickets = (ticketsRes.data || []).filter(t => !t.deleted)
  return {
    total: tickets.length,
    pending: tickets.filter(t => t.status === 'pending').length,
    replied: tickets.filter(t => t.status === 'replied').length,
    closed: tickets.filter(t => t.status === 'closed').length,
  }
}

/**
 * 回复帮助工单
 */
export async function replySchoolHelpTicketApi(tenantId, schoolId, ticketId, currentUserId, replyContent) {
  const now = new Date().toISOString()
  await request.patch(`/helpTickets/${ticketId}`, {
    status: 'replied',
    reply_content: replyContent,
    replied_by: currentUserId,
    replied_at: now,
    updated_at: now,
  }).then(unwrap)

  // 写入操作日志
  await request.post('/operationLogs', {
    tenant_id: tenantId,
    school_id: schoolId,
    user_id: currentUserId,
    module: 'help',
    action: 'reply',
    target_type: 'help_ticket',
    target_id: ticketId,
    content: `回复帮助工单 #${ticketId}`,
    created_at: now,
    updated_at: now,
    deleted: false,
  })

  return { success: true }
}

/**
 * 关闭帮助工单
 */
export async function closeSchoolHelpTicketApi(tenantId, schoolId, ticketId, currentUserId) {
  const now = new Date().toISOString()
  await request.patch(`/helpTickets/${ticketId}`, {
    status: 'closed',
    updated_at: now,
  }).then(unwrap)

  await request.post('/operationLogs', {
    tenant_id: tenantId,
    school_id: schoolId,
    user_id: currentUserId,
    module: 'help',
    action: 'close',
    target_type: 'help_ticket',
    target_id: ticketId,
    content: `关闭帮助工单 #${ticketId}`,
    created_at: now,
    updated_at: now,
    deleted: false,
  })

  return { success: true }
}

// ==================== 帮助内容 API（FAQ + 操作指引） ====================

/**
 * 获取 FAQ 列表
 */
export async function getSchoolHelpFaqsApi(tenantId, filters = {}) {
  const [faqsRes] = await Promise.all([
    request.get('/helpFaqs', { params: { tenant_id: tenantId } }),
  ])

  let faqs = (faqsRes.data || []).filter(f => !f.deleted)

  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    faqs = faqs.filter(f => (f.question || '').toLowerCase().includes(kw) || (f.answer || '').toLowerCase().includes(kw))
  }
  if (filters.category && filters.category !== 'all') {
    faqs = faqs.filter(f => f.category === filters.category)
  }
  if (filters.enabled !== undefined && filters.enabled !== 'all') {
    const enabled = filters.enabled === 'true' || filters.enabled === true
    faqs = faqs.filter(f => f.enabled === enabled)
  }

  faqs.sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99))

  return faqs.map(f => ({
    id: f.id,
    question: f.question || '',
    answer: f.answer || '',
    category: faqCategoryMap[f.category] || f.category || '其他',
    category_code: f.category || 'other',
    keywords: f.keywords || '',
    sort_order: f.sort_order || 0,
    enabled: f.enabled !== false,
    created_at: f.created_at,
    updated_at: f.updated_at,
  }))
}

/**
 * 获取操作指引列表
 */
export async function getSchoolHelpGuidesApi(tenantId, filters = {}) {
  const [guidesRes] = await Promise.all([
    request.get('/helpGuides', { params: { tenant_id: tenantId } }),
  ])

  let guides = (guidesRes.data || []).filter(g => !g.deleted)

  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    guides = guides.filter(g => (g.title || '').toLowerCase().includes(kw) || (g.summary || '').toLowerCase().includes(kw))
  }
  if (filters.enabled !== undefined && filters.enabled !== 'all') {
    const enabled = filters.enabled === 'true' || filters.enabled === true
    guides = guides.filter(g => g.enabled === enabled)
  }

  guides.sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99))

  return guides.map(g => ({
    id: g.id,
    title: g.title || '',
    module: g.module || '',
    summary: g.summary || '',
    steps: g.steps || [],
    related_link: g.related_link || '',
    sort_order: g.sort_order || 0,
    enabled: g.enabled !== false,
    created_at: g.created_at,
    updated_at: g.updated_at,
  }))
}

/**
 * 新增/更新 FAQ
 */
export async function saveSchoolHelpFaqApi(tenantId, schoolId, currentUserId, faqData) {
  const now = new Date().toISOString()
  const payload = {
    ...faqData,
    tenant_id: tenantId,
    updated_at: now,
  }

  if (faqData.id) {
    await request.patch(`/helpFaqs/${faqData.id}`, payload).then(unwrap)
  } else {
    payload.created_at = now
    payload.deleted = false
    await request.post('/helpFaqs', payload).then(unwrap)
  }

  await request.post('/operationLogs', {
    tenant_id: tenantId,
    school_id: schoolId,
    user_id: currentUserId,
    module: 'help',
    action: faqData.id ? 'edit' : 'create',
    target_type: 'help_faq',
    target_id: faqData.id || 0,
    content: `${faqData.id ? '编辑' : '新增'} FAQ：${faqData.question || ''}`,
    created_at: now,
    deleted: false,
  })

  return { success: true }
}

/**
 * 新增/更新操作指引
 */
export async function saveSchoolHelpGuideApi(tenantId, schoolId, currentUserId, guideData) {
  const now = new Date().toISOString()
  const payload = {
    ...guideData,
    tenant_id: tenantId,
    updated_at: now,
  }

  if (guideData.id) {
    await request.patch(`/helpGuides/${guideData.id}`, payload).then(unwrap)
  } else {
    payload.created_at = now
    payload.deleted = false
    await request.post('/helpGuides', payload).then(unwrap)
  }

  await request.post('/operationLogs', {
    tenant_id: tenantId,
    school_id: schoolId,
    user_id: currentUserId,
    module: 'help',
    action: guideData.id ? 'edit' : 'create',
    target_type: 'help_guide',
    target_id: guideData.id || 0,
    content: `${guideData.id ? '编辑' : '新增'}操作指引：${guideData.title || ''}`,
    created_at: now,
    deleted: false,
  })

  return { success: true }
}

/**
 * 切换 FAQ 启用/停用
 */
export async function toggleSchoolHelpFaqApi(faqId, enabled) {
  const now = new Date().toISOString()
  await request.patch(`/helpFaqs/${faqId}`, { enabled, updated_at: now }).then(unwrap)
  return { success: true }
}

/**
 * 切换操作指引启用/停用
 */
export async function toggleSchoolHelpGuideApi(guideId, enabled) {
  const now = new Date().toISOString()
  await request.patch(`/helpGuides/${guideId}`, { enabled, updated_at: now }).then(unwrap)
  return { success: true }
}

/**
 * 删除 FAQ（软删除）
 */
export async function deleteSchoolHelpFaqApi(faqId) {
  const now = new Date().toISOString()
  await request.patch(`/helpFaqs/${faqId}`, { deleted: true, updated_at: now }).then(unwrap)
  return { success: true }
}

/**
 * 删除操作指引（软删除）
 */
export async function deleteSchoolHelpGuideApi(guideId) {
  const now = new Date().toISOString()
  await request.patch(`/helpGuides/${guideId}`, { deleted: true, updated_at: now }).then(unwrap)
  return { success: true }
}
