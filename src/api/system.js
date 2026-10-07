import request from '@/request'

export const SYSTEM_STATUS_MAP = {
  active: { label: '启用', type: 'success' },
  disabled: { label: '停用', type: 'info' },
  inactive: { label: '停用', type: 'info' },
  locked: { label: '锁定', type: 'warning' },
  pending: { label: '待审核', type: 'warning' },
  approved: { label: '已通过', type: 'success' },
  rejected: { label: '已驳回', type: 'danger' },
  resubmit_required: { label: '需补充材料', type: 'warning' },
  valid: { label: '有效', type: 'success' },
  expired: { label: '已过期', type: 'danger' },
  revoked: { label: '已撤销', type: 'info' },
  processing: { label: '处理中', type: 'warning' },
  resolved: { label: '已解决', type: 'success' },
  closed: { label: '已关闭', type: 'info' },
  draft: { label: '草稿', type: 'info' },
  published: { label: '已发布', type: 'success' },
  archived: { label: '已归档', type: 'info' },
  onboarded: { label: '已入驻', type: 'success' },
  frozen: { label: '已冻结', type: 'warning' },
  unavailable: { label: '未开放', type: 'info' },
  unopened: { label: '未开放', type: 'info' },
  up: { label: '正常', type: 'success' },
  down: { label: '异常', type: 'danger' },
}

const adminMenuItems = [
  { index: '/admin/dashboard', title: '平台概览', icon: 'HomeFilled', group: '工作台' },
  {
    index: '/admin/tenants',
    title: '租户管理',
    icon: 'School',
    group: '租户运营',
    children: [
      { index: '/admin/tenants/lifecycle', title: '生命周期' },
      { index: '/admin/plans', title: '套餐管理' },
    ],
  },
  { index: '/admin/onboarding/audit', title: '入驻审核', icon: 'DocumentChecked', group: '租户运营' },
  { index: '/admin/users/roles', title: '角色管理', icon: 'User', group: '系统配置' },
  {
    index: '/admin/ops',
    title: '平台运维',
    icon: 'Monitor',
    group: '平台运维',
    children: [
      { index: '/admin/monitoring', title: '健康监控' },
      { index: '/admin/audit/logs', title: '审计日志' },
      { index: '/admin/reports', title: '统计报表' },
    ],
  },
]

const statusOptionsMap = {
  binary: [
    { value: '', label: '全部状态' },
    { value: 'active', label: '启用' },
    { value: 'disabled', label: '停用' },
    { value: 'locked', label: '锁定' },
  ],
  plan: [
    { value: '', label: '全部状态' },
    { value: 'active', label: '启用中' },
    { value: 'disabled', label: '已下架' },
  ],
  onboarding: [
    { value: '', label: '全部状态' },
    { value: 'pending', label: '待审核' },
    { value: 'approved', label: '已通过' },
    { value: 'rejected', label: '已驳回' },
    { value: 'resubmit_required', label: '需补充材料' },
  ],
  credential: [
    { value: '', label: '全部状态' },
    { value: 'unavailable', label: '未开放' },
  ],
  ticket: [
    { value: '', label: '全部状态' },
    { value: 'unavailable', label: '未开放' },
  ],
  document: [
    { value: '', label: '全部状态' },
    { value: 'unavailable', label: '未开放' },
  ],
}

const dataScopeOptions = [
  { value: 'all', label: '全部数据' },
  { value: 'platform', label: '平台数据' },
]

const operationTypeOptions = [
  { value: '', label: '全部操作' },
  { value: 'UPDATE', label: '更新' },
  { value: 'CREATE', label: '创建' },
  { value: 'DELETE', label: '删除' },
  { value: 'LOGIN', label: '登录' },
]

function unwrap(res) {
  return res?.data ?? res
}

function pageRecords(res) {
  const data = unwrap(res)
  return data?.records || data?.list || (Array.isArray(data) ? data : [])
}

function listResponse(list) {
  return Promise.resolve({ data: { list } })
}

function dataResponse(data) {
  return Promise.resolve({ data })
}

function unopened(feature) {
  return Promise.reject(new Error(`${feature}未开放`))
}

function clone(data) {
  return JSON.parse(JSON.stringify(data))
}

function normalizeStatus(status) {
  if (status === 'inactive') return 'disabled'
  if (status === 'cancelled') return 'disabled'
  return status || 'active'
}

