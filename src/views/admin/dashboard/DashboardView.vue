<script setup>
import { School, User, DocumentChecked, DataAnalysis } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatCard from '@/components/common/StatCard.vue'
defineOptions({ name: 'AdminDashboardView' })
const stats = [
  { title: '入驻学校', value: 2, icon: School, color: 'primary' },
  { title: '待审核申请', value: 1, icon: DocumentChecked, color: 'warning' },
  { title: '活跃租户', value: 2, icon: User, color: 'success' },
  { title: '平台用户', value: 7, icon: DataAnalysis, color: 'primary' },
]
</script>
<template>
  <div class="page-container">
    <PageHeader title="平台概览" subtitle="系统管理端数据总览" />
    <div class="stats-grid">
      <StatCard v-for="item in stats" :key="item.title" :title="item.title" :value="item.value" :icon="item.icon" :color="item.color" />
    </div>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover" class="section-card">
          <template #header><span class="card-title">租户分布</span></template>
          <div class="chart-placeholder">图表区域</div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="section-card">
          <template #header><span class="card-title">入驻趋势</span></template>
          <div class="chart-placeholder">图表区域</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
<style scoped>
.page-container { display: flex; flex-direction: column; gap: var(--space-5); }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); }
.section-card { border-radius: var(--radius-lg); }
.card-title { font-size: var(--font-lg); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); }
.chart-placeholder { height: 200px; display: flex; align-items: center; justify-content: center; color: var(--color-text-placeholder); background: var(--color-bg-light); border-radius: var(--radius-md); }
@media (max-width: 1200px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
