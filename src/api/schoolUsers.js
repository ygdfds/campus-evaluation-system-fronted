import request from '@/request'
import { compactParams, dataOf, listOf, normalizeUser, pageOf } from '@/api/backend'

export const staffRoleTypeMap = {
  staff: '教职工',
  teaching_admin: '教学管理员',
  service_admin: '后勤管理员',
  school_admin: '学校管理员',
  feedback_handler: '反馈处理员',
  form_publisher: '表单发布员',
  course_owner: '课程负责人',
}

export const genderMap = {
  male: '男',
  female: '女',
}

export const accountStatusMap = {
  active: '启用',
  disabled: '停用',
  locked: '锁定',
}

function normalizeStaff(item) {
  const user = normalizeUser(item)
  const roleCode = user.roleCodes?.[0] || user.role_type || 'staff'
  const roleLabels = (user.roleCodes || []).map(code => staffRoleTypeMap[code] || code)
  return {
    ...user,
    _id: user.id,
    role_type: roleCode,
    role_label: roleLabels.length ? roleLabels.join('、') : (staffRoleTypeMap[roleCode] || user.role_names?.[0] || roleCode),
    gender_label: genderMap[user.gender] || '-',
    account_status_label: accountStatusMap[user.account_status] || user.account_status,
    org_unit_id: user.teaching_org_id ? `teaching:${user.teaching_org_id}` : (user.service_org_id ? `service:${user.service_org_id}` : null),
    teaching_org_id: user.teaching_org_id || null,
    teaching_org_name: user.teaching_org_name || '',
    service_org_id: user.service_org_id || null,
    service_org_name: user.service_org_name || '',
    avatar_url: user.avatar_file_id ? `/api/files/${user.avatar_file_id}/preview` : '',
  }
}

function normalizeStudent(item) {
  const user = normalizeUser(item)
  return {
    ...user,
    _id: user.id,
    role_type: 'student',
    gender_label: genderMap[user.gender] || '-',
    account_status_label: accountStatusMap[user.account_status] || user.account_status,
    department_name: user.teaching_org_name || user.department_name || '',
    teaching_org_id: user.teaching_org_id || null,
    class_name: user.class_name || '',
    avatar_url: user.avatar_file_id ? `/api/files/${user.avatar_file_id}/preview` : '',
  }
}

function parseOrgValue(value) {
  if (!value) return {}
  const [type, rawId] = String(value).split(':')
  const id = Number(rawId || value)
  if (!Number.isFinite(id)) return {}
  if (type === 'service') return { serviceOrgId: id }
  return { teachingOrgId: id }
}

function roleCodesOf(payload) {
  if (Array.isArray(payload.roleCodes)) return payload.roleCodes
  if (Array.isArray(payload.role_type)) return payload.role_type
  return [payload.role_type || 'staff']
}

function staffPayload(payload = {}) {
  const parsedOrg = parseOrgValue(payload.org_unit_id || payload.orgUnitId)
  return {
    ...compactParams({
      username: payload.username,
      password: payload.password || '123456',
      realName: payload.realName || payload.real_name,
      staffNo: payload.staffNo || payload.staff_no || payload.no_work,
      phone: payload.phone,
      email: payload.email,
      avatarFileId: payload.avatarFileId || payload.avatar_file_id,
      roleCodes: roleCodesOf(payload),
    }),
    teachingOrgId: payload.teachingOrgId ?? payload.teaching_org_id ?? parsedOrg.teachingOrgId ?? null,
    serviceOrgId: payload.serviceOrgId ?? payload.service_org_id ?? parsedOrg.serviceOrgId ?? null,
  }
}

function studentPayload(payload = {}) {
  return compactParams({
    username: payload.username,
    password: payload.password || '123456',
    realName: payload.realName || payload.real_name,
    studentNo: payload.studentNo || payload.student_no || payload.no_student,
    phone: payload.phone,
    email: payload.email,
    classId: payload.classId || payload.class_id || undefined,
    avatarFileId: payload.avatarFileId || payload.avatar_file_id,
  })
}

export async function getSchoolStaffListApi(tenantId, filters = {}) {
  const params = compactParams({
    keyword: filters.keyword,
    status: filters.account_status || filters.status,
    roleCode: Array.isArray(filters.role_type) ? filters.role_type[0] : filters.role_type,
    page: 1,
    pageSize: 500,
  })
  const list = await request.get('/school/staff-users', { params }).then(listOf)
  return list.map(normalizeStaff)
}

export async function getSchoolStaffDetailApi(tenantId, profileId) {
  const data = await request.get(`/school/staff-users/${profileId}`).then(dataOf)
  return normalizeStaff(data)
}

export async function createSchoolStaffApi(tenantId, payload) {
  const data = await request.post('/school/staff-users', staffPayload(payload)).then(dataOf)
  return normalizeStaff(data)
}

export async function updateSchoolStaffApi(tenantId, profileId, payload) {
  const id = profileId || payload.id || payload._id
  const data = await request.put(`/school/staff-users/${id}`, staffPayload(payload)).then(dataOf)
  if (Array.isArray(payload.role_type) || Array.isArray(payload.roleCodes)) {
    await assignSchoolStaffRolesApi(tenantId, id, roleCodesOf(payload))
  }
  return normalizeStaff(data)
}

export async function assignSchoolStaffRolesApi(tenantId, profileId, roleCodes = []) {
  await request.put(`/school/staff-users/${profileId}/roles`, {
    roleCodes: Array.from(new Set(['staff', ...roleCodes])).filter(Boolean),
  })
  return { success: true }
}

