/**
 * Mock Server - 基于 json-server 的接口模拟服务器
 * 
 * 启动命令: npm run mock
 * 接口地址: http://localhost:3001/api
 * 
 * 数据结构遵循 ER 图，所有学校侧数据通过 tenant_id 隔离
 */

const jsonServer = require('json-server')
const path = require('path')

const server = jsonServer.create()
const router = jsonServer.router(path.join(__dirname, 'db.json'))
const middlewares = jsonServer.defaults()
const db = router.db

const tenantPlans = [
  {
    id: 1,
    planName: '基础版',
    description: '适合小规模学校试用，包含基础评价表单、学生评价和统计概览。',
    features: '基础评价表单、学生评价、统计概览',
    price: '免费',
    maxUsers: 500,
    storageLimit: 100,
    duration: '500人',
    durationDays: 365,
    status: 'active',
    createdAt: '2026-01-01 09:00:00',
  },
  {
    id: 2,
    planName: '专业版',
    description: '适合正式上线学校，支持多角色协作、工单处理、凭证管理和数据报表。',
    features: '多角色协作、工单处理、凭证管理、数据报表',
    price: '¥1999/年',
    maxUsers: 2000,
    storageLimit: 500,
    duration: '2000人',
    durationDays: 365,
    status: 'active',
    createdAt: '2026-02-01 09:00:00',
  },
  {
    id: 3,
    planName: '旗舰版',
    description: '适合多校区或评价规模较大的学校，开放更多报表、并发与存储配额。',
    features: '高级报表、容量扩展、高并发评价、专属支持',
    price: '¥4999/年',
    maxUsers: 8000,
    storageLimit: 1024,
    duration: '8000人',
    durationDays: 365,
    status: 'active',
    createdAt: '2026-03-01 09:00:00',
  },
]

const systemAdmins = [
  {
    id: 1,
    username: 'admin',
    realName: '系统管理员',
    roleName: '系统管理员',
    email: 'admin@platform.cn',
    phone: '13800000000',
    status: 'active',
    createdAt: '2026-01-01 09:00:00',
  },
  {
    id: 2,
    username: 'ops_admin',
    realName: '运维管理员',
    roleName: '平台运维',
    email: 'ops@platform.cn',
    phone: '13800000002',
    status: 'active',
    createdAt: '2026-06-08 10:20:00',
  },
]

const systemRoles = [
  {
    id: 1,
    roleName: '系统管理员',
    description: '拥有平台租户、账号、权限、审计和运维的全部管理权限。',
    dataScope: 'all',
    status: 'active',
    createdAt: '2026-01-01 09:00:00',
  },
  {
    id: 2,
    roleName: '平台运维',
    description: '负责监控告警、审计日志、统计报表和工单支持。',
    dataScope: 'assigned',
    status: 'active',
    createdAt: '2026-04-12 15:30:00',
  },
]

const customRoles = [
  {
    id: 101,
    roleName: '入驻审核员',
    description: '负责学校入驻材料核验、套餐分配和审核意见填写。',
    dataScope: 'assigned',
    status: 'active',
    createdAt: '2026-06-10 11:00:00',
  },
]

const menuPermissions = [
  {
    id: 10,
    label: '平台概览',
    children: [
      { id: 11, label: '查看统计卡片' },
      { id: 12, label: '查看趋势图表' },
    ],
  },
  {
    id: 20,
    label: '租户管理',
    children: [
      { id: 21, label: '查看租户' },
      { id: 22, label: '创建租户' },
      { id: 23, label: '冻结租户' },
      { id: 24, label: '调整套餐' },
    ],
  },
  {
    id: 30,
    label: '入驻审核',
    children: [
      { id: 31, label: '查看申请' },
      { id: 32, label: '审核通过' },
      { id: 33, label: '审核驳回' },
      { id: 34, label: '查看材料' },
    ],
  },
  {
    id: 40,
    label: '用户管理',
    children: [
      { id: 41, label: '查看账号' },
      { id: 42, label: '新增账号' },
      { id: 43, label: '编辑账号' },
      { id: 44, label: '配置角色' },
    ],
  },
  {
    id: 50,
    label: '平台运维',
    children: [
      { id: 51, label: '监控告警' },
      { id: 52, label: '审计日志' },
      { id: 53, label: '统计报表' },
      { id: 54, label: '工单帮助' },
    ],
  },
]

