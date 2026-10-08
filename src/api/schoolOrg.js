import request from '@/request'
import { dataOf, getList, getPage, listOf } from '@/api/backend'

export const teachingOrgTypeMap = {
  college: '学院',
  department: '系',
  teaching_group: '教研室',
  office: '教学部门',
}

export const serviceOrgTypeMap = {
  service_center: '服务中心',
  service_department: '服务部门',
  service_group: '服务小组',
}

const orgStatusMap = { active: '启用', disabled: '停用' }

function endpoint(type) {
  return type === 'teaching' ? '/school/teaching-orgs' : '/school/service-orgs'
}

function normalizeOrg(item = {}) {
  return {
    ...item,
    parent_id: item.parentId ?? item.parent_id ?? null,
    tenant_id: item.tenantId ?? item.tenant_id,
    school_id: item.schoolId ?? item.school_id,
    status_label: orgStatusMap[item.status] || item.status,
    type_label: (item.type === 'teaching'
      ? teachingOrgTypeMap[item.type]
      : serviceOrgTypeMap[item.type]) || item.type || '',
  }
}

function normalizeTree(items = []) {
  return items.map((item) => ({
    ...normalizeOrg(item),
    children: normalizeTree(item.children || []),
  }))
}

async function listOrgs(tenantId, type, params = {}) {
  const page = await getPage(request, endpoint(type), {
    keyword: params.keyword,
    status: params.status,
    parentId: params.parentId,
    page: 1,
    pageSize: 500,
  })
  return page.records.map(normalizeOrg)
}

async function relatedData(tenantId, type, orgs, orgId) {
  const allIds = new Set([Number(orgId)])
  const collect = (parentId) => {
    orgs.filter((item) => Number(item.parent_id) === Number(parentId)).forEach((item) => {
      allIds.add(Number(item.id))
      collect(item.id)
    })
  }
  collect(orgId)

  const [coursesPage, itemsPage, formsPage, staffPage] = await Promise.all([
    getPage(request, '/school/courses', { page: 1, pageSize: 500 }),
    getPage(request, '/school/service-items', { page: 1, pageSize: 500 }),
    getPage(request, '/evaluation/forms', { page: 1, pageSize: 500 }),
    getPage(request, '/school/staff-users', { page: 1, pageSize: 500 }),
  ])
  const courses = coursesPage.records || []
  const items = itemsPage.records || []
  const forms = formsPage.records || []
  const staff = staffPage.records || []

  if (type === 'teaching') {
    return {
      staffCount: staff.filter((item) => Number(item.teachingOrgId ?? item.teaching_org_id) &&
        allIds.has(Number(item.teachingOrgId ?? item.teaching_org_id))).length,
      courseCount: courses.filter((item) => allIds.has(Number(item.teachingOrgId ?? item.teaching_org_id))).length,
      formCount: forms.filter((item) => item.targetType === 'course' && allIds.has(Number(item.targetId))).length,
    }
  }
  return {
    staffCount: staff.filter((item) => Number(item.serviceOrgId ?? item.service_org_id) &&
      allIds.has(Number(item.serviceOrgId ?? item.service_org_id))).length,
    itemCount: items.filter((item) => allIds.has(Number(item.serviceOrgId ?? item.service_org_id))).length,
    formCount: forms.filter((item) => item.targetType === 'service_item' && allIds.has(Number(item.targetId))).length,
  }
}

export async function getSchoolOrgSummaryApi(tenantId, type) {
  const orgs = await listOrgs(tenantId, type)
  const [coursesPage, itemsPage, staffPage] = await Promise.all([
    getPage(request, '/school/courses', { page: 1, pageSize: 500 }),
    getPage(request, '/school/service-items', { page: 1, pageSize: 500 }),
    getPage(request, '/school/staff-users', { page: 1, pageSize: 500 }),
  ])
  const courses = coursesPage.records || []
  const items = itemsPage.records || []
  const staff = staffPage.records || []
  return {
    orgCount: orgs.length,
    activeCount: orgs.filter((item) => item.status === 'active').length,
    ...(type === 'teaching'
      ? { courseCount: courses.length, staffCount: staff.length }
      : { itemCount: items.length, staffCount: staff.length }),
  }
}

export async function getSchoolOrgTreeApi(_tenantId, type) {
  return normalizeTree(dataOf(await request.get(`${endpoint(type)}/tree`)) || [])
}

export async function getSchoolOrgDetailApi(tenantId, type, orgId) {
  const orgs = await listOrgs(tenantId, type)
  const org = orgs.find((item) => Number(item.id) === Number(orgId))
  if (!org) return null
  return { ...org, ...(await relatedData(tenantId, type, orgs, orgId)), logs: [] }
}

function orgPayload(payload = {}) {
  return {
    name: payload.name,
    code: payload.code,
    type: payload.org_type || payload.orgType || payload.type,
    parentId: payload.parentId ?? payload.parent_id ?? null,
    status: payload.status || 'active',
  }
}

export async function createSchoolOrgApi(_tenantId, type, payload) {
  return request.post(endpoint(type), orgPayload(payload)).then(dataOf)
}

export async function updateSchoolOrgApi(_tenantId, type, orgId, payload) {
  return request.put(`${endpoint(type)}/${orgId}`, orgPayload(payload)).then(dataOf)
}

export async function disableSchoolOrgApi(_tenantId, type, orgId) {
  const current = (await listOrgs(_tenantId, type)).find((item) => Number(item.id) === Number(orgId))
  return updateSchoolOrgApi(_tenantId, type, orgId, { ...current, status: 'disabled' })
}

export async function enableSchoolOrgApi(_tenantId, type, orgId) {
  const current = (await listOrgs(_tenantId, type)).find((item) => Number(item.id) === Number(orgId))
  return updateSchoolOrgApi(_tenantId, type, orgId, { ...current, status: 'active' })
}

export async function deleteSchoolOrgApi(_tenantId, type, orgId) {
  return request.delete(`${endpoint(type)}/${orgId}`).then(dataOf)
}

export async function checkOrgDeleteRisksApi(tenantId, type, orgId) {
  const orgs = await listOrgs(tenantId, type)
  const warnings = []
  if (orgs.some((item) => Number(item.parent_id) === Number(orgId))) {
    warnings.push('存在子组织')
  }
  return warnings
}

export async function checkOrgHasAssociationsApi(tenantId, type, orgId) {
  const data = await getSchoolOrgDetailApi(tenantId, type, orgId)
  return Boolean(data && ((data.courseCount || 0) + (data.itemCount || 0) + (data.staffCount || 0) > 0))
}

export async function getSchoolOrgStaffOptionsApi() {
  const staff = await listOf(await request.get('/school/staff-users', { params: { page: 1, pageSize: 500 } }))
  return staff.map((item) => ({
    user_id: item.id,
    real_name: item.realName || item.real_name || item.username || '',
    role_type: item.roleType || item.role_type || item.roleCodes?.[0] || 'staff',
  }))
}

export async function checkOrgCodeUniqueApi(tenantId, type, code, excludeOrgId = null) {
  const orgs = await listOrgs(tenantId, type)
  return !orgs.some((item) => item.code === code && Number(item.id) !== Number(excludeOrgId))
}

export async function checkOrgDisableRisksApi(tenantId, type, orgId) {
  const warnings = await checkOrgDeleteRisksApi(tenantId, type, orgId)
  const related = await getSchoolOrgDetailApi(tenantId, type, orgId)
  if ((related?.courseCount || 0) + (related?.itemCount || 0) > 0) {
    warnings.push('存在关联课程或服务项目')
  }
  return warnings
}
