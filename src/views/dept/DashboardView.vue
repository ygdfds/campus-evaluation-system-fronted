<script setup>
defineOptions({ name: 'DeptDashboardViewPage' })
</script>

<template>
  <div class="dashboard">
    <el-card shadow="hover">
      <template #header>
        <span>部门管理概览</span>
      </template>
      <el-empty description="部门管理端功能开发中..." />
    </el-card>
  </div>
</template>

<style scoped>
.dashboard {
  height: 100%;
}
</style>
