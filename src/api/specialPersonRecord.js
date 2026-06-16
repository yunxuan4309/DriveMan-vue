import request from './request'

/** 特殊人群记录 API */

// 学员提交记录
export function submitSpecialRecord(recordType, recordDate, banYears, courtDocNo, courtDocFileId) {
  const params = new URLSearchParams()
  params.append('recordType', recordType)
  params.append('recordDate', recordDate)
  if (banYears !== null && banYears !== undefined && banYears !== '') params.append('banYears', banYears)
  params.append('courtDocNo', courtDocNo)
  params.append('courtDocFileId', courtDocFileId)
  return request.post('/special-person-records/submit', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

// 学员查看自己的记录
export function getMySpecialRecords() {
  return request.get('/special-person-records/my')
}

// 学员查看禁驾状态
export function getMyBanStatus() {
  return request.get('/special-person-records/my/ban-status')
}

// 管理员分页查询
export function getSpecialRecordPage(params) {
  return request.get('/special-person-records/page', { params })
}

// 管理员审核
export function auditSpecialRecord(id, auditStatus, auditRemark) {
  const params = new URLSearchParams()
  params.append('auditStatus', auditStatus)
  if (auditRemark) params.append('auditRemark', auditRemark)
  return request.put(`/special-person-records/${id}/audit`, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}
