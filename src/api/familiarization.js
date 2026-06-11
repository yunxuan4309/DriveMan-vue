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

// 申请合场（参数为 Query）
export function applyFamiliarization(examSessionId, carType) {
  return request.post('/familiarizations/apply', null, {
    params: { examSessionId, carType },
  })
}

// 支付合场
export function payFamiliarization(id) {
  return request.put(`/familiarizations/${id}/pay`)
}

// 获取我的合场记录（分页）
export function getMyFamiliarizations(params) {
  return request.get('/familiarizations/my', { params })
}

// ═══════════════════════════════════════════════════════
// 管理员端接口
// ═══════════════════════════════════════════════════════

// 合场记录列表（分页，支持 status 筛选）
export function getFamiliarizations(params) {
  return request.get('/familiarizations', { params })
}

// 安排合场时间
export function scheduleFamiliarization(id, scheduledTime) {
  return request.put(`/familiarizations/${id}/schedule`, null, {
    params: { scheduledTime },
  })
}

// 标记合场完成
export function completeFamiliarization(id) {
  return request.put(`/familiarizations/${id}/complete`)
}

// 取消合场
export function cancelFamiliarization(id) {
  return request.put(`/familiarizations/${id}/cancel`)
}
