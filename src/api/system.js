const adminMenuItems = [
  { index: '/admin/dashboard', title: '平台概览', icon: 'HomeFilled' },
  {
    index: '/admin/tenants',
    title: '租户管理',
    icon: 'School',
    children: [
      { index: '/admin/tenants/lifecycle', title: '生命周期' },
      { index: '/admin/plans', title: '套餐管理' },
    ],
  },
  { index: '/admin/onboarding/audit', title: '入驻审核', icon: 'DocumentChecked' },
  { index: '/admin/users/roles', title: '角色管理', icon: 'User' },
  { index: '/admin/system', title: '系统设置', icon: 'Setting' },
  {
    index: '/admin/ops',
    title: '平台运维',
    icon: 'Monitor',
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
    children: [
      { index: '/admin/documents', title: '凭证材料' },
      { index: '/admin/support', title: '工单帮助' },
    ],
  },
]

const adminDashboardCards = [
  { key: 'activeSchools', title: '入驻学校', icon: 'School', color: 'primary' },
  { key: 'pendingApps', title: '待审核申请', icon: 'DocumentChecked', color: 'warning' },
  { key: 'activeTenants', title: '活跃租户', icon: 'User', color: 'success' },
  { key: 'totalUsers', title: '平台用户', icon: 'DataAnalysis', color: 'primary' },
]

const statusOptionsMap = {
  binary: [
    { value: '', label: '全部状态' },
    { value: 'active', label: '启用' },
    { value: 'inactive', label: '禁用' },
  ],
  plan: [
    { value: '', label: '全部状态' },
    { value: 'active', label: '启用中' },
    { value: 'inactive', label: '已下架' },
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
    { value: 'pending', label: '待审核' },
    { value: 'revoked', label: '已撤销' },
  ],
  ticket: [
    { value: '', label: '全部状态' },
    { value: 'pending', label: '待处理' },
    { value: 'processing', label: '处理中' },
    { value: 'resolved', label: '已解决' },
    { value: 'closed', label: '已关闭' },
  ],
  document: [
    { value: '', label: '全部状态' },
    { value: 'draft', label: '草稿' },
    { value: 'published', label: '已发布' },
    { value: 'archived', label: '已归档' },
  ],
}

export const SYSTEM_STATUS_MAP = {
  active: { label: '启用', type: 'success' },
  inactive: { label: '禁用', type: 'info' },
  pending: { label: '待审核', type: 'warning' },
  approved: { label: '已通过', type: 'success' },
  rejected: { label: '已驳回', type: 'danger' },
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
  cancelled: { label: '已注销', type: 'info' },
}

const dataScopeOptions = [
  { value: 'all', label: '全部数据' },
  { value: 'assigned', label: '指定租户' },
  { value: 'self', label: '仅自己创建' },
]

const planPermissionModules = [
  {
    id: 'dashboard',
    title: '平台概览',
    description: '查看、刷新',
    checked: true,
    disabled: true,
  },
  {
    id: 'tenant',
    title: '租户管理',
    description: '查看列表、查看套餐、编辑、分配',
    checked: true,
    disabled: true,
  },
  {
    id: 'onboarding',
    title: '入驻审核',
    description: '查看所有申请、审核通过、审核驳回、查看材料',
    checked: true,
    disabled: true,
  },
  {
    id: 'account',
    title: '用户管理',
    description: '查看列表、新增账号、编辑账号、启用/禁用、重置密码、删除',
    checked: true,
    disabled: true,
  },
  {
    id: 'role',
    title: '角色管理',
    description: '查看列表、新增角色、编辑角色、配置权限、删除',
    checked: true,
    disabled: true,
  },
  {
    id: 'settings',
    title: '系统设置',
    description: '查看、编辑、重置配置',
    checked: true,
    disabled: true,
  },
  {
    id: 'plan',
    title: '套餐管理',
    description: '查看列表、编辑套餐、下架套餐、创建套餐、配置权限',
    checked: true,
    disabled: false,
  },
  {
    id: 'monitoring',
    title: '监控中心',
    description: '只读',
    checked: false,
    disabled: true,
  },
  {
    id: 'reports',
    title: '报表中心',
    description: '查看、导出',
    checked: false,
    disabled: true,
  },
  {
    id: 'documents',
    title: '凭证管理',
    description: '只读',
    checked: false,
    disabled: true,
  },
  {
    id: 'support',
    title: '客服支持',
    description: '查看工单、回复反馈',
    checked: false,
    disabled: true,
  },
]

