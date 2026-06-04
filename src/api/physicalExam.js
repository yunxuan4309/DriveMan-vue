import request from './request'

/**
 * 体检申请管理 API
 */

// 学员提交体检申请
export function applyPhysicalExam(data) {
  return request.post('/physical-exams/apply', data)
}

// 学员查看自己的体检申请
export function getMyPhysicalExams() {
  return request.get('/physical-exams/my')
}

// 管理员查询所有体检申请
export function getAllPhysicalExams() {
  return request.get('/physical-exams')
}

// 管理员审核体检申请
export function auditPhysicalExam(id, data) {
  return request.put(`/physical-exams/${id}/audit`, data)
}

// 获取可选体检地点列表（学员端下拉使用）
export function getPhysicalExamLocations() {
  return request.get('/physical-exams/locations')
}

// 管理员录入体检结果
export function setPhysicalExamResult(id, data) {
  return request.put(`/physical-exams/${id}/result`, data)
}
