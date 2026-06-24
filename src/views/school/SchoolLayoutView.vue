<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  HomeFilled, OfficeBuilding, User, Files, DocumentChecked,
  School, ArrowDown, SwitchButton, DataAnalysis, InfoFilled,
} from '@element-plus/icons-vue'
import NotificationDropdown from '@/components/NotificationDropdown.vue'

defineOptions({ name: 'SchoolLayoutView' })

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const menuItems = [
  { index: '/school/dashboard', title: '首页', icon: HomeFilled },
  { index: '/school/audit/list', title: '审核中心', icon: DocumentChecked },
  { index: '/school/org/departments', title: '组织架构', icon: OfficeBuilding },
  {
    index: '/school/users',
    title: '用户管理',
    icon: User,
    children: [
      { index: '/school/users/staff', title: '教职工管理' },
      { index: '/school/users/student', title: '学生管理' },
    ],
  },
  { index: '/school/form/list', title: '评价表单', icon: Files },
  { index: '/school/data/overview', title: '数据概览', icon: DataAnalysis },
  { index: '/school/school-info', title: '学校信息', icon: InfoFilled },
]

// 当前激活的菜单项（前缀匹配）
function isMenuActive(path) {
  return route.path === path || route.path.startsWith(path + '/')
}

// 面包屑
const breadcrumbs = computed(() => {
  const crumbs = [{ title: '学校管理端', path: '/school/dashboard' }]
  const matched = route.matched
  if (matched.length > 1) {
    const current = matched[matched.length - 1]
    if (current.meta?.title && current.path !== '/school/dashboard') {
      crumbs.push({ title: current.meta.title, path: '' })
    }
  }
  // 额外处理子路由的中文名
  const pathMap = {
    '/school/audit/list': '审核中心',
    '/school/org/departments': '组织架构',
    '/school/users/staff': '教职工管理',
    '/school/users/student': '学生管理',
    '/school/form/list': '表单管理',
  }
  if (pathMap[route.path]) {
    crumbs[crumbs.length - 1] = { title: pathMap[route.path], path: '' }
  }
  return crumbs
})

// 展开的子菜单
const expandedMenus = ref(['/school/users'])

function toggleMenu(index) {
  const idx = expandedMenus.value.indexOf(index)
  if (idx >= 0) {
    expandedMenus.value.splice(idx, 1)
  } else {
    expandedMenus.value.push(index)
  }
}

function isExpanded(index) {
  return expandedMenus.value.includes(index)
}

// 判断子菜单是否包含当前路由
function isChildActive(item) {
  if (!item.children) return false
  return item.children.some(c => route.path === c.index) || route.path.startsWith(item.index + '/')
}

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="school-layout">
    <!-- 左侧侧边栏 -->
    <aside class="sidebar">
      <!-- Logo 区 -->
      <div class="sidebar-header">
        <div class="logo-icon">评</div>
        <div class="logo-text">
          <span class="logo-title">校园服务质量评测</span>
          <span class="logo-subtitle">学校管理端</span>
        </div>
      </div>

      <!-- 菜单 -->
      <nav class="sidebar-menu">
        <template v-for="item in menuItems" :key="item.index">
          <!-- 有子菜单 -->
          <div v-if="item.children" class="menu-group">
            <div
              class="menu-item menu-parent"
              :class="{ active: isChildActive(item) }"
              @click="toggleMenu(item.index)"
            >
              <el-icon :size="18"><component :is="item.icon" /></el-icon>
              <span class="menu-text">{{ item.title }}</span>
              <el-icon :size="14" class="menu-arrow" :class="{ expanded: isExpanded(item.index) }">
                <ArrowDown />
              </el-icon>
            </div>
            <div v-show="isExpanded(item.index)" class="menu-children">
              <div
                v-for="child in item.children"
                :key="child.index"
                class="menu-item menu-child"
                :class="{ active: route.path === child.index }"
                @click="router.push(child.index)"
              >
                <span class="menu-text">{{ child.title }}</span>
              </div>
            </div>
          </div>

          <!-- 无子菜单 -->
          <div
            v-else
            class="menu-item"
            :class="{ active: isMenuActive(item.index) }"
            @click="router.push(item.index)"
          >
            <el-icon :size="18"><component :is="item.icon" /></el-icon>
            <span class="menu-text">{{ item.title }}</span>
          </div>
        </template>
      </nav>

      <!-- 底部学校信息 -->
      <div class="sidebar-footer">
        <el-icon :size="16"><School /></el-icon>
        <span>{{ userStore.schoolName || '本校' }}</span>
      </div>
    </aside>

    <!-- 右侧主区域 -->
    <div class="main-area">
      <!-- 顶部工具栏 -->
      <header class="top-toolbar">
        <div class="toolbar-left">
          <div class="breadcrumbs">
            <template v-for="(crumb, i) in breadcrumbs" :key="i">
              <span
                class="crumb"
                :class="{ clickable: crumb.path }"
                @click="crumb.path && router.push(crumb.path)"
              >{{ crumb.title }}</span>
              <span v-if="i < breadcrumbs.length - 1" class="crumb-sep">/</span>
            </template>
          </div>
        </div>
        <div class="toolbar-right">
          <span class="toolbar-school">{{ userStore.schoolName || '本校' }}</span>
          <NotificationDropdown />
          <el-dropdown trigger="click">
            <span class="user-trigger">
              <span class="user-avatar">{{ userStore.realName?.charAt(0) || 'U' }}</span>
              <span class="user-name">{{ userStore.realName }}</span>
              <el-tag size="small" effect="plain" class="role-tag">学校管理员</el-tag>
              <el-icon :size="14"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="router.push('/school/dashboard')">
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

      <!-- 主内容区 -->
      <main class="content-area">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.school-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--color-bg-page);
}

