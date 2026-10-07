import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, clearAuth } from '@/utils/auth'
import router from '@/router'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
})

let redirectingToLogin = false
let redirectingToForbidden = false

service.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

service.interceptors.response.use(
  (response) => {
    if (response.config?.rawResponse) return response
    const body = response.data
    if (isBusinessError(body)) {
      const error = createApiError(body.message || '请求失败', {
        code: body.code,
        status: response.status,
        response,
      })
      handleBusinessError(error, response.config)
      return Promise.reject(error)
    }
    return body
  },
  (error) => {
    const status = error.response?.status
    const body = error.response?.data
    const apiError = createApiError(
      getErrorMessage(body, status, error),
      { code: body?.code, status, response: error.response, cause: error },
    )
    handleHttpError(apiError, error.config)
    return Promise.reject(apiError)
  },
)

function isBusinessError(body) {
  return Boolean(
    body
    && typeof body === 'object'
    && Object.prototype.hasOwnProperty.call(body, 'code')
    && body.code !== 200
    && body.code !== 0
    && body.code !== '200',
  )
}

function getErrorMessage(body, status, error) {
  if (body?.message) return body.message
  if (body?.msg) return body.msg
  if (status === 401) return '登录已失效，请重新登录'
  if (status === 403) return '没有执行该操作的权限'
  if (status === 422) return '请求参数校验失败'
  if (status >= 500) return '服务暂时不可用，请稍后重试'
  if (!error.response) return '网络连接失败，请检查网络后重试'
  return error.message || '请求失败'
}

function createApiError(message, details = {}) {
  const apiError = new Error(message)
  Object.assign(apiError, details)
  apiError.isApiError = true
  return apiError
}

function notify(message, config) {
  if (!config?.silent && message) ElMessage.error(message)
}

function handleBusinessError(error, config) {
  const code = Number(error.code)
  if (error.status === 401 || code === 401) {
    handleUnauthorized(error.message)
  } else if (error.status === 403 || code === 403) {
    handleForbidden(error.message, config)
  } else {
    notify(error.message, config)
  }
}

function handleHttpError(error, config) {
  if (error.status === 401) {
    handleUnauthorized(error.message)
  } else if (error.status === 403) {
    handleForbidden(error.message, config)
  } else {
    notify(error.message, config)
  }
}

function handleUnauthorized(message = '登录已失效，请重新登录') {
  clearAuth()
  window.dispatchEvent(new CustomEvent('campus:auth-expired'))
  if (!redirectingToLogin) {
    redirectingToLogin = true
    router.push({ name: 'Login', query: { reason: 'expired' } }).finally(() => {
      redirectingToLogin = false
    })
  }
  ElMessage.error(message)
}

function handleForbidden(message = '没有执行该操作的权限', config) {
  notify(message, config)
  if (router.currentRoute.value.name !== 'Forbidden' && !redirectingToForbidden) {
    redirectingToForbidden = true
    router.push({ name: 'Forbidden' }).finally(() => {
      redirectingToForbidden = false
    })
  }
}

export function unwrap(response) {
  return response && typeof response === 'object' && 'data' in response ? response.data : response
}

export function toPage(response, defaults = {}) {
  const data = unwrap(response) || {}
  const records = data.records || data.list || data.items || (Array.isArray(data) ? data : [])
  const list = Array.isArray(records) ? records : []
  return {
    records: list,
    list,
    total: Number(data.total ?? data.totalCount ?? list.length ?? defaults.total ?? 0),
    pageNum: Number(data.pageNum ?? data.page ?? defaults.pageNum ?? 1),
    pageSize: Number(data.pageSize ?? defaults.pageSize ?? (list.length || 10)),
  }
}

export function emptyPage(pageNum = 1, pageSize = 10) {
  return { records: [], list: [], total: 0, pageNum, pageSize }
}

export function isPermissionError(error) {
  return error?.status === 403 || Number(error?.code) === 403
}

export function isUnauthorizedError(error) {
  return error?.status === 401 || Number(error?.code) === 401
}

export function uploadFile(url, file, fields = {}, config = {}) {
  const formData = new FormData()
  formData.append('file', file)
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value)
  })
  return service.post(url, formData, {
    ...config,
    headers: { ...(config.headers || {}), 'Content-Type': 'multipart/form-data' },
  })
}

export async function downloadFile(url, params = {}, filename = '', config = {}) {
  const response = await service.get(url, {
    ...config,
    params,
    responseType: 'blob',
    rawResponse: true,
  })
  const blob = response.data instanceof Blob ? response.data : new Blob([response.data])
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename || getFilenameFromDisposition(response) || 'download'
  link.click()
  URL.revokeObjectURL(link.href)
  return response
}

function getFilenameFromDisposition(response) {
  const disposition = response?.headers?.['content-disposition'] || ''
  return disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i)?.[1]
}

export default service
