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
