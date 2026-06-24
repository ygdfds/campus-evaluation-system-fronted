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
      // token 过期或无效
      if (res.code === 401) {
        clearAuth()
        router.push('/login')
      }
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    if (error.response?.status === 401) {
      clearAuth()
      router.push('/login')
      ElMessage.error('登录已过期，请重新登录')
    } else if (!error.config?.silent) {
      ElMessage.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default service
