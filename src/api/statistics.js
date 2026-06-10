import request from './request'

/**
 * 统计报表 API
 *
 * 所有统计报表接口仅管理员可调用
 */

// 报名趋势（折线图）- 支持 startDate / endDate 筛选
export function getRegistrationTrend(params) {
  return request.get('/statistics/registration-trend', { params })
}

// 各科目月度通过率趋势（折线图）- 支持 year / subject 筛选
export function getPassRate(params) {
  return request.get('/statistics/pass-rate', { params })
}

// 教练效能排名（柱状图）- 支持 licenseType / topN 筛选
export function getCoachWorkload(params) {
  return request.get('/statistics/coach-workload', { params })
}

// 收入看板（月度趋势 + 来源分布 + 收支汇总）- 支持 year 筛选
export function getRevenueSummary(params) {
  return request.get('/statistics/revenue-summary', { params })
}

// ── Excel 导出 ──────────────────────────────────────────

// 报名趋势导出（支持与查询相同的筛选参数）
export function exportRegistrationTrend(params) {
  return request.post('/statistics/registration-trend/export-excel', params, {
    responseType: 'blob',
  })
}

// 各科通过率导出（支持与查询相同的筛选参数）
export function exportPassRate(params) {
  return request.post('/statistics/pass-rate/export-excel', params, {
    responseType: 'blob',
  })
}

// 教练效能排名导出（支持与查询相同的筛选参数）
export function exportCoachWorkload(params) {
  return request.post('/statistics/coach-workload/export-excel', params, {
    responseType: 'blob',
  })
}

// 收入看板导出（支持与查询相同的筛选参数）
export function exportRevenueSummary(params) {
  return request.post('/statistics/revenue-summary/export-excel', params, {
    responseType: 'blob',
  })
}
