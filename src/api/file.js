import request from './request'

/**
 * 文件管理 API
 */

// 上传文件（支持 bizType）
export function uploadFile(userId, file, fileType, bizType, bizId) {
  const formData = new FormData()
  formData.append('userId', userId)
  formData.append('file', file)
  formData.append('fileType', fileType)
  if (bizType) formData.append('bizType', bizType)
  if (bizId) formData.append('bizId', bizId)
  return request.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// 查询当前用户自己的文件（支持 bizType, fileType, keyword 筛选）
export function getMyFiles(params) {
  return request.get('/files/my', { params })
}

// 查询某用户的所有文件（管理员专用）
export function getUserFiles(userId) {
  return request.get(`/files/user/${userId}`)
}

// 按业务查询附件
export function getBizFiles(bizType, bizId) {
  return request.get(`/files/biz/${bizType}/${bizId}`)
}

// 查询文件详情
export function getFileDetail(id) {
  return request.get(`/files/${id}`)
}

// 下载/预览文件
export function downloadFile(id, preview = false) {
  return request.get(`/files/${id}/download?preview=${preview}`, { responseType: 'blob' })
}

// 删除文件（管理员专用）
export function deleteFile(id) {
  return request.delete(`/files/${id}`)
}

// 生成培训记录表 PDF
export function generateTrainingRecord(studentId) {
  return request.post(`/files/generate-training-record?studentId=${studentId}`)
}
