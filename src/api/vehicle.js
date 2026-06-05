import request from './request'

/**
 * 车辆管理 API
 * 基础路径：/vehicles
 */

// 分页查询车辆列表
export function getVehicleList(params) {
  return request.get('/vehicles', { params })
}

// 查询可用车辆（仅供教练排班时选择）
export function getAvailableVehicles(params) {
  return request.get('/vehicles/available', { params })
}

// 新增车辆
export function createVehicle(data) {
  return request.post('/vehicles', data)
}

// 修改车辆
export function updateVehicle(id, data) {
  return request.put(`/vehicles/${id}`, data)
}

// 删除车辆（逻辑删除）
export function deleteVehicle(id) {
  return request.delete(`/vehicles/${id}`)
}