const onboardingApplications = [
  {
    id: 1,
    schoolName: '复旦大学',
    creditCode: '91310000FUDAN00001',
    contactName: '陈老师',
    contactPhone: '13800000011',
    contactEmail: 'contact@fudan.edu.cn',
    planId: 2,
    planName: '专业版',
    status: 'pending',
    createdAt: '2026-06-18 09:10:00',
  },
  {
    id: 2,
    schoolName: '上海交通大学',
    creditCode: '91310000SJTU000002',
    contactName: '刘老师',
    contactPhone: '13800000012',
    contactEmail: 'contact@sjtu.edu.cn',
    planId: 3,
    planName: '旗舰版',
    status: 'approved',
    createdAt: '2026-06-16 14:25:00',
  },
]

function ok(res, data, message = 'success') {
  res.json({ code: 200, message, data })
}

function nextId(list) {
  return list.length > 0 ? Math.max(...list.map(item => Number(item.id) || 0)) + 1 : 1
}

function applyFilters(list, query, keys) {
  return list.filter(item => keys.every(key => {
    const val = query[key]
    if (val === undefined || val === null || val === '') return true
    return String(item[key] || '').includes(String(val))
  }))
}

server.use(middlewares)
server.use(require('express').json())
server.use(require('express').urlencoded({ extended: true }))

// 请求日志
server.use((req, res, next) => {
  const timestamp = new Date().toLocaleString('zh-CN')
  console.log(`[${timestamp}] ${req.method} ${req.url}`)
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    console.log(`  Body:`, JSON.stringify(req.body, null, 2))
  }
  next()
})

// ==================== 认证相关 ====================

// 获取已激活租户（学校）列表
server.get('/api/tenants', (req, res) => {
  const schoolProfiles = db.get('schoolProfiles').value()
  const plans = tenantPlans
  const tenants = db.get('tenants').value()
    .filter(t => t.status === 'active' && !t.deleted)
    .map(t => {
      const school = schoolProfiles.find(s => s.tenant_id === t.id)
      const plan = plans.find(p => p.id === t.plan_id) || plans[0]
      return {
        ...t,
        tenantId: 'T' + String(t.id).padStart(3, '0'),
        schoolName: t.school_name,
        planName: plan.planName,
        createdAt: (t.created_at || '').replace('T', ' ').slice(0, 19),
        website: school?.website || '',
        address: school?.address || '',
      }
    })
  ok(res, { list: tenants, total: tenants.length })
})

// 登录接口
server.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ code: 400, message: '用户名和密码不能为空' })
  }

  const accounts = db.get('userAccounts').value()
  const account = accounts.find(u => u.username === username && u.status === 'active' && !u.deleted)
  // mock 环境简化：密码统一为 123456（admin 为 admin123）
  const pwdMatch = username === 'admin' ? password === 'admin123' : password === '123456'

  if (!account || !pwdMatch) {
    return res.status(401).json({ code: 401, message: '用户名或密码错误' })
  }

  const profiles = db.get('personProfiles').value()
  const profile = profiles.find(p => p.user_id === account.id && !p.deleted)
  const userRoles = db.get('userRoles').value()
  const roles = db.get('roles').value()
  const userRoleRecords = userRoles.filter(ur => ur.user_id === account.id && !ur.deleted)
  const userRoleList = userRoleRecords.map(ur => {
    const role = roles.find(r => r.id === ur.role_id)
    return role ? { role_code: role.role_code, role_name: role.role_name } : null
  }).filter(Boolean)

  const token = 'mock_token_' + account.id + '_' + Date.now()

  // 存储 token
  const tokens = db.get('tokens') || []
  const tokenList = Array.isArray(tokens) ? tokens : []
  tokenList.push({
    id: tokenList.length + 1,
    token,
    userId: account.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  })
  db.set('tokens', tokenList).write()

  // 获取学校名称
  const tenantRecord = db.get('tenants').value().find(t => t.id === account.tenant_id)
  const schoolName = tenantRecord ? tenantRecord.school_name : ''

  res.json({
    code: 200,
    message: '登录成功',
    data: {
      token,
      user: {
        id: account.id,
        username: account.username,
        tenant_id: account.tenant_id,
        real_name: profile ? profile.real_name : account.username,
        role_type: profile ? profile.role_type : 'student',
        no_student: profile ? profile.no_student : null,
        no_work: profile ? profile.no_work : null,
        org_unit_id: profile ? profile.org_unit_id || null : null,
        roles: userRoleList
      },
      tenant_id: account.tenant_id,
      school_id: account.tenant_id,
      school_name: schoolName
    }
  })
})

