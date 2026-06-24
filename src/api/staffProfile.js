import request from '@/request'

/**
 * 职工端个人信息 API
 *
 * 所有查询基于 tenant_id + user_id + deleted=false 过滤。
 * 只允许查看和修改当前登录职工本人的信息。
 */

// ==================== 查询类 ====================

/**
 * 获取职工个人信息（聚合）
 */
export function getStaffProfileApi(currentUser) {
  const { tenantId, userId } = currentUser
  const strTenant = String(tenantId)
  const strUser = String(userId)

  return Promise.all([
    // 账号信息
    request.get('/userAccounts', { params: { id: userId, tenant_id: tenantId, deleted: false } }),
    // 人员档案
    request.get('/personProfiles', { params: { user_id: userId, tenant_id: tenantId, deleted: false } }),
    // 用户角色关联
    request.get('/userRoles', { params: { user_id: userId, tenant_id: tenantId, deleted: false } }),
    // 所有角色定义
    request.get('/roles', { params: { tenant_id: tenantId, deleted: false } }),
    // 教学组织
    request.get('/teachingOrgUnits', { params: { tenant_id: tenantId, deleted: false } }),
    // 服务组织
    request.get('/serviceOrgUnits', { params: { tenant_id: tenantId, deleted: false } }),
    // 通知偏好（非关键请求，404 时降级为空）
    request.get('/staffNotificationPreferences', { params: { user_id: userId, tenant_id: tenantId } }).catch(() => ({ data: [] })),
    // 未读消息数
    request.get('/notifications', { params: { receiver_user_id: userId, tenant_id: tenantId, read_status: 'unread', deleted: false } }).catch(() => ({ data: [] })),
    // 待处理反馈工单（按当前用户角色范围过滤）
    request.get('/feedbackWorkOrders', { params: { tenant_id: tenantId, deleted: false } }).catch(() => ({ data: [] })),
    // 待处理申诉（按当前用户角色范围过滤）
    request.get('/appealRequests', { params: { tenant_id: tenantId, deleted: false } }).catch(() => ({ data: [] })),
  ]).then(([accRes, profRes, urRes, rolesRes, teachingRes, serviceRes, prefRes, notifRes, feedbackRes, appealRes]) => {
    // 账号
    const accounts = accRes.data || []
    const account = accounts.find(a => String(a.id) === strUser && String(a.tenant_id) === strTenant && !a.deleted) || null

    // 人员档案
    const profiles = profRes.data || []
    const profile = profiles.find(p => String(p.user_id) === strUser && String(p.tenant_id) === strTenant && !p.deleted) || null

    // 角色
    const userRoleRecords = urRes.data || []
    const allRoles = rolesRes.data || []
    const userRoles = userRoleRecords
      .filter(ur => String(ur.user_id) === strUser && String(ur.tenant_id) === strTenant)
      .map(ur => {
        const role = allRoles.find(r => r.id === ur.role_id)
        return role ? { id: role.id, role_code: role.role_code, role_name: role.role_name, scope_type: role.scope_type } : null
      })
      .filter(Boolean)

    // 教学组织
    const teachingOrgs = (teachingRes.data || []).filter(o => String(o.tenant_id) === strTenant)
    // 服务组织
    const serviceOrgs = (serviceRes.data || []).filter(o => String(o.tenant_id) === strTenant)

    // 当前用户所属组织
    const orgUnitId = profile?.org_unit_id
    const teachingOrg = orgUnitId ? teachingOrgs.find(o => o.id === orgUnitId) : null
    const serviceOrg = orgUnitId ? serviceOrgs.find(o => o.id === orgUnitId) : null

    // 通知偏好
    const prefs = prefRes.data || []
    const preference = prefs.find(p => String(p.user_id) === strUser && String(p.tenant_id) === strTenant) || null

    // 权限范围描述
    const permissionTexts = generatePermissionTexts(userRoles, teachingOrg, serviceOrg)

    // 账号概览统计（按当前用户角色范围过滤）
    const roleCodes = userRoles.map(r => r.role_code)
    const unreadCount = (notifRes.data || []).filter(n =>
      String(n.tenant_id) === strTenant &&
      (String(n.receiver_user_id) === strUser || n.receiver_user_id === null) &&
      n.read_status === 'unread' && !n.deleted
    ).length
    // 反馈工单：分配给当前用户的 + 未分配但当前用户有处理角色的
    // NOTE: 未分配任务当前按角色兜底，后续接后端需按组织范围精确过滤
    // （如 service_admin 只应看到 handler_org_id 属于自己授权 serviceOrgIds 的未分配工单）
    const feedbackActiveStatuses = ['pending', 'processing']
    const feedbackRoleCodes = ['feedback_handler', 'service_admin']
    const hasFeedbackRole = roleCodes.some(c => feedbackRoleCodes.includes(c))
    const pendingFeedbackCount = (feedbackRes.data || []).filter(w =>
      feedbackActiveStatuses.includes(w.status) &&
      (String(w.assignee_id) === strUser || (w.assignee_id === null && hasFeedbackRole))
    ).length
    // 申诉：分配给当前处理人的 + 未分配但当前用户有申诉处理角色的
    // NOTE: appeal_handler 为预留角色 code，当前 mock 中申诉权限由 teaching_admin 覆盖
    // NOTE: 未分配申诉同样按角色兜底，后续需按 teachingOrgIds 精确过滤
    const appealActiveStatuses = ['pending', 'processing', 'waiting_trace_auth']
    const appealRoleCodes = ['appeal_handler', 'teaching_admin']
    const hasAppealRole = roleCodes.some(c => appealRoleCodes.includes(c))
    const pendingAppealCount = (appealRes.data || []).filter(a =>
      appealActiveStatuses.includes(a.status) &&
      (String(a.handler_id) === strUser || (a.handler_id === null && hasAppealRole))
    ).length

    return {
      account,
      profile,
      roles: userRoles,
      teachingOrg,
      serviceOrg,
      teachingOrgs,
      serviceOrgs,
      permissionScope: permissionTexts,
      notificationPreference: preference,
      overviewStats: {
        unreadCount,
        pendingFeedbackCount,
        pendingAppealCount,
        pendingTotal: pendingFeedbackCount + pendingAppealCount,
        permissionModuleCount: permissionTexts.length,
      },
    }
  })
}

