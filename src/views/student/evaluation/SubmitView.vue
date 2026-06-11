<script setup>
import PageHeader from '@/components/common/PageHeader.vue'
import EmptyPlaceholder from '@/components/common/EmptyPlaceholder.vue'

defineOptions({ name: 'StudentEvaluationSubmitView' })
</script>

<template>
  <div class="page-container">
    <PageHeader title="提交评价" subtitle="选择待评价的服务项目进行评价" />
    <el-card shadow="hover" class="section-card">
      <EmptyPlaceholder description="请选择要评价的服务项目" />
    </el-card>
  </div>
</template>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: var(--space-5); }
.section-card { border-radius: var(--radius-lg); }
</style>