export async function toggleSchoolStaffStatusApi(tenantId, profileId, newStatus) {
  await request.put(`/school/staff-users/${profileId}/status`, { status: newStatus })
  return { account_status: newStatus }
}

export async function deleteSchoolStaffApi(tenantId, profileId) {
  await request.put(`/school/staff-users/${profileId}/status`, { status: 'disabled' })
  return { success: true }
}

export async function getSchoolStudentListApi(tenantId, filters = {}) {
  const classFilter = Array.isArray(filters.class_name) ? filters.class_name[0] : filters.class_name
  const params = compactParams({
    keyword: filters.keyword,
    status: filters.account_status || filters.status,
    classId: Number(classFilter) || undefined,
    grade: filters.grade,
    page: 1,
    pageSize: 500,
  })
  const list = await request.get('/school/student-users', { params }).then(listOf)
  return list.map(normalizeStudent)
}

export async function getSchoolStudentDetailApi(tenantId, profileId) {
  const data = await request.get(`/school/student-users/${profileId}`).then(dataOf)
  return normalizeStudent(data)
}

export async function createSchoolStudentApi(tenantId, payload) {
  const classId = await resolveStudentClassId(payload)
  const data = await request.post('/school/student-users', studentPayload({ ...payload, classId })).then(dataOf)
  return normalizeStudent(data)
}

export async function updateSchoolStudentApi(tenantId, profileId, payload) {
  const id = profileId || payload.id || payload._id
  const classId = await resolveStudentClassId(payload)
  const data = await request.put(`/school/student-users/${id}`, studentPayload({ ...payload, classId })).then(dataOf)
  return normalizeStudent(data)
}

export async function toggleSchoolStudentStatusApi(tenantId, profileId, newStatus) {
  await request.put(`/school/student-users/${profileId}/status`, { status: newStatus })
  return { account_status: newStatus }
}

export async function deleteSchoolStudentApi(tenantId, profileId) {
  await request.put(`/school/student-users/${profileId}/status`, { status: 'disabled' })
  return { success: true }
}

export async function getSchoolOrgUnitOptionsApi() {
  const [teaching, service] = await Promise.all([
    request.get('/school/teaching-orgs/tree').then(dataOf),
    request.get('/school/service-orgs/tree').then(dataOf),
  ])
  const flatten = (items = [], type) => items.flatMap((item) => [
    { value: `${type}:${item.id || item.value}`, label: item.name || item.label, type },
    ...flatten(item.children || [], type),
  ])
  return [...flatten(teaching || [], 'teaching'), ...flatten(service || [], 'service')]
}

export async function getSchoolRoleOptionsApi() {
  const roles = await request.get('/school/roles/options').then(dataOf)
  return (roles || []).map((role) => ({
    value: role.roleCode || role.value || role.code,
    label: role.roleName || role.label || role.name,
  }))
}

export async function getSchoolDepartmentOptionsApi() {
  const tree = await request.get('/school/teaching-orgs/tree').then(dataOf)
  const flatten = (items = []) => items.flatMap((item) => [
    { value: item.id || item.value, label: item.name || item.label },
    ...flatten(item.children || []),
  ])
  return flatten(tree || [])
}

export async function getSchoolClassOptionsApi() {
  let page = await request.get('/school/classes', {
    params: { page: 1, pageSize: 500, status: 'active' },
  }).then(pageOf)
  if (!page.records?.length) {
    const options = await request.get('/school/classes/options').then(dataOf)
    page = { records: options || [] }
  }
  return (page.records || []).map((item) => ({
    value: item.id || item.value,
    label: item.className || item.class_name || item.label || item.name,
    teaching_org_id: item.teachingOrgId || item.teaching_org_id || null,
    grade: item.gradeName || item.grade_name || item.extra || '',
  }))
}

export async function createSchoolClassApi(payload = {}) {
  const className = String(payload.className || payload.class_name || '').trim()
  const teachingOrgId = Number(payload.teachingOrgId || payload.teaching_org_id)
  const data = await request.post('/school/classes', {
    className,
    teachingOrgId,
    gradeName: payload.gradeName || payload.grade_name || '',
    status: 'active',
  }).then(dataOf)
  return {
    value: data.id || data.value,
    label: data.className || data.class_name || data.label || className,
    teaching_org_id: data.teachingOrgId || data.teaching_org_id || teachingOrgId,
    grade: data.gradeName || data.grade_name || '',
  }
}

async function resolveStudentClassId(payload = {}) {
  const rawClass = payload.classId ?? payload.class_id
  const numericClassId = Number(rawClass)
  if (Number.isFinite(numericClassId) && numericClassId > 0) return numericClassId

  const className = String(rawClass || '').trim()
  if (!className) return undefined

  const teachingOrgId = Number(payload.teachingOrgId || payload.teaching_org_id)
  if (!Number.isFinite(teachingOrgId) || teachingOrgId <= 0) {
    throw new Error('直接填写新班级时，请先选择所属院系')
  }

  const existingClasses = await getSchoolClassOptionsApi()
  const existing = existingClasses.find(item =>
    String(item.label).trim() === className &&
    String(item.teaching_org_id) === String(teachingOrgId)
  )
  if (existing) return existing.value

  const created = await createSchoolClassApi({ className, teachingOrgId })
  return created.value
}

