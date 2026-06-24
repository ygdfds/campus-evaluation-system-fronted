import request from '@/request'

// ==================== 映射表 ====================

export const staffRoleTypeMap = {
  staff: '教职工',
  teaching_admin: '教学管理员',
  service_admin: '后勤管理员',
  school_admin: '学校管理员',
  feedback_handler: '反馈处理员',
  form_publisher: '表单发布员',
  course_owner: '课程负责人',
}

export const genderMap = {
  male: '男',
  female: '女',
}

export const accountStatusMap = {
  active: '启用',
  disabled: '停用',
}

// ==================== 教职工 API ====================

/**
 * 获取教职工列表（合并 personProfiles + userAccounts）
 */
export async function getSchoolStaffListApi(tenantId, filters = {}) {
  const [profilesRes, accountsRes] = await Promise.all([
    request.get('/personProfiles', { params: { deleted: false } }),
    request.get('/userAccounts', { params: { deleted: false } }),
  ])

  const profiles = (profilesRes.data || []).filter(p => !p.deleted)
  const accounts = (accountsRes.data || []).filter(a => !a.deleted)
  const accountMap = {}
  accounts.forEach(a => { accountMap[a.user_id] = a })

  // 过滤教职工（排除 student 和 school_admin）
  let staffList = profiles
    .filter(p => p.tenant_id === Number(tenantId))
    .filter(p => ['staff', 'teaching_admin', 'service_admin'].includes(p.role_type))
    .map(p => ({
      ...p,
      account: accountMap[p.user_id] || null,
      role_label: staffRoleTypeMap[p.role_type] || p.role_type,
      gender_label: genderMap[p.gender] || '-',
      account_status: accountMap[p.user_id]?.account_status || 'active',
      account_status_label: accountStatusMap[accountMap[p.user_id]?.account_status] || '启用',
      phone: accountMap[p.user_id]?.phone || p.office_phone || '-',
      email: accountMap[p.user_id]?.email || '-',
      last_login_at: accountMap[p.user_id]?.last_login_at || '-',
    }))

  // 搜索过滤
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    staffList = staffList.filter(s =>
      (s.real_name && s.real_name.toLowerCase().includes(kw)) ||
      (s.no_work && s.no_work.toLowerCase().includes(kw))
    )
  }

  // 角色筛选
  if (filters.role_type && filters.role_type.length > 0) {
    staffList = staffList.filter(s => filters.role_type.includes(s.role_type))
  }

  // 状态筛选
  if (filters.account_status) {
    staffList = staffList.filter(s => s.account_status === filters.account_status)
  }

  return staffList
}

/**
 * 获取教职工详情
 */
export async function getSchoolStaffDetailApi(tenantId, profileId) {
  const [profilesRes, accountsRes] = await Promise.all([
    request.get('/personProfiles', { params: { deleted: false } }),
    request.get('/userAccounts', { params: { deleted: false } }),
  ])

  const profiles = (profilesRes.data || []).filter(p => !p.deleted)
  const accounts = (accountsRes.data || []).filter(a => !a.deleted)

  const profile = profiles.find(p => p.id === Number(profileId) && p.tenant_id === Number(tenantId))
  if (!profile) return null

  const account = accounts.find(a => a.user_id === profile.user_id)

  return {
    ...profile,
    account: account || null,
    role_label: staffRoleTypeMap[profile.role_type] || profile.role_type,
    gender_label: genderMap[profile.gender] || '-',
    account_status: account?.account_status || 'active',
    account_status_label: accountStatusMap[account?.account_status] || '启用',
    phone: account?.phone || profile.office_phone || '-',
    email: account?.email || '-',
    last_login_at: account?.last_login_at || '-',
  }
}

/**
 * 新增教职工（创建 userAccount + personProfile）
 */
