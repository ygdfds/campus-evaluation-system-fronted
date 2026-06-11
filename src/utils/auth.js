/**
 * Token 与租户上下文工具类
 * 使用 sessionStorage 存储，关闭浏览器后自动销毁
 */

const TOKEN_KEY = 'campus_token'
const USER_INFO_KEY = 'campus_user_info'
const TENANT_KEY = 'campus_tenant'

/**
 * 获取 token
 */
export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

/**
 * 设置 token
 */
export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token)
}

/**
 * 移除 token
 */
export function removeToken() {
  sessionStorage.removeItem(TOKEN_KEY)
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
  const info = sessionStorage.getItem(USER_INFO_KEY)
  return info ? JSON.parse(info) : null
}

/**
 * 设置用户信息
 */
export function setUserInfo(userInfo) {
  sessionStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
}

/**
 * 移除用户信息
 */
export function removeUserInfo() {
  sessionStorage.removeItem(USER_INFO_KEY)
}

/**
 * 获取租户上下文
 */
export function getTenant() {
  const tenant = sessionStorage.getItem(TENANT_KEY)
  return tenant ? JSON.parse(tenant) : null
}

/**
 * 设置租户上下文
 * @param {object} tenant - { tenantId, schoolId, schoolName }
 */
export function setTenant(tenant) {
  sessionStorage.setItem(TENANT_KEY, JSON.stringify(tenant))
}

/**
 * 移除租户上下文
 */
export function removeTenant() {
  sessionStorage.removeItem(TENANT_KEY)
}

/**
 * 清除所有认证数据
 */
export function clearAuth() {
  removeToken()
  removeUserInfo()
  removeTenant()
}
