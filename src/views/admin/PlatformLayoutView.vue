<script setup>
import { computed, onMounted, ref } from 'vue'
import { Files, HomeFilled, Monitor, School, User, Setting, DocumentChecked } from '@element-plus/icons-vue'
import SidebarNav from '@/components/layout/SidebarNav.vue'
import TopHeader from '@/components/layout/TopHeader.vue'
import { getAdminMenuApi } from '@/api/system'

defineOptions({ name: 'PlatformLayoutView' })

const collapsed = ref(false)
const menuItems = ref([])
const menuLoading = ref(false)
const menuError = ref('')

const iconMap = {
  HomeFilled,
  School,
  User,
  Setting,
  DocumentChecked,
  Monitor,
  Files,
}

function toggleSidebar() {
  collapsed.value = !collapsed.value
}

onMounted(async () => {
  menuLoading.value = true
  menuError.value = ''
  try {
    const response = await getAdminMenuApi()
    menuItems.value = (response.data?.list || []).map((item) => ({
      ...item,
      icon: iconMap[item.icon],
    }))
  } catch (error) {
    menuError.value = error.message || '菜单加载失败'
    menuItems.value = []
  } finally {
    menuLoading.value = false
  }
})

const menuGroups = computed(() => {
  if (!menuItems.value.length) return []
  const groups = []
  const groupMap = new Map()
  for (const item of menuItems.value) {
    const groupName = item.group || '其他'
    if (!groupMap.has(groupName)) {
      const group = { title: groupName, items: [] }
      groupMap.set(groupName, group)
      groups.push(group)
    }
    groupMap.get(groupName).items.push(item)
  }
  return groups
})
</script>

<template>
  <el-container class="platform-layout">
    <SidebarNav
      v-loading="menuLoading"
      title="校园服务质量在线评测系统"
      :menu-items="menuItems"
      :menu-groups="menuGroups"
      :collapsed="collapsed"
    />
    <el-alert
      v-if="menuError"
      class="menu-error"
      type="error"
      :title="menuError"
      show-icon
      closable
      @close="menuError = ''"
    />
    <el-container class="main-container">
      <TopHeader :collapsed="collapsed" @toggle-sidebar="toggleSidebar" />
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.platform-layout {
  --admin-accent: var(--color-primary-500);
  --admin-accent-hover: var(--color-primary-600);
  --admin-accent-active: var(--color-primary-700);
  --admin-sidebar-bg: var(--color-sidebar-bg);
  --admin-sidebar-border: var(--color-sidebar-border);
  --admin-page-bg: var(--color-bg-page);
  --admin-card-border: var(--color-border-lighter);
  --admin-text: var(--color-text-regular);
  --admin-muted: var(--color-text-muted);
  --admin-menu-text: var(--color-sidebar-text);
  --admin-menu-hover-bg: var(--color-sidebar-hover-bg);
  --admin-logo-bg: var(--color-bg-light);
  --admin-table-header-bg: var(--color-bg-light);
  --admin-table-row-hover-bg: var(--color-primary-50);
  --admin-text-btn-hover-bg: var(--color-primary-50);
  --admin-chart-track-bg: var(--color-bg-light);
  --admin-stat-hover-border: var(--color-primary-300);
  --admin-stat-hover-bg: var(--color-bg-subtle);
  --admin-dialog-border: var(--color-border-lighter);
  height: 100vh;
  background: var(--admin-page-bg);
}

