import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/auth'
import AuthLayoutView from '@/views/auth/AuthLayoutView.vue'
import LoginForm from '@/components/LoginForm.vue'
import RegisterForm from '@/components/RegisterForm.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/',
      component: AuthLayoutView,
      children: [
        {
          path: 'login',
          name: 'Login',
          component: LoginForm,
          meta: { title: '登录', guest: true },
        },
        {
          path: 'register',
          name: 'Register',
          component: RegisterForm,
          meta: { title: '注册', guest: true },
        },
      ],
    },
    // 用户端路由
    {
      path: '/user',
      name: 'UserLayout',
      component: () => import('@/views/user/UserLayoutView.vue'),
      meta: { title: '用户中心', requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'UserDashboard',
          component: () => import('@/views/user/DashboardView.vue'),
          meta: { title: '首页' },
        },
      ],
    },
    // 部门管理端路由
    {
      path: '/dept',
      name: 'DeptLayout',
      component: () => import('@/views/dept/DeptLayoutView.vue'),
      meta: { title: '部门管理', requiresAuth: true, roles: ['dept_admin'] },
      children: [
        {
          path: 'dashboard',
          name: 'DeptDashboard',
          component: () => import('@/views/dept/DashboardView.vue'),
          meta: { title: '部门概览' },
        },
      ],
    },
    // 系统管理端路由
    {
      path: '/admin',
      name: 'AdminLayout',
      component: () => import('@/views/admin/AdminLayoutView.vue'),
      meta: { title: '系统管理', requiresAuth: true, roles: ['system_admin', 'school_admin'] },
      children: [
        {
          path: 'dashboard',
          name: 'AdminDashboard',
          component: () => import('@/views/admin/DashboardView.vue'),
          meta: { title: '管理概览' },
        },
      ],
    },
    // 404
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: '页面不存在' },
    },
  ],
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title || ''} - 校园服务质量评测系统`

  const token = getToken()

  // 需要登录的页面
  if (to.meta.requiresAuth) {
    if (!token) {
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
    // 角色权限校验
    if (to.meta.roles && to.meta.roles.length > 0) {
      const userInfo = JSON.parse(sessionStorage.getItem('campus_user_info') || '{}')
      if (!to.meta.roles.includes(userInfo.role)) {
        next({ name: 'UserDashboard' })
        return
      }
    }
  }

  // 已登录用户访问登录/注册页，重定向到首页
  if (to.meta.guest && token) {
    next({ name: 'UserDashboard' })
    return
  }

  next()
})

export default router
