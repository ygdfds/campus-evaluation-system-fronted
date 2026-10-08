import request from '@/request'
import { compactParams, dataOf, listOf, normalizeUser } from '@/api/backend'

export const adminTypeMap = {
  initial_admin: '初始管理员',
  sub_admin: '子管理员',
}

export const adminRoleTagMap = {
  true: '初始管理员',
  false: '子管理员',
}

export const adminStatusMap = {
  active: { label: '启用', type: 'success' },
  disabled: { label: '停用', type: 'danger' },
  locked: { label: '锁定', type: 'warning' },
}

function normalizeAdmin(item = {}) {
  const user = normalizeUser(item)
  const isPrimary = Boolean(item.isPrimary || item.is_primary)
  const adminType = item.adminType || item.admin_type || (isPrimary ? 'initial_admin' : 'sub_admin')
  return {
    ...user,
    _id: user.id,
    user_id: user.id,
    admin_type: adminType,
    is_primary: isPrimary,
    role_tag: adminTypeMap[adminType] || '子管理员',
    account_status: user.status || 'active',
    account_status_label: adminStatusMap[user.status]?.label || user.status,
    avatar_url: user.avatar_file_id ? `/api/files/${user.avatar_file_id}/preview` : '',
    creator_name: item.creatorName || item.creator_name || '-',
  }
}

function createPayload(payload = {}) {
  return compactParams({
    username: payload.username,
    password: payload.password || '123456',
    realName: payload.realName || payload.real_name,
    phone: payload.phone,
    email: payload.email,
    avatarFileId: payload.avatarFileId || payload.avatar_file_id,
  })
}

export async function getSchoolAdminListApi(tenantId, filters = {}) {
  const list = await request.get('/school/admin-users', {
    params: compactParams({
      keyword: filters.keyword,
      status: filters.status || filters.account_status,
      page: filters.page || 1,
      pageSize: filters.pageSize || 500,
    }),
  }).then(listOf)
  return list.map(normalizeAdmin)
}

export async function getSchoolAdminDetailApi(tenantId, profileId) {
  const data = await request.get(`/school/admin-users/${profileId}`).then(dataOf)
  return normalizeAdmin(data)
}

export async function createSchoolAdminApi(tenantId, payload) {
  const data = await request.post('/school/admin-users', createPayload(payload)).then(dataOf)
  return normalizeAdmin(data)
}

export async function toggleSchoolAdminStatusApi(tenantId, profileId, newStatus) {
  await request.put(`/school/admin-users/${profileId}/status`, { status: newStatus })
  return { account_status: newStatus }
}

export async function deleteSchoolAdminApi(tenantId, profileId) {
  await request.put(`/school/admin-users/${profileId}/status`, { status: 'disabled' })
  return { success: true }
}

export async function resetSchoolAdminPasswordApi(tenantId, profileId, newPassword) {
  await request.put(`/school/admin-users/${profileId}/reset-password`, {
    newPassword: newPassword || '123456',
  })
  return { success: true }
}

export async function getSchoolAdminLogsApi() {
  return []
}
