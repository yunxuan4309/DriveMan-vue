import request from './request'

/**
 * 体检申请管理 API
 */

// 学员提交体检申请
export function applyPhysicalExam(data) {
  const params = new URLSearchParams()
  params.append('venueId', data.venueId)
  params.append('examDate', data.examDate)
  return request.post('/physical-exams/apply', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

// 学员查看自己的体检申请
export function getMyPhysicalExams() {
  return request.get('/physical-exams/my')
}

// 管理员分页查询所有体检申请（支持 studentName / status 筛选）
export function getAllPhysicalExams(params) {
  return request.get('/physical-exams', { params })
}

// 管理员审核体检申请
export function auditPhysicalExam(id, data) {
  const params = new URLSearchParams()
  params.append('status', data.status)
  if (data.remark) params.append('remark', data.remark)
  return request.put(`/physical-exams/${id}/audit`, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

// 获取可选体检地点列表（学员端下拉使用）
export function getPhysicalExamLocations() {
  return request.get('/physical-exams/locations')
}

// 管理员录入体检结果
export function setPhysicalExamResult(id, data) {
  const params = new URLSearchParams()
  params.append('fileId', data.fileId)
  params.append('result', data.result)
  return request.put(`/physical-exams/${id}/result`, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}
