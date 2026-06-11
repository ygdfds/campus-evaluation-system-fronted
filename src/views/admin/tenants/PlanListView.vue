<script setup>
import PageHeader from '@/components/common/PageHeader.vue'
defineOptions({ name: 'AdminPlanListView' })
</script>
<template>
  <div class="page-container">
    <PageHeader title="套餐管理" subtitle="管理平台服务套餐方案">
      <template #extra><el-button type="primary">新增套餐</el-button></template>
    </PageHeader>
    <el-card shadow="hover" class="section-card">
      <el-table :data="[]" stripe style="width: 100%">
        <el-table-column prop="planCode" label="套餐编码" width="120" />
        <el-table-column prop="planName" label="套餐名称" />
        <el-table-column prop="maxUsers" label="最大用户数" width="120" />
        <el-table-column prop="price" label="价格(元/年)" width="120" />
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
