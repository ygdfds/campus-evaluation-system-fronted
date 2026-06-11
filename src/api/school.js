import request from '@/request'

/**
 * 获取入驻套餐列表
 */
export function getOnboardingPlansApi() {
  return request.get('/tenant-plans')
}

/**
 * 提交学校入驻申请
 * @param {object} data - 申请信息
 */
export function submitOnboardingApi(data) {
  return request.post('/schools/onboarding', data)
}

/**
 * 获取部门列表（按 schoolId 过滤）
 * @param {number} schoolId - 学校ID
 */
export function getDepartmentsApi(schoolId) {
  return request.get('/departments', { params: { schoolId } })
}
