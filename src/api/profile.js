import request from '@/request'
import { dataOf } from '@/api/backend'

function normalizeCurrentUser(user = {}) {
  return {
    ...user,
    id: user.userId || user.id,
    user_id: user.userId || user.user_id || user.id,
    real_name: user.realName || user.real_name || '',
    role_type: user.roleType || user.role_type || user.userType || '',
    tenant_id: user.tenantId || user.tenant_id,
    school_id: user.schoolId || user.school_id,
    avatar_url: user.avatarUrl || user.avatar_url || '',
    created_at: user.createdAt || user.created_at || '',
    status: user.status || 'active',
  }
}

export function getUserAccountApi() {
  return request.get('/auth/me').then(dataOf).then(normalizeCurrentUser)
}

export function getPersonProfileApi() {
  return request.get('/auth/me').then(dataOf).then(normalizeCurrentUser)
}

export function getSchoolProfileApi() {
  return request.get('/school/profile/current').then(dataOf)
}

export function getLoginLogsApi() {
  return request.get('/auth/login-logs').then(dataOf)
}

export function updatePersonProfileApi(profileId, data) {
  return request.put('/school/profile/current', data).then(dataOf)
}

export function updateUserAccountApi(accountId, data) {
  return request.put('/auth/me', data).then(dataOf)
}

export function updatePasswordApi(accountId, oldPassword, newPassword) {
  return request.post('/auth/change-password', {
    oldPassword,
    newPassword,
    confirmPassword: newPassword,
  }).then(dataOf)
}

export function updateAvatarApi(profileId, fileId) {
  return request.put('/auth/me', { avatarFileId: fileId }).then(dataOf)
}

export function createFileResourceApi(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('bizType', 'avatar')
  return request.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(dataOf)
}
