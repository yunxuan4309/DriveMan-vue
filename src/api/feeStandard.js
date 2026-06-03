import request from './request'

/**
 * 费用标准管理 API
 * 基础路径：/fee-standards
 */

// 查询所有费用标准
export function getFeeStandardList() {
  return request.get('/fee-standards')
}

// 按车型查询费用标准
export function getFeeStandardByType(licenseType) {
  return request.get(`/fee-standards/type/${licenseType}`)
}

// 查询费用详情
export function getFeeStandardDetail(id) {
  return request.get(`/fee-standards/${id}`)
}

// 新增费用标准
export function createFeeStandard(data) {
  return request.post('/fee-standards', data)
}

// 修改费用标准
export function updateFeeStandard(id, data) {
  return request.put(`/fee-standards/${id}`, data)
}

// 删除费用标准
export function deleteFeeStandard(id) {
  return request.delete(`/fee-standards/${id}`)
}
