import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/auth'
import AuthLayoutView from '@/views/auth/AuthLayoutView.vue'
import SystemAdminLoginForm from '@/components/SystemAdminLoginForm.vue'
import SchoolAdminLoginForm from '@/components/SchoolAdminLoginForm.vue'
import UserLoginForm from '@/components/UserLoginForm.vue'
import RegisterForm from '@/components/RegisterForm.vue'
import ForgotPasswordForm from '@/components/ForgotPasswordForm.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    // ==================== 认证模块 ====================
    {
      path: '/',
      component: AuthLayoutView,
      children: [
        {
          path: 'login',
          name: 'Login',
          component: UserLoginForm,
          meta: { title: '用户登录', guest: true },
        },
        {
          path: 'login/school',
          name: 'SchoolLogin',
          component: SchoolAdminLoginForm,
          meta: { title: '学校管理端登录', guest: true },
        },
        {
          path: 'login/sys',
          name: 'SysAdminLogin',
          component: SystemAdminLoginForm,
          meta: { title: '系统维护', guest: true },
        },
        {
          path: 'register',
          name: 'Register',
          component: RegisterForm,
          meta: { title: '注册', guest: true },
        },
        {
          path: 'forgot-password',
          name: 'ForgotPassword',
          component: ForgotPasswordForm,
          meta: { title: '忘记密码', guest: true },
        },
      ],
    },
    // 学校入驻申请（独立页面）
    {
      path: '/onboarding',
      name: 'Onboarding',
      component: () => import('@/views/auth/OnboardingView.vue'),
      meta: { title: '学校入驻申请', guest: true },
    },
    // ==================== 系统管理端 ====================
    {
      path: '/admin',
      name: 'PlatformLayout',
      component: () => import('@/views/admin/PlatformLayoutView.vue'),
      meta: { title: '系统管理', requiresAuth: true, roles: ['system_admin'] },
      children: [
        { path: 'dashboard', name: 'AdminDashboard', component: () => import('@/views/admin/dashboard/DashboardView.vue'), meta: { title: '平台概览' } },
        { path: 'tenants/list', name: 'AdminTenantList', component: () => import('@/views/admin/tenants/TenantListView.vue'), meta: { title: '租户列表' } },
        { path: 'tenants/plans', name: 'AdminPlanList', component: () => import('@/views/admin/tenants/PlanListView.vue'), meta: { title: '套餐管理' } },
        { path: 'onboarding/audit', name: 'AdminOnboardingAudit', component: () => import('@/views/admin/onboarding/AuditListView.vue'), meta: { title: '入驻审核' } },
      ],
    },
    // ==================== 学校管理端 ====================
    {
      path: '/school',
      name: 'SchoolLayout',
      component: () => import('@/views/school/SchoolLayoutView.vue'),
      meta: { title: '学校管理', requiresAuth: true, roles: ['school_admin'] },
      children: [
        { path: 'dashboard', name: 'SchoolDashboard', component: () => import('@/views/school/dashboard/DashboardView.vue'), meta: { title: '学校概览' } },
        { path: 'org/departments', name: 'SchoolDeptList', component: () => import('@/views/school/org/DepartmentListView.vue'), meta: { title: '院系管理' } },
        { path: 'users/staff', name: 'SchoolStaffList', component: () => import('@/views/school/users/StaffListView.vue'), meta: { title: '教职工管理' } },
        { path: 'users/student', name: 'SchoolStudentList', component: () => import('@/views/school/users/StudentListView.vue'), meta: { title: '学生管理' } },
        { path: 'form/list', name: 'SchoolFormList', component: () => import('@/views/school/form/FormListView.vue'), meta: { title: '表单列表' } },
        { path: 'audit/list', name: 'SchoolAuditList', component: () => import('@/views/school/audit/AuditListView.vue'), meta: { title: '审核列表' } },
      ],
    },
    // ==================== 教职工端 ====================
    {
      path: '/staff',
      name: 'StaffLayout',
      component: () => import('@/views/TopNavLayoutView.vue'),
      meta: { title: '教职工端', requiresAuth: true, roles: ['staff'] },
      children: [
        { path: 'dashboard', name: 'StaffDashboard', component: () => import('@/views/staff/dashboard/DashboardView.vue'), meta: { title: '我的概览' } },
        { path: 'evaluation/results', name: 'StaffEvalResults', component: () => import('@/views/staff/evaluation/ResultsView.vue'), meta: { title: '评价结果' } },
        { path: 'department', name: 'StaffDepartment', component: () => import('@/views/staff/department/DepartmentView.vue'), meta: { title: '部门管理' } },
      ],
    },
    // ==================== 学生端 ====================
    {
      path: '/student',
      name: 'StudentLayout',
      component: () => import('@/views/TopNavLayoutView.vue'),
      meta: { title: '学生端', requiresAuth: true, roles: ['student'] },
      children: [
        { path: 'dashboard', name: 'StudentDashboard', component: () => import('@/views/student/dashboard/DashboardView.vue'), meta: { title: '我的概览' } },
        { path: 'announcements', name: 'StudentAnnouncementList', component: () => import('@/views/student/announcement/AnnouncementListView.vue'), meta: { title: '校园公告' } },
        { path: 'announcements/:id', name: 'StudentAnnouncementDetail', component: () => import('@/views/student/announcement/AnnouncementDetailView.vue'), meta: { title: '公告详情' } },
        { path: 'evaluations', name: 'StudentEvaluationTasks', component: () => import('@/views/student/evaluation/TasksView.vue'), meta: { title: '评价中心', showGlobalSearch: false } },
        { path: 'evaluations/:taskId/submit', name: 'StudentEvalSubmit', component: () => import('@/views/student/evaluation/SubmitView.vue'), meta: { title: '提交评价' } },
        { path: 'my-evaluations', name: 'StudentEvalHistory', component: () => import('@/views/student/evaluation/HistoryView.vue'), meta: { title: '我的评价' } },
        { path: 'evaluation/history', redirect: { name: 'StudentEvalHistory' } },
        { path: 'complaint', name: 'StudentComplaint', component: () => import('@/views/student/complaint/ComplaintView.vue'), meta: { title: '投诉建议' } },
        { path: 'profile', name: 'StudentProfile', component: () => import('@/views/student/profile/StudentProfileView.vue'), meta: { title: '个人信息' } },
        { path: 'help', name: 'StudentHelp', component: () => import('@/views/student/help/HelpView.vue'), meta: { title: '帮助中心' } },
        { path: 'notifications', name: 'StudentNotifications', component: () => import('@/views/student/notification/NotificationCenterView.vue'), meta: { title: '消息通知' } },
      ],
    },
    // ==================== 个人信息（所有角色） ====================
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('@/views/profile/ProfileView.vue'),
      meta: { title: '个人信息', requiresAuth: true },
    },
    // ==================== 404 ====================
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: '页面不存在' },
    },
  ],
})

// 角色对应的默认首页
const roleDashboardMap = {
  system_admin: 'AdminDashboard',
  school_admin: 'SchoolDashboard',
  staff: 'StaffDashboard',
  student: 'StudentDashboard',
}

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
    const userInfo = JSON.parse(sessionStorage.getItem('campus_user_info') || '{}')
    const userRole = userInfo.role_type || userInfo.role
    if (to.meta.roles && to.meta.roles.length > 0) {
      if (!to.meta.roles.includes(userRole)) {
        // 无权访问，跳转到角色对应的首页
        const defaultRoute = roleDashboardMap[userRole]
        next({ name: defaultRoute || 'StudentDashboard' })
        return
      }
    }
  }

  // 已登录用户访问 guest 页面（登录/注册/入驻等），根据角色跳转到对应首页
  if (to.meta.guest && token) {
    const userInfo = JSON.parse(sessionStorage.getItem('campus_user_info') || '{}')
    const userRole = userInfo.role_type || userInfo.role
    const defaultRoute = roleDashboardMap[userRole]
    next({ name: defaultRoute || 'StudentDashboard' })
    return
  }

  next()
})

export default router
