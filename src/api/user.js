import request from './request'

/**
 * 用户管理 API
 */

// 分页查询用户
export function getUserList(params) {
  return request.get('/users', { params })
}

// 查询用户详情
export function getUserDetail(userId) {
  return request.get(`/users/${userId}`)
}

// 获取当前登录用户信息
export function getCurrentUser() {
  return request.get('/users/me')
}

// 新增用户
export function createUser(data) {
  return request.post('/users', data)
}

// 修改用户
export function updateUser(userId, data) {
  return request.put(`/users/${userId}`, data)
}

// 删除用户
export function deleteUser(userId) {
  return request.delete(`/users/${userId}`)
}

// 修改密码
export function changePassword(userId, oldPassword, newPassword) {
  const params = new URLSearchParams()
  params.append('oldPassword', oldPassword)
  params.append('newPassword', newPassword)
  return request.put(`/users/${userId}/password`, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

// 查询待审核学员
export function getPendingRegistrations() {
  return request.get('/registrations/pending')
}

// 审核学员报名
export function auditRegistration(userId, pass, reason) {
  const params = new URLSearchParams()
  params.append('pass', pass)
  if (reason) {
    params.append('reason', reason)
  }
  return request.put(`/registrations/${userId}/audit?pass=${pass}${reason ? '&reason=' + encodeURIComponent(reason) : ''}`)
}

// 教练自助注册
export function coachRegister(data) {
  return request.post('/coach/register', data)
}

// 关键词搜索用户（用于下拉选择器远程搜索，可选按角色过滤）
export function searchUsers(keyword, role) {
  const params = { keyword }
  if (role != null) params.role = role
  return request.get('/users/search', { params })
}
