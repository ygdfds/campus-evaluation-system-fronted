<script setup>
import PageHeader from '@/components/common/PageHeader.vue'
import StatusTag from '@/components/common/StatusTag.vue'
defineOptions({ name: 'AdminOnboardingAuditView' })
</script>
<template>
  <div class="page-container">
    <PageHeader title="入驻审核" subtitle="审核学校入驻申请" />
    <el-card shadow="hover" class="section-card">
      <el-table :data="[]" stripe style="width: 100%">
        <el-table-column prop="schoolName" label="学校名称" />
        <el-table-column prop="contactName" label="联系人" width="120" />
        <el-table-column prop="contactPhone" label="联系电话" width="150" />
        <el-table-column prop="planName" label="申请套餐" width="120" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }"><StatusTag :status="row.status" /></template>
        </el-table-column>
        <el-table-column prop="createdAt" label="申请时间" width="180" />
        <el-table-column label="操作" width="200" />
      </el-table>
    </el-card>
  </div>
</template>
<style scoped>
.page-container { display: flex; flex-direction: column; gap: var(--space-5); }
.section-card { border-radius: var(--radius-lg); }
</style>