// 身份验证（学号/工号 + 姓名）
server.post('/api/auth/verify-identity', (req, res) => {
  const { schoolId, studentNo, realName } = req.body
  if (!schoolId || !studentNo || !realName) {
    return res.status(400).json({ code: 400, message: '缺少必要参数' })
  }

  const profiles = db.get('personProfiles').value()
  const profile = profiles.find(p =>
    p.tenant_id === schoolId &&
    (p.no_student === studentNo || p.no_work === studentNo) &&
    p.real_name === realName &&
    (p.role_type === 'student' || p.role_type === 'staff') &&
    !p.deleted
  )

  if (!profile) {
    return res.status(400).json({ code: 400, message: '未找到匹配的身份信息' })
  }

  res.json({
    code: 200,
    message: '验证通过',
    data: {
      user_id: profile.user_id,
      student_no: profile.no_student || profile.no_work,
      real_name: profile.real_name,
      role_type: profile.role_type
    }
  })
})

// 注册接口
server.post('/api/auth/register', (req, res) => {
  const { tenant_id, username, password, real_name, phone, email, no_student, no_work, role_type } = req.body
  if (!username || !password || !real_name) {
    return res.status(400).json({ code: 400, message: '用户名、密码和真实姓名不能为空' })
  }

  const accounts = db.get('userAccounts').value()
  if (accounts.find(u => u.username === username)) {
    return res.status(400).json({ code: 400, message: '用户名已存在' })
  }

  const newAccount = {
    id: accounts.length > 0 ? Math.max(...accounts.map(u => u.id)) + 1 : 1,
    tenant_id: tenant_id || null,
    username,
    phone: phone || null,
    email: email || null,
    status: 'active',
    must_change_password: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted: false
  }
  accounts.push(newAccount)
  db.set('userAccounts', accounts).write()

  const profiles = db.get('personProfiles').value()
  const newProfile = {
    id: newAccount.id,
    tenant_id: tenant_id || null,
    user_id: newAccount.id,
    real_name,
    role_type: role_type || 'student',
    no_work: no_work || null,
    no_student: no_student || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted: false
  }
  profiles.push(newProfile)
  db.set('personProfiles', profiles).write()

  res.json({
    code: 200,
    message: '注册成功',
    data: { user: { ...newAccount, real_name, role_type: role_type || 'student' }, tenant_id }
  })
})

// 忘记密码
server.post('/api/auth/forgot-password', (req, res) => {
  const { username, newPassword } = req.body
  if (!username || !newPassword) {
    return res.status(400).json({ code: 400, message: '用户名和新密码不能为空' })
  }
  const accounts = db.get('userAccounts').value()
  const account = accounts.find(u => u.username === username)
  if (!account) {
    return res.status(400).json({ code: 400, message: '该账号不存在' })
  }
  res.json({ code: 200, message: '密码重置成功' })
})

// 获取学校列表（兼容旧接口）
server.get('/api/auth/schools', (req, res) => {
  const tenants = db.get('tenants').value().filter(t => t.status === 'active' && !t.deleted)
  const schools = db.get('schoolProfiles').value().filter(s => !s.deleted)
  const merged = tenants.map(t => {
    const sp = schools.find(s => s.tenant_id === t.id)
    return { id: t.id, tenantId: 'T' + String(t.id).padStart(3, '0'), schoolName: t.school_name, status: t.status, ...sp }
  })
  res.json({ code: 200, message: 'success', data: merged })
})

// ==================== 系统管理端 Mock 接口 ====================

server.get('/api/admin/stats', (req, res) => {
  const tenants = db.get('tenants').value().filter(t => !t.deleted)
  const activeTenants = tenants.filter(t => t.status === 'active').length
  const pendingApps = onboardingApplications.filter(item => item.status === 'pending').length
  const totalUsers = db.get('userAccounts').value().filter(item => !item.deleted).length
  ok(res, {
    activeSchools: activeTenants,
    pendingApps,
    activeTenants,
    totalUsers,
  })
})

server.get('/api/tenant-plans', (req, res) => {
  const list = applyFilters(tenantPlans, req.query, ['planName', 'status'])
  ok(res, { list, total: list.length })
})

