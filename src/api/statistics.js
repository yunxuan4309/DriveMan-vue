import request from './request'

/**
 * 统计报表 API
 *
 * 所有统计报表接口仅管理员可调用
 */

// 报名趋势（折线图）- 近30天每日报名人数
export function getRegistrationTrend() {
  return request.get('/statistics/registration-trend')
}

// 各科目月度通过率趋势（折线图）
export function getPassRate() {
  return request.get('/statistics/pass-rate')
}

// 教练效能排名（柱状图）
export function getCoachWorkload() {
  return request.get('/statistics/coach-workload')
}

// 收入看板（月度趋势 + 来源分布 + 收支汇总）
export function getRevenueSummary() {
  return request.get('/statistics/revenue-summary')
}
