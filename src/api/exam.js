import request from './request'

/**
 * 考试管理 API
 */

// ── 考试场次 ────────────────────────────────────────────

// 查询所有考试场次
export function getExamSessionList(params) {
  return request.get('/exam-sessions', { params })
}

// 查询场次详情
export function getExamSessionDetail(id) {
  return request.get(`/exam-sessions/${id}`)
}

// 发布考试场次
export function createExamSession(data) {
  return request.post('/exam-sessions', data)
}

// 修改考试场次
export function updateExamSession(id, data) {
  return request.put(`/exam-sessions/${id}`, data)
}

// 删除考试场次
export function deleteExamSession(id) {
  return request.delete(`/exam-sessions/${id}`)
}

// ── 考试报名 ────────────────────────────────────────────

// 学员报名考试
export function createExamRegistration(studentId, sessionId) {
  const params = new URLSearchParams()
  params.append('studentId', studentId)
  params.append('sessionId', sessionId)
  return request.post('/exam-registrations', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

// 审核考试报名
export function auditExamRegistration(id, pass) {
  return request.put(`/exam-registrations/${id}/audit?pass=${pass}`)
}

// 录入考试成绩
export function scoreExamRegistration(id, score) {
  return request.put(`/exam-registrations/${id}/score?score=${score}`)
}

// 查询所有考试报名记录
export function getExamRegistrationList(params) {
  return request.get('/exam-registrations', { params })
}

// 查询某学员的考试报名记录（分页）
export function getStudentExamRegistrations(studentId, params) {
  return request.get(`/exam-registrations/student/${studentId}`, { params })
}

// 查询我的各科成绩（学员端）
export function getMyScores(studentId) {
  return request.get(`/exam-registrations/my-scores/${studentId}`)
}

// ── 教练端 ────────────────────────────────────────────

// 教练查看名下学员的考试报名
export function getCoachExamRegistrations() {
  return request.get('/coach-portal/exam-registrations')
}
