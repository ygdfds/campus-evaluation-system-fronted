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
  background: #f5f7fa;
}

.content {
  text-align: center;
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  color: #409eff;
  margin: 0;
  line-height: 1;
}

.error-msg {
  font-size: 18px;
  color: #666;
  margin: 16px 0 32px;
}
</style>
