import request from '@/request'

/**
 * 职工端消息通知 API
 *
 * 所有查询均基于 tenant_id + receiver_user_id + deleted 过滤。
 */

// ==================== 常量 ====================

export const NOTIFICATION_TYPE_MAP = {
  todo: '待办提醒',
  business: '业务通知',
  system: '系统通知',
  audit: '审核通知',
  security: '安全提醒',
}

export const NOTIFICATION_BIZ_TYPE_MAP = {
  feedback: '反馈处理',
  appeal: '申诉处理',
  evaluation_form: '评价管理',
  trace_authorization: '追溯授权',
  account: '账号安全',
  system: '系统消息',
}

export const NOTIFICATION_PRIORITY_MAP = {
  normal: '普通',
  important: '重要',
  urgent: '紧急',
}

// ==================== 查询类 API ====================

/**
 * 获取职工通知列表
 */
export function getStaffNotificationListApi(currentUser, filters = {}) {
  const { tenantId, userId } = currentUser
  const {
    keyword = '',
    type = 'all',
    businessType = 'all',
    readStatus = 'all',
    priority = 'all',
    timeRange = 'all',
    startDate = '',
    endDate = '',
    sort = 'latest',
    page = 1,
    pageSize = 10,
  } = filters

  return request.get('/notifications', {
    params: {
      tenant_id: tenantId,
      receiver_user_id: userId,
      deleted: false,
      _sort: 'created_at',
      _order: 'desc',
    },
  }).then(res => {
    // 客户端二次过滤：做 String/Number 类型兼容，避免类型不一致导致数据丢失
    const strTenant = String(tenantId)
    const strUser = String(userId)
    let list = (res.data || []).filter(n => {
      if (n.deleted) return false
      if (String(n.tenant_id) !== strTenant) return false
      if (String(n.receiver_user_id) !== strUser) return false
      return true
    })

    // 关键词搜索
    if (keyword && keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      list = list.filter(n =>
        (n.title && n.title.toLowerCase().includes(kw)) ||
        (n.content && n.content.toLowerCase().includes(kw)) ||
        (n.business_type && n.business_type.toLowerCase().includes(kw))
      )
    }

    // 类型筛选
    if (type && type !== 'all') {
      list = list.filter(n => n.type === type)
    }

    // 业务来源筛选
    if (businessType && businessType !== 'all') {
      list = list.filter(n => n.business_type === businessType)
    }

    // 阅读状态筛选
    if (readStatus && readStatus !== 'all') {
      list = list.filter(n => n.read_status === readStatus)
    }

    // 优先级筛选
    if (priority && priority !== 'all') {
      list = list.filter(n => n.priority === priority)
    }

    // 时间范围筛选
    if (timeRange && timeRange !== 'all') {
      const now = new Date()
      if (timeRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 86400000)
        list = list.filter(n => new Date(n.created_at) >= weekAgo)
      } else if (timeRange === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        list = list.filter(n => new Date(n.created_at) >= monthStart)
      } else if (timeRange === 'custom' && startDate && endDate) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        list = list.filter(n => {
          const d = new Date(n.created_at)
          return d >= start && d <= end
        })
      }
    }

    // 排序
    switch (sort) {
      case 'unread_first':
        list.sort((a, b) => {
          if (a.read_status === b.read_status) return new Date(b.created_at) - new Date(a.created_at)
          return a.read_status === 'unread' ? -1 : 1
        })
        break
      case 'priority': {
        const order = { urgent: 0, important: 1, normal: 2 }
        list.sort((a, b) => (order[a.priority] ?? 2) - (order[b.priority] ?? 2))
        break
      }
      case 'latest_update':
        list.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
        break
      default: // latest
        list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }

    // 统计（同样做类型兼容）
    const allList = (res.data || []).filter(n => {
      if (n.deleted) return false
      if (String(n.tenant_id) !== strTenant) return false
      if (String(n.receiver_user_id) !== strUser) return false
      return true
    })
    const summary = {
      total: allList.length,
      unread: allList.filter(n => n.read_status === 'unread').length,
      read: allList.filter(n => n.read_status === 'read').length,
      todo: allList.filter(n => n.type === 'todo').length,
      business: allList.filter(n => n.type === 'business').length,
      system: allList.filter(n => n.type === 'system' || n.type === 'security').length,
      urgent: allList.filter(n => n.priority === 'urgent').length,
    }

    // 分页
    const total = list.length
    const start = (page - 1) * pageSize
    const pagedList = list.slice(start, start + pageSize)

    return { list: pagedList, total, page, pageSize, summary }
  })
}

