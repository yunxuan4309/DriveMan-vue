import request from './request'

/**
 * 二次培训（补考培训）管理 API
 */

// 学员申请二次培训
export function applyRetakeTraining(data) {
  return request.post('/retake-trainings', data)
}

// 管理员审核二次培训申请
export function auditRetakeTraining(id, data) {
  return request.put(`/retake-trainings/${id}/audit`, data)
}

// 教练标记培训完成
export function completeRetakeTraining(id) {
  return request.put(`/retake-trainings/${id}/complete`)
}

// 取消二次培训申请
export function cancelRetakeTraining(id) {
  return request.put(`/retake-trainings/${id}/cancel`)
}

// 学员分页查询自己的二次培训记录
export function getStudentRetakeTrainings(studentId, params) {
  return request.get(`/retake-trainings/student/${studentId}`, { params })
}

// 教练查看名下学员二次培训记录
export function getCoachRetakeTrainings() {
  return request.get('/coach-portal/retake-trainings')
}

// 管理员分页查询所有二次培训记录
export function getAdminRetakeTrainings(params) {
  return request.get('/retake-trainings', { params })
}
