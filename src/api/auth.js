import { mockLogin, mockRegister } from '@/mock/users'

/**
 * 用户登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 */
export function loginApi(username, password) {
  // TODO: 后端开发完成后替换为真实接口调用
  // return request.post('/auth/login', { username, password })
  return mockLogin(username, password)
}

/**
 * 用户注册
 * @param {object} userData - 注册信息
 */
export function registerApi(userData) {
  // TODO: 后端开发完成后替换为真实接口调用
  // return request.post('/auth/register', userData)
  return mockRegister(userData)
}
