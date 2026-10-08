import request from '@/request'

function unwrapData(res, fallback = []) {
  if (res && typeof res === 'object' && 'data' in res) return res.data ?? fallback
  return res ?? fallback
}

/**
 * 职工端帮助中心 API
 *
 * 所有查询基于 tenant_id + deleted=false 过滤。
 * 帮助工单只允许查看和提交当前登录职工本人的数据。
 */

// ==================== 查询类 ====================

/**
 * 获取帮助中心首页数据（聚合）
 */
export function getStaffHelpHomeApi(params, currentUser) {
  const { tenantId, userId } = currentUser
  const keyword = params?.keyword || ''

  const guideParams = { tenant_id: tenantId, enabled: true, _sort: 'sort_order', _order: 'asc' }
  const faqParams = { tenant_id: tenantId, enabled: true, _sort: 'sort_order', _order: 'asc' }
  const ticketParams = { submitter_id: userId, tenant_id: tenantId, deleted: false, _sort: 'created_at', _order: 'desc', _limit: 5 }

  return Promise.all([
    request.get('/helpGuides', { params: guideParams }),
    request.get('/helpFaqs', { params: faqParams }),
    request.get('/helpTickets', { params: ticketParams }),
  ]).then(([guideRes, faqRes, ticketRes]) => {
    let guides = unwrapData(guideRes)
    let faqs = unwrapData(faqRes)
    const rawTickets = unwrapData(ticketRes)
    const myTickets = rawTickets.filter(t =>
      String(t.submitter_id) === String(userId) &&
      String(t.tenant_id) === String(tenantId) &&
      !t.deleted
    )

    // 关键词过滤
    if (keyword) {
      const kw = keyword.toLowerCase()
      guides = guides.filter(g =>
        g.title?.toLowerCase().includes(kw) ||
        g.summary?.toLowerCase().includes(kw) ||
        g.steps?.some(s => s.toLowerCase().includes(kw))
      )
      faqs = faqs.filter(f =>
        f.question?.toLowerCase().includes(kw) ||
        f.answer?.toLowerCase().includes(kw) ||
        f.keywords?.toLowerCase().includes(kw)
      )
    }

    return { guides, faqs, myTickets }
  })
}

/**
 * 获取操作指引列表
 */
export function getHelpGuideListApi(params, currentUser) {
  const { tenantId } = currentUser
  const queryParams = {
    tenant_id: tenantId,
    enabled: true,
    _sort: 'sort_order',
    _order: 'asc',
  }
  if (params?.module) queryParams.module = params.module

  return request.get('/helpGuides', { params: queryParams }).then(res => {
    let guides = unwrapData(res)
    if (params?.keyword) {
      const kw = params.keyword.toLowerCase()
      guides = guides.filter(g =>
        g.title?.toLowerCase().includes(kw) ||
        g.summary?.toLowerCase().includes(kw)
      )
    }
    return guides
  })
}

/**
 * 获取常见问题列表
 */
export function getHelpFaqListApi(params, currentUser) {
  const { tenantId } = currentUser
  const queryParams = {
    tenant_id: tenantId,
    enabled: true,
    _sort: 'sort_order',
    _order: 'asc',
  }
  if (params?.category) queryParams.category = params.category

  return request.get('/helpFaqs', { params: queryParams }).then(res => {
    let faqs = unwrapData(res)
    if (params?.keyword) {
      const kw = params.keyword.toLowerCase()
      faqs = faqs.filter(f =>
        f.question?.toLowerCase().includes(kw) ||
        f.answer?.toLowerCase().includes(kw) ||
        f.keywords?.toLowerCase().includes(kw)
      )
    }
    return faqs
  })
}

/**
 * 获取当前用户的帮助工单
 */
export function getMyHelpTicketsApi(params, currentUser) {
  const { tenantId, userId } = currentUser
  const queryParams = {
    submitter_id: userId,
    tenant_id: tenantId,
    deleted: false,
    _sort: 'created_at',
    _order: 'desc',
  }
  if (params?.status) queryParams.status = params.status

  return request.get('/helpTickets', { params: queryParams }).then(res => {
    const rawTickets = unwrapData(res)
    return rawTickets.filter(t =>
      String(t.submitter_id) === String(userId) &&
      String(t.tenant_id) === String(tenantId) &&
      !t.deleted
    )
  })
}

// ==================== 修改类 ====================

/**
 * 提交帮助工单
 * 自动写入当前用户身份，不允许前端 payload 覆盖 submitter_id、tenant_id、school_id
 */
export function createHelpTicketApi(payload, currentUser) {
  const { tenantId, userId, schoolId } = currentUser

  const ticketData = {
    tenant_id: Number(tenantId),
    school_id: Number(schoolId),
    submitter_id: Number(userId),
    title: payload.title,
    content: payload.content,
    category: payload.category,
    priority: payload.priority || 'normal',
    status: 'pending',
    attachment_file_ids: payload.attachment_file_ids || [],
  }

  return request.post('/helpTickets', ticketData).then(res => unwrapData(res, null))
}

/**
 * 关闭帮助工单
 * 只能关闭自己提交的且状态为 replied 的工单
 */
export function closeHelpTicketApi(ticketId, currentUser) {
  const { userId } = currentUser

  return request.get('/helpTickets', {
    params: { id: ticketId },
  }).then(res => {
    const tickets = unwrapData(res)
    const ticket = tickets.find(t => String(t.id) === String(ticketId))
    if (!ticket) throw new Error('工单不存在')
    if (String(ticket.submitter_id) !== String(userId)) throw new Error('无权操作该工单')
    if (ticket.status !== 'replied') throw new Error('只能关闭已回复的工单')

    return request.patch(`/helpTickets/${ticketId}`, {
      status: 'closed',
      updated_at: new Date().toISOString(),
    }).then(r => unwrapData(r, null))
  })
}
