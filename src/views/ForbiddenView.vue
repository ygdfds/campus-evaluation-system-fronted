<script setup>
import { useRouter } from 'vue-router'

defineOptions({ name: 'ForbiddenView' })

const router = useRouter()
</script>

<template>
  <div class="forbidden">
    <div class="content">
      <h1 class="error-code">403</h1>
      <p class="error-msg">当前账号没有访问此页面的权限</p>
      <div class="actions">
        <el-button @click="router.back()">返回上一页</el-button>
        <el-button type="primary" @click="router.push('/')">返回首页</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.forbidden {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-page);
}

.content {
  text-align: center;
}

.error-code {
  margin: 0;
  color: var(--color-primary-500);
  font-size: var(--font-display);
  line-height: var(--line-height-tight);
}

.error-msg {
  margin: var(--space-4) 0 var(--space-6);
  color: var(--color-text-secondary);
  font-size: var(--font-xl);
}

.actions {
  display: flex;
  justify-content: center;
  gap: var(--space-3);
}
</style>
