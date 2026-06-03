import request from './request'

/**
 * 约课管理 API
 */

// 查询约课记录（支持分页 + 可按学员/教练筛选）
export function getAppointmentList(params) {
  return request.get('/appointments', { params })
}

// 查询约课详情
export function getAppointmentDetail(id) {
  return request.get(`/appointments/${id}`)
}

// 新增约课
export function createAppointment(data) {
  return request.post('/appointments', data)
}

// 取消约课
export function cancelAppointment(id, reason) {
  const params = new URLSearchParams()
  if (reason) params.append('reason', reason)
  return request.put(`/appointments/${id}/cancel?${params.toString()}`)
}