function storageToNumber(value) {
  if (typeof value === 'number') return value
  const match = String(value || '').match(/\d+/)
  return match ? Number(match[0]) : 0
}

function priceNumber(value) {
  if (typeof value === 'number') return value
  const match = String(value || '').replace(/,/g, '').match(/\d+(\.\d+)?/)
  return match ? Number(match[0]) : 0
}

function codeFromName(name) {
  return `plan_${String(name || Date.now()).trim().toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`
}

function mapPlan(plan) {
  const featureMap = plan.featureMap || {}
  const storageQuota = plan.storageQuota || featureMap.storageQuota || '0GB'
  const priceText = plan.priceText || (Number(plan.price || 0) === 0 ? '免费' : `¥${plan.price}/年`)
  return {
    ...plan,
    status: normalizeStatus(plan.status),
    price: priceText,
    priceValue: priceNumber(plan.price),
    duration: String(plan.maxUsers ?? featureMap.maxUsers ?? 0),
    storageLimit: storageToNumber(storageQuota),
    storageQuota,
    durationDays: Number(featureMap.durationDays || plan.durationDays || 365),
    maxUsers: Number(plan.maxUsers ?? featureMap.maxUsers ?? 0),
    maxForms: Number(plan.maxForms ?? featureMap.maxForms ?? 0),
  }
}

function buildPlanPayload(data) {
  const features = {
    maxUsers: Number(data.maxUsers ?? 0),
    maxForms: Number(data.maxForms ?? 0),
    storageQuota: `${Number(data.storageLimit ?? storageToNumber(data.storageQuota) ?? 0)}GB`,
    durationDays: Number(data.durationDays ?? 365),
  }
  return {
    planCode: data.planCode || codeFromName(data.planName),
    planName: data.planName,
    description: data.description || data.features || '',
    price: Number(data.priceValue ?? data.price ?? 0),
    status: normalizeStatus(data.status),
    features,
  }
}

function mapTenant(tenant) {
  const quota = tenant.quota || tenant.quotas || {}
  return {
    ...tenant,
    id: tenant.id,
    tenantId: String(tenant.tenantId ?? tenant.id),
    status: normalizeStatus(tenant.status),
    adminName: tenant.adminName || tenant.adminUsername || '',
    storageQuota: tenant.storageQuota || quota.storageQuota || '',
    formQuota: tenant.formQuota || quota.maxForms || tenant.maxForms || 0,
    concurrencyQuota: tenant.concurrencyQuota || quota.concurrencyQuota || 0,
  }
}

function mapRole(role) {
  return {
    ...role,
    roleCode: role.roleCode,
    roleName: role.roleName,
    description: role.description || role.roleCode || '',
    dataScope: role.dataScope || role.scopeType || 'platform',
    builtin: role.roleCode === 'system_admin',
  }
}

function groupPermissions(list) {
  const groups = new Map()
  list.forEach((item) => {
    const code = item.permissionCode || item.permission_code || item.id
    const [moduleCode] = String(code).split('.')
    if (!groups.has(moduleCode)) {
      groups.set(moduleCode, { id: moduleCode, label: moduleCode, children: [] })
    }
    groups.get(moduleCode).children.push({
      id: code,
      label: item.permissionName || code,
    })
  })
  return Array.from(groups.values())
}

export function getAdminMenuApi() {
  return listResponse(clone(adminMenuItems))
}

export async function getAdminDashboardStatsApi() {
  const summary = unwrap(await request.get('/platform/reports/summary'))
  return listResponse([
    { key: 'activeSchools', title: '入驻学校', icon: 'School', color: 'primary', value: summary.activeSchoolCount || 0 },
    { key: 'pendingApps', title: '待审核申请', icon: 'DocumentChecked', color: 'warning', value: summary.pendingOnboardingCount || 0 },
    { key: 'activeTenants', title: '租户总数', icon: 'User', color: 'success', value: summary.tenantCount || 0 },
    { key: 'totalUsers', title: '平台用户', icon: 'DataAnalysis', color: 'primary', value: summary.userCount || 0 },
  ])
}

export function getAdminStatusOptionsApi(scope) {
  return listResponse(clone(statusOptionsMap[scope] || []))
}

export function getAdminDataScopeOptionsApi() {
  return listResponse(clone(dataScopeOptions))
}

