import request from './request'

/**
 * 学员管理 API
 * 基础路径：/students
 */

// 分页查询学员
export function getStudentList(params) {
  return request.get('/students', { params })
}

// 查询学员详情
export function getStudentDetail(studentId) {
  return request.get(`/students/${studentId}`)
}

// 新增学员
export function createStudent(data) {
  return request.post('/students', data)
}

// 修改学员信息
export function updateStudent(studentId, data) {
  return request.put(`/students/${studentId}`, data)
}

// 删除学员（逻辑删除）
export function deleteStudent(studentId) {
  return request.delete(`/students/${studentId}`)
}

// 查询学员报名列表（支持状态筛选）
// 查询学员报名列表（支持状态筛选）
// status: 0-待审核，1-已报名，2-未通过，不传则返回所有
export function getRegistrationList(params) {
  return request.get('/registrations', { params })
}

// 审核学员报名
export function auditRegistration(userId, pass, reason) {
  return request.put(`/registrations/${userId}/audit?pass=${pass}${reason ? '&reason=' + encodeURIComponent(reason) : ''}`)
}

// 查询学员进度
export function getStudentProgress(studentId) {
  return request.get(`/students/${studentId}/progress`)
}
