<script setup>
import PageHeader from '@/components/common/PageHeader.vue'
defineOptions({ name: 'SchoolStudentListView' })
</script>
<template>
  <div class="page-container">
    <PageHeader title="学生管理" subtitle="管理学校学生信息">
      <template #extra><el-button type="primary">导入学生</el-button></template>
    </PageHeader>
    <el-card shadow="hover" class="section-card">
      <el-table :data="[]" stripe style="width: 100%">
        <el-table-column prop="studentNo" label="学号" width="120" />
        <el-table-column prop="realName" label="姓名" width="120" />
        <el-table-column prop="department" label="所属院系" />
        <el-table-column prop="grade" label="年级" width="100" />
        <el-table-column prop="class" label="班级" width="100" />
        <el-table-column label="操作" width="180" />
      </el-table>
    </el-card>
  </div>
</template>
<style scoped>
.page-container { display: flex; flex-direction: column; gap: var(--space-5); }
.section-card { border-radius: var(--radius-lg); }
</style>
