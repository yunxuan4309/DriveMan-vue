import request from './request'

/**
 * 系统公告管理 API
 * 基础路径：/notices
 */

// 查询所有有效公告（所有角色可用）
export function getActiveNotices() {
  return request.get('/notices/active')
}

// 查询所有公告（管理员）
export function getAllNotices() {
  return request.get('/notices')
}

// 根据ID查询公告
export function getNoticeById(id) {
  return request.get(`/notices/${id}`)
}

// 发布公告
export function createNotice(data) {
  return request.post('/notices', data)
}

// 修改公告
export function updateNotice(id, data) {
  return request.put(`/notices/${id}`, data)
}

// 删除公告
export function deleteNotice(id) {
  return request.delete(`/notices/${id}`)
}
