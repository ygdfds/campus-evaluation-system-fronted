import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, clearAuth } from '@/utils/auth'
import router from '@/router'

// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    // 打印请求信息
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`)
    if (config.params) {
      console.log(`  Params:`, config.params)
    }
    if (config.data) {
      console.log(`  Data:`, config.data)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const res = response.data
    // 打印响应信息
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`)
    console.log(`  Status: ${response.status}`)
    if (res.code && res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      if (res.code === 401) handleUnauthorized()
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    if (error.response?.status === 401) {
      handleUnauthorized(error.response?.data?.message)
    } else if (error.response?.status === 403) {
      ElMessage.error(error.response?.data?.message || '没有操作权限')
    } else if (error.response?.status === 409 || error.response?.status === 422) {
      ElMessage.error(error.response?.data?.message || '请求无法处理')
    } else if (!error.config?.silent) {
      ElMessage.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default service

let redirectingToLogin = false

function handleUnauthorized(message = '登录已过期，请重新登录') {
  clearAuth()
  if (!redirectingToLogin) {
    redirectingToLogin = true
    router.push('/login').finally(() => {
      redirectingToLogin = false
    })
  }
  ElMessage.error(message)
}

/**
 * 解包响应：兼容 mock server 包装格式 { code, data } 和裸对象
 * 用于 POST/PATCH/PUT/DELETE 等写操作
 */
export function unwrap(res) {
  if (res && typeof res === 'object' && 'code' in res && 'data' in res) return res.data
  return res
}