export async function createSchoolStaffApi(tenantId, payload) {
  const now = new Date().toISOString()
  const userId = payload.user_id || Date.now()

  // 创建 userAccount
  const accountBody = {
    id: userId,
    tenant_id: Number(tenantId),
    username: payload.username,
    phone: payload.phone || null,
    email: payload.email || null,
    status: 'active',
    account_status: 'active',
    password_hash: `$mock$hashed_${payload.username}`,
    must_change_password: payload.must_change_password || false,
    created_at: now,
    updated_at: now,
    deleted: false,
  }
  await request.post('/userAccounts', accountBody)

  // 创建 personProfile
  const profileBody = {
    tenant_id: Number(tenantId),
    user_id: userId,
    real_name: payload.real_name,
    role_type: payload.role_type || 'staff',
    no_work: payload.no_work || null,
    no_student: null,
    gender: payload.gender || null,
    office_phone: payload.office_phone || null,
    intro: payload.intro || null,
    org_unit_id: payload.org_unit_id || null,
    avatar_file_id: null,
    created_at: now,
    updated_at: now,
    deleted: false,
  }
  const profileRes = await request.post('/personProfiles', profileBody)

  // 写入操作日志
  try {
    await request.post('/operationLogs', {
      tenant_id: Number(tenantId),
      user_id: payload.operator_id || null,
      module: 'user',
      action: 'create',
      target_type: 'staff',
      target_id: profileRes.id,
      content: `新增教职工：${payload.real_name}（${payload.username}）`,
      created_at: now,
    })
  } catch { /* ignore */ }

  return { ...profileBody, id: profileRes.id, account: accountBody }
}

/**
 * 编辑教职工
 */
export async function updateSchoolStaffApi(tenantId, profileId, payload) {
  const now = new Date().toISOString()

  // 更新 personProfile
  const profileBody = {
    real_name: payload.real_name,
    role_type: payload.role_type,
    no_work: payload.no_work || null,
    gender: payload.gender || null,
    office_phone: payload.office_phone || null,
    intro: payload.intro || null,
    org_unit_id: payload.org_unit_id || null,
    updated_at: now,
  }
  await request.patch(`/personProfiles/${profileId}`, profileBody)

  // 更新 userAccount（如果提供了账号信息）
  if (payload.phone || payload.email) {
    const profilesRes = await request.get('/personProfiles', { params: { deleted: false } })
    const profiles = (profilesRes.data || []).filter(p => !p.deleted)
    const profile = profiles.find(p => p.id === Number(profileId))
    if (profile) {
      const accountsRes = await request.get('/userAccounts', { params: { deleted: false } })
      const accounts = (accountsRes.data || []).filter(a => !a.deleted)
      const account = accounts.find(a => a.user_id === profile.user_id)
      if (account) {
        await request.patch(`/userAccounts/${account.id}`, {
          phone: payload.phone || account.phone,
          email: payload.email || account.email,
          updated_at: now,
        })
      }
    }
  }

  // 写入操作日志
  try {
    await request.post('/operationLogs', {
      tenant_id: Number(tenantId),
      user_id: payload.operator_id || null,
      module: 'user',
      action: 'update',
      target_type: 'staff',
      target_id: Number(profileId),
      content: `编辑教职工信息：${payload.real_name}`,
      created_at: now,
    })
  } catch { /* ignore */ }

  return profileBody
}

/**
 * 切换教职工账号状态（启用/停用）
 */
export async function toggleSchoolStaffStatusApi(tenantId, profileId, newStatus) {
  const now = new Date().toISOString()

  const profilesRes = await request.get('/personProfiles', { params: { deleted: false } })
  const profiles = (profilesRes.data || []).filter(p => !p.deleted)
  const profile = profiles.find(p => p.id === Number(profileId) && p.tenant_id === Number(tenantId))
  if (!profile) throw new Error('教职工不存在')

  const accountsRes = await request.get('/userAccounts', { params: { deleted: false } })
  const accounts = (accountsRes.data || []).filter(a => !a.deleted)
  const account = accounts.find(a => a.user_id === profile.user_id)
  if (!account) throw new Error('关联账号不存在')

  await request.patch(`/userAccounts/${account.id}`, {
    account_status: newStatus,
    updated_at: now,
  })

  // 写入操作日志
  try {
    await request.post('/operationLogs', {
      tenant_id: Number(tenantId),
      user_id: null,
      module: 'user',
      action: newStatus === 'active' ? 'enable' : 'disable',
      target_type: 'staff',
      target_id: Number(profileId),
      content: `${newStatus === 'active' ? '启用' : '停用'}教职工账号：${profile.real_name}`,
      created_at: now,
    })
  } catch { /* ignore */ }

  return { account_status: newStatus }
}

