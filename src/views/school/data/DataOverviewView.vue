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
  padding: 24px 0;
}
.page-header {
  margin-bottom: 24px;
}
.page-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-title, #1a1a1a);
  margin: 0 0 6px;
}
.page-desc {
  font-size: 14px;
  color: var(--color-text-secondary, #8c8c8c);
  margin: 0;
}
.empty-placeholder {
  background: var(--color-bg-card, #fff);
  border-radius: var(--radius-card, 12px);
  border: 1px solid #e8ebe8;
  padding: 60px 24px;
}
</style>
