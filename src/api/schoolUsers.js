import request from '@/request'

export const staffRoleTypeMap = {
  staff: '教职工',
  teaching_admin: '教学管理员',
  service_admin: '服务管理员',
  school_admin: '学校管理员',
  feedback_handler: '反馈处理员',
  form_publisher: '表单发布员',
  course_owner: '课程负责人',
}

export const genderMap = { male: '男', female: '女' }
export const accountStatusMap = { active: '启用', disabled: '停用', locked: '锁定' }

function unwrapData(response) {
  return response?.data ?? response
}

function pageRecords(response) {
  const data = unwrapData(response) || {}
  return data.records || data.list || []
}

function toSnakeUser(user, forcedRoleType) {
  const roleCodes = user.roleCodes || []
  const roleType = forcedRoleType || user.roleType || roleCodes[0] || user.userType
  const status = user.status || 'active'
  const teachingOrgValue = user.teachingOrgId ? `teaching:${user.teachingOrgId}` : null
  const serviceOrgValue = user.serviceOrgId ? `service:${user.serviceOrgId}` : null

  return {
    ...user,
    real_name: user.realName,
    role_type: roleType,
    role_label: staffRoleTypeMap[roleType] || roleType || '-',
    gender_label: genderMap[user.gender] || '-',
    account_status: status,
    account_status_label: accountStatusMap[status] || status,
    user_id: user.id,
    no_work: user.staffNo,
    no_student: user.studentNo,
    org_unit_id: teachingOrgValue || serviceOrgValue,
    teaching_org_id: user.teachingOrgId,
    teaching_org_name: user.teachingOrgName,
    service_org_id: user.serviceOrgId,
    service_org_name: user.serviceOrgName,
    class_id: user.classId,
    class_name: user.className || user.grade || '',
    department_name: user.teachingOrgName,
    avatar_file_id: user.avatarFileId,
    avatar_url: user.avatarUrl || '',
    last_login_at: user.lastLoginAt || '-',
    created_at: user.createdAt,
    updated_at: user.updatedAt,
    account: {
      id: user.id,
      user_id: user.id,
      username: user.username,
      phone: user.phone,
      email: user.email,
      account_status: status,
      must_change_password: user.mustChangePassword || false,
      last_login_at: user.lastLoginAt || '-',
    },
  }
}

function parseOrgValue(value) {
  if (!value) return {}
  const raw = String(value)
  if (raw.startsWith('teaching:')) return { teachingOrgId: Number(raw.slice(9)) }
  if (raw.startsWith('service:')) return { serviceOrgId: Number(raw.slice(8)) }
  return { teachingOrgId: Number(value) }
}

function studentPayload(payload) {
  return {
    username: payload.username,
    password: payload.password,
    realName: payload.real_name,
    studentNo: payload.no_student,
    phone: payload.phone,
    email: payload.email,
    classId: payload.class_id || payload.classId || Number(payload.class_name) || undefined,
    avatarFileId: payload.avatar_file_id || payload.avatarFileId,
  }
}

function staffPayload(payload) {
  return {
    username: payload.username,
    password: payload.password,
    realName: payload.real_name,
    staffNo: payload.no_work,
    phone: payload.phone,
    email: payload.email,
    avatarFileId: payload.avatar_file_id || payload.avatarFileId,
    roleCodes: payload.role_type ? [payload.role_type] : undefined,
    ...parseOrgValue(payload.org_unit_id),
  }
}

export async function getSchoolStaffListApi(_tenantId, filters = {}) {
  const records = pageRecords(await request.get('/school/staff-users', {
    params: {
      keyword: filters.keyword || undefined,
      status: filters.account_status || undefined,
      roleCode: Array.isArray(filters.role_type) && filters.role_type.length === 1 ? filters.role_type[0] : undefined,
      pageNum: 1,
      pageSize: 500,
    },
  })).map(user => toSnakeUser(user))

  if (Array.isArray(filters.role_type) && filters.role_type.length > 1) {
    return records.filter(item => filters.role_type.includes(item.role_type))
  }
  return records
}

export async function getSchoolStaffDetailApi(_tenantId, id) {
  return toSnakeUser(unwrapData(await request.get(`/school/staff-users/${id}`)))
}

export async function createSchoolStaffApi(_tenantId, payload) {
  return toSnakeUser(unwrapData(await request.post('/school/staff-users', staffPayload(payload))))
}

