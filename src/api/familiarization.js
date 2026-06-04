import request from './request'

/**
 * 合场管理 API
 */

// 用车类型
export const CarType = {
  COACH: 1,   // 教练车（需绑定教练陪同）
  EXAM: 2,    // 考试车（考场提供陪练）
}

// 合场状态
export const FamiliarizationStatus = {
  PENDING: 0,    // 待支付
  PAID: 1,       // 已支付（待安排）
  COMPLETED: 2,  // 已完成
  CANCELLED: 3,  // 已取消
}

// ═══════════════════════════════════════════════════════
// 学员端接口
// ═══════════════════════════════════════════════════════

// 申请合场
export function applyFamiliarization(examSessionId, carType) {
  const params = new URLSearchParams()
  params.append('examSessionId', examSessionId)
  params.append('carType', carType)
  return request.post('/familiarizations/apply', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

// 支付合场
export function payFamiliarization(id) {
  return request.put(`/familiarizations/${id}/pay`)
}

// 获取我的合场记录
export function getMyFamiliarizations() {
  return request.get('/familiarizations/my')
}

// ═══════════════════════════════════════════════════════
// 管理员端接口
// ═══════════════════════════════════════════════════════

// 合场记录列表
export function getFamiliarizations() {
  return request.get('/familiarizations')
}

// 安排合场时间
export function scheduleFamiliarization(id, scheduledTime) {
  return request.put(`/familiarizations/${id}/schedule?scheduledTime=${encodeURIComponent(scheduledTime)}`)
}

// 标记合场完成
export function completeFamiliarization(id) {
  return request.put(`/familiarizations/${id}/complete`)
}

// 取消合场
export function cancelFamiliarization(id) {
  return request.put(`/familiarizations/${id}/cancel`)
}
