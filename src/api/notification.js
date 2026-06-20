import request from '@/request'

/**
 * 获取通知列表（基于 tenant_id + user_id / target_roles 过滤）
 * @param {Object} context - { tenantId, userId, role }
 * @param {Object} params - 额外查询参数
 */
export function getNotificationsApi(context, params = {}) {
  const { tenantId, userId, role } = context
  return request.get('/notifications', {
    params: {
      tenant_id: tenantId,
      deleted: false,
      _sort: 'created_at',
      _order: 'desc',
      ...params,
    }
  }).then(res => {
    const list = res.data || []
    // 客户端过滤：receiver_user_id = userId 或 target_roles 包含当前角色
    return list.filter(n => {
      if (n.receiver_user_id && n.receiver_user_id !== userId) return false
      if (!n.receiver_user_id && n.target_roles) {
        const roles = typeof n.target_roles === 'string'
          ? n.target_roles.split(',').map(r => r.trim())
          : n.target_roles
        if (role && !roles.includes(role)) return false
      }
      return true
    })
  })
}

/**
 * 获取未读通知数量
 */
export function getUnreadCountApi(context) {
  return getNotificationsApi(context, { read_status: 'unread' })
    .then(list => list.length)
}

/**
 * 标记单条通知为已读
 */
export function markNotificationReadApi(id) {
  return request.patch(`/notifications/${id}`, {
    read_status: 'read',
    updated_at: new Date().toISOString(),
  }).then(res => res.data)
}

/**
 * 标记所有通知为已读（逐条 PATCH，json-server 不支持批量）
 */
export function markAllNotificationsReadApi(context) {
  return getNotificationsApi(context, { read_status: 'unread' })
    .then(unreadList => {
      const now = new Date().toISOString()
      return Promise.all(
        unreadList.map(n =>
          request.patch(`/notifications/${n.id}`, { read_status: 'read', updated_at: now })
        )
      )
    })
}

/**
 * 获取单条通知详情
 */
export function getNotificationByIdApi(id) {
  return request.get(`/notifications/${id}`).then(res => res.data)
}