export async function updateSchoolStaffApi(_tenantId, id, payload) {
  const data = staffPayload(payload)
  delete data.username
  delete data.password
  delete data.roleCodes
  const updated = await request.put(`/school/staff-users/${id}`, data)
  if (payload.role_type) {
    await request.put(`/school/staff-users/${id}/roles`, { roleCodes: [payload.role_type] })
  }
  return toSnakeUser(unwrapData(updated))
}

export function toggleSchoolStaffStatusApi(_tenantId, id, status) {
  return request.put(`/school/staff-users/${id}/status`, { status })
}

export function deleteSchoolStaffApi(_tenantId, id) {
  return toggleSchoolStaffStatusApi(_tenantId, id, 'disabled')
}

export function resetSchoolStaffPasswordApi(_tenantId, id, newPassword) {
  return request.put(`/school/staff-users/${id}/reset-password`, { newPassword })
}

export async function getSchoolStudentListApi(_tenantId, filters = {}) {
  const records = pageRecords(await request.get('/school/student-users', {
    params: {
      keyword: filters.keyword || undefined,
      status: filters.account_status || undefined,
      classId: Array.isArray(filters.class_name) && filters.class_name.length === 1 ? filters.class_name[0] : undefined,
      pageNum: 1,
      pageSize: 500,
    },
  })).map(user => toSnakeUser(user, 'student'))

  let result = records
  if (Array.isArray(filters.department_name) && filters.department_name.length > 0) {
    result = result.filter(item => filters.department_name.includes(item.department_name))
  }
  if (Array.isArray(filters.class_name) && filters.class_name.length > 1) {
    result = result.filter(item => filters.class_name.includes(item.class_id))
  }
  return result
}

export async function getSchoolStudentDetailApi(_tenantId, id) {
  return toSnakeUser(unwrapData(await request.get(`/school/student-users/${id}`)), 'student')
}

export async function createSchoolStudentApi(_tenantId, payload) {
  return toSnakeUser(unwrapData(await request.post('/school/student-users', studentPayload(payload))), 'student')
}

export async function updateSchoolStudentApi(_tenantId, id, payload) {
  const data = studentPayload(payload)
  delete data.username
  delete data.password
  return toSnakeUser(unwrapData(await request.put(`/school/student-users/${id}`, data)), 'student')
}

export function toggleSchoolStudentStatusApi(_tenantId, id, status) {
  return request.put(`/school/student-users/${id}/status`, { status })
}

export function deleteSchoolStudentApi(_tenantId, id) {
  return toggleSchoolStudentStatusApi(_tenantId, id, 'disabled')
}

export function resetSchoolStudentPasswordApi(_tenantId, id, newPassword) {
  return request.put(`/school/student-users/${id}/reset-password`, { newPassword })
}

export async function getSchoolOrgUnitOptionsApi() {
  const [teaching, service] = await Promise.all([
    request.get('/school/teaching-orgs', { params: { pageNum: 1, pageSize: 500 } }),
    request.get('/school/service-orgs', { params: { pageNum: 1, pageSize: 500 } }),
  ])
  return [
    ...pageRecords(teaching).map(o => ({ value: `teaching:${o.id}`, label: o.name, type: 'teaching' })),
    ...pageRecords(service).map(o => ({ value: `service:${o.id}`, label: o.name, type: 'service' })),
  ]
}

export function getSchoolRoleOptionsApi() {
  return Promise.resolve([
    { value: 'staff', label: '教职工' },
    { value: 'teaching_admin', label: '教学管理员' },
    { value: 'service_admin', label: '服务管理员' },
    { value: 'feedback_handler', label: '反馈处理员' },
    { value: 'form_publisher', label: '表单发布员' },
    { value: 'course_owner', label: '课程负责人' },
  ])
}

export async function getSchoolDepartmentOptionsApi() {
  const records = pageRecords(await request.get('/school/teaching-orgs', { params: { pageNum: 1, pageSize: 500 } }))
  return records.map(item => ({ value: item.name, label: item.name }))
}

export async function getSchoolClassOptionsApi() {
  const response = await request.get('/school/classes/options')
  return (unwrapData(response) || []).map(item => ({
    value: item.value ?? item.id,
    label: item.label,
  }))
}
