import request from '@/request'

function toList(res) {
  return Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
}

function toItem(res) {
  return res?.data || res || null
}

function roleVisible(item, role) {
  const roles = Array.isArray(item.target_roles)
    ? item.target_roles
    : String(item.target_roles || '').split(',').map(value => value.trim()).filter(Boolean)
  return roles.length === 0 || roles.includes(role)
}

/**
 * 获取正式校园公告列表。
 * 从真实公告表读取已发布公告。
 */
export function getAnnouncementsApi(tenantId, role) {
  return request.get('/announcements', {
    params: {
      status: 'published',
    },
  }).then(res => {
    return toList(res).filter(n => !n.deleted && roleVisible(n, role))
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
      status: 'published',
    },
  }).then(res => {
    return toList(res)
      .filter(n => n.id !== excludeId && !n.deleted && (!tag || n.tag === tag))
      .slice(0, limit)
  })
}
