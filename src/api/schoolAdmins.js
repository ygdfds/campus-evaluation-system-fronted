import request from '@/request'

// ==================== 映射表 ====================

export const adminTypeMap = {
  initial_admin: '初始管理员',
  sub_admin: '子管理员',
}

export const adminRoleTagMap = {
  true: '初始管理员',
  false: '子管理员',
}

export const adminStatusMap = {
  active: { label: '启用', type: 'success' },
  disabled: { label: '停用', type: 'danger' },
}

// ==================== 辅助函数 ====================

/**
 * 写入操作日志（标准化格式）
 */
async function writeLog({ tenantId, schoolId, action, targetId, operatorId, content }) {
  try {
    await request.post('/operationLogs', {
      tenant_id: Number(tenantId),
      school_id: Number(schoolId) || Number(tenantId),
      module: 'school_admin',
      action,
      target_type: 'user_account',
      target_id: Number(targetId),
      operator_id: operatorId || null,
      content,
      created_at: new Date().toISOString(),
    })
  } catch { /* ignore */ }
}

/**
 * 获取管理员账号信息（内部辅助）
 */
async function getAdminAccount(tenantId, userId) {
  const accountsRes = await request.get('/userAccounts', { params: { deleted: false } })
  const accounts = (accountsRes.data || []).filter(a => !a.deleted)
  return accounts.find(a => a.user_id === Number(userId) && a.tenant_id === Number(tenantId))
}

// ==================== 管理员列表 ====================

/**
 * 获取本校所有管理员列表（合并 personProfiles + userAccounts）
 */
export async function getSchoolAdminListApi(tenantId) {
  const [profilesRes, accountsRes, filesRes] = await Promise.all([
    request.get('/personProfiles', { params: { deleted: false } }),
    request.get('/userAccounts', { params: { deleted: false } }),
    request.get('/fileResources', { params: { deleted: false } }),
  ])

  const profiles = (profilesRes.data || []).filter(p => !p.deleted)
  const accounts = (accountsRes.data || []).filter(a => !a.deleted)
  const files = (filesRes.data || []).filter(f => !f.deleted)
  const fileMap = Object.fromEntries(files.map(f => [f.id, f]))

  // 构建 userId -> 姓名 映射（用于显示创建人）
  const allProfiles = profiles
  const nameMap = Object.fromEntries(allProfiles.map(p => [p.user_id, p.real_name]))

  // 筛选 school_admin 角色的 profile
  const adminList = profiles
    .filter(p => p.tenant_id === Number(tenantId) && p.role_type === 'school_admin')
    .map(p => {
      const account = accounts.find(a => a.user_id === p.user_id && a.tenant_id === Number(tenantId))
      const adminType = account?.admin_type || (account?.is_primary ? 'initial_admin' : 'sub_admin')
      const creatorId = account?.created_by || null
      return {
        ...p,
        account: account || null,
        username: account?.username || '-',
        phone: account?.phone || '-',
        email: account?.email || '-',
        account_status: account?.account_status || 'active',
        last_login_at: account?.last_login_at || '-',
        is_primary: account?.is_primary ?? false,
        admin_type: adminType,
        role_tag: adminTypeMap[adminType] || '子管理员',
        must_change_password: account?.must_change_password ?? false,
        avatar_url: p.avatar_file_id ? (fileMap[p.avatar_file_id]?.url || '') : '',
        created_at: account?.created_at || p.created_at,
        created_by: creatorId,
        creator_name: creatorId ? (nameMap[creatorId] || '-') : '-',
      }
    })

  return adminList
}

/**
 * 获取管理员详情
 */
