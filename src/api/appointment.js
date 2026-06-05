import request from './request'

/**
 * 约课管理 API
 */

// ═══════════════════════════════════════════════════════
// 通用
// ═══════════════════════════════════════════════════════

// 查询约课详情
export function getAppointmentDetail(id) {
  return request.get(`/appointments/${id}`)
}

// ═══════════════════════════════════════════════════════
// 学员端
// ═══════════════════════════════════════════════════════

// 查看可约时段（按教练排班）
export function getAvailableSchedules(params) {
  return request.get('/schedules/available', { params })
}

// 提交约课（关联 scheduleId）
export function createAppointment(data) {
  return request.post('/appointments', data)
}

// 查看我的约课（分页）
export function getMyAppointments(params) {
  return request.get('/appointments/my', { params })
}

// 取消约课（自动释放排班名额）
export function cancelAppointment(id, reason) {
  const query = reason ? `?reason=${encodeURIComponent(reason)}` : ''
  return request.put(`/appointments/${id}/cancel${query}`)
}

// ═══════════════════════════════════════════════════════
// 教练端
// ═══════════════════════════════════════════════════════

// 确认约课
export function confirmAppointment(id) {
  return request.put(`/coach-portal/appointments/${id}/confirm`)
}

// 拒绝约课
export function rejectAppointment(id, reason) {
  const params = new URLSearchParams()
  params.append('reason', reason)
  return request.put(`/coach-portal/appointments/${id}/reject`, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

// 完成约课（status→4）
export function completeAppointment(id) {
  return request.put(`/coach-portal/appointments/${id}/complete`)
}

// 查看待确认约课
export function getPendingAppointments() {
  return request.get('/coach-portal/appointments/pending')
}

// 查看教练的全部约课（分页）
export function getCoachAppointments(params) {
  return request.get('/coach-portal/appointments', { params })
}

// 查看约课日历
export function getAppointmentCalendar(params) {
  return request.get('/coach-portal/appointments/calendar', { params })
}

// ═══════════════════════════════════════════════════════
// 管理员端
// ═══════════════════════════════════════════════════════

// 查询所有约课（需管理员权限）
export function getAllAppointments(params) {
  return request.get('/appointments', { params })
}

// 管理员取消任意约课
export function adminCancelAppointment(id, reason) {
  const query = reason ? `?reason=${encodeURIComponent(reason)}` : ''
  return request.put(`/appointments/${id}/admin-cancel${query}`)
}
