import request from './request'

/**
 * 增驾申请管理 API
 */

// 学员提交增驾申请
export function applyLicenseUpgrade(data) {
  return request.post('/license-upgrades/apply', data)
}

// 学员查看自己的增驾申请
export function getMyLicenseUpgrades() {
  return request.get('/license-upgrades/my')
}

// 管理员分页查询增驾申请
export function getAllLicenseUpgrades(params) {
  return request.get('/license-upgrades', { params })
}

// 管理员审核增驾申请
export function auditLicenseUpgrade(id, data) {
  return request.put(`/license-upgrades/${id}/audit`, data)
}

// 管理员录入增驾考试成绩
export function setLicenseUpgradeExamResult(id, data) {
  return request.put(`/license-upgrades/${id}/exam-result`, data)
}
