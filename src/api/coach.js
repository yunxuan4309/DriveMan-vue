import request from './request'

/**
 * 教练管理 API
 */

// 分页查询教练
export function getCoachList(params) {
  return request.get('/coaches', { params })
}

// 查询教练详情
export function getCoachDetail(coachId) {
  return request.get(`/coaches/${coachId}`)
}

// 新增教练
export function createCoach(data) {
  return request.post('/coaches', data)
}

// 修改教练
export function updateCoach(coachId, data) {
  return request.put(`/coaches/${coachId}`, data)
}

// 删除教练
export function deleteCoach(coachId) {
  return request.delete(`/coaches/${coachId}`)
}

// 查询待审核的教练申请
export function getPendingApplications() {
  return request.get('/coach-applications/pending')
}

// 分页查询教练申请（支持 status / keyword 筛选）
export function getCoachApplications(params) {
  return request.get('/coach-applications', { params })
}

// 查询学员的申请记录
export function getStudentApplications(studentId) {
  return request.get(`/coach-applications/student/${studentId}`)
}

// 审核教练申请
export function auditApplication(id, pass, reason) {
  return request.put(`/coach-applications/${id}/audit?pass=${pass}${reason ? '&reason=' + encodeURIComponent(reason) : ''}`)
}

// 自动推荐教练
export function recommendCoaches(studentId, topN = 5) {
  return request.get('/coach-assignments/recommend', { params: { studentId, topN } })
}

// 手动分配教练
export function assignCoach(studentId, coachId) {
  const params = new URLSearchParams()
  params.append('studentId', studentId)
  params.append('coachId', coachId)
  return request.post('/coach-assignments', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

// 分页查询绑定关系（支持 studentName / coachName 搜索）
export function getCoachAssignments(params) {
  return request.get('/coach-assignments', { params })
}

// 解绑教练
export function unbindCoach(id) {
  return request.put(`/coach-assignments/${id}/unbind`)
}

// 学员申请教练
export function applyCoach(studentId, coachId) {
  const params = new URLSearchParams()
  params.append('studentId', studentId)
  params.append('coachId', coachId)
  return request.post('/coach-applications', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

// 获取教练信息（含当前准教车型）
export function getCoachRating() {
  return request.get('/coach-portal/rating')
}

// 提交准教车型变更申请
export function submitVehicleApplication(requestedVehicleType, applyReason) {
  const params = new URLSearchParams()
  params.append('requestedVehicleType', requestedVehicleType)
  if (applyReason) params.append('applyReason', applyReason)
  return request.post('/coach-portal/vehicle-applications', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

// 获取本人的申请记录
export function getCoachVehicleApplications() {
  return request.get('/coach-portal/vehicle-applications')
}

// ═══════════════════════════════════════════════════════
// 教练分配管理 API
// ═══════════════════════════════════════════════════════

// 按教练查询名下学员
export function getCoachStudents(coachId) {
  return request.get(`/coach-assignments/coach/${coachId}/students`)
}

// 查询我的教练
export function getMyCoach(studentId) {
  return request.get(`/coach-assignments/my-coach/${studentId}`)
}

// 教练查看自己的学员列表（教练端专用）
export function getMyStudents() {
  return request.get('/coach-portal/students')
}

// ═══════════════════════════════════════════════════════
// 教练移交学员 API
// ═══════════════════════════════════════════════════════

// 教练申请移交学员
export function applyStudentTransfer(studentId, targetCoachId, reason) {
  const params = new URLSearchParams()
  params.append('studentId', studentId)
  params.append('targetCoachId', targetCoachId)
  params.append('reason', reason)
  return request.post('/coach-portal/student-transfers', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

// 查看教练本人的移交申请记录
export function getCoachTransferRecords() {
  return request.get('/coach-portal/student-transfers')
}
