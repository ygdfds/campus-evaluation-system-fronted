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
.student-layout {
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