const roleDefaultPermissionKeys = {
  系统管理员: 'all',
  学生: [41, 46, 71, 75],
  教职工: [71, 72],
}

const systemSettingsDefaults = {
  onboardingNotificationTemplate: '',
  expirationWarningTemplate: '',
  sensitiveWords: '',
  extremeLowScoreThreshold: 2,
  manualReviewEnabled: true,
  maxFileSize: 10,
  attachmentExpiryDays: 30,
}

const operationTypeOptions = [
  { value: 'tenant_create', label: '租户创建' },
  { value: 'tenant_update', label: '租户更新' },
  { value: 'tenant_delete', label: '租户删除' },
  { value: 'plan_update', label: '套餐变更' },
  { value: 'admin_create', label: '管理员创建' },
  { value: 'admin_update', label: '管理员更新' },
  { value: 'system_config', label: '系统配置' },
]

const credentialTypeOptions = [
  { value: 'business_license', label: '营业执照' },
  { value: 'school_permit', label: '办学许可' },
  { value: 'legal_person_id', label: '法人身份证' },
]

const monitoringStats = [
  { title: '新增租户', value: 0, unit: '个', trend: 'up' },
  { title: '到期预警', value: 0, unit: '个', trend: 'down' },
  { title: '冻结租户', value: 0, unit: '个', trend: 'neutral' },
  { title: '系统异常', value: 0, unit: '条', trend: 'up' },
]

const onboardingMaterials = [
  { id: 1, type: 'business_license', fileName: '复旦大学营业执照.pdf', fileSize: '1.8MB', uploadedAt: '2026-05-20 08:12:00' },
  { id: 2, type: 'legal_person_id', fileName: '法人身份证明.pdf', fileSize: '960KB', uploadedAt: '2026-05-20 08:13:00' },
  { id: 3, type: 'school_permit', fileName: '办学许可证明.pdf', fileSize: '1.2MB', uploadedAt: '2026-05-20 08:15:00' },
]

const tenantLifecycleRecords = [
  {
    id: 1,
    tenantId: 'T001',
    schoolName: '清华大学',
    planName: '基础版',
    expireAt: '2027-06-30',
    status: 'active',
    adminName: '赵主任',
    adminUsername: 'school_admin',
    storageQuota: '100GB',
    formQuota: 30,
    concurrencyQuota: 500,
    createdAt: '2026-01-12 09:00:00',
  },
  {
    id: 2,
    tenantId: 'T002',
    schoolName: '北京大学',
    planName: '专业版',
    expireAt: '2026-12-31',
    status: 'active',
    adminName: '钱主任',
    adminUsername: 'pku_admin',
    storageQuota: '500GB',
    formQuota: 80,
    concurrencyQuota: 2000,
    createdAt: '2026-02-18 10:30:00',
  },
  {
    id: 3,
    tenantId: 'T003',
    schoolName: '中国人民大学',
    planName: '旗舰版',
    expireAt: '2026-09-15',
    status: 'frozen',
    adminName: '周老师',
    adminUsername: 'ruc_admin',
    storageQuota: '1TB',
    formQuota: 200,
    concurrencyQuota: 5000,
    createdAt: '2026-03-02 14:00:00',
  },
]

const credentialRecords = [
  {
    id: 1,
    tenantId: 'T001',
    schoolName: '清华大学',
    credentialType: 'business_license',
    fileName: '营业执照.pdf',
    uploadTime: '2026-01-12 09:20:00',
    expirationDate: '2027-01-11',
    status: 'valid',
  },
  {
    id: 2,
    tenantId: 'T002',
    schoolName: '北京大学',
    credentialType: 'school_permit',
    fileName: '办学许可证.pdf',
    uploadTime: '2026-02-18 10:45:00',
    expirationDate: '2026-08-18',
    status: 'valid',
  },
  {
    id: 3,
    tenantId: 'T003',
    schoolName: '中国人民大学',
    credentialType: 'legal_person_id',
    fileName: '法人身份证.pdf',
    uploadTime: '2026-03-02 14:20:00',
    expirationDate: '2026-06-30',
    status: 'expired',
  },
]

const supportTickets = [
  {
    id: 1,
    ticketId: 'TK202606001',
    schoolName: '清华大学',
    title: '套餐升级后资源未生效',
    status: 'processing',
    createdAt: '2026-06-20 11:20:00',
  },
  {
    id: 2,
    ticketId: 'TK202606002',
    schoolName: '北京大学',
    title: '帮助文档中缺少表单导出说明',
    status: 'pending',
    createdAt: '2026-06-21 15:35:00',
  },
]