export async function getPlanPermissionModulesApi() {
  const permissions = pageRecords(await request.get('/platform/permissions'))
  return listResponse(groupPermissions(permissions).map((module) => ({
    id: module.id,
    title: module.label,
    description: module.children.map((child) => child.label).join('、'),
    checked: true,
    disabled: true,
  })))
}

export function getSystemSettingsApi() {
  return dataResponse({ message: '系统设置未开放', status: 'unavailable' })
}

export function saveSystemSettingsApi() {
  return unopened('系统设置')
}

export function getOperationTypeOptionsApi() {
  return listResponse(clone(operationTypeOptions))
}

export async function getAuditLogsApi(params = {}) {
  const records = pageRecords(await request.get('/platform/audit/logs', { params }))
  return listResponse(records.map((item) => ({
    ...item,
    operatorName: item.operatorName || item.userId || 'system',
    description: item.content || item.targetName || item.operationType,
    ipAddress: item.ip,
  })))
}

export function getCredentialTypeOptionsApi() {
  return listResponse([{ value: 'unavailable', label: '资料/凭证管理未开放' }])
}

export function getCredentialListApi() {
  return listResponse([])
}

export function updateCredentialExpirationApi() {
  return unopened('资料/凭证管理')
}

export async function getMonitoringStatsApi() {
  const health = unwrap(await request.get('/platform/monitoring/health'))
  return listResponse([
    { title: '数据库', value: health.database?.status || 'unknown', unit: '', trend: health.database?.status === 'up' ? 'up' : 'down' },
    { title: 'Redis', value: health.redis?.status || 'unopened', unit: '', trend: 'neutral' },
    { title: '文件存储', value: health.fileStorage?.status || 'unopened', unit: '', trend: 'neutral' },
    { title: '链路追踪', value: health.skyWalking?.status || 'unopened', unit: '', trend: 'neutral' },
  ])
}

export async function getMonitoringAlertsApi() {
  const health = unwrap(await request.get('/platform/monitoring/health'))
  return listResponse(Object.entries(health)
    .filter(([, value]) => value?.status !== 'up')
    .map(([key, value], index) => ({
      id: index + 1,
      alertType: key,
      description: value?.message || '服务状态异常',
      severity: value?.status === 'down' ? '高' : '低',
      createdAt: '',
      status: value?.status || 'unavailable',
    })))
}

export function getSupportTicketsApi() {
  return listResponse([])
}

export function updateSupportTicketApi() {
  return unopened('工单管理')
}

export function getHelpDocumentsApi() {
  return listResponse([])
}

export function createHelpDocumentApi() {
  return unopened('帮助文档')
}

export function updateHelpDocumentApi() {
  return unopened('帮助文档')
}

export async function getReportDashboardApi() {
  const summary = unwrap(await request.get('/platform/reports/summary'))
  return dataResponse({
    sections: [
      {
        key: 'tenantStats',
        title: '租户统计',
        items: [
          { label: '租户总数', value: summary.tenantCount || 0 },
          { label: '活跃学校', value: summary.activeSchoolCount || 0 },
          { label: '待审核入驻', value: summary.pendingOnboardingCount || 0 },
        ],
      },
      {
        key: 'userStats',
        title: '用户统计',
        items: [
          { label: '用户总数', value: summary.userCount || 0 },
        ],
      },
    ],
  })
}

export async function getOnboardingMaterialsApi(id) {
  return listResponse(pageRecords(await request.get(`/platform/onboarding/applications/${id}/materials`)))
}

export async function getTenantLifecycleApi(params = {}) {
  const records = pageRecords(await request.get('/platform/tenants', {
    params: { pageNum: 1, pageSize: 500, ...params },
  }))
  return listResponse(records.map(mapTenant))
}

export async function getTenantDetailApi(tenantId) {
  const detail = unwrap(await request.get(`/platform/tenants/${tenantId}`))
  const tenant = mapTenant(detail.tenant || {})
  return dataResponse({
    ...detail,
    tenant,
    quotas: detail.quota || detail.quotas || {},
  })
}

export function createTenantApi() {
  return unopened('手工创建租户')
}

export function freezeTenantApi(tenantId, reason = '平台冻结') {
  return request.put(`/platform/tenants/${tenantId}/status`, { status: 'frozen', reason })
}

export function cancelTenantApi(tenantId, reason = '平台停用') {
  return request.put(`/platform/tenants/${tenantId}/status`, { status: 'disabled', reason })
}

export function changeTenantPlanApi(tenantId, planName) {
  return request.put(`/platform/tenants/${tenantId}/plan`, { planName })
}

