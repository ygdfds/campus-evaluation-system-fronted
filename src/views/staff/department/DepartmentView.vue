<script setup>
import PageHeader from '@/components/common/PageHeader.vue'
defineOptions({ name: 'StaffDepartmentView' })
</script>
<template>
  <div class="page-container">
    <PageHeader title="部门管理" subtitle="查看所在部门信息" />
    <el-card shadow="hover" class="section-card">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="部门名称">计算机科学与技术系</el-descriptions-item>
        <el-descriptions-item label="部门类型">教学部门</el-descriptions-item>
        <el-descriptions-item label="负责人">待定</el-descriptions-item>
        <el-descriptions-item label="状态">正常</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>
<style scoped>
.page-container { display: flex; flex-direction: column; gap: var(--space-5); }
.section-card { border-radius: var(--radius-lg); }
</style>
