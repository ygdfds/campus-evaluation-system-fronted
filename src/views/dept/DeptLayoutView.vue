<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  HomeFilled,
  SwitchButton,
  OfficeBuilding,
} from '@element-plus/icons-vue'

defineOptions({ name: 'DeptLayoutViewPage' })

const router = useRouter()
const userStore = useUserStore()

const menuItems = [
  { index: '/dept/dashboard', title: '部门概览', icon: HomeFilled },
]

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="layout-aside">
      <div class="logo">
        <el-icon :size="24" color="#fff"><OfficeBuilding /></el-icon>
        <span>部门管理端</span>
      </div>
      <el-menu
        :default-active="$route.path"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item
          v-for="item in menuItems"
          :key="item.index"
          :index="item.index"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <h3>{{ $route.meta.title || '部门管理' }}</h3>
        </div>
        <div class="header-right">
          <span class="user-name">{{ userStore.realName }}</span>
          <el-tag size="small" type="warning">{{ userStore.roleName }}</el-tag>
          <el-button type="danger" text @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            退出登录
          </el-button>
        </div>
      </el-header>
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout-container {
  height: 100vh;
}

.layout-aside {
  background-color: #304156;
  overflow-y: auto;
}

.logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e8e8e8;
  background: #fff;
  padding: 0 24px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-name {
  font-size: 14px;
  color: #333;
}

.layout-main {
  background: #f5f7fa;
  padding: 20px;
}
</style>
