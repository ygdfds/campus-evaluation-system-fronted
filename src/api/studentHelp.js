import request from '@/request'

/**
 * 学生端帮助中心 API
 *
 * 数据来源：helpFaqs / helpGuides 集合
 * 查询条件：tenant_id + enabled=true + deleted=false
 */

/**
 * 获取学生端帮助中心首页数据（FAQ + 操作指引）
 */
export function getStudentHelpHomeApi(params, currentUser) {
  const { tenantId } = currentUser
  const keyword = params?.keyword || ''

  const guideParams = { tenant_id: tenantId, enabled: true, _sort: 'sort_order', _order: 'asc' }
  const faqParams = { tenant_id: tenantId, enabled: true, _sort: 'sort_order', _order: 'asc' }

  return Promise.all([
    request.get('/helpGuides', { params: guideParams }).catch(() => ({ data: [] })),
    request.get('/helpFaqs', { params: faqParams }).catch(() => ({ data: [] })),
  ]).then(([guideRes, faqRes]) => {
    let guides = Array.isArray(guideRes) ? guideRes : (guideRes?.data || [])
    let faqs = Array.isArray(faqRes) ? faqRes : (faqRes?.data || [])

    // 过滤未删除
    guides = guides.filter(g => !g.deleted)
    faqs = faqs.filter(f => !f.deleted)

    // 关键词搜索
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

    return { guides, faqs }
  })
}

/**
 * 获取学生端常见问题列表
 */
export function getStudentHelpFaqsApi(params, currentUser) {
  const { tenantId } = currentUser
  const queryParams = {
    tenant_id: tenantId,
    enabled: true,
    _sort: 'sort_order',
    _order: 'asc',
  }
  if (params?.category) queryParams.category = params.category

  return request.get('/helpFaqs', { params: queryParams }).then(res => {
    let faqs = Array.isArray(res) ? res : (res?.data || [])
    faqs = faqs.filter(f => !f.deleted)
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
 * 获取学生端操作指引列表
 */
export function getStudentHelpGuidesApi(params, currentUser) {
  const { tenantId } = currentUser
  const queryParams = {
    tenant_id: tenantId,
    enabled: true,
    _sort: 'sort_order',
    _order: 'asc',
  }

  return request.get('/helpGuides', { params: queryParams }).then(res => {
    let guides = Array.isArray(res) ? res : (res?.data || [])
    guides = guides.filter(g => !g.deleted)
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
