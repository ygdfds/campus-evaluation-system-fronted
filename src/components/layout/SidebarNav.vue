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
  width: 220px;
  height: 100%;
  background-color: var(--color-sidebar-bg);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  transition: width 0.3s;
}

.sidebar-nav.is-collapsed {
  width: 64px;
}

.sidebar-logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  color: var(--color-text-white);
  font-size: var(--font-lg);
  font-weight: var(--font-weight-semibold);
  border-bottom: 1px solid var(--logo-border-bottom, rgba(255, 255, 255, 0.1));
  flex-shrink: 0;
  overflow: hidden;
  white-space: nowrap;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: var(--color-primary-500);
  color: var(--color-text-white);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-xl);
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
}

.logo-title {
  font-size: var(--font-base);
}

.sidebar-nav :deep(.el-menu) {
  border-right: none;
  flex: 1;
}

.sidebar-nav :deep(.el-menu-item.is-active) {
  background-color: var(--color-primary-500) !important;
  color: var(--color-text-white) !important;
}

.sidebar-nav :deep(.el-menu-item:hover) {
  background-color: var(--color-sidebar-hover-bg) !important;
}
</style>
