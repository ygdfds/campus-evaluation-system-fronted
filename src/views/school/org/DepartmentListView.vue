<script setup>
import PageHeader from '@/components/common/PageHeader.vue'
defineOptions({ name: 'SchoolDepartmentListView' })
</script>
<template>
  <div class="page-container">
    <PageHeader title="院系管理" subtitle="管理学校院系组织架构">
      <template #extra><el-button type="primary">添加院系</el-button></template>
    </PageHeader>
    <el-card shadow="hover" class="section-card">
      <el-table :data="[]" stripe style="width: 100%">
        <el-table-column prop="name" label="院系名称" />
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column prop="status" label="状态" width="120" />
        <el-table-column label="操作" width="180" />
      </el-table>
    </el-card>
  </div>
</template>
<style scoped>
.page-container { display: flex; flex-direction: column; gap: var(--space-5); }
.section-card { border-radius: var(--radius-lg); }
</style>
