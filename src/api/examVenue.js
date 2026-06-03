import request from './request'

/**
 * 考场信息管理 API
 * 基础路径：/exam-venues
 */

// 查询所有考场
export function getExamVenueList() {
  return request.get('/exam-venues')
}

// 查询考场详情
export function getExamVenueDetail(id) {
  return request.get(`/exam-venues/${id}`)
}

// 新增考场
export function createExamVenue(data) {
  return request.post('/exam-venues', data)
}

// 修改考场信息
export function updateExamVenue(id, data) {
  return request.put(`/exam-venues/${id}`, data)
}

// 删除考场
export function deleteExamVenue(id) {
  return request.delete(`/exam-venues/${id}`)
}
