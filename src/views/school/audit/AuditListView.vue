<script setup>
import PageHeader from '@/components/common/PageHeader.vue'
defineOptions({ name: 'SchoolAuditListView' })
</script>
<template>
  <div class="page-container">
    <PageHeader title="审核中心" subtitle="审核评价表单发布申请" />
    <el-card shadow="hover" class="section-card">
      <el-table :data="[]" stripe style="width: 100%">
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column prop="submitter" label="提交人" width="120" />
        <el-table-column prop="status" label="状态" width="120" />
        <el-table-column prop="createdAt" label="提交时间" width="180" />
        <el-table-column label="操作" width="180" />
      </el-table>
    </el-card>
  </div>
</template>
<style scoped>
.page-container { display: flex; flex-direction: column; gap: var(--space-5); }
.section-card { border-radius: var(--radius-lg); }
</style>
