<script setup>
import { useRouter } from 'vue-router'

defineOptions({ name: 'NotFoundViewPage' })

const router = useRouter()
</script>

<template>
  <div class="not-found">
    <div class="content">
      <h1 class="error-code">404</h1>
      <p class="error-msg">抱歉，您访问的页面不存在</p>
      <el-button type="primary" @click="router.push('/')">返回首页</el-button>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-page);
}

.content {
  text-align: center;
}

.error-code {
  font-size: var(--font-display);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary-500);
  margin: 0;
  line-height: var(--line-height-tight);
}

.error-msg {
  font-size: var(--font-xl);
  color: var(--color-text-secondary);
  margin: var(--space-4) 0 var(--space-8);
}
</style>
