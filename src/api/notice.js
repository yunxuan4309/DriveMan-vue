import request from './request'

/**
 * 公告管理 API
 */

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
