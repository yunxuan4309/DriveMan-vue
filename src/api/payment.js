import request from './request'

/**
 * 支付管理 API
 */

// 业务类型
export const BizType = {
  REGISTRATION_FEE: 'registration_fee',    // 报名费
  EXAM_FEE: 'exam_fee',                    // 考试费
  FAMILIARIZATION_FEE: 'familiarization_fee', // 合场费
  TRAINING_FEE: 'training_fee',            // 二次培训费
  OTHER: 'other',                          // 其他
}

// 支付状态
export const PaymentStatus = {
  PENDING: 0,    // 待支付
  PAID: 1,      // 已支付
  REFUNDED: 2,  // 已退款
}

// ═══════════════════════════════════════════════════════
// 学员端接口
// ═══════════════════════════════════════════════════════

// 查看我的账单
export function getMyPaymentRecords() {
  return request.get('/payment-records/my')
}

// 支付我的账单（模拟支付）
export function payMyPaymentRecord(id) {
  return request.put(`/payment-records/${id}/my-pay`)
}

// ═══════════════════════════════════════════════════════
// 管理员端接口
// ═══════════════════════════════════════════════════════

// 创建支付记录
export function createPaymentRecord(data) {
  return request.post('/payment-records', data)
}

// 支付记录列表（支持筛选）
export function getPaymentRecords(params) {
  return request.get('/payment-records', { params })
}

// 确认支付（管理员代操作）
export function confirmPayment(id) {
  return request.put(`/payment-records/${id}/pay`)
}

// 退款
export function refundPayment(id) {
  return request.put(`/payment-records/${id}/refund`)
}

// 欠费清单
export function getOutstandingPayments() {
  return request.get('/payment-records/outstanding')
}
