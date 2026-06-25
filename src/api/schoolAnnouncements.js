import request from '@/request'

export const announcementStatusMap = {
  draft: '草稿',
  published: '已发布',
  offline: '已下线',
}

export const announcementStatusTagMap = {
  draft: 'info',
  published: 'success',
  offline: 'warning',
}

export const announcementTagOptions = [
  '评价安排',
  '教学评价',
  '服务评价',
  '评价规则',
  '系统公告',
]

export const announcementRoleOptions = [
  { value: 'student', label: '学生' },
  { value: 'staff', label: '教职工' },
]

function toList(res) {
  return Array.isArray(res) ? res : (res?.data || [])
}

function toItem(res) {
  return res?.data || res || null
}

function normalizeContext(context = {}) {
  return {
    tenantId: Number(context.tenantId || context.tenant_id),
    schoolId: Number(context.schoolId || context.school_id || context.tenantId || context.tenant_id),
    userId: Number(context.userId || context.user_id || context.id) || null,
  }
}

function parseRoles(value) {
  if (Array.isArray(value)) return value
  if (!value) return []
  return String(value).split(',').map(item => item.trim()).filter(Boolean)
}

function serializeRoles(value) {
  return parseRoles(value).join(',')
}

function formatAnnouncement(item, fileMap = {}) {
  const coverFile = item.cover_file_id ? fileMap[item.cover_file_id] : null
  return {
    ...item,
    target_role_list: parseRoles(item.target_roles),
    target_role_text: parseRoles(item.target_roles).map(role => role === 'student' ? '学生' : role === 'staff' ? '教职工' : role).join('、') || '全部',
    status_text: announcementStatusMap[item.status] || item.status,
    status_type: announcementStatusTagMap[item.status] || 'info',
    _cover_url: coverFile?.url || '',
  }
}

async function writeLog(context, action, targetId, detail) {
  const { tenantId, schoolId, userId } = normalizeContext(context)
  const now = new Date().toISOString()
  try {
    await request.post('/operationLogs', {
      tenant_id: tenantId,
      school_id: schoolId,
      user_id: userId,
      operator_id: userId,
      module: 'announcement',
      action,
      target_type: 'announcement',
      target_id: Number(targetId),
      result: 'success',
      detail,
      content: detail,
      created_at: now,
      updated_at: now,
      deleted: false,
    })
  } catch {
    // 日志失败不阻断公告主流程
  }
}

async function getFileMap(tenantId) {
  const res = await request.get('/fileResources', { params: { tenant_id: tenantId, deleted: false } })
  return Object.fromEntries(toList(res).filter(item => !item.deleted).map(item => [item.id, item]))
}

function applyFilters(list, filters = {}) {
  let data = [...list]
  const keyword = filters.keyword?.trim().toLowerCase()
  if (keyword) {
    data = data.filter(item =>
      item.title?.toLowerCase().includes(keyword) ||
      item.summary?.toLowerCase().includes(keyword) ||
      item.content?.toLowerCase().includes(keyword)
    )
  }
  if (filters.tag && filters.tag !== 'all') {
    data = data.filter(item => item.tag === filters.tag)
  }
  if (filters.status && filters.status !== 'all') {
    data = data.filter(item => item.status === filters.status)
  }
  data.sort((a, b) => new Date(b.publish_time || b.updated_at || b.created_at) - new Date(a.publish_time || a.updated_at || a.created_at))
  return data
}

export async function getSchoolAnnouncementListApi(context, filters = {}) {
  const { tenantId, schoolId } = normalizeContext(context)
  const page = Number(filters.page || 1)
  const pageSize = Number(filters.pageSize || 10)
  const [listRes, fileMap] = await Promise.all([
    request.get('/announcements', { params: { tenant_id: tenantId, deleted: false } }),
    getFileMap(tenantId),
  ])
  const all = toList(listRes)
    .filter(item => !item.deleted && Number(item.tenant_id) === tenantId && (!item.school_id || Number(item.school_id) === schoolId))
    .map(item => formatAnnouncement(item, fileMap))
  const filtered = applyFilters(all, filters)
  const total = filtered.length
  const start = (page - 1) * pageSize
  return {
    list: filtered.slice(start, start + pageSize),
    total,
    page,
    pageSize,
  }
}

