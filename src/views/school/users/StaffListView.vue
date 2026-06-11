<script setup>
import PageHeader from '@/components/common/PageHeader.vue'
defineOptions({ name: 'SchoolStaffListView' })
</script>
<template>
  <div class="page-container">
    <PageHeader title="教职工管理" subtitle="管理学校教职工信息">
      <template #extra><el-button type="primary">添加教职工</el-button></template>
    </PageHeader>
    <el-card shadow="hover" class="section-card">
      <el-table :data="[]" stripe style="width: 100%">
        <el-table-column prop="workNo" label="工号" width="120" />
        <el-table-column prop="realName" label="姓名" width="120" />
        <el-table-column prop="department" label="所属院系" />
        <el-table-column prop="title" label="职称" width="120" />
        <el-table-column prop="phone" label="联系方式" width="150" />
        <el-table-column label="操作" width="180" />
      </el-table>
    </el-card>
  </div>
</template>
<style scoped>
.page-container { display: flex; flex-direction: column; gap: var(--space-5); }
.section-card { border-radius: var(--radius-lg); }
</style>
