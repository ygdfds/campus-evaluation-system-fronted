<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  HomeFilled, OfficeBuilding, User, Files, DocumentChecked,
  School, ArrowDown, SwitchButton, DataAnalysis, InfoFilled,
  ChatDotRound, Bell,
} from '@element-plus/icons-vue'
import NotificationDropdown from '@/components/NotificationDropdown.vue'

defineOptions({ name: 'SchoolLayoutView' })

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const menuGroups = [
  {
    title: '工作台',
    items: [
      { index: '/school/dashboard', title: '首页概览', icon: HomeFilled },
      { index: '/school/audit/list', title: '审核中心', icon: DocumentChecked },
    ],
  },
  {
    title: '评价治理',
    items: [
      { index: '/school/form/list', title: '评价表单', icon: Files },
      { index: '/school/announcements', title: '公告管理', icon: Bell },
      { index: '/school/data/overview', title: '数据概览', icon: DataAnalysis },
      { index: '/school/complaint/stats', title: '投诉建议', icon: ChatDotRound },
    ],
  },
  {
    title: '组织账号',
    items: [
      { index: '/school/org/departments', title: '组织架构', icon: OfficeBuilding },
      {
        index: '/school/users',
        title: '用户管理',
        icon: User,
        children: [
          { index: '/school/users/staff', title: '教职工管理' },
          { index: '/school/users/student', title: '学生管理' },
          { index: '/school/admins', title: '管理员管理' },
        ],
      },
      { index: '/school/school-info', title: '学校信息', icon: InfoFilled },
    ],
  },
]

const flatItems = computed(() => menuGroups.flatMap(group => group.items.flatMap(item => item.children || item)))

function isMenuActive(path) {
  return route.path === path || route.path.startsWith(path + '/')
}

const currentTitle = computed(() => {
  const current = flatItems.value.find(item => route.path === item.index || route.path.startsWith(item.index + '/'))
  return current?.title || route.meta?.title || '学校管理端'
})

const breadcrumbs = computed(() => {
  const crumbs = [{ title: '学校管理端', path: '/school/dashboard' }]
  if (route.path !== '/school/dashboard') {
    crumbs.push({ title: currentTitle.value, path: '' })
  }
  return crumbs
})

const expandedMenus = ref(['/school/users'])

function toggleMenu(index) {
  const idx = expandedMenus.value.indexOf(index)
  if (idx >= 0) expandedMenus.value.splice(idx, 1)
  else expandedMenus.value.push(index)
}

function isExpanded(index) {
  return expandedMenus.value.includes(index)
}

function go(path) {
  router.push(path)
}

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="school-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo-mark">评</div>
        <div class="logo-text">
          <span class="logo-title">校园服务质量在线评测系统</span>
          <span class="logo-subtitle">School Console</span>
        </div>
      </div>

      <nav class="sidebar-menu" aria-label="学校管理导航">
        <section v-for="group in menuGroups" :key="group.title" class="menu-section">
          <div class="menu-section-title">{{ group.title }}</div>
          <template v-for="item in group.items" :key="item.index">
            <div v-if="item.children" class="menu-group">
              <button class="menu-item menu-parent" type="button" :class="{ expanded: isExpanded(item.index) }" @click="toggleMenu(item.index)">
                <el-icon :size="17"><component :is="item.icon" /></el-icon>
                <span class="menu-text">{{ item.title }}</span>
                <el-icon :size="13" class="menu-arrow" :class="{ expanded: isExpanded(item.index) }"><ArrowDown /></el-icon>
              </button>
              <div :class="['menu-children', { 'menu-children--expanded': isExpanded(item.index) }]">
                <button
                  v-for="child in item.children"
                  :key="child.index"
                  class="menu-item menu-child"
                  type="button"
                  :class="{ active: route.path === child.index }"
                  @click="go(child.index)"
                >
                  <span class="child-dot" />
                  <span class="menu-text">{{ child.title }}</span>
                </button>
              </div>
            </div>

            <button v-else class="menu-item" type="button" :class="{ active: isMenuActive(item.index) }" @click="go(item.index)">
              <el-icon :size="17"><component :is="item.icon" /></el-icon>
              <span class="menu-text">{{ item.title }}</span>
            </button>
          </template>
        </section>
      </nav>

      <div class="sidebar-footer">
        <div class="school-chip">
          <el-icon :size="15"><School /></el-icon>
          <span>{{ userStore.schoolName || '本校' }}</span>
        </div>
      </div>
    </aside>

    <div class="main-area">
      <header class="top-toolbar">
        <div class="toolbar-left">
          <div class="breadcrumbs">
            <template v-for="(crumb, i) in breadcrumbs" :key="i">
              <span class="crumb" :class="{ clickable: crumb.path }" @click="crumb.path && go(crumb.path)">{{ crumb.title }}</span>
              <span v-if="i < breadcrumbs.length - 1" class="crumb-sep">/</span>
            </template>
          </div>
          <h1 class="toolbar-title">{{ currentTitle }}</h1>
        </div>

        <div class="toolbar-right">
          <span class="toolbar-school">{{ userStore.schoolName || '本校' }}</span>
          <NotificationDropdown />
          <el-dropdown trigger="click">
            <span class="user-trigger">
              <span class="user-avatar">{{ userStore.realName?.charAt(0) || '管' }}</span>
              <span class="user-meta">
                <span class="user-name">{{ userStore.realName || '管理员' }}</span>
                <span class="user-role">{{ userStore.roleName || '学校管理员' }}</span>
              </span>
              <el-icon :size="14"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="go('/school/dashboard')">
                  <el-icon><HomeFilled /></el-icon>管理首页
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="content-area">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.school-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(79, 111, 234, 0.04), rgba(255, 255, 255, 0) 260px),
    var(--color-bg-page);
}

