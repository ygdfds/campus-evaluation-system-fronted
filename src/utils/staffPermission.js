/**
 * 职工端权限工具
 * 
 * 用于判断当前职工用户的管理权限、菜单可见性与数据范围。
 * 后续可替换为后端权限接口返回的权限数据。
 */

// 职工端管理子角色列表
const STAFF_PORTAL_ROLES = [
  'teaching_admin',
  'service_admin',
  'feedback_handler',
  'form_publisher',
  'course_owner',
  'service_window_manager',
]

// 菜单可见性规则：menuKey -> 允许访问的角色列表
const MENU_ROLE_MAP = {
  evaluation: ['teaching_admin', 'service_admin', 'form_publisher'],
  feedback: ['feedback_handler', 'service_admin', 'teaching_admin', 'form_publisher'],
  reports: ['teaching_admin', 'service_admin', 'course_owner', 'school_admin', 'feedback_handler'],
  appeals: ['school_admin', 'teaching_admin', 'course_owner', 'service_admin'],
}

/**
 * 从 userInfo 中提取当前用户的职工子角色 code 数组
 * @param {Object} userInfo - userStore.userInfo（登录时存储的用户信息）
 * @returns {string[]} 角色 code 数组，如 ['teaching_admin']
 */
export function getStaffRoleCodes(userInfo) {
  if (!userInfo) return []
  // 优先从 roles 数组获取（登录后存储的 userRoleList）
  if (Array.isArray(userInfo.roles) && userInfo.roles.length > 0) {
    return userInfo.roles.map(r => r.role_code).filter(Boolean)
  }
  // 回退：role_type 字段
  if (userInfo.role_type && userInfo.role_type !== 'staff') {
    return [userInfo.role_type]
  }
  return []
}

/**
 * 判断当前用户是否为职工端授权用户（拥有任一管理子角色）
 * @param {string[]} roleCodes - 角色 code 数组
 * @returns {boolean}
 */
export function isStaffPortalUser(roleCodes) {
  if (!Array.isArray(roleCodes) || roleCodes.length === 0) return false
  return roleCodes.some(code => STAFF_PORTAL_ROLES.includes(code))
}

/**
 * 判断指定菜单项对当前角色是否可见
 * @param {string} menuKey - 菜单标识：evaluation / feedback / reports / appeals
 * @param {string[]} roleCodes - 角色 code 数组
 * @returns {boolean}
 */
export function canViewStaffMenu(menuKey, roleCodes) {
  const allowedRoles = MENU_ROLE_MAP[menuKey]
  if (!allowedRoles || !Array.isArray(roleCodes)) return false
  return roleCodes.some(code => allowedRoles.includes(code))
}

/**
 * 构建当前职工用户的管理范围 scope
 * @param {Object} userStore - Pinia user store
 * @param {Array} teachingOrgs - 教学组织列表（teachingOrgUnits）
 * @param {Array} serviceOrgs - 服务组织列表（serviceOrgUnits）
 * @returns {Object} scope 对象
 * 
 * 说明：当前为前端基于 mock 数据的简化实现，
 * 后续可替换为后端权限接口返回的授权范围。
 */
export function getStaffRoleScope(userStore, teachingOrgs = [], serviceOrgs = []) {
  const roleCodes = getStaffRoleCodes(userStore.userInfo)
  const userId = userStore.userInfo?.id
  const tenantId = userStore.tenantId

  // 基于 personProfiles.org_unit_id 确定所属组织
  // 后续可替换为后端 staffScope 接口
  const profile = userStore.userInfo
  const orgUnitId = profile?.org_unit_id || null

  // 教学组织 ID 列表
  const teachingOrgIds = orgUnitId
    ? teachingOrgs.filter(o => o.id === orgUnitId || o.parent_id === orgUnitId).map(o => o.id)
    : []

  // 服务组织 ID 列表（基于 org_unit_id 过滤，与教学组织逻辑一致）
  const serviceOrgIds = orgUnitId
    ? serviceOrgs.filter(o => o.id === orgUnitId || o.parent_id === orgUnitId).map(o => o.id)
    : []

  return {
    tenantId,
    userId,
    roleCodes,
    teachingOrgIds,
    serviceOrgIds,
    orgUnitId,
  }
}

/**
 * 获取角色中文名称映射
 * @param {string[]} roleCodes
 * @returns {string} 角色名称字符串
 */
export function getStaffRoleNames(roleCodes) {
  const nameMap = {
    teaching_admin: '学院教学管理员',
    service_admin: '后勤部门管理员',
    feedback_handler: '反馈处理员',
    form_publisher: '评价表单发布员',
    course_owner: '课程负责人',
    service_window_manager: '服务窗口负责人',
    school_admin: '校级管理员',
    staff: '教职工',
  }
  if (!Array.isArray(roleCodes) || roleCodes.length === 0) return '教职工'
  return roleCodes.map(code => nameMap[code] || code).join('、')
}

/**
 * 根据角色获取管理范围描述
 * @param {string[]} roleCodes
 * @returns {string}
 */
export function getStaffScopeDescription(roleCodes) {
  if (!Array.isArray(roleCodes) || roleCodes.length === 0) return ''
  if (roleCodes.includes('school_admin')) {
    return '全校评价数据与反馈'
  }
  if (roleCodes.includes('teaching_admin')) {
    return '本学院课程、教师评价与教学反馈'
  }
  if (roleCodes.includes('service_admin')) {
    return '本服务部门服务项目、投诉建议与服务评价'
  }
  if (roleCodes.includes('feedback_handler')) {
    return '分配的投诉建议与反馈工单'
  }
  if (roleCodes.includes('form_publisher')) {
    return '本人创建或组织范围内的评价表单'
  }
  if (roleCodes.includes('course_owner')) {
    return '负责课程的评价数据与申诉'
  }
  if (roleCodes.includes('service_window_manager')) {
    return '负责服务窗口的服务评价与反馈'
  }
  return '授权范围内的业务数据'
}
