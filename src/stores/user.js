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

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref(getToken() || '')
  const userInfo = ref(getUserInfo() || null)
  const tenant = ref(getTenant() || null)

  // 计算属性
  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => userInfo.value?.role_type || userInfo.value?.role || '')
  // 角色名称：优先从 roles 数组取第一个，回退到 role_type 映射
  const roleName = computed(() => {
    // 新格式：roles 数组
    const roles = userInfo.value?.roles
    if (Array.isArray(roles) && roles.length > 0) {
      return roles.map(r => r.role_name).join('、')
    }
    // 旧格式：直接字段
    if (userInfo.value?.role_name) return userInfo.value.role_name
    // 回退：role_type 映射为中文
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

  // 登录
  function login(loginData) {
    token.value = loginData.token
    // 兼容新旧格式：新格式用 user，旧格式用 userInfo
    const user = loginData.user || loginData.userInfo
    userInfo.value = user
    tenant.value = {
      tenantId: loginData.tenant_id || loginData.tenantId,
      tenant_id: loginData.tenant_id || loginData.tenantId,
      schoolId: loginData.school_id || loginData.schoolId,
      school_id: loginData.school_id || loginData.schoolId,
      schoolName: loginData.school_name || loginData.schoolName,
      school_name: loginData.school_name || loginData.schoolName,
    }
    setToken(loginData.token)
    setUserInfo(user)
    setTenant(tenant.value)
  }

  // 登出
  function logout() {
    token.value = ''
    userInfo.value = null
    tenant.value = null
    clearAuth()
  }

  // 更新用户信息
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
