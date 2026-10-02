import request from '@/request'

export function loginApi(username, password, rememberMe = false) {
  return request.post('/auth/login', { username, password, rememberMe })
}

export function logoutApi() {
  return request.post('/auth/logout')
}

export function getCurrentUserApi(config = {}) {
  return request.get('/auth/me', config)
}

export function getPermissionsApi(config = {}) {
  return request.get('/auth/permissions', config)
}

export function getAuthRoutesApi(config = {}) {
  return request.get('/auth/routes', config)
}

export function getCaptchaApi(config = {}) {
  return request.get('/auth/captcha', config)
}

export function changePasswordApi(payload) {
  return request.post('/auth/change-password', payload)
}

export function getSchoolsApi() {
  return request.get('/auth/schools')
}

export function registerApi() {
  return Promise.reject(new Error('Self-service registration is disabled in phase A. Use school onboarding.'))
}

export function verifyIdentityApi() {
  return Promise.reject(new Error('Identity verification is only enabled for onboarding or account activation.'))
}

export function forgotPasswordApi() {
  return Promise.reject(new Error('Password recovery is disabled. Contact the school administrator to reset password.'))
}
