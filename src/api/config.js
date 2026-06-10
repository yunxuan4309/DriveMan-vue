import request from './request'

/**
 * 系统配置管理 API
 * 基础路径：/configs
 */

// 查询所有配置项
export function getAllConfigs() {
  return request.get('/configs')
}

// 按 Key 查询
export function getConfigByKey(configKey) {
  return request.get(`/configs/${configKey}`)
}

// 新增配置项
export function createConfig(data) {
  return request.post('/configs', data)
}

// 修改配置项
export function updateConfig(configKey, data) {
  return request.put(`/configs/${configKey}`, data)
}

// 删除配置项
export function deleteConfig(configKey) {
  return request.delete(`/configs/${configKey}`)
}
