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

/**
 * 获取学校档案信息（仅展示非敏感字段）
 * @param {number} tenantId - 租户ID
 */
export async function getSchoolProfileApi(tenantId) {
  const [tenantsRes, profilesRes] = await Promise.all([
    request.get('/tenants', { params: { deleted: false } }),
    request.get('/schoolProfiles', { params: { tenant_id: tenantId, deleted: false } }),
  ])

  // 客户端精确过滤，确保只取当前租户数据
  const tid = Number(tenantId)
  const tenant = (tenantsRes.data || []).find(t => Number(t.id) === tid && !t.deleted)
  const profile = (profilesRes.data || [])[0]

  if (!tenant) return null

  return {
    schoolName: tenant.school_name || profile?.name || '',
    address: profile?.address || '',
    website: profile?.website || '',
    intro: profile?.intro || '',
    logoFileId: profile?.logo_file_id || null,
    coverFileId: profile?.cover_file_id || null,
    status: tenant.status || '',
    createdAt: tenant.created_at || '',
  }
}