.main-container {
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.layout-main {
  background: var(--admin-page-bg);
  padding: var(--space-4);
  overflow-y: auto;
  min-width: 0;
  scrollbar-gutter: stable;
}

.platform-layout :deep(.sidebar-nav) {
  flex: 0 0 252px;
  width: 252px;
  min-width: 252px;
  max-width: 252px;
  background: var(--admin-sidebar-bg);
  border-right: var(--border-width) var(--border-style) var(--admin-sidebar-border);
  overflow-x: hidden;
  scrollbar-gutter: stable;
}

.platform-layout :deep(.sidebar-nav.is-collapsed) {
  flex-basis: 64px;
  width: 64px;
  min-width: 64px;
  max-width: 64px;
}

.platform-layout :deep(.sidebar-logo) {
  height: 68px;
  justify-content: flex-start;
  padding: 0 var(--space-5);
  color: var(--admin-text);
  background: var(--admin-logo-bg);
  border-bottom: var(--border-width) var(--border-style) var(--admin-sidebar-border);
}

.platform-layout :deep(.sidebar-logo .logo-icon) {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, #1D2433, var(--color-primary-500));
  font-size: var(--font-lg);
  box-shadow: 0 10px 22px rgba(79, 111, 234, 0.22);
}

.platform-layout :deep(.sidebar-logo .logo-title) {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
}

.platform-layout :deep(.sidebar-nav .el-menu) {
  --el-menu-bg-color: var(--admin-sidebar-bg);
  --el-menu-text-color: var(--admin-menu-text);
  --el-menu-hover-bg-color: var(--admin-menu-hover-bg);
  background: var(--admin-sidebar-bg) !important;
  padding: var(--space-2) 0;
}

.platform-layout :deep(.sidebar-nav .el-menu-item),
.platform-layout :deep(.sidebar-nav .el-sub-menu__title) {
  height: 42px;
  margin: 0;
  border-radius: var(--radius-none);
  color: var(--admin-menu-text) !important;
}

.platform-layout :deep(.sidebar-nav .el-menu-item:hover),
.platform-layout :deep(.sidebar-nav .el-sub-menu__title:hover) {
  background: var(--admin-menu-hover-bg) !important;
  color: var(--admin-text) !important;
}

.platform-layout :deep(.sidebar-nav .el-menu-item.is-active) {
  background: var(--admin-accent) !important;
  color: #fff !important;
  font-weight: var(--font-weight-semibold);
}

.platform-layout :deep(.sidebar-nav .el-menu-item.is-active::before) {
  content: '';
  width: 3px;
  align-self: stretch;
  margin-left: -20px;
  margin-right: 17px;
  background: var(--color-text-white);
}

.platform-layout :deep(.sidebar-nav .el-menu-item.is-active .el-icon),
.platform-layout :deep(.sidebar-nav .el-menu-item.is-active span) {
  color: #fff !important;
}

.platform-layout :deep(.sidebar-nav .el-icon) {
  color: var(--color-sidebar-text);
}

.platform-layout :deep(.top-header) {
  height: 68px;
  padding: 0 var(--space-7);
  background: rgba(255, 255, 255, 0.88);
  border-bottom: var(--border-width) var(--border-style) var(--color-sidebar-border);
  box-shadow: var(--shadow-none);
  backdrop-filter: saturate(140%) blur(14px);
}

.platform-layout :deep(.top-header .page-title) {
  color: var(--color-text-heading);
  font-size: var(--font-lg);
  font-weight: var(--font-weight-bold);
}

.platform-layout :deep(.top-header .el-button.is-text) {
  color: var(--admin-muted);
}

.platform-layout :deep(.top-header .el-button.is-text:hover) {
  color: var(--admin-accent);
  background: var(--admin-text-btn-hover-bg);
}

.layout-main :deep(.page-container) {
  width: 100%;
  max-width: none;
  margin: 0;
  gap: var(--space-4);
}

.layout-main :deep(.page-header) {
  margin-bottom: 0;
  padding: 0;
}

.layout-main :deep(.header-title) {
  font-size: var(--font-2xl);
  letter-spacing: 0;
  color: var(--admin-text);
}

.layout-main :deep(.header-desc) {
  margin-top: var(--space-1);
  color: var(--admin-muted);
}

.layout-main :deep(.page-section) {
  border: var(--border-width) var(--border-style) var(--admin-card-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-none);
  overflow: hidden;
}

.layout-main :deep(.page-section > .el-card__header) {
  min-height: 42px;
  padding: 0 var(--space-4);
  display: flex;
  align-items: center;
  background: var(--color-bg-card);
  border-bottom: var(--border-width) var(--border-style) var(--admin-card-border);
}

.layout-main :deep(.page-section > .el-card__header > *) {
  min-width: 0;
  width: 100%;
}

.layout-main :deep(.card-header) {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.layout-main :deep(.card-header span) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--admin-text);
  font-weight: var(--font-weight-semibold);
}

.layout-main :deep(.card-header .el-button) {
  flex: 0 0 auto;
}

.layout-main :deep(.page-section > .el-card__body) {
  padding: var(--space-4);
  min-width: 0;
}

.layout-main :deep(.section-title) {
  font-size: var(--font-base);
  font-weight: var(--font-weight-semibold);
  color: var(--admin-text);
}

.layout-main :deep(.stats-grid) {
  gap: var(--space-3);
}

.layout-main :deep(.stat-card) {
  border: var(--border-width) var(--border-style) var(--admin-card-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-none);
  gap: var(--space-3);
  min-height: 82px;
  padding: var(--space-4);
  transition: border-color 0.16s ease, background-color 0.16s ease;
}

.layout-main :deep(.stat-icon) {
  width: 40px;
  height: 40px;
}

.layout-main :deep(.stat-value) {
  font-size: var(--font-3xl);
}

