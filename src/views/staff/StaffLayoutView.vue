<script setup>
import { ref } from 'vue'
import { HomeFilled, DataAnalysis, OfficeBuilding } from '@element-plus/icons-vue'
import SidebarNav from '@/components/layout/SidebarNav.vue'
import TopHeader from '@/components/layout/TopHeader.vue'

defineOptions({ name: 'StaffLayoutView' })

const collapsed = ref(false)

const menuItems = [
  { index: '/staff/dashboard', title: '我的概览', icon: HomeFilled },
  {
    index: '/staff/evaluation',
    title: '评价结果',
    icon: DataAnalysis,
    children: [
      { index: '/staff/evaluation/results', title: '评价结果' },
    ],
  },
  { index: '/staff/department', title: '部门管理', icon: OfficeBuilding },
]

function toggleSidebar() {
  collapsed.value = !collapsed.value
}
</script>

<template>
  <el-container class="staff-layout">
    <SidebarNav
      title="教职工端"
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
.staff-layout {
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
