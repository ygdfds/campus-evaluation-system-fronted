<script setup>
defineOptions({ name: 'UserDashboardViewPage' })
</script>

<template>
  <div class="dashboard">
    <el-card shadow="hover">
      <template #header>
        <span>欢迎使用校园服务质量评测系统</span>
      </template>
      <el-empty description="用户端功能开发中..." />
    </el-card>
  </div>
</template>

<style scoped>
.dashboard {
  height: 100%;
}
</style>
