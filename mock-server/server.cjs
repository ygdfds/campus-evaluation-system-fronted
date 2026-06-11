/**
 * Mock Server - 基于 json-server 的接口模拟服务器
 * 
 * 启动命令: npm run mock
 * 接口地址: http://localhost:3001/api
 * 
 * 自定义路由:
 * - POST /api/auth/login       登录
 * - POST /api/auth/register    注册
 * - GET  /api/auth/schools     获取已激活学校列表
 * - POST /api/auth/verify-identity  身份验证（学号/工号 + 姓名）
 * - POST /api/auth/forgot-password  忘记密码
 * - POST /api/schools/onboarding    学校入驻申请
 */

const jsonServer = require('json-server')
const path = require('path')

const server = jsonServer.create()
const router = jsonServer.router(path.join(__dirname, 'db.json'))
const middlewares = jsonServer.defaults()
const db = router.db

// 默认中间件（cors, logger, static 等）
server.use(middlewares)
server.use(require('express').json())
server.use(require('express').urlencoded({ extended: true }))

// 请求日志中间件
server.use((req, res, next) => {
  const timestamp = new Date().toLocaleString('zh-CN')
  console.log(`[${timestamp}] ${req.method} ${req.url}`)
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    console.log(`  Body:`, JSON.stringify(req.body, null, 2))
  }
  next()
})

// ==================== 自定义路由 ====================

// 获取入驻套餐列表
server.get('/api/tenant-plans', (req, res) => {
  const plans = db.get('tenantPlans').value()
  const activePlans = plans.filter(p => p.status === 'active')
  console.log(`  Response: 返回 ${activePlans.length} 个可用套餐`)
  res.json({
    code: 200,
    message: 'success',
    data: activePlans
  })
})

// 获取已激活的学校列表
server.get('/api/auth/schools', (req, res) => {
  const schools = db.get('schools').value()
  const activeSchools = schools.filter(s => s.status === 'active')
  
  console.log(`  Response: 返回 ${activeSchools.length} 所已激活学校`)
  res.json({
    code: 200,
    message: 'success',
    data: activeSchools
  })
})

// 登录接口
server.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  
  if (!username || !password) {
    console.log(`  Response: 缺少用户名或密码`)
    return res.status(400).json({
      code: 400,
      message: '用户名和密码不能为空'
    })
  }
  
  const users = db.get('users').value()
  const user = users.find(u => u.username === username && u.password === password)
  
  if (!user) {
    console.log(`  Response: 用户名或密码错误`)
    return res.status(401).json({
      code: 401,
      message: '用户名或密码错误'
    })
  }
  
  // 生成 token
  const token = 'mock_token_' + user.id + '_' + Date.now()
  
  // 获取学校信息
  const schools = db.get('schools').value()
  const school = user.schoolId ? schools.find(s => s.id === user.schoolId) : null
  
  // 返回用户信息（不含密码）
  const userInfo = { ...user }
  delete userInfo.password
  
  // 存储 token（可选，用于后续验证）
  const tokens = db.get('tokens').value()
  tokens.push({
    id: tokens.length + 1,
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  })
  db.set('tokens', tokens).write()
  
  console.log(`  Response: 登录成功, token=${token.substring(0, 20)}...`)
  res.json({
    code: 200,
    message: '登录成功',
    data: {
      token,
      userInfo,
      tenantId: user.tenantId,
      schoolId: user.schoolId,
      schoolName: school ? school.schoolName : null
    }
  })
})

// 身份验证接口（学号/工号 + 姓名）
server.post('/api/auth/verify-identity', (req, res) => {
  const { schoolId, studentNo, realName } = req.body
  
  if (!schoolId || !studentNo || !realName) {
    console.log(`  Response: 缺少必要参数`)
    return res.status(400).json({
      code: 400,
      message: '缺少必要参数'
    })
  }
  
  const users = db.get('users').value()
  const user = users.find(u => 
    u.schoolId === schoolId &&
    (u.studentNo === studentNo || u.workNo === studentNo) &&
    u.realName === realName &&
    (u.role === 'student' || u.role === 'staff')
  )
  
  if (!user) {
    console.log(`  Response: 未找到匹配的身份信息`)
    return res.status(400).json({
      code: 400,
      message: '未找到匹配的身份信息，请检查学号/工号和姓名'
    })
  }
  
  console.log(`  Response: 身份验证通过, 角色=${user.role}`)
  res.json({
    code: 200,
    message: '验证通过',
    data: {
      userId: user.id,
      studentNo: user.studentNo || user.workNo,
      realName: user.realName,
      role: user.role,
      department: user.department
    }
  })
})

