import request from '@/request'

function toList(res) {
  return Array.isArray(res) ? res : (res?.data || [])
}

function toItem(res) {
  return res?.data || res || null
}

function roleVisible(item, role) {
  if (!item.target_roles) return true
  return item.target_roles.split(',').map(r => r.trim()).includes(role)
}

/**
 * 获取正式校园公告列表。
 * 公告已从 notifications 中拆出，这里只读取 announcements。
 */
export function getAnnouncementsApi(tenantId, role) {
  return request.get('/announcements', {
    params: {
      tenant_id: tenantId,
      status: 'published',
      deleted: false,
      _sort: 'publish_time',
      _order: 'desc',
    },
  }).then(res => {
    return toList(res).filter(n => !n.deleted && n.status === 'published' && roleVisible(n, role))
  })
}

/**
 * 获取公告详情。
 */
export function getAnnouncementDetailApi(id) {
  return request.get(`/announcements/${id}`).then(toItem)
}

/**
 * 获取同分类相关公告。
 */
export function getRelatedAnnouncementsApi(tenantId, tag, excludeId, limit = 3) {
  return request.get('/announcements', {
    params: {
      tenant_id: tenantId,
      status: 'published',
      tag,
      deleted: false,
      _sort: 'publish_time',
      _order: 'desc',
    },
  }).then(res => {
    return toList(res).filter(n => n.id !== excludeId && !n.deleted).slice(0, limit)
  })
}
