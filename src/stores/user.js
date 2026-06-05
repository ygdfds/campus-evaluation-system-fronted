import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getToken,
  setToken,
  getUserInfo,
  setUserInfo,
  clearAuth,
} from '@/utils/auth'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref(getToken() || '')
  const userInfo = ref(getUserInfo() || null)

  // 计算属性
  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => userInfo.value?.role || '')
  const roleName = computed(() => userInfo.value?.roleName || '')
  const realName = computed(() => userInfo.value?.realName || '')

  // 登录
  function login(loginData) {
    token.value = loginData.token
    userInfo.value = loginData.userInfo
    setToken(loginData.token)
    setUserInfo(loginData.userInfo)
  }

  // 登出
  function logout() {
    token.value = ''
    userInfo.value = null
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
    isLoggedIn,
    userRole,
    roleName,
    realName,
    login,
    logout,
    updateUserInfo,
  }
})