// 注册接口
server.post('/api/auth/register', (req, res) => {
  const { 
    schoolId, 
    username, 
    password, 
    realName, 
    phone, 
    email,
    studentNo,
    workNo,
    role,
    department
  } = req.body
  
  if (!username || !password || !realName) {
    console.log(`  Response: 缺少必要参数`)
    return res.status(400).json({
      code: 400,
      message: '用户名、密码和真实姓名不能为空'
    })
  }
  
  const users = db.get('users').value()
  
  // 检查用户名是否已存在
  const exists = users.find(u => u.username === username)
  if (exists) {
    console.log(`  Response: 用户名已存在`)
    return res.status(400).json({
      code: 400,
      message: '用户名已存在'
    })
  }
  
  // 获取学校信息
  const schools = db.get('schools').value()
  const school = schools.find(s => s.id === schoolId)
  
  // 创建新用户
  const newUser = {
    id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
    tenantId: school ? school.tenantId : null,
    schoolId: schoolId || null,
    username,
    password,
    realName,
    role: role || 'student',
    roleName: role === 'student' ? '学生' : '教职工',
    email: email || null,
    phone: phone || null,
    studentNo: studentNo || null,
    workNo: workNo || null,
    department: department || '',
    status: 1
  }
  
  // 添加到数据库
  users.push(newUser)
  db.set('users', users).write()
  
  // 返回用户信息（不含密码）
  const userInfo = { ...newUser }
  delete userInfo.password
  
  console.log(`  Response: 注册成功, userId=${newUser.id}`)
  res.json({
    code: 200,
    message: '注册成功',
    data: {
      userInfo,
      tenantId: newUser.tenantId,
      schoolId: newUser.schoolId,
      schoolName: school ? school.schoolName : null
    }
  })
})

// 忘记密码接口
server.post('/api/auth/forgot-password', (req, res) => {
  const { username, newPassword } = req.body

  if (!username || !newPassword) {
    console.log(`  Response: 缺少必要参数`)
    return res.status(400).json({
      code: 400,
      message: '用户名和新密码不能为空'
    })
  }

  const users = db.get('users').value()
  const user = users.find(u => u.username === username)

  if (!user) {
    console.log(`  Response: 用户不存在`)
    return res.status(400).json({
      code: 400,
      message: '该账号不存在'
    })
  }

  // 更新密码
  user.password = newPassword
  db.set('users', users).write()

  console.log(`  Response: 密码重置成功`)
  res.json({
    code: 200,
    message: '密码重置成功'
  })
})

// 学校入驻申请接口
server.post('/api/schools/onboarding', (req, res) => {
  const {
    schoolName,
    creditCode,
    contactName,
    contactPhone,
    contactEmail,
    address,
    planId
  } = req.body

  if (!schoolName || !creditCode || !contactName || !contactPhone || !contactEmail) {
    console.log(`  Response: 缺少必要参数`)
    return res.status(400).json({
      code: 400,
      message: '请填写完整的学校信息'
    })
  }

  const applications = db.get('onboardingApplications').value()
  const plans = db.get('tenantPlans').value()
  const plan = plans.find(p => p.id === planId)

  const newApp = {
    id: applications.length > 0 ? Math.max(...applications.map(a => a.id)) + 1 : 1,
    schoolName,
    creditCode,
    contactName,
    contactPhone,
    contactEmail,
    address: address || '',
    planId: planId || null,
    planName: plan ? plan.planName : '基础版',
    status: 'pending',
    rejectReason: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  applications.push(newApp)
  db.set('onboardingApplications', applications).write()

  console.log(`  Response: 入驻申请已提交, applicationId=${newApp.id}`)
  res.json({
    code: 200,
    message: '入驻申请已提交，请等待审核',
    data: newApp
  })
})

// ==================== 使用 json-server 默认路由 ====================
// 将 /api 前缀传给 json-server
server.use('/api', router)

// 启动服务器
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log('')
  console.log('='.repeat(60))
  console.log('  Mock Server 已启动')
  console.log(`  接口地址: http://localhost:${PORT}/api`)
  console.log('')
  console.log('  可用接口:')
  console.log('    POST /api/auth/login          登录')
  console.log('    POST /api/auth/register       注册')
  console.log('    GET  /api/auth/schools        获取学校列表')
  console.log('    POST /api/auth/verify-identity 身份验证')
  console.log('    POST /api/auth/forgot-password 忘记密码')
  console.log('    POST /api/schools/onboarding  学校入驻申请')
  console.log('    GET  /api/tenant-plans        套餐列表')
  console.log('    GET  /api/departments         部门列表')
  console.log('    GET  /api/evaluations         评价列表')
  console.log('    GET  /api/evaluation-forms    表单列表')
  console.log('')
  console.log('  测试账号:')
  console.log('    系统管理员: admin / admin123')
  console.log('    学校管理员: school_admin / 123456')
  console.log('    教职工:     teacher / 123456')
  console.log('    学生:       student / 123456')
  console.log('='.repeat(60))
  console.log('')
})