export function resetTenantAdminApi() {
  return unopened('租户管理员密码重置')
}

export async function getTenantsApi(params = {}) {
  const records = pageRecords(await request.get('/platform/tenants', {
    params: {
      pageNum: params.pageNum || params.page || 1,
      pageSize: params.pageSize || 500,
      keyword: params.keyword || params.schoolName || params.tenantName,
      status: params.status,
    },
  }))
  return listResponse(records.map(mapTenant))
}

export function normalizeTenantStatus(status) {
  return normalizeStatus(status)
}

export async function getOnboardingApplicationsApi(params = {}) {
  const records = pageRecords(await request.get('/platform/onboarding/applications', {
    params: {
      pageNum: params.pageNum || params.page || 1,
      pageSize: params.pageSize || 500,
      keyword: params.keyword || params.schoolName,
      status: params.status,
    },
  }))
  return listResponse(records)
}

export function auditOnboardingApi(id, action, reason, planId) {
  return request.put(`/platform/onboarding/applications/${id}/audit`, { action, reason, planId })
}

export async function getSystemAdminsApi(params = {}) {
  const records = pageRecords(await request.get('/platform/admin-users', {
    params: {
      pageNum: params.pageNum || params.page || 1,
      pageSize: params.pageSize || 500,
      username: params.username,
      realName: params.realName,
      status: params.status,
    },
  }))
  return listResponse(records.map((item) => ({ ...item, roleName: item.roleName || '系统管理员' })))
}

export function createSystemAdminApi(data) {
  return request.post('/platform/admin-users', data)
}

export function updateSystemAdminApi(id, data) {
  return request.put(`/platform/admin-users/${id}`, data)
}

export function toggleSystemAdminStatusApi(id, status = 'disabled') {
  return request.put(`/platform/admin-users/${id}/status`, { status })
}

export function assignSystemAdminRolesApi(id, roleIds) {
  return request.put(`/platform/admin-users/${id}/roles`, { roleIds })
}

export function resetSystemAdminPasswordApi() {
  return unopened('平台管理员密码重置')
}

export function deleteSystemAdminApi() {
  return unopened('平台管理员删除')
}

export async function getSystemRolesApi() {
  return listResponse(pageRecords(await request.get('/platform/roles')).map(mapRole))
}

export function getCustomRolesApi() {
  return listResponse([])
}

export function createSystemRoleApi(data) {
  return request.post('/platform/roles', {
    roleCode: data.roleCode || `platform_${Date.now()}`,
    roleName: data.roleName,
    permissionCodes: data.permissionCodes || [],
  })
}

export function updateSystemRoleApi(id, data) {
  const payload = {
    roleCode: data.roleCode,
    roleName: data.roleName,
    permissionCodes: data.permissionCodes,
  }
  if (Array.isArray(data.permissionCodes)) {
    return request.put(`/platform/roles/${id}/permissions`, payload)
  }
  return request.put(`/platform/roles/${id}`, payload)
}

export function deleteSystemRoleApi(id) {
  return request.delete(`/platform/roles/${id}`)
}

export async function getMenuPermissionsApi() {
  return listResponse(groupPermissions(pageRecords(await request.get('/platform/permissions'))))
}

export function getRoleDefaultPermissionKeys(roleName, permissions, role = {}) {
  if (Array.isArray(role.permissionKeys)) return role.permissionKeys
  if (roleName === '系统管理员' || role.roleCode === 'system_admin') {
    return permissions.flatMap((item) => [item.id, ...(item.children || []).map((child) => child.id)])
  }
  return []
}

export async function getTenantPlansApi(params = {}) {
  const records = pageRecords(await request.get('/platform/plans', {
    params: {
      pageNum: params.pageNum || params.page || 1,
      pageSize: params.pageSize || 500,
      keyword: params.keyword || params.planName,
      status: params.status,
    },
  }))
  return listResponse(records.map(mapPlan))
}

export async function createTenantPlanApi(data) {
  return dataResponse(mapPlan(unwrap(await request.post('/platform/plans', buildPlanPayload(data)))))
}

export async function updateTenantPlanApi(id, data) {
  return dataResponse(mapPlan(unwrap(await request.put(`/platform/plans/${id}`, buildPlanPayload(data)))))
}

export function deleteTenantPlanApi(id) {
  return request.put(`/platform/plans/${id}/status`, { status: 'disabled' })
}
