import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getCurrentUserApi, logoutApi } from '@/api/auth'
import {
  getToken,
  setToken,
  getUserInfo,
  setUserInfo,
  getTenant,
  setTenant,
  clearAuth,
} from '@/utils/auth'

const roleLabelMap = {
  system_admin: 'System administrator',
  school_admin: 'School administrator',
  staff: 'Staff',
  student: 'Student',
}

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken() || '')
  const userInfo = ref(getUserInfo() || null)
  const tenant = ref(getTenant() || null)
  const sessionChecked = ref(false)

  const isLoggedIn = computed(() => !!token.value)
  const roles = computed(() => normalizeRoles(userInfo.value?.roles))
  const permissions = computed(() => Array.isArray(userInfo.value?.permissions) ? userInfo.value.permissions : [])
  const userRole = computed(() => userInfo.value?.roleType || userInfo.value?.role_type || userInfo.value?.userType || roles.value[0] || '')
  const roleName = computed(() => roles.value.map(role => roleLabelMap[role] || role).join(', ') || roleLabelMap[userRole.value] || userRole.value || '')
  const realName = computed(() => userInfo.value?.realName || userInfo.value?.real_name || '')
  const tenantId = computed(() => userInfo.value?.tenantId || userInfo.value?.tenant_id || tenant.value?.tenantId || tenant.value?.tenant_id || null)
  const schoolId = computed(() => userInfo.value?.schoolId || userInfo.value?.school_id || tenant.value?.schoolId || tenant.value?.school_id || null)
  const schoolName = computed(() => tenant.value?.schoolName || tenant.value?.school_name || '')

  function login(loginData) {
    applyAuthPayload(loginData)
  }

  async function confirmSession(options = {}) {
    if (!token.value) return null
    if (sessionChecked.value && !options.force) return userInfo.value
    const res = await getCurrentUserApi({ silent: true })
    const currentUser = res.data || res
    applyUser(currentUser)
    sessionChecked.value = true
    return userInfo.value
  }

  async function logout(options = {}) {
    if (token.value && !options.localOnly) {
      await logoutApi().catch(() => {})
    }
    resetAuth()
  }

  function updateUserInfo(info) {
    applyUser({ ...userInfo.value, ...info })
  }

  function applyAuthPayload(payload = {}) {
    const authToken = payload.token
    if (!authToken) throw new Error('Login response does not include token')
    token.value = authToken
    setToken(authToken)
    applyUser(normalizeUser(payload.user || payload.userInfo || payload))
    sessionChecked.value = false
  }

  function applyUser(user) {
    const normalized = normalizeUser(user)
    userInfo.value = normalized
    tenant.value = {
      tenantId: normalized.tenantId,
      tenant_id: normalized.tenantId,
      schoolId: normalized.schoolId,
      school_id: normalized.schoolId,
      schoolName: normalized.schoolName,
      school_name: normalized.schoolName,
    }
    setUserInfo(normalized)
    setTenant(tenant.value)
  }

  function resetAuth() {
    token.value = ''
    userInfo.value = null
    tenant.value = null
    sessionChecked.value = false
    clearAuth()
  }

  return {
    token,
    userInfo,
    tenant,
    sessionChecked,
    roles,
    permissions,
    isLoggedIn,
    userRole,
    roleName,
    realName,
    tenantId,
    schoolId,
    schoolName,
    login,
    confirmSession,
    logout,
    updateUserInfo,
  }
})

function normalizeUser(raw = {}) {
  return {
    ...raw,
    userId: raw.userId || raw.user_id || raw.id,
    username: raw.username,
    realName: raw.realName || raw.real_name,
    userType: raw.userType || raw.user_type || raw.roleType || raw.role_type,
    roleType: raw.roleType || raw.role_type || raw.userType || raw.user_type || raw.role,
    tenantId: raw.tenantId || raw.tenant_id || null,
    schoolId: raw.schoolId || raw.school_id || null,
    schoolName: raw.schoolName || raw.school_name || '',
    avatarUrl: raw.avatarUrl || raw.avatar_url || null,
    roles: normalizeRoles(raw.roles),
    permissions: Array.isArray(raw.permissions) ? raw.permissions : [],
    mustChangePassword: Boolean(raw.mustChangePassword || raw.must_change_password),
  }
}

function normalizeRoles(value) {
  if (!Array.isArray(value)) return []
  return value
    .map(role => {
      if (typeof role === 'string') return role
      return role?.roleCode || role?.role_code || role?.code
    })
    .filter(Boolean)
}