/**
 * 获取通知统计摘要
 */
export function getStaffNotificationSummaryApi(currentUser) {
  const { tenantId, userId } = currentUser
  return request.get('/notifications', {
    params: {
      tenant_id: tenantId,
      receiver_user_id: userId,
      deleted: false,
    },
  }).then(res => {
    const strTenant = String(tenantId)
    const strUser = String(userId)
    const list = (res.data || []).filter(n => {
      if (n.deleted) return false
      if (String(n.tenant_id) !== strTenant) return false
      if (String(n.receiver_user_id) !== strUser) return false
      return true
    })
    return {
      total: list.length,
      unread: list.filter(n => n.read_status === 'unread').length,
      read: list.filter(n => n.read_status === 'read').length,
      todo: list.filter(n => n.type === 'todo').length,
      business: list.filter(n => n.type === 'business').length,
      system: list.filter(n => n.type === 'system' || n.type === 'security').length,
      urgent: list.filter(n => n.priority === 'urgent').length,
    }
  })
}

// ==================== 操作类 API ====================

/**
 * 标记单条通知为已读
 */
export function markStaffNotificationReadApi(notificationId) {
  return request.patch(`/notifications/${notificationId}`, {
    read_status: 'read',
    read_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).then(res => res.data)
}

/**
 * 标记当前用户所有未读通知为已读
 */
export function markAllStaffNotificationsReadApi(currentUser) {
  const { tenantId, userId } = currentUser
  return request.get('/notifications', {
    params: {
      tenant_id: tenantId,
      receiver_user_id: userId,
      read_status: 'unread',
      deleted: false,
    },
  }).then(res => {
    const strTenant = String(tenantId)
    const strUser = String(userId)
    const list = (res.data || []).filter(n => {
      if (n.deleted) return false
      if (String(n.tenant_id) !== strTenant) return false
      if (String(n.receiver_user_id) !== strUser) return false
      return true
    })
    const now = new Date().toISOString()
    return Promise.all(
      list.map(n =>
        request.patch(`/notifications/${n.id}`, {
          read_status: 'read',
          read_at: now,
          updated_at: now,
        })
      )
    )
  })
}

/**
 * 逻辑删除单条通知
 */
export function deleteStaffNotificationApi(notificationId) {
  return request.patch(`/notifications/${notificationId}`, {
    deleted: true,
    updated_at: new Date().toISOString(),
  }).then(res => res.data)
}

/**
 * 逻辑删除当前用户所有已读通知
 */
export function batchDeleteReadStaffNotificationsApi(currentUser) {
  const { tenantId, userId } = currentUser
  return request.get('/notifications', {
    params: {
      tenant_id: tenantId,
      receiver_user_id: userId,
      read_status: 'read',
      deleted: false,
    },
  }).then(res => {
    const strTenant = String(tenantId)
    const strUser = String(userId)
    const list = (res.data || []).filter(n => {
      if (n.deleted) return false
      if (String(n.tenant_id) !== strTenant) return false
      if (String(n.receiver_user_id) !== strUser) return false
      return true
    })
    const now = new Date().toISOString()
    return Promise.all(
      list.map(n =>
        request.patch(`/notifications/${n.id}`, { deleted: true, updated_at: now })
      )
    )
  })
}