server.post('/api/tenant-plans', (req, res) => {
  const item = {
    id: nextId(tenantPlans),
    planName: req.body.planName,
    description: req.body.features || req.body.description || '',
    features: req.body.features || req.body.description || '',
    price: req.body.price === 0 ? '免费' : `¥${Number(req.body.price || 0).toLocaleString()}/年`,
    maxUsers: req.body.maxUsers || 500,
    storageLimit: req.body.storageLimit || 100,
    duration: `${req.body.maxUsers || 500}人`,
    durationDays: req.body.durationDays || 365,
    status: 'active',
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
  }
  tenantPlans.push(item)
  ok(res, item, '创建成功')
})

server.put('/api/tenant-plans/:id', (req, res) => {
  const item = tenantPlans.find(plan => plan.id === Number(req.params.id))
  if (!item) return res.status(404).json({ code: 404, message: '未找到套餐' })
  Object.assign(item, {
    planName: req.body.planName ?? item.planName,
    description: req.body.features || req.body.description || item.description,
    features: req.body.features || req.body.description || item.features,
    price: req.body.price === 0 ? '免费' : (req.body.price ? `¥${Number(req.body.price).toLocaleString()}/年` : item.price),
    maxUsers: req.body.maxUsers ?? item.maxUsers,
    storageLimit: req.body.storageLimit ?? item.storageLimit,
    duration: req.body.maxUsers ? `${req.body.maxUsers}人` : item.duration,
    durationDays: req.body.durationDays ?? item.durationDays,
  })
  ok(res, item, '更新成功')
})

server.delete('/api/tenant-plans/:id', (req, res) => {
  const item = tenantPlans.find(plan => plan.id === Number(req.params.id))
  if (!item) return res.status(404).json({ code: 404, message: '未找到套餐' })
  item.status = 'inactive'
  ok(res, item, '下架成功')
})

server.get('/api/onboarding-applications', (req, res) => {
  const list = applyFilters(onboardingApplications, req.query, ['schoolName', 'status'])
  ok(res, { list, total: list.length })
})

server.post('/api/onboarding-applications/:id/audit', (req, res) => {
  const item = onboardingApplications.find(app => app.id === Number(req.params.id))
  if (!item) return res.status(404).json({ code: 404, message: '未找到入驻申请' })
  item.status = req.body.action || item.status
  item.auditReason = req.body.reason || ''
  item.planId = req.body.planId || item.planId
  const plan = tenantPlans.find(p => p.id === Number(item.planId))
  item.planName = plan?.planName || item.planName
  ok(res, item, '审核成功')
})

server.get('/api/system-admins', (req, res) => {
  const list = applyFilters(systemAdmins, req.query, ['username', 'realName', 'status'])
  ok(res, { list, total: list.length })
})

server.post('/api/system-admins', (req, res) => {
  if (systemAdmins.some(item => item.username === req.body.username)) {
    return res.status(400).json({ code: 400, message: '用户名已存在' })
  }
  const item = {
    id: nextId(systemAdmins),
    username: req.body.username,
    realName: req.body.realName,
    roleName: req.body.roleName || '平台运维',
    email: req.body.email || '',
    phone: req.body.phone || '',
    status: 'active',
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
  }
  systemAdmins.push(item)
  ok(res, item, '创建成功')
})

server.put('/api/system-admins/:id', (req, res) => {
  const item = systemAdmins.find(admin => admin.id === Number(req.params.id))
  if (!item) return res.status(404).json({ code: 404, message: '未找到管理员' })
  Object.assign(item, {
    realName: req.body.realName ?? item.realName,
    email: req.body.email ?? item.email,
    phone: req.body.phone ?? item.phone,
  })
  ok(res, item, '更新成功')
})

server.patch('/api/system-admins/:id/status', (req, res) => {
  const item = systemAdmins.find(admin => admin.id === Number(req.params.id))
  if (!item) return res.status(404).json({ code: 404, message: '未找到管理员' })
  item.status = item.status === 'active' ? 'inactive' : 'active'
  ok(res, item, '状态已更新')
})

server.post('/api/system-admins/:id/reset-password', (req, res) => {
  const item = systemAdmins.find(admin => admin.id === Number(req.params.id))
  if (!item) return res.status(404).json({ code: 404, message: '未找到管理员' })
  ok(res, { id: item.id, password: 'admin123' }, '密码已重置')
})

server.delete('/api/system-admins/:id', (req, res) => {
  const index = systemAdmins.findIndex(admin => admin.id === Number(req.params.id))
  if (index === -1) return res.status(404).json({ code: 404, message: '未找到管理员' })
  const [removed] = systemAdmins.splice(index, 1)
  ok(res, removed, '删除成功')
})

