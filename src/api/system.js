import request from '@/request'
import { compactParams, dataOf, listOf, pageOf } from '@/api/backend'

export const SYSTEM_STATUS_MAP = {
  active: { label: '启用', type: 'success' },
  inactive: { label: '停用', type: 'info' },
  disabled: { label: '停用', type: 'info' },
  pending: { label: '待审核', type: 'warning' },
  approved: { label: '已通过', type: 'success' },
  rejected: { label: '已驳回', type: 'danger' },
  frozen: { label: '已冻结', type: 'warning' },
  cancelled: { label: '已取消', type: 'info' },
  processing: { label: '处理中', type: 'warning' },
  resolved: { label: '已解决', type: 'success' },
  closed: { label: '已关闭', type: 'info' },
  valid: { label: '有效', type: 'success' },
  expired: { label: '已过期', type: 'danger' },
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
  { index: '/admin/system', title: '系统设置', icon: 'Setting', group: '系统配置' },
  {
    index: '/admin/ops',
    title: '平台运维',
    icon: 'Monitor',
    group: '平台运维',
    children: [
      { index: '/admin/monitoring', title: '监控告警' },
      { index: '/admin/audit/logs', title: '审计日志' },
      { index: '/admin/reports', title: '统计报表' },
    ],
  },
  {
    index: '/admin/services',
    title: '服务支持',
    icon: 'Files',
    group: '平台运维',
    children: [
      { index: '/admin/documents', title: '凭证材料' },
      { index: '/admin/support', title: '工单帮助' },
    ],
  },
]

const statusOptionsMap = {
  binary: [
    { value: '', label: '全部状态' },
    { value: 'active', label: '启用' },
    { value: 'disabled', label: '停用' },
  ],
  plan: [
    { value: '', label: '全部状态' },
    { value: 'active', label: '启用中' },
    { value: 'disabled', label: '已停用' },
  ],
  onboarding: [
    { value: '', label: '全部状态' },
    { value: 'pending', label: '待审核' },
    { value: 'approved', label: '已通过' },
    { value: 'rejected', label: '已驳回' },
  ],
  credential: [
    { value: '', label: '全部状态' },
    { value: 'valid', label: '有效' },
    { value: 'expired', label: '已过期' },
  ],
}

const dataScopeOptions = [
  { value: 'all', label: '全部数据' },
  { value: 'assigned', label: '指定租户' },
  { value: 'self', label: '仅自己创建' },
]

const operationTypeOptions = [
  { value: 'tenant_create', label: '租户创建' },
  { value: 'tenant_update', label: '租户更新' },
  { value: 'plan_update', label: '套餐变更' },
  { value: 'admin_create', label: '管理员创建' },
  { value: 'admin_update', label: '管理员更新' },
  { value: 'system_config', label: '系统配置' },
]

const credentialTypeOptions = [
  { value: 'business_license', label: '营业执照' },
  { value: 'school_permit', label: '办学许可' },
  { value: 'legal_person_id', label: '法人身份证明' },
]

const unsupported = (name) => {
  throw new Error(`${name}暂无对应的后端接口`)
}

function listResponse(list) {
  return { data: { list } }
}

export async function getAdminMenuApi() {
  await request.get('/auth/routes')
  return listResponse(adminMenuItems)
}

export async function getAdminDashboardStatsApi() {
  const summary = await request.get('/platform/reports/summary').then(dataOf)
  const cards = [
    { key: 'activeSchools', title: '入驻学校', icon: 'School', color: 'primary', value: summary.activeSchoolCount || 0 },
    { key: 'pendingApps', title: '待审核申请', icon: 'DocumentChecked', color: 'warning', value: summary.pendingOnboardingCount || 0 },
    { key: 'activeTenants', title: '活跃租户', icon: 'User', color: 'success', value: summary.activeTenantCount ?? summary.activeSchoolCount ?? 0 },
    { key: 'totalUsers', title: '平台用户', icon: 'DataAnalysis', color: 'primary', value: summary.userCount || 0 },
  ]
  return listResponse(cards)
}

export async function getAdminStatusOptionsApi(scope) {
  return listResponse(statusOptionsMap[scope] || [])
}

export async function getAdminDataScopeOptionsApi() {
  return listResponse(dataScopeOptions)
}

export async function getPlanPermissionModulesApi() {
  const permissions = await request.get('/platform/permissions').then(dataOf)
  return listResponse(permissions || [])
}

export async function getSystemSettingsApi() {
  return unsupported('系统设置读取')
}

export async function saveSystemSettingsApi() {
  return unsupported('系统设置保存')
}

