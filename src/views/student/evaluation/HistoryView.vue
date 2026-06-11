<script setup>
import PageHeader from '@/components/common/PageHeader.vue'

defineOptions({ name: 'StudentEvaluationHistoryView' })
</script>

<template>
  <div class="page-container">
    <PageHeader title="评价历史" subtitle="查看已提交的评价记录" />
    <el-card shadow="hover" class="section-card">
      <el-table :data="[]" stripe style="width: 100%">
        <el-table-column prop="formTitle" label="评价表单" />
        <el-table-column prop="targetName" label="评价对象" />
        <el-table-column prop="overallScore" label="综合评分" width="120" />
        <el-table-column prop="submittedAt" label="提交时间" width="180" />
        <el-table-column label="操作" width="120" />
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: var(--space-5); }
.section-card { border-radius: var(--radius-lg); }
</style>
