import request from '@/request'

/**
 * 获取入驻套餐列表
 */
export function getOnboardingPlansApi() {
  return request.get('/platform/public/plans')
}

/**
 * 提交学校入驻申请
 * @param {object} data - 申请信息
 */
export function submitOnboardingApi(data) {
  return request.post('/platform/public/onboarding/applications', {
    planId: data.planId,
    schoolFullName: data.schoolFullName || data.schoolName,
    schoolName: data.schoolName || data.schoolFullName,
    schoolCreditCode: data.schoolCreditCode || data.creditCode,
    contactName: data.contactName,
    contactPhone: data.contactPhone,
    contactEmail: data.contactEmail,
    submitReason: data.submitReason || data.reason,
    reason: data.reason || data.submitReason,
  })
}

/**
 * 获取部门列表（按 schoolId 过滤）
 * @param {number} schoolId - 学校ID
 */
export function getDepartmentsApi(schoolId) {
  return request.get('/departments', { params: { schoolId } })
}

/**
 * 获取学校档案信息（仅展示非敏感字段）
 * @param {number} tenantId - 租户ID
 */
export function getSchoolProfileApi() {
  return request.get('/school/profile/current')
}

export function updateSchoolProfileApi(data) {
  return request.put('/school/profile/current', data)
}
