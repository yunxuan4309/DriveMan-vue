import request from './request'

/**
 * 车型科目配置管理 API
 * 基础路径：/license-configs
 */

// 查询所有车型配置
export function getLicenseConfigList() {
  return request.get('/license-configs')
}

// 按车型查询配置
export function getLicenseConfigByType(licenseType) {
  return request.get(`/license-configs/type/${licenseType}`)
}

// 查询配置详情
export function getLicenseConfigDetail(id) {
  return request.get(`/license-configs/${id}`)
}

// 新增车型配置
export function createLicenseConfig(data) {
  return request.post('/license-configs', data)
}

// 修改车型配置
export function updateLicenseConfig(id, data) {
  return request.put(`/license-configs/${id}`, data)
}

// 删除车型配置
export function deleteLicenseConfig(id) {
  return request.delete(`/license-configs/${id}`)
}
