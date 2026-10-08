import request from '@/request'

/**
 * Get onboarding plans.
 */
export function getOnboardingPlansApi() {
  return request.get('/tenant-plans')
}

/**
 * Submit a school onboarding application.
 */
export function submitOnboardingApi(data) {
  return request.post('/schools/onboarding', data)
}

/**
 * Get departments for a school.
 */
export function getDepartmentsApi(schoolId) {
  return request.get('/departments', { params: { schoolId } })
}

/**
 * Get the current school profile from the real backend API.
 */
export async function getSchoolProfileApi(tenantId) {
  const res = await request.get('/school/profile/current')
  const profile = res.data || res || {}
  return {
    ...profile,
    intro: profile.intro || profile.description || '',
  }
}