.layout-main :deep(.stat-title),
.layout-main :deep(.stat-desc) {
  margin-top: 2px;
}

.layout-main :deep(.stat-card:hover) {
  transform: none;
  border-color: var(--admin-stat-hover-border);
  box-shadow: var(--shadow-none);
  background: var(--admin-stat-hover-bg);
}

.layout-main :deep(.section-actions) {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  padding: var(--space-3);
  background: var(--color-bg-card);
  border: var(--border-width) var(--border-style) var(--admin-card-border);
  border-radius: var(--radius-sm);
}

.layout-main :deep(.el-form--inline) {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--space-1) var(--space-2);
}

.layout-main :deep(.el-form--inline .el-form-item) {
  margin-right: 0;
  margin-bottom: var(--space-1);
}

.layout-main :deep(.el-form--inline .el-form-item:last-child) {
  margin-left: auto;
}

.layout-main :deep(.el-table) {
  --el-table-border-color: var(--admin-card-border);
  border-radius: var(--radius-none);
  overflow: hidden;
  max-width: 100%;
  color: var(--color-text-body);
}

.layout-main :deep(.el-table__inner-wrapper),
.layout-main :deep(.el-table__body-wrapper),
.layout-main :deep(.el-scrollbar) {
  max-width: 100%;
}

.layout-main :deep(.el-table th.el-table__cell) {
  height: 40px;
  background: var(--admin-table-header-bg);
  color: var(--admin-text);
  font-weight: var(--font-weight-semibold);
}

.layout-main :deep(.el-table .el-table__cell) {
  padding: var(--space-2) 0;
}

.layout-main :deep(.el-table__row) {
  transition: background-color 0.16s ease;
}

.layout-main :deep(.el-table__row:hover > td.el-table__cell) {
  background: var(--admin-table-row-hover-bg) !important;
}

.layout-main :deep(.el-button) {
  border-radius: var(--radius-sm);
}

.layout-main :deep(.el-button--primary) {
  --el-button-bg-color: var(--admin-accent);
  --el-button-border-color: var(--admin-accent);
  --el-button-hover-bg-color: var(--admin-accent-hover);
  --el-button-hover-border-color: var(--admin-accent-hover);
  --el-button-active-bg-color: var(--admin-accent-active);
  --el-button-active-border-color: var(--admin-accent-active);
}

.layout-main :deep(.el-input__wrapper),
.layout-main :deep(.el-select__wrapper),
.layout-main :deep(.el-textarea__inner) {
  border-radius: var(--radius-sm);
  box-shadow: 0 0 0 var(--border-width) var(--admin-card-border) inset;
}

.layout-main :deep(.el-input__wrapper:hover),
.layout-main :deep(.el-select__wrapper:hover),
.layout-main :deep(.el-textarea__inner:hover) {
  box-shadow: 0 0 0 var(--border-width) var(--color-border-dark) inset;
}

.layout-main :deep(.el-input__wrapper.is-focus),
.layout-main :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 var(--border-width) var(--admin-accent) inset;
}

.layout-main :deep(.el-dialog) {
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.layout-main :deep(.el-dialog__header) {
  margin-right: 0;
  padding: var(--space-4) var(--space-5) var(--space-3);
  border-bottom: var(--border-width) var(--border-style) var(--admin-dialog-border);
}

.layout-main :deep(.el-dialog__body) {
  padding: var(--space-4) var(--space-5);
}

.layout-main :deep(.el-dialog__footer) {
  padding: var(--space-3) var(--space-5);
  background: var(--color-bg-light);
  border-top: var(--border-width) var(--border-style) var(--admin-dialog-border);
}

.layout-main :deep(.chart-panel) {
  height: 240px;
  padding: var(--space-1);
  background: var(--color-bg-card);
  border: var(--border-width) var(--border-style) var(--admin-card-border);
  border-radius: var(--radius-sm);
}

.layout-main :deep(.chart-bars) {
  padding: var(--space-2) 0;
}

.layout-main :deep(.chart-track) {
  background: var(--admin-chart-track-bg);
}

@media (max-width: 1200px) {
  .layout-main {
    padding: var(--space-4);
  }
}

@media (max-width: 768px) {
  .layout-main {
    padding: var(--space-3);
  }

  .layout-main :deep(.page-header) {
    align-items: flex-start;
    flex-direction: column;
    gap: var(--space-3);
  }

  .layout-main :deep(.card-header) {
    align-items: flex-start;
    flex-direction: column;
  }

  .layout-main :deep(.page-section > .el-card__body) {
    padding: var(--space-3);
  }

  .layout-main :deep(.el-form--inline .el-form-item:last-child) {
    margin-left: 0;
  }
}
</style>
