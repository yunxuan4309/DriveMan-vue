import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:9500',
  timeout: 15000,
})

// ── 请求拦截器：自动携带 token ──────────────────────────
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ── 响应拦截器：解包 { state, message, data } 信封 ────
request.interceptors.response.use(
  (response) => {
    const body = response.data

    // 后端统一返回 { state, message, data } 结构
    if (body && body.state !== undefined) {
      if (body.state === 20000) {
        // 成功 → 只返回 data 给调用方
        return body.data
      }

      // 业务错误（state !== 20000，但 HTTP 可能是 200）
      handleBusinessError(body.state, body.message)
      return Promise.reject(new Error(body.message || '请求失败'))
    }

    // 非标准格式，原样返回
    return body
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      const msg = data?.message || ''

      switch (status) {
        case 401:
          clearAuth()
          ElMessage.error(msg || '登录已过期，请重新登录')
          router.push('/login')
          break
        case 403:
          ElMessage.error(msg || '权限不足')
          break
        case 404:
          ElMessage.error(msg || '请求的资源不存在')
          break
        case 409:
          ElMessage.error(msg || '资源冲突，请检查时间段是否已被占用')
          break
        case 500:
          ElMessage.error(msg || '服务器错误')
          break
        default:
          ElMessage.error(msg || `请求失败 (${status})`)
      }
    } else if (error.message === 'Network Error') {
      ElMessage.error('网络异常，请检查连接')
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时')
    } else {
      ElMessage.error(error.message || '未知错误')
    }

    return Promise.reject(error)
  },
)

// ── 业务状态码处理 ──────────────────────────────────────
function handleBusinessError(state, message) {
  const msg = message || '请求失败'

  switch (state) {
    case 40100:
    case 40101:
      clearAuth()
      ElMessage.error(msg)
      router.push('/login')
      break
    case 40300:
      ElMessage.error(msg)
      break
    default:
      ElMessage.error(msg)
  }
}

function clearAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('userId')
  localStorage.removeItem('role')
  localStorage.removeItem('realName')
}

export default request
