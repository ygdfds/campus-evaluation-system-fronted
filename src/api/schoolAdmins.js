import request from '@/request'

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

function unwrapData(response) {
  return response?.data ?? response
}

function pageRecords(response) {
  const data = unwrapData(response) || {}
  return data.records || data.list || []
}

function toAdmin(user) {
  const roleCodes = user.roleCodes || []
  const isPrimary = roleCodes.includes('school_admin_primary') || user.isPrimary || false
  const adminType = isPrimary ? 'initial_admin' : 'sub_admin'
  const status = user.status || 'active'
  return {
    ...user,
    real_name: user.realName,
    user_id: user.id,
    account_status: status,
    admin_type: adminType,
    is_primary: isPrimary,
    role_tag: adminTypeMap[adminType],
    avatar_file_id: user.avatarFileId,
    avatar_url: user.avatarUrl || '',
    last_login_at: user.lastLoginAt || '-',
    created_at: user.createdAt,
    updated_at: user.updatedAt,
    creator_name: user.creatorName || '-',
    account: {
      id: user.id,
      user_id: user.id,
      username: user.username,
      phone: user.phone,
      email: user.email,
      account_status: status,
      last_login_at: user.lastLoginAt || '-',
    },
  }
}

export async function getSchoolAdminListApi() {
  return pageRecords(await request.get('/school/admin-users', { params: { pageNum: 1, pageSize: 500 } })).map(toAdmin)
}

export async function getSchoolAdminDetailApi(_tenantId, id) {
  return toAdmin(unwrapData(await request.get(`/school/admin-users/${id}`)))
}

export async function createSchoolAdminApi(_tenantId, payload) {
  return toAdmin(unwrapData(await request.post('/school/admin-users', {
    username: payload.username,
    password: payload.password,
    realName: payload.real_name,
    phone: payload.phone,
    email: payload.email,
    avatarFileId: payload.avatar_file_id || payload.avatarFileId,
  })))
}

export function updateSchoolAdminApi(_tenantId, id, payload) {
  return request.put(`/school/admin-users/${id}`, {
    realName: payload.real_name,
    phone: payload.phone,
    email: payload.email,
    avatarFileId: payload.avatar_file_id || payload.avatarFileId,
  })
}

export function toggleSchoolAdminStatusApi(_tenantId, id, status) {
  return request.put(`/school/admin-users/${id}/status`, { status })
}

export function deleteSchoolAdminApi(_tenantId, id) {
  return toggleSchoolAdminStatusApi(_tenantId, id, 'disabled')
}

export function resetSchoolAdminPasswordApi(_tenantId, id, newPassword) {
  return request.put(`/school/admin-users/${id}/reset-password`, { newPassword })
}

export function getSchoolAdminLogsApi() {
  return Promise.resolve([])
}