/**
 * 根据角色和组织生成权限描述
 */
function generatePermissionTexts(roles, teachingOrg, serviceOrg) {
  const texts = []
  const roleCodes = roles.map(r => r.role_code)

  if (roleCodes.includes('staff')) {
    texts.push('可查看：授权范围内数据看板')
  }
  if (roleCodes.includes('teaching_admin')) {
    const orgName = teachingOrg?.name || '所属学院'
    texts.push(`可管理：${orgName}教学事务`)
  }
  if (roleCodes.includes('form_publisher')) {
    texts.push('可发布：教学评价表单')
  }
  if (roleCodes.includes('feedback_handler')) {
    const orgName = serviceOrg?.name || teachingOrg?.name || '所属部门'
    texts.push(`可处理：${orgName}相关反馈`)
  }
  if (roleCodes.includes('service_admin')) {
    const orgName = serviceOrg?.name || '后勤服务部门'
    texts.push(`可管理：${orgName}服务事务`)
  }
  if (roleCodes.includes('course_owner')) {
    texts.push('可负责：授权范围内课程管理')
  }
  // NOTE: appeal_handler 为预留角色 code，当前 mock roles 表中不存在，申诉权限由 teaching_admin 覆盖
  if (roleCodes.includes('appeal_handler') || roleCodes.includes('teaching_admin')) {
    texts.push('可处理：授权范围内评价申诉')
  }

  if (texts.length === 0) {
    texts.push('可查看：个人相关信息')
  }

  return texts
}

// ==================== 修改类 ====================

