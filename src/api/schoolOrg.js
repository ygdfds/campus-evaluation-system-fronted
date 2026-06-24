import request from '@/request'

// ==================== 映射表 ====================

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

// 兼容现有数据中的中文 type
const teachingOrgTypeZhMap = {
  '学院': '学院',
  '院系': '院系',
  '系': '系',
  '教研室': '教研室',
  '教学部门': '教学部门',
}

const serviceOrgTypeZhMap = {
  '后勤集团': '后勤集团',
  '服务部门': '服务部门',
  '服务中心': '服务中心',
  '服务小组': '服务小组',
}

const orgStatusMap = {
  active: '启用',
  disabled: '停用',
}

// ==================== 辅助函数 ====================

function buildTree(orgs, parentId = null) {
  return orgs
    .filter(o => o.parent_id === parentId)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id)
    .map(o => ({
      ...o,
      children: buildTree(orgs, o.id),
      status_label: orgStatusMap[o.status] || o.status,
      type_label: o._type_label || o.type || '',
    }))
}


// ==================== 公开 API ====================

/**
 * 获取组织概览统计
 */
export async function getSchoolOrgSummaryApi(tenantId, type) {
  if (type === 'teaching') {
    const [orgsRes, coursesRes, profilesRes] = await Promise.all([
      request.get('/teachingOrgUnits', { params: { tenant_id: tenantId, deleted: false } }),
      request.get('/courses', { params: { tenant_id: tenantId, deleted: false } }),
      request.get('/personProfiles', { params: { deleted: false } }),
    ])
    const orgs = (orgsRes.data || []).filter(o => !o.deleted)
    const courses = (coursesRes.data || []).filter(c => !c.deleted)
    // 统计教职工数
    const allProfiles = (profilesRes.data || []).filter(p => !p.deleted)

    return {
      orgCount: orgs.length,
      courseCount: courses.length,
      staffCount: allProfiles.filter(p => ['staff', 'teaching_admin'].includes(p.role_type)).length,
      activeCount: orgs.filter(o => o.status === 'active').length,
    }
  } else {
    const [orgsRes, itemsRes, profilesRes] = await Promise.all([
      request.get('/serviceOrgUnits', { params: { tenant_id: tenantId, deleted: false } }),
      request.get('/serviceItems', { params: { tenant_id: tenantId, deleted: false } }),
      request.get('/personProfiles', { params: { deleted: false } }),
    ])
    const orgs = (orgsRes.data || []).filter(o => !o.deleted)
    const items = (itemsRes.data || []).filter(i => !i.deleted)
    const allProfiles = (profilesRes.data || []).filter(p => !p.deleted)

    return {
      orgCount: orgs.length,
      itemCount: items.length,
      staffCount: allProfiles.filter(p => ['staff', 'service_admin'].includes(p.role_type)).length,
      activeCount: orgs.filter(o => o.status === 'active').length,
    }
  }
}

/**
 * 获取组织树
 */
export async function getSchoolOrgTreeApi(tenantId, type) {
  const endpoint = type === 'teaching' ? '/teachingOrgUnits' : '/serviceOrgUnits'
  const typeMap = type === 'teaching' ? { ...teachingOrgTypeMap, ...teachingOrgTypeZhMap } : { ...serviceOrgTypeMap, ...serviceOrgTypeZhMap }

  const res = await request.get(endpoint, { params: { tenant_id: tenantId, deleted: false } })
  const orgs = (res.data || []).filter(o => !o.deleted).map(o => ({
    ...o,
    _type_label: typeMap[o.type] || o.type,
  }))

  return buildTree(orgs)
}

/**
 * 获取组织详情（聚合关联数据）
 */
