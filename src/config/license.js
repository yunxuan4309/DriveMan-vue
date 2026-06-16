/**
 * 准驾车型配置
 *
 * LICENSE_TYPES   — 完整车型列表（含中文说明）
 * LICENSE_COVERS  — 车型包含关系（A1 可驾驶 B1/C1/…，用于增驾过滤）
 */

export const LICENSE_TYPES = [
  { value: 'C1', label: 'C1（手动挡小汽车）' },
  { value: 'C2', label: 'C2（自动挡小汽车）' },
  { value: 'C5', label: 'C5（残疾人专用小型自动挡）' },
  { value: 'C6', label: 'C6（轻型牵引挂车）' },
  { value: 'B1', label: 'B1（中型客车）' },
  { value: 'B2', label: 'B2（大型货车）' },
  { value: 'A1', label: 'A1（大型客车）' },
  { value: 'A2', label: 'A2（牵引车）' },
  { value: 'A3', label: 'A3（城市公交车）' },
  { value: 'D', label: 'D（普通三轮摩托车）' },
  { value: 'E', label: 'E（普通二轮摩托车）' },
  { value: 'F', label: 'F（轻便摩托车）' },
  { value: 'M', label: 'M（轮式专用机械车）' },
  { value: 'N', label: 'N（无轨电车）' },
  { value: 'P', label: 'P（有轨电车）' },
  { value: 'N1', label: 'N1（叉车）' },
  { value: 'N2', label: 'N2（挖掘机）' },
  { value: 'N3', label: 'N3（压路机）' },
]

/** 车型包含关系：key 持有者可直接驾驶 value 列表中的车型 */
export const LICENSE_COVERS = {
  A1: ['A3', 'B1', 'B2', 'C1', 'C2'],
  A2: ['B1', 'B2', 'C1', 'C2'],
  A3: ['C1', 'C2'],
  B1: ['C1', 'C2'],
  B2: ['C1', 'C2'],
  C1: ['C2'],
  D: ['E', 'F'],
  E: ['F'],
}

/** 根据当前驾照，返回应过滤掉的车型列表 */
export function getCoveredLicenses(currentLicense) {
  return LICENSE_COVERS[currentLicense] || []
}

/** 从 LICENSE_TYPES 中过滤掉已包含的车型，返回可增驾的选项 */
export function getUpgradableTypes(currentLicense) {
  const covered = getCoveredLicenses(currentLicense)
  return LICENSE_TYPES.filter(
    lt => lt.value !== currentLicense && !covered.includes(lt.value),
  )
}

/** 根据 vaLue 获取完整 label */
export function getLicenseLabel(value) {
  const found = LICENSE_TYPES.find(lt => lt.value === value)
  return found ? found.label : value
}
