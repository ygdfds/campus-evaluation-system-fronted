<script setup>
import { ref } from 'vue'
import { Plus, InfoFilled } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'

defineOptions({ name: 'ClassManagementView' })

const searchText = ref('')

const placeholderClasses = [
  { code: '2024-CS-01', name: '计算机2401班', department: '计算机学院', major: '计算机科学与技术', grade: '2024级', students: 42, advisor: '张明' },
  { code: '2024-CS-02', name: '计算机2402班', department: '计算机学院', major: '计算机科学与技术', grade: '2024级', students: 40, advisor: '李华' },
  { code: '2023-MA-01', name: '数学2301班', department: '数学学院', major: '应用数学', grade: '2023级', students: 38, advisor: '王芳' },
  { code: '2023-ENG-01', name: '英语2301班', department: '外国语学院', major: '英语', grade: '2023级', students: 35, advisor: '陈静' },
  { code: '2022-PH-01', name: '物理2201班', department: '物理学院', major: '应用物理', grade: '2022级', students: 30, advisor: '刘强' },
]
</script>

<template>
  <div class="page-container">
    <PageHeader title="班级管理" description="管理学校各院系班级信息，包括班级编号、所属专业、年级、班主任等。" />

    <div class="content-card">
      <div class="card-header">
        <div class="filter-bar">
          <el-input v-model="searchText" placeholder="搜索班级名称 / 编号" clearable prefix-icon="Search" style="width: 280px" />
        </div>
        <el-button type="primary" disabled>
          <el-icon><Plus /></el-icon>新增班级
        </el-button>
      </div>

      <el-table :data="placeholderClasses" stripe class="data-table">
        <el-table-column prop="code" label="班级编号" width="140" />
        <el-table-column prop="name" label="班级名称" min-width="150" />
        <el-table-column prop="department" label="所属院系" width="130" />
        <el-table-column prop="major" label="专业" width="160" />
        <el-table-column prop="grade" label="年级" width="90" align="center" />
        <el-table-column prop="students" label="人数" width="80" align="center" />
        <el-table-column prop="advisor" label="班主任" width="90" align="center" />
        <el-table-column label="操作" width="120" align="center">
          <template #default>
            <el-button text type="primary" size="small" disabled>编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="placeholder-notice">
        <el-icon :size="18"><InfoFilled /></el-icon>
        <div>
          <p class="notice-title">模块说明</p>
          <p class="notice-desc">班级管理模块用于维护学校各院系教学班级的组织架构，包括班级编号、所属专业、年级、班主任、学生人数等基础信息。班级数据是评价任务按班级维度统计分析、选课数据关联的重要基础。当前为示例展示，待后端接口接入后即可完整使用。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container { max-width: 1200px; }
.content-card {
  margin-top: var(--space-4);
  padding: var(--space-5);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-xl);
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}
.filter-bar { display: flex; align-items: center; gap: var(--space-3); }
.data-table { width: 100%; }
.placeholder-notice {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-5);
  padding: var(--space-4);
  background: var(--color-primary-50);
  border: 1px solid var(--color-primary-100);
  border-radius: var(--radius-lg);
  color: var(--color-primary-700);
}
.placeholder-notice .el-icon { flex-shrink: 0; margin-top: 2px; color: var(--color-primary-500); }
.notice-title { margin: 0 0 4px; font-weight: var(--font-weight-semibold); font-size: var(--font-sm); }
.notice-desc { margin: 0; font-size: var(--font-xs); line-height: 1.6; color: var(--color-primary-600); }
</style>
