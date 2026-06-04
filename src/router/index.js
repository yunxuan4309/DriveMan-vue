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
        path: 'exam-venues',
        name: 'ExamVenueManage',
        component: () => import('@/views/admin/ExamVenueManage.vue'),
        meta: { title: '考场信息管理', roles: [3] },
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

  // ★ 后续如需角色路由控制，在此追加：
  // const routeRoles = to.meta.roles   // [1, 2, 3]
  // if (routeRoles && !routeRoles.includes(userStore.role)) {
  //   return next({ name: '403' })
  // }

  next()
})

export default router
