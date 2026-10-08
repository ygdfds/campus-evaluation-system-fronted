import request from '@/request'
import { dataOf } from '@/api/backend'

function currentUserOf(user = {}) {
  return {
    ...user,
    id: user.userId || user.id,
    user_id: user.userId || user.user_id || user.id,
    real_name: user.realName || user.real_name || '',
    role_type: user.roleType || user.role_type || user.userType || '',
    tenant_id: user.tenantId || user.tenant_id,
    school_id: user.schoolId || user.school_id,
    roles: (user.roles || []).map((role) => typeof role === 'string' ? { role_code: role, role_name: role } : role),
    account_status: 'active',
  }
}

export async function getStaffProfileApi(currentUser) {
  const [user, notifications, tickets, todos, preferences] = await Promise.all([
    request.get('/auth/me').then(dataOf),
    request.get('/notifications', {
      params: { receiver_user_id: currentUser.userId, read_status: 'unread' },
    }).then(dataOf),
    request.get('/helpTickets', {
      params: { submitter_id: currentUser.userId },
    }).then(dataOf),
    request.get('/stats/staff/dashboard/todos').then(dataOf),
    request.get('/staff/notification-preferences').then(dataOf),
  ])
  const account = currentUserOf(user)
  const profile = {
    ...account,
    user_id: account.id,
    tenant_id: account.tenant_id,
    real_name: account.real_name,
  }
  const roles = account.roles || []
  return {
    account,
    profile,
    roles,
    teachingOrg: null,
    serviceOrg: null,
    teachingOrgs: [],
    serviceOrgs: [],
    permissionScope: account.permissions || [],
    notificationPreference: preferences,
    overviewStats: {
      unreadCount: Array.isArray(notifications) ? notifications.length : 0,
      pendingFeedbackCount: Array.isArray(tickets) ? tickets.filter((item) => ['pending', 'processing'].includes(item.status)).length : 0,
      pendingAppealCount: 0,
      pendingTotal: todos?.pendingTotal || 0,
      permissionModuleCount: (account.permissions || []).length,
    },
  }
}

export async function updateStaffBasicInfoApi(payload) {
  return request.put('/auth/me', {
    phone: payload.phone,
    email: payload.email,
    officePhone: payload.office_phone,
    intro: payload.intro,
  }).then(dataOf)
}

export function changeStaffPasswordApi(payload) {
  return request.post('/auth/change-password', {
    oldPassword: payload.oldPassword,
    newPassword: payload.newPassword,
    confirmPassword: payload.confirmPassword || payload.newPassword,
  }).then(dataOf)
}

export async function updateStaffNotificationPreferenceApi(payload) {
  return request.put('/staff/notification-preferences', payload).then(dataOf)
}
