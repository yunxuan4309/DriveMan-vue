/**
 * 工具函数集合
 */

/**
 * 格式化日期
 * @param {Date|string|number} date - 日期
 * @param {string} fmt - 格式模板，如 'YYYY-MM-DD HH:mm:ss'
 * @returns {string}
 */
export function formatDate(date, fmt = 'YYYY-MM-DD HH:mm:ss') {
  const d = new Date(date)
  const o = {
    'Y+': d.getFullYear(),
    'M+': d.getMonth() + 1,
    'D+': d.getDate(),
    'H+': d.getHours(),
    'm+': d.getMinutes(),
    's+': d.getSeconds(),
  }
  let result = fmt
  for (const [k, v] of Object.entries(o)) {
    result = result.replace(new RegExp(`(${k})`), String(v).padStart(2, '0'))
  }
  return result
}