export async function getSchoolOrgDetailApi(tenantId, type, orgId) {
  const endpoint = type === 'teaching' ? '/teachingOrgUnits' : '/serviceOrgUnits'
  const res = await request.get(endpoint, { params: { tenant_id: tenantId, deleted: false } })
  const orgs = (res.data || []).filter(o => !o.deleted)
  const org = orgs.find(o => o.id === Number(orgId))
  if (!org) return null

  // 聚合关联数据
  const typeMap = type === 'teaching' ? { ...teachingOrgTypeMap, ...teachingOrgTypeZhMap } : { ...serviceOrgTypeMap, ...serviceOrgTypeZhMap }

  // 获取所有子组织 ID（包含自身）
  const allOrgIds = [org.id]
  function collectChildIds(parentId) {
    orgs.filter(o => o.parent_id === parentId).forEach(o => {
      allOrgIds.push(o.id)
      collectChildIds(o.id)
    })
  }
  collectChildIds(org.id)

  let relatedData = {}

  if (type === 'teaching') {
    const [coursesRes, profilesRes, formsRes] = await Promise.all([
      request.get('/courses', { params: { tenant_id: tenantId, deleted: false } }),
      request.get('/personProfiles', { params: { deleted: false } }),
      request.get('/evaluationForms', { params: { tenant_id: tenantId, deleted: false } }),
    ])
    const courses = (coursesRes.data || []).filter(c => !c.deleted)
    const forms = (formsRes.data || []).filter(f => !f.deleted)

    relatedData = {
      staffCount: (profilesRes.data || []).filter(p => !p.deleted && ['staff', 'teaching_admin'].includes(p.role_type)).length,
      courseCount: courses.filter(c => allOrgIds.includes(c.teaching_org_id)).length,
      formCount: forms.filter(f => allOrgIds.includes(f.teaching_org_id)).length,
    }
  } else {
    const [itemsRes, profilesRes, formsRes, complaintsRes] = await Promise.all([
      request.get('/serviceItems', { params: { tenant_id: tenantId, deleted: false } }),
      request.get('/personProfiles', { params: { deleted: false } }),
      request.get('/evaluationForms', { params: { tenant_id: tenantId, deleted: false } }),
      request.get('/complaints', { params: { tenant_id: tenantId, deleted: false } }),
    ])
    const items = (itemsRes.data || []).filter(i => !i.deleted)
    const forms = (formsRes.data || []).filter(f => !f.deleted)
    const complaints = (complaintsRes.data || []).filter(c => !c.deleted)

    relatedData = {
      staffCount: (profilesRes.data || []).filter(p => !p.deleted && ['staff', 'service_admin'].includes(p.role_type)).length,
      itemCount: items.filter(i => allOrgIds.includes(i.service_org_id)).length,
      formCount: forms.filter(f => allOrgIds.includes(f.service_org_id)).length,
      complaintCount: complaints.filter(c => allOrgIds.includes(c.service_org_id)).length,
    }
  }

  // 获取操作日志
  let logs = []
  try {
    const logsRes = await request.get('/operationLogs', { params: { tenant_id: tenantId } })
    logs = (logsRes.data || [])
      .filter(l => l.module === 'org' && String(l.target_id) === String(orgId))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)
  } catch { /* ignore */ }

  // 解析日志操作人名称
  if (logs.length > 0) {
    try {
      const profilesRes3 = await request.get('/personProfiles', { params: { deleted: false } })
      const allProfiles = (profilesRes3.data || []).filter(p => !p.deleted)
      logs = logs.map(l => ({
        ...l,
        operator_name: l.user_id ? (allProfiles.find(p => p.user_id === l.user_id)?.real_name || '系统') : '系统',
      }))
    } catch { /* ignore */ }
  }

  const parentOrg = orgs.find(o => o.id === org.parent_id)

  // 解析负责人名称
  let managerName = ''
  if (org.manager_user_id) {
    const profilesRes2 = await request.get('/personProfiles', { params: { deleted: false } })
    const allProfiles = (profilesRes2.data || []).filter(p => !p.deleted)
    const mgr = allProfiles.find(p => p.user_id === org.manager_user_id)
    managerName = mgr?.real_name || ''
  }

  return {
    ...org,
    type_label: typeMap[org.type] || org.type,
    status_label: orgStatusMap[org.status] || org.status,
    parent_name: parentOrg?.name || '',
    manager_name: managerName,
    ...relatedData,
    logs,
  }
}

/**
 * 创建组织
 */
export async function createSchoolOrgApi(tenantId, type, payload) {
  const endpoint = type === 'teaching' ? '/teachingOrgUnits' : '/serviceOrgUnits'
  const now = new Date().toISOString()
  const body = {
    tenant_id: tenantId,
    parent_id: payload.parent_id || null,
    name: payload.name,
    code: payload.code,
    type: payload.org_type || payload.type,
    manager_user_id: payload.manager_user_id || null,
    phone: payload.phone || null,
    description: payload.description || null,
    sort_order: payload.sort_order || 0,
    status: payload.status || 'active',
    created_at: now,
    updated_at: now,
    deleted: false,
  }

  const res = await request.post(endpoint, body)

  // 写入操作日志
  try {
    await request.post('/operationLogs', {
      tenant_id: tenantId,
      user_id: payload.operator_id || null,
      module: 'org',
      action: 'create',
      target_type: type === 'teaching' ? 'teaching_org' : 'service_org',
      target_id: res.id,
      content: `新增${type === 'teaching' ? '教学' : '服务'}组织：${payload.name}`,
      created_at: now,
    })
  } catch { /* ignore */ }

  return res
}

