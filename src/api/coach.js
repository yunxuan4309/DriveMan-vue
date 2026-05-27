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

// 查询所有绑定关系
export function getCoachAssignments() {
  return request.get('/coach-assignments')
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
