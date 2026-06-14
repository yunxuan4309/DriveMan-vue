import request from './request'

/**
 * 排班管理 API
 */

// ── 教练端 ────────────────────────────────────────────

// 提交排班申请
export function createSchedule(data) {
  return request.post('/coach-portal/schedules', data)
}

// 查看我的排班
export function getMySchedules(params) {
  return request.get('/coach-portal/schedules', { params })
}

// 查看我待审核的排班
export function getMyPendingSchedules() {
  return request.get('/coach-portal/schedules/pending')
}

// 取消排班（教练端），reason 为取消原因
export function cancelSchedule(id, reason) {
  return request.put(`/coach-portal/schedules/${id}/cancel`, null, { params: { reason } })
}

// ── 管理员端 ──────────────────────────────────────────

// 查询所有排班（多维度筛选）
export function getAllSchedules(params) {
  return request.get('/schedules', { params })
}

// 查看待审核排班
export function getPendingSchedules() {
  return request.get('/schedules/pending')
}

// 审核排班
export function auditSchedule(id, params) {
  return request.put(`/schedules/${id}/audit`, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

// 审核取消申请（管理员端），approved=true 通过/false 拒绝
export function cancelAuditSchedule(id, approved, remark) {
  const params = new URLSearchParams()
  params.append('approved', approved)
  if (remark) params.append('remark', remark)
  return request.put(`/schedules/${id}/cancel-audit`, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

// 查询排班详情
export function getScheduleDetail(id) {
  return request.get(`/schedules/${id}`)
}
