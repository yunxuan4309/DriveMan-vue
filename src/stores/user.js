import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '@/api/request'

export const useUserStore = defineStore('user', () => {
  // ── 状态 ──────────────────────────────────────────────
  const token = ref(localStorage.getItem('token') || '')
  const userId = ref(Number(localStorage.getItem('userId') || 0))
  const role = ref(Number(localStorage.getItem('role') || 0))   // 1=学员 2=教练 3=管理员
  const userInfo = ref({
    username: localStorage.getItem('username') || '',
    realName: localStorage.getItem('realName') || '',
  })

  // ── 计算属性 ──────────────────────────────────────────
  const isLoggedIn = computed(() => !!token.value)

  const roleLabel = computed(() => {
    const map = { 1: '学员', 2: '教练', 3: '管理员' }
    return map[role.value] || ''
  })

  // ── 登录 ──────────────────────────────────────────────
  async function login({ username, password }) {
    // 后端要求 Content-Type: application/x-www-form-urlencoded
    const params = new URLSearchParams()
    params.append('username', username)
    params.append('password', password)

    const data = await request.post('/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    // data 已是解包后的 body.data（由响应拦截器处理）
    token.value = data.token
    userId.value = data.userId
    role.value = data.role
    userInfo.value = {
      username: data.username,
      realName: data.realName,
    }

    // 同步到 localStorage
    localStorage.setItem('token', data.token)
    localStorage.setItem('userId', data.userId)
    localStorage.setItem('role', data.role)
    localStorage.setItem('username', data.username)
    localStorage.setItem('realName', data.realName)

    return data
  }

  // ── 退出 ──────────────────────────────────────────────
  function logout() {
    token.value = ''
    userId.value = 0
    role.value = 0
    userInfo.value = { username: '', realName: '' }

    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('role')
    localStorage.removeItem('username')
    localStorage.removeItem('realName')
  }

  // ── 从缓存恢复会话 ─────────────────────────────────────
  function restoreSession() {
    const saved = localStorage.getItem('token')
    if (!saved) return false

    // 检查 JWT 是否过期
    if (isTokenExpired(saved)) {
      logout()
      return false
    }

    token.value = saved
    userId.value = Number(localStorage.getItem('userId') || 0)
    role.value = Number(localStorage.getItem('role') || 0)
    userInfo.value = {
      username: localStorage.getItem('username') || '',
      realName: localStorage.getItem('realName') || '',
    }
    return true
  }

  return { token, userId, role, userInfo, isLoggedIn, roleLabel, login, logout, restoreSession }
})

// ── 工具：解析 JWT 的 exp 判断是否过期 ──────────────────
export function isTokenExpired(jwt) {
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1]))
    // exp 是 Unix 秒级时间戳
    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}