const helpDocuments = [
  { id: 1, title: '学校管理员开通指引', category: '入驻配置', status: 'published', updatedAt: '2026-06-10 09:30:00' },
  { id: 2, title: '评价表单发布流程', category: '业务操作', status: 'draft', updatedAt: '2026-06-18 14:10:00' },
]

const auditLogRecords = [
  {
    id: 1,
    operatorName: '系统管理员',
    schoolName: '清华大学',
    operationType: 'tenant_update',
    description: '调整清华大学租户资源配额',
    ipAddress: '10.0.0.12',
    createdAt: '2026-06-20 09:10:00',
  },
  {
    id: 2,
    operatorName: '王建国',
    schoolName: '北京大学',
    operationType: 'plan_update',
    description: '将北京大学套餐升级为专业版',
    ipAddress: '10.0.0.18',
    createdAt: '2026-06-21 16:25:00',
  },
]

const monitoringAlerts = [
  { id: 1, alertType: '存储超限', description: '北京大学对象存储使用率超过 90%', severity: '高', createdAt: '2026-06-22 08:30:00', status: 'pending' },
  { id: 2, alertType: '敏感评价', description: '清华大学评价追溯服务发现高风险敏感词', severity: '中', createdAt: '2026-06-22 13:15:00', status: 'processing' },
  { id: 3, alertType: '服务异常', description: '表单配置服务响应时间超过阈值', severity: '高', createdAt: '2026-06-23 10:05:00', status: 'resolved' },
]

const adminStats = {
  activeSchools: 2,
  pendingApps: 1,
  activeTenants: 2,
  totalUsers: 6,
}

const onboardingApplicationRecords = [
  {
    id: 1,
    schoolName: '复旦大学',
    contactName: '王建国',
    contactPhone: '13900001111',
    planName: '专业版',
    planId: 2,
    status: 'pending',
    creditCode: '91310000MA1FL8XX3N',
    createdAt: '2026-06-20 09:00:00',
  },
  {
    id: 2,
    schoolName: '浙江大学',
    contactName: '李明华',
    contactPhone: '13800002222',
    planName: '基础版',
    planId: 1,
    status: 'approved',
    creditCode: '91330000MA2H0XX65K',
    createdAt: '2026-06-15 14:30:00',
  },
  {
    id: 3,
    schoolName: '南京大学',
    contactName: '赵文静',
    contactPhone: '13700003333',
    planName: '旗舰版',
    planId: 3,
    status: 'rejected',
    creditCode: '91320000MA1WXX908P',
    createdAt: '2026-06-10 10:15:00',
  },
]

const systemAdminRecords = [
  { id: 1, username: 'admin', realName: '系统管理员', roleName: '系统管理员', email: 'admin@platform.cn', phone: '13800000000', status: 'active', createdAt: '2025-01-01 00:00:00' },
]

const systemRoleRecords = [
  { id: 1, roleName: '系统管理员', description: '拥有平台全部管理权限', dataScope: 'all', createdAt: '2025-01-01 00:00:00' },
]

const menuPermissionRecords = [
  {
    id: 'dashboard', label: '平台概览',
    children: [
      { id: 'dashboard:view', label: '查看概览' },
    ],
  },
  {
    id: 'tenant', label: '租户管理',
    children: [
      { id: 'tenant:view', label: '查看租户' },
      { id: 'tenant:lifecycle', label: '生命周期管理' },
      { id: 'tenant:plan', label: '套餐管理' },
    ],
  },
  {
    id: 'onboarding', label: '入驻审核',
    children: [
      { id: 'onboarding:view', label: '查看申请' },
      { id: 'onboarding:audit', label: '审核操作' },
    ],
  },
  {
    id: 'role', label: '角色管理',
    children: [
      { id: 'role:view', label: '查看角色' },
      { id: 'role:edit', label: '编辑角色' },
      { id: 'role:permission', label: '配置权限' },
    ],
  },
  {
    id: 'settings', label: '系统设置',
    children: [
      { id: 'settings:view', label: '查看配置' },
      { id: 'settings:edit', label: '编辑配置' },
    ],
  },
  {
    id: 'ops', label: '平台运维',
    children: [
      { id: 'ops:monitoring', label: '监控告警' },
      { id: 'ops:audit-log', label: '审计日志' },
      { id: 'ops:reports', label: '统计报表' },
    ],
  },
]

