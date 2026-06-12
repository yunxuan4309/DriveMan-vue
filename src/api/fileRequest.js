import request from './request'

/**
 * 文件提交请求 API
 */

// 管理员/教练创建文件请求
export function createFileRequest(data) {
  const params = new URLSearchParams()
  params.append('targetUserId', data.targetUserId)
  params.append('title', data.title)
  if (data.description) params.append('description', data.description)
  if (data.bizType) params.append('bizType', data.bizType)
  if (data.bizId != null) params.append('bizId', data.bizId)
  if (data.fileType) params.append('fileType', data.fileType)
  if (data.remark) params.append('remark', data.remark)
  if (data.deadline) params.append('deadline', data.deadline)
  return request.post('/file-requests', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

// 管理员分页查询所有请求
export function getAllFileRequests(params) {
  return request.get('/file-requests', { params })
}

// 取消请求
export function cancelFileRequest(id) {
  return request.put(`/file-requests/${id}/cancel`)
}

// 学员查看发给自己的请求
export function getMyFileRequests(params) {
  return request.get('/file-requests/my', { params })
}

// 学员获取未完成请求数
export function getPendingFileRequestCount() {
  return request.get('/file-requests/my-count')
}
