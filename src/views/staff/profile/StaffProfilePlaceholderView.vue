<script setup>
import { useRouter } from 'vue-router'
import { User, ArrowRight } from '@element-plus/icons-vue'

defineOptions({ name: 'StaffProfilePlaceholderView' })

const router = useRouter()
</script>

<template>
  <div class="placeholder-page">
    <div class="placeholder-card">
      <el-icon :size="48" class="placeholder-icon"><User /></el-icon>
      <h2 class="placeholder-title">个人信息</h2>
      <p class="placeholder-desc">查看和维护个人基本信息、账号安全与绑定设置</p>
      <el-alert type="info" :closable="false" show-icon>该功能后续开发中，敬请期待</el-alert>
      <el-button type="primary" plain @click="router.push('/staff/dashboard')">
        返回工作台 <el-icon :size="14"><ArrowRight /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.placeholder-page { display: flex; justify-content: center; padding: var(--space-12) 0; }
.placeholder-card { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); background: var(--color-bg-card); border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); padding: var(--space-10) var(--space-12); max-width: 480px; text-align: center; }
.placeholder-icon { color: var(--color-accent-user-700); opacity: 0.6; }
.placeholder-title { font-size: var(--font-xl); font-weight: var(--font-weight-bold); color: var(--color-text-heading); margin: 0; }
.placeholder-desc { font-size: var(--font-sm); color: var(--color-text-muted); margin: 0; line-height: var(--line-height-relaxed); }
.placeholder-card .el-alert { width: 100%; }
.placeholder-card .el-button { margin-top: var(--space-2); }
</style>
