<script setup>
defineOptions({ name: 'SchoolDataOverview' })
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2>数据概览</h2>
      <p class="page-desc">本校评价数据、服务质量与运营指标的综合分析</p>
    </div>
    <div class="empty-placeholder">
      <el-empty description="数据概览模块开发中，敬请期待" :image-size="120" />
    </div>
  </div>
</template>

<style scoped>
.page-container {
  padding: var(--space-6) 0;
}
.page-header {
  margin-bottom: var(--space-6);
}
.page-header h2 {
  font-size: var(--font-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-1);
}
.page-desc {
  font-size: var(--font-base);
  color: var(--color-text-secondary);
  margin: 0;
}
.empty-placeholder {
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  border: var(--border-light);
  padding: var(--space-14) var(--space-6);
}
</style>
