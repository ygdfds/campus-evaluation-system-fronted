<script setup>
import { ref } from 'vue'
import { HomeFilled, EditPen, ChatDotSquare } from '@element-plus/icons-vue'
import SidebarNav from '@/components/layout/SidebarNav.vue'
import TopHeader from '@/components/layout/TopHeader.vue'

defineOptions({ name: 'StudentLayoutView' })

const collapsed = ref(false)

const menuItems = [
  { index: '/student/dashboard', title: '我的概览', icon: HomeFilled },
  {
    index: '/student/evaluation',
    title: '提交评价',
    icon: EditPen,
    children: [
      { index: '/student/evaluation/submit', title: '提交评价' },
      { index: '/student/evaluation/history', title: '评价历史' },
    ],
  },
  { index: '/student/complaint', title: '投诉建议', icon: ChatDotSquare },
]

function toggleSidebar() {
  collapsed.value = !collapsed.value
}
</script>

<template>
  <el-container class="student-layout">
    <SidebarNav
      title="学生端"
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
.student-layout,
.staff-layout {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(79, 111, 234, 0.05), rgba(255, 255, 255, 0) 280px),
    var(--color-bg-page);
}

.main-container {
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
}

.layout-main {
  overflow-y: auto;
  padding: var(--space-5) var(--space-7) var(--space-8);
  background: transparent;
}

@media (max-width: 1180px) {
  .layout-main { padding: var(--space-5); }
}

@media (max-width: 768px) {
  .layout-main { padding: var(--space-4) var(--space-3); }
}
</style>
