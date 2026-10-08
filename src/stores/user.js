import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getToken,
  setToken,
  getUserInfo,
  setUserInfo,
  getTenant,
  setTenant,
  clearAuth,
} from '@/utils/auth'

function normalizeRoles(roles) {
  if (!Array.isArray(roles)) return []
  return roles.map((role) => {
    if (typeof role === 'string') {
      return { role_code: role, role_name: role }
    }
    return role
  })
}

function normalizeUser(loginData) {
  const explicitUser = loginData.user || loginData.userInfo
  if (explicitUser) {
    return {
      ...explicitUser,
      roles: normalizeRoles(explicitUser.roles || loginData.roles),
    }
  }

  const roleType = loginData.userType || loginData.user_type || loginData.role
  return {
    id: loginData.userId || loginData.user_id,
    user_id: loginData.userId || loginData.user_id,
    username: loginData.username,
    real_name: loginData.realName || loginData.real_name,
    realName: loginData.realName || loginData.real_name,
    role_type: roleType,
    role: roleType,
    tenant_id: loginData.tenantId || loginData.tenant_id,
    tenantId: loginData.tenantId || loginData.tenant_id,
    school_id: loginData.schoolId || loginData.school_id,
    schoolId: loginData.schoolId || loginData.school_id,
    roles: normalizeRoles(loginData.roles),
    permissions: loginData.permissions || [],
    avatar_url: loginData.avatarUrl || loginData.avatar_url,
    avatarUrl: loginData.avatarUrl || loginData.avatar_url,
  }
}

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken() || '')
  const userInfo = ref(getUserInfo() || null)
  const tenant = ref(getTenant() || null)

  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => userInfo.value?.role_type || userInfo.value?.role || '')
  const roleName = computed(() => {
    const roles = userInfo.value?.roles
    if (Array.isArray(roles) && roles.length > 0) {
      return roles.map((role) => role.role_name || role.role_code || role).join('、')
    }
    if (userInfo.value?.role_name) return userInfo.value.role_name
    const roleTypeMap = {
      system_admin: '系统管理员',
      school_admin: '学校管理员',
      staff: '教职工',
      student: '学生',
    }
    return roleTypeMap[userRole.value] || userRole.value || ''
  })
  const realName = computed(() => userInfo.value?.real_name || userInfo.value?.realName || '')
  const tenantId = computed(() => userInfo.value?.tenant_id || tenant.value?.tenantId || tenant.value?.tenant_id || null)
  const schoolId = computed(() => userInfo.value?.school_id || tenant.value?.schoolId || tenant.value?.school_id || null)
  const schoolName = computed(() => tenant.value?.schoolName || tenant.value?.school_name || '')

  function login(loginData) {
    const user = normalizeUser(loginData)
    token.value = loginData.token
    userInfo.value = user
    tenant.value = {
      tenantId: loginData.tenant_id || loginData.tenantId || user.tenant_id || user.tenantId,
      tenant_id: loginData.tenant_id || loginData.tenantId || user.tenant_id || user.tenantId,
      schoolId: loginData.school_id || loginData.schoolId || user.school_id || user.schoolId,
      school_id: loginData.school_id || loginData.schoolId || user.school_id || user.schoolId,
      schoolName: loginData.school_name || loginData.schoolName,
      school_name: loginData.school_name || loginData.schoolName,
    }
    setToken(loginData.token)
    setUserInfo(user)
    setTenant(tenant.value)
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    tenant.value = null
    clearAuth()
  }

  function updateUserInfo(info) {
    userInfo.value = { ...userInfo.value, ...info }
    setUserInfo(userInfo.value)
  }

  return {
    token,
    userInfo,
    tenant,
    isLoggedIn,
    userRole,
    roleName,
    realName,
    tenantId,
    schoolId,
    schoolName,
    login,
    logout,
    updateUserInfo,
  }
})
