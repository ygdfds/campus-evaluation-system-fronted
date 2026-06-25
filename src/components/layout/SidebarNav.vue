<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

defineOptions({ name: 'SidebarNav' })

defineProps({
  /** 侧边栏标题 */
  title: { type: String, required: true },
  /** 菜单项数组: { index, title, icon, children? } */
  menuItems: { type: Array, required: true },
  /** 是否折叠 */
  collapsed: { type: Boolean, default: false },
})

const route = useRoute()
const activeIndex = computed(() => route.path)
</script>

<template>
  <div class="sidebar-nav" :class="{ 'is-collapsed': collapsed }">
    <!-- Logo 区域 -->
    <div class="sidebar-logo">
      <slot name="logo">
        <div class="logo-icon">评</div>
      </slot>
      <span v-show="!collapsed" class="logo-title">{{ title }}</span>
    </div>

    <!-- 菜单 -->
    <el-menu
      :default-active="activeIndex"
      :collapse="collapsed"
      router
      :collapse-transition="false"
      background-color="var(--color-sidebar-bg)"
      text-color="var(--color-sidebar-text)"
      active-text-color="var(--color-sidebar-active)"
    >
      <template v-for="item in menuItems" :key="item.index">
        <!-- 有子菜单 -->
        <el-sub-menu v-if="item.children && item.children.length" :index="item.index">
          <template #title>
            <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
            <span>{{ item.title }}</span>
          </template>
          <el-menu-item
            v-for="child in item.children"
            :key="child.index"
            :index="child.index"
          >
            <el-icon v-if="child.icon"><component :is="child.icon" /></el-icon>
            <span>{{ child.title }}</span>
          </el-menu-item>
        </el-sub-menu>

        <!-- 无子菜单 -->
        <el-menu-item v-else :index="item.index">
          <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
          <template #title>
            <span>{{ item.title }}</span>
          </template>
        </el-menu-item>
      </template>
    </el-menu>
  </div>
</template>

<style scoped>
.sidebar-nav {
  width: 224px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.92);
  border-right: 1px solid var(--color-border-lighter);
  transition: width 0.22s ease;
}

.sidebar-nav.is-collapsed { width: 72px; }

.sidebar-logo {
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--space-3);
  padding: 0 var(--space-5);
  color: var(--color-text-heading);
  border-bottom: 1px solid var(--color-border-lighter);
  flex-shrink: 0;
  overflow: hidden;
  white-space: nowrap;
}

.sidebar-nav.is-collapsed .sidebar-logo { justify-content: center; padding: 0; }

.logo-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, #1D2433, var(--color-primary-500));
  color: var(--color-text-white);
  font-size: var(--font-lg);
  font-weight: var(--font-weight-bold);
  box-shadow: 0 10px 22px rgba(79, 111, 234, 0.2);
}

.logo-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-text-heading);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-bold);
}

.sidebar-nav :deep(.el-menu) {
  flex: 1;
  border-right: none;
  padding: var(--space-4) var(--space-3);
  background: transparent !important;
}

.sidebar-nav :deep(.el-menu-item),
.sidebar-nav :deep(.el-sub-menu__title) {
  height: 40px;
  margin-bottom: 4px;
  padding: 0 var(--space-3) !important;
  border-radius: var(--radius-lg);
  color: var(--color-text-secondary) !important;
  font-size: var(--font-sm);
  font-weight: var(--font-weight-medium);
  transition: color 0.16s ease, background-color 0.16s ease;
}

.sidebar-nav :deep(.el-sub-menu .el-menu-item) {
  height: 36px;
  margin-left: var(--space-2);
  padding-left: var(--space-8) !important;
  font-size: var(--font-sm);
}

.sidebar-nav :deep(.el-menu-item:hover),
.sidebar-nav :deep(.el-sub-menu__title:hover) {
  background: var(--color-primary-50) !important;
  color: var(--color-text-heading) !important;
}

.sidebar-nav :deep(.el-menu-item.is-active) {
  position: relative;
  background: linear-gradient(90deg, var(--color-primary-50), rgba(238, 247, 251, 0.9)) !important;
  color: var(--color-primary-600) !important;
  font-weight: var(--font-weight-semibold);
}

.sidebar-nav :deep(.el-menu-item.is-active::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 9px;
  bottom: 9px;
  width: 3px;
  border-radius: 0 var(--radius-full) var(--radius-full) 0;
  background: linear-gradient(180deg, var(--color-primary-500), var(--color-accent-school-500));
}

.sidebar-nav :deep(.el-menu-item .el-icon),
.sidebar-nav :deep(.el-sub-menu__title .el-icon) { color: inherit; }
</style>
