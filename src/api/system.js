import request from '@/request'

/**
 * 获取租户列表
 */
export function getTenantsApi(params) {
  return request.get('/tenants', { params })
}

/**
 * 获取入驻申请列表
 */
export function getOnboardingApplicationsApi(params) {
  return request.get('/onboarding-applications', { params })
}

/**
 * 审核入驻申请
 * @param {number} id - 申请ID
 * @param {string} action - 'approved' | 'rejected'
 * @param {string} reason - 审核意见
 */
export function auditOnboardingApi(id, action, reason) {
  return request.post(`/onboarding-applications/${id}/audit`, { action, reason })
}

/**
 * 获取平台管理员列表（用户管理）
 */
export function getSystemAdminsApi(params) {
  return request.get('/system-admins', { params })
}

/**
 * 获取系统角色列表（角色管理）
 */
export function getSystemRolesApi(params) {
  return request.get('/system-roles', { params })
}

/**
 * 获取套餐列表（套餐管理）
 */
export function getTenantPlansApi(params) {
  return request.get('/tenant-plans', { params })
}