export async function getOperationTypeOptionsApi() {
  return listResponse(operationTypeOptions)
}

export async function getAuditLogsApi(params = {}) {
  const page = await request.get('/platform/audit/logs', {
    params: compactParams({ ...params, page: params.page || 1, pageSize: params.pageSize || 20 }),
  }).then(pageOf)
  return { data: { list: page.list, records: page.records, total: page.total } }
}

export async function getCredentialTypeOptionsApi() {
  return listResponse(credentialTypeOptions)
}

export async function getCredentialListApi(params = {}) {
  const applications = await request.get('/platform/onboarding/applications', {
    params: compactParams({ page: 1, pageSize: 500, status: params.status }),
  }).then(listOf)
  const rows = []
  for (const application of applications) {
    const materials = await request.get(`/platform/onboarding/applications/${application.id}/materials`).then(dataOf)
    for (const material of materials || []) {
      rows.push({
        ...material,
        id: material.id,
        tenantId: application.tenantId,
        schoolName: application.schoolName,
        credentialType: material.materialType,
        fileName: material.fileName || `材料-${material.fileId || material.id}`,
        expirationDate: material.expirationDate || '',
        status: material.status || 'valid',
      })
    }
  }
  return listResponse(rows)
}

export async function updateCredentialExpirationApi() {
  return unsupported('凭证有效期修改')
}

export async function getMonitoringStatsApi() {
  const [health, summary] = await Promise.all([
    request.get('/platform/monitoring/health').then(dataOf),
    request.get('/platform/reports/summary').then(dataOf),
  ])
  const serviceStatuses = Object.entries(health || {}).map(([name, value]) => ({
    title: name,
    value: value?.status || 'unknown',
    unit: '',
    trend: value?.status === 'up' ? 'neutral' : 'down',
  }))
  return listResponse([
    { title: '租户总数', value: summary.tenantCount || 0, unit: '个', trend: 'neutral' },
    { title: '活跃学校', value: summary.activeSchoolCount || 0, unit: '个', trend: 'neutral' },
    { title: '平台用户', value: summary.userCount || 0, unit: '人', trend: 'neutral' },
    ...serviceStatuses,
  ])
}

export async function getMonitoringAlertsApi() {
  const health = await request.get('/platform/monitoring/health').then(dataOf)
  return listResponse(Object.entries(health || [])
    .filter(([, value]) => value?.status && value.status !== 'up')
    .map(([name, value]) => ({
      id: name,
      alertType: name,
      description: value.message || `${name}状态异常`,
      severity: 'high',
      createdAt: new Date().toISOString(),
      status: 'pending',
    })))
}

export async function getSupportTicketsApi(params = {}) {
  const userInfo = JSON.parse(sessionStorage.getItem('campus_user_info') || '{}')
  const endpoint = userInfo.role_type === 'system_admin' ? '/platform/helpTickets' : '/helpTickets'
  const tickets = await request.get(endpoint, { params: compactParams(params) }).then(dataOf)
  return listResponse(tickets || [])
}

export async function updateSupportTicketApi(id, data) {
  const userInfo = JSON.parse(sessionStorage.getItem('campus_user_info') || '{}')
  const endpoint = userInfo.role_type === 'system_admin' ? `/platform/helpTickets/${id}` : `/helpTickets/${id}`
  return request.patch(endpoint, data)
  return unsupported('平台工单状态更新')
}

export async function getHelpDocumentsApi(params = {}) {
  const userInfo = JSON.parse(sessionStorage.getItem('campus_user_info') || '{}')
  const endpoint = userInfo.role_type === 'system_admin' ? '/platform/helpGuides' : '/helpGuides'
  const guides = await request.get(endpoint, { params: compactParams(params) }).then(dataOf)
  return listResponse(guides || [])
}

export async function createHelpDocumentApi() {
  return unsupported('平台帮助文档创建')
}

export async function updateHelpDocumentApi() {
  return unsupported('平台帮助文档更新')
}

export async function getReportDashboardApi() {
  const summary = await request.get('/platform/reports/summary').then(dataOf)
  return {
    data: {
      sections: [{
        key: 'platformSummary',
        title: '平台实时汇总',
        items: [
          { label: '租户总数', value: summary.tenantCount || 0 },
          { label: '活跃学校', value: summary.activeSchoolCount || 0 },
          { label: '平台用户', value: summary.userCount || 0 },
          { label: '待审核申请', value: summary.pendingOnboardingCount || 0 },
        ],
      }],
    },
  }
}

export async function getOnboardingMaterialsApi(id) {
  return { data: { list: await request.get(`/platform/onboarding/applications/${id}/materials`).then(dataOf) } }
}

