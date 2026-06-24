<script setup>
import { User, DataAnalysis, Files } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatCard from '@/components/common/StatCard.vue'
defineOptions({ name: 'SchoolDashboardView' })
const stats = [
  { title: '教职工数', value: 156, icon: User, color: 'primary' },
  { title: '学生数', value: 3200, icon: User, color: 'success' },
  { title: '评测表单', value: 8, icon: Files, color: 'warning' },
  { title: '平均满意度', value: '4.2', icon: DataAnalysis, color: 'primary' },
]
</script>
<template>
  <div class="page-container">
    <PageHeader title="学校概览" subtitle="学校服务质量数据总览">
      <template #extra><el-button type="primary">导出报表</el-button></template>
    </PageHeader>
    <div class="stats-grid">
      <StatCard v-for="item in stats" :key="item.title" :title="item.title" :value="item.value" :icon="item.icon" :color="item.color" />
    </div>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover" class="section-card">
          <template #header><span class="card-title">院系分布</span></template>
          <div class="chart-placeholder">图表区域</div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="section-card">
          <template #header><span class="card-title">评价趋势</span></template>
          <div class="chart-placeholder">图表区域</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
<style scoped>
.page-container { display: flex; flex-direction: column; gap: var(--space-5); }
.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-4); }
.section-card { border-radius: var(--radius-lg); }
.card-title { font-size: var(--font-lg); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); }
.chart-placeholder { height: var(--chart-height); display: flex; align-items: center; justify-content: center; color: var(--color-text-placeholder); background: var(--color-bg-light); border-radius: var(--radius-md); }
@media (max-width: 1366px) { .stats-grid { grid-template-columns: 1fr; } }
@media (max-width: 768px) { .chart-placeholder { height: 200px; } }
</style>
