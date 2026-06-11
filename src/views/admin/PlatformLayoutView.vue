<script setup>
import { ref } from 'vue'
import { HomeFilled, School, User, Setting, DocumentChecked } from '@element-plus/icons-vue'
import SidebarNav from '@/components/layout/SidebarNav.vue'
import TopHeader from '@/components/layout/TopHeader.vue'

defineOptions({ name: 'PlatformLayoutView' })

const collapsed = ref(false)

const menuItems = [
  { index: '/admin/dashboard', title: '平台概览', icon: HomeFilled },
  {
    index: '/admin/tenants',
    title: '租户管理',
    icon: School,
    children: [
      { index: '/admin/tenants/list', title: '租户列表' },
      { index: '/admin/tenants/plans', title: '套餐管理' },
    ],
  },
  { index: '/admin/onboarding/audit', title: '入驻审核', icon: DocumentChecked },
  {
    index: '/admin/users',
    title: '用户管理',
    icon: User,
    children: [
      { index: '/admin/users/list', title: '用户列表' },
      { index: '/admin/users/roles', title: '角色管理' },
    ],
  },
  { index: '/admin/system', title: '系统设置', icon: Setting },
]

function toggleSidebar() {
  collapsed.value = !collapsed.value
}
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
  height: 100vh;
}

.main-container {
  flex-direction: column;
  overflow: hidden;
}

.layout-main {
  background: var(--color-bg-page);
  padding: var(--space-5);
  overflow-y: auto;
}
</style>