export async function getSchoolAdminDetailApi(tenantId, profileId) {
  const [profilesRes, accountsRes, filesRes] = await Promise.all([
    request.get('/personProfiles', { params: { deleted: false } }),
    request.get('/userAccounts', { params: { deleted: false } }),
    request.get('/fileResources', { params: { deleted: false } }),
  ])

  const profiles = (profilesRes.data || []).filter(p => !p.deleted)
  const accounts = (accountsRes.data || []).filter(a => !a.deleted)
  const files = (filesRes.data || []).filter(f => !f.deleted)
  const fileMap = Object.fromEntries(files.map(f => [f.id, f]))

  // 构建 userId -> 姓名 映射
  const nameMap = Object.fromEntries(profiles.map(p => [p.user_id, p.real_name]))

  const profile = profiles.find(p => p.id === Number(profileId) && p.tenant_id === Number(tenantId))
  if (!profile) return null

  const account = accounts.find(a => a.user_id === profile.user_id && a.tenant_id === Number(tenantId))
  const adminType = account?.admin_type || (account?.is_primary ? 'initial_admin' : 'sub_admin')
  const creatorId = account?.created_by || null

  return {
    ...profile,
    account: account || null,
    username: account?.username || '-',
    phone: account?.phone || '-',
    email: account?.email || '-',
    account_status: account?.account_status || 'active',
    last_login_at: account?.last_login_at || '-',
    is_primary: account?.is_primary ?? false,
    admin_type: adminType,
    role_tag: adminTypeMap[adminType] || '子管理员',
    must_change_password: account?.must_change_password ?? false,
    avatar_url: profile.avatar_file_id ? (fileMap[profile.avatar_file_id]?.url || '') : '',
    created_at: account?.created_at || profile.created_at,
    created_by: creatorId,
    creator_name: creatorId ? (nameMap[creatorId] || '-') : '-',
  }
}

// ==================== 管理员操作 ====================

/**
 * 创建子管理员（userAccount + personProfile + userRoles）
 */
export async function createSchoolAdminApi(tenantId, payload, operatorId) {
  const now = new Date().toISOString()
  const userId = Date.now()

  // 1. 创建 userAccount
  const accountBody = {
    id: userId,
    tenant_id: Number(tenantId),
    username: payload.username,
    phone: payload.phone || null,
    email: payload.email || null,
    status: 'active',
    account_status: 'active',
    password_hash: `$mock$hashed_${payload.username}`,
    must_change_password: payload.must_change_password !== false,
    is_primary: false,
    admin_type: 'sub_admin',
    created_by: Number(operatorId) || null,
    created_at: now,
    updated_at: now,
    deleted: false,
  }
  await request.post('/userAccounts', accountBody)

  // 2. 创建 personProfile
  const profileBody = {
    tenant_id: Number(tenantId),
    user_id: userId,
    real_name: payload.real_name,
    role_type: 'school_admin',
    no_work: payload.no_work || null,
    no_student: null,
    gender: payload.gender || null,
    office_phone: null,
    intro: payload.intro || null,
    avatar_file_id: null,
    created_at: now,
    updated_at: now,
    deleted: false,
  }
  const profileRes = await request.post('/personProfiles', profileBody)

  // 3. 创建 userRoles 关联（查找本校 school_admin 角色）
  try {
    const rolesRes = await request.get('/roles', { params: { tenant_id: tenantId, role_code: 'school_admin', deleted: false } })
    const roles = (rolesRes.data || []).filter(r => !r.deleted)
    if (roles.length > 0) {
      await request.post('/userRoles', {
        tenant_id: Number(tenantId),
        user_id: userId,
        role_id: roles[0].id,
        created_at: now,
        updated_at: now,
        deleted: false,
      })
    }
  } catch { /* ignore */ }

  // 4. 写入操作日志
  await writeLog({
    tenantId,
    schoolId: tenantId,
    action: 'create_school_admin',
    targetId: profileRes.id,
    operatorId,
    content: `创建子管理员：${payload.real_name}（${payload.username}）`,
  })

  return { ...profileBody, id: profileRes.id, account: accountBody }
}

/**
 * 切换子管理员账号状态
 */
export async function toggleSchoolAdminStatusApi(tenantId, profileId, newStatus, operatorId) {
  const now = new Date().toISOString()

  const profilesRes = await request.get('/personProfiles', { params: { deleted: false } })
  const profiles = (profilesRes.data || []).filter(p => !p.deleted)
  const profile = profiles.find(p => p.id === Number(profileId) && p.tenant_id === Number(tenantId))
  if (!profile) throw new Error('管理员不存在')

  // 获取关联账号
  const account = await getAdminAccount(tenantId, profile.user_id)
  if (!account) throw new Error('关联账号不存在')

  // 禁止操作初始管理员
  if (account.is_primary || account.admin_type === 'initial_admin') {
    throw new Error('初始管理员不可停用')
  }

  // 禁止操作自己
  if (operatorId && Number(account.user_id) === Number(operatorId)) {
    throw new Error('不能停用当前登录账号')
  }

  await request.patch(`/userAccounts/${account.id}`, {
    account_status: newStatus,
    updated_at: now,
  })

  // 写入操作日志
  const action = newStatus === 'active' ? 'enable_school_admin' : 'disable_school_admin'
  const actionText = newStatus === 'active' ? '启用' : '停用'
  await writeLog({
    tenantId,
    schoolId: tenantId,
    action,
    targetId: Number(profileId),
    operatorId,
    content: `${actionText}子管理员账号：${profile.real_name}`,
  })

  return { account_status: newStatus }
}

