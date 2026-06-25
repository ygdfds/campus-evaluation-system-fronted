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
      <el-tag
        size="small"
        :type="userStore.userRole === 'system_admin' ? 'danger' : userStore.userRole === 'school_admin' ? 'warning' : ''"
      >
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
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: 0 var(--space-7);
  background: rgba(255, 255, 255, 0.86);
  border-bottom: 1px solid var(--color-border-lighter);
  backdrop-filter: saturate(140%) blur(14px);
  flex-shrink: 0;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.header-left :deep(.el-button) {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-lg);
  color: var(--color-text-secondary);
}

.page-title {
  margin: 0;
  color: var(--color-text-heading);
  font-size: var(--font-lg);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-name {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text-heading);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
}

.header-right :deep(.el-tag) {
  border-color: var(--color-primary-100);
  background: var(--color-primary-50);
  color: var(--color-primary-700);
}

.header-right :deep(.el-button) {
  color: var(--color-text-secondary);
}

@media (max-width: 768px) {
  .top-header { padding: 0 var(--space-4); }
  .user-name { display: none; }
}
</style>
