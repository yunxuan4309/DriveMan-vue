import request from './request'

/**
 * 特种车辆考试管理 API
 * 基础路径：/special-exams
 */

// 查询所有考试记录
export function getSpecialExamList(params) {
  return request.get('/special-exams', { params })
}

// 查询某学员的考试记录
export function getStudentSpecialExams(studentId, params) {
  return request.get(`/special-exams/student/${studentId}`, { params })
}

// 录入考试成绩
export function createSpecialExam(data) {
  return request.post('/special-exams', data)
}

// 更新考试成绩
export function updateSpecialExam(id, data) {
  return request.put(`/special-exams/${id}`, data)
}
