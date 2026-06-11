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
  const userRole = computed(() => userInfo.value?.role || '')
  const roleName = computed(() => userInfo.value?.roleName || '')
  const realName = computed(() => userInfo.value?.realName || '')
  const tenantId = computed(() => tenant.value?.tenantId || null)
  const schoolId = computed(() => tenant.value?.schoolId || null)
  const schoolName = computed(() => tenant.value?.schoolName || '')

  // 登录
  function login(loginData) {
    token.value = loginData.token
    userInfo.value = loginData.userInfo
    tenant.value = {
      tenantId: loginData.tenantId,
      schoolId: loginData.schoolId,
      schoolName: loginData.schoolName,
    }
    setToken(loginData.token)
    setUserInfo(loginData.userInfo)
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