/**
 * 删除子管理员（软删除）
 */
export async function deleteSchoolAdminApi(tenantId, profileId, operatorId) {
  const now = new Date().toISOString()

  const profilesRes = await request.get('/personProfiles', { params: { deleted: false } })
  const profiles = (profilesRes.data || []).filter(p => !p.deleted)
  const profile = profiles.find(p => p.id === Number(profileId) && p.tenant_id === Number(tenantId))
  if (!profile) throw new Error('管理员不存在')

  // 获取关联账号
  const account = await getAdminAccount(tenantId, profile.user_id)

  // 禁止删除初始管理员
  if (account?.is_primary || account?.admin_type === 'initial_admin') {
    throw new Error('初始管理员不可删除')
  }

  // 禁止删除自己
  if (operatorId && account && Number(account.user_id) === Number(operatorId)) {
    throw new Error('不能删除当前登录账号')
  }

  // 软删除 personProfile
  await request.patch(`/personProfiles/${profileId}`, {
    deleted: true,
    updated_at: now,
  })

  // 软删除 + 停用 userAccount
  if (account) {
    await request.patch(`/userAccounts/${account.id}`, {
      deleted: true,
      account_status: 'disabled',
      updated_at: now,
    })
  }

  // 写入操作日志
  await writeLog({
    tenantId,
    schoolId: tenantId,
    action: 'delete_school_admin',
    targetId: Number(profileId),
    operatorId,
    content: `删除子管理员：${profile.real_name}`,
  })

  return { success: true }
}

/**
 * 重置子管理员密码
 */
export async function resetSchoolAdminPasswordApi(tenantId, profileId, newPassword, operatorId) {
  const now = new Date().toISOString()

  const profilesRes = await request.get('/personProfiles', { params: { deleted: false } })
  const profiles = (profilesRes.data || []).filter(p => !p.deleted)
  const profile = profiles.find(p => p.id === Number(profileId) && p.tenant_id === Number(tenantId))
  if (!profile) throw new Error('管理员不存在')

  // 获取关联账号
  const account = await getAdminAccount(tenantId, profile.user_id)
  if (!account) throw new Error('关联账号不存在')

  // 禁止重置初始管理员密码（除非操作者也是初始管理员且业务允许）
  if (account.is_primary || account.admin_type === 'initial_admin') {
    throw new Error('不能重置初始管理员密码')
  }

  await request.patch(`/userAccounts/${account.id}`, {
    password_hash: `$mock$hashed_${newPassword}`,
    must_change_password: true,
    updated_at: now,
  })

  // 写入操作日志
  await writeLog({
    tenantId,
    schoolId: tenantId,
    action: 'reset_school_admin_password',
    targetId: Number(profileId),
    operatorId,
    content: `重置管理员密码：${profile.real_name}`,
  })

  return { success: true }
}

/**
 * 获取管理员操作日志
 */
export async function getSchoolAdminLogsApi(tenantId, adminProfileId) {
  const logsRes = await request.get('/operationLogs', {})
  const logs = (logsRes.data || []).filter(l => l.tenant_id === Number(tenantId))

  // 筛选与该管理员相关的日志（module=school_admin 且 target_id 匹配）
  const adminLogs = logs
    .filter(l => l.module === 'school_admin' && l.target_id === Number(adminProfileId))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10)

  // 获取操作人姓名
  if (adminLogs.length === 0) return []

  const profilesRes = await request.get('/personProfiles', { params: { deleted: false } })
  const profiles = (profilesRes.data || []).filter(p => !p.deleted)
  const nameMap = Object.fromEntries(profiles.map(p => [p.user_id, p.real_name]))

  return adminLogs.map(log => ({
    ...log,
    operator_name: log.operator_id ? (nameMap[log.operator_id] || '-') : '-',
  }))
}