/**
 * 更新职工基本信息
 * 仅允许修改：phone, email, office_phone, intro, avatar_file_id
 */
export function updateStaffBasicInfoApi(payload, currentUser) {
  const { tenantId, userId } = currentUser
  const allowedFields = ['phone', 'email', 'office_phone', 'intro', 'avatar_file_id']
  const cleanPayload = {}
  allowedFields.forEach(key => {
    if (payload[key] !== undefined) {
      cleanPayload[key] = payload[key]
    }
  })
  cleanPayload.updated_at = new Date().toISOString()

  const promises = []

  // 更新账号表字段（phone, email, avatar_file_id）
  const accountFields = ['phone', 'email', 'avatar_file_id']
  const accountUpdate = {}
  accountFields.forEach(key => {
    if (cleanPayload[key] !== undefined) accountUpdate[key] = cleanPayload[key]
  })
  if (Object.keys(accountUpdate).length > 0) {
    accountUpdate.updated_at = cleanPayload.updated_at
    promises.push(request.patch(`/userAccounts/${userId}`, accountUpdate))
  }

  // 更新人员档案表字段（office_phone, intro, avatar_file_id）
  return request.get('/personProfiles', {
    params: { user_id: userId, tenant_id: tenantId, deleted: false },
  }).then(res => {
    const profiles = res.data || []
    const profile = profiles.find(p => String(p.user_id) === String(userId) && String(p.tenant_id) === String(tenantId))
    if (profile) {
      const profileUpdate = {}
      ;['office_phone', 'intro', 'avatar_file_id'].forEach(key => {
        if (cleanPayload[key] !== undefined) profileUpdate[key] = cleanPayload[key]
      })
      if (Object.keys(profileUpdate).length > 0) {
        profileUpdate.updated_at = cleanPayload.updated_at
        promises.push(request.patch(`/personProfiles/${profile.id}`, profileUpdate))
      }
    }
    return Promise.all(promises).then(results => results[results.length - 1]?.data || {})
  })
}

/**
 * 修改密码
 */
export function changeStaffPasswordApi(payload, currentUser) {
  const { userId } = currentUser
  const { oldPassword, newPassword } = payload

  return request.get('/userAccounts', {
    params: { id: userId },
  }).then(res => {
    const accounts = res.data || []
    const account = accounts.find(a => String(a.id) === String(userId))
    if (!account) {
      throw new Error('账号不存在')
    }

    // Mock 阶段简单校验
    const currentPwd = account.password_hash || account.password || '123456'
    if (currentPwd !== '$mock$hashed_' + account.username && currentPwd !== oldPassword) {
      // mock 环境：原密码统一为 123456，对应 hash 为 $mock$hashed_xxx
      // 简化处理：只要 oldPassword 为 '123456' 就算匹配
      if (oldPassword !== '123456') {
        throw new Error('原密码不正确')
      }
    }

    const newHash = '$mock$hashed_' + newPassword
    return request.patch(`/userAccounts/${userId}`, {
      password_hash: newHash,
      password: newPassword,
      updated_at: new Date().toISOString(),
    })
  }).then(res => res.data)
}

/**
 * 更新通知偏好
 * 如果没有记录则创建
 */
export function updateStaffNotificationPreferenceApi(payload, currentUser) {
  const { tenantId, userId } = currentUser

  return request.get('/staffNotificationPreferences', {
    params: { user_id: userId, tenant_id: tenantId },
  }).then(res => {
    const prefs = res.data || []
    const existing = prefs.find(p => String(p.user_id) === String(userId) && String(p.tenant_id) === String(tenantId))

    if (existing) {
      return request.patch(`/staffNotificationPreferences/${existing.id}`, {
        ...payload,
        updated_at: new Date().toISOString(),
      }).then(r => r.data)
    } else {
      return request.post('/staffNotificationPreferences', {
        tenant_id: tenantId,
        user_id: userId,
        ...payload,
        updated_at: new Date().toISOString(),
      }).then(r => r.data)
    }
  })
}