/* ========== 左侧侧边栏 ========== */
.sidebar {
  width: 230px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8faf8;
  border-right: 1px solid #e8ebe8;
  flex-shrink: 0;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0 var(--space-4);
  height: 60px;
  flex-shrink: 0;
  border-bottom: 1px solid #e8ebe8;
}

.logo-icon {
  width: 34px;
  height: 34px;
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-lg);
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
}

.logo-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.logo-title {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-title);
  white-space: nowrap;
  line-height: 1.3;
}

.logo-subtitle {
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
  white-space: nowrap;
  line-height: 1.3;
}

/* 菜单 */
.sidebar-menu {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2) 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-4);
  height: 44px;
  cursor: pointer;
  color: var(--color-text-body);
  font-size: var(--font-sm);
  transition: all 0.15s;
  position: relative;
  user-select: none;
}

.menu-item:hover {
  background: #eef3ee;
  color: var(--color-text-title);
}

.menu-item.active {
  background: var(--color-primary-50, #eef7ee);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.menu-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  background: var(--color-primary);
  border-radius: 0 3px 3px 0;
}

.menu-parent {
  font-weight: var(--font-weight-medium);
}

.menu-arrow {
  margin-left: auto;
  transition: transform 0.2s;
  color: var(--color-text-placeholder);
}

.menu-arrow.expanded {
  transform: rotate(180deg);
}

.menu-children {
  padding-left: 0;
}

.menu-child {
  padding-left: calc(var(--space-4) + 22px);
  height: 40px;
  font-size: var(--font-sm);
}

.menu-child .menu-text {
  font-size: var(--font-sm);
}

.menu-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 底部 */
.sidebar-footer {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid #e8ebe8;
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

/* ========== 右侧主区域 ========== */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

/* 顶部工具栏 */
.top-toolbar {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border-light, #ebeef5);
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
}

.crumb {
  color: var(--color-text-secondary);
}

.crumb.clickable {
  cursor: pointer;
}

.crumb.clickable:hover {
  color: var(--color-primary);
}

.crumb:last-child {
  color: var(--color-text-title);
  font-weight: var(--font-weight-medium);
}

.crumb-sep {
  color: var(--color-text-placeholder);
  margin: 0 2px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.toolbar-school {
  font-size: var(--font-sm);
  color: var(--color-text-body);
  padding: var(--space-1) var(--space-3);
  background: var(--color-bg-light, #f5f7f5);
  border-radius: var(--radius-sm);
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  transition: background 0.2s;
}

.user-trigger:hover {
  background: var(--color-bg-hover);
}

.user-avatar {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-full);
  background: var(--color-primary-50);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  flex-shrink: 0;
}

.user-name {
  font-size: var(--font-sm);
  color: var(--color-text-title);
  font-weight: var(--font-weight-medium);
}

.role-tag {
  font-size: var(--font-xs);
  background: var(--color-primary-50);
  color: var(--color-primary);
  border-color: var(--color-primary-200, #b7e4c7);
}

/* 主内容区 */
.content-area {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5) var(--space-6);
}

/* 响应式 */
@media (max-width: 1366px) {
  .sidebar {
    width: 210px;
  }
  .content-area {
    padding: var(--space-4) var(--space-5);
  }
}
</style>