.sidebar {
  width: var(--sidebar-width);
  height: 100vh;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--color-sidebar-bg);
  border-right: 1px solid var(--color-sidebar-border);
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 68px;
  padding: 0 var(--space-5);
  border-bottom: 1px solid var(--color-sidebar-border);
}

.logo-mark {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 10px;
  color: var(--color-text-white);
  background: linear-gradient(135deg, #1D2433, var(--color-primary-500));
  font-size: var(--font-lg);
  font-weight: var(--font-weight-bold);
  box-shadow: 0 10px 22px rgba(79, 111, 234, 0.22);
}

.logo-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.logo-title {
  color: var(--color-text-heading);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  white-space: nowrap;
}

.logo-subtitle {
  margin-top: 2px;
  color: var(--color-text-muted);
  font-family: var(--font-family-data);
  font-size: var(--font-2xs);
  line-height: var(--line-height-tight);
  white-space: nowrap;
}

.sidebar-menu {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4) var(--space-3);
}

.menu-section + .menu-section {
  margin-top: var(--space-4);
}

.menu-section-title {
  padding: 0 var(--space-3) var(--space-2);
  color: var(--color-text-placeholder);
  font-size: var(--font-2xs);
  font-weight: var(--font-weight-bold);
}

.menu-item {
  width: 100%;
  height: 38px;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: 3px;
  padding: 0 var(--space-3);
  border: 0;
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--color-sidebar-text);
  cursor: pointer;
  font-size: var(--font-sm);
  text-align: left;
  transition: color 0.16s ease, background-color 0.16s ease, box-shadow 0.16s ease;
  position: relative;
}

.menu-item:hover {
  color: var(--color-text-heading);
  background: var(--color-sidebar-hover-bg);
}

.menu-item.active {
  color: var(--color-primary-600);
  background: linear-gradient(90deg, var(--color-primary-50), rgba(238, 247, 251, 0.9));
  font-weight: var(--font-weight-semibold);
}

.menu-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 9px;
  bottom: 9px;
  width: 3px;
  border-radius: 0 var(--radius-full) var(--radius-full) 0;
  background: linear-gradient(180deg, var(--color-primary-500), var(--color-accent-school-500));
}

.menu-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-arrow {
  margin-left: auto;
  color: var(--color-text-placeholder);
  transition: transform 0.18s ease;
}

.menu-arrow.expanded {
  transform: rotate(180deg);
}

.menu-children {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.2s ease;
}

.menu-children--expanded {
  max-height: 132px;
}

.menu-child {
  height: 34px;
  padding-left: var(--space-5);
  font-size: var(--font-sm);
}

.child-dot {
  width: 5px;
  height: 5px;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  background: var(--color-border-dark);
}

.menu-child.active .child-dot {
  background: var(--color-primary-500);
}

.sidebar-footer {
  padding: var(--space-4);
  border-top: 1px solid var(--color-sidebar-border);
}

.school-chip {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-primary-100);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--color-primary-50), #F8FBFF);
  color: var(--color-primary-700);
  font-size: var(--font-xs);
  font-weight: var(--font-weight-semibold);
}

.school-chip .el-icon {
  color: var(--color-primary-600);
}

.school-chip span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-toolbar {
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: 0 var(--space-7);
  background: rgba(255, 255, 255, 0.88);
  border-bottom: 1px solid var(--color-sidebar-border);
  backdrop-filter: saturate(140%) blur(14px);
  flex-shrink: 0;
}

.toolbar-left {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-muted);
  font-size: var(--font-xs);
}

.crumb.clickable {
  cursor: pointer;
}

.crumb.clickable:hover {
  color: var(--color-primary);
}

.crumb:last-child {
  color: var(--color-text-secondary);
}

.crumb-sep {
  color: var(--color-text-disabled);
}

.toolbar-title {
  margin: 0;
  color: var(--color-text-heading);
  font-size: var(--font-lg);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
}

.toolbar-school {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 5px var(--space-3);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-full);
  background: var(--color-bg-light);
  color: var(--color-text-secondary);
  font-size: var(--font-xs);
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 5px var(--space-2) 5px 5px;
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background 0.16s ease, border-color 0.16s ease;
}

.user-trigger:hover {
  border-color: var(--color-border-lighter);
  background: var(--color-bg-light);
}

.user-avatar {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--color-primary-100), var(--color-accent-school-100));
  color: var(--color-primary-700);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-bold);
}

.user-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-name {
  color: var(--color-text-heading);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
}

.user-role {
  color: var(--color-text-muted);
  font-size: var(--font-2xs);
  line-height: var(--line-height-tight);
}

.content-area {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5) var(--space-7) var(--space-7);
}

@media (max-width: 1180px) {
  .sidebar {
    width: 220px;
  }

  .top-toolbar,
  .content-area {
    padding-left: var(--space-5);
    padding-right: var(--space-5);
  }
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }

  .top-toolbar {
    height: auto;
    min-height: 64px;
    align-items: flex-start;
    flex-direction: column;
    padding: var(--space-3);
  }

  .toolbar-right {
    width: 100%;
    justify-content: space-between;
  }

  .toolbar-school,
  .user-meta {
    display: none;
  }

  .content-area {
    padding: var(--space-4) var(--space-3);
  }
}
</style>
