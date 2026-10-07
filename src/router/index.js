import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/auth'
import { useUserStore } from '@/stores/user'
import AuthLayoutView from '@/views/auth/AuthLayoutView.vue'
import SystemAdminLoginForm from '@/components/SystemAdminLoginForm.vue'
import SchoolAdminLoginForm from '@/components/SchoolAdminLoginForm.vue'
import UserLoginForm from '@/components/UserLoginForm.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    {
      path: '/',
      component: AuthLayoutView,
      children: [
        { path: 'login', name: 'Login', component: UserLoginForm, meta: { title: 'Login', guest: true } },
        { path: 'login/school', name: 'SchoolLogin', component: SchoolAdminLoginForm, meta: { title: 'School login', guest: true } },
        { path: 'login/sys', name: 'SysAdminLogin', component: SystemAdminLoginForm, meta: { title: 'System login', guest: true } },
        { path: 'register', name: 'Register', redirect: '/onboarding', meta: { title: 'School onboarding', guest: true } },
        { path: 'forgot-password', name: 'ForgotPassword', redirect: '/login', meta: { title: 'Login', guest: true } },
      ],
    },
    {
      path: '/onboarding',
      name: 'Onboarding',
      component: () => import('@/views/auth/OnboardingView.vue'),
      meta: { title: 'School onboarding', guest: true },
    },
    {
      path: '/403',
      name: 'Forbidden',
      component: () => import('@/views/ForbiddenView.vue'),
      meta: { title: 'Forbidden' },
    },
    {
      path: '/admin',
      name: 'PlatformLayout',
      component: () => import('@/views/admin/PlatformLayoutView.vue'),
      meta: { title: 'System admin', requiresAuth: true, roles: ['system_admin'] },
      children: [
        { path: 'dashboard', name: 'AdminDashboard', component: () => import('@/views/admin/dashboard/DashboardView.vue'), meta: { title: 'Dashboard' } },
        { path: 'tenants/list', name: 'AdminTenantList', component: () => import('@/views/admin/tenants/TenantListView.vue'), meta: { title: 'Tenants', permissions: ['admin.tenant.manage'] } },
        { path: 'tenants/lifecycle', name: 'AdminTenantLifecycle', component: () => import('@/views/admin/tenants/TenantLifecycleView.vue'), meta: { title: 'Tenant lifecycle', permissions: ['admin.tenant.manage'] } },
        { path: 'tenants/:tenantId', name: 'AdminTenantDetail', component: () => import('@/views/admin/tenants/TenantDetailView.vue'), meta: { title: 'Tenant detail', permissions: ['admin.tenant.manage'] } },
        { path: 'plans', name: 'AdminPlanList', component: () => import('@/views/admin/plans/PlanManagementView.vue'), meta: { title: 'Plans', permissions: ['admin.plan.manage'] } },
        { path: 'onboarding/audit', name: 'AdminOnboardingAudit', component: () => import('@/views/admin/onboarding/AuditListView.vue'), meta: { title: 'Onboarding audit', permissions: ['admin.onboarding.audit'] } },
        { path: 'users/roles', name: 'AdminRoleManagement', component: () => import('@/views/admin/roles/RolePermissionView.vue'), meta: { title: 'Roles', permissions: ['admin.role.manage'] } },
        { path: 'monitoring', name: 'AdminMonitoring', component: () => import('@/views/admin/monitoring/MonitoringDashboardView.vue'), meta: { title: 'Monitoring', permissions: ['admin.monitor.view'] } },
        { path: 'audit/logs', name: 'AdminAuditLogs', component: () => import('@/views/admin/audit/AuditLogView.vue'), meta: { title: 'Audit logs', permissions: ['admin.audit.view'] } },
        { path: 'reports', name: 'AdminReports', component: () => import('@/views/admin/reports/ReportDashboardView.vue'), meta: { title: 'Reports', permissions: ['admin.monitor.view'] } },
      ],
    },
    {
      path: '/school',
      name: 'SchoolLayout',
      component: () => import('@/views/school/SchoolLayoutView.vue'),
      meta: { title: 'School admin', requiresAuth: true, roles: ['school_admin'] },
      children: [
        { path: 'dashboard', name: 'SchoolDashboard', component: () => import('@/views/school/dashboard/SchoolDashboardView.vue'), meta: { title: 'Dashboard', permissions: ['school.dashboard.view'] } },
        { path: 'org/departments', name: 'SchoolDeptList', component: () => import('@/views/school/org/DepartmentListView.vue'), meta: { title: 'Departments', permissions: ['school.org.manage'] } },
        { path: 'users/staff', name: 'SchoolStaffList', component: () => import('@/views/school/users/StaffListView.vue'), meta: { title: 'Staff', permissions: ['school.user.manage'] } },
        { path: 'users/student', name: 'SchoolStudentList', component: () => import('@/views/school/users/StudentListView.vue'), meta: { title: 'Students', permissions: ['school.user.manage'] } },
        { path: 'admins', name: 'SchoolAdminList', component: () => import('@/views/school/admins/AdminListView.vue'), meta: { title: 'Admins', permissions: ['school.user.manage'] } },
        { path: 'form/list', name: 'SchoolFormList', component: () => import('@/views/school/form/FormListView.vue'), meta: { title: 'Forms', permissions: ['school.audit.manage'] } },
        { path: 'announcements', name: 'SchoolAnnouncementList', component: () => import('@/views/school/announcement/AnnouncementListView.vue'), meta: { title: 'Announcements', permissions: ['school.announcement.manage'] } },
        { path: 'audit/list', name: 'SchoolAuditList', component: () => import('@/views/school/audit/AuditListView.vue'), meta: { title: 'Audits', permissions: ['school.audit.manage'] } },
        { path: 'data/overview', name: 'SchoolDataOverview', component: () => import('@/views/school/data/DataOverviewView.vue'), meta: { title: 'Data overview', permissions: ['school.dashboard.view'] } },
        { path: 'complaint/stats', name: 'SchoolComplaintStats', component: () => import('@/views/school/complaint/ComplaintStatsView.vue'), meta: { title: 'Complaint stats', permissions: ['school.audit.manage'] } },
        { path: 'complaint/detail', name: 'SchoolComplaintDetail', component: () => import('@/views/school/complaint/ComplaintDetailView.vue'), meta: { title: 'Complaint detail', permissions: ['school.audit.manage'] } },
        { path: 'help/tickets', name: 'SchoolHelpTickets', component: () => import('@/views/school/help/HelpTicketListView.vue'), meta: { title: 'Help tickets', permissions: ['school.help.manage'] } },
        { path: 'help/content', name: 'SchoolHelpContent', component: () => import('@/views/school/help/HelpContentManageView.vue'), meta: { title: 'Help content', permissions: ['school.help.manage'] } },
        { path: 'audit/logs', name: 'SchoolOperationLogs', component: () => import('@/views/school/audit/SchoolOperationLogView.vue'), meta: { title: 'Operation logs', permissions: ['school.audit.manage'] } },
        { path: 'imports', name: 'SchoolImportCenter', component: () => import('@/views/school/imports/ImportCenterView.vue'), meta: { title: 'Imports', permissions: ['school.user.manage'] } },
        { path: 'teaching/courses', name: 'SchoolCourses', component: () => import('@/views/school/teaching/CourseManagementView.vue'), meta: { title: 'Courses', permissions: ['school.org.manage'] } },
        { path: 'teaching/classes', name: 'SchoolClasses', component: () => import('@/views/school/teaching/ClassManagementView.vue'), meta: { title: 'Classes', permissions: ['school.org.manage'] } },
        { path: 'teaching/enrollments', name: 'SchoolEnrollments', component: () => import('@/views/school/teaching/EnrollmentManagementView.vue'), meta: { title: 'Enrollments', permissions: ['school.org.manage'] } },
        { path: 'service/orgs', name: 'SchoolServiceOrgs', component: () => import('@/views/school/service/ServiceOrgManagementView.vue'), meta: { title: 'Service orgs', permissions: ['school.org.manage'] } },
        { path: 'service/items', name: 'SchoolServiceItems', component: () => import('@/views/school/service/ServiceItemManagementView.vue'), meta: { title: 'Service items', permissions: ['school.org.manage'] } },
        { path: 'school-info', name: 'SchoolInfo', component: () => import('@/views/school/info/SchoolInfoView.vue'), meta: { title: 'School info', permissions: ['school.org.manage'] } },
      ],
    },
    {
      path: '/staff',
      name: 'StaffLayout',
      component: () => import('@/views/TopNavLayoutView.vue'),
      meta: { title: 'Staff', requiresAuth: true, roles: ['staff'] },
      children: [
        { path: 'dashboard', name: 'StaffDashboard', component: () => import('@/views/staff/dashboard/DashboardView.vue'), meta: { title: 'Dashboard' } },
        { path: 'evaluation/forms', name: 'StaffEvalForms', component: () => import('@/views/staff/evaluation/FormsView.vue'), meta: { title: 'Evaluation forms' } },
        { path: 'feedback', name: 'StaffFeedback', component: () => import('@/views/staff/feedback/FeedbackView.vue'), meta: { title: 'Feedback' } },
        { path: 'reports', name: 'StaffReports', component: () => import('@/views/staff/reports/ReportsView.vue'), meta: { title: 'Reports' } },
        { path: 'appeals', name: 'StaffAppeals', component: () => import('@/views/staff/appeals/StaffAppealsView.vue'), meta: { title: 'Appeals' } },
        { path: 'notifications', name: 'StaffNotifications', component: () => import('@/views/staff/notifications/StaffNotificationsView.vue'), meta: { title: 'Notifications', hideStaffNav: true } },
        { path: 'help', name: 'StaffHelp', component: () => import('@/views/staff/help/StaffHelpView.vue'), meta: { title: 'Help' } },
        { path: 'profile', name: 'StaffProfile', component: () => import('@/views/staff/profile/StaffProfileView.vue'), meta: { title: 'Profile', hideStaffNav: true } },
      ],
    },
    {
      path: '/student',
      name: 'StudentLayout',
      component: () => import('@/views/TopNavLayoutView.vue'),
      meta: { title: 'Student', requiresAuth: true, roles: ['student'] },
      children: [
        { path: 'dashboard', name: 'StudentDashboard', component: () => import('@/views/student/dashboard/DashboardView.vue'), meta: { title: 'Dashboard' } },
        { path: 'announcements', name: 'StudentAnnouncementList', component: () => import('@/views/student/announcement/AnnouncementListView.vue'), meta: { title: 'Announcements' } },
        { path: 'announcements/:id', name: 'StudentAnnouncementDetail', component: () => import('@/views/student/announcement/AnnouncementDetailView.vue'), meta: { title: 'Announcement detail' } },
        { path: 'evaluations', name: 'StudentEvaluationTasks', component: () => import('@/views/student/evaluation/TasksView.vue'), meta: { title: 'Evaluations', showGlobalSearch: false } },
        { path: 'evaluations/:taskId/submit', name: 'StudentEvalSubmit', component: () => import('@/views/student/evaluation/SubmitView.vue'), meta: { title: 'Submit evaluation' } },
        { path: 'my-evaluations', name: 'StudentEvalHistory', component: () => import('@/views/student/evaluation/HistoryView.vue'), meta: { title: 'My evaluations' } },
        { path: 'evaluation/history', redirect: { name: 'StudentEvalHistory' } },
        { path: 'complaint', name: 'StudentComplaint', component: () => import('@/views/student/complaint/ComplaintView.vue'), meta: { title: 'Complaint' } },
        { path: 'profile', name: 'StudentProfile', component: () => import('@/views/student/profile/StudentProfileView.vue'), meta: { title: 'Profile' } },
        { path: 'help', name: 'StudentHelp', component: () => import('@/views/student/help/HelpView.vue'), meta: { title: 'Help' } },
        { path: 'notifications', name: 'StudentNotifications', component: () => import('@/views/student/notification/NotificationCenterView.vue'), meta: { title: 'Notifications' } },
      ],
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('@/views/profile/ProfileView.vue'),
      meta: { title: 'Profile', requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: 'Not found' },
    },
  ],
})

