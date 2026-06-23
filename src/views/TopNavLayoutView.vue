<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { SwitchButton, ArrowDown, User } from '@element-plus/icons-vue'
import NotificationDropdown from '@/components/NotificationDropdown.vue'
import { getStaffRoleCodes, isStaffPortalUser, canViewStaffMenu, getStaffRoleNames } from '@/utils/staffPermission'

defineOptions({ name: 'TopNavLayoutView' })

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 当前子路由是否要求隐藏主导航（如消息通知页）
const hideStaffNav = computed(() => !!route.meta.hideStaffNav)

const navMenus = computed(() => {
  const role = userStore.userRole
  if (role === 'student') {
    return [
      { title: '首页', path: '/student/dashboard' },
      { title: '评价中心', path: '/student/evaluations' },
      { title: '我的评价', path: '/student/my-evaluations' },
      { title: '投诉建议', path: '/student/complaint' },
      { title: '帮助中心', path: '/student/help' },
    ]
  }
  if (role === 'staff') {
    const roleCodes = getStaffRoleCodes(userStore.userInfo)
    // 普通 staff 无管理权限，不显示业务菜单
    if (!isStaffPortalUser(roleCodes)) {
      return [
        { title: '首页', path: '/staff/dashboard' },
        { title: '帮助中心', path: '/staff/help' },
      ]
    }
    return [
      { title: '首页', path: '/staff/dashboard' },
      canViewStaffMenu('evaluation', roleCodes) && { title: '评价管理', path: '/staff/evaluation/forms' },
      canViewStaffMenu('feedback', roleCodes) && { title: '反馈处理', path: '/staff/feedback' },
      canViewStaffMenu('reports', roleCodes) && { title: '数据看板', path: '/staff/reports' },
      canViewStaffMenu('appeals', roleCodes) && { title: '申诉处理', path: '/staff/appeals' },
      { title: '帮助中心', path: '/staff/help' },
    ].filter(Boolean)
  }
  return []
})

// 职工端角色标签：显示具体管理角色而非“教职工”
const staffRoleLabel = computed(() => {
  if (userStore.userRole !== 'staff') return ''
  const roleCodes = getStaffRoleCodes(userStore.userInfo)
  if (roleCodes.length === 0) return userStore.roleName
  return getStaffRoleNames(roleCodes)
})

const displayRoleTag = computed(() => {
  return staffRoleLabel.value || userStore.roleName
})

function handleNavClick(path) {
  router.push(path)
}

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="topnav-layout">
    <!-- 背景氛围圆 -->
    <div class="bg-ambiance">
      <div class="ambiance-circle circle-tr" />
      <div class="ambiance-circle circle-bl" />
    </div>

    <!-- 顶部导航栏 64px -->
    <header class="top-nav">
      <div class="nav-left">
        <div class="nav-brand" @click="router.push('/')">
          <div class="brand-icon">评</div>
          <span class="brand-text">校园服务质量在线评测系统</span>
        </div>
        <nav v-if="!hideStaffNav" class="nav-menu">
        <span
          v-for="menu in navMenus"
          :key="menu.path"
          class="nav-item"
          :class="{ active: route.path === menu.path || route.path.startsWith(menu.path + '/') }"
          @click="handleNavClick(menu.path)"
        >
          {{ menu.title }}
        </span>
        </nav>
      </div>
      <div class="nav-right">
        <NotificationDropdown />
        <el-dropdown trigger="click">
          <span class="user-trigger">
            <span class="user-avatar">{{ userStore.realName?.charAt(0) || 'U' }}</span>
            <span class="user-name">{{ userStore.realName }}</span>
            <el-tag size="small" effect="plain" class="role-tag">{{ displayRoleTag }}</el-tag>
            <el-icon :size="14"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="router.push(userStore.userRole === 'student' ? '/student/profile' : userStore.userRole === 'staff' ? '/staff/profile' : '/profile')">
                <el-icon><User /></el-icon>个人信息
              </el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">
                <el-icon><SwitchButton /></el-icon>退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="nav-main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.topnav-layout {
  min-height: 100vh;
  background: var(--page-bg);
  position: relative;
}

/* 背景氛围圆 */
.bg-ambiance {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.ambiance-circle {
  position: absolute;
  border-radius: var(--radius-full);
  background: var(--color-accent-user-700);
}

.circle-tr {
  width: 500px;
  height: 500px;
  top: -200px;
  right: -100px;
  opacity: 0.06;
}

.circle-bl {
  width: 400px;
  height: 400px;
  bottom: -150px;
  left: -100px;
  opacity: 0.05;
}

/* 顶部导航栏 */
.top-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--nav-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--nav-padding-x);
  background: var(--nav-bg);
  box-shadow: var(--nav-shadow);
}

.nav-left {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  flex-shrink: 0;
}

.brand-icon {
  width: var(--space-9);
  height: var(--space-9);
  background: var(--color-accent-user-700);
  color: var(--color-text-white);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-lg);
  font-weight: var(--font-weight-bold);
}

.brand-text {
  font-size: var(--font-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-heading);
  white-space: nowrap;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.nav-item {
  padding: var(--nav-item-padding);
  font-size: var(--nav-item-font-size);
  color: var(--nav-item-color);
  border-radius: var(--nav-item-border-radius);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  font-weight: var(--font-weight-normal);
}

.nav-item:hover {
  color: var(--nav-item-hover-color);
  background: var(--nav-item-hover-bg);
}

.nav-item.active {
  color: var(--nav-item-active-color);
  background: var(--nav-item-active-bg);
  font-weight: var(--font-weight-semibold);
}

/* 右侧 */
.nav-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-md);
  transition: background 0.2s;
}

.user-trigger:hover {
  background: var(--color-bg-hover);
}

.user-avatar {
  width: var(--space-8);
  height: var(--space-8);
  border-radius: var(--radius-full);
  background: var(--color-primary-50);
  color: var(--color-accent-user-700);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-md);
  font-weight: var(--font-weight-semibold);
  flex-shrink: 0;
}

.user-name {
  font-size: var(--font-base);
  color: var(--color-text-heading);
  font-weight: var(--font-weight-medium);
}

.role-tag {
  font-size: var(--font-xs);
}

/* 主内容区 */
.nav-main {
  position: relative;
  z-index: 1;
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding: var(--page-padding-y) var(--page-padding-x) var(--space-12);
}

@media (max-width: 768px) {
  .top-nav {
    padding: 0 var(--spacing-base);
  }
  .brand-text {
    display: none;
  }
  .nav-menu {
    display: none;
  }
  .nav-main {
    padding: var(--spacing-base);
  }
}
</style>