/**
 * 软删除教职工
 */
export async function deleteSchoolStaffApi(tenantId, profileId) {
  const now = new Date().toISOString()

  const profilesRes = await request.get('/personProfiles', { params: { deleted: false } })
  const profiles = (profilesRes.data || []).filter(p => !p.deleted)
  const profile = profiles.find(p => p.id === Number(profileId) && p.tenant_id === Number(tenantId))
  if (!profile) throw new Error('教职工不存在')

  await request.patch(`/personProfiles/${profileId}`, {
    deleted: true,
    updated_at: now,
  })

  // 同时停用关联账号
  const accountsRes = await request.get('/userAccounts', { params: { deleted: false } })
  const accounts = (accountsRes.data || []).filter(a => !a.deleted)
  const account = accounts.find(a => a.user_id === profile.user_id)
  if (account) {
    await request.patch(`/userAccounts/${account.id}`, {
      deleted: true,
      account_status: 'disabled',
      updated_at: now,
    })
  }

  // 写入操作日志
  try {
    await request.post('/operationLogs', {
      tenant_id: Number(tenantId),
      user_id: null,
      module: 'user',
      action: 'delete',
      target_type: 'staff',
      target_id: Number(profileId),
      content: `删除教职工：${profile.real_name}`,
      created_at: now,
    })
  } catch { /* ignore */ }

  return { success: true }
}

// ==================== 学生 API ====================

/**
 * 获取学生列表
 */
export async function getSchoolStudentListApi(tenantId, filters = {}) {
  const [profilesRes, accountsRes] = await Promise.all([
    request.get('/personProfiles', { params: { deleted: false } }),
    request.get('/userAccounts', { params: { deleted: false } }),
  ])

  const profiles = (profilesRes.data || []).filter(p => !p.deleted)
  const accounts = (accountsRes.data || []).filter(a => !a.deleted)
  const accountMap = {}
  accounts.forEach(a => { accountMap[a.user_id] = a })

  let studentList = profiles
    .filter(p => p.tenant_id === Number(tenantId))
    .filter(p => p.role_type === 'student')
    .map(p => ({
      ...p,
      account: accountMap[p.user_id] || null,
      gender_label: genderMap[p.gender] || '-',
      account_status: accountMap[p.user_id]?.account_status || 'active',
      account_status_label: accountStatusMap[accountMap[p.user_id]?.account_status] || '启用',
      phone: accountMap[p.user_id]?.phone || '-',
      email: accountMap[p.user_id]?.email || '-',
    }))

  // 搜索过滤
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    studentList = studentList.filter(s =>
      (s.real_name && s.real_name.toLowerCase().includes(kw)) ||
      (s.no_student && s.no_student.toLowerCase().includes(kw))
    )
  }

  // 院系筛选
  if (filters.department_name && filters.department_name.length > 0) {
    studentList = studentList.filter(s => filters.department_name.includes(s.department_name))
  }

  // 班级筛选
  if (filters.class_name && filters.class_name.length > 0) {
    studentList = studentList.filter(s => filters.class_name.includes(s.class_name))
  }

  // 状态筛选
  if (filters.account_status) {
    studentList = studentList.filter(s => s.account_status === filters.account_status)
  }

  return studentList
}

/**
 * 获取学生详情
 */
export async function getSchoolStudentDetailApi(tenantId, profileId) {
  const [profilesRes, accountsRes] = await Promise.all([
    request.get('/personProfiles', { params: { deleted: false } }),
    request.get('/userAccounts', { params: { deleted: false } }),
  ])

  const profiles = (profilesRes.data || []).filter(p => !p.deleted)
  const accounts = (accountsRes.data || []).filter(a => !a.deleted)

  const profile = profiles.find(p => p.id === Number(profileId) && p.tenant_id === Number(tenantId))
  if (!profile) return null

  const account = accounts.find(a => a.user_id === profile.user_id)

  return {
    ...profile,
    account: account || null,
    gender_label: genderMap[profile.gender] || '-',
    account_status: account?.account_status || 'active',
    account_status_label: accountStatusMap[account?.account_status] || '启用',
    phone: account?.phone || '-',
    email: account?.email || '-',
  }
}

