<script setup>
import PageHeader from '@/components/common/PageHeader.vue'
defineOptions({ name: 'AdminTenantListView' })
</script>
<template>
  <div class="page-container">
    <PageHeader title="租户列表" subtitle="管理平台已入驻学校租户" />
    <el-card shadow="hover" class="section-card">
      <el-table :data="[]" stripe style="width: 100%">
        <el-table-column prop="tenantId" label="租户ID" width="120" />
        <el-table-column prop="schoolName" label="学校名称" />
        <el-table-column prop="planName" label="套餐" width="120" />
        <el-table-column prop="status" label="状态" width="120" />
        <el-table-column prop="createdAt" label="入驻时间" width="180" />
        <el-table-column label="操作" width="180" />
      </el-table>
    </el-card>
  </div>
</template>
<style scoped>
.page-container { display: flex; flex-direction: column; gap: var(--space-5); }
.section-card { border-radius: var(--radius-lg); }
</style>
