import request from './request'

/**
 * 公告管理 API
 */

// 查询所有有效公告（所有角色可用，无需登录权限）
export function getActiveNotices() {
  return request.get('/notices/active')
}

// 分页查询所有公告（管理员）
export function getNoticeList(params) {
  return request.get('/notices', { params })
}

export function createNotice(data) {
  return request.post('/notices', data)
}

export function updateNotice(id, data) {
  return request.put(`/notices/${id}`, data)
}

export function deleteNotice(id) {
  return request.delete(`/notices/${id}`)
}
