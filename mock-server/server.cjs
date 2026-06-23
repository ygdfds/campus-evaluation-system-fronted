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

// 获取系统角色列表（从用户表去重后的真实角色生成）
server.get('/api/system-roles', (req, res) => {
  const users = db.get('users').value()
  const roleMap = new Map()
  
  users.forEach(u => {
    if (!roleMap.has(u.role)) {
      roleMap.set(u.role, {
        roleName: u.roleName || '',
        description: '',
        dataScope: '',
        userIdCount: 0
      })
    }
    roleMap.get(u.role).userIdCount++
  })
  
  // 设置每个角色的描述和范围
  const rolesData = []
  roleMap.forEach((val, key) => {
    switch(key) {
      case 'system_admin':
        val.description = '系统超级管理员，拥有全部权限'
        val.dataScope = '全部数据'
        break
      case 'school_admin':
        val.description = '学校管理员，管理本校业务'
        val.dataScope = '指定租户'
        break
      case 'staff':
        val.description = '教职工，进行日常评价与反馈'
        val.dataScope = '本部门'
        break
      case 'student':
        val.description = '学生，提交服务评价与投诉建议'
        val.dataScope = '仅自己'
        break
    }
    rolesData.push({
      id: rolesData.length + 1,
      roleName: val.roleName,
      description: val.description,
      dataScope: val.dataScope,
      createdAt: new Date().toLocaleString('zh-CN')
    })
  })
  
  console.log(`  Response: 返回 ${rolesData.length} 个角色`)
  res.json({
    code: 200,
    message: 'success',
    data: { list: rolesData }
  })
})

// 获取入驻申请列表（连字符版本 -> 驼峰数据库资源）
server.get('/api/onboarding-applications', (req, res) => {
  const data = db.get('onboardingApplications').value()
  
  // 支持筛选
  let result = data
  if (req.query.schoolName) {
    result = result.filter(item => item.schoolName && item.schoolName.includes(req.query.schoolName))
  }
  if (req.query.status) {
    result = result.filter(item => item.status === req.query.status)
  }
  
  console.log(`  Response: 返回 ${result.length} 条入驻申请`)
  res.json({
    code: 200,
    message: 'success',
    data: { list: result }
  })
})

// 审核入驻申请
server.post('/api/onboarding-applications/:id/audit', (req, res) => {
  const id = parseInt(req.params.id)
  const { action, reason } = req.body
  
  const applications = db.get('onboardingApplications').value()
  const appIndex = applications.findIndex(a => a.id === id)
  
  if (appIndex === -1) {
    return res.status(404).json({ code: 404, message: '申请不存在' })
  }
  
  if (action === 'approved') {
    applications[appIndex].status = 'approved'
    console.log(`  Response: 申请#${id} 审核通过`)
  } else if (action === 'rejected') {
    applications[appIndex].status = 'rejected'
    applications[appIndex].rejectReason = reason
    console.log(`  Response: 申请#${id} 审核驳回, 原因: ${reason}`)
  }
  
  db.set('onboardingApplications', applications).write()
  
  res.json({
    code: 200,
    message: '审核成功',
    data: applications[appIndex]
  })
})

// 获取租户列表（连字符版本 -> 驼峰数据库资源）
server.get('/api/tenants', (req, res) => {
  const schools = db.get('schools').value()
  const plans = db.get('tenantPlans').value()
  
  // tenantId 到 planId 的映射关系
  const tenantPlanMap = { 'T001': 1, 'T002': 2, 'T003': 3 }
  
  // 只显示已入驻的学校（排除待入驻的）
  const activeSchools = schools.filter(s => s.status === 'active')
  
  const tenantList = activeSchools.map(school => {
    const planId = tenantPlanMap[school.tenantId]
    const plan = planId ? plans.find(p => p.id === planId) : null
    return {
      tenantId: school.tenantId,
      schoolName: school.schoolName,
      planName: plan ? plan.planName : '未分配',
      status: school.status === 'active' ? '已入驻' : '待入驻',
      createdAt: new Date().toLocaleString('zh-CN')
    }
  })
  
  console.log(`  Response: 返回 ${tenantList.length} 个租户`)
  res.json({
    code: 200,
    message: 'success',
    data: { list: tenantList }
  })
})

// 获取平台管理员列表（系统管理端用户管理）
server.get('/api/system-admins', (req, res) => {
  const users = db.get('users').value()
  const admins = users.filter(u => u.role === 'system_admin')
  
  const adminList = admins.map(a => {
    const info = { ...a }
    delete info.password
    return {
      ...info,
      status: a.status === 1 ? 'active' : 'inactive',
      roleName: a.roleName || '系统管理员'
    }
  })
  
  console.log(`  Response: 返回 ${adminList.length} 个平台管理员`)
  res.json({
    code: 200,
    message: 'success',
    data: { list: adminList }
  })
})

