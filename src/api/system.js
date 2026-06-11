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