const tenantPlanRecords = [
  { id: 1, planName: '基础版', description: '满足基本评价需求', maxForms: 30, maxUsers: 500, storageQuota: '100GB', status: 'active', price: '免费' },
  { id: 2, planName: '专业版', description: '适合中大规模学校', maxForms: 80, maxUsers: 2000, storageQuota: '500GB', status: 'active', price: '¥2,000/年' },
  { id: 3, planName: '旗舰版', description: '全功能无限制', maxForms: 200, maxUsers: 5000, storageQuota: '1TB', status: 'active', price: '¥5,000/年' },
]

function clone(data) {
  return JSON.parse(JSON.stringify(data))
}

export function getAdminMenuApi() {
  return Promise.resolve({ data: { list: clone(adminMenuItems) } })
}

export function getAdminDashboardStatsApi() {
  return Promise.resolve({
    data: {
      list: adminDashboardCards.map((card) => ({
        ...card,
        value: adminStats[card.key] || 0,
      })),
    },
  })
}

export function getAdminStatusOptionsApi(scope) {
  return Promise.resolve({ data: { list: clone(statusOptionsMap[scope] || []) } })
}

export function getAdminDataScopeOptionsApi() {
  return Promise.resolve({ data: { list: clone(dataScopeOptions) } })
}

export function getPlanPermissionModulesApi() {
  return Promise.resolve({ data: { list: clone(planPermissionModules) } })
}

export function getSystemSettingsApi() {
  return Promise.resolve({ data: clone(systemSettingsDefaults) })
}

export function saveSystemSettingsApi(data) {
  return Promise.resolve({ data: clone(data) })
}

export function getOperationTypeOptionsApi() {
  return Promise.resolve({ data: { list: clone(operationTypeOptions) } })
}

export function getAuditLogsApi() {
  return Promise.resolve({ data: { list: clone(auditLogRecords) } })
}

export function getCredentialTypeOptionsApi() {
  return Promise.resolve({ data: { list: clone(credentialTypeOptions) } })
}

export function getCredentialListApi() {
  return Promise.resolve({ data: { list: clone(credentialRecords) } })
}

export function getMonitoringStatsApi() {
  const frozenCount = tenantLifecycleRecords.filter((item) => item.status === 'frozen').length
  return Promise.resolve({
    data: {
      list: clone(monitoringStats).map((item) => {
        if (item.title === '新增租户') return { ...item, value: 3 }
        if (item.title === '到期预警') return { ...item, value: 2 }
        if (item.title === '冻结租户') return { ...item, value: frozenCount }
        if (item.title === '系统异常') return { ...item, value: monitoringAlerts.length }
        return item
      }),
    },
  })
}

export function getMonitoringAlertsApi() {
  return Promise.resolve({ data: { list: clone(monitoringAlerts) } })
}

export function getSupportTicketsApi() {
  return Promise.resolve({ data: { list: clone(supportTickets) } })
}

export function getHelpDocumentsApi() {
  return Promise.resolve({ data: { list: clone(helpDocuments) } })
}

export function getReportDashboardApi() {
  return Promise.resolve({
    data: {
      sections: [
        {
          key: 'monthlyTenants',
          title: '月度新增 / 到期租户统计',
          items: [
            { label: '4月新增', value: 8 },
            { label: '5月新增', value: 12 },
            { label: '6月新增', value: 15 },
            { label: '6月到期', value: 3 },
          ],
        },
        {
          key: 'ticketStats',
          title: '工单处理量统计',
          items: [
            { label: '待处理', value: 4 },
            { label: '处理中', value: 7 },
            { label: '已解决', value: 26 },
            { label: '已关闭', value: 18 },
          ],
        },
        {
          key: 'resourceUsage',
          title: '系统资源占用情况',
          items: [
            { label: '对象存储', value: 72 },
            { label: '导入队列', value: 38 },
            { label: '评价并发', value: 56 },
            { label: '日志索引', value: 64 },
          ],
        },
      ],
    },
  })
}

export function getOnboardingMaterialsApi() {
  return Promise.resolve({ data: { list: clone(onboardingMaterials) } })
}

export function getTenantLifecycleApi() {
  return Promise.resolve({ data: { list: clone(tenantLifecycleRecords) } })
}

