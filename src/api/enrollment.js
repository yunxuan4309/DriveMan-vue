import request from './request'

/** 驾考报名 API */

// 查询可选套餐
export function getPackages() {
  return request.get('/enrollments/packages')
}

// 提交报名申请
export function applyEnrollment(studentId, licenseType, packageId) {
  const params = new URLSearchParams()
  params.append('studentId', studentId)
  params.append('licenseType', licenseType)
  params.append('packageId', packageId)
  return request.post('/enrollments/apply', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

// 支付报名套餐
export function payEnrollment(paymentId) {
  return request.put(`/enrollments/${paymentId}/pay`)
}
