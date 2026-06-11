<script setup>
import PageHeader from '@/components/common/PageHeader.vue'
defineOptions({ name: 'SchoolFormListView' })
</script>
<template>
  <div class="page-container">
    <PageHeader title="表单管理" subtitle="管理评价表单模板">
      <template #extra><el-button type="primary">创建表单</el-button></template>
    </PageHeader>
    <el-card shadow="hover" class="section-card">
      <el-table :data="[]" stripe style="width: 100%">
        <el-table-column prop="title" label="表单名称" />
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column prop="status" label="状态" width="120" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" />
      </el-table>
    </el-card>
  </div>
</template>
<style scoped>
.page-container { display: flex; flex-direction: column; gap: var(--space-5); }
.section-card { border-radius: var(--radius-lg); }
</style>
