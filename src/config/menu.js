/**
 * 侧边栏菜单配置
 *
 * 按角色分组，每项包含：
 *   title    - 分组名称
 *   icon     - Element Plus 图标名（字符串，用于动态渲染）
 *   children - 子菜单项 { title, icon, route }
 */

const admin = [
  {
    title: '学员管理',
    icon: 'UserFilled',
    children: [
      { title: '学员管理', icon: 'Avatar', route: '/admin/students' },
      { title: '报名审核', icon: 'EditPen', route: '/admin/registration-review' },
      { title: '教练分配', icon: 'Link', route: '/admin/coach-assignment' },
    ],
  },
  {
    title: '教练管理',
    icon: 'Avatar',
    children: [
      { title: '教练管理', icon: 'User', route: '/admin/coaches' },
      { title: '教练申请审核', icon: 'Files', route: '/admin/coach-application-review' },
      { title: '准教车型审核', icon: 'Check', route: '/admin/vehicle-application-review' },
      { title: '排班审核', icon: 'Calendar', route: '/admin/schedule-review' },
    ],
  },
  {
    title: '车辆场地',
    icon: 'Van',
    children: [
      { title: '车辆管理', icon: 'Truck', route: '/admin/vehicles' },
      { title: '场地管理', icon: 'OfficeBuilding', route: '/admin/venues' },
      { title: '合场管理', icon: 'Aim', route: '/admin/familiarization-manage' },
    ],
  },
  {
    title: '考试管理',
    icon: 'Trophy',
    children: [
      { title: '考试场次', icon: 'List', route: '/admin/exam-sessions' },
      { title: '考试审核', icon: 'Document', route: '/admin/exam-review' },
      { title: '特种车辆考试', icon: 'Promotion', route: '/admin/special-exams' },
    ],
  },
  {
    title: '财务管理',
    icon: 'Coin',
    children: [
      { title: '支付管理', icon: 'Money', route: '/admin/payment-manage' },
      { title: '费用标准管理', icon: 'PriceTag', route: '/admin/fee-standards' },
      { title: '统计报表', icon: 'DataAnalysis', route: '/admin/statistics' },
    ],
  },
  {
    title: '文档管理',
    icon: 'FolderOpened',
    children: [
      { title: '文件管理', icon: 'Folder', route: '/admin/files' },
      { title: '文件请求管理', icon: 'DocumentCopy', route: '/admin/file-requests' },
    ],
  },
  {
    title: '系统管理',
    icon: 'Setting',
    children: [
      { title: '系统配置', icon: 'Tools', route: '/admin/system-config' },
      { title: '公告管理', icon: 'Bell', route: '/admin/notices' },
      { title: '车型科目配置', icon: 'RefreshRight', route: '/admin/license-configs' },
      { title: '二次培训管理', icon: 'Refresh', route: '/admin/retake-training' },
      { title: '体检管理', icon: 'Notebook', route: '/admin/physical-exam-manage' },
      { title: '增驾申请管理', icon: 'Top', route: '/admin/license-upgrade-manage' },
      { title: '残疾信息管理', icon: 'WarningFilled', route: '/admin/disability-info-manage' },
      { title: '特殊人群记录管理', icon: 'Document', route: '/admin/special-record-manage' },
    ],
  },
]

const prospect = [
  {
    title: '报名',
    icon: 'Edit',
    children: [
      { title: '驾考报名', icon: 'Edit', route: '/student/enrollment' },
      { title: '残疾信息', icon: 'WarningFilled', route: '/student/disability-info' },
    ],
  },
]

const student = [
  {
    title: '业务办理',
    icon: 'Files',
    children: [
      { title: '驾考报名', icon: 'Edit', route: '/student/enrollment' },
      { title: '教练申请', icon: 'User', route: '/student/coach-apply' },
      { title: '增驾申请', icon: 'Top', route: '/student/license-upgrade' },
      { title: '体检申请', icon: 'Notebook', route: '/student/physical-exam' },
      { title: '合场申请', icon: 'Aim', route: '/student/familiarization' },
      { title: '残疾信息', icon: 'WarningFilled', route: '/student/disability-info' },
      { title: '特殊人群记录', icon: 'Document', route: '/student/special-record' },
    ],
  },
  {
    title: '学习考试',
    icon: 'Trophy',
    children: [
      { title: '约课管理', icon: 'Calendar', route: '/student/appointment' },
      { title: '考试报名', icon: 'EditPen', route: '/student/exam-registration' },
      { title: '我的成绩', icon: 'DataLine', route: '/student/scores' },
      { title: '学习进度', icon: 'DataAnalysis', route: '/student/progress' },
    ],
  },
  {
    title: '个人中心',
    icon: 'UserFilled',
    children: [
      { title: '文件管理', icon: 'FolderOpened', route: '/student/files' },
      { title: '我的账单', icon: 'Money', route: '/student/payments' },
      { title: '二次培训', icon: 'Refresh', route: '/student/retake-training' },
      { title: '我的文件请求', icon: 'DocumentCopy', route: '/student/file-requests' },
    ],
  },
]

const coach = [
  {
    title: '教学管理',
    icon: 'School',
    children: [
      { title: '我的课程', icon: 'Calendar', route: '/coach/courses' },
      { title: '学员管理', icon: 'Avatar', route: '/coach/students' },
      { title: '排班管理', icon: 'List', route: '/coach/schedule' },
      { title: '二次培训管理', icon: 'Refresh', route: '/coach/retake-training' },
    ],
  },
  {
    title: '考试管理',
    icon: 'Trophy',
    children: [
      { title: '学员考试状态', icon: 'Document', route: '/coach/exam' },
      { title: '考试场次', icon: 'EditPen', route: '/coach/exam-sessions' },
    ],
  },
  {
    title: '个人中心',
    icon: 'UserFilled',
    children: [
      { title: '准教车型申请', icon: 'Truck', route: '/coach/vehicle-application' },
      { title: '文件管理', icon: 'FolderOpened', route: '/coach/files' },
      { title: '我的文件请求', icon: 'DocumentCopy', route: '/coach/file-requests' },
    ],
  },
]

export const menuConfig = {
  0: prospect,
  1: student,
  2: coach,
  3: admin,
}

/**
 * 根据路由路径和角色查找面包屑路径
 * @param {string} path - 当前路由路径
 * @param {number} role - 用户角色
 * @returns {string[]} [分组名称, 页面名称]
 */
export function getBreadcrumb(path, role) {
  const groups = menuConfig[role] || []
  for (const group of groups) {
    for (const item of group.children) {
      if (item.route === path) {
        return [group.title, item.title]
      }
    }
  }
  return ['', '']
}
