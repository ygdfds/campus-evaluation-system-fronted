import request from '@/request'

// ==================== 映射表 ====================

const moduleMap = {
  audit: '审核',
  announcement: '公告',
  user: '用户',
  org: '组织',
  help: '帮助',
  form: '表单',
  complaint: '投诉',
  system: '系统',
  trace: '追溯',
  appeal: '申诉',
}

const actionMap = {
  create: '新增',
  edit: '编辑',
  delete: '删除',
  approve: '审核',
  publish: '发布',
  offline: '下线',
  reply: '回复',
  close: '关闭',
  reject: '驳回',
  import: '导入',
  approve_trace: '授权通过',
  reject_trace: '授权拒绝',
}

const resultMap = {
  success: '成功',
  failed: '失败',
}

// ==================== 辅助函数 ====================

function resolveProfileName(profileMap, userId) {
  if (!userId) return '系统'
  const p = profileMap[userId]
  return p?.real_name || '未知用户'
}

// ==================== 公开 API ====================

/**
 * 获取学校操作日志列表
 */
export async function getSchoolOperationLogsApi(tenantId, filters = {}) {
  const [logsRes, profilesRes] = await Promise.all([
    request.get('/operationLogs', { params: { tenant_id: tenantId } }),
    request.get('/personProfiles', { params: { deleted: false } }),
  ])

  let logs = (logsRes.data || []).filter(l => !l.deleted && l.school_id)
  const profiles = (profilesRes.data || []).filter(p => !p.deleted)
  const profileMap = {}
  profiles.forEach(p => { profileMap[p.user_id] = p })

  // 模块筛选
  if (filters.module && filters.module !== 'all') {
    logs = logs.filter(l => l.module === filters.module)
  }
  // 操作类型筛选
  if (filters.action && filters.action !== 'all') {
    logs = logs.filter(l => l.action === filters.action)
  }
  // 时间筛选
  if (filters.dateRange && filters.dateRange.length === 2) {
    const [start, end] = filters.dateRange
    logs = logs.filter(l => {
      const t = new Date(l.created_at)
      return t >= new Date(start) && t <= new Date(end + 'T23:59:59')
    })
  }
  // 搜索
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    logs = logs.filter(l => {
      const operator = resolveProfileName(profileMap, l.user_id)
      return (
        operator.toLowerCase().includes(kw) ||
        (l.target_name || '').toLowerCase().includes(kw) ||
        (l.content || '').toLowerCase().includes(kw) ||
        (moduleMap[l.module] || '').includes(kw)
      )
    })
  }

  // 排序：最新优先
  logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return logs.map(l => ({
    id: l.id,
    created_at: l.created_at,
    operator_name: resolveProfileName(profileMap, l.user_id),
    operator_id: l.user_id,
    module: moduleMap[l.module] || l.module || '-',
    module_code: l.module || '',
    action: actionMap[l.action] || l.action || '-',
    action_code: l.action || '',
    target_type: l.target_type || '-',
    target_id: l.target_id,
    target_name: l.target_name || '-',
    content: l.content || '',
    result: resultMap[l.result] || l.result || '成功',
    result_code: l.result || 'success',
    ip: l.ip || '-',
    device: l.device || '-',
  }))
}

/**
 * 获取操作日志统计
 */
export async function getSchoolOperationLogSummaryApi(tenantId) {
  const [logsRes] = await Promise.all([
    request.get('/operationLogs', { params: { tenant_id: tenantId } }),
  ])
  const logs = (logsRes.data || []).filter(l => !l.deleted && l.school_id)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  return {
    total: logs.length,
    today: logs.filter(l => new Date(l.created_at) >= todayStart).length,
    month: logs.filter(l => new Date(l.created_at) >= monthStart).length,
  }
}