export async function getSchoolAnnouncementStatsApi(context, filters = {}) {
  const { tenantId, schoolId } = normalizeContext(context)
  const res = await request.get('/announcements', { params: { tenant_id: tenantId, deleted: false } })
  const list = applyFilters(toList(res).filter(item =>
    !item.deleted &&
    Number(item.tenant_id) === tenantId &&
    (!item.school_id || Number(item.school_id) === schoolId)
  ), { ...filters, status: 'all' })
  return {
    total: list.length,
    draft: list.filter(item => item.status === 'draft').length,
    published: list.filter(item => item.status === 'published').length,
    offline: list.filter(item => item.status === 'offline').length,
  }
}

export async function getSchoolAnnouncementDetailApi(context, id) {
  const { tenantId, schoolId } = normalizeContext(context)
  const [res, fileMap] = await Promise.all([
    request.get(`/announcements/${id}`),
    getFileMap(tenantId),
  ])
  const item = toItem(res)
  if (!item || item.deleted || Number(item.tenant_id) !== tenantId || (item.school_id && Number(item.school_id) !== schoolId)) {
    return null
  }
  return formatAnnouncement(item, fileMap)
}

export async function getSchoolAnnouncementCoverOptionsApi(context) {
  const { tenantId } = normalizeContext(context)
  const res = await request.get('/fileResources', { params: { tenant_id: tenantId, deleted: false } })
  return toList(res)
    .filter(item => !item.deleted && item.url && (item.mime_type?.startsWith?.('image/') || /\.(png|jpg|jpeg|webp|gif)$/i.test(item.url) || item.url.includes('picsum.photos')))
    .map(item => ({ ...item, label: item.original_name || item.name || `图片 ${item.id}` }))
}

export async function createSchoolAnnouncementApi(context, payload) {
  const { tenantId, schoolId, userId } = normalizeContext(context)
  const now = new Date().toISOString()
  const body = {
    tenant_id: tenantId,
    school_id: schoolId,
    title: payload.title,
    summary: payload.summary || '',
    content: payload.content,
    tag: payload.tag,
    cover_file_id: payload.cover_file_id ? Number(payload.cover_file_id) : null,
    target_roles: serializeRoles(payload.target_roles),
    status: payload.status || 'draft',
    publish_time: payload.status === 'published' ? now : (payload.publish_time || null),
    publisher_id: payload.status === 'published' ? userId : null,
    created_at: now,
    updated_at: now,
    deleted: false,
  }
  const res = await request.post('/announcements', body)
  const created = toItem(res)
  await writeLog(context, body.status === 'published' ? 'publish_announcement' : 'create_announcement', created?.id, `${body.status === 'published' ? '发布' : '创建'}公告：${body.title}`)
  return created
}

export async function updateSchoolAnnouncementApi(context, id, payload) {
  const now = new Date().toISOString()
  const body = {
    title: payload.title,
    summary: payload.summary || '',
    content: payload.content,
    tag: payload.tag,
    cover_file_id: payload.cover_file_id ? Number(payload.cover_file_id) : null,
    target_roles: serializeRoles(payload.target_roles),
    updated_at: now,
  }
  await request.patch(`/announcements/${id}`, body)
  await writeLog(context, 'update_announcement', id, `编辑公告：${payload.title}`)
  return { success: true }
}

export async function publishSchoolAnnouncementApi(context, id) {
  const { userId } = normalizeContext(context)
  const now = new Date().toISOString()
  const detail = await getSchoolAnnouncementDetailApi(context, id)
  await request.patch(`/announcements/${id}`, {
    status: 'published',
    publish_time: now,
    publisher_id: userId,
    updated_at: now,
  })
  await writeLog(context, 'publish_announcement', id, `发布公告：${detail?.title || id}`)
  return { success: true }
}

export async function offlineSchoolAnnouncementApi(context, id) {
  const now = new Date().toISOString()
  const detail = await getSchoolAnnouncementDetailApi(context, id)
  await request.patch(`/announcements/${id}`, {
    status: 'offline',
    updated_at: now,
  })
  await writeLog(context, 'offline_announcement', id, `下线公告：${detail?.title || id}`)
  return { success: true }
}

export async function deleteSchoolAnnouncementApi(context, id) {
  const now = new Date().toISOString()
  const detail = await getSchoolAnnouncementDetailApi(context, id)
  if (detail?.status === 'published') throw new Error('已发布公告需先下线后再删除')
  await request.patch(`/announcements/${id}`, {
    deleted: true,
    updated_at: now,
  })
  await writeLog(context, 'delete_announcement', id, `删除公告：${detail?.title || id}`)
  return { success: true }
}