const roleDashboardMap = {
  system_admin: 'AdminDashboard',
  school_admin: 'SchoolDashboard',
  staff: 'StaffDashboard',
  student: 'StudentDashboard',
}

router.beforeEach(async (to, from, next) => {
  document.title = `${to.meta.title || ''} - Campus Evaluation System`

  const token = getToken()
  const userStore = useUserStore()

  if (to.meta.guest && token) {
    try {
      await userStore.confirmSession()
      next({ name: roleDashboardMap[userStore.userRole] || 'StudentDashboard' })
    } catch (error) {
      await userStore.logout({ localOnly: true })
      next()
    }
    return
  }

  if (to.meta.requiresAuth) {
    if (!token) {
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }

    try {
      await userStore.confirmSession()
    } catch (error) {
      await userStore.logout({ localOnly: true })
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }

    if (Array.isArray(to.meta.roles) && to.meta.roles.length > 0) {
      const roleMatch = to.meta.roles.includes(userStore.userRole)
      const staffPortalRoles = ['teaching_admin', 'service_admin', 'feedback_handler', 'form_publisher', 'course_owner', 'service_window_manager']
      const staffSubRoleMatch = to.meta.roles.includes('staff') && userStore.roles.some(role => staffPortalRoles.includes(role))
      if (!roleMatch && !staffSubRoleMatch) {
        next({ name: 'Forbidden', query: { from: to.fullPath } })
        return
      }
    }

    if (Array.isArray(to.meta.permissions) && to.meta.permissions.length > 0) {
      const hasPermission = to.meta.permissions.some(permission => userStore.permissions.includes(permission))
      if (!hasPermission) {
        next({ name: 'Forbidden', query: { from: to.fullPath } })
        return
      }
    }
  }

  next()
})

export default router
