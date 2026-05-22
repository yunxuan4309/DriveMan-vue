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
