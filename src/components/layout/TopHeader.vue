<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { SwitchButton, Fold, Expand } from '@element-plus/icons-vue'

defineOptions({ name: 'TopHeader' })

defineProps({
  /** 是否折叠侧边栏 */
  collapsed: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle-sidebar'])

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="top-header">
    <div class="header-left">
      <el-button text @click="emit('toggle-sidebar')">
        <el-icon :size="20">
          <Fold v-if="!collapsed" />
          <Expand v-else />
        </el-icon>
      </el-button>
      <h3 class="page-title">{{ route.meta.title || '' }}</h3>
    </div>
    <div class="header-right">
      <span class="user-name">{{ userStore.realName }}</span>
      <el-tag size="small" :type="userStore.role === 'system_admin' ? 'danger' : 'success'">
        {{ userStore.roleName }}
      </el-tag>
      <el-button type="info" text @click="handleLogout">
        <el-icon><SwitchButton /></el-icon>
        退出登录
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.top-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
  background: var(--color-bg-card);
  border-bottom: var(--border-light);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.page-title {
  font-size: var(--font-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.user-name {
  font-size: var(--font-base);
  color: var(--color-text-regular);
}
</style>