/**
 * 更新组织
 */
export async function updateSchoolOrgApi(tenantId, type, orgId, payload) {
  const endpoint = type === 'teaching' ? '/teachingOrgUnits' : '/serviceOrgUnits'
  const now = new Date().toISOString()
  const body = {
    ...payload,
    updated_at: now,
  }
  delete body.id
  delete body.created_at
  delete body.deleted

  const res = await request.patch(`${endpoint}/${orgId}`, body)

  // 写入操作日志
  try {
    await request.post('/operationLogs', {
      tenant_id: tenantId,
      user_id: payload.operator_id || null,
      module: 'org',
      action: 'update',
      target_type: type === 'teaching' ? 'teaching_org' : 'service_org',
      target_id: orgId,
      content: `编辑组织：${payload.name || ''}`,
      created_at: now,
    })
  } catch { /* ignore */ }

  return res
}

/**
 * 停用组织
 */
export async function disableSchoolOrgApi(tenantId, type, orgId, orgName) {
  const endpoint = type === 'teaching' ? '/teachingOrgUnits' : '/serviceOrgUnits'
  const now = new Date().toISOString()

  const res = await request.patch(`${endpoint}/${orgId}`, {
    status: 'disabled',
    updated_at: now,
  })

  // 写入操作日志
  try {
    await request.post('/operationLogs', {
      tenant_id: tenantId,
      user_id: null,
      module: 'org',
      action: 'disable',
      target_type: type === 'teaching' ? 'teaching_org' : 'service_org',
      target_id: orgId,
      content: `停用组织：${orgName || ''}`,
      created_at: now,
    })
  } catch { /* ignore */ }

  return res
}

/**
 * 删除组织（软删除）
 */
export async function deleteSchoolOrgApi(tenantId, type, orgId, orgName) {
  const endpoint = type === 'teaching' ? '/teachingOrgUnits' : '/serviceOrgUnits'
  const now = new Date().toISOString()

  const res = await request.patch(`${endpoint}/${orgId}`, {
    deleted: true,
    updated_at: now,
  })

  // 写入操作日志
  try {
    await request.post('/operationLogs', {
      tenant_id: tenantId,
      user_id: null,
      module: 'org',
      action: 'delete',
      target_type: type === 'teaching' ? 'teaching_org' : 'service_org',
      target_id: orgId,
      content: `删除组织：${orgName || ''}`,
      created_at: now,
    })
  } catch { /* ignore */ }

  return res
}

/**
 * 启用组织
 */
export async function enableSchoolOrgApi(tenantId, type, orgId, orgName) {
  const endpoint = type === 'teaching' ? '/teachingOrgUnits' : '/serviceOrgUnits'
  const now = new Date().toISOString()
  const res = await request.patch(`${endpoint}/${orgId}`, {
    status: 'active',
    updated_at: now,
  })
  try {
    await request.post('/operationLogs', {
      tenant_id: tenantId,
      user_id: null,
      module: 'org',
      action: 'enable',
      target_type: type === 'teaching' ? 'teaching_org' : 'service_org',
      target_id: orgId,
      content: `启用组织：${orgName || ''}`,
      created_at: now,
    })
  } catch { /* ignore */ }
  return res
}

/**
 * 检查组织是否可删除（无子组织、无关联数据）
 */
export async function checkOrgDeleteRisksApi(tenantId, type, orgId) {
  const endpoint = type === 'teaching' ? '/teachingOrgUnits' : '/serviceOrgUnits'
  const res = await request.get(endpoint, { params: { tenant_id: tenantId, deleted: false } })
  const orgs = (res.data || []).filter(o => !o.deleted)
  const warnings = []
  const children = orgs.filter(o => o.parent_id === Number(orgId))
  if (children.length > 0) warnings.push(`存在 ${children.length} 个子组织`)
  const allOrgIds = [Number(orgId)]
  function collectChildIds(pid) {
    orgs.filter(o => o.parent_id === pid).forEach(o => { allOrgIds.push(o.id); collectChildIds(o.id) })
  }
  collectChildIds(orgId)
  if (type === 'teaching') {
    const cRes = await request.get('/courses', { params: { tenant_id: tenantId, deleted: false } })
    const linked = (cRes.data || []).filter(c => !c.deleted && allOrgIds.includes(c.teaching_org_id))
    if (linked.length > 0) warnings.push(`关联 ${linked.length} 门课程`)
  } else {
    const iRes = await request.get('/serviceItems', { params: { tenant_id: tenantId, deleted: false } })
    const linked = (iRes.data || []).filter(i => !i.deleted && allOrgIds.includes(i.service_org_id))
    if (linked.length > 0) warnings.push(`关联 ${linked.length} 个服务项目`)
  }
  return warnings
}