/**
 * 新增学生
 */
export async function createSchoolStudentApi(tenantId, payload) {
  const now = new Date().toISOString()
  const userId = payload.user_id || Date.now()

  const accountBody = {
    id: userId,
    tenant_id: Number(tenantId),
    username: payload.username,
    phone: payload.phone || null,
    email: payload.email || null,
    status: 'active',
    account_status: 'active',
    password_hash: `$mock$hashed_${payload.username}`,
    must_change_password: payload.must_change_password || false,
    created_at: now,
    updated_at: now,
    deleted: false,
  }
  await request.post('/userAccounts', accountBody)

  const profileBody = {
    tenant_id: Number(tenantId),
    user_id: userId,
    real_name: payload.real_name,
    role_type: 'student',
    no_work: null,
    no_student: payload.no_student || null,
    gender: payload.gender || null,
    office_phone: null,
    intro: null,
    avatar_file_id: null,
    department_name: payload.department_name || null,
    class_name: payload.class_name || null,
    created_at: now,
    updated_at: now,
    deleted: false,
  }
  const profileRes = await request.post('/personProfiles', profileBody)

  // 写入操作日志
  try {
    await request.post('/operationLogs', {
      tenant_id: Number(tenantId),
      user_id: payload.operator_id || null,
      module: 'user',
      action: 'create',
      target_type: 'student',
      target_id: profileRes.id,
      content: `新增学生：${payload.real_name}（${payload.username}）`,
      created_at: now,
    })
  } catch { /* ignore */ }

  return { ...profileBody, id: profileRes.id, account: accountBody }
}

/**
 * 编辑学生
 */
export async function updateSchoolStudentApi(tenantId, profileId, payload) {
  const now = new Date().toISOString()

  const profileBody = {
    real_name: payload.real_name,
    no_student: payload.no_student || null,
    gender: payload.gender || null,
    department_name: payload.department_name || null,
    class_name: payload.class_name || null,
    updated_at: now,
  }
  await request.patch(`/personProfiles/${profileId}`, profileBody)

  if (payload.phone || payload.email) {
    const profilesRes = await request.get('/personProfiles', { params: { deleted: false } })
    const profiles = (profilesRes.data || []).filter(p => !p.deleted)
    const profile = profiles.find(p => p.id === Number(profileId))
    if (profile) {
      const accountsRes = await request.get('/userAccounts', { params: { deleted: false } })
      const accounts = (accountsRes.data || []).filter(a => !a.deleted)
      const account = accounts.find(a => a.user_id === profile.user_id)
      if (account) {
        await request.patch(`/userAccounts/${account.id}`, {
          phone: payload.phone || account.phone,
          email: payload.email || account.email,
          updated_at: now,
        })
      }
    }
  }

  // 写入操作日志
  try {
    await request.post('/operationLogs', {
      tenant_id: Number(tenantId),
      user_id: payload.operator_id || null,
      module: 'user',
      action: 'update',
      target_type: 'student',
      target_id: Number(profileId),
      content: `编辑学生信息：${payload.real_name}`,
      created_at: now,
    })
  } catch { /* ignore */ }

  return profileBody
}

/**
 * 切换学生账号状态
 */
export async function toggleSchoolStudentStatusApi(tenantId, profileId, newStatus) {
  const now = new Date().toISOString()

  const profilesRes = await request.get('/personProfiles', { params: { deleted: false } })
  const profiles = (profilesRes.data || []).filter(p => !p.deleted)
  const profile = profiles.find(p => p.id === Number(profileId) && p.tenant_id === Number(tenantId))
  if (!profile) throw new Error('学生不存在')

  const accountsRes = await request.get('/userAccounts', { params: { deleted: false } })
  const accounts = (accountsRes.data || []).filter(a => !a.deleted)
  const account = accounts.find(a => a.user_id === profile.user_id)
  if (!account) throw new Error('关联账号不存在')

  await request.patch(`/userAccounts/${account.id}`, {
    account_status: newStatus,
    updated_at: now,
  })

  // 写入操作日志
  try {
    await request.post('/operationLogs', {
      tenant_id: Number(tenantId),
      user_id: null,
      module: 'user',
      action: newStatus === 'active' ? 'enable' : 'disable',
      target_type: 'student',
      target_id: Number(profileId),
      content: `${newStatus === 'active' ? '启用' : '停用'}学生账号：${profile.real_name}`,
      created_at: now,
    })
  } catch { /* ignore */ }

  return { account_status: newStatus }
}

