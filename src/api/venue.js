import request from './request'

/**
 * 场地管理 API（统一管理考场、训练场地、体检地点）
 * 基础路径：/venues
 */

// 查询场地列表（按 venueType 筛选，不传则查全部）
export function getVenueList(params) {
  return request.get('/venues', { params })
}

// 查询场地详情
export function getVenueDetail(id) {
  return request.get(`/venues/${id}`)
}

// 新增场地
export function createVenue(data) {
  return request.post('/venues', data)
}

// 修改场地信息
export function updateVenue(id, data) {
  return request.put(`/venues/${id}`, data)
}

// 删除场地（逻辑删除）
export function deleteVenue(id) {
  return request.delete(`/venues/${id}`)
}
