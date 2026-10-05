import request from '@/request'

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

function unwrapData(response) {
  return response?.data ?? response
}

function pageRecords(response) {
  const data = unwrapData(response) || {}
  return data.records || data.list || []
}

function endpoint(type) {
  return type === 'teaching' ? '/school/teaching-orgs' : '/school/service-orgs'
}

function typeMap(type) {
  return type === 'teaching' ? teachingOrgTypeMap : serviceOrgTypeMap
}

function normalizeOrg(org, type) {
  const parentId = org.parentId ?? org.parent_id ?? null
  const sortOrder = org.sortOrder ?? org.sort_order ?? 0
  const managerUserId = org.managerUserId ?? org.manager_user_id ?? null
  return {
    ...org,
    parent_id: parentId,
    sort_order: sortOrder,
    manager_user_id: managerUserId,
    org_type: org.type,
    type_label: typeMap(type)[org.type] || org.type || '',
    status_label: orgStatusMap[org.status] || org.status,
    created_at: org.createdAt,
    updated_at: org.updatedAt,
  }
}

function buildTree(orgs, parentId = null) {
  return orgs
    .filter(o => (o.parent_id ?? null) === parentId)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id)
    .map(o => ({ ...o, children: buildTree(orgs, o.id) }))
}

async function listOrgs(type) {
  return pageRecords(await request.get(endpoint(type), { params: { pageNum: 1, pageSize: 500 } }))
    .map(org => normalizeOrg(org, type))
}

export async function getSchoolOrgSummaryApi(_tenantId, type) {
  const orgs = await listOrgs(type)
  const activeCount = orgs.filter(o => o.status === 'active').length
  if (type === 'teaching') {
    const courses = pageRecords(await request.get('/school/courses', { params: { pageNum: 1, pageSize: 500 } }))
    const staff = pageRecords(await request.get('/school/staff-users', { params: { pageNum: 1, pageSize: 500 } }))
    return { orgCount: orgs.length, courseCount: courses.length, staffCount: staff.length, activeCount }
  }
  const items = pageRecords(await request.get('/school/service-items', { params: { pageNum: 1, pageSize: 500 } }))
  const staff = pageRecords(await request.get('/school/staff-users', { params: { pageNum: 1, pageSize: 500 } }))
  return { orgCount: orgs.length, itemCount: items.length, staffCount: staff.length, activeCount }
}

export async function getSchoolOrgTreeApi(_tenantId, type) {
  return buildTree(await listOrgs(type))
}

export async function getSchoolOrgDetailApi(_tenantId, type, orgId) {
  const orgs = await listOrgs(type)
  const org = orgs.find(item => Number(item.id) === Number(orgId))
  if (!org) return null
  const parent = orgs.find(item => Number(item.id) === Number(org.parent_id))
  return {
    ...org,
    parent_name: parent?.name || '',
    manager_name: '',
    logs: [],
  }
}

function orgPayload(payload) {
  return {
    parentId: payload.parent_id || payload.parentId || null,
    name: payload.name,
    code: payload.code,
    type: payload.org_type || payload.type,
    managerUserId: payload.manager_user_id || payload.managerUserId || null,
    phone: payload.phone || null,
    description: payload.description || null,
    sortOrder: payload.sort_order ?? payload.sortOrder ?? 0,
    status: payload.status || 'active',
  }
}

export async function createSchoolOrgApi(_tenantId, type, payload) {
  return normalizeOrg(unwrapData(await request.post(endpoint(type), orgPayload(payload))), type)
}

export async function updateSchoolOrgApi(_tenantId, type, orgId, payload) {
  return normalizeOrg(unwrapData(await request.put(`${endpoint(type)}/${orgId}`, orgPayload(payload))), type)
}

export async function disableSchoolOrgApi(_tenantId, type, orgId) {
  const detail = await getSchoolOrgDetailApi(_tenantId, type, orgId)
  return request.put(`${endpoint(type)}/${orgId}`, orgPayload({ ...detail, status: 'disabled' }))
}

export async function enableSchoolOrgApi(_tenantId, type, orgId) {
  const detail = await getSchoolOrgDetailApi(_tenantId, type, orgId)
  return request.put(`${endpoint(type)}/${orgId}`, orgPayload({ ...detail, status: 'active' }))
}

export function deleteSchoolOrgApi(_tenantId, type, orgId) {
  return request.delete(`${endpoint(type)}/${orgId}`)
}

export async function checkOrgDeleteRisksApi(_tenantId, type, orgId) {
  const orgs = await listOrgs(type)
  const children = orgs.filter(o => Number(o.parent_id) === Number(orgId))
  return children.length ? [`存在 ${children.length} 个子组织`] : []
}

export function checkOrgHasAssociationsApi() {
  return Promise.resolve(false)
}

export async function getSchoolOrgStaffOptionsApi() {
  const staff = pageRecords(await request.get('/school/staff-users', { params: { pageNum: 1, pageSize: 500 } }))
  return staff.map(item => ({
    user_id: item.id,
    real_name: item.realName || item.username,
    role_type: item.roleType,
  }))
}

export async function checkOrgCodeUniqueApi(_tenantId, type, code, excludeOrgId = null) {
  const orgs = await listOrgs(type)
  return !orgs.some(org => org.code === code && Number(org.id) !== Number(excludeOrgId))
}

export async function checkOrgDisableRisksApi(_tenantId, type, orgId) {
  const orgs = await listOrgs(type)
  const activeChildren = orgs.filter(o => Number(o.parent_id) === Number(orgId) && o.status === 'active')
  return activeChildren.length ? [`存在 ${activeChildren.length} 个启用子组织，请先停用子组织`] : []
}