// 获取入驻套餐列表（返回所有套餐）
server.get('/api/tenant-plans', (req, res) => {
  const plans = db.get('tenantPlans').value()
  
  // 映射到前端表格字段
  const planList = plans.map(p => ({
    id: p.id,
    planName: p.planName,
    description: p.features,
    price: p.price > 0 ? `${p.price}元/年` : '免费',
    duration: p.maxUsers === -1 ? '不限人数' : `${p.maxUsers}人以下`,
    status: p.status === 'active' ? 'active' : 'inactive',
    createdAt: new Date().toLocaleString('zh-CN')
  }))
  
  console.log(`  Response: 返回 ${planList.length} 个套餐`)
  res.json({
    code: 200,
    message: 'success',
    data: { list: planList }
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

// ===== 套餐编辑 =====
server.put('/api/tenant-plans/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const { planName, features, maxUsers, price } = req.body
  const plans = db.get('tenantPlans').value()
  const idx = plans.findIndex(p => p.id === id)
  if (idx === -1) return res.status(404).json({ code: 404, message: '套餐不存在' })
  plans[idx].planName = planName || plans[idx].planName
  plans[idx].features = features || plans[idx].features
  plans[idx].maxUsers = maxUsers !== undefined ? maxUsers : plans[idx].maxUsers
  plans[idx].price = price !== undefined ? price : plans[idx].price
  db.set('tenantPlans', plans).write()
  console.log(`  Response: 套餐#${id} 编辑成功`)
  res.json({ code: 200, message: '编辑成功' })
})

server.delete('/api/tenant-plans/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const plans = db.get('tenantPlans').value()
  const idx = plans.findIndex(p => p.id === id)
  if (idx === -1) return res.status(404).json({ code: 404, message: '套餐不存在' })
  plans.splice(idx, 1)
  db.set('tenantPlans', plans).write()
  console.log(`  Response: 套餐#${id} 已下架`)
  res.json({ code: 200, message: '下架成功' })
})

server.post('/api/system-admins', (req, res) => {
  const { username, password, realName, email, phone, role } = req.body
  const users = db.get('users').value()
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ code: 400, message: '用户名已存在' })
  }
  const newUser = {
    id: Math.max(...users.map(u => u.id)) + 1,
    username, password, realName,
    role: role || 'system_admin', roleName: '系统管理员',
    email: email || null, phone: phone || null, department: null, status: 1
  }
  users.push(newUser)
  db.set('users', users).write()
  console.log(`  Response: 新管理员#${newUser.id} 创建成功`)
  res.json({ code: 200, message: '创建成功', data: newUser })
})

server.put('/api/system-admins/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const { realName, email, phone } = req.body
  const users = db.get('users').value()
  const idx = users.findIndex(u => u.id === id && u.role === 'system_admin')
  if (idx === -1) return res.status(404).json({ code: 404, message: '管理员不存在' })
  if (realName) users[idx].realName = realName
  if (email) users[idx].email = email
  if (phone) users[idx].phone = phone
  db.set('users', users).write()
  console.log(`  Response: 管理员#${id} 编辑成功`)
  res.json({ code: 200, message: '编辑成功' })
})

server.patch('/api/system-admins/:id/status', (req, res) => {
  const id = parseInt(req.params.id)
  const users = db.get('users').value()
  const idx = users.findIndex(u => u.id === id && u.role === 'system_admin')
  if (idx === -1) return res.status(404).json({ code: 404, message: '管理员不存在' })
  users[idx].status = users[idx].status === 1 ? 0 : 1
  const newStatus = users[idx].status === 1 ? '启用' : '禁用'
  db.set('users', users).write()
  console.log(`  Response: 管理员#${id} 已${newStatus}`)
  res.json({ code: 200, message: `已${newStatus}` })
})

server.post('/api/system-admins/:id/reset-password', (req, res) => {
  const id = parseInt(req.params.id)
  const users = db.get('users').value()
  const idx = users.findIndex(u => u.id === id && u.role === 'system_admin')
  if (idx === -1) return res.status(404).json({ code: 404, message: '管理员不存在' })
  users[idx].password = 'admin123'
  db.set('users', users).write()
  console.log(`  Response: 管理员#${id} 密码已重置为 admin123`)
  res.json({ code: 200, message: '密码已重置为 admin123' })
})

server.delete('/api/system-admins/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const users = db.get('users').value()
  const idx = users.findIndex(u => u.id === id && u.role === 'system_admin')
  if (idx === -1) return res.status(404).json({ code: 404, message: '管理员不存在' })
  users.splice(idx, 1)
  db.set('users', users).write()
  console.log(`  Response: 管理员#${id} 已删除`)
  res.json({ code: 200, message: '删除成功' })
})

// ===== 菜单权限数据 =====

