import request from '@/request'

/**
 * 获取已激活的学校列表
 */
export function getSchoolsApi() {
  return request.get('/auth/schools')
}

/**
 * 验证身份（学号/工号 + 姓名）
 * @param {number} schoolId - 学校ID
 * @param {string} studentNo - 学号/工号
 * @param {string} realName - 真实姓名
 */
export function verifyIdentityApi(schoolId, studentNo, realName) {
  return request.post('/auth/verify-identity', { schoolId, studentNo, realName })
}

/**
 * 用户登录（账号唯一，自动识别所属学校）
 * @param {string} username - 用户名
 * @param {string} password - 密码
 */
export function loginApi(username, password) {
  return request.post('/auth/login', { username, password })
}

/**
 * 用户注册
 * @param {object} userData - 注册信息
 */
export function registerApi(userData) {
  return request.post('/auth/register', userData)
}

/**
 * 忘记密码
 * @param {string} username - 用户名
 * @param {string} newPassword - 新密码
 */
export function forgotPasswordApi(username, newPassword) {
  return request.post('/auth/forgot-password', { username, newPassword })
}
