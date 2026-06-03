import request from './request'

/**
 * 文件管理 API
 */

// 上传文件
export function uploadFile(userId, file, fileType) {
  const formData = new FormData()
  formData.append('userId', userId)
  formData.append('file', file)
  formData.append('fileType', fileType)
  return request.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// 查询文件记录
export function getFileDetail(id) {
  return request.get(`/files/${id}`)
}

// 查询某用户的所有文件
export function getUserFiles(userId) {
  return request.get(`/files/user/${userId}`)
}

// 下载文件（返回文件流）
export function downloadFile(id) {
  return request.get(`/files/${id}/download`, { responseType: 'blob' })
}

// 删除文件记录
export function deleteFile(id) {
  return request.delete(`/files/${id}`)
}
