<script setup>
import { onMounted, ref } from 'vue'
import { Files, HomeFilled, Monitor, School, User, Setting, DocumentChecked } from '@element-plus/icons-vue'
import SidebarNav from '@/components/layout/SidebarNav.vue'
import TopHeader from '@/components/layout/TopHeader.vue'
import { getAdminMenuApi } from '@/api/system'

defineOptions({ name: 'PlatformLayoutView' })

const collapsed = ref(false)
const menuItems = ref([])

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
  const response = await getAdminMenuApi()
  menuItems.value = (response.data?.list || []).map((item) => ({
    ...item,
    icon: iconMap[item.icon],
  }))
})
</script>

<template>
  <el-container class="platform-layout">
    <SidebarNav
      title="系统管理端"
      :menu-items="menuItems"
      :collapsed="collapsed"
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
  --admin-accent: #009688;
  --admin-accent-hover: #00897b;
  --admin-sidebar-bg: #edf0f2;
  --admin-sidebar-border: #dfe3e6;
  --admin-page-bg: #f3f4f6;
  --admin-card-border: #e3e6ea;
  --admin-text: #30363d;
  --admin-muted: #69727d;
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
  flex: 0 0 220px;
  width: 220px;
  min-width: 220px;
  max-width: 220px;
  background: var(--admin-sidebar-bg);
  border-right: 1px solid var(--admin-sidebar-border);
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
  height: 50px;
  justify-content: flex-start;
  padding: 0 var(--space-4);
  color: var(--admin-text);
  background: #f7f8f9;
  border-bottom: 1px solid var(--admin-sidebar-border);
}

.platform-layout :deep(.sidebar-logo .logo-icon) {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: var(--admin-accent);
  font-size: var(--font-base);
}

.platform-layout :deep(.sidebar-logo .logo-title) {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--admin-text);
}

.platform-layout :deep(.sidebar-nav .el-menu) {
  --el-menu-bg-color: var(--admin-sidebar-bg);
  --el-menu-text-color: #4c5661;
  --el-menu-hover-bg-color: #e3e7ea;
  background: var(--admin-sidebar-bg) !important;
  padding: var(--space-2) 0;
}

.platform-layout :deep(.sidebar-nav .el-menu-item),
.platform-layout :deep(.sidebar-nav .el-sub-menu__title) {
  height: 42px;
  margin: 0;
  border-radius: 0;
  color: #4c5661 !important;
}

.platform-layout :deep(.sidebar-nav .el-menu-item:hover),
.platform-layout :deep(.sidebar-nav .el-sub-menu__title:hover) {
  background: #e3e7ea !important;
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
  background: rgba(255, 255, 255, 0.8);
}

.platform-layout :deep(.sidebar-nav .el-menu-item.is-active .el-icon),
.platform-layout :deep(.sidebar-nav .el-menu-item.is-active span) {
  color: #fff !important;
}

.platform-layout :deep(.sidebar-nav .el-icon) {
  color: #5f6b76;
}

.platform-layout :deep(.top-header) {
  height: 48px;
  padding: 0 var(--space-4);
  background: #ffffff;
  border-bottom: 1px solid var(--admin-card-border);
  box-shadow: none;
}

.platform-layout :deep(.top-header .page-title) {
  color: var(--admin-text);
  font-size: var(--font-base);
}

.platform-layout :deep(.top-header .el-button.is-text) {
  color: var(--admin-muted);
}

.platform-layout :deep(.top-header .el-button.is-text:hover) {
  color: var(--admin-accent);
  background: #eef7f6;
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
  font-size: 20px;
  letter-spacing: 0;
  color: var(--admin-text);
}

.layout-main :deep(.header-desc) {
  margin-top: var(--space-1);
  color: var(--admin-muted);
}

.layout-main :deep(.page-section) {
  border: 1px solid var(--admin-card-border);
  border-radius: var(--radius-sm);
  box-shadow: none;
  overflow: hidden;
}

.layout-main :deep(.page-section > .el-card__header) {
  min-height: 42px;
  padding: 0 var(--space-4);
  display: flex;
  align-items: center;
  background: #ffffff;
  border-bottom: 1px solid var(--admin-card-border);
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
  border: 1px solid var(--admin-card-border);
  border-radius: var(--radius-sm);
  box-shadow: none;
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
  font-size: 22px;
}

.layout-main :deep(.stat-title),
.layout-main :deep(.stat-desc) {
  margin-top: 2px;
}

.layout-main :deep(.stat-card:hover) {
  transform: none;
  border-color: rgba(0, 150, 136, 0.38);
  box-shadow: none;
  background: #fbfefd;
}

.layout-main :deep(.section-actions) {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  padding: var(--space-3);
  background: #ffffff;
  border: 1px solid var(--admin-card-border);
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
  border-radius: 0;
  overflow: hidden;
  max-width: 100%;
  color: #4d5660;
}

.layout-main :deep(.el-table__inner-wrapper),
.layout-main :deep(.el-table__body-wrapper),
.layout-main :deep(.el-scrollbar) {
  max-width: 100%;
}

.layout-main :deep(.el-table th.el-table__cell) {
  height: 40px;
  background: #f1f3f5;
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
  background: #f5faf9 !important;
}

.layout-main :deep(.el-button) {
  border-radius: var(--radius-sm);
}

.layout-main :deep(.el-button--primary) {
  --el-button-bg-color: var(--admin-accent);
  --el-button-border-color: var(--admin-accent);
  --el-button-hover-bg-color: var(--admin-accent-hover);
  --el-button-hover-border-color: var(--admin-accent-hover);
  --el-button-active-bg-color: #00796b;
  --el-button-active-border-color: #00796b;
}

.layout-main :deep(.el-input__wrapper),
.layout-main :deep(.el-select__wrapper),
.layout-main :deep(.el-textarea__inner) {
  border-radius: var(--radius-sm);
  box-shadow: 0 0 0 1px var(--admin-card-border) inset;
}

.layout-main :deep(.el-input__wrapper:hover),
.layout-main :deep(.el-select__wrapper:hover),
.layout-main :deep(.el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px #cfd6dc inset;
}

.layout-main :deep(.el-input__wrapper.is-focus),
.layout-main :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px var(--admin-accent) inset;
}

.layout-main :deep(.el-dialog) {
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.layout-main :deep(.el-dialog__header) {
  margin-right: 0;
  padding: var(--space-4) var(--space-5) var(--space-3);
  border-bottom: 1px solid rgba(235, 238, 245, 0.9);
}

.layout-main :deep(.el-dialog__body) {
  padding: var(--space-4) var(--space-5);
}

.layout-main :deep(.el-dialog__footer) {
  padding: var(--space-3) var(--space-5);
  background: var(--color-bg-light);
  border-top: 1px solid rgba(235, 238, 245, 0.9);
}

.layout-main :deep(.chart-panel) {
  height: 240px;
  padding: var(--space-1);
  background: #ffffff;
  border: 1px solid var(--admin-card-border);
  border-radius: var(--radius-sm);
}

.layout-main :deep(.chart-bars) {
  padding: var(--space-2) 0;
}

.layout-main :deep(.chart-track) {
  background: #edf1f3;
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