/**
 * 检查组织编辑时是否有关联数据（用于禁用组织类型字段）
 */
export async function checkOrgHasAssociationsApi(tenantId, type, orgId) {
  const allOrgIds = [Number(orgId)]
  const endpoint = type === 'teaching' ? '/teachingOrgUnits' : '/serviceOrgUnits'
  const res = await request.get(endpoint, { params: { tenant_id: tenantId, deleted: false } })
  const orgs = (res.data || []).filter(o => !o.deleted)
  function collectChildIds(pid) {
    orgs.filter(o => o.parent_id === pid).forEach(o => { allOrgIds.push(o.id); collectChildIds(o.id) })
  }
  collectChildIds(orgId)
  if (type === 'teaching') {
    const cRes = await request.get('/courses', { params: { tenant_id: tenantId, deleted: false } })
    return (cRes.data || []).filter(c => !c.deleted && allOrgIds.includes(c.teaching_org_id)).length > 0
  } else {
    const iRes = await request.get('/serviceItems', { params: { tenant_id: tenantId, deleted: false } })
    return (iRes.data || []).filter(i => !i.deleted && allOrgIds.includes(i.service_org_id)).length > 0
  }
}

/**
 * 获取教职工选项列表（用于负责人选择）
 */
export async function getSchoolOrgStaffOptionsApi() {
  const [profilesRes, accountsRes] = await Promise.all([
    request.get('/personProfiles', { params: { deleted: false } }),
    request.get('/userAccounts', { params: { deleted: false } }),
  ])
  const profiles = (profilesRes.data || []).filter(p => !p.deleted)
  const accounts = (accountsRes.data || []).filter(a => !a.deleted)
  const accountMap = {}
  accounts.forEach(a => { accountMap[a.id] = a })

  return profiles
    .filter(p => ['staff', 'teaching_admin', 'service_admin'].includes(p.role_type))
    .map(p => ({
      user_id: p.user_id,
      real_name: p.real_name || accountMap[p.user_id]?.username || '',
      role_type: p.role_type,
    }))
}

/**
 * 检查组织编码是否已存在
 */
export async function checkOrgCodeUniqueApi(tenantId, type, code, excludeOrgId = null) {
  const endpoint = type === 'teaching' ? '/teachingOrgUnits' : '/serviceOrgUnits'
  const res = await request.get(endpoint, { params: { tenant_id: tenantId, deleted: false } })
  const orgs = (res.data || []).filter(o => !o.deleted)
  return !orgs.some(o => o.code === code && o.id !== Number(excludeOrgId))
}

/**
 * 检查组织是否可停用（有子组织/关联数据时返回警告）
 */
export async function checkOrgDisableRisksApi(tenantId, type, orgId) {
  const endpoint = type === 'teaching' ? '/teachingOrgUnits' : '/serviceOrgUnits'
  const res = await request.get(endpoint, { params: { tenant_id: tenantId, deleted: false } })
  const orgs = (res.data || []).filter(o => !o.deleted)

  const warnings = []

  // 检查启用子组织
  const activeChildren = orgs.filter(o => o.parent_id === Number(orgId) && o.status === 'active')
  if (activeChildren.length > 0) {
    warnings.push(`存在 ${activeChildren.length} 个启用子组织，请先停用子组织`)
  }

  // 检查关联数据
  const allOrgIds = [Number(orgId)]
  function collectChildIds(parentId) {
    orgs.filter(o => o.parent_id === parentId).forEach(o => {
      allOrgIds.push(o.id)
      collectChildIds(o.id)
    })
  }
  collectChildIds(orgId)

  if (type === 'teaching') {
    const coursesRes = await request.get('/courses', { params: { tenant_id: tenantId, deleted: false } })
    const courses = (coursesRes.data || []).filter(c => !c.deleted)
    const linkedCourses = courses.filter(c => allOrgIds.includes(c.teaching_org_id))
    if (linkedCourses.length > 0) {
      warnings.push(`关联 ${linkedCourses.length} 门课程，请先调整课程归属`)
    }
  } else {
    const itemsRes = await request.get('/serviceItems', { params: { tenant_id: tenantId, deleted: false } })
    const items = (itemsRes.data || []).filter(i => !i.deleted)
    const linkedItems = items.filter(i => allOrgIds.includes(i.service_org_id))
    if (linkedItems.length > 0) {
      warnings.push(`关联 ${linkedItems.length} 个服务项目，请先调整服务项目归属`)
    }
  }

  return warnings
}
