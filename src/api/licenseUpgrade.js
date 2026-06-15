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
  const params = new URLSearchParams()
  params.append('status', data.status)
  if (data.remark) params.append('remark', data.remark)
  if (data.skipSubjects) params.append('skipSubjects', data.skipSubjects)
  return request.put(`/license-upgrades/${id}/audit`, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

// 查询增驾进度
export function getUpgradeProgress(id) {
  return request.get(`/license-upgrades/${id}/progress`)
}

// 完成增驾（检查缴费+科目通过后更新学员车型）
export function completeLicenseUpgrade(id) {
  return request.post(`/license-upgrades/${id}/complete`)
}
