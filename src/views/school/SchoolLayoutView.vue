<script setup>
import { ref } from 'vue'
import { HomeFilled, OfficeBuilding, User, DataAnalysis, Files, DocumentChecked } from '@element-plus/icons-vue'
import SidebarNav from '@/components/layout/SidebarNav.vue'
import TopHeader from '@/components/layout/TopHeader.vue'

defineOptions({ name: 'SchoolLayoutView' })

const collapsed = ref(false)

const menuItems = [
  { index: '/school/dashboard', title: '学校概览', icon: HomeFilled },
  {
    index: '/school/org',
    title: '组织架构',
    icon: OfficeBuilding,
    children: [
      { index: '/school/org/departments', title: '院系管理' },
    ],
  },
  {
    index: '/school/users',
    title: '用户管理',
    icon: User,
    children: [
      { index: '/school/users/staff', title: '教职工管理' },
      { index: '/school/users/student', title: '学生管理' },
    ],
  },
  {
    index: '/school/form',
    title: '表单管理',
    icon: Files,
    children: [
      { index: '/school/form/list', title: '表单列表' },
    ],
  },
  {
    index: '/school/evaluation',
    title: '评测管理',
    icon: DataAnalysis,
    children: [
      { index: '/school/evaluation/list', title: '评测列表' },
      { index: '/school/evaluation/stats', title: '统计分析' },
    ],
  },
  {
    index: '/school/audit',
    title: '审核管理',
    icon: DocumentChecked,
    children: [
      { index: '/school/audit/list', title: '审核列表' },
    ],
  },
]

function toggleSidebar() {
  collapsed.value = !collapsed.value
}
</script>

<template>
  <el-container class="school-layout">
    <SidebarNav
      title="学校管理端"
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
.school-layout {
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
