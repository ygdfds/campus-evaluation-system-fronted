import request from '@/request'

/**
 * 获取公告列表（按租户和角色过滤）
 */
export function getAnnouncementsApi(tenantId, role) {
  return request.get('/notifications', {
    params: { tenant_id: tenantId, status: 'published', _sort: 'publish_time', _order: 'desc' }
  }).then(res => {
    const list = res.data || []
    return list.filter(n => {
      if (n.deleted) return false
      if (!n.target_roles) return true
      return n.target_roles.split(',').map(r => r.trim()).includes(role)
    })
  })
}

/**
 * 获取公告详情
 */
export function getAnnouncementDetailApi(id) {
  return request.get(`/notifications/${id}`).then(res => res.data)
}

/**
 * 获取同类型相关公告（排除当前公告）
 */
export function getRelatedAnnouncementsApi(tenantId, noticeType, excludeId, limit = 3) {
  return request.get('/notifications', {
    params: { tenant_id: tenantId, status: 'published', notice_type: noticeType, _sort: 'publish_time', _order: 'desc' }
  }).then(res => {
    const list = (res.data || []).filter(n => n.id !== excludeId && !n.deleted)
    return list.slice(0, limit)
  })
}