export async function getTenantLifecycleApi(params = {}) {
  const page = await request.get('/platform/tenants', {
    params: compactParams({ ...params, page: params.page || 1, pageSize: params.pageSize || 500 }),
  }).then(pageOf)
  return { data: { list: page.list, total: page.total } }
}

export async function getTenantDetailApi(tenantId) {
  return { data: await request.get(`/platform/tenants/${tenantId}`).then(dataOf) }
}

export async function createTenantAdminApi(tenantId, data) {
  return request.post(`/platform/tenants/${tenantId}/admins`, data).then(dataOf)
}

export async function createTenantApi(data) {
  return request.post('/platform/public/onboarding/applications', data)
}

export async function freezeTenantApi(tenantId) {
  await request.put(`/platform/tenants/${tenantId}/status`, { status: 'frozen' })
  return { data: { tenantId, status: 'frozen' } }
}

export async function cancelTenantApi(tenantId) {
  await request.put(`/platform/tenants/${tenantId}/status`, { status: 'disabled' })
  return { data: { tenantId, status: 'disabled' } }
}

export async function changeTenantPlanApi(tenantId, planName) {
  await request.put(`/platform/tenants/${tenantId}/plan`, { planName })
  return { data: { tenantId, planName } }
}

export async function resetTenantAdminApi() {
  return unsupported('租户管理员密码重置')
}

export async function getTenantsApi(params = {}) {
  const page = await request.get('/platform/tenants', {
    params: compactParams({ ...params, page: params.page || 1, pageSize: params.pageSize || 20 }),
  }).then(pageOf)
  return { data: { list: page.list, total: page.total } }
}

export function normalizeTenantStatus(status) {
  return status || 'pending'
}

export async function getOnboardingApplicationsApi(params = {}) {
  const page = await request.get('/platform/onboarding/applications', {
    params: compactParams({ ...params, page: params.page || 1, pageSize: params.pageSize || 20 }),
  }).then(pageOf)
  return { data: { list: page.list, total: page.total } }
}

export async function auditOnboardingApi(id, action, reason, planId) {
  return request.put(`/platform/onboarding/applications/${id}/audit`, {
    action,
    reason,
    comment: reason,
    planId,
  })
}

export async function getSystemAdminsApi(params = {}) {
  const page = await request.get('/platform/admin-users', {
    params: compactParams({ ...params, page: params.page || 1, pageSize: params.pageSize || 20 }),
  }).then(pageOf)
  return { data: { list: page.list, total: page.total } }
}

export async function createSystemAdminApi(data) {
  return request.post('/platform/admin-users', data)
}

export async function updateSystemAdminApi(id, data) {
  return request.put(`/platform/admin-users/${id}`, data)
}

export async function toggleSystemAdminStatusApi(id, status = 'disabled') {
  return request.put(`/platform/admin-users/${id}/status`, { status })
}

export async function resetSystemAdminPasswordApi() {
  return unsupported('平台管理员密码重置')
}

export async function deleteSystemAdminApi(id) {
  return request.put(`/platform/admin-users/${id}/status`, { status: 'disabled' })
}

export async function getSystemRolesApi() {
  return listResponse(await request.get('/platform/roles').then(dataOf))
}

export async function getCustomRolesApi() {
  return getSystemRolesApi()
}

export async function createSystemRoleApi(data) {
  return request.post('/platform/roles', data)
}

export async function updateSystemRoleApi(id, data) {
  return request.put(`/platform/roles/${id}`, data)
}

export async function deleteSystemRoleApi(id) {
  return request.delete(`/platform/roles/${id}`)
}

export async function getMenuPermissionsApi() {
  return listResponse(await request.get('/platform/permissions').then(dataOf))
}

export function getRoleDefaultPermissionKeys(roleName, permissions = []) {
  if (roleName === '系统管理员' || roleName === 'system_admin') {
    return permissions.flatMap((item) => [
      item.id || item.permissionCode,
      ...(item.children || []).map((child) => child.id || child.permissionCode),
    ])
  }
  return []
}

export async function getTenantPlansApi(params = {}) {
  const page = await request.get('/platform/plans', {
    params: compactParams({ ...params, page: params.page || 1, pageSize: params.pageSize || 500 }),
  }).then(pageOf)
  return { data: { list: page.list, total: page.total } }
}

export async function createTenantPlanApi(data) {
  return request.post('/platform/plans', data)
}

export async function updateTenantPlanApi(id, data) {
  return request.put(`/platform/plans/${id}`, data)
}

export async function deleteTenantPlanApi(id) {
  return request.put(`/platform/plans/${id}/status`, { status: 'disabled' })
}