export function getTenantDetailApi(tenantId) {
  const tenant = tenantLifecycleRecords.find((item) => item.tenantId === tenantId)
  return Promise.resolve({
    data: {
      tenant: clone(tenant || tenantLifecycleRecords[0]),
      admins: [
        { id: 1, username: tenant?.adminUsername || 'school_admin', realName: tenant?.adminName || '学校管理员', phone: '13800000001', status: 'active' },
      ],
      quotas: {
        formQuota: tenant?.formQuota || 30,
        storageQuota: tenant?.storageQuota || '100GB',
        concurrencyQuota: tenant?.concurrencyQuota || 500,
      },
      auditLogs: clone(auditLogRecords.filter((item) => !tenant || item.schoolName === tenant.schoolName)),
    },
  })
}

export function createTenantApi(data) {
  return Promise.resolve({ data })
}

export function freezeTenantApi(tenantId) {
  return Promise.resolve({ data: { tenantId, status: 'frozen' } })
}

export function cancelTenantApi(tenantId) {
  return Promise.resolve({ data: { tenantId, status: 'cancelled' } })
}

export function changeTenantPlanApi(tenantId, planName) {
  return Promise.resolve({ data: { tenantId, planName } })
}

export function resetTenantAdminApi(tenantId) {
  return Promise.resolve({ data: { tenantId, password: 'admin123' } })
}

export function getTenantsApi() {
  const tenants = [
    { id: 1, tenantId: 'T001', schoolName: '清华大学', status: 'onboarded', planName: '基础版', adminName: '赵主任', createdAt: '2026-01-12 09:00:00' },
    { id: 2, tenantId: 'T002', schoolName: '北京大学', status: 'onboarded', planName: '专业版', adminName: '钱主任', createdAt: '2026-02-18 10:30:00' },
  ]
  return Promise.resolve({ data: { list: tenants } })
}

export function normalizeTenantStatus(status) {
  return status === '已入驻' ? 'onboarded' : 'pending'
}

export function getOnboardingApplicationsApi(params) {
  let list = clone(onboardingApplicationRecords)
  if (params?.status) list = list.filter(i => i.status === params.status)
  if (params?.schoolName) list = list.filter(i => i.schoolName.includes(params.schoolName))
  return Promise.resolve({ data: { list } })
}

export function auditOnboardingApi(id, action, reason, planId) {
  return Promise.resolve({ data: { id, action, reason, planId } })
}

export function getSystemAdminsApi(params) {
  let list = clone(systemAdminRecords)
  if (params?.username) list = list.filter(i => i.username.includes(params.username))
  if (params?.realName) list = list.filter(i => i.realName.includes(params.realName))
  if (params?.status) list = list.filter(i => i.status === params.status)
  return Promise.resolve({ data: { list } })
}

export function createSystemAdminApi(data) {
  return Promise.resolve({ data: { id: Date.now(), ...data, status: 'active' } })
}

export function updateSystemAdminApi(id, data) {
  return Promise.resolve({ data: { id, ...data } })
}

export function toggleSystemAdminStatusApi(id) {
  return Promise.resolve({ data: { id } })
}

export function resetSystemAdminPasswordApi(id) {
  return Promise.resolve({ data: { id } })
}

export function deleteSystemAdminApi(id) {
  return Promise.resolve({ data: { id } })
}

export function getSystemRolesApi() {
  return Promise.resolve({ data: { list: clone(systemRoleRecords) } })
}

export function getCustomRolesApi() {
  return Promise.resolve({ data: { list: [] } })
}

export function createSystemRoleApi(data) {
  return Promise.resolve({ data: { id: Date.now(), ...data } })
}

export function updateSystemRoleApi(id, data) {
  return Promise.resolve({ data: { id, ...data } })
}

export function deleteSystemRoleApi(id) {
  return Promise.resolve({ data: { id } })
}

export function getMenuPermissionsApi() {
  return Promise.resolve({ data: { list: clone(menuPermissionRecords) } })
}

export function getRoleDefaultPermissionKeys(roleName, permissions) {
  const defaultValue = roleDefaultPermissionKeys[roleName]
  if (defaultValue === 'all') {
    return permissions.flatMap((item) => [
      item.id,
      ...(item.children || []).map((child) => child.id),
    ])
  }
  return defaultValue || []
}

export function getTenantPlansApi() {
  return Promise.resolve({ data: { list: clone(tenantPlanRecords) } })
}

export function createTenantPlanApi(data) {
  return Promise.resolve({ data: { id: Date.now(), ...data } })
}

export function updateTenantPlanApi(id, data) {
  return Promise.resolve({ data: { id, ...data } })
}

export function deleteTenantPlanApi(id) {
  return Promise.resolve({ data: { id } })
}