server.get('/api/system-roles', (req, res) => {
  ok(res, { list: systemRoles, total: systemRoles.length })
})

server.get('/api/custom-roles', (req, res) => {
  ok(res, { list: customRoles, total: customRoles.length })
})

server.post('/api/system-roles', (req, res) => {
  const item = {
    id: nextId(customRoles),
    roleName: req.body.roleName,
    description: req.body.description,
    dataScope: req.body.dataScope || 'assigned',
    status: 'active',
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
  }
  customRoles.push(item)
  ok(res, item, '创建成功')
})

server.put('/api/system-roles/:id', (req, res) => {
  const item = customRoles.find(role => role.id === Number(req.params.id))
  if (!item) return res.status(404).json({ code: 404, message: '未找到自定义角色' })
  Object.assign(item, {
    roleName: req.body.roleName ?? item.roleName,
    description: req.body.description ?? item.description,
    dataScope: req.body.dataScope ?? item.dataScope,
  })
  ok(res, item, '更新成功')
})

server.delete('/api/system-roles/:id', (req, res) => {
  const index = customRoles.findIndex(role => role.id === Number(req.params.id))
  if (index === -1) return res.status(404).json({ code: 404, message: '未找到自定义角色' })
  const [removed] = customRoles.splice(index, 1)
  ok(res, removed, '删除成功')
})

server.get('/api/menu-permissions', (req, res) => {
  ok(res, { list: menuPermissions })
})

// 学校入驻申请（兼容旧接口）
server.post('/api/schools/onboarding', (req, res) => {
  const plan = tenantPlans.find(p => p.id === Number(req.body.planId))
  const item = {
    id: nextId(onboardingApplications),
    schoolName: req.body.schoolName,
    creditCode: req.body.creditCode,
    contactName: req.body.contactName,
    contactPhone: req.body.contactPhone,
    contactEmail: req.body.contactEmail,
    planId: req.body.planId,
    planName: plan?.planName || '',
    status: 'pending',
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
  }
  onboardingApplications.push(item)
  ok(res, item, '入驻申请已提交')
})

// 部门列表（兼容旧接口）
server.get('/api/departments', (req, res) => {
  const schoolId = parseInt(req.query.schoolId)
  const units = db.get('teachingOrgUnits').value().filter(u => u.tenant_id === schoolId && !u.deleted)
  res.json({ code: 200, message: 'success', data: units })
})

// ==================== REST 资源统一包装路由 ====================
// 将 json-server 默认返回的数组包装为 { code, data } 格式

const restResources = [
  'notifications', 'evaluationWindows', 'evaluationForms', 'evaluationSubmissions',
  'evaluationAttachments', 'onboardingMaterials',
  'evaluationQuestions', 'evaluationQuestionOptions', 'evaluationAnswers', 'evaluationScores',
  'complaints', 'complaintProcessRecords', 'feedbackWorkOrders',
  'fileResources', 'courses', 'serviceItems', 'courseEnrollments',
  'courseTeachers', 'teachingOrgUnits', 'serviceOrgUnits',
  'personProfiles', 'userAccounts', 'roles', 'userRoles',
  'tenantStatSnapshots', 'serviceStatSnapshots', 'tenants', 'schoolProfiles',
  'appealRequests', 'appealProcessRecords', 'traceAuthorizations', 'operationLogs',
  'formPublishAudits',
]

restResources.forEach(resource => {
  server.get(`/api/${resource}`, (req, res) => {
    let data = db.get(resource).value()
    // 按查询参数过滤
    const queryKeys = Object.keys(req.query)
    queryKeys.forEach(key => {
      if (key.startsWith('_')) return // 跳过 json-server 内置参数
      const val = req.query[key]
      // 支持 tenant_id=1&tenant_id=2 多值
      const values = Array.isArray(val) ? val : [val]
      data = data.filter(item => {
        // 支持 deleted 过滤
        if (key === 'deleted') return String(item[key]) === val
        return values.map(v => {
          if (typeof item[key] === 'number') return item[key] === Number(v)
          return String(item[key]) === String(v)
        }).some(Boolean)
      })
    })
    // 排序
    if (req.query._sort) {
      const sortKey = req.query._sort
      const order = req.query._order === 'desc' ? -1 : 1
      data.sort((a, b) => {
        if (a[sortKey] < b[sortKey]) return -1 * order
        if (a[sortKey] > b[sortKey]) return 1 * order
        return 0
      })
    }
    res.json({ code: 200, message: 'success', data })
  })

  // 单条资源
  server.get(`/api/${resource}/:id`, (req, res) => {
    const id = Number(req.params.id)
    const item = db.get(resource).value().find(r => r.id === id)
    if (!item) return res.status(404).json({ code: 404, message: '未找到' })
    res.json({ code: 200, message: 'success', data: item })
  })
})