// ===== 仪表盘统计数据 =====
server.get('/api/admin/stats', (req, res) => {
  const schools = db.get('schools').value() || []
  const users = db.get('users').value() || []
  const plans = db.get('tenantPlans').value() || []
  const apps = db.get('onboardingApplications').value() || []
  
  const activeSchools = schools.filter(s => s.status === 'active').length
  const pendingApps = apps.filter(a => a.status === 'pending').length
  const totalUsers = users.length
  
  console.log(`  Response: 活跃学校=${activeSchools}, 待审申请=${pendingApps}, 套餐数=${plans.length}, 总用户=${totalUsers}`)
  res.json({
    code: 200,
    message: 'success',
    data: { activeSchools, pendingApps, planCount: plans.length, totalUsers }
  })
})

// ===== 自定义角色列表 =====
server.get('/api/custom-roles', (req, res) => {
  const customRoles = db.get('customRoles').value() || []
  res.json({ code: 200, message: 'success', data: { list: customRoles } })
})

server.post('/api/system-roles', (req, res) => {
  const { roleName, description, dataScope } = req.body
  const customRoles = db.get('customRoles').value() || []
  const maxId = customRoles.length > 0 ? Math.max(...customRoles.map(r => r.id)) : 100
  const newRole = {
    id: maxId + 1, roleName, description,
    dataScope: dataScope || '仅自己', createdAt: new Date().toLocaleString('zh-CN')
  }
  customRoles.push(newRole)
  db.set('customRoles', customRoles).write()
  console.log(`  Response: 新角色#${newRole.id} 创建成功`)
  res.json({ code: 200, message: '创建成功', data: newRole })
})

server.put('/api/system-roles/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const { roleName, description, dataScope } = req.body
  const customRoles = db.get('customRoles').value() || []
  const idx = customRoles.findIndex(r => r.id === id)
  if (idx !== -1) {
    if (roleName) customRoles[idx].roleName = roleName
    if (description) customRoles[idx].description = description
    if (dataScope) customRoles[idx].dataScope = dataScope
    db.set('customRoles', customRoles).write()
    return res.json({ code: 200, message: '编辑成功' })
  }
  res.json({ code: 200, message: '内置角色不可编辑' })
})

server.delete('/api/system-roles/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const customRoles = db.get('customRoles').value() || []
  const idx = customRoles.findIndex(r => r.id === id)
  if (idx === -1) return res.status(404).json({ code: 404, message: '角色不存在' })
  customRoles.splice(idx, 1)
  db.set('customRoles', customRoles).write()
  res.json({ code: 200, message: '删除成功' })
})
server.get('/api/menu-permissions', (req, res) => {
  const permissions = [
    { id: 1, label: '平台概览', path: '/admin/dashboard', children: [{ id: 11, label: '查看' }, { id: 12, label: '刷新' }] },
    { id: 2, label: '租户管理', path: '/admin/tenants', children: [{ id: 21, label: '查看列表' }, { id: 22, label: '查看套餐' }, { id: 23, label: '编辑租户信息' }, { id: 24, label: '管理套餐分配' }] },
    { id: 3, label: '入驻审核', path: '/admin/onboarding/audit', children: [{ id: 31, label: '查看申请' }, { id: 32, label: '审核通过' }, { id: 33, label: '审核驳回' }, { id: 34, label: '查看材料' }] },
    { id: 4, label: '用户管理', path: '/admin/users', children: [{ id: 41, label: '查看账号列表' }, { id: 42, label: '新增账号' }, { id: 43, label: '编辑账号' }, { id: 44, label: '启用/禁用账号' }, { id: 45, label: '重置密码' }, { id: 46, label: '删除账号' }] },
    { id: 5, label: '角色管理', path: '/admin/users/roles', children: [{ id: 51, label: '查看角色列表' }, { id: 52, label: '新增角色' }, { id: 53, label: '编辑角色' }, { id: 54, label: '配置权限' }, { id: 55, label: '删除角色' }] },
    { id: 6, label: '系统设置', path: '/admin/system', children: [{ id: 61, label: '查看配置' }, { id: 62, label: '编辑配置' }, { id: 63, label: '重置配置' }] },
    { id: 7, label: '套餐管理', path: '/admin/plans', children: [{ id: 71, label: '查看套餐列表' }, { id: 72, label: '编辑套餐' }, { id: 73, label: '下架套餐' }, { id: 74, label: '创建套餐' }, { id: 75, label: '配置权限' }] },
    { id: 8, label: '监控中心', path: '/admin/monitoring', children: [{ id: 81, label: '查看监控看板' }, { id: 82, label: '查看告警' }, { id: 83, label: '处理告警' }] },
    { id: 9, label: '报表中心', path: '/admin/reports', children: [{ id: 91, label: '查看所有报表' }, { id: 92, label: '导出报表' }, { id: 93, label: '生成报表' }] },
    { id: 10, label: '凭证管理', path: '/admin/documents', children: [{ id: 101, label: '查看凭证' }, { id: 102, label: '上传凭证' }, { id: 103, label: '下载凭证' }] },
    { id: 11, label: '客服支持', path: '/admin/support', children: [{ id: 111, label: '查看工单' }, { id: 112, label: '处理工单' }, { id: 113, label: '回复反馈' }] }
  ]
  res.json({ code: 200, message: 'success', data: { list: permissions } })
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
