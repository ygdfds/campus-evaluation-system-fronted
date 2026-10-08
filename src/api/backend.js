export function dataOf(res) {
  if (res && typeof res === 'object' && 'data' in res) return res.data
  return res
}

export function responseData(res) {
  return dataOf(res)
}

export function pageOf(res) {
  const data = dataOf(res) || {}
  const records = data.records || data.list || (Array.isArray(data) ? data : [])
  return {
    ...data,
    records,
    list: records,
    total: data.total ?? records.length,
    page: data.page ?? data.pageNum ?? 1,
    pageNum: data.pageNum ?? data.page ?? 1,
    pageSize: data.pageSize ?? records.length,
  }
}

export function listOf(res) {
  return pageOf(res).list
}

export async function getList(request, url, params) {
  return listOf(await request.get(url, { params: compactParams(params) }))
}

export async function getPage(request, url, params) {
  return pageOf(await request.get(url, { params: compactParams(params) }))
}

export function compactParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )
}

export function firstValue(source, keys, fallback = null) {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null && source?.[key] !== '') {
      return source[key]
    }
  }
  return fallback
}

export function normalizeUser(item = {}) {
  const roleType = firstValue(item, ['roleType', 'role_type'], '')
  const roleCodes = item.roleCodes || item.role_codes || (roleType ? [roleType] : [])
  return {
    ...item,
    id: item.id,
    user_id: item.id,
    tenant_id: firstValue(item, ['tenantId', 'tenant_id']),
    school_id: firstValue(item, ['schoolId', 'school_id']),
    real_name: firstValue(item, ['realName', 'real_name'], ''),
    username: item.username || '',
    role_type: roleType || roleCodes[0] || '',
    roleCodes,
    role_names: item.roleNames || item.role_names || [],
    phone: item.phone || '',
    email: item.email || '',
    account_status: item.status || item.account_status || 'active',
    status: item.status || item.account_status || 'active',
    avatar_file_id: firstValue(item, ['avatarFileId', 'avatar_file_id']),
    last_login_at: firstValue(item, ['lastLoginAt', 'last_login_at'], ''),
    created_at: firstValue(item, ['createdAt', 'created_at'], ''),
    updated_at: firstValue(item, ['updatedAt', 'updated_at'], ''),
    no_work: firstValue(item, ['staffNo', 'staff_no', 'no_work'], ''),
    staff_no: firstValue(item, ['staffNo', 'staff_no', 'no_work'], ''),
    no_student: firstValue(item, ['studentNo', 'student_no', 'no_student'], ''),
    student_no: firstValue(item, ['studentNo', 'student_no', 'no_student'], ''),
    teaching_org_id: firstValue(item, ['teachingOrgId', 'teaching_org_id']),
    teaching_org_name: firstValue(item, ['teachingOrgName', 'teaching_org_name'], ''),
    service_org_id: firstValue(item, ['serviceOrgId', 'service_org_id']),
    service_org_name: firstValue(item, ['serviceOrgName', 'service_org_name'], ''),
    class_id: firstValue(item, ['classId', 'class_id']),
    class_name: firstValue(item, ['className', 'class_name'], ''),
    grade: item.grade || '',
    account: {
      id: item.id,
      username: item.username || '',
      phone: item.phone || '',
      email: item.email || '',
      account_status: item.status || 'active',
      last_login_at: firstValue(item, ['lastLoginAt', 'last_login_at'], ''),
    },
  }
}