// ==================== 首页聚合接口 ====================

// 获取当前学生的首页概览统计
server.get('/api/dashboard/overview', (req, res) => {
  const userId = parseInt(req.query.user_id)
  const tenantId = parseInt(req.query.tenant_id)
  if (!userId || !tenantId) {
    return res.status(400).json({ code: 400, message: '缺少 user_id 或 tenant_id' })
  }

  const now = new Date()
  const submissions = db.get('evaluationSubmissions').value()
  const windows = db.get('evaluationWindows').value()
  const complaints = db.get('complaints').value()

  // 已完成：当前学生已提交的
  const completedCount = submissions.filter(s =>
    s.tenant_id === tenantId && s.evaluator_user_id === userId && s.status === 'submitted' && !s.deleted
  ).length

  // 待评价：窗口开放中且当前学生未提交的
  const openWindows = windows.filter(w =>
    w.tenant_id === tenantId && !w.deleted && new Date(w.start_at) <= now && new Date(w.end_at) >= now
  )
  const submittedFormIds = submissions
    .filter(s => s.tenant_id === tenantId && s.evaluator_user_id === userId && !s.deleted)
    .map(s => s.form_id)
  const pendingCount = openWindows.filter(w => !submittedFormIds.includes(w.form_id)).length

  // 处理中的反馈
  const processingFeedbackCount = complaints.filter(c =>
    c.tenant_id === tenantId && c.submitter_id === userId && c.status === 'processing' && !c.deleted
  ).length

  // 参与率（从快照读取）
  const statSnapshots = db.get('tenantStatSnapshots').value()
  const stat = statSnapshots.find(s => s.tenant_id === tenantId && s.metric_key === 'student_participation_rate')
  const participationRate = stat ? stat.metric_value : 0

  res.json({
    code: 200,
    message: 'success',
    data: { completedCount, pendingCount, processingFeedbackCount, participationRate }
  })
})

// ==================== json-server 默认路由 ====================
server.use('/api', router)

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log('')
  console.log('='.repeat(60))
  console.log('  Mock Server 已启动')
  console.log(`  接口地址: http://localhost:${PORT}/api`)
  console.log('')
  console.log('  自定义接口:')
  console.log('    POST /api/auth/login          登录')
  console.log('    POST /api/auth/register       注册')
  console.log('    GET  /api/auth/schools        学校列表')
  console.log('    POST /api/auth/verify-identity 身份验证')
  console.log('    GET  /api/tenants             租户列表')
  console.log('    GET  /api/dashboard/overview  首页概览统计')
  console.log('')
  console.log('  REST 资源 (json-server 自动路由):')
  console.log('    GET  /api/notifications?tenant_id=1&status=published')
  console.log('    GET  /api/evaluationWindows?tenant_id=1')
  console.log('    GET  /api/evaluationForms?tenant_id=1')
  console.log('    GET  /api/evaluationSubmissions?tenant_id=1&evaluator_user_id=1001')
  console.log('    GET  /api/complaints?tenant_id=1&submitter_id=1001')
  console.log('    GET  /api/feedbackWorkOrders?tenant_id=1&submitter_id=1001')
  console.log('    GET  /api/fileResources?tenant_id=1')
  console.log('    GET  /api/courses?tenant_id=1')
  console.log('    GET  /api/serviceItems?tenant_id=1')
  console.log('    GET  /api/courseEnrollments?tenant_id=1&student_id=1001')
  console.log('    GET  /api/teachingOrgUnits?tenant_id=1')
  console.log('    GET  /api/serviceOrgUnits?tenant_id=1')
  console.log('')
  console.log('  测试账号:')
  console.log('    系统管理员: admin / admin123')
  console.log('    学校管理员: school_admin / 123456')
  console.log('    教职工:     teacher_li / 123456')
  console.log('    学生(清华):  student_zhang / 123456')
  console.log('    学生(北大):  pku_student / 123456')
  console.log('='.repeat(60))
  console.log('')
})
