import request from './request'

/**
 * 管理员管理 API
 */

// 查询待审核的准教车型变更申请
export function getPendingVehicleApplications() {
  return request.get('/coach-vehicle-applications/pending')
}

// 分页查询全部申请记录
export function getAllVehicleApplications(params) {
  return request.get('/coach-vehicle-applications', { params })
}

// 审核申请
export function auditVehicleApplication(id, pass, auditReason) {
  if (pass) {
    return request.put(`/coach-vehicle-applications/${id}/audit?pass=true`)
  } else {
    return request.put(`/coach-vehicle-applications/${id}/audit?pass=false&auditReason=${encodeURIComponent(auditReason)}`)
  }
}

// 按条件查询文件（管理员专用）
export function queryFiles(params) {
  return request.get('/files/admin/query', { params })
}

// 查询某用户的所有文件
export function getUserFiles(userId) {
  return request.get(`/files/user/${userId}`)
}