/**
 * 软删除学生
 */
export async function deleteSchoolStudentApi(tenantId, profileId) {
  const now = new Date().toISOString()

  const profilesRes = await request.get('/personProfiles', { params: { deleted: false } })
  const profiles = (profilesRes.data || []).filter(p => !p.deleted)
  const profile = profiles.find(p => p.id === Number(profileId) && p.tenant_id === Number(tenantId))
  if (!profile) throw new Error('学生不存在')

  await request.patch(`/personProfiles/${profileId}`, {
    deleted: true,
    updated_at: now,
  })

  const accountsRes = await request.get('/userAccounts', { params: { deleted: false } })
  const accounts = (accountsRes.data || []).filter(a => !a.deleted)
  const account = accounts.find(a => a.user_id === profile.user_id)
  if (account) {
    await request.patch(`/userAccounts/${account.id}`, {
      deleted: true,
      account_status: 'disabled',
      updated_at: now,
    })
  }

  // 写入操作日志
  try {
    await request.post('/operationLogs', {
      tenant_id: Number(tenantId),
      user_id: null,
      module: 'user',
      action: 'delete',
      target_type: 'student',
      target_id: Number(profileId),
      content: `删除学生：${profile.real_name}`,
      created_at: now,
    })
  } catch { /* ignore */ }

  return { success: true }
}

// ==================== 通用 API ====================

/**
 * 获取组织单位选项（用于下拉选择）
 */
export async function getSchoolOrgUnitOptionsApi(tenantId) {
  const [teachingRes, serviceRes] = await Promise.all([
    request.get('/teachingOrgUnits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/serviceOrgUnits', { params: { tenant_id: tenantId, deleted: false } }),
  ])

  const teaching = (teachingRes.data || []).filter(o => !o.deleted)
  const service = (serviceRes.data || []).filter(o => !o.deleted)

  return [
    ...teaching.map(o => ({ value: o.id, label: o.name, type: 'teaching' })),
    ...service.map(o => ({ value: o.id, label: o.name, type: 'service' })),
  ]
}

/**
 * 获取角色选项
 */
export async function getSchoolRoleOptionsApi(tenantId) {
  const rolesRes = await request.get('/roles', { params: { tenant_id: tenantId, deleted: false } })
  const roles = (rolesRes.data || []).filter(r => !r.deleted)

  return roles
    .filter(r => ['staff', 'teaching_admin', 'service_admin'].includes(r.role_code))
    .map(r => ({ value: r.role_code, label: r.role_name }))
}

/**
 * 获取学生院系选项（从现有学生数据中提取去重）
 */
export async function getSchoolDepartmentOptionsApi(tenantId) {
  const profilesRes = await request.get('/personProfiles', { params: { deleted: false } })
  const profiles = (profilesRes.data || []).filter(p => !p.deleted)

  const departments = [...new Set(
    profiles
      .filter(p => p.tenant_id === Number(tenantId) && p.role_type === 'student' && p.department_name)
      .map(p => p.department_name)
  )]

  return departments.map(d => ({ value: d, label: d }))
}

/**
 * 获取学生班级选项
 */
export async function getSchoolClassOptionsApi(tenantId) {
  const profilesRes = await request.get('/personProfiles', { params: { deleted: false } })
  const profiles = (profilesRes.data || []).filter(p => !p.deleted)

  const classes = [...new Set(
    profiles
      .filter(p => p.tenant_id === Number(tenantId) && p.role_type === 'student' && p.class_name)
      .map(p => p.class_name)
  )]

  return classes.map(c => ({ value: c, label: c }))
}
