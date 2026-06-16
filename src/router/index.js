import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/About.vue'),
    meta: { title: '关于' },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { title: '个人信息' },
  },
  // ── 学员功能路由 ─────────────────────────────────────
  {
    path: '/student',
    name: 'Student',
    redirect: '/student/appointment',
    meta: { title: '学员功能', roles: [1] },
    children: [
      {
        path: 'appointment',
        name: 'StudentAppointment',
        component: () => import('@/views/student/Appointment.vue'),
        meta: { title: '约课管理', roles: [1] },
      },
      {
        path: 'exam-registration',
        name: 'StudentExamRegistration',
        component: () => import('@/views/student/ExamRegistration.vue'),
        meta: { title: '考试报名', roles: [1] },
      },
      {
        path: 'coach-apply',
        name: 'StudentCoachApply',
        component: () => import('@/views/student/CoachApply.vue'),
        meta: { title: '教练申请', roles: [1] },
      },
      {
        path: 'files',
        name: 'StudentMyFiles',
        component: () => import('@/views/student/MyFiles.vue'),
        meta: { title: '文件管理', roles: [1] },
      },
      {
        path: 'scores',
        name: 'StudentMyScores',
        component: () => import('@/views/student/MyScores.vue'),
        meta: { title: '我的成绩', roles: [1] },
      },
      {
        path: 'progress',
        name: 'StudentProgress',
        component: () => import('@/views/student/StudentProgress.vue'),
        meta: { title: '学习进度', roles: [1] },
      },
      {
        path: 'familiarization',
        name: 'StudentFamiliarization',
        component: () => import('@/views/student/Familiarization.vue'),
        meta: { title: '合场申请', roles: [1] },
      },
      {
        path: 'payments',
        name: 'StudentMyPayments',
        component: () => import('@/views/student/MyPayments.vue'),
        meta: { title: '我的账单', roles: [1] },
      },
      {
        path: 'retake-training',
        name: 'StudentRetakeTraining',
        component: () => import('@/views/student/RetakeTraining.vue'),
        meta: { title: '二次培训', roles: [1] },
      },
      {
        path: 'physical-exam',
        name: 'StudentPhysicalExam',
        component: () => import('@/views/student/PhysicalExam.vue'),
        meta: { title: '体检申请', roles: [1] },
      },
      {
        path: 'license-upgrade',
        name: 'StudentLicenseUpgrade',
        component: () => import('@/views/student/LicenseUpgrade.vue'),
        meta: { title: '增驾申请', roles: [1] },
      },
      {
        path: 'enrollment',
        name: 'StudentEnrollment',
        component: () => import('@/views/student/EnrollmentApply.vue'),
        meta: { title: '驾考报名', roles: [0, 1] },
      },
      {
        path: 'file-requests',
        name: 'StudentFileRequests',
        component: () => import('@/views/student/MyFileRequests.vue'),
        meta: { title: '我的文件请求', roles: [1] },
      },
      {
        path: 'disability-info',
        name: 'StudentDisabilityInfo',
        component: () => import('@/views/student/DisabilityInfo.vue'),
        meta: { title: '残疾信息', roles: [0, 1] },
      },
      {
        path: 'special-record',
        name: 'StudentSpecialRecord',
        component: () => import('@/views/student/SpecialPersonRecord.vue'),
        meta: { title: '特殊人群记录', roles: [1] },
      },
    ],
  },
  // ── 教练功能路由 ─────────────────────────────────────
  {
    path: '/coach',
    name: 'Coach',
    redirect: '/coach/courses',
    meta: { title: '教练功能', roles: [2] },
    children: [
      {
        path: 'courses',
        name: 'CoachMyCourses',
        component: () => import('@/views/coach/MyCourses.vue'),
        meta: { title: '我的课程', roles: [2] },
      },
      {
        path: 'students',
        name: 'CoachStudentsManage',
        component: () => import('@/views/coach/StudentsManage.vue'),
        meta: { title: '学员管理', roles: [2] },
      },
      {
        path: 'exam',
        name: 'CoachExamManage',
        component: () => import('@/views/coach/ExamManage.vue'),
        meta: { title: '学员考试状态', roles: [2] },
      },
      {
        path: 'exam-sessions',
        name: 'CoachExamSessions',
        component: () => import('@/views/coach/ExamSessions.vue'),
        meta: { title: '考试场次', roles: [2] },
      },
      {
        path: 'vehicle-application',
        name: 'CoachVehicleApplication',
        component: () => import('@/views/coach/VehicleApplication.vue'),
        meta: { title: '准教车型申请', roles: [2] },
      },
      {
        path: 'files',
        name: 'CoachMyFiles',
        component: () => import('@/views/coach/MyFiles.vue'),
        meta: { title: '文件管理', roles: [2] },
      },
      {
        path: 'schedule',
        name: 'CoachScheduleManage',
        component: () => import('@/views/coach/ScheduleManage.vue'),
        meta: { title: '排班管理', roles: [2] },
      },
      {
        path: 'retake-training',
        name: 'CoachRetakeTraining',
        component: () => import('@/views/coach/RetakeTrainingManage.vue'),
        meta: { title: '二次培训管理', roles: [2] },
      },
      {
        path: 'file-requests',
        name: 'CoachFileRequests',
        component: () => import('@/views/student/MyFileRequests.vue'),
        meta: { title: '我的文件请求', roles: [2] },
      },
    ],
  },
  // ── 管理后台路由（仅管理员可访问）─────────────────────
  {
    path: '/admin',
    name: 'Admin',
    redirect: '/admin/students',
    meta: { title: '管理后台', roles: [3] },
    children: [
      {
        path: 'students',
        name: 'StudentManage',
        component: () => import('@/views/admin/StudentManage.vue'),
        meta: { title: '学员管理', roles: [3] },
      },
      {
        path: 'coaches',
        name: 'CoachManage',
        component: () => import('@/views/admin/CoachManage.vue'),
        meta: { title: '教练管理', roles: [3] },
      },
      {
        path: 'registration-review',
        name: 'RegistrationReview',
        component: () => import('@/views/admin/RegistrationReview.vue'),
        meta: { title: '报名审核', roles: [3] },
      },
      {
        path: 'exam-sessions',
        name: 'ExamSessions',
        component: () => import('@/views/admin/ExamSessions.vue'),
        meta: { title: '考试场次', roles: [3] },
      },
      {
        path: 'exam-review',
        name: 'ExamReview',
        component: () => import('@/views/admin/ExamReview.vue'),
        meta: { title: '考试审核', roles: [3] },
      },
      {
        path: 'coach-application-review',
        name: 'CoachApplicationReview',
        component: () => import('@/views/admin/CoachApplicationReview.vue'),
        meta: { title: '教练申请审核', roles: [3] },
      },
      {
        path: 'coach-assignment',
        name: 'CoachAssignment',
        component: () => import('@/views/admin/CoachAssignment.vue'),
        meta: { title: '教练分配', roles: [3] },
      },
      {
        path: 'files',
        name: 'FileManage',
        component: () => import('@/views/admin/FileManage.vue'),
        meta: { title: '文件管理', roles: [3] },
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('@/views/admin/Statistics.vue'),
        meta: { title: '统计报表', roles: [3] },
      },
      // ── 基础数据管理 ─────────────────────────────────────
      {
        path: 'fee-standards',
        name: 'FeeStandardManage',
        component: () => import('@/views/admin/FeeStandardManage.vue'),
        meta: { title: '费用标准管理', roles: [3] },
      },
      {
        path: 'license-configs',
        name: 'LicenseConfigManage',
        component: () => import('@/views/admin/LicenseConfigManage.vue'),
        meta: { title: '车型科目配置', roles: [3] },
      },
      {
        path: 'venues',
        name: 'VenueManage',
        component: () => import('@/views/admin/VenueManage.vue'),
        meta: { title: '场地管理', roles: [3] },
      },
      {
        path: 'special-exams',
        name: 'SpecialExamManage',
        component: () => import('@/views/admin/SpecialExamManage.vue'),
        meta: { title: '特种车辆考试管理', roles: [3] },
      },
      {
        path: 'vehicle-application-review',
        name: 'VehicleApplicationReview',
        component: () => import('@/views/admin/VehicleApplicationReview.vue'),
        meta: { title: '准教车型审核', roles: [3] },
      },
      {
        path: 'familiarization-manage',
        name: 'FamiliarizationManage',
        component: () => import('@/views/admin/FamiliarizationManage.vue'),
        meta: { title: '合场管理', roles: [3] },
      },
      {
        path: 'payment-manage',
        name: 'PaymentManage',
        component: () => import('@/views/admin/PaymentManage.vue'),
        meta: { title: '支付管理', roles: [3] },
      },
      {
        path: 'retake-training',
        name: 'AdminRetakeTraining',
        component: () => import('@/views/admin/RetakeTrainingManage.vue'),
        meta: { title: '二次培训管理', roles: [3] },
      },
      {
        path: 'physical-exam-manage',
        name: 'AdminPhysicalExam',
        component: () => import('@/views/admin/PhysicalExamManage.vue'),
        meta: { title: '体检管理', roles: [3] },
      },
      {
        path: 'vehicles',
        name: 'VehicleManage',
        component: () => import('@/views/admin/VehicleManage.vue'),
        meta: { title: '车辆管理', roles: [3] },
      },
      {
        path: 'schedule-review',
        name: 'ScheduleReview',
        component: () => import('@/views/admin/ScheduleReview.vue'),
        meta: { title: '排班审核', roles: [3] },
      },
      {
        path: 'system-config',
        name: 'SystemConfig',
        component: () => import('@/views/admin/SystemConfig.vue'),
        meta: { title: '系统配置', roles: [3] },
      },
      {
        path: 'notices',
        name: 'NoticeManage',
        component: () => import('@/views/admin/NoticeManage.vue'),
        meta: { title: '公告管理', roles: [3] },
      },
      {
        path: 'license-upgrade-manage',
        name: 'AdminLicenseUpgrade',
        component: () => import('@/views/admin/LicenseUpgradeManage.vue'),
        meta: { title: '增驾申请管理', roles: [3] },
      },
      {
        path: 'file-requests',
        name: 'FileRequestManage',
        component: () => import('@/views/admin/FileRequestManage.vue'),
        meta: { title: '文件请求管理', roles: [3] },
      },
      {
        path: 'disability-info-manage',
        name: 'DisabilityInfoManage',
        component: () => import('@/views/admin/DisabilityInfoManage.vue'),
        meta: { title: '残疾信息管理', roles: [3] },
      },
      {
        path: 'special-record-manage',
        name: 'SpecialPersonRecordManage',
        component: () => import('@/views/admin/SpecialPersonRecordManage.vue'),
        meta: { title: '特殊人群记录管理', roles: [3] },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ── 导航守卫：登录校验 + JWT 过期检查 ─────────────────
router.beforeEach(async (to, _from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - DriveMan` : 'DriveMan'

  if (to.name === 'Login') {
    return next()
  }

  const { useUserStore, isTokenExpired } = await import('@/stores/user')
  const userStore = useUserStore()

  // 无 token → 跳登录
  if (!userStore.token) {
    return next({ name: 'Login' })
  }

  // token 已过期 → 清除并跳登录
  if (isTokenExpired(userStore.token)) {
    userStore.logout()
    return next({ name: 'Login' })
  }

  // 角色路由控制
  const routeRoles = to.meta.roles
  if (routeRoles && !routeRoles.includes(userStore.role)) {
    if (userStore.role === 0) {
      return next({ name: 'StudentEnrollment' })
    }
    return next({ name: 'Home' })
  }

  next()
})

export default router
