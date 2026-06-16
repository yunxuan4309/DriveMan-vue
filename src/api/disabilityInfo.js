import request from './request'

/** 残疾信息管理 API */

// 学员提交残疾信息
export function submitDisabilityInfo(disabilityType, certificateNo, certificateFileId) {
  const params = new URLSearchParams()
  params.append('disabilityType', disabilityType)
  params.append('certificateNo', certificateNo)
  params.append('certificateFileId', certificateFileId)
  return request.post('/disability-info/submit', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

// 学员查看自己的残疾信息
export function getMyDisabilityInfo() {
  return request.get('/disability-info/my')
}

// 管理员分页查询
export function getDisabilityInfoPage(params) {
  return request.get('/disability-info/page', { params })
}

// 管理员根据用户ID查询残疾信息
export function getDisabilityInfoByUserId(userId) {
  return request.get(`/disability-info/user/${userId}`)
}

// 管理员审核
export function auditDisabilityInfo(id, auditStatus, auditRemark) {
  const params = new URLSearchParams()
  params.append('auditStatus', auditStatus)
  if (auditRemark) params.append('auditRemark', auditRemark)
  return request.put(`/disability-info/${id}/audit`, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}
