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
  const tenants = db.get('tenants').value().filter(t => t.status === 'active' && !t.deleted)
  res.json({ code: 200, message: 'success', data: tenants })
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

// 套餐列表（兼容旧接口）
server.get('/api/tenant-plans', (req, res) => {
  const plans = [
    {
      id: 1,
      planName: '基础版',
      features: '满足基本评价需求，支持 30 个表单、500 名用户、100GB 存储空间',
      status: 'active',
      price: 0,
    },
    {
      id: 2,
      planName: '专业版',
      features: '适合中大规模学校，支持 80 个表单、2000 名用户、500GB 存储空间',
      status: 'active',
      price: 2000,
    },
    {
      id: 3,
      planName: '旗舰版',
      features: '全功能无限制，不限表单和用户数量，1TB 存储空间',
      status: 'active',
      price: 5000,
    },
  ]
  res.json({ code: 200, message: 'success', data: plans })
})

// 学校入驻申请（兼容旧接口）
server.post('/api/schools/onboarding', (req, res) => {
  res.json({ code: 200, message: '入驻申请已提交' })
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
