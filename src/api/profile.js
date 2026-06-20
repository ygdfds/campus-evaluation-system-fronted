import request from '@/request'

// ==================== 个人信息 - 读取 ====================

/**
 * 获取当前用户账号信息
 */
export function getUserAccountApi(userId) {
  return request.get(`/userAccounts/${userId}`).then(res => res.data)
}

/**
 * 获取当前用户人员档案
 */
export function getPersonProfileApi(tenantId, userId) {
  return request.get('/personProfiles', {
    params: { tenant_id: tenantId, user_id: userId, deleted: false }
  }).then(res => {
    const data = res.data || []
    return Array.isArray(data) ? data[0] || null : data
  })
}

/**
 * 获取学校信息
 */
export function getSchoolProfileApi(schoolId) {
  return request.get('/schoolProfiles', {
    params: { id: schoolId }
  }).then(res => {
    const data = res.data || []
    return Array.isArray(data) ? data[0] || null : data
  })
}

/**
 * 获取登录日志（仅当前用户）
 */
export function getLoginLogsApi(tenantId, userId, params = {}) {
  return request.get('/loginLogs', {
    params: {
      tenant_id: tenantId,
      user_id: userId,
      _sort: 'created_at',
      _order: 'desc',
      ...params,
    }
  }).then(res => res.data || [])
}

// ==================== 个人信息 - 写入 ====================

/**
 * 更新人员档案（基本信息）
 */
export function updatePersonProfileApi(profileId, data) {
  return request.patch(`/personProfiles/${profileId}`, data).then(res => res.data)
}

/**
 * 更新用户账号（手机号、邮箱等）
 */
export function updateUserAccountApi(accountId, data) {
  return request.patch(`/userAccounts/${accountId}`, data).then(res => res.data)
}

/**
 * 修改密码（mock：直接更新 password_hash 字段）
 */
export function updatePasswordApi(accountId, newPasswordHash) {
  return request.patch(`/userAccounts/${accountId}`, {
    password_hash: newPasswordHash,
    updated_at: new Date().toISOString(),
  }).then(res => res.data)
}

/**
 * 更新头像（mock：创建 fileResource 并更新 personProfile.avatar_file_id）
 */
export function updateAvatarApi(profileId, fileId) {
  return request.patch(`/personProfiles/${profileId}`, {
    avatar_file_id: fileId,
    updated_at: new Date().toISOString(),
  }).then(res => res.data)
}

/**
 * 新增文件资源（mock 头像上传）
 */
export function createFileResourceApi(data) {
  return request.post('/fileResources', data).then(res => res.data)
}
